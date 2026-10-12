import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSocraticTutorPrompt } from "@/lib/prompts/tutor";

export const maxDuration = 30; // 30 detik timeout sesuai handbook

export async function POST(req: Request) {
  const startTime = Date.now();
  const supabase = await createClient();
  const adminDb = createAdminClient();

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

  // 2. Rate Limiting Check (20 pesan/hari & 5 pesan/menit)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: dailyCount } = await adminDb
    .from("log_ai")
    .select("id", { count: "exact", head: true })
    .eq("pengguna_id", user.id)
    .eq("fitur", "tutor_sokratik")
    .gte("dibuat_pada", todayStart.toISOString());

  if ((dailyCount || 0) >= 20) {
    return NextResponse.json(
      {
        error:
          "Batas harian konsultasi Tutor AI tercapai (maksimal 20 pesan/hari). Silakan lanjutkan belajar mandiri atau tanyakan pada guru besok!",
        remainingQuota: 0,
      },
      { status: 429 }
    );
  }

  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const { count: minuteCount } = await adminDb
    .from("log_ai")
    .select("id", { count: "exact", head: true })
    .eq("pengguna_id", user.id)
    .gte("dibuat_pada", oneMinuteAgo);

  if ((minuteCount || 0) >= 5) {
    return NextResponse.json(
      { error: "Mohon jeda sebentar (maksimal 5 pesan per menit agar kamu punya waktu berpikir)." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const {
    soalId,
    sesiId,
    message,
    history = [],
    jawabanSiswaSaatIni,
    jumlahSalahLangkah = 0,
  } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "Pesan tidak boleh kosong." },
      { status: 400 }
    );
  }

  // 3. Ambil data soal, bab, dan langkah penyelesaian rahasia dari DB
  let pertanyaanMd = "";
  let pembahasanMd = "";
  let babJudul = "Matematika SMP Kelas 8";

  if (soalId) {
    const { data: soalRow } = await adminDb
      .from("soal")
      .select(`
        id,
        pertanyaan,
        pembahasan,
        kunci_jawaban,
        bab:bab_id (id, judul)
      `)
      .eq("id", soalId)
      .maybeSingle();

    if (soalRow) {
      pertanyaanMd = soalRow.pertanyaan || "";
      pembahasanMd = soalRow.pembahasan || "";
      if (soalRow.bab && typeof soalRow.bab === "object") {
        babJudul = (soalRow.bab as any).judul || babJudul;
      }
    }
  }

  // 4. Bangun prompt Sokratik sesuai Handbook §6.1
  const systemPrompt = buildSocraticTutorPrompt({
    pertanyaanMd,
    pembahasanMd,
    babJudul,
    jawabanSiswaSaatIni,
    jumlahSalahLangkah: Number(jumlahSalahLangkah) || 0,
  });

  // 5. Format percakapan (Maksimal 10 giliran terakhir sesuai Handbook §10 Kontrol Biaya)
  const trimmedHistory = (Array.isArray(history) ? history : []).slice(-10);
  const geminiContents: any[] = [
    {
      role: "user",
      parts: [{ text: `${systemPrompt}\n\nSiap membimbing siswa dengan metode Sokratik.` }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Halo! Aku siap mendampingimu belajar matematika. Coba ceritakan, di bagian mana kamu mulai bingung?",
        },
      ],
    },
  ];

  for (const h of trimmedHistory) {
    geminiContents.push({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content || "" }],
    });
  }

  geminiContents.push({
    role: "user",
    parts: [{ text: message }],
  });

  const apiKey = process.env.GEMINI_API_KEY || "";

  // Fallback jika API key belum disetel
  if (!apiKey) {
    const fallbackText =
      "Hai! Mari kita amati kembali kata kunci utama pada soal ini. Rumus atau konsep apa yang pertama kali kamu ingat saat membaca pertanyaannya?";
    return new Response(fallbackText, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    // 6. Panggil Gemini 3.1 Flash Lite via Server-Sent Events / Stream
    const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:streamGenerateContent?alt=sse&key=${apiKey}`;

    const geminiRes = await fetch(streamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: geminiContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 400,
        },
      }),
    });

    if (!geminiRes.ok || !geminiRes.body) {
      const errText = await geminiRes.text();
      console.error("[GEMINI STREAM ERROR]", errText);
      return new Response(
        "Tutor AI sedang sibuk sebentar. Coba periksa kembali langkah perhitunganmu atau tanyakan lagi dalam beberapa detik!",
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    // Transform stream: Parse SSE dan stream plain text ke client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let accumulatedText = "";
    let inputTokenEst = 200;
    let outputTokenEst = 0;

    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body!.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data: ")) {
                const jsonStr = trimmed.slice(6).trim();
                if (jsonStr === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(jsonStr);
                  const candidate = parsed.candidates?.[0];
                  const chunkText = candidate?.content?.parts?.[0]?.text;
                  if (chunkText) {
                    accumulatedText += chunkText;
                    controller.enqueue(encoder.encode(chunkText));
                  }
                  if (parsed.usageMetadata?.candidatesTokenCount) {
                    outputTokenEst = parsed.usageMetadata.candidatesTokenCount;
                  }
                  if (parsed.usageMetadata?.promptTokenCount) {
                    inputTokenEst = parsed.usageMetadata.promptTokenCount;
                  }
                } catch {
                  // Ignore JSON parse errors on partial chunks
                }
              }
            }
          }
        } catch (streamErr) {
          console.error("[STREAM PROCESSING ERROR]", streamErr);
        } finally {
          controller.close();

          // Catat ke log_ai dan percakapan_tutor setelah stream selesai
          const latensiMs = Date.now() - startTime;
          const totalTokens = inputTokenEst + (outputTokenEst || Math.round(accumulatedText.length / 4));
          const biayaUsd = (inputTokenEst * 0.075 + (outputTokenEst || 80) * 0.3) / 1_000_000;

          try {
            await adminDb.from("log_ai").insert({
              pengguna_id: user.id,
              fitur: "tutor_sokratik",
              model: "gemini-3.1-flash-lite",
              prompt_tokens: inputTokenEst,
              completion_tokens: outputTokenEst || 80,
              total_tokens: totalTokens,
              biaya_usd: biayaUsd,
              latensi_ms: latensiMs,
              sukses: true,
            });

            if (sesiId) {
              await adminDb.from("percakapan_tutor").insert([
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
                  pesan: accumulatedText,
                },
              ]);
            }
          } catch (logErr) {
            console.error("[LOG_AI RECORD ERROR]", logErr);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Remaining-Quota": String(Math.max(0, 19 - (dailyCount || 0))),
      },
    });
  } catch (err: any) {
    console.error("[API TUTOR EXCEPTION]", err);
    return new Response(
      "Koneksi tutor terputus. Coba ulangi pertanyaanmu secara singkat ya!",
      { headers: { "Content-Type": "text/plain; charset=utf-8" }, status: 500 }
    );
  }
}
