import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { autoClaimMisi } from "@/app/api/siswa/misi/route";
import { checkAndUpdateDailyStreak } from "@/lib/streak";

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

    // 2. Fetch User Profile
    const { data: profil } = await supabase
      .from("profil")
      .select("sekolah_id, nama_lengkap, peran")
      .eq("id", user.id)
      .single();

    const sekolahId = profil?.sekolah_id;

    // 3. Rate Limiting Check (Max 20 AI interaction logs per day per student)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todayLogsCount, error: countError } = await supabase
      .from("log_ai")
      .select("id", { count: "exact", head: true })
      .eq("pengguna_id", user.id)
      .eq("fitur", "tutor_sokratik")
      .gte("dibuat_pada", today.toISOString());

    const currentCount = todayLogsCount || 0;
    const MAX_DAILY_CHAT = 20;

    if (currentCount >= MAX_DAILY_CHAT) {
      return NextResponse.json(
        {
          error:
            "Batas harian interaksi Tutor AI telah tercapai (20 pesan/hari). Silakan coba lagi besok!",
          remainingQuota: 0,
        },
        { status: 429 }
      );
    }

    // 4. Parse Request Body
    const body = await req.json();
    const {
      sesiId,
      soalId,
      materiJudul,
      materiKonten,
      message,
      image,
      attachment,
      history = [],
      mode,
      isGeneralAi,
    } = body;

    const activeAttachment = attachment || (image ? { type: "image", dataUrl: image } : null);

    if ((!message || typeof message !== "string") && !activeAttachment) {
      return NextResponse.json(
        { error: "Pesan, foto gambar, atau dokumen PDF tidak boleh kosong." },
        { status: 400 }
      );
    }

    const isGeneralMode = mode === "general" || isGeneralAi === true;

    // 5. Build Unified Deep Socratic System Prompt
    const systemPrompt = `Kamu adalah "thinksy Socratic AI", tutor dan mentor belajar cerdas, suportif, dan interaktif yang berpedoman pada METODE SOKRATIK MURNI untuk siswa sekolah (khususnya SMP Kelas 8 Kurikulum Merdeka) 🚀✨.

TUGAS & FILOSOFI UTAMA (METODE SOKRATIK KETAT):
Tujuan utamamu BUKAN memberikan jawaban instan atau menyelesaikan pekerjaan siswa, melainkan MEMBANTU DAN MEMBIMBING SISWA BERPIKIR LEBIH DALAM, MEMAHAMI LOGIKA, DAN MENEMUKAN JAWABANNYA SENDIRI SECARA BERTAHAP (STEP-BY-STEP SCAFFOLDING).

ATURAN WAJIB & PROTOKOL SOKRATIK:
1. 🚫 DILARANG KERAS MEMBERIKAN JAWABAN AKHIR / SOLUSI INSTAN:
   - Jangan pernah langsung menuliskan jawaban akhir, hasil hitungan akhir, atau jawaban lengkap tugas siswa.
   - Jika siswa bertanya "Berapa jawabannya?", "Tolong kerjakan ini", atau "Beri saya jawaban nomor 3", tolak dengan ramah dan arahkan ke eksplorasi langkah pertama.
   - Contoh respons ramah: "Yuk, kita bedah bareng-bareng! Aku ingin kamu yang berhasil menemukan jawabannya sendiri dengan hebat. Mari kita mulai dari langkah awal..."

2. 🪜 BIMBINGAN BERTAHAP (STEP-BY-STEP SCAFFOLDING):
   - Jangan berikan seluruh langkah sekaligus. Berikan bimbingan 1 LANGKAH KECIL pada setiap giliran obrolan.
   - Awali dengan mengidentifikasi: "Apa saja informasi penting yang diketahui dari soal ini?" atau "Rumus/konsep apa yang menurutmu relevan?".
   - Di akhir setiap respons, WAJIB ajukan 1 PERTANYAAN PANCINGAN REFLEKTIF (Probing Question) yang mengajak siswa mencoba langkah berikutnya secara mandiri.

3. 🖼️ JIKA SISWA MENGIRIM FOTO SOAL / TUGAS / DOKUMEN PDF:
   - Baca dan telaah isi berkas secara teliti.
   - Jelaskan konsep dasar yang sedang diuji pada berkas tersebut.
   - Berikan CONTOH ANALOGI dengan angka/variabel yang berbeda jika siswa butuh ilustrasi cara kerja rumus.
   - Tanyakan pada siswa apa langkah pertama yang terpikirkan oleh mereka untuk soal tersebut.

4. 💡 DETEKSI KESALAHAN SECARA REFLEKTIF:
   - Jika jawaban atau langkah siswa keliru, jangan langsung menyatakan salah atau langsung membetulkannya.
   - Tuntun siswa mengevaluasi langkah mereka sendiri. Contoh: "Coba perhatikan tanda operasi di baris kedua. Menurutmu, jika angka negatif dikalikan angka negatif, hasilnya akan bagaimana ya?"

5. 🌟 APRESIASI & PENGUATAN LOGIKA:
   - Berikan pujian spesifik ketika siswa berhasil melakukan penalaran yang benar.
   - Tanyakan alasan di balik pemikiran mereka untuk memperdalam pemahaman: "Tepat sekali! Mengapa kamu memilih langkah tersebut untuk kasus ini?"

6. 📐 FORMAT PENULISAN:
   - Gunakan format KaTeX untuk semua notasi dan ekspresi matematika ($...$ untuk inline, $$...$$ untuk blok baris baru).
   - Gunakan format Markdown yang rapi (bold, list, bullet points).
   - Gunakan bahasa Indonesia yang hangat, bersahabat, penuh semangat, dan mudah dipahami siswa SMP.
   - WAJIB menyelesaikan jawaban hingga tuntas tanpa menggantung di akhir kalimat.

KONTEKS MATERI AKTIF:
- **Materi/Bab:** ${materiJudul || "Pembelajaran Mandiri & Bimbingan Sokratik"}
- **Konteks/Konten:** ${materiKonten || "Diskusi Konsep Akademis & Penalaran Siswa"}`;


    // 6. Call Google Gemini API
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Kunci API Gemini belum dikonfigurasi di server." },
        { status: 500 }
      );
    }

    // Format latest message parts (Text + optional Image / PDF Attachment)
    const userParts: any[] = [];
    if (activeAttachment?.dataUrl) {
      const dataUrl = activeAttachment.dataUrl;
      const defaultMime = activeAttachment.type === "pdf" ? "application/pdf" : "image/jpeg";
      const mimeType = dataUrl.match(/data:(.*?);base64,/)?.[1] || defaultMime;
      const base64Data = dataUrl.replace(/^data:.*?;base64,/, "");

      userParts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    const defaultPromptText = activeAttachment?.type === "pdf"
      ? "Bantu rangkum dan jelaskan dokumen PDF ini."
      : "Jelaskan gambar ini dan berikan pembahasannya.";

    userParts.push({ text: message || defaultPromptText });

    // Format message history for Gemini API (uses 'model' role instead of 'assistant')
    const formattedMessages = [
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      { role: "user", parts: userParts },
    ];

    const GEMINI_MODELS = [
      "gemini-3.1-flash-lite",
      "gemini-3.1-flash-lite-preview",
      "gemini-3.6-flash",
    ];

    let apiResponse: Response | null = null;
    let lastErrorText = "";

    for (const model of GEMINI_MODELS) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      try {
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: formattedMessages,
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
              stopSequences: [],
            },
          }),
        });

        if (res.ok) {
          apiResponse = res;
          break;
        } else {
          lastErrorText = await res.text();
        }
      } catch (err: any) {
        lastErrorText = err.message;
      }
    }

    if (!apiResponse) {
      throw new Error(`Gemini API Error: ${lastErrorText}`);
    }

    const responseData = await apiResponse.json();
    const candidate = responseData.candidates?.[0];
    const finishReason = candidate?.finishReason;
    const assistantReply = candidate?.content?.parts?.[0]?.text || "Maaf, thinksy AI tidak dapat memproses jawaban saat ini.";

    // Log jika response terpotong
    if (finishReason && finishReason !== "STOP") {
      console.warn(`[thinksy AI] Response finished with reason: ${finishReason}`);
    }

    const inputTokens = responseData.usageMetadata?.promptTokenCount || 0;
    const outputTokens = responseData.usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = inputTokens + outputTokens;
    
    // Estimated cost calculations (Gemini 2.5 Flash-lite: ~$0.075/M input, $0.30/M output)
    const costUsd = (inputTokens * 0.075 + outputTokens * 0.3) / 1000000;

    // 7. Save chat messages to database if sesiId provided
    if (sesiId) {
      await supabase.from("percakapan_tutor").insert([
        {
          sesi_id: sesiId,
          soal_id: soalId || null,
          pengirim: "siswa",
          pesan: message,
        },
        {
          sesi_id: sesiId,
          soal_id: soalId || null,
          pengirim: "tutor_ai",
          pesan: assistantReply,
        },
      ]);
    }

    // 8. Log AI Token Usage (Always log to log_ai even if sekolahId is NULL)
    let misiClaimResult = { claimed: false, poinDitambahkan: 0 };
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const adminDb = createAdminClient();

      await adminDb.from("log_ai").insert({
        sekolah_id: sekolahId || null,
        pengguna_id: user.id,
        fitur: "tutor_sokratik",
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
        total_tokens: totalTokens,
        biaya_usd: costUsd,
      });

      // AUTO-KLAIM misi sokratik jika ini interaksi pertama hari ini
      // currentCount adalah jumlah log SEBELUM insert ini, jadi jika 0 = ini yang pertama
      if (currentCount === 0) {
        misiClaimResult = await autoClaimMisi(supabase, user.id, "sokratik");
        if (!misiClaimResult.claimed) {
          misiClaimResult = await autoClaimMisi(supabase, user.id, "eksplorasi");
        }
      }

      // Evaluasi dan trigger Daily Streak jika siswa telah berinteraksi minimal 3 kali hari ini
      const totalChatsToday = currentCount + 1;
      if (totalChatsToday >= 3) {
        try {
          await checkAndUpdateDailyStreak(user.id, "tutor_sokratik");
        } catch (streakErr) {
          console.error("[STREAK UPDATE ERROR (AI CHAT)]", streakErr);
        }
      }
    } catch (logErr) {
      console.error("Error writing to log_ai:", logErr);
    }

    const remainingQuota = MAX_DAILY_CHAT - (currentCount + 1);

    return NextResponse.json({
      reply: assistantReply,
      remainingQuota: Math.max(0, remainingQuota),
      usage: {
        totalTokens,
      },
      misiAutoClaimed: misiClaimResult.claimed,
      misiPoinDitambahkan: misiClaimResult.poinDitambahkan,
    });
  } catch (error: any) {
    console.error("Error in Tutor AI Route:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan internal pada server AI." },
      { status: 500 }
    );
  }
}
