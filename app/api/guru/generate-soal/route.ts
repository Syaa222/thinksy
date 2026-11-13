import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeMathContent } from "@/lib/math-sanitizer";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
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
      .select("sekolah_id, peran")
      .eq("id", user.id)
      .single();

    if (!profil || profil.peran !== "guru") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Guru yang dapat membuat soal dan materi." },
        { status: 403 }
      );
    }

    // 2. Parse Request Body
    const body = await req.json();
    const {
      babId,
      topik = "Pola Bilangan Aritmatika",
      tingkatSoal = "sedang",
      tipeSoal = "pilihan_ganda",
      mapel = "Matematika",
      jumlah = 1,
      fileBase64,
      fileMimeType,
      mode = "auto", // "soal" | "materi" | "paket_15" | "auto"
      instruksiTambahan = "",
      catatanTambahan = "",
    } = body;

    const userInstruction = (instruksiTambahan || catatanTambahan || "").trim();
    const is15Pack = tipeSoal === "paket_15" || mode === "paket_15" || jumlah === 15;
    const cleanJumlah = is15Pack ? 15 : Math.min(Math.max(Number(jumlah) || 1, 1), 5);

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Kunci API Gemini belum dikonfigurasi di server." },
        { status: 500 }
      );
    }

    const isMateriRequested =
      mode === "materi" ||
      /materi|modul|rpp|penjelasan|rangkuman|pembelajaran/i.test(topik);

    let promptText = "";

    if (isMateriRequested) {
      promptText = `Kamu adalah Pakar Kurikulum Matematika dan Asisten Guru profesional SMP.
Tugasmu adalah menyusun Paket **Materi Pembelajaran Lengkap & Modul Pelajaran** sekaligus 1 Paket Latihan Soal berdasarkan topik/berkas terlampir.

SPESIFIKASI MODUL & MATERI:
- Topik Pelajaran: ${topik}
- Sasaran: SMP Kelas 8
- Format Notasi: WAJIB menggunakan KaTeX ($...$ untuk inline, $$...$$ untuk blok).

MENGEMBALIKAN DALAM FORMAT JSON BERIKUT (TANPA MARKDOWN CODE BLOCK BLOCK KECUALI JSON):
{
  "materiLengkap": "# MATERI PEMBELAJARAN: <Judul Topik>\\n\\n## 🎯 Tujuan Pembelajaran\\n- <Tujuan 1>\\n- <Tujuan 2>\\n\\n## 📖 Penjelasan Konsep & Rumus Kunci\\n<Penjelasan mendalam beserta ekspresi KaTeX>\\n\\n## 💡 Contoh Soal & Pembahasan Langkah demi Langkah\\n<Contoh soal kontekstual dan langkah pengerjaan rinci>",
  "pertanyaan": "<soal latihan mandiri siswa berdasarkan materi>",
  "kunciJawaban": "<kunci jawaban latihan>",
  "pembahasan": "<penjelasan lengkap solusi latihan>",
  "opsiSoal": [
    { "teksOpsi": "<pilihan A>", "benar": false, "alasanSalah": "<miskonsepsi opsi A>" },
    { "teksOpsi": "<pilihan B>", "benar": true, "alasanSalah": "" },
    { "teksOpsi": "<pilihan C>", "benar": false, "alasanSalah": "<miskonsepsi opsi C>" },
    { "teksOpsi": "<pilihan D>", "benar": false, "alasanSalah": "<miskonsepsi opsi D>" }
  ]
}`;
    } else if (tipeSoal === "paket_15" || mode === "paket_15" || jumlah === 15) {
      promptText = `Kamu adalah Pakar Kurikulum dan Pembuat Soal ${mapel} profesional SMP Kelas 8.
Tugasmu adalah menyusun TEPAT 15 BUTIR SOAL LATIHAN / ASESMEN PER-BAB berdasarkan topik: "${topik}".
KOMPOSISI WAJIB TEPAT:
- 10 Soal Pilihan Ganda (Nomor 1 s/d 10, masing-masing memiliki 4 opsi A-D, tepat 1 opsi benar=true, dan 3 opsi salah dengan penjelasan alasanSalah/miskonsepsi)
- 3 Soal Jawaban Singkat (Nomor 11 s/d 13, dengan kunci jawaban kata/angka yang presisi)
- 2 Soal Jawaban Panjang / Esai (Nomor 14 s/d 15, dengan rubrik uraian lengkap)

ATURAN FORMULA: Gunakan KaTeX ($...$ untuk inline, $$...$$ untuk blok).

MENGEMBALIKAN HANYA JSON:
{
  "daftarSoal": [
    {
      "nomor": 1,
      "tipeSoal": "pilihan_ganda",
      "pertanyaan": "<pertanyaan>",
      "kunciJawaban": "<kunci>",
      "pembahasan": "<penjelasan>",
      "opsiSoal": [
        { "teksOpsi": "<A>", "benar": true, "alasanSalah": "" },
        { "teksOpsi": "<B>", "benar": false, "alasanSalah": "<alasan miskonsepsi mengapa opsi B salah>" },
        { "teksOpsi": "<C>", "benar": false, "alasanSalah": "<alasan miskonsepsi mengapa opsi C salah>" },
        { "teksOpsi": "<D>", "benar": false, "alasanSalah": "<alasan miskonsepsi mengapa opsi D salah>" }
      ]
    }
  ]
}`;
    } else {
      promptText = `Kamu adalah Pakar Kurikulum dan Pembuat Soal ${mapel} profesional untuk SMP Kelas 8.
Tugasmu adalah menghasilkan TEPAT ${cleanJumlah} BUTIR SOAL berkualitas tinggi sesuai standar Kurikulum Merdeka.

SPESIFIKASI SOAL:
- Materi / Bab Kurikulum: ${topik}
- Mata Pelajaran: ${mapel}
- Tingkat Kesulitan: ${tingkatSoal} (mudah / sedang / sulit)
- Jenis Soal yang Diminta: ${tipeSoal === "campuran" ? "Campuran proporsional antara Pilihan Ganda, Isian Singkat, dan Esai" : tipeSoal}
${userInstruction ? `- Instruksi & Catatan Tambahan Khusus Guru: "${userInstruction}"` : ""}

ATURAN FORMULA MATEMATIKA:
WAJIB gunakan notasi KaTeX ($...$ untuk formula sebaris/inline, $$...$$ untuk formula blok terpisah).

WAJIB MENGEMBALIKAN HANYA FORMAT JSON BERIKUT (TANPA MARKDOWN DI LUAR JSON):
{
  "daftarSoal": [
    {
      "nomor": 1,
      "tipeSoal": "${tipeSoal === "campuran" ? "pilihan_ganda" : tipeSoal}",
      "pertanyaan": "<teks pertanyaan lengkap beserta ekspresi KaTeX>",
      "kunciJawaban": "<kunci jawaban atau ringkasan rubrik penskoran>",
      "pembahasan": "<penjelasan dan petunjuk langkah demi langkah penyelesaian konsep>",
      "opsiSoal": [
        { "teksOpsi": "<pilihan A>", "benar": true, "alasanSalah": "" },
        { "teksOpsi": "<pilihan B>", "benar": false, "alasanSalah": "<alasan miskonsepsi mengapa opsi B salah>" },
        { "teksOpsi": "<pilihan C>", "benar": false, "alasanSalah": "<alasan miskonsepsi mengapa opsi C salah>" },
        { "teksOpsi": "<pilihan D>", "benar": false, "alasanSalah": "<alasan miskonsepsi mengapa opsi D salah>" }
      ]
    }
  ]
}
Catatan:
- Hasilkan TEPAT ${cleanJumlah} butir soal di dalam array "daftarSoal".
- Untuk tipe 'pilihan_ganda', buat tepat 4 opsi (A-D) dengan tepat 1 opsi benar=true dan 3 opsi salah dengan penjelasan alasanSalah miskonsepsi yang jelas.
- Untuk tipe 'isian_singkat' atau 'esai', buat opsiSoal sebagai array kosong [].`;
    }

    if (fileBase64 && fileMimeType) {
      promptText += `\n\nCATATAN LAMPIRAN BERKAS (${fileMimeType}): Analisis foto / dokumen PDF terlampir dan susun materi pembelajaran / soal yang mengekstrak langsung materi dari lampiran tersebut.`;
    }

    const parts: any[] = [{ text: promptText }];

    if (fileBase64 && fileMimeType) {
      const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, "");
      parts.push({
        inline_data: {
          mime_type: fileMimeType,
          data: cleanBase64,
        },
      });
    }

    // Try Gemini models
    const modelsToTry = [
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-1.5-flash",
    ];

    let apiResponse: Response | null = null;
    let lastErrorText = "";

    for (const modelName of modelsToTry) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
      try {
        const resp = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
              maxOutputTokens: 2500,
            },
          }),
        });

        if (resp.ok) {
          apiResponse = resp;
          break;
        } else {
          lastErrorText = await resp.text();
        }
      } catch (err: any) {
        lastErrorText = err.message;
      }
    }

    if (!apiResponse) {
      throw new Error(`Gemini API Error: ${lastErrorText}`);
    }

    const responseData = await apiResponse.json();
    const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    const cleanedJsonText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const draftData = JSON.parse(cleanedJsonText);

    // Log AI usage
    if (profil.sekolah_id) {
      const inputTokens = responseData.usageMetadata?.promptTokenCount || 0;
      const outputTokens = responseData.usageMetadata?.candidatesTokenCount || 0;
      await supabase.from("log_ai").insert({
        sekolah_id: profil.sekolah_id,
        pengguna_id: user.id,
        fitur: isMateriRequested ? "generate_materi_pembelajaran" : "generate_soal_multimodal",
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
        biaya_usd: (inputTokens * 0.075 + outputTokens * 0.3) / 1000000,
      });
    }

    let finalSoalList: any[] = [];

    if (is15Pack && Array.isArray(draftData.daftarSoal) && draftData.daftarSoal.length === 15) {
      finalSoalList = draftData.daftarSoal.map((s: any, idx: number) => ({
        id: `ai-${Date.now()}-${idx + 1}`,
        pertanyaan: sanitizeMathContent(s.pertanyaan),
        tipeSoal: s.tipeSoal || (idx < 10 ? "pilihan_ganda" : idx < 13 ? "isian_singkat" : "esai"),
        kunciJawaban: sanitizeMathContent(s.kunciJawaban || ""),
        pembahasan: sanitizeMathContent(s.pembahasan || ""),
        poin: 10,
        opsi: (s.opsiSoal || []).map((o: any) => ({
          teks: sanitizeMathContent(o.teksOpsi || o.teks || ""),
          benar: Boolean(o.benar),
          alasanSalah: o.alasanSalah || o.alasan_salah || (o.benar ? "" : "Konsep dasar materi pada opsi ini perlu diperiksa kembali."),
        })),
      }));
    } else if (is15Pack) {
      const { generateChapterQuestions } = await import("@/lib/curriculum-quiz-engine");
      const fallbackList = generateChapterQuestions(topik || "Bab Kurikulum", mapel || "Matematika", 8);
      finalSoalList = fallbackList.map((q) => ({
        id: q.id,
        pertanyaan: sanitizeMathContent(q.pertanyaan),
        tipeSoal: q.tipeSoal,
        kunciJawaban: sanitizeMathContent(q.kunciJawaban),
        pembahasan: sanitizeMathContent(q.pembahasan),
        poin: 10,
        opsi: (q.opsiSoal || []).map((o) => ({
          teks: sanitizeMathContent(o.teksOpsi),
          benar: Boolean(o.benar),
          alasanSalah: o.benar ? "" : "Konsep dasar materi pada opsi ini perlu diperiksa kembali.",
        })),
      }));
    } else if (Array.isArray(draftData.daftarSoal) && draftData.daftarSoal.length > 0) {
      finalSoalList = draftData.daftarSoal.map((s: any, idx: number) => {
        const correctOpt = Array.isArray(s.opsiSoal) ? s.opsiSoal.find((o: any) => o.benar) : null;
        const qType = s.tipeSoal || (tipeSoal === "campuran" ? "pilihan_ganda" : tipeSoal);
        return {
          id: `ai-${Date.now()}-${idx + 1}`,
          pertanyaan: sanitizeMathContent(s.pertanyaan || "Pertanyaan matematika..."),
          tipeSoal: qType as "pilihan_ganda" | "isian_singkat" | "esai",
          kunciJawaban: sanitizeMathContent(s.kunciJawaban || (correctOpt?.teksOpsi || correctOpt?.teks || "")),
          pembahasan: sanitizeMathContent(s.pembahasan || ""),
          poin: 10,
          opsi: (s.opsiSoal || []).map((o: any) => ({
            teks: sanitizeMathContent(o.teksOpsi || o.teks || ""),
            benar: Boolean(o.benar),
            alasanSalah: o.alasanSalah || o.alasan_salah || (o.benar ? "" : "Konsep dasar materi pada opsi ini perlu diperiksa kembali."),
          })),
        };
      });
    } else {
      const correctOpt = Array.isArray(draftData.opsiSoal) ? draftData.opsiSoal.find((o: any) => o.benar) : null;
      const singleQ = {
        id: `ai-${Date.now()}-1`,
        pertanyaan: sanitizeMathContent(draftData.pertanyaan || "Pertanyaan matematika..."),
        tipeSoal: (draftData.tipeSoal || (tipeSoal === "campuran" ? "pilihan_ganda" : tipeSoal)) as "pilihan_ganda" | "isian_singkat" | "esai",
        kunciJawaban: sanitizeMathContent(draftData.kunciJawaban || (correctOpt?.teksOpsi || correctOpt?.teks || "")),
        pembahasan: sanitizeMathContent(draftData.pembahasan || ""),
        poin: 10,
        opsi: (draftData.opsiSoal || []).map((o: any) => ({
          teks: sanitizeMathContent(o.teksOpsi || o.teks || ""),
          benar: Boolean(o.benar),
          alasanSalah: o.alasanSalah || o.alasan_salah || (o.benar ? "" : "Konsep dasar materi pada opsi ini perlu diperiksa kembali."),
        })),
      };
      finalSoalList = [singleQ];
    }

    return NextResponse.json({
      success: true,
      modelUsed: "Gemini 3.1 Flash Lite",
      materiLengkap: draftData.materiLengkap ? sanitizeMathContent(draftData.materiLengkap) : null,
      soal: finalSoalList,
      draft: {
        babId,
        topik,
        tingkatSoal,
        tipeSoal,
        pertanyaan: finalSoalList[0]?.pertanyaan,
        kunciJawaban: finalSoalList[0]?.kunciJawaban,
        pembahasan: finalSoalList[0]?.pembahasan,
        opsiSoal: finalSoalList[0]?.opsi || [],
      },
    });
  } catch (error: any) {
    console.error("Error in generate-soal route:", error);
    // Fallback otomatis menggunakan engine standar kurikulum
    try {
      const body = await req.clone().json().catch(() => ({}));
      const fallbackMapel = body.mapel || "Matematika";
      const fallbackTopik = body.topik || "Bab Kurikulum";
      const fallbackTipe = body.tipeSoal || "pilihan_ganda";
      const is15Pack = fallbackTipe === "paket_15" || body.mode === "paket_15" || body.jumlah === 15;

      const { generateChapterQuestions } = await import("@/lib/curriculum-quiz-engine");
      const fallbackList = generateChapterQuestions(fallbackTopik, fallbackMapel, 8);

      let finalFallback: any[] = [];
      if (is15Pack) {
        finalFallback = fallbackList.map((q) => ({
          id: q.id,
          pertanyaan: q.pertanyaan,
          tipeSoal: q.tipeSoal,
          kunciJawaban: q.kunciJawaban,
          pembahasan: q.pembahasan,
          poin: 10,
          opsi: (q.opsiSoal || []).map((o) => ({
            teks: o.teksOpsi,
            benar: Boolean(o.benar),
            alasanSalah: o.benar ? "" : "Konsep dasar materi pada opsi ini perlu diperiksa kembali.",
          })),
        }));
      } else {
        const matchingQ = fallbackList.find((q) => q.tipeSoal === fallbackTipe) || fallbackList[0];
        finalFallback = [
          {
            id: matchingQ.id,
            pertanyaan: matchingQ.pertanyaan,
            tipeSoal: matchingQ.tipeSoal,
            kunciJawaban: matchingQ.kunciJawaban,
            pembahasan: matchingQ.pembahasan,
            poin: 10,
            opsi: (matchingQ.opsiSoal || []).map((o) => ({
              teks: o.teksOpsi,
              benar: Boolean(o.benar),
              alasanSalah: o.benar ? "" : "Konsep dasar materi pada opsi ini perlu diperiksa kembali.",
            })),
          },
        ];
      }

      return NextResponse.json({
        success: true,
        modelUsed: "Curriculum Engine Standard Fallback",
        soal: finalFallback,
        draft: {
          babId: body.babId,
          topik: fallbackTopik,
          tingkatSoal: body.tingkatSoal || "sedang",
          tipeSoal: fallbackTipe,
          pertanyaan: finalFallback[0]?.pertanyaan,
          kunciJawaban: finalFallback[0]?.kunciJawaban,
          pembahasan: finalFallback[0]?.pembahasan,
          opsiSoal: finalFallback[0]?.opsi || [],
        },
      });
    } catch {
      return NextResponse.json(
        { error: error.message || "Gagal membuat draft materi/soal dari AI." },
        { status: 500 }
      );
    }
  }
}
