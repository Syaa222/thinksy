import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeSingleEssayWithAi } from "@/app/api/nilai-esai/route";
import { autoClaimMisi } from "@/app/api/siswa/misi/route";
import { checkAndUpdateDailyStreak } from "@/lib/streak";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { sesiId, autoSubmitted = false } = body;

    if (!sesiId) {
      return NextResponse.json(
        { error: "ID Sesi wajib disertakan." },
        { status: 400 }
      );
    }

    // 1. Ambil data sesi
    const { data: sesiRow, error: sesiErr } = await adminDb
      .from("sesi")
      .select("id, siswa_id, bab_id, status_sesi, tipe_sesi")
      .eq("id", sesiId)
      .maybeSingle();

    if (sesiErr || !sesiRow) {
      return NextResponse.json(
        { error: "Sesi tidak ditemukan." },
        { status: 404 }
      );
    }

    // 2. Query semua jawaban pada sesi ini yang terhubung dengan detail soal
    const { data: jawabanList } = await adminDb
      .from("jawaban")
      .select(`
        id,
        soal_id,
        opsi_dipilih_id,
        jawaban_teks,
        is_benar,
        nilai,
        soal (
          id,
          pertanyaan,
          tipe_soal,
          kunci_jawaban,
          pembahasan,
          rubrik,
          poin,
          opsi_soal (
            id,
            teks_opsi,
            benar,
            alasan_salah
          )
        )
      `)
      .eq("sesi_id", sesiId);

    let totalScoreSum = 0;
    let totalQuestions = jawabanList?.length || 0;
    let benarCount = 0;

    // 3. Evaluasi jawaban yang belum dinilai (terutama esai melalui AI rubrik)
    if (jawabanList && jawabanList.length > 0) {
      for (const j of jawabanList) {
        const soal: any = Array.isArray(j.soal) ? j.soal[0] : j.soal;
        if (!soal) continue;

        let currentNilai = typeof j.nilai === "number" ? j.nilai : 0;
        let isCorrect = Boolean(j.is_benar);

        if (soal.tipe_soal === "pilihan_ganda") {
          const matchingOpt = soal.opsi_soal?.find((o: any) => o.id === j.opsi_dipilih_id);
          isCorrect = Boolean(matchingOpt?.benar);
          currentNilai = isCorrect ? (soal.poin || 10) : 0;

          await adminDb
            .from("jawaban")
            .update({
              is_benar: isCorrect,
              nilai: currentNilai,
              status_penilaian: "selesai",
            })
            .eq("id", j.id);

          if (isCorrect) benarCount += 1;
        } else if (soal.tipe_soal === "isian_singkat") {
          const studentInput = (j.jawaban_teks || "").trim().toLowerCase().replace(/\s+/g, " ");
          const officialKey = (soal.kunci_jawaban || "").trim().toLowerCase().replace(/\s+/g, " ");
          const keyOptions = officialKey.split(/[,/|]/).map((k: string) => k.trim());
          isCorrect = keyOptions.includes(studentInput);
          currentNilai = isCorrect ? (soal.poin || 10) : 0;

          await adminDb
            .from("jawaban")
            .update({
              is_benar: isCorrect,
              nilai: currentNilai,
              status_penilaian: "selesai",
            })
            .eq("id", j.id);

          if (isCorrect) benarCount += 1;
        } else if (soal.tipe_soal === "esai") {
          // Evaluasi esai AI berbasis rubrik jika belum dinilai
          if (j.nilai === null || j.nilai === undefined || j.nilai === 0) {
            const { result } = await gradeSingleEssayWithAi(
              soal.pertanyaan,
              soal.rubrik,
              j.jawaban_teks || "",
              soal.kunci_jawaban,
              soal.pembahasan
            );

            currentNilai = result.skor_total;
            isCorrect = currentNilai >= 70;

            await adminDb
              .from("jawaban")
              .update({
                nilai: currentNilai,
                umpan_balik_ai: result.umpan_balik,
                keyakinan_ai: result.keyakinan,
                status_penilaian: "sementara_menunggu_guru",
                is_benar: isCorrect,
              })
              .eq("id", j.id);

            if (isCorrect) benarCount += 1;
          } else {
            if (currentNilai >= 70) benarCount += 1;
          }
        }

        totalScoreSum += currentNilai;
      }
    }

    // 4. Hitung skor akhir persentase (0-100)
    const finalScore =
      totalQuestions > 0
        ? Math.min(100, Math.round((totalScoreSum / (totalQuestions * 10)) * 100))
        : 100;

    // 5. Update sesi menjadi selesai
    await adminDb
      .from("sesi")
      .update({
        status_sesi: "selesai",
        skor_akhir: finalScore,
        selesai_pada: new Date().toISOString(),
      })
      .eq("id", sesiId);

    // 6. Bonus gamifikasi (XP/Misi) jika profil siswa aktif
    try {
      await autoClaimMisi(supabase, user.id, "kuis");
      await checkAndUpdateDailyStreak(user.id, "kuis");
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      sesiId,
      skorAkhir: finalScore,
      totalSoal: totalQuestions,
      benarCount,
      redirectUrl: `/hasil/${sesiId}`,
      message: autoSubmitted
        ? "Waktu pengerjaan habis. Sesi kuis telah dikunci dan dinilai otomatis!"
        : "Sesi berhasil diselesaikan dan dihitung!",
    });
  } catch (err: any) {
    console.error("[API SESI SELESAI EXCEPTION]", err);
    return NextResponse.json(
      { error: err.message || "Gagal memproses penyelesaian sesi." },
      { status: 500 }
    );
  }
}
