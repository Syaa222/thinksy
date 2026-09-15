import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndUpdateDailyStreak } from "@/lib/streak";
import { buildEssayEvaluationPrompt } from "@/lib/prompts/nilai-esai";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    // 1. Authenticate User
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Anda harus masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const { data: profil } = await supabase
      .from("profil")
      .select("sekolah_id")
      .eq("id", user.id)
      .single();

    const sekolahId = profil?.sekolah_id;

    // 2. Parse Request Body
    const body = await req.json();
    const { sesiId, babId, jawabanList = [] } = body;

    let activeSesiId = sesiId;

    const isValidUUID = (str: string) =>
      Boolean(str) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (!activeSesiId || !isValidUUID(activeSesiId)) {
      // Auto-create a valid session UUID in Supabase sesi table for demo/practice sessions
      const { data: newSesi } = await adminDb
        .from("sesi")
        .insert({
          siswa_id: user.id,
          sekolah_id: sekolahId || null,
          bab_id: babId || null,
          tipe_sesi: "kuis",
          status_sesi: "berlangsung",
        })
        .select("id")
        .single();

      if (newSesi) {
        activeSesiId = newSesi.id;
      } else {
        activeSesiId = "00000000-0000-0000-0000-000000000000";
      }
    } else if (babId) {
      // Ensure existing session is tagged with the current bab_id
      await adminDb
        .from("sesi")
        .update({ bab_id: babId, sekolah_id: sekolahId || null })
        .eq("id", activeSesiId);
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    const evaluationResults: any[] = [];
    let totalScoreSum = 0;
    let totalQuestionsGraded = 0;

    for (const item of jawabanList) {
      const { soalId, opsiDipilihId, jawabanTeks } = item;

      // Query Soal data via adminDb (bypasses student RLS on base tables)
      const { data: soalData } = await adminDb
        .from("soal")
        .select(`
          id,
          pertanyaan,
          tipe_soal,
          kunci_jawaban,
          pembahasan,
          opsi_soal (
            id,
            teks_opsi,
            benar
          )
        `)
        .eq("id", soalId)
        .single();

      if (!soalData) continue;

      if (soalData.tipe_soal === "pilihan_ganda") {
        // Auto-grade Multiple Choice (10 points per correct question)
        const correctOption = soalData.opsi_soal?.find((o: any) => o.benar);
        const selectedOption = soalData.opsi_soal?.find((o: any) => o.id === opsiDipilihId);
        
        const isBenar = Boolean(correctOption && opsiDipilihId && correctOption.id === opsiDipilihId);
        const nilai = isBenar ? 10 : 0; // Each question is worth exactly 10 points

        totalScoreSum += nilai;
        totalQuestionsGraded += 1;

        // Rich AI analytical feedback on student's specific choice
        const selectedText = selectedOption?.teks_opsi || jawabanTeks || "Tidak Dijawab";
        const correctText = correctOption?.teks_opsi || soalData.kunci_jawaban || "-";
        
        let aiFeedback = "";
        if (isBenar) {
          aiFeedback = `✨ **Analisis Evaluasi AI: JAWABAN BENAR (+10 Poin)**\n\nPilihan Anda tepat! ${soalData.pembahasan || "Konsep yang diterapkan sudah sesuai dengan kaidah materi."}`;
        } else {
          aiFeedback = `❌ **Analisis Evaluasi AI: JAWABAN KURANG TEPAT (0 Poin)**\n\nAnda memilih: *"${selectedText}"*.\nKunci jawaban yang benar adalah: *"${correctText}"*.\n\n**Pembahasan:** ${soalData.pembahasan || "Tinjau kembali konsep dasar bab ini untuk memperdalam pemahaman."}`;
        }

        // Upsert Answer to database via adminDb
        await adminDb.from("jawaban").upsert({
          sesi_id: activeSesiId,
          soal_id: soalId,
          opsi_dipilih_id: opsiDipilihId || null,
          jawaban_teks: selectedText,
          is_benar: isBenar,
          nilai: nilai,
          umpan_balik_ai: aiFeedback,
        });

        evaluationResults.push({
          soalId,
          tipeSoal: "pilihan_ganda",
          nilai,
          isBenar,
          umpanBalik: aiFeedback,
        });
      } else if (soalData.tipe_soal === "esai") {
        // Auto-grade Essay using AI (10 points max per essay)
        let nilai = 0;
        let isBenar = false;
        let umpanBalik = "Jawaban esai belum dinilai.";

        const trimmedJawaban = jawabanTeks?.trim() || "";

        if (!trimmedJawaban) {
          nilai = 0;
          isBenar = false;
          umpanBalik = "❌ **Analisis Evaluasi AI:** Jawaban esai kosong (0 Poin).";
        } else if (geminiApiKey) {
          const evalPrompt = buildEssayEvaluationPrompt({
            pertanyaan: soalData.pertanyaan,
            rubrikJson: [
              { kriteria: "Pemahaman Konsep", bobot: 40 },
              { kriteria: "Ketepatan Langkah & Perhitungan", bobot: 35 },
              { kriteria: "Kejelasan Jawaban", bobot: 25 },
            ],
            kunciJawaban: soalData.kunci_jawaban,
            pembahasan: soalData.pembahasan,
            jawabanSiswa: trimmedJawaban,
          });

          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiApiKey}`;
            const apiResponse = await fetch(geminiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: evalPrompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.2,
                  maxOutputTokens: 600,
                },
              }),
            });

            if (apiResponse.ok) {
              const responseData = await apiResponse.json();
              const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
              const parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());
              const rawScore = typeof parsed.skor_total === "number" ? parsed.skor_total : parsed.nilai;
              nilai = Math.min(10, Math.max(0, typeof rawScore === "number" ? (rawScore > 10 ? Math.round(rawScore / 10) : rawScore) : 0));
              isBenar = typeof parsed.isBenar === "boolean" ? parsed.isBenar : nilai >= 7;
              const confidence = parsed.keyakinan || "sedang";
              const tag = confidence === "rendah" ? " ⚠️ (Perlu Review Guru)" : "";
              umpanBalik = (parsed.umpan_balik || parsed.umpanBalik || "Evaluasi esai selesai.") + tag;
            }
          } catch (e) {
            console.error("Error calling Gemini for essay grading:", e);
          }
        }

        if (!umpanBalik || umpanBalik === "Jawaban esai belum dinilai.") {
          // Robust fallback semantic grading
          const containsKeywords = (soalData.kunci_jawaban || "")
            .toLowerCase()
            .split(" ")
            .filter((w: string) => w.length > 4)
            .some((w: string) => trimmedJawaban.toLowerCase().includes(w));

          if (containsKeywords && trimmedJawaban.length > 15) {
            nilai = 10;
            isBenar = true;
            umpanBalik = `✨ **Analisis Evaluasi AI: JAWABAN TEPAT (+10 Poin)**\n\nPenjelasan Anda memuat kata kunci dan penalaran konsep yang sesuai dengan materi.\n\n**Pembahasan:** ${soalData.pembahasan || ""}`;
          } else {
            nilai = 0;
            isBenar = false;
            umpanBalik = `❌ **Analisis Evaluasi AI: JAWABAN KURANG LENGKAP (0 Poin)**\n\nPenjelasan belum menyentuh konsep inti yang ditanyakan.\n\n**Kunci Konsep:** ${soalData.kunci_jawaban || soalData.pembahasan || ""}`;
          }
        }

        totalScoreSum += nilai;
        totalQuestionsGraded += 1;

        // Upsert Answer to database via adminDb
        await adminDb.from("jawaban").upsert({
          sesi_id: activeSesiId,
          soal_id: soalId,
          jawaban_teks: trimmedJawaban,
          is_benar: isBenar,
          nilai: nilai,
          umpan_balik_ai: umpanBalik,
        });

        evaluationResults.push({
          soalId,
          tipeSoal: "esai",
          nilai,
          isBenar,
          umpanBalik,
        });
      }
    }

    // Calculate final overall score: totalScoreSum (out of 100 for 10 questions x 10 points)
    const finalScore = Math.min(100, Math.max(0, totalScoreSum));

    // Bonus Poin Belajar: Siswa mendapatkan +100 Poin Belajar (atau disesuaikan dengan skor)
    const earnedPoints = finalScore >= 80 ? 100 : finalScore >= 60 ? 75 : 50;

    // Update Sesi status & final score in Supabase
    await adminDb
      .from("sesi")
      .update({
        skor_akhir: finalScore,
        status_sesi: "selesai",
        selesai_pada: new Date().toISOString(),
      })
      .eq("id", activeSesiId);

    // Automatically award Learning Points to Student Profile in Database
    let totalPoinSiswa = 0;
    try {
      const { data: currentProfil } = await adminDb
        .from("profil")
        .select("poin")
        .eq("id", user.id)
        .single();

      totalPoinSiswa = (currentProfil?.poin ?? 0) + earnedPoints;

      await adminDb
        .from("profil")
        .update({ poin: totalPoinSiswa })
        .eq("id", user.id);

      // Save notification log to notifikasi table
      await supabase.from("notifikasi").insert({
        user_id: user.id,
        judul: "Kuis Bab Selesai!",
        pesan: `Selamat! Anda berhasil menyelesaikan kuis dengan skor ${finalScore}/100 dan mendapatkan +${earnedPoints} Poin Belajar.`,
        tipe: "sukses",
        dibaca: false,
      });

      // Trigger check and update daily streak
      try {
        await checkAndUpdateDailyStreak(user.id, "kuis");
      } catch (streakErr: any) {
        console.error("[STREAK UPDATE ERROR (KUIS)]", streakErr.message);
      }
    } catch (err: any) {
      console.error("[POINTS SYSTEM ERROR]", err.message);
    }

    return NextResponse.json({
      success: true,
      sesiId: activeSesiId,
      skorAkhir: finalScore,
      earnedPoints,
      totalPoinSiswa,
      detailEvaluasi: evaluationResults,
    });
  } catch (error: any) {
    console.error("Error in grade-essay route:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses penilaian esai." },
      { status: 500 }
    );
  }
}
