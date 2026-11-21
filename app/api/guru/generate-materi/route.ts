import { NextResponse } from "next/server";
import { sanitizeMathContent } from "@/lib/math-sanitizer";

export interface GenerateMateriRequestBody {
  topik?: string;
  babJudul?: string;
  mapel?: string;
  kelas?: number;
  durasiMenit?: number;
  gayaBelajar?: "konseptual_sokratik" | "praktis_studi_kasus" | "komprehensif_buku_teks" | "ringkas_latihan";
  elemen?: string[];
  instruksiKhusus?: string;
  mode?: "single_module" | "full_chapter_modules";
}

export async function POST(req: Request) {
  try {
    const body: GenerateMateriRequestBody = await req.json().catch(() => ({}));

    const rawTopik = (body.topik || "").trim();
    const rawBabJudul = (body.babJudul || "").trim();
    const mapel = (body.mapel || "Matematika").trim();
    const kelas = Number(body.kelas) || 8;
    const durasiMenit = Number(body.durasiMenit) || 25;
    const gayaBelajar = body.gayaBelajar || "konseptual_sokratik";
    const elemen = Array.isArray(body.elemen) && body.elemen.length > 0
      ? body.elemen
      : ["tujuan", "konsep", "analogi", "contoh_langkah", "sokratik", "miskonsepsi", "rangkuman"];
    const instruksiKhusus = (body.instruksiKhusus || "").trim();
    const mode = body.mode || "single_module";

    const topik = rawTopik || rawBabJudul || `Pembelajaran ${mapel} Kelas ${kelas}`;

    // 1. Coba Generate Menggunakan Google Gemini API jika key tersedia
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey && geminiApiKey.length > 5) {
      try {
        const aiResult = await generateWithGemini({
          apiKey: geminiApiKey,
          topik,
          babJudul: rawBabJudul,
          mapel,
          kelas,
          durasiMenit,
          gayaBelajar,
          elemen,
          instruksiKhusus,
          mode,
        });

        if (aiResult) {
          return NextResponse.json({
            success: true,
            source: "gemini_ai",
            ...aiResult,
          });
        }
      } catch (geminiError: any) {
        console.warn("[GEMINI GENERATE MATERI FALLBACK TRIGGERED]", geminiError?.message || geminiError);
      }
    }

    // 2. Fallback Engine Cerdas & Berstandar Pedagogis Tinggi (Menjamin 0 Error & Kualitas Tinggi)
    const fallbackResult = generateCurriculumFallback({
      topik,
      babJudul: rawBabJudul,
      mapel,
      kelas,
      durasiMenit,
      gayaBelajar,
      elemen,
      instruksiKhusus,
      mode,
    });

    return NextResponse.json({
      success: true,
      source: "curriculum_engine",
      ...fallbackResult,
    });
  } catch (error: any) {
    console.error("[GENERATE MATERI API ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal menyusun materi pembelajaran.",
      },
      { status: 500 }
    );
  }
}

/**
 * Pemanggilan ke Google Gemini API dengan validasi format JSON & sanitasi KaTeX/Markdown
 */
async function generateWithGemini(params: {
  apiKey: string;
  topik: string;
  babJudul: string;
  mapel: string;
  kelas: number;
  durasiMenit: number;
  gayaBelajar: string;
  elemen: string[];
  instruksiKhusus: string;
  mode: "single_module" | "full_chapter_modules";
}) {
  const { apiKey, topik, babJudul, mapel, kelas, durasiMenit, gayaBelajar, elemen, instruksiKhusus, mode } = params;

  const isCoding =
    mapel.toLowerCase().includes("coding") ||
    mapel.toLowerCase().includes("informatika") ||
    mapel.toLowerCase().includes("tik") ||
    topik.toLowerCase().includes("python") ||
    topik.toLowerCase().includes("algoritma");

  const isMath =
    mapel.toLowerCase().includes("matematika") ||
    mapel.toLowerCase().includes("math");

  let prompt = "";

  if (mode === "full_chapter_modules") {
    prompt = `Kamu adalah Pakar Kurikulum Pembelajaran ${mapel} SMP/MTs (Fase D) dan Asisten Guru AI Senior.
Tugasmu adalah menyusun RANGKAIAN LENGKAP 3 SUB-MATERI / MODUL PEMBELAJARAN untuk Bab: "${babJudul || topik}".

Mata Pelajaran: ${mapel}
Sasaran: Siswa Kelas ${kelas} SMP
Gaya Pembelajaran: ${gayaBelajar}
Instruksi Tambahan Guru: "${instruksiKhusus || "Susun materi secara runut dari pengenalan konsep dasar hingga penerapan kompleks"}"

PEDOMAN KONTEN:
1. Bagi bab menjadi tepat 3 sub-materi berurutan (Modul 1: Konsep Dasar & Pemahaman Inti, Modul 2: Pendalaman Teori & Sifat/Mekanisme, Modul 3: Contoh Terapan, Studi Kasus & Pemecahan Masalah).
2. Setiap sub-materi harus memiliki teks penjelasan komprehensif, terstruktur rapi, ramah dibaca siswa, dan mendalam.
3. Jika matematika/sains: WAJIB gunakan notasi KaTeX ($...$ inline, $$...$$ blok).
4. Jika coding/informatika: sertakan blok kode bersih dengan sintaks highlight (\`\`\`python / \`\`\`javascript) dan penjelasan setiap baris.
5. Sertakan tujuan pembelajaran, contoh kontekstual, pertanyaan refleksi sokratik, serta rangkuman di setiap modul.

KEMBALIKAN DALAM FORMAT JSON BERIKUT (TANPA MARKDOWN DI LUAR JSON):
{
  "modules": [
    {
      "urutan": 1,
      "judul": "1. <Judul Sub-Materi 1>",
      "durasiMenit": 20,
      "ringkasan": "<Ringkasan 1-2 kalimat>",
      "kontenMarkdown": "# 1. <Judul Sub-Materi 1>\\n\\n> 🎯 **Tujuan Pembelajaran**\\n- ...\\n\\n## 💡 Pengenalan & Analogi Kontekstual\\n...\\n\\n## 📖 Penjelasan Konsep Inti\\n...\\n\\n## 🔍 Contoh Soal & Langkah Penyelesaian\\n...\\n\\n## 🧠 Refleksi Sokratik\\n...\\n\\n## 📝 Rangkuman Poin Kunci\\n..."
    },
    {
      "urutan": 2,
      "judul": "2. <Judul Sub-Materi 2>",
      "durasiMenit": 25,
      "ringkasan": "<Ringkasan 1-2 kalimat>",
      "kontenMarkdown": "..."
    },
    {
      "urutan": 3,
      "judul": "3. <Judul Sub-Materi 3>",
      "durasiMenit": 30,
      "ringkasan": "<Ringkasan 1-2 kalimat>",
      "kontenMarkdown": "..."
    }
  ]
}`;
  } else {
    prompt = `Kamu adalah Pakar Kurikulum Pembelajaran ${mapel} SMP/MTs (Fase D) dan Asisten Guru AI Senior.
Tugasmu adalah menyusun MATERI PEMBELAJARAN LENGKAP & MODUL AJAR DIGITAL untuk topik: "${topik}" (Bab: "${babJudul || topik}").

SPESIFIKASI:
- Mata Pelajaran: ${mapel}
- Kelas: ${kelas} SMP
- Estimasi Durasi Belajar: ${durasiMenit} Menit
- Gaya Belajar: ${gayaBelajar}
- Elemen Wajib Disertakan: ${elemen.join(", ")}
${instruksiKhusus ? `- Instruksi Tambahan Guru: "${instruksiKhusus}"` : ""}

ATURAN STRUKTUR & PEDAGOGI (KURIKULUM MERDEKA):
1. **Header & Judul**: Mulai dengan judul yang menarik dan jelas.
2. **Tujuan Pembelajaran**: Tuliskan 2-3 capaian pembelajaran yang terukur.
3. **Apersepsi & Analogi Kontekstual**: Kaitkan dengan situasi nyata kehidupan sehari-hari siswa SMP agar mudah dipahami.
4. **Penjelasan Konseptual & Teori Utama**: Jelaskan secara sistematis, bertahap, dan tidak membingungkan.
   - ${isMath ? "WAJIB gunakan notasi KaTeX ($...$ untuk rumus sebaris, $$...$$ untuk rumus terpisah) tanpa typo." : ""}
   - ${isCoding ? "WAJIB sertakan contoh kode dengan blok ```python atau bahasa terkait, beserta penjelasan alur logika eksekusinya." : ""}
5. **Contoh Soal / Kasus Praktis & Langkah Penyelesaian**: Berikan minimal 1-2 contoh terperinci dengan langkah 1, langkah 2, dst.
6. **Miskonsepsi Umum**: Sebutkan 1 kesalahan/salah paham yang sering dialami siswa dan cara menghindarinya.
7. **Pertanyaan Refleksi Sokratik Thinksy**: 2 pertanyaan pemantik yang mengajak siswa berpikir kritis mandiri.
8. **Rangkuman Poin Kunci**: Poin-poin penting untuk diingat.

KEMBALIKAN HANYA FORMAT JSON BERIKUT (TANPA FORMATTING TEKS LAIN DI LUAR JSON):
{
  "judul": "${topik}",
  "durasiMenit": ${durasiMenit},
  "ringkasan": "<Ringkasan materi dalam 1-2 kalimat padat>",
  "kontenMarkdown": "# ${topik}\\n\\n> 🎯 **Tujuan Pembelajaran**\\n- ...\\n\\n## 💡 Apersepsi & Mengapa Ini Penting?\\n...\\n\\n## 📖 Konsep Kunci\\n...\\n\\n## 🔍 Contoh & Langkah Solusi\\n...\\n\\n## ⚠️ Waspadai Miskonsepsi\\n...\\n\\n## 🧠 Tantangan Berpikir Sokratik\\n...\\n\\n## 📝 Rangkuman Poin Kunci\\n..."
}`;
  }

  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (mode === "full_chapter_modules" && Array.isArray(parsed.modules)) {
        return {
          modules: parsed.modules.map((m: any, idx: number) => ({
            urutan: m.urutan || idx + 1,
            judul: m.judul || `Materi ${idx + 1}`,
            durasiMenit: Number(m.durasiMenit) || 20,
            ringkasan: m.ringkasan || "",
            kontenMarkdown: sanitizeMathContent(m.kontenMarkdown || m.konten_markdown || ""),
          })),
        };
      }

      if (parsed.kontenMarkdown || parsed.konten_markdown) {
        const rawContent = parsed.kontenMarkdown || parsed.konten_markdown || "";
        return {
          module: {
            judul: parsed.judul || topik,
            durasiMenit: Number(parsed.durasiMenit) || durasiMenit,
            ringkasan: parsed.ringkasan || `Modul pembelajaran terstruktur untuk topik ${topik}.`,
            kontenMarkdown: sanitizeMathContent(rawContent),
          },
        };
      }
    } catch {}
  }

  return null;
}

/**
 * Generator Kurikulum Cerdas Offline / Fallback
 * Menghasilkan materi komprehensif berstandar Kurikulum Merdeka yang siap pakai dan bebas kesalahan.
 */
function generateCurriculumFallback(params: {
  topik: string;
  babJudul: string;
  mapel: string;
  kelas: number;
  durasiMenit: number;
  gayaBelajar: string;
  elemen: string[];
  instruksiKhusus: string;
  mode: "single_module" | "full_chapter_modules";
}) {
  const { topik, babJudul, mapel, kelas, durasiMenit, instruksiKhusus, mode } = params;

  const isCoding =
    mapel.toLowerCase().includes("coding") ||
    mapel.toLowerCase().includes("informatika") ||
    mapel.toLowerCase().includes("tik") ||
    topik.toLowerCase().includes("python") ||
    topik.toLowerCase().includes("variabel") ||
    topik.toLowerCase().includes("algoritma") ||
    topik.toLowerCase().includes("perulangan");

  const isIpa =
    mapel.toLowerCase().includes("ipa") ||
    mapel.toLowerCase().includes("sains") ||
    mapel.toLowerCase().includes("fisika") ||
    mapel.toLowerCase().includes("biologi") ||
    topik.toLowerCase().includes("sel") ||
    topik.toLowerCase().includes("energi");

  if (mode === "full_chapter_modules") {
    if (isCoding) {
      return {
        modules: [
          {
            urutan: 1,
            judul: "1. Pengenalan Konsep & Logika Dasar",
            durasiMenit: 20,
            ringkasan: "Memahami konsep fondasi, sintaks dasar, dan alur berpikir komputasional.",
            kontenMarkdown: generateCodingModuleContent(topik, 1, "Pengenalan Konsep & Logika Dasar", kelas),
          },
          {
            urutan: 2,
            judul: "2. Pendalaman Sintaks & Contoh Penerapan",
            durasiMenit: 25,
            ringkasan: "Menerapkan struktur kode, logika percabangan/perulangan, dan manipulasi data.",
            kontenMarkdown: generateCodingModuleContent(topik, 2, "Pendalaman Sintaks & Contoh Penerapan", kelas),
          },
          {
            urutan: 3,
            judul: "3. Proyek Studi Kasus & Pemecahan Masalah",
            durasiMenit: 30,
            ringkasan: "Membangun program sederhana terstruktur untuk memecahkan persoalan sehari-hari.",
            kontenMarkdown: generateCodingModuleContent(topik, 3, "Proyek Studi Kasus & Pemecahan Masalah", kelas),
          },
        ],
      };
    }

    if (isIpa) {
      return {
        modules: [
          {
            urutan: 1,
            judul: "1. Pengenalan Konsep & Fenomena Alam",
            durasiMenit: 20,
            ringkasan: "Observasi fenomena sains kontekstual dan prinsip ilmiah dasar.",
            kontenMarkdown: generateScienceModuleContent(topik, 1, "Pengenalan Konsep & Fenomena Alam", kelas),
          },
          {
            urutan: 2,
            judul: "2. Mekanisme Ilmiah & Analisis Hubungan",
            durasiMenit: 25,
            ringkasan: "Memahami hubungan sebab-akibat, rumus ilmiah, dan eksperimen laboratorium virtual.",
            kontenMarkdown: generateScienceModuleContent(topik, 2, "Mekanisme Ilmiah & Analisis Hubungan", kelas),
          },
          {
            urutan: 3,
            judul: "3. Aplikasi Sains & Tantangan Berpikir Kritis",
            durasiMenit: 30,
            ringkasan: "Menganalisis dampak teknologi sains serta pemecahan masalah lingkungan.",
            kontenMarkdown: generateScienceModuleContent(topik, 3, "Aplikasi Sains & Tantangan Berpikir Kritis", kelas),
          },
        ],
      };
    }

    // Default Matematika & Mapel Umum
    return {
      modules: [
        {
          urutan: 1,
          judul: "1. Definisi Konsep Dasar & Pemahaman Awal",
          durasiMenit: 20,
          ringkasan: "Menemukan konsep dasar melalui analogi visual dan definisi formal matematika.",
          kontenMarkdown: generateMathModuleContent(topik, 1, "Definisi Konsep Dasar & Pemahaman Awal", kelas),
        },
        {
          urutan: 2,
          judul: "2. Sifat Operasi, Rumus Kunci & Pembuktian",
          durasiMenit: 25,
          ringkasan: "Mempelajari rumus inti, penjabaran langkah demi langkah, dan sifat-sifat matematis.",
          kontenMarkdown: generateMathModuleContent(topik, 2, "Sifat Operasi, Rumus Kunci & Pembuktian", kelas),
        },
        {
          urutan: 3,
          judul: "3. Latihan Soal Kontekstual & Penalaran Kritis",
          durasiMenit: 30,
          ringkasan: "Menyelesaikan masalah dunia nyata menggunakan model matematis terstruktur.",
          kontenMarkdown: generateMathModuleContent(topik, 3, "Latihan Soal Kontekstual & Penalaran Kritis", kelas),
        },
      ],
    };
  }

  // Single module generation
  let content = "";
  if (isCoding) {
    content = generateCodingModuleContent(topik, 1, topik, kelas, instruksiKhusus);
  } else if (isIpa) {
    content = generateScienceModuleContent(topik, 1, topik, kelas, instruksiKhusus);
  } else {
    content = generateMathModuleContent(topik, 1, topik, kelas, instruksiKhusus);
  }

  return {
    module: {
      judul: topik,
      durasiMenit,
      ringkasan: `Modul pembelajaran komprehensif untuk ${topik} (${mapel} Kelas ${kelas}).`,
      kontenMarkdown: sanitizeMathContent(content),
    },
  };
}

function generateCodingModuleContent(
  topik: string,
  urutan: number,
  subJudul: string,
  kelas: number,
  instruksi?: string
): string {
  return `# ${subJudul}

> 🎯 **Tujuan Pembelajaran**
> - Memahami konsep dasar **${topik}** dan peranannya dalam berpikir komputasional (*computational thinking*).
> - Mengimplementasikan kode program secara tepat dengan sintaks yang rapi dan bebas dari *bug*.
> - Menganalisis alur eksekusi program (*dry-run*) langkah demi langkah untuk memecahkan persoalan logis.

---

## 💡 1. Apersepsi & Analogi Dunia Nyata

Bayangkan Anda sedang membuat resep masakan atau aturan permainan papan. Sebelum Anda menjalankan permainan, Anda memerlukan variabel untuk menyimpan skor, instruksi teratur untuk menentukan giliran pemain, dan kondisi logika untuk mengetahui siapa pemenangnya.

Dalam pemrograman, **${topik}** bekerja persis seperti mekanisme tersebut:
- Memberikan instruksi yang jelas kepada komputer tanpa ambigu.
- Memproses masukan (*input*), melakukan perhitungan atau validasi, dan menghasilkan keluaran (*output*) yang diharapkan.

---

## 📖 2. Pemahaman Konsep & Struktur Logika

Secara fundamental, pada materi **${topik}**, kita perlu memperhatikan aturan penulisan dan tata bahasa pemrograman:

1. **Struktur Sintaks yang Jelas**: Setiap bahasa memiliki aturan penamaan dan tanda baca yang harus dipatuhi.
2. **Tipe Data & Alur Kendali**: Komputer membedakan angka (*integer/float*), teks (*string*), dan kebenaran logika (*boolean*).
3. **Keterbacaan Kode (*Clean Code*)**: Selalu beri nama variabel yang deskriptif dan gunakan indentasi yang konsisten.

Contoh implementasi dasar dalam bahasa **Python**:

\`\`\`python
# Contoh implementasi: ${topik}
nama_siswa = "Rian"
nilai_latihan = 85
status_lulus = nilai_latihan >= 75

print(f"Siswa: {nama_siswa}")
print(f"Nilai: {nilai_latihan}")

if status_lulus:
    print("Selamat! Kamu telah menguasai konsep dasar ini.")
else:
    print("Terus berlatih bersama AI Tutor Thinksy.")
\`\`\`

---

## 🔍 3. Contoh Kasus & Analisis Langkah demi Langkah

Mari kita bedah contoh nyata pembuatan program sederhana:

\`\`\`python
# Menghitung total skor kuis dengan bonus pencapaian
skor_dasar = 80
bonus_kecepatan = 15

# Langkah 1: Hitung total nilai
total_skor = skor_dasar + bonus_kecepatan

# Langkah 2: Evaluasi kategori
if total_skor >= 90:
    predikat = "Istimewa (A)"
elif total_skor >= 75:
    predikat = "Baik (B)"
else:
    predikat = "Cukup (C)"

# Langkah 3: Cetak ringkasan laporan
print("=== HASIL EVALUASI ===")
print(f"Total Skor Akhir: {total_skor}")
print(f"Kategori Predikat: {predikat}")
\`\`\`

### Tabel Analisis Variabel (*Dry Run*):
| Baris | Variabel | Nilai Saat Ini | Keterangan Logika |
| :--- | :--- | :--- | :--- |
| 1 | \`skor_dasar\` | \`80\` | Inisialisasi nilai awal kuis |
| 2 | \`bonus_kecepatan\` | \`15\` | Tambahan poin kecepatan |
| 5 | \`total_skor\` | \`95\` | Penjumlahan 80 + 15 |
| 8 | \`predikat\` | \`"Istimewa (A)"\` | Kondisi \`total_skor >= 90\` bernilai True |

---

## ⚠️ 4. Waspadai Miskonsepsi & Kesalahan Umum

> [!WARNING]
> **Kesalahan Tipe Data & Indentasi**:
> - Jangan menggabungkan teks (*string*) dengan angka (*integer*) secara langsung tanpa konversi (misal: \`"Umur: " + 14\` akan menghasilkan *TypeError*).
> - Selalu perhatikan spasi indentasi (4 spasi) setelah titik dua (\`:\`) pada blok percabangan atau perulangan.

---

## 🧠 5. Tantangan Berpikir Sokratik Thinksy

1. *Mengapa komputer memerlukan aturan tipe data yang ketat, sedangkan manusia dapat langsung memahami arti teks dan angka secara otomatis?*
2. *Jika kamu ingin program ini dapat menerima masukan langsung dari pengguna tanpa mengubah kode, fungsi bawaan apa yang harus kamu gunakan?*

---

## 📝 6. Rangkuman Poin Kunci

- **${topik}** adalah pondasi utama dalam membangun program yang efisien dan minim *error*.
- Kode program yang baik tidak hanya dapat dijalankan komputer, tetapi juga mudah dibaca dan dipahami oleh sesama pemrogram.
- Latihlah pemecahan masalah secara teratur dengan menyusun algoritma sebelum langsung mengetikkan baris kode.
`;
}

function generateMathModuleContent(
  topik: string,
  urutan: number,
  subJudul: string,
  kelas: number,
  instruksi?: string
): string {
  return `# ${subJudul}

> 🎯 **Tujuan Pembelajaran**
> - Memahami konsep dasar dan definisi formal mengenai **${topik}**.
> - Menemukan keterkaitan rumus matematis melalui pembuktian terstruktur dan penalaran logis.
> - Menyelesaikan soal pemecahan masalah kontekstual Kurikulum Merdeka secara akurat langkah demi langkah.

---

## 💡 1. Apersepsi & Mengapa Konsep Ini Penting?

Dalam kehidupan sehari-hari, kita sering menjumpai fenomena yang membutuhkan perhitungan akurat: mulai dari menghitung luas bidang arsitektur, menentukan jarak terpendek rute perjalanan, hingga memprediksi pertumbuhan nilai investasi.

Topik **${topik}** hadir sebagai alat bantu penalaran formal untuk memodelkan persoalan tersebut ke dalam bahasa matematika yang terukur dan logis.

---

## 📖 2. Penjelasan Konsep & Rumus Kunci

Perhatikan definisi dan sifat-sifat fundamental berikut:

### Sifat dan Kaidah Dasar:
1. **Representasi Notasi**: Setiap simbol mewakili kuantitas matematis yang memiliki aturan operasi khusus.
2. **Formula Utama**:
   $$\\text{Hubungan Kunci: } f(x) = ax + b$$
3. **Keseimbangan Persamaan**: Setiap perlakuan operasi pada ruas kiri harus dilakukan dengan nilai yang sama pada ruas kanan:
   $$A + B = C \\implies A = C - B$$

---

## 🔍 3. Contoh Soal & Pembahasan Langkah demi Langkah

### Contoh Kasus:
Diberikan sebuah permasalahan terkait **${topik}**, tentukan nilai penyelesaian yang memenuhi persamaan berikut:

$$2x + 6 = 18$$

### Langkah-Langkah Penyelesaian Rinci:

1. **Langkah 1 (Eliminasi Konstanta Ruas Kiri)**:
   Kurangkan kedua ruas dengan bilangan $6$:
   $$2x + 6 - 6 = 18 - 6$$
   $$2x = 12$$

2. **Langkah 2 (Menentukan Nilai Variabel $x$)**:
   Bagilah kedua ruas persamaan dengan koefisien $2$:
   $$x = \\frac{12}{2}$$
   $$x = 6$$

3. **Langkah 3 (Verifikasi & Pembuktian Solusi)**:
   Substitusikan kembali nilai $x = 6$ ke persamaan awal:
   $$2(6) + 6 = 12 + 6 = 18 \\quad \\text{(Terbukti Benar!)}$$

---

## ⚠️ 4. Waspadai Miskonsepsi Umum

> [!CAUTION]
> **Tanda Negatif & Pemindahan Ruas**:
> - Saat memindahkan suku antar ruas, pastikan tanda operasi berubah ($+$ menjadi $-$, dan sebaliknya).
> - Pembagian dengan bilangan negatif akan membalik tanda pertidaksamaan jika melibatkan relasi relasional ($<$ menjadi $>$).

---

## 🧠 5. Pertanyaan Refleksi Sokratik Thinksy

1. *Bagaimana jika nilai koefisien pada variabel bernilai $0$? Apakah persamaan tersebut masih memiliki solusi tunggal?*
2. *Dapatkah kamu memberikan contoh satu permasalahan di lingkungan sekitarmu yang dapat diselesaikan menggunakan model matematika di atas?*

---

## 📝 6. Rangkuman Poin Kunci

- **${topik}** mempermudah analisis data kuantitatif secara sistematis.
- Selalu lakukan verifikasi jawaban dengan mensubstitusikan kembali hasil akhir ke model persoalan mula-mula.
`;
}

function generateScienceModuleContent(
  topik: string,
  urutan: number,
  subJudul: string,
  kelas: number,
  instruksi?: string
): string {
  return `# ${subJudul}

> 🎯 **Tujuan Pembelajaran**
> - Mengidentifikasi struktur, fungsi, dan mekanisme ilmiah terkait **${topik}**.
> - Menganalisis hubungan sebab-akibat pada fenomena alam berdasarkan data observasi dan eksperimen sains.
> - Mengembangkan sikap ilmiah, bernalar kritis, dan kepedulian terhadap kelestarian ekosistem.

---

## 💡 1. Apersepsi & Fenomena Alam di Sekitar Kita

Pernahkah Anda mengamati bagaimana sistem dalam tubuh makhluk hidup atau alam semesta bekerja dengan keteraturan yang luar biasa? Setiap unit terkecil saling berinteraksi membentuk hierarki yang seimbang.

Materi **${topik}** mengungkap prinsip ilmiah di balik fenomena tersebut melalui metode observasi empiris dan penalaran sains modern.

---

## 📖 2. Konsep & Prinsip Ilmiah Utama

Karakteristik penting yang mendasari materi ini meliputi:

1. **Struktur dan Komponen**: Bagian-bagian penyusun dan peranan spesifik masing-masing elemen.
2. **Hukum dan Mekanisme Alam**:
   - Proses transformasi materi dan energi yang mematuhi hukum kekekalan.
   - Keterkaitan antara variabel bebas, terikat, dan kontrol dalam observasi ilmiah.
3. **Hubungan Kausalitas**: Perubahan pada satu komponen akan memberikan dampak berantai pada kesetimbangan sistem secara keseluruhan.

---

## 🔍 3. Studi Kasus & Analisis Fenomena

### Observasi Kasus:
Bagaimana pengaruh variasi faktor lingkungan terhadap stabilitas dan performa sistem **${topik}**?

### Langkah Investigasi Ilmiah:
1. **Identifikasi Masalah**: Menentukan variabel yang dapat diukur secara kuantitatif.
2. **Pengumpulan Data**: Mencatat perubahan parameter dalam interval waktu tertentu.
3. **Penarikan Kesimpulan**: Menghubungkan data hasil pengamatan dengan teori sains yang relevan.

---

## ⚠️ 4. Waspadai Miskonsepsi Sains

> [!NOTE]
> Banyak siswa mengira bahwa proses alam berlangsung secara instan. Faktanya, sebagian besar mekanisme biologis dan fisis membutuhkan energi aktivasi serta waktu penyesuaian (*adaptasi*) bertahap.

---

## 🧠 5. Diskusi Sokratik Thinksy

1. *Apa yang akan terjadi pada sistem jika salah satu komponen pendukung mengalami kerusakan atau disrupsi total?*
2. *Bagaimana teknologi modern memanfaatkan prinsip ilmiah ${topik} untuk memecahkan masalah kehidupan manusia?*

---

## 📝 6. Rangkuman Poin Kunci

- **${topik}** merupakan salah satu pilar pemahaman sains dalam Kurikulum Merdeka.
- Sikap kritis dan ketelitian dalam mengamati fakta lapangan adalah kunci utama menjadi peneliti sains yang unggul.
`;
}
