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
    const { data: sesi, error: sesiErr } = await adminSupabase
      .from("sesi_ujian")
      .select("*")
      .eq("id", sesiId)
      .eq("siswa_id", user.id)
      .single();

    if (sesiErr || !sesi) {
      return NextResponse.json({ error: "Sesi ujian tidak ditemukan" }, { status: 404 });
    }

    // Ambil konfigurasi ujian
    const { data: ujian } = await adminSupabase
      .from("ujian")
      .select("id, judul, passing_grade, total_poin")
      .eq("id", ujianId)
      .single();

    const passingGrade = ujian?.passing_grade || 75;

    // 2. Ambil seluruh opsi yang benar untuk soal-soal dalam ujian ini
    // answers: Array<{ soalId: string, opsiId?: string, jawabanEsai?: string }>
    let totalObjectiveQuestions = 0;
    let correctObjectiveCount = 0;

    for (const ans of answers) {
      if (!ans.soalId) continue;

      let isBenar: boolean | null = null;
      let skorDiperoleh = 0;

      if (ans.opsiId) {
        totalObjectiveQuestions++;
        // Cek apakah opsi ini adalah jawaban benar di tabel opsi_soal
        const { data: opsiData } = await adminSupabase
          .from("opsi_soal")
          .select("id, benar")
          .eq("id", ans.opsiId)
          .maybeSingle();

        if (opsiData && opsiData.benar === true) {
          isBenar = true;
          correctObjectiveCount++;
          skorDiperoleh = 10;
        } else {
          isBenar = false;
          skorDiperoleh = 0;
        }
      }

      // Upsert jawaban
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
        });
      }
    }

    // 3. Hitung Nilai Akhir (0 - 100)
    const finalScore =
      totalObjectiveQuestions > 0
        ? Math.round((correctObjectiveCount / totalObjectiveQuestions) * 100)
        : 100;

    const isPassed = finalScore >= passingGrade;
    const now = new Date();

    // 4. Update sesi_ujian
    const { data: updatedSesi, error: updateErr } = await adminSupabase
      .from("sesi_ujian")
      .update({
        status: "selesai",
        skor_objektif: correctObjectiveCount * 10,
        nilai_akhir: finalScore,
        dikumpulkan_pada: now.toISOString(),
      })
      .eq("id", sesiId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 5. Tambah Poin Gamifikasi ke Profil Siswa
    const bonusPoin = isPassed ? 100 : 50;
    const { data: profil } = await adminSupabase
      .from("profil")
      .select("poin, streak")
      .eq("id", user.id)
      .single();

    const currentPoin = profil?.poin || 0;
    await adminSupabase
      .from("profil")
      .update({
        poin: currentPoin + bonusPoin,
      })
      .eq("id", user.id);

    // 6. Catat log audit
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

    return NextResponse.json({
      success: true,
      nilaiAkhir: finalScore,
      isPassed,
      passingGrade,
      totalQuestions: answers.length,
      correctCount: correctObjectiveCount,
      bonusPoin,
      session: updatedSesi,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
