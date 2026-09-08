import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndUpdateDailyStreak } from "@/lib/streak";

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
    const { sesiId, jawabanList = [] } = body;

    let activeSesiId = sesiId;

    const isValidUUID = (str: string) =>
      Boolean(str) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (!activeSesiId || !isValidUUID(activeSesiId)) {
      // Auto-create a valid session UUID in Supabase sesi table for demo/practice sessions
      const { data: newSesi } = await adminDb
        .from("sesi")
        .insert({
          siswa_id: user.id,
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
        // Auto-grade Multiple Choice
        const correctOption = soalData.opsi_soal?.find((o: any) => o.benar);
        const isBenar = correctOption?.id === opsiDipilihId;
        const nilai = isBenar ? 100 : 0;

        totalScoreSum += nilai;
        totalQuestionsGraded += 1;

        // Upsert Answer to database via adminDb
        await adminDb.from("jawaban").upsert({
          sesi_id: activeSesiId,
          soal_id: soalId,
          opsi_dipilih_id: opsiDipilihId || null,
          is_benar: isBenar,
          nilai: nilai,
          umpan_balik_ai: isBenar
            ? "Jawaban Pilihan Ganda Benar!"
            : `Jawaban kurang tepat. Jawaban benar: ${correctOption?.teks_opsi || ""}`,
        });

        evaluationResults.push({
          soalId,
          tipeSoal: "pilihan_ganda",
          nilai,
          isBenar,
          umpanBalik: isBenar ? "Benar" : "Salah",
        });
      } else if (soalData.tipe_soal === "esai") {
        // Auto-grade Essay using Google Gemini AI
        let nilai = 0;
        let isBenar = false;
        let umpanBalik = "Jawaban esai belum dinilai (Perlu ditinjau guru).";

        const trimmedJawaban = jawabanTeks?.trim() || "";

        if (!trimmedJawaban) {
          nilai = 0;
          isBenar = false;
          umpanBalik = "Jawaban esai kosong.";
        } else if (geminiApiKey) {
          const evalPrompt = `Kamu adalah Penilai/Evaluator Otomatis Esai Pembelajaran SMP Kelas 8 berprinsip Sokratik dan Pedagogis.
Tugasmu adalah memberikan evaluasi yang objektif, akurat, mendalam, dan konstruktif untuk memacu daya nalar siswa.

SOAL ESAI:
${soalData.pertanyaan}

KUNCI JAWABAN / RUBRIK:
${soalData.kunci_jawaban || "Jelaskan konsep dengan rinci dan logis."}

JAWABAN SISWA:
${trimmedJawaban}

PEDOMAN UMPAN BALIK SOKRATIK (umpanBalik):
1. Apresiasi logika dan konsep yang sudah berhasil dijelaskan siswa dengan baik.
2. Jika ada bagian yang kurang lengkap atau keliru, jangan hanya memvonis salah, melainkan berikan petunjuk/pertanyaan reflektif yang merangsang siswa untuk memikirkan bagian yang belum lengkap tersebut.
3. Gunakan bahasa yang memotivasi dan ramah khas guru pembimbing.

WAJIB MENGEMBALIKAN FORMAT JSON SAJA (TANPA TEKS LAIN):
{
  "nilai": <angka bulat 0 hingga 100>,
  "kemiripanKonsep": "<misal: 85%>",
  "umpanBalik": "<umpan balik sokratik dan konstruktif dalam Bahasa Indonesia>",
  "isBenar": <true jika nilai >= 70 else false>
}`;

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

            if (!apiResponse.ok) {
              const errorText = await apiResponse.text();
              throw new Error(`Gemini API Error: ${errorText}`);
            }

            const responseData = await apiResponse.json();
            const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

            const cleanedJsonText = rawText
              .replace(/```json/g, "")
              .replace(/```/g, "")
              .trim();

            const parsed = JSON.parse(cleanedJsonText);
            nilai = typeof parsed.nilai === "number" ? parsed.nilai : 0;
            isBenar = typeof parsed.isBenar === "boolean" ? parsed.isBenar : nilai >= 70;
            umpanBalik = parsed.umpanBalik || "Evaluasi esai selesai.";

            // Log AI Token usage
            const inputTokens = responseData.usageMetadata?.promptTokenCount || 0;
            const outputTokens = responseData.usageMetadata?.candidatesTokenCount || 0;
            await adminDb.from("log_ai").insert({
              sekolah_id: sekolahId || null,
              pengguna_id: user.id,
              fitur: "grading_esai",
              prompt_tokens: inputTokens,
              completion_tokens: outputTokens,
              total_tokens: inputTokens + outputTokens,
              biaya_usd: (inputTokens * 0.075 + outputTokens * 0.3) / 1000000,
            });
          } catch (e) {
            console.error("Error calling Gemini for essay grading:", e);
            nilai = 0;
            isBenar = false;
            umpanBalik = "Penilaian AI gagal diproses (Perlu ditinjau guru).";
          }
        }

        totalScoreSum += nilai;
        totalQuestionsGraded += 1;

        // Upsert Answer to database via adminDb
        await adminDb.from("jawaban").upsert({
          sesi_id: activeSesiId,
          soal_id: soalId,
          jawaban_teks: jawabanTeks || "",
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

    // Calculate final overall score & bonus learning points
    const finalScore =
      totalQuestionsGraded > 0
        ? Math.round(totalScoreSum / totalQuestionsGraded)
        : 0;

    // Bonus Poin Belajar: 1 Kuis Selesai = 15 Poin Belajar
    const earnedPoints = 15;

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
        judul: "Kuis Pembelajaran Selesai!",
        pesan: `Selamat! Anda berhasil menyelesaikan kuis dengan nilai ${finalScore}/100 dan mendapatkan +${earnedPoints} Poin Belajar.`,
        tipe: "info",
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
