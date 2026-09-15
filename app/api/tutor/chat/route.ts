import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { autoClaimMisi } from "@/app/api/siswa/misi/route";
import { checkAndUpdateDailyStreak } from "@/lib/streak";
import { buildSocraticTutorPrompt } from "@/lib/prompts/tutor";

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

    // 3.1 Rate Limiting Check (Max 5 messages/minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: lastMinuteCount } = await supabase
      .from("log_ai")
      .select("id", { count: "exact", head: true })
      .eq("pengguna_id", user.id)
      .gte("dibuat_pada", oneMinuteAgo);

    if ((lastMinuteCount || 0) >= 5) {
      return NextResponse.json(
        { error: "Mohon tunggu sebentar, kamu mengirim pesan terlalu cepat (maksimal 5 pesan per menit)." },
        { status: 429 }
      );
    }

    // 4. Parse Request Body
    const body = await req.json();
    const {
      sesiId,
      soalId,
      soalNomor,
      totalSoal,
      pertanyaan,
      opsiJawaban,
      kunciJawaban,
      pembahasan,
      hintSokratik,
      babJudul,
      materiJudul,
      materiKonten,
      mapel,
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

    // 4.1 Extract or Fetch specific question details & secret solution
    let activePertanyaan = pertanyaan || "";
    let activePembahasan = pembahasan || "";
    let activeKunci = kunciJawaban || "";
    let activeHint = hintSokratik || "";
    let activeOpsi: Array<{ id?: string; label?: string; teks: string }> = [];

    if (Array.isArray(opsiJawaban) && opsiJawaban.length > 0) {
      activeOpsi = opsiJawaban.map((o: any, idx: number) => ({
        id: o.id,
        label: o.label || String.fromCharCode(65 + idx),
        teks: o.teksOpsi || o.teks || (typeof o === "string" ? o : ""),
      }));
    }

    if (soalId) {
      try {
        const { data: soalRow } = await supabase
          .from("soal")
          .select(`
            id,
            pertanyaan,
            pembahasan,
            kunci_jawaban,
            tipe_soal,
            opsi_soal (id, teks_opsi, benar, urutan)
          `)
          .eq("id", soalId)
          .maybeSingle();

        if (soalRow) {
          if (!activePertanyaan) activePertanyaan = soalRow.pertanyaan || "";
          if (!activePembahasan) activePembahasan = soalRow.pembahasan || "";
          if (!activeKunci) activeKunci = soalRow.kunci_jawaban || "";

          if (activeOpsi.length === 0 && soalRow.opsi_soal && Array.isArray(soalRow.opsi_soal)) {
            const sortedOpsi = [...soalRow.opsi_soal].sort(
              (a, b) => (a.urutan || 0) - (b.urutan || 0)
            );
            activeOpsi = sortedOpsi.map((o: any, idx: number) => ({
              id: o.id,
              label: String.fromCharCode(65 + idx),
              teks: o.teks_opsi,
            }));
            const correctOpt = sortedOpsi.find((o) => o.benar);
            if (correctOpt && !activeKunci) {
              const correctIdx = sortedOpsi.indexOf(correctOpt);
              activeKunci = `Opsi ${String.fromCharCode(65 + correctIdx)}: "${correctOpt.teks_opsi}"`;
            }
          }
        }
      } catch (dbErr) {
        console.warn("[TUTOR CHAT] Soal lookup by ID failed, using provided client context:", dbErr);
      }
    }

    if (!activePertanyaan && materiKonten) {
      activePertanyaan = materiKonten;
    }

    // 5. Build Socratic Prompt from Library (v2.0 with question-level deep understanding)
    const systemPrompt = buildSocraticTutorPrompt({
      mapel: mapel || "Informatika",
      tingkatKelas: "SMP / MTs Kelas 8",
      babJudul: babJudul || materiJudul || "Pembelajaran Aktif",
      materiJudul: materiJudul || babJudul || "",
      nomorSoal: soalNomor || undefined,
      totalSoal: totalSoal || undefined,
      pertanyaanMd: activePertanyaan || "Soal latihan konsep pembelajaran.",
      opsiJawaban: activeOpsi,
      kunciJawaban: activeKunci,
      pembahasanMd: activePembahasan,
      hintSokratik: activeHint,
    });

    // 5.1 Enforce max 10 turns history to optimize cost (Handbook §10)
    const safeHistory = (Array.isArray(history) ? history : []).slice(-10);


    // 6. Call Google Gemini API (with robust Socratic fallback if key is missing or upstream fails)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    let assistantReply = "";
    let inputTokens = 120;
    let outputTokens = 180;

    if (geminiApiKey) {
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
        ...safeHistory.map((msg: { role: string; content: string }) => ({
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

      if (apiResponse) {
        const responseData = await apiResponse.json();
        const candidate = responseData.candidates?.[0];
        assistantReply = candidate?.content?.parts?.[0]?.text || "";
        inputTokens = responseData.usageMetadata?.promptTokenCount || 120;
        outputTokens = responseData.usageMetadata?.candidatesTokenCount || 180;
      }
    }

    // High-quality Socratic Fallback if Gemini is not responding or key absent
    if (!assistantReply) {
      const lowerMsg = (message || "").toLowerCase();
      const questionSnippet = activePertanyaan
        ? activePertanyaan.replace(/^\d+\.\s*/, "").slice(0, 90)
        : "";
      const nomorPrefix = soalNomor ? `Soal #${soalNomor}` : "soal ini";

      if (
        lowerMsg.includes("rumus") ||
        lowerMsg.includes("kunci") ||
        lowerMsg.includes("istilah")
      ) {
        assistantReply = `🔍 **Kata Kunci Seru (${nomorPrefix}):**\n\n${
          activeHint ? `> *Tips dari aku:* ${activeHint}\n\n` : ""
        }Di ${nomorPrefix}, inti yang lagi diuji itu seputar: *"${questionSnippet}..."*.\n\nCoba deh amati kata kunci di masing-masing pilihan jawaban. Menurutmu, opsi mana yang paling nyambung sama konsep itu?`;
      } else if (
        lowerMsg.includes("langkah") ||
        lowerMsg.includes("awal") ||
        lowerMsg.includes("cara") ||
        lowerMsg.includes("analisis") ||
        lowerMsg.includes("eliminasi")
      ) {
        assistantReply = `🪜 **Yuk kita bedah langkahnya bareng-bareng (${nomorPrefix}):**\n\n1. Pertama, cek dulu kata kunci utama yang ditanyakan soal.\n2. Baca keempat pilihan jawaban dengan teliti.\n3. Kalau ada opsi yang kerasa aneh atau jelas bertentangan sama konsep, langsung kita coret duluan!\n\nNah, menurut kamu dari opsi yang ada, mana yang paling gampang kita eliminasi duluan?`;
      } else {
        assistantReply = `💡 **Tips Santai (${nomorPrefix}):**\n\n${
          activeHint ? `> *Clue buat kamu:* ${activeHint}\n\n` : ""
        }Soal ini lagi ngajak kita mikir tentang *"${questionSnippet}..."*.\n\nCoba kamu baca pelan-pelan pilihan jawabannya. Kira-kira apa hal pertama yang terlintas di pikiranmu pas baca opsi-opsi itu?`;
      }
    }

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
