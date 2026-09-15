/**
 * Script Batch Generator Soal AI (Offline / Guru Supervised)
 * Sesuai spesifikasi Build Handbook MVP (Bagian 6.3)
 *
 * Menghasilkan draft bank soal matematika kelas 8 secara batch ke database Supabase
 * dengan status 'review' (perlu_review) dan sumber 'ai_generated'.
 * Soal TIDAK PERNAH langsung terbit ke siswa tanpa approval guru di review gate.
 *
 * Cara menjalankan:
 * npx tsx scripts/generate-soal.ts "Bab 4: Persamaan Garis Lurus" 5
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const geminiApiKey = process.env.GEMINI_API_KEY || "";

async function generateSoalBatch(judulBab: string, jumlahSoal: number = 5) {
  console.log(`\n🚀 Memulai Generator Soal Batch AI untuk: "${judulBab}" (${jumlahSoal} soal)`);

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ SUPABASE_URL atau SUPABASE_KEY belum disetel pada environment.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Cari bab di database
  const { data: babRow, error: babErr } = await supabase
    .from("bab")
    .select("id, judul")
    .ilike("judul", `%${judulBab.replace(/^Bab\s*\d+:\s*/i, "").trim()}%`)
    .limit(1)
    .single();

  let babId = babRow?.id;
  if (!babId) {
    const { data: anyBab } = await supabase.from("bab").select("id, judul").limit(1).single();
    babId = anyBab?.id;
    console.log(`ℹ️ Bab tidak ditemukan persis, menggunakan bab default: "${anyBab?.judul}"`);
  }

  const prompt = `Buatkan ${jumlahSoal} soal Matematika kelas 8 untuk topik: ${judulBab}.
Distribusi: 40% mudah, 40% sedang, 20% sulit.
Tipe: pilihan_ganda.

Untuk setiap soal sertakan:
- pertanyaan (LaTeX dalam $...$)
- 4 opsi jawaban, tepat 1 benar
- untuk setiap opsi salah: penjelasan miskonsepsi yang membuat siswa memilihnya
- pembahasan langkah demi langkah, minimal 3 langkah, tiap langkah dijelaskan alasannya

Konteks soal cerita gunakan situasi Indonesia (rupiah, nama lokal, angkutan umum).
Balas HANYA JSON array valid tanpa markdown fence:
[
  {
    "pertanyaan": "...",
    "tingkat_soal": "mudah|sedang|sulit",
    "opsi": [
      { "teks": "...", "benar": true },
      { "teks": "...", "benar": false, "alasan_salah": "..." }
    ],
    "pembahasan": "Langkah 1: ...\\nLangkah 2: ...\\nLangkah 3: ..."
  }
]`;

  let generatedQuestions: any[] = [];

  if (geminiApiKey) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiApiKey}`;
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        generatedQuestions = JSON.parse(rawText.replace(/```json|```/g, "").trim());
      }
    } catch (e: any) {
      console.warn("⚠️ Gagal memanggil API AI:", e.message);
    }
  }

  // Fallback demo question jika offline / no API key
  if (!generatedQuestions || generatedQuestions.length === 0) {
    generatedQuestions = [
      {
        pertanyaan: `Persamaan garis lurus yang melalui titik $A(2, 3)$ dengan gradien $m = -2$ adalah...`,
        tingkat_soal: "sedang",
        opsi: [
          { teks: "$y = -2x + 7$", benar: true },
          { teks: "$y = -2x - 7$", benar: false, alasan_salah: "Miskonsepsi tanda saat memindahkan konstanta" },
          { teks: "$y = 2x + 1$", benar: false, alasan_salah: "Salah menentukan tanda gradien" },
          { teks: "$y = -2x + 3$", benar: false, alasan_salah: "Lupa mengalikan gradien dengan koordinat x1" },
        ],
        pembahasan: `Langkah 1: Gunakan rumus persamaan garis $y - y_1 = m(x - x_1)$.\\nLangkah 2: Substitusikan titik $(2, 3)$ dan gradien $m = -2$ menjadi $y - 3 = -2(x - 2)$.\\nLangkah 3: Sederhanakan $y - 3 = -2x + 4 \\Rightarrow y = -2x + 7$.`,
      },
    ];
  }

  console.log(`✅ Berhasil menghasilkan ${generatedQuestions.length} draft soal.`);

  // 2. Simpan ke database Supabase dengan status 'review' & sumber 'ai_generated'
  let insertedCount = 0;
  for (const q of generatedQuestions) {
    const { data: soalRow, error: sErr } = await supabase
      .from("soal")
      .insert({
        bab_id: babId,
        pertanyaan: q.pertanyaan,
        tipe_soal: "pilihan_ganda",
        tingkat_soal: q.tingkat_soal || "sedang",
        sumber_konten: "ai_generated",
        status_soal: "review", // masuk antrean review guru (TIDAK langsung dipublikasi)
        kunci_jawaban: q.opsi.find((o: any) => o.benar)?.teks || "",
        pembahasan: q.pembahasan || "",
      })
      .select("id")
      .single();

    if (soalRow) {
      if (Array.isArray(q.opsi) && q.opsi.length > 0) {
        const opsiData = q.opsi.map((op: any, idx: number) => ({
          soal_id: soalRow.id,
          teks_opsi: op.teks,
          benar: Boolean(op.benar),
          urutan: idx + 1,
        }));
        await supabase.from("opsi_soal").insert(opsiData);
      }
      insertedCount++;
    } else if (sErr) {
      console.error("Gagal insert soal:", sErr.message);
    }
  }

  console.log(`🎉 Berhasil memasukkan ${insertedCount} soal ke antrean kurasi Guru (Status: 'review').\n`);
}

const args = process.argv.slice(2);
const topicArg = args[0] || "Bab 4: Persamaan Garis Lurus";
const countArg = parseInt(args[1] || "3", 10);

generateSoalBatch(topicArg, countArg).catch(console.error);
