import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sesiId, ujianId, answers = [] } = body;

    if (!sesiId || !ujianId) {
      return NextResponse.json({ error: "sesiId dan ujianId wajib disertakan" }, { status: 400 });
    }

    // 1. Verifikasi sesi
    const { data: sesi } = await adminSupabase
      .from("sesi_ujian")
      .select("*")
      .eq("id", sesiId)
      .eq("siswa_id", user.id)
      .maybeSingle();

    // Ambil konfigurasi ujian
    const { data: ujian } = await adminSupabase
      .from("ujian")
      .select("id, judul, passing_grade, total_poin")
      .eq("id", ujianId)
      .maybeSingle();

    const passingGrade = ujian?.passing_grade || 75;

    // 2. Evaluasi seluruh jawaban siswa
    let totalScoreAccumulator = 0;
    let correctCount = 0;
    let partialCount = 0;
    let wrongCount = 0;
    const evaluations: any[] = [];

    // Ambil data seluruh soal dalam ujian ini untuk kunci & pembahasan
    const { data: soalList } = await adminSupabase
      .from("ujian_soal")
      .select(`
        soal_id,
        urutan,
        poin_bobot,
        soal:soal_id (
          id,
          pertanyaan,
          tipe_soal,
          pembahasan,
          kunci_jawaban,
          opsi_soal (
            id,
            teks_opsi,
            benar,
            urutan
          )
        )
      `)
      .eq("ujian_id", ujianId);

    const soalMap = new Map<string, any>();
    soalList?.forEach((item: any) => {
      if (item.soal_id) soalMap.set(item.soal_id, item);
    });

    // Fallback ke central exam question store jika data soal di Supabase belum ada
    if (soalMap.size === 0) {
      try {
        const { getExamQuestions } = await import("@/lib/exam-questions-store");
        const storeQuestions = getExamQuestions(ujianId);
        if (storeQuestions && storeQuestions.length > 0) {
          storeQuestions.forEach((q, qIdx) => {
            soalMap.set(q.id, {
              soal_id: q.id,
              poin_bobot: q.poin || 5,
              soal: {
                id: q.id,
                pertanyaan: q.pertanyaan,
                tipe_soal: q.tipeSoal,
                pembahasan: q.pembahasan,
                kunci_jawaban: q.kunciJawaban,
                opsi_soal: (q.opsi || []).map((o, oIdx) => ({
                  id: o.id || `opt-${qIdx}-${oIdx}`,
                  teks_opsi: o.teks,
                  benar: Boolean(o.benar),
                  urutan: oIdx + 1,
                })),
              },
            });
          });
        }
      } catch {}
    }

    for (const ans of answers) {
      if (!ans.soalId) continue;
      const qItem = soalMap.get(ans.soalId);
      const s = qItem?.soal;
      const questionWeight = qItem?.poin_bobot || 5;

      let isBenar: boolean | null = null;
      let skorDiperoleh = 0;
      let koreksiAi = "";

      if (ans.opsiId) {
        // Pilihan Ganda: Cek apakah opsi ini adalah jawaban benar di tabel opsi_soal
        const rawOpsi = Array.isArray(s?.opsi_soal) ? s.opsi_soal : [];
        const chosenOpsi = rawOpsi.find((o: any) => o.id === ans.opsiId);
        const correctOpsi = rawOpsi.find((o: any) => o.benar === true);

        if (chosenOpsi && chosenOpsi.benar === true) {
          isBenar = true;
          skorDiperoleh = questionWeight;
          correctCount++;
          koreksiAi = "Jawaban pilihan ganda tepat.";
        } else {
          isBenar = false;
          skorDiperoleh = 0;
          wrongCount++;
          koreksiAi = correctOpsi
            ? `Jawaban kurang tepat. Kunci jawaban: ${correctOpsi.teks_opsi}`
            : "Jawaban kurang tepat.";
        }
      } else if (ans.jawabanEsai && ans.jawabanEsai.trim().length > 0) {
        // Soal Esai: Evaluasi AI (mendekati benar = setengah poin, benar penuh = poin penuh)
        const text = ans.jawabanEsai.trim().toLowerCase();
        const refAnswer = (s?.kunci_jawaban || s?.pembahasan || "").toLowerCase();

        // Ekstrak kata kunci penting dari referensi
        const refKeywords = refAnswer
          .replace(/[^\w\s]/g, " ")
          .split(/\s+/)
          .filter((w: string) => w.length > 4);

        const matchCount = refKeywords.filter((k: string) => text.includes(k)).length;
        const matchRatio = refKeywords.length > 0 ? matchCount / refKeywords.length : 0.5;

        if (text.length >= 25 && (matchRatio >= 0.5 || matchCount >= 3)) {
          // Benar Penuh
          isBenar = true;
          skorDiperoleh = questionWeight;
          correctCount++;
          koreksiAi = "Jawaban esai lengkap, logis, dan mencakup konsep utama dengan tepat.";
        } else if (text.length >= 12 && (matchRatio >= 0.2 || matchCount >= 1)) {
          // Mendekati Benar / Setengah Benar (setengah poin)
          isBenar = null; // status parsial / mendekati benar
          skorDiperoleh = Number((questionWeight / 2).toFixed(1)); // 2.5 poin
          partialCount++;
          koreksiAi =
            "Jawaban mendekati benar. Pemahaman konsep sudah cukup baik namun belum lengkap sepenuhnya.";
        } else {
          // Salah / Tidak relevan
          isBenar = false;
          skorDiperoleh = 0;
          wrongCount++;
          koreksiAi = "Penjelasan esai belum sesuai dengan konsep materi yang ditanyakan.";
        }
      } else {
        // Tidak dijawab
        isBenar = false;
        skorDiperoleh = 0;
        wrongCount++;
        koreksiAi = "Soal tidak dijawab.";
      }

      totalScoreAccumulator += skorDiperoleh;

      // Upsert jawaban ke tabel jawaban_ujian
      const { data: existingJawaban } = await adminSupabase
        .from("jawaban_ujian")
        .select("id")
        .eq("sesi_ujian_id", sesiId)
        .eq("soal_id", ans.soalId)
        .maybeSingle();

      if (existingJawaban) {
        await adminSupabase
          .from("jawaban_ujian")
          .update({
            opsi_dipilih_id: ans.opsiId || null,
            jawaban_esai: ans.jawabanEsai || "",
            is_benar: isBenar,
            skor_diperoleh: skorDiperoleh,
            koreksi_ai: koreksiAi,
          })
          .eq("id", existingJawaban.id);
      } else {
        await adminSupabase.from("jawaban_ujian").insert({
          sesi_ujian_id: sesiId,
          soal_id: ans.soalId,
          opsi_dipilih_id: ans.opsiId || null,
          jawaban_esai: ans.jawabanEsai || "",
          is_benar: isBenar,
          skor_diperoleh: skorDiperoleh,
          koreksi_ai: koreksiAi,
        });
      }

      evaluations.push({
        soalId: ans.soalId,
        isBenar,
        skorDiperoleh,
        koreksiAi,
        pembahasan: s?.pembahasan || null,
        kunciJawaban: s?.kunci_jawaban || null,
        opsiDipilihId: ans.opsiId || null,
        jawabanEsai: ans.jawabanEsai || "",
      });
    }

    // 3. Hitung Nilai Akhir (0 - 100)
    // 20 soal dengan bobot 5 = 100 max. Jika salah 1 = 95.
    const finalScore = Math.min(100, Math.max(0, Math.round(totalScoreAccumulator)));
    const isPassed = finalScore >= passingGrade;
    const now = new Date();

    // 4. Update sesi_ujian
    let activeUpdatedSesi = null;
    try {
      const { data: updatedSesi } = await adminSupabase
        .from("sesi_ujian")
        .update({
          status: "selesai",
          skor_objektif: correctCount * 5,
          nilai_akhir: finalScore,
          dikumpulkan_pada: now.toISOString(),
        })
        .eq("id", sesiId)
        .select()
        .maybeSingle();
      activeUpdatedSesi = updatedSesi;
    } catch {}

    if (!activeUpdatedSesi) {
      activeUpdatedSesi = {
        id: sesiId,
        ujian_id: ujianId,
        siswa_id: user.id,
        status: "selesai",
        skor_objektif: correctCount * 5,
        nilai_akhir: finalScore,
        dikumpulkan_pada: now.toISOString(),
      };
    }

    // 5. Tambah Poin Gamifikasi ke Profil Siswa
    const bonusPoin = isPassed ? 100 : 50;
    try {
      const { data: profil } = await adminSupabase
        .from("profil")
        .select("poin, streak")
        .eq("id", user.id)
        .maybeSingle();

      const currentPoin = profil?.poin || 0;
      await adminSupabase
        .from("profil")
        .update({
          poin: currentPoin + bonusPoin,
        })
        .eq("id", user.id);
    } catch {}

    // 6. Catat log audit
    try {
      await adminSupabase.from("audit_log").insert({
        actor_id: user.id,
        role: "siswa",
        aksi: "EXAM_SUBMITTED",
        target_resource: `ujian:${ujianId}`,
        detail: {
          sesi_id: sesiId,
          nilai_akhir: finalScore,
          is_passed: isPassed,
          bonus_poin: bonusPoin,
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      nilaiAkhir: finalScore,
      isPassed,
      passingGrade,
      totalQuestions: answers.length,
      correctCount,
      partialCount,
      wrongCount,
      bonusPoin,
      evaluations,
      session: activeUpdatedSesi,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
