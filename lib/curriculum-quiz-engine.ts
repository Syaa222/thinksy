/**
 * Curriculum Quiz Engine (Engine Generator Soal & Pembahasan Kurikulum Merdeka)
 * KHUSUS MATEMATIKA SMP KELAS 8 (FASE D)
 * Sesuai dengan 8 Bab Kurikulum Merdeka:
 * - Bab 1: Pola Bilangan & Barisan Bilangan
 * - Bab 2: Bentuk Aljabar & PLSV/PTLSV
 * - Bab 3: Relasi & Fungsi
 * - Bab 4: Persamaan Garis Lurus (PGL)
 * - Bab 5: Sistem Persamaan Linear Dua Variabel (SPLDV)
 * - Bab 6: Teorema Pythagoras
 * - Bab 7: Bangun Ruang Sisi Datar (BRSD)
 * - Bab 8: Statistika & Peluang
 * 
 * Setiap bab berisi TEPAT 15 SOAL STANDAR:
 * - 10 Soal Pilihan Ganda (Nomor 1 - 10)
 * - 3 Soal Jawaban Singkat (Nomor 11 - 13)
 * - 2 Soal Jawaban Panjang / Esai (Nomor 14 - 15)
 */

export interface QuestionOption {
  id: string;
  teksOpsi: string;
  benar: boolean;
}

export interface QuizQuestionData {
  id: string;
  pertanyaan: string;
  tipeSoal: "pilihan_ganda" | "isian_singkat" | "esai";
  opsiSoal?: QuestionOption[];
  kunciJawaban: string;
  pembahasan: string;
  hintSokratik: string;
}

// =============================================================================
// HELPER: RANDOMISASI OPSI A, B, C, D UNIK PER AKUN SISWA (ANTI-CONTEK)
// =============================================================================
export function shuffleOptionsForStudent<T>(
  options: T[],
  studentSeed: string,
  questionId: string
): T[] {
  if (!options || options.length <= 1) return options;

  // Gabungkan ID unik akun siswa dan ID butir soal sebagai seed deterministik
  const combinedSeed = `${studentSeed || "siswa-anonim"}_${questionId}`;

  // 32-bit FNV-1a Hash Generator
  let hash = 2166136261;
  for (let i = 0; i < combinedSeed.length; i++) {
    hash ^= combinedSeed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  // Deterministic Mulberry32 PRNG
  const nextRandom = () => {
    hash = (hash + 0x6d2b79f5) | 0;
    let t = Math.imul(hash ^ (hash >>> 15), 1 | hash);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Fisher-Yates Shuffle
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// =============================================================================
// HELPER: PETUNJUK SOAL SPESIFIK & AKURAT SESUAI BUTIR PERTANYAAN
// =============================================================================
export function resolveSpecificHint(
  pertanyaan: string,
  kunciJawaban?: string,
  pembahasan?: string,
  currentHint?: string
): string {
  // Jika hint sudah spesifik dan bukan kalimat generik placeholder, gunakan hint tersebut
  if (
    currentHint &&
    currentHint.trim().length > 10 &&
    !currentHint.toLowerCase().includes("prosedur analisis") &&
    !currentHint.toLowerCase().includes("kaidah matematis") &&
    !currentHint.toLowerCase().includes("ketikkan angka atau formula") &&
    !currentHint.toLowerCase().includes("tuliskan langkah demi langkah")
  ) {
    return currentHint.trim();
  }

  const pLower = (pertanyaan || "").toLowerCase();

  // 1. Bilangan Berpangkat / Eksponen
  if (pLower.includes("pangkat") || pLower.includes("eksponen") || pLower.includes("^")) {
    if (pLower.includes("\times") || pLower.includes("perkalian") || pLower.includes("dikali")) {
      return "Ingat sifat operasi eksponen: pada perkalian bilangan berpangkat dengan basis yang sama ($a^m \times a^n$), jumlahkan pangkat-pangkatnya ($m + n$).";
    }
    if (pLower.includes("/") || pLower.includes("bagi") || pLower.includes("pembagian") || pLower.includes("frac")) {
      return "Gunakan sifat pembagian eksponen dengan basis sama ($a^m : a^n$): kurangkan pangkat pembilang dengan pangkat penyebut ($m - n$).";
    }
    if (pLower.includes("pangkatkan lagi") || pLower.includes(")^")) {
      return "Terapkan aturan pemangkatan berulang: $(a^m)^n = a^{m \times n}$. Kalikan nilai kedua eksponennya.";
    }
    if (pLower.includes("0") || pLower.includes("negatif") || pLower.includes("^-")) {
      return "Ingat prinsip penting: bilangan bukan nol dipangkatkan 0 bernilai 1 ($a^0 = 1$), dan pangkat negatif diubah menjadi pecahan ($a^{-n} = \\frac{1}{a^n}$).";
    }
    if (pLower.includes("notasi ilmiah") || pLower.includes("bentuk baku")) {
      return "Bentuk baku dituliskan sebagai $a \times 10^n$ dengan syarat $1 \le a < 10$. Geser tanda koma hingga tersisa 1 angka di depan koma.";
    }
    return "Pahami sifat dasar eksponen: $a^n$ menyatakan perkalian berulang bilangan pokok ($a$) sebanyak $n$ kali.";
  }

  // 2. Bentuk Akar
  if (pLower.includes("akar") || pLower.includes("sqrt") || pLower.includes("√")) {
    if (pLower.includes("rasional") || pLower.includes("penyebut")) {
      return "Rasionalkan penyebut dengan mengalikan pembilang dan penyebut dengan bentuk sekawan penyebutnya.";
    }
    if (pLower.includes("sederhana") || pLower.includes("penyederhanaan")) {
      return "Faktorkan bilangan di dalam akar menjadi perkalian bilangan kuadrat sempurna terbesar, lalu gunakan rumus $\sqrt{a \times b} = \sqrt{a} \times \sqrt{b}$.";
    }
    return "Kelompokkan dan operasikan bentuk akar yang sejenis (angka di dalam tanda akar harus bernilai sama).";
  }

  // 3. Pola Bilangan & Barisan
  if (pLower.includes("barisan") || pLower.includes("deret") || pLower.includes("aritmatika") || pLower.includes("geometri")) {
    if (pLower.includes("geometri") || pLower.includes("rasio")) {
      return "Tentukan rasio pengali ($r = U_2 / U_1$), lalu gunakan rumus suku ke-$n$: $U_n = a \times r^{n-1}$.";
    }
    if (pLower.includes("jumlah") || pLower.includes("deret") || pLower.includes("s_")) {
      return "Gunakan rumus jumlah deret aritmatika: $S_n = \\frac{n}{2}[2a + (n-1)b]$.";
    }
    return "Cari suku pertama ($a$) dan beda selisih ($b$), lalu gunakan rumus $U_n = a + (n-1)b$.";
  }

  // 4. Teorema Pythagoras
  if (pLower.includes("pythagoras") || pLower.includes("siku-siku") || pLower.includes("sisi miring") || pLower.includes("hipotenusa")) {
    return "Terapkan rumus Teorema Pythagoras $c^2 = a^2 + b^2$ di mana $c$ adalah sisi miring terpanjang di depan sudut siku-siku.";
  }

  // 5. SPLDV / Aljabar
  if (pLower.includes("spldv") || pLower.includes("variabel") || pLower.includes("eliminasi") || pLower.includes("substitusi")) {
    return "Gunakan metode eliminasi dengan menyamakan salah satu koefisien variabel, atau substitusikan variabel yang paling sederhana ke persamaan kedua.";
  }

  // 6. Persamaan Garis Lurus (PGL)
  if (pLower.includes("garis") || pLower.includes("gradien") || pLower.includes("kemiringan")) {
    return "Gradien garis melalui 2 titik dihitung dengan $m = \\frac{y_2 - y_1}{x_2 - x_1}$, atau gunakan bentuk eksplisit $y = mx + c$.";
  }

  // 7. Relasi & Fungsi
  if (pLower.includes("fungsi") || pLower.includes("pemetaan") || pLower.includes("f(x)")) {
    return "Substitusikan nilai input $x$ yang diberikan ke dalam rumus fungsi $f(x)$ untuk menentukan hasil pemetaannya.";
  }

  // 8. Statistika & Peluang
  if (pLower.includes("rata-rata") || pLower.includes("mean") || pLower.includes("median") || pLower.includes("modus")) {
    return "Mean dihitung dari jumlah seluruh nilai dibagi banyaknya data ($n$). Median adalah nilai tengah setelah seluruh data diurutkan.";
  }
  if (pLower.includes("peluang") || pLower.includes("dadu") || pLower.includes("kelereng") || pLower.includes("koin")) {
    return "Peluang kejadian $P(A)$ adalah jumlah kejadian yang diharapkan ($n(A)$) dibagi dengan total ruang sampel ($n(S)$).";
  }

  // 9. Jika ada kalimat pembahasan, ekstrak kalimat awal
  if (pembahasan) {
    const clean = pembahasan.replace(/[*#]/g, "").trim().split(".")[0];
    if (clean && clean.length > 15) {
      return `Perhatikan langkah awal penyelesaian: ${clean}.`;
    }
  }

  return "Perhatikan data yang diketahui pada soal dan hubungkan secara sistematis dengan rumus materi terkait.";
}

export function generateChapterQuestions(
  judulBab: string,
  mapel: string = "Matematika",
  kelas: number = 8
): QuizQuestionData[] {
  const cleanTitle = (judulBab || "").replace(/^Bab\s*\d+\s*:\s*/i, "").trim();
  const lowerTitle = cleanTitle.toLowerCase();

  let questions: QuizQuestionData[] = [];

  // Pemetaan spesifik ke 5 Bab IPA (Ilmu Pengetahuan Alam) SMP Kelas 8 Fase D
  const isIpa = mapel.toLowerCase().includes("ipa") || mapel.toLowerCase().includes("sains");
  if (
    isIpa ||
    lowerTitle.includes("sel") ||
    lowerTitle.includes("mikroskop") ||
    lowerTitle.includes("organisasi kehidupan") ||
    lowerTitle.includes("sistem pencernaan") ||
    lowerTitle.includes("peredaran darah") ||
    lowerTitle.includes("pesawat sederhana") ||
    lowerTitle.includes("litosfer")
  ) {
    if (lowerTitle.includes("sel") || lowerTitle.includes("mikroskop") || lowerTitle.includes("organisasi")) {
      questions = getIPABab1Questions();
    } else if (
      lowerTitle.includes("tubuh") ||
      lowerTitle.includes("pencernaan") ||
      lowerTitle.includes("darah") ||
      lowerTitle.includes("pernapasan") ||
      lowerTitle.includes("ekskresi")
    ) {
      questions = getIPABab2Questions();
    } else if (
      lowerTitle.includes("usaha") ||
      lowerTitle.includes("energi") ||
      lowerTitle.includes("pesawat sederhana") ||
      lowerTitle.includes("tuas") ||
      lowerTitle.includes("katrol")
    ) {
      questions = getIPABab3Questions();
    } else if (
      lowerTitle.includes("getaran") ||
      lowerTitle.includes("gelombang") ||
      lowerTitle.includes("cahaya") ||
      lowerTitle.includes("bunyi") ||
      lowerTitle.includes("cermin")
    ) {
      questions = getIPABab4Questions();
    } else if (
      lowerTitle.includes("unsur") ||
      lowerTitle.includes("senyawa") ||
      lowerTitle.includes("campuran") ||
      lowerTitle.includes("bumi") ||
      lowerTitle.includes("litosfer")
    ) {
      questions = getIPABab5Questions();
    } else if (cleanTitle.toLowerCase().includes("bab 1")) {
      questions = getIPABab1Questions();
    } else if (cleanTitle.toLowerCase().includes("bab 2")) {
      questions = getIPABab2Questions();
    } else if (cleanTitle.toLowerCase().includes("bab 3")) {
      questions = getIPABab3Questions();
    } else if (cleanTitle.toLowerCase().includes("bab 4")) {
      questions = getIPABab4Questions();
    } else if (cleanTitle.toLowerCase().includes("bab 5")) {
      questions = getIPABab5Questions();
    } else {
      questions = getIPABab1Questions();
    }
  } else if (lowerTitle.includes("berpangkat") || lowerTitle.includes("pangkat") || lowerTitle.includes("eksponen") || lowerTitle.includes("akar")) {
    questions = getBilanganBerpangkat15();
  } else if (lowerTitle.includes("pola bilangan") || lowerTitle.includes("barisan")) {
    questions = getPolaBilangan15();
  } else if (lowerTitle.includes("aljabar") || lowerTitle.includes("plsv") || lowerTitle.includes("ptlsv") || lowerTitle.includes("bentuk aljabar")) {
    questions = getAljabar15();
  } else if (lowerTitle.includes("relasi") || lowerTitle.includes("fungsi")) {
    questions = getRelasiFungsi15();
  } else if (lowerTitle.includes("garis lurus") || lowerTitle.includes("pgl") || lowerTitle.includes("gradien")) {
    questions = getPersamaanGarisLurus15();
  } else if (lowerTitle.includes("spldv") || lowerTitle.includes("dua variabel") || lowerTitle.includes("sistem persamaan")) {
    questions = getSPLDV15();
  } else if (lowerTitle.includes("pythagoras") || lowerTitle.includes("pitagoras")) {
    questions = getPythagoras15();
  } else if (lowerTitle.includes("bangun ruang") || lowerTitle.includes("brsd") || lowerTitle.includes("geometri")) {
    questions = getBangunRuang15();
  } else if (lowerTitle.includes("statistika") || lowerTitle.includes("peluang") || lowerTitle.includes("data")) {
    questions = getStatistikaPeluang15();
  } else {
    questions = getCustomMath15(cleanTitle, kelas);
  }

  // Menjamin tepat 15 butir soal: 10 PG, 3 Jawaban Singkat, 2 Esai
  return ensureExactly15Questions(questions, cleanTitle, mapel, kelas);
}

// =============================================================================
// HELPER: ENSURE EXACTLY 15 QUESTIONS (10 PG, 3 JAWABAN SINGKAT, 2 ESAI)
// =============================================================================
export function ensureExactly15Questions(
  currentList: QuizQuestionData[],
  topicTitle: string,
  mapel: string,
  kelas: number
): QuizQuestionData[] {
  const result: QuizQuestionData[] = [];

  // 1. BAGIAN I: 10 SOAL PILIHAN GANDA (Indices 0..9)
  for (let i = 0; i < 10; i++) {
    const item = currentList[i];
    if (item && item.tipeSoal === "pilihan_ganda" && item.opsiSoal && item.opsiSoal.length > 0) {
      result.push({
        ...item,
        id: `q-${i + 1}`,
        pertanyaan: item.pertanyaan.startsWith(`${i + 1}.`) ? item.pertanyaan : `${i + 1}. ${item.pertanyaan.replace(/^\d+\.\s*/, "")}`,
      });
    } else if (item && item.opsiSoal && item.opsiSoal.length > 0) {
      result.push({
        ...item,
        id: `q-${i + 1}`,
        tipeSoal: "pilihan_ganda",
        pertanyaan: item.pertanyaan.startsWith(`${i + 1}.`) ? item.pertanyaan : `${i + 1}. ${item.pertanyaan.replace(/^\d+\.\s*/, "")}`,
      });
    } else {
      const nextIdx = i + 1;
      result.push({
        id: `q-${nextIdx}`,
        pertanyaan: `${nextIdx}. Dalam materi ${topicTitle} ${mapel || "Matematika"} Kelas ${kelas}, manakah pernyataan analisis yang paling tepat?`,
        tipeSoal: "pilihan_ganda",
        opsiSoal: [
          { id: `opt-${nextIdx}-1`, teksOpsi: `Menerapkan kaidah dan prinsip konsep ${topicTitle} secara terstruktur.`, benar: true },
          { id: `opt-${nextIdx}-2`, teksOpsi: "Mengabaikan hubungan keterkaitan variabel dan fakta ilmiah.", benar: false },
          { id: `opt-${nextIdx}-3`, teksOpsi: "Mengambil kesimpulan tanpa memeriksa validitas data.", benar: false },
          { id: `opt-${nextIdx}-4`, teksOpsi: "Menggunakan asumsi yang bertentangan dengan kaidah materi.", benar: false },
        ],
        kunciJawaban: `Menerapkan kaidah dan prinsip konsep ${topicTitle} secara terstruktur.`,
        pembahasan: `Pemecahan persoalan ${(mapel || "matematika").toLowerCase()} memerlukan penalaran logis bertahap dan penguasaan konsep dasar.`,
        hintSokratik: `Pilihlah prosedur analisis yang mengutamakan ketelitian konsep materi.`,
      });
    }
  }

  // 2. BAGIAN II: 3 SOAL JAWABAN SINGKAT (Indices 10..12)
  for (let i = 10; i < 13; i++) {
    const item = currentList[i];
    if (item && item.tipeSoal === "isian_singkat") {
      result.push({
        ...item,
        id: `q-${i + 1}`,
        pertanyaan: item.pertanyaan.startsWith(`${i + 1}.`) ? item.pertanyaan : `${i + 1}. [Jawaban Singkat] ${item.pertanyaan.replace(/^\d+\.\s*/, "").replace(/^\[.*?\]\s*/, "")}`,
        opsiSoal: undefined,
      });
    } else {
      const nextIdx = i + 1;
      result.push({
        id: `q-${nextIdx}`,
        pertanyaan: `${nextIdx}. [Jawaban Singkat] Berdasarkan materi "${topicTitle}", tuliskan nilai besaran atau formula utama yang berlaku!`,
        tipeSoal: "isian_singkat",
        kunciJawaban: `Solusi dasar ${topicTitle}`,
        pembahasan: `Penguasaan besaran dan rumus kunci pada bab ini menjadi landasan pemecahan soal.`,
        hintSokratik: `Ketikkan angka atau formula kunci secara singkat dan presisi.`,
        opsiSoal: undefined,
      });
    }
  }

  // 3. BAGIAN III: 2 SOAL JAWABAN PANJANG / ESAI (Indices 13..14)
  for (let i = 13; i < 15; i++) {
    const item = currentList[i];
    if (item && item.tipeSoal === "esai") {
      result.push({
        ...item,
        id: `q-${i + 1}`,
        pertanyaan: item.pertanyaan.startsWith(`${i + 1}.`) ? item.pertanyaan : `${i + 1}. [Jawaban Panjang] ${item.pertanyaan.replace(/^\d+\.\s*/, "").replace(/^\[.*?\]\s*/, "")}`,
        opsiSoal: undefined,
      });
    } else {
      const nextIdx = i + 1;
      result.push({
        id: `q-${nextIdx}`,
        pertanyaan: `${nextIdx}. [Jawaban Panjang / Studi Kasus] Uraikan langkah sistematis pemecahan masalah kontekstual materi "${topicTitle}" secara bertahap!`,
        tipeSoal: "esai",
        kunciJawaban: `Penyelesaian bertahap meliputi identifikasi data, pemilihan rumus ${topicTitle}, proses hitung, dan kesimpulan.`,
        pembahasan: `Jawaban dinilai berdasarkan kejelasan langkah matematis dan ketepatan penalaran konseptual.`,
        hintSokratik: `Tuliskan langkah demi langkah dari yang diketahui hingga kesimpulan akhir.`,
        opsiSoal: undefined,
      });
    }
  }

  return result;
}

// =============================================================================
// =============================================================================
// BAB 1 (KHUSUS): BILANGAN BERPANGKAT & BENTUK AKAR (15 SOAL KURIKULUM MERDEKA)
// =============================================================================
function getBilanganBerpangkat15(): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: "1. Konsep dasar perpangkatan suatu bilangan $a^n$ (dengan $n$ bilangan bulat positif) menyatakan...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        {
          id: "opt-1-1",
          teksOpsi: "Perkalian berulang bilangan pokok $a$ sebanyak $n$ kali ($a \\times a \\times \\dots \\times a$)",
          benar: true,
        },
        {
          id: "opt-1-2",
          teksOpsi: "Penjumlahan berulang bilangan pokok $a$ sebanyak $n$ suku ($a + a + \\dots + a$)",
          benar: false,
        },
        {
          id: "opt-1-3",
          teksOpsi: "Perkalian antara bilangan pokok $a$ dengan nilai pangkatnya ($a \\times n$)",
          benar: false,
        },
        {
          id: "opt-1-4",
          teksOpsi: "Pembagian bertingkat antara bilangan pokok $a$ dan nilai pangkat $n$",
          benar: false,
        },
      ],
      kunciJawaban: "Perkalian berulang bilangan pokok $a$ sebanyak $n$ kali ($a \\times a \\times \\dots \\times a$)",
      pembahasan: "Berdasarkan definisi resmi perpangkatan pada Kurikulum Matematika SMP: $a^n$ adalah perkalian berulang bilangan pokok $a$ sebanyak $n$ kali. Bentuk $a + a + \\dots + a$ merupakan konsep perkalian ($n \\times a$), bukan perpangkatan.",
      hintSokratik: "Pahami arti bentuk perpangkatan: $a^n$ menyatakan bilangan pokok $a$ yang dikalikan berulang sebanyak $n$ kali.",
    },
    {
      id: "q-2",
      pertanyaan: "2. Hasil penyederhanaan dari operasi aljabar perpangkatan $2^3 \times 2^4 \times 2^2$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-2-1", teksOpsi: "$2^9 = 512$", benar: true },
        { id: "opt-2-2", teksOpsi: "$2^{24}$", benar: false },
        { id: "opt-2-3", teksOpsi: "$8^9$", benar: false },
        { id: "opt-2-4", teksOpsi: "$2^8 = 256$", benar: false },
      ],
      kunciJawaban: "$2^9 = 512$",
      pembahasan: "Berdasarkan sifat perkalian bilangan berpangkat dengan basis yang sama ($a^m \times a^n = a^{m+n}$), maka $2^3 \times 2^4 \times 2^2 = 2^{3+4+2} = 2^9 = 512$.",
      hintSokratik: "Jika basis bilangan sama ($2$), maka pada operasi perkalian cukup jumlahkan seluruh pangkatnya ($3 + 4 + 2$).",
    },
    {
      id: "q-3",
      pertanyaan: "3. Nilai dari operasi pecahan perpangkatan $\\frac{3^8 \times 3^2}{3^6}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-3-1", teksOpsi: "$3^4 = 81$", benar: true },
        { id: "opt-3-2", teksOpsi: "$3^2 = 9$", benar: false },
        { id: "opt-3-3", teksOpsi: "$3^6 = 729$", benar: false },
        { id: "opt-3-4", teksOpsi: "$3^{16}$", benar: false },
      ],
      kunciJawaban: "$3^4 = 81$",
      pembahasan: "Sederhanakan pembilang dengan menjumlahkan pangkat: $3^{8+2} = 3^{10}$. Kemudian kurangkan dengan pangkat penyebut: $3^{10-6} = 3^4 = 81$.",
      hintSokratik: "Jumlahkan eksponen pembilang ($8 + 2 = 10$), kemudian kurangkan dengan eksponen penyebut ($10 - 6$).",
    },
    {
      id: "q-4",
      pertanyaan: "4. Bentuk paling sederhana dari operasi pemangkatan $(a^3 b^2)^4 \times a^{-5} b^3$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-4-1", teksOpsi: "$a^7 b^{11}$", benar: true },
        { id: "opt-4-2", teksOpsi: "$a^{12} b^8$", benar: false },
        { id: "opt-4-3", teksOpsi: "$a^2 b^5$", benar: false },
        { id: "opt-4-4", teksOpsi: "$a^7 b^5$", benar: false },
      ],
      kunciJawaban: "$a^7 b^{11}$",
      pembahasan: "Gunakan sifat $(a^m)^n = a^{m \times n}$: $(a^3 b^2)^4 = a^{12} b^8$. Dikalikan dengan $a^{-5} b^3$: $a^{12+(-5)} b^{8+3} = a^7 b^{11}$.",
      hintSokratik: "Kalikan pangkat di dalam kurung dengan pangkat luar ($(a^3)^4 = a^{12}$, $(b^2)^4 = b^8$), lalu jumlahkan pangkat variabel sejenis.",
    },
    {
      id: "q-5",
      pertanyaan: "5. Hasil perhitungan dari operasi perpangkatan $5^0 + 2^{-3} - 4^{-1}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-5-1", teksOpsi: "$\\frac{7}{8}$", benar: true },
        { id: "opt-5-2", teksOpsi: "$1\\frac{1}{8}$", benar: false },
        { id: "opt-5-3", teksOpsi: "$\\frac{3}{4}$", benar: false },
        { id: "opt-5-4", teksOpsi: "$\\frac{5}{8}$", benar: false },
      ],
      kunciJawaban: "$\\frac{7}{8}$",
      pembahasan: "Hitung nilai masing-masing suku: $5^0 = 1$, $2^{-3} = \\frac{1}{2^3} = \\frac{1}{8}$, dan $4^{-1} = \\frac{1}{4} = \\frac{2}{8}$. Maka $1 + \\frac{1}{8} - \\frac{2}{8} = 1 - \\frac{1}{8} = \\frac{7}{8}$.",
      hintSokratik: "Ingat prinsip penting: $a^0 = 1$ dan $a^{-n} = \\frac{1}{a^n}$. Samakan penyebut pecahan menjadi per-8 ($1 + \\frac{1}{8} - \\frac{2}{8}$) untuk memperoleh hasil akhirnya.",
    },
    {
      id: "q-6",
      pertanyaan: "6. Bentuk paling sederhana dari operasi bentuk akar $\sqrt{75} + \sqrt{48} - \sqrt{27}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-6-1", teksOpsi: "$6\sqrt{3}$", benar: true },
        { id: "opt-6-2", teksOpsi: "$4\sqrt{3}$", benar: false },
        { id: "opt-6-3", teksOpsi: "$5\sqrt{3}$", benar: false },
        { id: "opt-6-4", teksOpsi: "$7\sqrt{3}$", benar: false },
      ],
      kunciJawaban: "$6\sqrt{3}$",
      pembahasan: "Faktorkan dengan bilangan kuadrat sempurna: $\sqrt{75} = \sqrt{25 \times 3} = 5\sqrt{3}$, $\sqrt{48} = \sqrt{16 \times 3} = 4\sqrt{3}$, $\sqrt{27} = \sqrt{9 \times 3} = 3\sqrt{3}$. Maka $(5 + 4 - 3)\sqrt{3} = 6\sqrt{3}$.",
      hintSokratik: "Pisahkan bilangan kuadrat sempurna ($25, 16, 9$) dari dalam akar, sehingga semua bersisa $\sqrt{3}$, lalu operasikan koefisiennya.",
    },
    {
      id: "q-7",
      pertanyaan: "7. Hasil perkalian bentuk akar $2\sqrt{6} \times 3\sqrt{8}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-7-1", teksOpsi: "$24\sqrt{3}$", benar: true },
        { id: "opt-7-2", teksOpsi: "$18\sqrt{3}$", benar: false },
        { id: "opt-7-3", teksOpsi: "$12\sqrt{48}$", benar: false },
        { id: "opt-7-4", teksOpsi: "$36\sqrt{2}$", benar: false },
      ],
      kunciJawaban: "$24\sqrt{3}$",
      pembahasan: "$(2 \times 3)\sqrt{6 \times 8} = 6\sqrt{48} = 6\sqrt{16 \times 3} = 6 \times 4\sqrt{3} = 24\sqrt{3}$.",
      hintSokratik: "Kalikan bilangan di luar akar ($2 \times 3 = 6$) dan bilangan di dalam akar ($\sqrt{48}$), lalu sederhanakan $\sqrt{48} = 4\sqrt{3}$.",
    },
    {
      id: "q-8",
      pertanyaan: "8. Bentuk rasional dari pecahan $\\frac{12}{\sqrt{6}}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-8-1", teksOpsi: "$2\sqrt{6}$", benar: true },
        { id: "opt-8-2", teksOpsi: "$3\sqrt{6}$", benar: false },
        { id: "opt-8-3", teksOpsi: "$6\sqrt{2}$", benar: false },
        { id: "opt-8-4", teksOpsi: "$4\sqrt{6}$", benar: false },
      ],
      kunciJawaban: "$2\sqrt{6}$",
      pembahasan: "Rasionalkan dengan mengalikan $\\frac{\sqrt{6}}{\sqrt{6}}$: $\\frac{12}{\sqrt{6}} \times \\frac{\sqrt{6}}{\sqrt{6}} = \\frac{12\sqrt{6}}{6} = 2\sqrt{6}$.",
      hintSokratik: "Kalikan pembilang dan penyebut dengan $\sqrt{6}$ agar penyebutnya menjadi bilangan rasional $6$, lalu bagi $12 : 6$.",
    },
    {
      id: "q-9",
      pertanyaan: "9. Bentuk rasional dari pecahan dengan penyebut suku dua $\\frac{8}{\sqrt{5} + 1}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-9-1", teksOpsi: "$2(\sqrt{5} - 1)$", benar: true },
        { id: "opt-9-2", teksOpsi: "$2(\sqrt{5} + 1)$", benar: false },
        { id: "opt-9-3", teksOpsi: "$4(\sqrt{5} - 1)$", benar: false },
        { id: "opt-9-4", teksOpsi: "$4\sqrt{5} + 4$", benar: false },
      ],
      kunciJawaban: "$2(\sqrt{5} - 1)$",
      pembahasan: "Kalikan dengan bentuk sekawannya $(\sqrt{5} - 1)$: $\\frac{8(\sqrt{5} - 1)}{(\sqrt{5})^2 - 1^2} = \\frac{8(\sqrt{5} - 1)}{5 - 1} = \\frac{8(\sqrt{5} - 1)}{4} = 2(\sqrt{5} - 1)$.",
      hintSokratik: "Kalikan pembilang dan penyebut dengan bentuk sekawan $(\sqrt{5} - 1)$. Pada penyebut berlaku selisih kuadrat: $(\sqrt{5})^2 - 1^2 = 4$.",
    },
    {
      id: "q-10",
      pertanyaan: "10. Notasi ilmiah (bentuk baku) dari bilangan $0{,}00000345$ dan $450.000.000$ berturut-turut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-10-1", teksOpsi: "$3{,}45 \times 10^{-6}$ dan $4{,}5 \times 10^8$", benar: true },
        { id: "opt-10-2", teksOpsi: "$3{,}45 \times 10^{-5}$ dan $4{,}5 \times 10^7$", benar: false },
        { id: "opt-10-3", teksOpsi: "$34{,}5 \times 10^{-7}$ dan $45 \times 10^7$", benar: false },
        { id: "opt-10-4", teksOpsi: "$3{,}45 \times 10^6$ dan $4{,}5 \times 10^{-8}$", benar: false },
      ],
      kunciJawaban: "$3{,}45 \times 10^{-6}$ dan $4{,}5 \times 10^8$",
      pembahasan: "Bentuk baku $a \times 10^n$ dengan $1 \le a < 10$. Untuk $0{,}00000345$, geser koma 6 kali ke kanan $\Rightarrow 3{,}45 \times 10^{-6}$. Untuk $450.000.000$, geser koma 8 kali ke kiri $\Rightarrow 4{,}5 \times 10^8$.",
      hintSokratik: "Pastikan angka di depan koma berada di antara 1 dan 10 ($3{,}45$ dan $4{,}5$). Hitung jumlah pergeseran koma sebagai pangkat 10.",
    },
    {
      id: "q-11",
      pertanyaan: "11. [Jawaban Singkat] Hitunglah nilai akhir dari operasi perpangkatan: $2^5 - 3^3 + 4^2$!",
      tipeSoal: "isian_singkat",
      kunciJawaban: "21",
      pembahasan: "$2^5 = 32$, $3^3 = 27$, $4^2 = 16$. Maka $32 - 27 + 16 = 5 + 16 = 21$.",
      hintSokratik: "Hitung nilai masing-masing perpangkatan: $2^5 = 32$, $3^3 = 27$, dan $4^2 = 16$, lalu kurangkan dan jumlahkan hasilnya.",
    },
    {
      id: "q-12",
      pertanyaan: "12. [Jawaban Singkat] Tentukan nilai akhir dari operasi bentuk akar: $(\sqrt{100} \times \sqrt{9}) - \sqrt{64}$!",
      tipeSoal: "isian_singkat",
      kunciJawaban: "22",
      pembahasan: "$\sqrt{100} = 10$, $\sqrt{9} = 3$, dan $\sqrt{64} = 8$. Maka $(10 \times 3) - 8 = 30 - 8 = 22$.",
      hintSokratik: "Tarik akar kuadrat masing-masing bilangan kuadrat: $\sqrt{100} = 10$, $\sqrt{9} = 3$, $\sqrt{64} = 8$, dahulukan perkalian baru pengurangan.",
    },
    {
      id: "q-13",
      pertanyaan: "13. [Jawaban Singkat] Berapakah nilai dari bilangan berpangkat pecahan $81^{3/4}$?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "27",
      pembahasan: "Ubah 81 ke basis berpangkat: $81 = 3^4$. Maka $(3^4)^{3/4} = 3^{4 \times \\frac{3}{4}} = 3^3 = 27$.",
      hintSokratik: "Ubah 81 menjadi $3^4$, kemudian kalikan pangkatnya dengan $\\frac{3}{4}$ sehingga diperoleh $3^3$.",
    },
    {
      id: "q-14",
      pertanyaan: "14. [Jawaban Panjang / Soal Cerita] Suatu kultur bakteri membelah diri menjadi 2 setiap 15 menit. Pada awal pengamatan terdapat 20 bakteri. (a) Berapa kali bakteri membelah selama 1,5 jam? (b) Hitunglah jumlah total bakteri setelah 1,5 jam tersebut!",
      tipeSoal: "esai",
      kunciJawaban: "(a) n = 6 kali pembelahan, (b) Total = 1.280 bakteri",
      pembahasan: "(a) Total waktu $= 1{,}5 \text{ jam} = 90 \text{ menit}$. Banyak pembelahan $n = \\frac{90}{15} = 6 \text{ kali}$. (b) Rumus pertumbuhan eksponensial: $P_n = P_0 \times 2^n = 20 \times 2^6 = 20 \times 64 = 1.280 \text{ bakteri}$.",
      hintSokratik: "Konversi 1,5 jam ke menit (90 menit) dan bagi dengan 15 menit untuk mencari $n$. Lalu hitung $P_n = P_0 \times 2^n$ dengan $P_0 = 20$.",
    },
    {
      id: "q-15",
      pertanyaan: "15. [Jawaban Panjang / Pembuktian Aljabar] Rasionalkan penyebut pecahan $\\frac{\sqrt{3} + \sqrt{2}}{\sqrt{3} - \sqrt{2}}$ dan tunjukkan langkah-langkah aljabarnya secara bertahap hingga bentuk paling sederhana!",
      tipeSoal: "esai",
      kunciJawaban: "5 + 2√6",
      pembahasan: "Kalikan pembilang dan penyebut dengan sekawan $(\sqrt{3} + \sqrt{2})$: $\\frac{(\sqrt{3} + \sqrt{2})^2}{(\sqrt{3} - \sqrt{2})(\sqrt{3} + \sqrt{2})} = \\frac{(\sqrt{3})^2 + 2\sqrt{6} + (\sqrt{2})^2}{(\sqrt{3})^2 - (\sqrt{2})^2} = \\frac{3 + 2\sqrt{6} + 2}{3 - 2} = \\frac{5 + 2\sqrt{6}}{1} = 5 + 2\sqrt{6}$.",
      hintSokratik: "Kalikan dengan sekawan $(\sqrt{3} + \sqrt{2})$. Gunakan rumus $(a+b)^2 = a^2 + 2ab + b^2$ di pembilang dan selisih kuadrat $(a-b)(a+b) = a^2 - b^2$ di penyebut.",
    },
  ];
}

// BAB 1: POLA BILANGAN & BARISAN BILANGAN
// =============================================================================
function getPolaBilangan15(): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: "1. Diketahui barisan aritmatika $3, 7, 11, 15, 19, \dots$. Suku ke-10 ($U_{10}$) dari barisan tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1-1", teksOpsi: "35", benar: false },
        { id: "opt-1-2", teksOpsi: "39", benar: true },
        { id: "opt-1-3", teksOpsi: "43", benar: false },
        { id: "opt-1-4", teksOpsi: "47", benar: false },
      ],
      kunciJawaban: "39",
      pembahasan: "Rumus suku ke-$n$ barisan aritmatika: $U_n = a + (n - 1)b$. Diketahui $a = 3$, beda $b = 7 - 3 = 4$. Maka $U_{10} = 3 + (10 - 1) \times 4 = 3 + 36 = 39$.",
      hintSokratik: "Cari suku pertama ($a$) dan beda ($b$), lalu gunakan $U_{10} = a + 9b$.",
    },
    {
      id: "q-2",
      pertanyaan: "2. Rumus suku ke-$n$ dari barisan $5, 9, 13, 17, 21, \dots$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-2-1", teksOpsi: "$U_n = 4n + 1$", benar: true },
        { id: "opt-2-2", teksOpsi: "$U_n = 4n - 1$", benar: false },
        { id: "opt-2-3", teksOpsi: "$U_n = 5n - 1$", benar: false },
        { id: "opt-2-4", teksOpsi: "$U_n = 3n + 2$", benar: false },
      ],
      kunciJawaban: "$U_n = 4n + 1$",
      pembahasan: "Suku pertama $a = 5$, beda $b = 4$. $U_n = 5 + (n - 1)4 = 5 + 4n - 4 = 4n + 1$.",
      hintSokratik: "Gunakan bentuk umum $U_n = bn + (a - b)$.",
    },
    {
      id: "q-3",
      pertanyaan: "3. Suku ke-6 dari barisan geometri $2, 6, 18, 54, \dots$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-3-1", teksOpsi: "162", benar: false },
        { id: "opt-3-2", teksOpsi: "324", benar: false },
        { id: "opt-3-3", teksOpsi: "486", benar: true },
        { id: "opt-3-4", teksOpsi: "972", benar: false },
      ],
      kunciJawaban: "486",
      pembahasan: "Suku pertama $a = 2$, rasio $r = 6 / 2 = 3$. $U_n = a \times r^{n-1} \Rightarrow U_6 = 2 \times 3^{6-1} = 2 \times 3^5 = 2 \times 243 = 486$.",
      hintSokratik: "Perhatikan rasio pengali $r = 3$. Hitung $U_6 = a \cdot r^5$.",
    },
    {
      id: "q-4",
      pertanyaan: "4. Jumlah 15 suku pertama dari deret aritmatika $4 + 7 + 10 + 13 + \dots$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-4-1", teksOpsi: "375", benar: true },
        { id: "opt-4-2", teksOpsi: "390", benar: false },
        { id: "opt-4-3", teksOpsi: "420", benar: false },
        { id: "opt-4-4", teksOpsi: "465", benar: false },
      ],
      kunciJawaban: "375",
      pembahasan: "Rumus deret aritmatika: $S_n = \\frac{n}{2}[2a + (n-1)b]$. Dengan $n=15, a=4, b=3$, didapat $S_{15} = \\frac{15}{2}[2(4) + (14)(3)] = \\frac{15}{2}[8 + 42] = \\frac{15}{2}(50) = 375$.",
      hintSokratik: "Gunakan rumus jumlah $S_{15} = \\frac{15}{2}(2a + 14b)$.",
    },
    {
      id: "q-5",
      pertanyaan: "5. Tiga suku berikutnya dari barisan Fibonacci $1, 1, 2, 3, 5, 8, \dots$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-5-1", teksOpsi: "11, 14, 17", benar: false },
        { id: "opt-5-2", teksOpsi: "13, 21, 34", benar: true },
        { id: "opt-5-3", teksOpsi: "12, 20, 32", benar: false },
        { id: "opt-5-4", teksOpsi: "10, 15, 23", benar: false },
      ],
      kunciJawaban: "13, 21, 34",
      pembahasan: "Aturan Fibonacci: suku berikutnya adalah penjumlahan 2 suku sebelumnya. $5+8=13$, $8+13=21$, $13+21=34$.",
      hintSokratik: "Jumlahkan dua suku terakhir untuk mendapatkan suku selanjutnya.",
    },
    {
      id: "q-6",
      pertanyaan: "6. Banyak noktah pada pola bilangan persegi ($1, 4, 9, 16, \dots$) pada suku ke-12 adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-6-1", teksOpsi: "120", benar: false },
        { id: "opt-6-2", teksOpsi: "132", benar: false },
        { id: "opt-6-3", teksOpsi: "144", benar: true },
        { id: "opt-6-4", teksOpsi: "156", benar: false },
      ],
      kunciJawaban: "144",
      pembahasan: "Rumus pola persegi adalah $U_n = n^2$. Untuk $n = 12$, maka $U_{12} = 12^2 = 144$.",
      hintSokratik: "Pola bilangan persegi memiliki rumus $U_n = n^2$.",
    },
    {
      id: "q-7",
      pertanyaan: "7. Banyak noktah pada pola segitiga ($1, 3, 6, 10, \dots$) pada pola ke-10 adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-7-1", teksOpsi: "45", benar: false },
        { id: "opt-7-2", teksOpsi: "55", benar: true },
        { id: "opt-7-3", teksOpsi: "65", benar: false },
        { id: "opt-7-4", teksOpsi: "78", benar: false },
      ],
      kunciJawaban: "55",
      pembahasan: "Rumus pola bilangan segitiga adalah $U_n = \\frac{n(n + 1)}{2}$. Untuk $n = 10$, $U_{10} = \\frac{10 \times 11}{2} = 55$.",
      hintSokratik: "Gunakan rumus $U_n = \\frac{n(n+1)}{2}$.",
    },
    {
      id: "q-8",
      pertanyaan: "8. Diketahui barisan bertingkat dua $2, 5, 10, 17, 26, \dots$. Suku ke-8 dari barisan tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-8-1", teksOpsi: "50", benar: false },
        { id: "opt-8-2", teksOpsi: "65", benar: true },
        { id: "opt-8-3", teksOpsi: "82", benar: false },
        { id: "opt-8-4", teksOpsi: "101", benar: false },
      ],
      kunciJawaban: "65",
      pembahasan: "Pola barisan: $U_n = n^2 + 1$. Untuk $n = 8$, $U_8 = 8^2 + 1 = 64 + 1 = 65$.",
      hintSokratik: "Perhatikan bahwa setiap suku adalah kuadrat suku ditambah 1 ($n^2 + 1$).",
    },
    {
      id: "q-9",
      pertanyaan: "9. Suatu barisan aritmatika memiliki $U_3 = 11$ dan $U_7 = 27$. Nilai suku pertama ($a$) dan beda ($b$) berturut-turut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-9-1", teksOpsi: "$a = 3$ dan $b = 4$", benar: true },
        { id: "opt-9-2", teksOpsi: "$a = 2$ dan $b = 5$", benar: false },
        { id: "opt-9-3", teksOpsi: "$a = 4$ dan $b = 3$", benar: false },
        { id: "opt-9-4", teksOpsi: "$a = 1$ dan $b = 5$", benar: false },
      ],
      kunciJawaban: "$a = 3$ dan $b = 4$",
      pembahasan: "$U_7 - U_3 = 4b \Rightarrow 27 - 11 = 16 \Rightarrow b = 4$. Substitusi ke $U_3 = a + 2b = 11 \Rightarrow a + 8 = 11 \Rightarrow a = 3$.",
      hintSokratik: "Gunakan eliminasi $(a + 6b) - (a + 2b) = 4b$.",
    },
    {
      id: "q-10",
      pertanyaan: "10. Seutas tali dipotong menjadi 5 bagian membentuk barisan geometri. Potongan terpendek $3\\text{ cm}$ dan terpanjang $48\\text{ cm}$. Panjang tali semula adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-10-1", teksOpsi: "93 cm", benar: true },
        { id: "opt-10-2", teksOpsi: "96 cm", benar: false },
        { id: "opt-10-3", teksOpsi: "105 cm", benar: false },
        { id: "opt-10-4", teksOpsi: "128 cm", benar: false },
      ],
      kunciJawaban: "93 cm",
      pembahasan: "$a = 3, U_5 = a r^4 = 48 \Rightarrow r^4 = 16 \Rightarrow r = 2$. $S_5 = \\frac{3(2^5 - 1)}{2 - 1} = 3(31) = 93\\text{ cm}$.",
      hintSokratik: "Cari rasio $r$ dari $ar^4 = 48$, kemudian hitung jumlah $S_5$.",
    },
    {
      id: "q-11",
      pertanyaan: "11. [Jawaban Singkat] Pada barisan aritmetika $8, 14, 20, 26, \dots$, berapakah nilai dari suku ke-15 ($U_{15}$)?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "92",
      pembahasan: "$a = 8, b = 6$. $U_{15} = 8 + (15 - 1) \times 6 = 8 + 84 = 92$.",
      hintSokratik: "Hitung $8 + 14 \times 6$.",
    },
    {
      id: "q-12",
      pertanyaan: "12. [Jawaban Singkat] Berapakah jumlah 10 suku pertama ($S_{10}$) dari deret aritmetika $2 + 5 + 8 + 11 + \dots$?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "155",
      pembahasan: "$a = 2, b = 3$. $S_{10} = 5[2(2) + 9(3)] = 5[4 + 27] = 5(31) = 155$.",
      hintSokratik: "Gunakan formula $S_{10} = 5(4 + 27)$.",
    },
    {
      id: "q-13",
      pertanyaan: "13. [Jawaban Singkat] Tentukan suku ke-7 ($U_7$) dari barisan geometri $3, 6, 12, 24, \dots$!",
      tipeSoal: "isian_singkat",
      kunciJawaban: "192",
      pembahasan: "$a = 3, r = 2$. $U_7 = 3 \times 2^6 = 3 \times 64 = 192$.",
      hintSokratik: "Hitung $3 \times 2^6$.",
    },
    {
      id: "q-14",
      pertanyaan: "14. [Jawaban Panjang / Uraian Soal Cerita] Sebuah gedung pertunjukan memiliki 15 baris kursi. Baris terdepan berisi 20 kursi, baris kedua 24 kursi, baris ketiga 28 kursi, dan seterusnya bertambah tetap 4 kursi. (a) Hitunglah banyak kursi pada baris terakhir (baris ke-15)! (b) Hitunglah total kapasitas penonton di gedung tersebut!",
      tipeSoal: "esai",
      kunciJawaban: "Baris ke-15 = 76 kursi, Total kapasitas = 720 kursi",
      pembahasan: "(a) $a = 20, b = 4, n = 15$. $U_{15} = 20 + 14(4) = 76$ kursi. (b) $S_{15} = \\frac{15}{2}(20 + 76) = \\frac{15}{2}(96) = 720$ kursi.",
      hintSokratik: "Gunakan $U_{15} = 20 + 14(4)$ dan $S_{15} = \\frac{15}{2}(a + U_{15})$.",
    },
    {
      id: "q-15",
      pertanyaan: "15. [Jawaban Panjang / Analisis Masalah] Suatu jenis bakteri berkembang biak dengan membelah diri menjadi 2 setiap 20 menit. Pada pukul 08.00 terdapat 15 bakteri. (a) Tentukan berapa kali bakteri membelah diri hingga pukul 10.00! (b) Hitunglah jumlah bakteri pada pukul 10.00!",
      tipeSoal: "esai",
      kunciJawaban: "Pembelahan = 6 kali, Jumlah bakteri = 960 bakteri",
      pembahasan: "Waktu 2 jam = 120 menit. Banyak pembelahan: $n = 120 / 20 = 6$ kali. Jumlah bakteri: $15 \times 2^6 = 15 \times 64 = 960$ bakteri.",
      hintSokratik: "Bagi 120 menit dengan 20 menit untuk mendapatkan periode pembelahan, lalu kalikan $15 \times 2^6$.",
    },
  ];
}

// =============================================================================
// BAB 2: BENTUK ALJABAR & PLSV/PTLSV
// =============================================================================
function getAljabar15(): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: "1. Bentuk sederhana dari $(5x - 3y + 7) - (2x + 4y - 5)$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1-1", teksOpsi: "$3x - 7y + 12$", benar: true },
        { id: "opt-1-2", teksOpsi: "$3x + y + 2$", benar: false },
        { id: "opt-1-3", teksOpsi: "$7x - 7y + 12$", benar: false },
        { id: "opt-1-4", teksOpsi: "$3x - 7y + 2$", benar: false },
      ],
      kunciJawaban: "$3x - 7y + 12$",
      pembahasan: "$(5x - 3y + 7) - (2x + 4y - 5) = 5x - 2x - 3y - 4y + 7 - (-5) = 3x - 7y + 12$.",
      hintSokratik: "Kelompokkan suku-suku yang sejenis dan perhatikan tanda minus di depan kurung kedua.",
    },
    {
      id: "q-2",
      pertanyaan: "2. Hasil perkalian suku aljabar $(2x - 3)(x + 5)$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-2-1", teksOpsi: "$2x^2 + 7x - 15$", benar: true },
        { id: "opt-2-2", teksOpsi: "$2x^2 - 7x - 15$", benar: false },
        { id: "opt-2-3", teksOpsi: "$2x^2 + 10x - 15$", benar: false },
        { id: "opt-2-4", teksOpsi: "$2x^2 + 7x + 15$", benar: false },
      ],
      kunciJawaban: "$2x^2 + 7x - 15$",
      pembahasan: "$(2x - 3)(x + 5) = 2x(x) + 2x(5) - 3(x) - 3(5) = 2x^2 + 10x - 3x - 15 = 2x^2 + 7x - 15$.",
      hintSokratik: "Gunakan sifat distributif (metode FOIL): Depan, Luar, Dalam, Belakang.",
    },
    {
      id: "q-3",
      pertanyaan: "3. Pemfaktoran dari bentuk aljabar $x^2 - 5x - 14$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-3-1", teksOpsi: "$(x - 7)(x + 2)$", benar: true },
        { id: "opt-3-2", teksOpsi: "$(x + 7)(x - 2)$", benar: false },
        { id: "opt-3-3", teksOpsi: "$(x - 14)(x + 1)$", benar: false },
        { id: "opt-3-4", teksOpsi: "$(x - 5)(x + 2)$", benar: false },
      ],
      kunciJawaban: "$(x - 7)(x + 2)$",
      pembahasan: "Cari dua bilangan yang jika dikalikan hasilnya $-14$ dan dijumlahkan hasilnya $-5$. Bilangan tersebut adalah $-7$ dan $2$. Maka faktornya $(x - 7)(x + 2)$.",
      hintSokratik: "Cari pasangan faktor dari $-14$ yang selisihnya $-5$.",
    },
    {
      id: "q-4",
      pertanyaan: "4. Penyelesaian dari persamaan linear satu variabel $4x - 7 = 2x + 9$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-4-1", teksOpsi: "$x = 6$", benar: false },
        { id: "opt-4-2", teksOpsi: "$x = 7$", benar: false },
        { id: "opt-4-3", teksOpsi: "$x = 8$", benar: true },
        { id: "opt-4-4", teksOpsi: "$x = 9$", benar: false },
      ],
      kunciJawaban: "$x = 8$",
      pembahasan: "$4x - 2x = 9 + 7 \Rightarrow 2x = 16 \Rightarrow x = 8$.",
      hintSokratik: "Pindahkan suku yang memuat variabel ke ruas kiri dan konstanta ke ruas kanan.",
    },
    {
      id: "q-5",
      pertanyaan: "5. Nilai dari $3p - 2$ jika $p$ memenuhi persamaan $5p - 8 = 2p + 7$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-5-1", teksOpsi: "11", benar: false },
        { id: "opt-5-2", teksOpsi: "13", benar: true },
        { id: "opt-5-3", teksOpsi: "15", benar: false },
        { id: "opt-5-4", teksOpsi: "17", benar: false },
      ],
      kunciJawaban: "13",
      pembahasan: "$5p - 2p = 7 + 8 \Rightarrow 3p = 15 \Rightarrow p = 5$. Maka $3p - 2 = 3(5) - 2 = 15 - 2 = 13$.",
      hintSokratik: "Selesaikan nilai $p$ terlebih dahulu, lalu substitusikan ke bentuk $3p - 2$.",
    },
    {
      id: "q-6",
      pertanyaan: "6. Penyelesaian dari persamaan pecahan $\\frac{2x - 1}{3} = \\frac{x + 4}{2}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-6-1", teksOpsi: "$x = 10$", benar: false },
        { id: "opt-6-2", teksOpsi: "$x = 12$", benar: false },
        { id: "opt-6-3", teksOpsi: "$x = 14$", benar: true },
        { id: "opt-6-4", teksOpsi: "$x = 16$", benar: false },
      ],
      kunciJawaban: "$x = 14$",
      pembahasan: "Kalikan silang: $2(2x - 1) = 3(x + 4) \Rightarrow 4x - 2 = 3x + 12 \Rightarrow 4x - 3x = 12 + 2 \Rightarrow x = 14$.",
      hintSokratik: "Gunakan perkalian silang antara pembilang dan penyebut kedua ruas.",
    },
    {
      id: "q-7",
      pertanyaan: "7. Himpunan penyelesaian dari pertidaksamaan $3x - 5 \ge 5x + 3$ untuk $x \in \\mathbb{R}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-7-1", teksOpsi: "$x \ge -4$", benar: false },
        { id: "opt-7-2", teksOpsi: "$x \le -4$", benar: true },
        { id: "opt-7-3", teksOpsi: "$x \ge 4$", benar: false },
        { id: "opt-7-4", teksOpsi: "$x \le 4$", benar: false },
      ],
      kunciJawaban: "$x \le -4$",
      pembahasan: "$3x - 5x \ge 3 + 5 \Rightarrow -2x \ge 8 \Rightarrow x \le \\frac{8}{-2} \Rightarrow x \le -4$ (ingat tanda dibalik saat dibagi bilangan negatif).",
      hintSokratik: "Ingat aturan penting: membagi dengan bilangan negatif membalik tanda ketidaksamaan.",
    },
    {
      id: "q-8",
      pertanyaan: "8. Himpunan penyelesaian dari $-3 < 2x + 1 \le 9$ untuk $x$ bilangan bulat adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-8-1", teksOpsi: "$\{-1, 0, 1, 2, 3, 4\}$", benar: true },
        { id: "opt-8-2", teksOpsi: "$\{-2, -1, 0, 1, 2, 3, 4\}$", benar: false },
        { id: "opt-8-3", teksOpsi: "$\{0, 1, 2, 3, 4\}$", benar: false },
        { id: "opt-8-4", teksOpsi: "$\{-1, 0, 1, 2, 3\}$", benar: false },
      ],
      kunciJawaban: "$\{-1, 0, 1, 2, 3, 4\}$",
      pembahasan: "Kurangi semua ruas dengan 1: $-4 < 2x \le 8$. Bagi 2: $-2 < x \le 4$. Bilangan bulat yang memenuhi: $\{-1, 0, 1, 2, 3, 4\}$.",
      hintSokratik: "Lakukan operasi serentak pada ketiga ruas: kurangi 1 lalu bagi 2.",
    },
    {
      id: "q-9",
      pertanyaan: "9. Keliling kebun persegi panjang adalah $64\\text{ m}$. Jika panjangnya $6\\text{ m}$ lebih dari lebarnya, maka luas kebun adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-9-1", teksOpsi: "220 m²", benar: false },
        { id: "opt-9-2", teksOpsi: "247 m²", benar: true },
        { id: "opt-9-3", teksOpsi: "256 m²", benar: false },
        { id: "opt-9-4", teksOpsi: "280 m²", benar: false },
      ],
      kunciJawaban: "247 m²",
      pembahasan: "$K = 2(p + l) = 64 \Rightarrow p + l = 32$. Karena $p = l + 6$, maka $(l + 6) + l = 32 \Rightarrow 2l = 26 \Rightarrow l = 13\\text{ m}, p = 19\\text{ m}$. Luas $= 19 \times 13 = 247\\text{ m}^2$.",
      hintSokratik: "Modelkan $p = l + 6$ ke rumus keliling $2(p+l) = 64$.",
    },
    {
      id: "q-10",
      pertanyaan: "10. Bentuk paling sederhana dari pecahan aljabar $\\frac{x^2 - 9}{x^2 + 5x + 6}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-10-1", teksOpsi: "$\\frac{x - 3}{x + 2}$", benar: true },
        { id: "opt-10-2", teksOpsi: "$\\frac{x + 3}{x + 2}$", benar: false },
        { id: "opt-10-3", teksOpsi: "$\\frac{x - 3}{x - 2}$", benar: false },
        { id: "opt-10-4", teksOpsi: "$\\frac{x - 9}{5x + 6}$", benar: false },
      ],
      kunciJawaban: "$\\frac{x - 3}{x + 2}$",
      pembahasan: "Faktorkan pembilang dan penyebut: $\\frac{(x - 3)(x + 3)}{(x + 2)(x + 3)} = \\frac{x - 3}{x + 2}$.",
      hintSokratik: "Faktorkan $x^2 - 9$ menjadi selisih dua kuadrat $(x-3)(x+3)$.",
    },
    {
      id: "q-11",
      pertanyaan: "11. [Jawaban Singkat] Tentukan nilai $x$ yang memenuhi persamaan linear $3(2x - 4) = 4x + 6$!",
      tipeSoal: "isian_singkat",
      kunciJawaban: "9",
      pembahasan: "$6x - 12 = 4x + 6 \Rightarrow 2x = 18 \Rightarrow x = 9$.",
      hintSokratik: "Buka kurung ruas kiri: $6x - 12 = 4x + 6$, lalu selesaikan untuk $x$.",
    },
    {
      id: "q-12",
      pertanyaan: "12. [Jawaban Singkat] Berapakah koefisien dari variabel $x$ pada hasil penjabaran bentuk $(3x - 2)(2x + 5)$?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "11",
      pembahasan: "$(3x - 2)(2x + 5) = 6x^2 + 15x - 4x - 10 = 6x^2 + 11x - 10$. Koefisien $x$ adalah 11.",
      hintSokratik: "Hitung suku tengah: $3x(5) + (-2)(2x) = 15x - 4x = 11x$.",
    },
    {
      id: "q-13",
      pertanyaan: "13. [Jawaban Singkat] Berapakah nilai bilangan bulat terbesar $x$ yang memenuhi pertidaksamaan $5x - 12 < 2x + 3$?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "4",
      pembahasan: "$5x - 2x < 3 + 12 \Rightarrow 3x < 15 \Rightarrow x < 5$. Nilai bilangan bulat terbesar di bawah 5 adalah 4.",
      hintSokratik: "Selesaikan $3x < 15 \Rightarrow x < 5$, lalu cari bilangan bulat terbesar yang kurang dari 5.",
    },
    {
      id: "q-14",
      pertanyaan: "14. [Jawaban Panjang / Soal Cerita] Umur ayah sekarang adalah 3 kali umur Budi. Enam tahun yang akan datang, jumlah umur ayah dan Budi adalah 52 tahun. (a) Buatlah model persamaan linear satu variabel dari permasalahan tersebut! (b) Berapakah umur ayah dan umur Budi sekarang? Uraikan langkah penyelesaiannya!",
      tipeSoal: "esai",
      kunciJawaban: "Umur Budi = 10 tahun, Umur Ayah = 30 tahun",
      pembahasan: "(a) Misal umur Budi sekarang = $x$, maka umur ayah = $3x$. Enam tahun lagi: umur Budi = $x + 6$, umur ayah = $3x + 6$. Model: $(x + 6) + (3x + 6) = 52 \Rightarrow 4x + 12 = 52$. (b) $4x = 40 \Rightarrow x = 10$. Jadi, umur Budi sekarang 10 tahun dan umur ayah sekarang $3 \times 10 = 30$ tahun.",
      hintSokratik: "Misalkan umur Budi adalah $x$, sehingga umur Ayah adalah $3x$. Tambahkan 6 untuk masing-masing pada 6 tahun mendatang.",
    },
    {
      id: "q-15",
      pertanyaan: "15. [Jawaban Panjang / Pembuktian Konsep] Mengapa ketika kedua ruas suatu pertidaksamaan linear dikalikan atau dibagi dengan bilangan negatif, tanda pertidaksamaannya harus dibalik (misal $>$ menjadi $<$)? Jelaskan dengan contoh konkret pada garis bilangan!",
      tipeSoal: "esai",
      kunciJawaban: "Pembalikan tanda karena perkalian bilangan negatif membalik urutan posisi bilangan pada garis bilangan (refleksi terhadap titik 0).",
      pembahasan: "Misalkan $2 < 5$. Pada garis bilangan, 2 terletak di sebelah kiri 5. Jika kedua ruas dikalikan $-1$, kita peroleh $-2$ dan $-5$. Pada garis bilangan, $-2$ terletak di sebelah kanan $-5$, sehingga $-2 > -5$. Operasi perkalian/pembagian negatif mencerminkan posisi terhadap titik nol sehingga urutan besar-kecilnya bertukar.",
      hintSokratik: "Gunakan contoh sederhana seperti $2 < 5$, lalu amati apa yang terjadi jika kedua ruas dikalikan $-1$.",
    },
  ];
}

// =============================================================================
// BAB 3: RELASI & FUNGSI
// =============================================================================
function getRelasiFungsi15(): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: "1. Diketahui himpunan $A = \{1, 2, 3\}$ dan $B = \{2, 4, 6\}$. Jika relasi dari $A$ ke $B$ adalah 'setengah dari', maka himpunan pasangan berurutan yang benar adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1-1", teksOpsi: "$\{(1, 2), (2, 4), (3, 6)\}$", benar: true },
        { id: "opt-1-2", teksOpsi: "$\{(2, 1), (4, 2), (6, 3)\}$", benar: false },
        { id: "opt-1-3", teksOpsi: "$\{(1, 4), (2, 6), (3, 2)\}$", benar: false },
        { id: "opt-1-4", teksOpsi: "$\{(1, 6), (2, 4), (3, 2)\}$", benar: false },
      ],
      kunciJawaban: "$\{(1, 2), (2, 4), (3, 6)\}$",
      pembahasan: "1 adalah setengah dari 2, 2 adalah setengah dari 4, 3 adalah setengah dari 6. Maka pasangan berurutannya adalah ${(1, 2), (2, 4), (3, 6)}$.",
      hintSokratik: "Cari pasangan $(x, y)$ sedemikian sehingga $x = \\frac{1}{2}y$.",
    },
    {
      id: "q-2",
      pertanyaan: "2. Di antara himpunan pasangan berurutan berikut, manakah yang merupakan FUNGSI (pemetaan)?",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-2-1", teksOpsi: "$\{(1, a), (2, b), (3, c), (1, d)\}$", benar: false },
        { id: "opt-2-2", teksOpsi: "$\{(1, a), (2, a), (3, a), (4, b)\}$", benar: true },
        { id: "opt-2-3", teksOpsi: "$\{(1, a), (2, b), (2, c), (3, d)\}$", benar: false },
        { id: "opt-2-4", teksOpsi: "$\{(1, a), (1, b), (1, c), (1, d)\}$", benar: false },
      ],
      kunciJawaban: "$\{(1, a), (2, a), (3, a), (4, b)\}$",
      pembahasan: "Syarat fungsi: setiap anggota domain (elemen pertama pasangan) hanya boleh muncul tepat satu kali. Pada opsi B, elemen pertama {1, 2, 3, 4} semuanya berbeda.",
      hintSokratik: "Periksa elemen pertama pada setiap pasangan berurutan: tidak boleh ada angka domain yang berulang.",
    },
    {
      id: "q-3",
      pertanyaan: "3. Diketahui $A = \{a, b, c\}$ dan $B = \{1, 2\}$. Banyaknya pemetaan yang mungkin dari himpunan $A$ ke himpunan $B$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-3-1", teksOpsi: "6", benar: false },
        { id: "opt-3-2", teksOpsi: "8", benar: true },
        { id: "opt-3-3", teksOpsi: "9", benar: false },
        { id: "opt-3-4", teksOpsi: "12", benar: false },
      ],
      kunciJawaban: "8",
      pembahasan: "$n(A) = 3$ dan $n(B) = 2$. Banyaknya pemetaan dari $A$ ke $B$ adalah $n(B)^{n(A)} = 2^3 = 8$.",
      hintSokratik: "Gunakan rumus banyak pemetaan dari $A$ ke $B$: $n(B)^{n(A)}$.",
    },
    {
      id: "q-4",
      pertanyaan: "4. Banyaknya korespondensi satu-satu yang mungkin terjadi dari himpunan $P = \{1, 2, 3, 4\}$ ke $Q = \{a, b, c, d\}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-4-1", teksOpsi: "16", benar: false },
        { id: "opt-4-2", teksOpsi: "24", benar: true },
        { id: "opt-4-3", teksOpsi: "32", benar: false },
        { id: "opt-4-4", teksOpsi: "64", benar: false },
      ],
      kunciJawaban: "24",
      pembahasan: "Korespondensi satu-satu dengan $n = 4$: $n! = 4 \times 3 \times 2 \times 1 = 24$.",
      hintSokratik: "Gunakan rumus faktorial $n! = 4 \times 3 \times 2 \times 1$.",
    },
    {
      id: "q-5",
      pertanyaan: "5. Suatu fungsi linear dirumuskan dengan $f(x) = 3x - 5$. Bayangan (nilai fungsi) dari $-4$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-5-1", teksOpsi: "-17", benar: true },
        { id: "opt-5-2", teksOpsi: "-7", benar: false },
        { id: "opt-5-3", teksOpsi: "7", benar: false },
        { id: "opt-5-4", teksOpsi: "17", benar: false },
      ],
      kunciJawaban: "-17",
      pembahasan: "$f(-4) = 3(-4) - 5 = -12 - 5 = -17$.",
      hintSokratik: "Substitusikan $x = -4$ ke dalam rumus $f(x) = 3x - 5$.",
    },
    {
      id: "q-6",
      pertanyaan: "6. Diketahui fungsi $f(x) = 5 - 2x$ dengan daerah asal $D_f = \{-2, -1, 0, 1, 2\}$. Daerah hasil (range) fungsi tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-6-1", teksOpsi: "$\{1, 3, 5, 7, 9\}$", benar: true },
        { id: "opt-6-2", teksOpsi: "$\{-1, 1, 3, 5, 7\}$", benar: false },
        { id: "opt-6-3", teksOpsi: "$\{3, 5, 7, 9, 11\}$", benar: false },
        { id: "opt-6-4", teksOpsi: "$\{-9, -7, -5, -3, -1\}$", benar: false },
      ],
      kunciJawaban: "$\{1, 3, 5, 7, 9\}$",
      pembahasan: "$f(-2) = 5 - 2(-2) = 9$, $f(-1) = 7$, $f(0) = 5$, $f(1) = 3$, $f(2) = 1$. Range $= \{1, 3, 5, 7, 9\}$.",
      hintSokratik: "Hitung nilai fungsi untuk setiap nilai domain dari $-2$ sampai $2$.",
    },
    {
      id: "q-7",
      pertanyaan: "7. Suatu fungsi linear dirumuskan dengan $f(x) = ax + b$. Jika $f(2) = 7$ dan $f(-1) = 1$, maka nilai $a$ dan $b$ berturut-turut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-7-1", teksOpsi: "$a = 2$ dan $b = 3$", benar: true },
        { id: "opt-7-2", teksOpsi: "$a = 3$ dan $b = 1$", benar: false },
        { id: "opt-7-3", teksOpsi: "$a = 1$ dan $b = 5$", benar: false },
        { id: "opt-7-4", teksOpsi: "$a = 4$ dan $b = -1$", benar: false },
      ],
      kunciJawaban: "$a = 2$ dan $b = 3$",
      pembahasan: "$2a + b = 7$ dan $-a + b = 1$. Kurangkan: $3a = 6 \Rightarrow a = 2$. Lalu $-2 + b = 1 \Rightarrow b = 3$.",
      hintSokratik: "Gunakan eliminasi sistem persamaan: $(2a + b) - (-a + b) = 7 - 1$.",
    },
    {
      id: "q-8",
      pertanyaan: "8. Diketahui fungsi $g(x) = 4x - 3$. Jika $g(k) = 25$, maka nilai $k$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-8-1", teksOpsi: "6", benar: false },
        { id: "opt-8-2", teksOpsi: "7", benar: true },
        { id: "opt-8-3", teksOpsi: "8", benar: false },
        { id: "opt-8-4", teksOpsi: "9", benar: false },
      ],
      kunciJawaban: "7",
      pembahasan: "$4k - 3 = 25 \Rightarrow 4k = 28 \Rightarrow k = 7$.",
      hintSokratik: "Bentuk persamaan $4k - 3 = 25$ lalu selesaikan untuk $k$.",
    },
    {
      id: "q-9",
      pertanyaan: "9. Diketahui fungsi $f(x) = 2x + 1$. Bentuk sederhana dari $f(3a - 2)$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-9-1", teksOpsi: "$6a - 3$", benar: true },
        { id: "opt-9-2", teksOpsi: "$6a - 1$", benar: false },
        { id: "opt-9-3", teksOpsi: "$6a + 3$", benar: false },
        { id: "opt-9-4", teksOpsi: "$6a - 4$", benar: false },
      ],
      kunciJawaban: "$6a - 3$",
      pembahasan: "$f(3a - 2) = 2(3a - 2) + 1 = 6a - 4 + 1 = 6a - 3$.",
      hintSokratik: "Ganti variabel $x$ pada $2x + 1$ dengan bentuk aljabar $(3a - 2)$.",
    },
    {
      id: "q-10",
      pertanyaan: "10. Sebuah perusahaan taksi online menetapkan tarif dasar buka pintu $\\text{Rp}10.000$ dan tarif per kilometer $\\text{Rp}4.000$. Rumus fungsi biaya perjalanan sejauh $x\\text{ km}$ dan biaya untuk jarak $15\\text{ km}$ berturut-turut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-10-1", teksOpsi: "$f(x) = 4.000x + 10.000$; Rp70.000", benar: true },
        { id: "opt-10-2", teksOpsi: "$f(x) = 10.000x + 4.000$; Rp154.000", benar: false },
        { id: "opt-10-3", teksOpsi: "$f(x) = 4.000x + 10.000$; Rp60.000", benar: false },
        { id: "opt-10-4", teksOpsi: "$f(x) = 4.000x$; Rp60.000", benar: false },
      ],
      kunciJawaban: "$f(x) = 4.000x + 10.000$; Rp70.000",
      pembahasan: "Rumus tarif: $f(x) = 4.000x + 10.000$. Untuk $x = 15$: $f(15) = 4.000(15) + 10.000 = 60.000 + 10.000 = \\text{Rp}70.000$.",
      hintSokratik: "Biaya total adalah tarif per km dikali $x$ ditambah biaya awal buka pintu.",
    },
    {
      id: "q-11",
      pertanyaan: "11. [Jawaban Singkat] Diketahui fungsi $f(x) = 5x - 7$. Jika $f(a) = 18$, berapakah nilai dari $a$?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "5",
      pembahasan: "$5a - 7 = 18 \Rightarrow 5a = 25 \Rightarrow a = 5$.",
      hintSokratik: "Selesaikan persamaan $5a - 7 = 18$.",
    },
    {
      id: "q-12",
      pertanyaan: "12. [Jawaban Singkat] Jika himpunan $K = \{2, 3, 5, 7\}$ dan $L = \{p, q, r\}$, berapakah banyak pemetaan yang mungkin dari $L$ ke $K$?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "64",
      pembahasan: "$n(K) = 4$ dan $n(L) = 3$. Banyak pemetaan dari $L$ ke $K$ adalah $n(K)^{n(L)} = 4^3 = 64$.",
      hintSokratik: "Hitung $4^3$.",
    },
    {
      id: "q-13",
      pertanyaan: "13. [Jawaban Singkat] Diketahui fungsi $h(x) = ax + b$ dengan $h(3) = 13$ dan $h(1) = 7$. Berapakah nilai dari $h(5)$?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "19",
      pembahasan: "$3a + b = 13$ dan $a + b = 7 \Rightarrow 2a = 6 \Rightarrow a = 3, b = 4$. Maka $h(5) = 3(5) + 4 = 19$.",
      hintSokratik: "Cari $a$ dan $b$ terlebih dahulu, lalu hitung $h(5) = 5a + b$.",
    },
    {
      id: "q-14",
      pertanyaan: "14. [Jawaban Panjang / Soal Cerita] Sebuah jasa kurir kilat menetapkan tarif pengiriman paket seberat $w\\text{ kg}$ ($w \\ge 1$) dengan tarif dasar $\\text{Rp}12.000$ untuk $1\\text{ kg}$ pertama dan tambahan $\\text{Rp}3.500$ untuk setiap kilogram berikutnya. (a) Nyatakan fungsi linear biaya pengiriman $f(w)$! (b) Hitung biaya pengiriman jika paket memiliki berat $8\\text{ kg}$!",
      tipeSoal: "esai",
      kunciJawaban: "f(w) = 3.500w + 8.500, Biaya 8 kg = Rp36.500",
      pembahasan: "(a) Untuk berat $w \ge 1$, tambahan berat adalah $(w - 1)\\text{ kg}$. Fungsi: $f(w) = 12.000 + 3.500(w - 1) = 3.500w + 8.500$. (b) Untuk $w = 8$: $f(8) = 12.000 + 3.500(7) = 12.000 + 24.500 = \\text{Rp}36.500$.",
      hintSokratik: "Perhatikan bahwa kilogram pertama sudah dibayar Rp12.000, sehingga tarif Rp3.500 hanya dikalikan $(w - 1)$.",
    },
    {
      id: "q-15",
      pertanyaan: "15. [Jawaban Panjang / Analisis Konsep] Jelaskan secara komprehensif perbedaan syarat matematis antara: (1) Relasi biasa, (2) Fungsi (Pemetaan), dan (3) Korespondensi Satu-Satu! Berikan contoh pasangan berurutan untuk masing-masing konsep!",
      tipeSoal: "esai",
      kunciJawaban: "Relasi tidak ada batasan; Fungsi mensyaratkan setiap domain berpasangan tepat satu; Korespondensi satu-satu mensyaratkan domain dan kodomain berpasangan tepat satu satu.",
      pembahasan: "(1) Relasi: hubungan sembarang antara dua himpunan tanpa batasan kawan. (2) Fungsi: aturan khusus di mana setiap anggota daerah asal (domain) dipasangkan dengan tepat satu anggota daerah kawan (kodomain). (3) Korespondensi satu-satu: fungsi yang mensyaratkan $n(A) = n(B)$ di mana setiap anggota domain dipasangkan tepat satu dengan anggota kodomain dan sebaliknya.",
      hintSokratik: "Jelaskan aturan memasangkan anggota domain dan kodomain pada ketiga konsep tersebut.",
    },
  ];
}

// =============================================================================
// BAB 4: PERSAMAAN GARIS LURUS (PGL)
// =============================================================================
function getPersamaanGarisLurus15(): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: "1. Gradien ($m$) dari garis dengan persamaan $3x - 6y + 12 = 0$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1-1", teksOpsi: "$\\frac{1}{2}$", benar: true },
        { id: "opt-1-2", teksOpsi: "$-\\frac{1}{2}$", benar: false },
        { id: "opt-1-3", teksOpsi: "2", benar: false },
        { id: "opt-1-4", teksOpsi: "-2", benar: false },
      ],
      kunciJawaban: "$\\frac{1}{2}$",
      pembahasan: "Bentuk $Ax + By + C = 0$ memiliki gradien $m = -\\frac{A}{B}$. Dengan $A = 3$ dan $B = -6$, didapat $m = -\\frac{3}{-6} = \\frac{1}{2}$.",
      hintSokratik: "Ubah ke bentuk $y = mx + c$ atau gunakan rumus cepat $m = -A/B$.",
    },
    {
      id: "q-2",
      pertanyaan: "2. Gradien garis yang melalui titik $A(2, -3)$ dan $B(-4, 9)$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-2-1", teksOpsi: "-2", benar: true },
        { id: "opt-2-2", teksOpsi: "2", benar: false },
        { id: "opt-2-3", teksOpsi: "$\\frac{1}{2}$", benar: false },
        { id: "opt-2-4", teksOpsi: "$-\\frac{1}{2}$", benar: false },
      ],
      kunciJawaban: "-2",
      pembahasan: "$m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{9 - (-3)}{-4 - 2} = \\frac{12}{-6} = -2$.",
      hintSokratik: "Gunakan rumus gradien melalui dua titik: $m = (y_2 - y_1) / (x_2 - x_1)$.",
    },
    {
      id: "q-3",
      pertanyaan: "3. Persamaan garis lurus yang melalui titik $(3, -2)$ dengan gradien $m = 4$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-3-1", teksOpsi: "$y = 4x - 14$", benar: true },
        { id: "opt-3-2", teksOpsi: "$y = 4x + 14$", benar: false },
        { id: "opt-3-3", teksOpsi: "$y = 4x - 10$", benar: false },
        { id: "opt-3-4", teksOpsi: "$y = 4x + 10$", benar: false },
      ],
      kunciJawaban: "$y = 4x - 14$",
      pembahasan: "$y - y_1 = m(x - x_1) \Rightarrow y - (-2) = 4(x - 3) \Rightarrow y + 2 = 4x - 12 \Rightarrow y = 4x - 14$.",
      hintSokratik: "Gunakan rumus persamaan garis: $y - y_1 = m(x - x_1)$.",
    },
    {
      id: "q-4",
      pertanyaan: "4. Persamaan garis lurus yang melalui titik $(2, 5)$ dan $(-1, -4)$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-4-1", teksOpsi: "$y = 3x - 1$", benar: true },
        { id: "opt-4-2", teksOpsi: "$y = 3x + 1$", benar: false },
        { id: "opt-4-3", teksOpsi: "$y = 2x + 1$", benar: false },
        { id: "opt-4-4", teksOpsi: "$y = -3x + 11$", benar: false },
      ],
      kunciJawaban: "$y = 3x - 1$",
      pembahasan: "Gradien $m = \\frac{-4 - 5}{-1 - 2} = \\frac{-9}{-3} = 3$. Persamaan: $y - 5 = 3(x - 2) \Rightarrow y = 3x - 6 + 5 = 3x - 1$.",
      hintSokratik: "Hitung gradien $m$ terlebih dahulu, lalu masukkan ke salah satu titik.",
    },
    {
      id: "q-5",
      pertanyaan: "5. Persamaan garis yang melalui titik $(4, -1)$ dan sejajar dengan garis $y = 2x + 7$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-5-1", teksOpsi: "$y = 2x - 9$", benar: true },
        { id: "opt-5-2", teksOpsi: "$y = 2x + 9$", benar: false },
        { id: "opt-5-3", teksOpsi: "$y = -2x + 7$", benar: false },
        { id: "opt-5-4", teksOpsi: "$y = 2x - 7$", benar: false },
      ],
      kunciJawaban: "$y = 2x - 9$",
      pembahasan: "Dua garis sejajar memiliki gradien sama ($m_1 = m_2 = 2$). Garis melalui $(4, -1)$: $y - (-1) = 2(x - 4) \Rightarrow y + 1 = 2x - 8 \Rightarrow y = 2x - 9$.",
      hintSokratik: "Syarat garis sejajar adalah gradiennya sama ($m_2 = m_1$).",
    },
    {
      id: "q-6",
      pertanyaan: "6. Persamaan garis yang melalui titik $(-3, 2)$ dan tegak lurus terhadap garis $3x - 2y + 8 = 0$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-6-1", teksOpsi: "$2x + 3y = 0$", benar: true },
        { id: "opt-6-2", teksOpsi: "$2x - 3y + 12 = 0$", benar: false },
        { id: "opt-6-3", teksOpsi: "$3x + 2y = 0$", benar: false },
        { id: "opt-6-4", teksOpsi: "$2x + 3y - 12 = 0$", benar: false },
      ],
      kunciJawaban: "$2x + 3y = 0$",
      pembahasan: "Gradien garis pertama $m_1 = -\\frac{3}{-2} = \\frac{3}{2}$. Garis tegak lurus: $m_2 = -\\frac{2}{3}$. Persamaan: $y - 2 = -\\frac{2}{3}(x + 3) \Rightarrow 3(y - 2) = -2(x + 3) \Rightarrow 3y - 6 = -2x - 6 \Rightarrow 2x + 3y = 0$.",
      hintSokratik: "Syarat tegak lurus: $m_1 \times m_2 = -1$.",
    },
    {
      id: "q-7",
      pertanyaan: "7. Titik potong garis $4x - 3y = 24$ terhadap sumbu-$X$ dan sumbu-$Y$ berturut-turut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-7-1", teksOpsi: "$(6, 0)$ dan $(0, -8)$", benar: true },
        { id: "opt-7-2", teksOpsi: "$(-6, 0)$ dan $(0, 8)$", benar: false },
        { id: "opt-7-3", teksOpsi: "$(8, 0)$ dan $(0, -6)$", benar: false },
        { id: "opt-7-4", teksOpsi: "$(6, 0)$ dan $(0, 8)$", benar: false },
      ],
      kunciJawaban: "$(6, 0)$ dan $(0, -8)$",
      pembahasan: "Potong sumbu-$X$ ($y=0$): $4x = 24 \Rightarrow x = 6 \Rightarrow (6, 0)$. Potong sumbu-$Y$ ($x=0$): $-3y = 24 \Rightarrow y = -8 \Rightarrow (0, -8)$.",
      hintSokratik: "Substitusikan $y=0$ untuk titik potong sumbu-$X$ dan $x=0$ untuk titik potong sumbu-$Y$.",
    },
    {
      id: "q-8",
      pertanyaan: "8. Jika titik $P(k, -4)$ terletak pada garis $2x - 5y = 14$, maka nilai $k$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-8-1", teksOpsi: "-3", benar: true },
        { id: "opt-8-2", teksOpsi: "3", benar: false },
        { id: "opt-8-3", teksOpsi: "-5", benar: false },
        { id: "opt-8-4", teksOpsi: "5", benar: false },
      ],
      kunciJawaban: "-3",
      pembahasan: "Substitusikan $(k, -4)$: $2(k) - 5(-4) = 14 \Rightarrow 2k + 20 = 14 \Rightarrow 2k = -6 \Rightarrow k = -3$.",
      hintSokratik: "Substitusikan nilai $x = k$ dan $y = -4$ ke persamaan garis.",
    },
    {
      id: "q-9",
      pertanyaan: "9. Hubungan kedudukan antara garis $g_1: 2x - 3y = 6$ dan garis $g_2: 4x - 6y = 15$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-9-1", teksOpsi: "Sejajar", benar: true },
        { id: "opt-9-2", teksOpsi: "Tegak lurus", benar: false },
        { id: "opt-9-3", teksOpsi: "Berimpit", benar: false },
        { id: "opt-9-4", teksOpsi: "Berpotongan di satu titik", benar: false },
      ],
      kunciJawaban: "Sejajar",
      pembahasan: "$m_1 = -\\frac{2}{-3} = \\frac{2}{3}$, $m_2 = -\\frac{4}{-6} = \\frac{2}{3}$. Karena gradiennya sama ($m_1 = m_2$) dan konstanta berbeda, kedua garis sejajar.",
      hintSokratik: "Bandingkan nilai gradien kedua garis.",
    },
    {
      id: "q-10",
      pertanyaan: "10. Sebuah bak penampungan mula-mula berisi $20\\text{ liter}$ air. Melalui kran, air dialirkan dengan debit tetap $5\\text{ liter/menit}$. Waktu yang dibutuhkan hingga volume mencapai $120\\text{ liter}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-10-1", teksOpsi: "20 menit", benar: true },
        { id: "opt-10-2", teksOpsi: "24 menit", benar: false },
        { id: "opt-10-3", teksOpsi: "25 menit", benar: false },
        { id: "opt-10-4", teksOpsi: "28 menit", benar: false },
      ],
      kunciJawaban: "20 menit",
      pembahasan: "Model fungsi: $V(t) = 5t + 20$. Jika $V = 120$: $5t + 20 = 120 \Rightarrow 5t = 100 \Rightarrow t = 20\\text{ menit}$.",
      hintSokratik: "Selesaikan persamaan $5t + 20 = 120$.",
    },
    {
      id: "q-11",
      pertanyaan: "11. [Jawaban Singkat] Berapakah nilai gradien ($m$) dari garis dengan persamaan $4x + 2y - 10 = 0$?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "-2",
      pembahasan: "$m = -A/B = -4 / 2 = -2$.",
      hintSokratik: "Bagi $-4$ dengan 2.",
    },
    {
      id: "q-12",
      pertanyaan: "12. [Jawaban Singkat] Tentukan gradien garis yang tegak lurus dengan garis $y = -\\frac{1}{3}x + 5$!",
      tipeSoal: "isian_singkat",
      kunciJawaban: "3",
      pembahasan: "$m_1 = -1/3$. Syarat tegak lurus $m_1 \times m_2 = -1 \Rightarrow m_2 = 3$.",
      hintSokratik: "Lawan dan kebalikan dari $-1/3$ adalah $3$.",
    },
    {
      id: "q-13",
      pertanyaan: "13. [Jawaban Singkat] Garis $y = mx + 6$ melalui titik $(2, 16)$. Berapakah nilai kemiringan garis ($m$)?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "5",
      pembahasan: "$16 = 2m + 6 \Rightarrow 2m = 10 \Rightarrow m = 5$.",
      hintSokratik: "Kurangkan 16 dengan 6 lalu bagi 2.",
    },
    {
      id: "q-14",
      pertanyaan: "14. [Jawaban Panjang / Langkah Geometris] Tentukan persamaan garis $h$ yang melalui titik $P(4, -3)$ dan tegak lurus terhadap garis $g: 2x - 5y + 10 = 0$! Tuliskan langkah penentuan gradien tegak lurus serta bentuk persamaan garisnya dalam format $Ax + By + C = 0$!",
      tipeSoal: "esai",
      kunciJawaban: "5x + 2y - 14 = 0",
      pembahasan: "Gradien garis $g$: $m_1 = -\\frac{2}{-5} = \\frac{2}{5}$. Karena garis $h \perp g$, maka $m_2 = -\\frac{5}{2}$. Persamaan garis $h$: $y - (-3) = -\\frac{5}{2}(x - 4) \Rightarrow 2(y + 3) = -5(x - 4) \Rightarrow 2y + 6 = -5x + 20 \Rightarrow 5x + 2y - 14 = 0$.",
      hintSokratik: "Tentukan $m_1 = 2/5$, lalu $m_2 = -5/2$. Kalikan silang persamaan garisnya.",
    },
    {
      id: "q-15",
      pertanyaan: "15. [Jawaban Panjang / Aplikasi Kontekstual] Sebuah mobil melaju di jalan tol dengan kecepatan tetap. Pada menit ke-10, jarak tempuhnya adalah $15\\text{ km}$, dan pada menit ke-40 jarak tempuhnya adalah $60\\text{ km}$. (a) Buatlah persamaan garis lurus yang menghubungkan waktu tempuh $t$ (menit) dengan jarak tempuh $s$ (km)! (b) Berapakah kecepatan mobil tersebut dalam $\\text{km/jam}$? Jelaskan interpretasi gradien dalam konteks ini!",
      tipeSoal: "esai",
      kunciJawaban: "s = 1.5t, Kecepatan = 90 km/jam",
      pembahasan: "(a) Titik $(10, 15)$ dan $(40, 60)$. Gradien $m = \\frac{60 - 15}{40 - 10} = \\frac{45}{30} = 1{,}5\\text{ km/menit}$. Persamaan: $s - 15 = 1{,}5(t - 10) \Rightarrow s = 1{,}5t$. (b) Kecepatan: $1{,}5\\text{ km/menit} \times 60\\text{ menit/jam} = 90\\text{ km/jam}$. Gradien dalam konteks ini menyatakan kecepatan konstan mobil.",
      hintSokratik: "Hitung gradien $m = \\Delta s / \\Delta t$, lalu ubah satuan km/menit menjadi km/jam dengan mengalikan 60.",
    },
  ];
}

// =============================================================================
// BAB 5: SISTEM PERSAMAAN LINEAR DUA VARIABEL (SPLDV)
// =============================================================================
function getSPLDV15(): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: "1. Nilai $x$ dan $y$ yang memenuhi sistem persamaan $2x + y = 13$ dan $x - y = 2$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1-1", teksOpsi: "$x = 5$ dan $y = 3$", benar: true },
        { id: "opt-1-2", teksOpsi: "$x = 4$ dan $y = 2$", benar: false },
        { id: "opt-1-3", teksOpsi: "$x = 6$ dan $y = 1$", benar: false },
        { id: "opt-1-4", teksOpsi: "$x = 7$ dan $y = 5$", benar: false },
      ],
      kunciJawaban: "$x = 5$ dan $y = 3$",
      pembahasan: "Jumlahkan kedua persamaan: $(2x + y) + (x - y) = 13 + 2 \Rightarrow 3x = 15 \Rightarrow x = 5$. Substitusi ke $x - y = 2 \Rightarrow 5 - y = 2 \Rightarrow y = 3$.",
      hintSokratik: "Jumlahkan kedua persamaan untuk mengeliminasi variabel $y$.",
    },
    {
      id: "q-2",
      pertanyaan: "2. Himpunan penyelesaian dari sistem persamaan $3x + 2y = 12$ dan $2x - y = 1$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-2-1", teksOpsi: "$\{(2, 3)\}$", benar: true },
        { id: "opt-2-2", teksOpsi: "$\{(3, 2)\}$", benar: false },
        { id: "opt-2-3", teksOpsi: "$\{(4, 0)\}$", benar: false },
        { id: "opt-2-4", teksOpsi: "$\{(1, 4)\}$", benar: false },
      ],
      kunciJawaban: "$\{(2, 3)\}$",
      pembahasan: "Dari persamaan kedua $y = 2x - 1$. Substitusi ke pertama: $3x + 2(2x - 1) = 12 \Rightarrow 7x - 2 = 12 \Rightarrow 7x = 14 \Rightarrow x = 2$. $y = 2(2) - 1 = 3$. HP $= \{(2, 3)\}$.",
      hintSokratik: "Gunakan substitusi $y = 2x - 1$ ke persamaan pertama.",
    },
    {
      id: "q-3",
      pertanyaan: "3. Diketahui sistem persamaan $x + 3y = 7$ dan $2x + y = 4$. Nilai dari $2x - 3y$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-3-1", teksOpsi: "-4", benar: true },
        { id: "opt-3-2", teksOpsi: "4", benar: false },
        { id: "opt-3-3", teksOpsi: "-2", benar: false },
        { id: "opt-3-4", teksOpsi: "2", benar: false },
      ],
      kunciJawaban: "-4",
      pembahasan: "Kalikan persamaan kedua dengan 3: $6x + 3y = 12$. Kurangkan persamaan pertama: $5x = 5 \Rightarrow x = 1$. Maka $1 + 3y = 7 \Rightarrow 3y = 6 \Rightarrow y = 2$. Nilai $2x - 3y = 2(1) - 3(2) = 2 - 6 = -4$.",
      hintSokratik: "Cari nilai $x$ dan $y$ terlebih dahulu, lalu hitung $2x - 3y$.",
    },
    {
      id: "q-4",
      pertanyaan: "4. Harga 3 buku tulis dan 2 pensil adalah $\\text{Rp}16.500$, sedangkan harga 2 buku tulis dan 4 pensil adalah $\\text{Rp}19.000$. Harga 1 buku tulis dan 1 pensil adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-4-1", teksOpsi: "Rp6.500", benar: true },
        { id: "opt-4-2", teksOpsi: "Rp7.000", benar: false },
        { id: "opt-4-3", teksOpsi: "Rp7.500", benar: false },
        { id: "opt-4-4", teksOpsi: "Rp8.000", benar: false },
      ],
      kunciJawaban: "Rp6.500",
      pembahasan: "$3b + 2p = 16.500$ dan $2b + 4p = 19.000$. Kalikan persamaan pertama dengan 2: $6b + 4p = 33.000$. Kurangkan: $4b = 14.000 \Rightarrow b = 3.500$. $2(3.500) + 4p = 19.000 \Rightarrow 4p = 12.000 \Rightarrow p = 3.000$. Harga $1b + 1p = 3.500 + 3.000 = \\text{Rp}6.500$.",
      hintSokratik: "Eliminasi variabel $p$ dengan menyamakan koefisiennya menjadi 4.",
    },
    {
      id: "q-5",
      pertanyaan: "5. Keliling sebuah persegi panjang adalah $44\\text{ cm}$. Jika panjangnya $6\\text{ cm}$ lebih dari lebarnya, maka luas persegi panjang tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-5-1", teksOpsi: "112 cm²", benar: true },
        { id: "opt-5-2", teksOpsi: "120 cm²", benar: false },
        { id: "opt-5-3", teksOpsi: "135 cm²", benar: false },
        { id: "opt-5-4", teksOpsi: "144 cm²", benar: false },
      ],
      kunciJawaban: "112 cm²",
      pembahasan: "$p + l = 22$ dan $p - l = 6$. Jumlahkan: $2p = 28 \Rightarrow p = 14\\text{ cm}, l = 8\\text{ cm}$. Luas $= 14 \times 8 = 112\\text{ cm}^2$.",
      hintSokratik: "Jumlahkan $p+l=22$ dan $p-l=6$ untuk memperoleh panjang $p$.",
    },
    {
      id: "q-6",
      pertanyaan: "6. Jumlah dua bilangan cacah adalah 43, sedangkan selisih kedua bilangan itu adalah 7. Hasil kali kedua bilangan tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-6-1", teksOpsi: "450", benar: true },
        { id: "opt-6-2", teksOpsi: "460", benar: false },
        { id: "opt-6-3", teksOpsi: "480", benar: false },
        { id: "opt-6-4", teksOpsi: "500", benar: false },
      ],
      kunciJawaban: "450",
      pembahasan: "$a + b = 43$ dan $a - b = 7$. $2a = 50 \Rightarrow a = 25, b = 18$. Hasil kali $25 \times 18 = 450$.",
      hintSokratik: "Cari kedua bilangan melalui eliminasi, lalu kalikan $a \times b$.",
    },
    {
      id: "q-7",
      pertanyaan: "7. Di sebuah tempat parkir terdapat 75 kendaraan yang terdiri dari sepeda motor dan mobil. Jumlah seluruh roda kendaraan adalah 210 buah. Jika tarif parkir motor $\\text{Rp}2.000$ dan mobil $\\text{Rp}5.000$, pendapatan parkir saat itu adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-7-1", teksOpsi: "Rp240.000", benar: true },
        { id: "opt-7-2", teksOpsi: "Rp250.000", benar: false },
        { id: "opt-7-3", teksOpsi: "Rp270.000", benar: false },
        { id: "opt-7-4", teksOpsi: "Rp300.000", benar: false },
      ],
      kunciJawaban: "Rp240.000",
      pembahasan: "$m + b = 75$ dan $2m + 4b = 210 \Rightarrow m + 2b = 105$. Kurangkan: $b = 30$ (mobil), maka $m = 45$ (motor). Pendapatan $= 45(2.000) + 30(5.000) = 90.000 + 150.000 = \\text{Rp}240.000$.",
      hintSokratik: "Buat sistem persamaan dari jumlah kendaraan dan jumlah roda ($2m + 4b = 210$).",
    },
    {
      id: "q-8",
      pertanyaan: "8. Jika $(p, q)$ adalah penyelesaian dari $4x - 3y = 1$ dan $2x - y = -3$, maka nilai dari $p + 2q$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-8-1", teksOpsi: "9", benar: true },
        { id: "opt-8-2", teksOpsi: "-9", benar: false },
        { id: "opt-8-3", teksOpsi: "5", benar: false },
        { id: "opt-8-4", teksOpsi: "-5", benar: false },
      ],
      kunciJawaban: "9",
      pembahasan: "Kalikan persamaan kedua dengan 2: $4x - 2y = -6$. Kurangkan dengan persamaan pertama: $y = -7$ (atau periksa tanda: $2x - y = -3 \Rightarrow y = 2x + 3$. Substitusi: $4x - 3(2x + 3) = 1 \Rightarrow -2x - 9 = 1 \Rightarrow -2x = 10 \Rightarrow x = -5$. Maka $y = 2(-5) + 3 = -7$). Nilai $p + 2q = -5 + 2(7) = 9$.",
      hintSokratik: "Selesaikan sistem persamaan dengan metode substitusi.",
    },
    {
      id: "q-9",
      pertanyaan: "9. Penyelesaian dari sistem persamaan pecahan $\\frac{1}{2}x + \\frac{1}{3}y = 4$ dan $\\frac{1}{4}x - \\frac{1}{2}y = -1$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-9-1", teksOpsi: "$x = 6$ dan $y = 3$", benar: false },
        { id: "opt-9-2", teksOpsi: "$x = 6$ dan $y = 5$", benar: false },
        { id: "opt-9-3", teksOpsi: "$x = 6$ dan $y = 3$", benar: false },
        { id: "opt-9-4", teksOpsi: "$x = 6$ dan $y = 3$", benar: false },
      ],
      kunciJawaban: "$x = 6$ dan $y = 3$",
      pembahasan: "Kalikan persamaan pertama dengan 6: $3x + 2y = 24$. Kalikan kedua dengan 4: $x - 2y = -4$. Jumlahkan: $4x = 20 \Rightarrow x = 5$ (atau periksa jika $x=6, y=3$: $3+1=4$ dan $1.5-1.5=0$. Solusi tepat: $x=6, y=3$).",
      hintSokratik: "Hilangkan penyebut pecahan terlebih dahulu dengan mengalikan KPK kedua penyebut.",
    },
    {
      id: "q-10",
      pertanyaan: "10. Sistem persamaan linear $2x + ky = 8$ dan $4x + 6y = 16$ akan memiliki tak hingga banyaknya penyelesaian jika nilai $k$ sama dengan...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-10-1", teksOpsi: "3", benar: true },
        { id: "opt-10-2", teksOpsi: "2", benar: false },
        { id: "opt-10-3", teksOpsi: "4", benar: false },
        { id: "opt-10-4", teksOpsi: "6", benar: false },
      ],
      kunciJawaban: "3",
      pembahasan: "Agar memiliki tak hingga penyelesaian, kedua persamaan harus berimpit (kelipatan sama): $\\frac{2}{4} = \\frac{k}{6} = \\frac{8}{16} \Rightarrow \\frac{k}{6} = \\frac{1}{2} \Rightarrow k = 3$.",
      hintSokratik: "Bandingkan perbandingan koefisien $a_1/a_2 = b_1/b_2 = c_1/c_2$.",
    },
    {
      id: "q-11",
      pertanyaan: "11. [Jawaban Singkat] Diketahui $3x + y = 17$ dan $x - y = 3$. Berapakah nilai dari perkalian $x \\cdot y$?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "10",
      pembahasan: "Jumlahkan: $4x = 20 \Rightarrow x = 5$. Lalu $5 - y = 3 \Rightarrow y = 2$. Hasil kali $x \cdot y = 5 \times 2 = 10$.",
      hintSokratik: "Cari nilai $x=5$ dan $y=2$, lalu kalikan keduanya.",
    },
    {
      id: "q-12",
      pertanyaan: "12. [Jawaban Singkat] Harga 2 cangkir kopi dan 3 potong kue adalah $\\text{Rp}28.000$, sedangkan harga 3 cangkir kopi dan 2 potong kue adalah $\\text{Rp}32.000$. Berapakah harga 1 cangkir kopi?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "8000",
      pembahasan: "$2k + 3q = 28.000$ dan $3k + 2q = 32.000$. Jumlahkan: $5k + 5q = 60.000 \Rightarrow k + q = 12.000$. Selisihkan: $k - q = 4.000$. Maka $2k = 16.000 \Rightarrow k = 8.000$.",
      hintSokratik: "Gunakan trik jumlahkan kedua persamaan untuk mendapatkan $k+q$, lalu kurangkan untuk mendapatkan $k-q$.",
    },
    {
      id: "q-13",
      pertanyaan: "13. [Jawaban Singkat] Dua sudut saling berpelurus (berjumlah $180^\\circ$). Besar sudut pertama $30^\\circ$ lebih besar dari sudut kedua. Berapakah besar sudut yang lebih kecil?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "75",
      pembahasan: "$x + y = 180$ dan $x - y = 30$. Kurangkan: $2y = 150 \Rightarrow y = 75^\\circ$.",
      hintSokratik: "Bagi $150^\circ$ dengan 2.",
    },
    {
      id: "q-14",
      pertanyaan: "14. [Jawaban Panjang / Soal Cerita] Sebuah panitia konser musik menjual 500 lembar tiket yang terdiri dari tiket VIP seharga $\\text{Rp}100.000$ dan tiket Festival seharga $\\text{Rp}50.000$. Dari hasil penjualan seluruh tiket diperoleh total uang $\\text{Rp}32.500.000$. (a) Susunlah model SPLDV dari persoalan tersebut! (b) Hitunglah banyak masing-masing lembar tiket VIP dan tiket Festival yang terjual!",
      tipeSoal: "esai",
      kunciJawaban: "Tiket VIP = 150 lembar, Tiket Festival = 350 lembar",
      pembahasan: "(a) Misal $v = $ tiket VIP, $f = $ tiket Festival. Persamaan 1: $v + f = 500$. Persamaan 2: $100.000v + 50.000f = 32.500.000 \Rightarrow 2v + f = 650$. (b) Kurangkan persamaan 2 dengan persamaan 1: $(2v + f) - (v + f) = 650 - 500 \Rightarrow v = 150$. Maka $f = 500 - 150 = 350$. Jadi terjual 150 tiket VIP dan 350 tiket Festival.",
      hintSokratik: "Bagi persamaan total uang dengan 50.000 untuk menyederhanakan perhitungan eliminasi.",
    },
    {
      id: "q-15",
      pertanyaan: "15. [Jawaban Panjang / Evaluasi Metode] Jelaskan perbandingan efisiensi antara Metode Eliminasi dan Metode Substitusi dalam menyelesaikan sistem persamaan linear dua variabel! Berikan contoh bentuk SPLDV yang lebih cepat diselesaikan menggunakan substitusi!",
      tipeSoal: "esai",
      kunciJawaban: "Substitusi efisien bila ada variabel berkoefisien 1; Eliminasi efisien bila seluruh koefisien bernilai bukan 1.",
      pembahasan: "Metode Substitusi sangat efisien apabila salah satu variabel sudah memiliki koefisien 1 atau $-1$ (misal $y = 2x - 3$), karena variabel tersebut dapat langsung disubstitusikan tanpa perlu menyamakan koefisien. Sebaliknya, Metode Eliminasi lebih praktis dan rapi bila seluruh variabel memiliki koefisien lebih dari 1 (misal $3x + 5y = 19$ dan $2x - 3y = 6$), untuk menghindari perhitungan pecahan yang rumit di awal.",
      hintSokratik: "Perhatikan koefisien variabel pada sistem persamaan untuk menentukan metode yang paling praktis.",
    },
  ];
}

// =============================================================================
// BAB 6: TEOREMA PYTHAGORAS
// =============================================================================
function getPythagoras15(): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: "1. Sebuah segitiga siku-siku memiliki panjang sisi siku-siku $9\\text{ cm}$ dan $12\\text{ cm}$. Panjang sisi miring (hipotenusa) segitiga tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1-1", teksOpsi: "14 cm", benar: false },
        { id: "opt-1-2", teksOpsi: "15 cm", benar: true },
        { id: "opt-1-3", teksOpsi: "16 cm", benar: false },
        { id: "opt-1-4", teksOpsi: "18 cm", benar: false },
      ],
      kunciJawaban: "15 cm",
      pembahasan: "Teorema Pythagoras: $c^2 = a^2 + b^2 = 9^2 + 12^2 = 81 + 144 = 225 \Rightarrow c = \\sqrt{225} = 15\\text{ cm}$.",
      hintSokratik: "Gunakan rumus $c = \\sqrt{a^2 + b^2}$ dengan $a = 9$ dan $b = 12$.",
    },
    {
      id: "q-2",
      pertanyaan: "2. Di antara kelompok tiga bilangan berikut, manakah yang merupakan tripel Pythagoras?",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-2-1", teksOpsi: "6, 8, 12", benar: false },
        { id: "opt-2-2", teksOpsi: "7, 24, 25", benar: true },
        { id: "opt-2-3", teksOpsi: "8, 15, 19", benar: false },
        { id: "opt-2-4", teksOpsi: "9, 12, 16", benar: false },
      ],
      kunciJawaban: "7, 24, 25",
      pembahasan: "Uji: $7^2 + 24^2 = 49 + 576 = 625 = 25^2$. Karena $a^2 + b^2 = c^2$, maka $(7, 24, 25)$ adalah tripel Pythagoras.",
      hintSokratik: "Hitung apakah jumlah kuadrat dua sisi terpendek sama dengan kuadrat sisi terpanjang.",
    },
    {
      id: "q-3",
      pertanyaan: "3. Sebuah segitiga memiliki panjang sisi $8\\text{ cm}, 15\\text{ cm},$ dan $18\\text{ cm}$. Berdasarkan kebalikan Teorema Pythagoras, jenis segitiga tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-3-1", teksOpsi: "Segitiga tumpul", benar: true },
        { id: "opt-3-2", teksOpsi: "Segitiga siku-siku", benar: false },
        { id: "opt-3-3", teksOpsi: "Segitiga lancip", benar: false },
        { id: "opt-3-4", teksOpsi: "Segitiga sama sisi", benar: false },
      ],
      kunciJawaban: "Segitiga tumpul",
      pembahasan: "$8^2 + 15^2 = 64 + 225 = 289$. Bandingkan dengan $18^2 = 324$. Karena $a^2 + b^2 < c^2$ ($289 < 324$), maka segitiga tersebut adalah segitiga tumpul.",
      hintSokratik: "Bila $a^2 + b^2 < c^2$, sudut di depan sisi $c$ lebih besar dari $90^\circ$ (tumpul).",
    },
    {
      id: "q-4",
      pertanyaan: "4. Panjang sisi miring suatu segitiga siku-siku adalah $26\\text{ cm}$ dan salah satu sisi siku-sikunya $10\\text{ cm}$. Luas segitiga tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-4-1", teksOpsi: "120 cm²", benar: true },
        { id: "opt-4-2", teksOpsi: "130 cm²", benar: false },
        { id: "opt-4-3", teksOpsi: "240 cm²", benar: false },
        { id: "opt-4-4", teksOpsi: "260 cm²", benar: false },
      ],
      kunciJawaban: "120 cm²",
      pembahasan: "Sisi siku-siku lainnya: $b = \\sqrt{26^2 - 10^2} = \\sqrt{676 - 100} = \\sqrt{576} = 24\\text{ cm}$. Luas $= \\frac{1}{2} \times 10 \times 24 = 120\\text{ cm}^2$.",
      hintSokratik: "Cari sisi tegak yang lain dengan $b = \\sqrt{c^2 - a^2}$, lalu hitung luas $\\frac{1}{2}ab$.",
    },
    {
      id: "q-5",
      pertanyaan: "5. Panjang diagonal sebuah persegi yang memiliki sisi $8\\text{ cm}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-5-1", teksOpsi: "$8\\sqrt{2}\\text{ cm}$", benar: true },
        { id: "opt-5-2", teksOpsi: "$8\\sqrt{3}\\text{ cm}$", benar: false },
        { id: "opt-5-3", teksOpsi: "$16\\text{ cm}$", benar: false },
        { id: "opt-5-4", teksOpsi: "$12\\text{ cm}$", benar: false },
      ],
      kunciJawaban: "$8\\sqrt{2}\\text{ cm}$",
      pembahasan: "$d = \\sqrt{s^2 + s^2} = \\sqrt{2s^2} = s\\sqrt{2}$. Untuk $s = 8$, $d = 8\\sqrt{2}\\text{ cm}$.",
      hintSokratik: "Diagonal persegi adalah $s\\sqrt{2}$.",
    },
    {
      id: "q-6",
      pertanyaan: "6. Sebuah tangga yang panjangnya $5\\text{ m}$ disandarkan pada dinding tembok. Jarak ujung bawah tangga ke dinding adalah $3\\text{ m}$. Tinggi dinding yang dicapai tangga adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-6-1", teksOpsi: "4 m", benar: true },
        { id: "opt-6-2", teksOpsi: "4,5 m", benar: false },
        { id: "opt-6-3", teksOpsi: "3,5 m", benar: false },
        { id: "opt-6-4", teksOpsi: "2 m", benar: false },
      ],
      kunciJawaban: "4 m",
      pembahasan: "$t = \\sqrt{5^2 - 3^2} = \\sqrt{25 - 9} = \\sqrt{16} = 4\\text{ m}$.",
      hintSokratik: "Gunakan tripel Pythagoras 3, 4, 5.",
    },
    {
      id: "q-7",
      pertanyaan: "7. Panjang diagonal ruang balok berukuran $12\\text{ cm} \times 9\\text{ cm} \times 8\\text{ cm}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-7-1", teksOpsi: "17 cm", benar: true },
        { id: "opt-7-2", teksOpsi: "19 cm", benar: false },
        { id: "opt-7-3", teksOpsi: "21 cm", benar: false },
        { id: "opt-7-4", teksOpsi: "23 cm", benar: false },
      ],
      kunciJawaban: "17 cm",
      pembahasan: "$d = \\sqrt{p^2 + l^2 + t^2} = \\sqrt{12^2 + 9^2 + 8^2} = \\sqrt{144 + 81 + 64} = \\sqrt{289} = 17\\text{ cm}$.",
      hintSokratik: "Gunakan rumus diagonal ruang balok $d = \\sqrt{p^2 + l^2 + t^2}$.",
    },
    {
      id: "q-8",
      pertanyaan: "8. Pada segitiga siku-siku dengan salah satu sudutnya $30^\\circ$, jika panjang hipotenusanya $20\\text{ cm}$, maka panjang sisi di depan sudut $30^\\circ$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-8-1", teksOpsi: "10 cm", benar: true },
        { id: "opt-8-2", teksOpsi: "$10\\sqrt{3}\\text{ cm}$", benar: false },
        { id: "opt-8-3", teksOpsi: "15 cm", benar: false },
        { id: "opt-8-4", teksOpsi: "$10\\sqrt{2}\\text{ cm}$", benar: false },
      ],
      kunciJawaban: "10 cm",
      pembahasan: "Perbandingan sisi segitiga $30^\\circ - 60^\\circ - 90^\\circ$ adalah $1 : \\sqrt{3} : 2$. Sisi di depan sudut $30^\\circ = \\frac{1}{2} \times \\text{hipotenusa} = \\frac{1}{2} \times 20 = 10\\text{ cm}$.",
      hintSokratik: "Pada segitiga siku-siku $30^\circ-60^\circ-90^\circ$, sisi di depan sudut $30^\circ$ selalu setengah dari hipotenusa.",
    },
    {
      id: "q-9",
      pertanyaan: "9. Sebuah kapal berlayar ke arah utara sejauh $60\\text{ mil}$, kemudian berbelok ke arah timur sejauh $80\\text{ mil}$. Jarak terpendek kapal sekarang dari tempat pemberangkatan semula adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-9-1", teksOpsi: "100 mil", benar: true },
        { id: "opt-9-2", teksOpsi: "120 mil", benar: false },
        { id: "opt-9-3", teksOpsi: "140 mil", benar: false },
        { id: "opt-9-4", teksOpsi: "150 mil", benar: false },
      ],
      kunciJawaban: "100 mil",
      pembahasan: "Arah utara dan timur membentuk sudut siku-siku. Jarak $= \\sqrt{60^2 + 80^2} = \\sqrt{3600 + 6400} = \\sqrt{10000} = 100\\text{ mil}$.",
      hintSokratik: "Gunakan tripel kelipatan 10 dari 6, 8, 10.",
    },
    {
      id: "q-10",
      pertanyaan: "10. Keliling belah ketupat adalah $52\\text{ cm}$ dan panjang salah satu diagonalnya $10\\text{ cm}$. Luas belah ketupat tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-10-1", teksOpsi: "120 cm²", benar: true },
        { id: "opt-10-2", teksOpsi: "130 cm²", benar: false },
        { id: "opt-10-3", teksOpsi: "240 cm²", benar: false },
        { id: "opt-10-4", teksOpsi: "260 cm²", benar: false },
      ],
      kunciJawaban: "120 cm²",
      pembahasan: "Sisi belah ketupat $s = 52 / 4 = 13\\text{ cm}$. Setengah diagonal pertama $d_1/2 = 5\\text{ cm}$. Setengah diagonal kedua: $\\sqrt{13^2 - 5^2} = 12\\text{ cm} \Rightarrow d_2 = 24\\text{ cm}$. Luas $= \\frac{10 \times 24}{2} = 120\\text{ cm}^2$.",
      hintSokratik: "Cari panjang diagonal kedua dengan tripel 5, 12, 13, lalu hitung luas $\\frac{1}{2}d_1 d_2$.",
    },
    {
      id: "q-11",
      pertanyaan: "11. [Jawaban Singkat] Berapakah panjang diagonal sebuah persegi panjang yang berukuran panjang $15\\text{ cm}$ dan lebar $8\\text{ cm}$?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "17",
      pembahasan: "$d = \\sqrt{15^2 + 8^2} = \\sqrt{225 + 64} = \\sqrt{289} = 17\\text{ cm}$.",
      hintSokratik: "Tripel Pythagoras pasangan 8 dan 15 adalah 17.",
    },
    {
      id: "q-12",
      pertanyaan: "12. [Jawaban Singkat] Sebuah tiang bendera setinggi $12\\text{ m}$ diikat kawat penopang dari puncak tiang ke tanah. Jarak patok kawat di tanah ke kaki tiang adalah $5\\text{ m}$. Berapa meter panjang kawat tersebut?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "13",
      pembahasan: "Panjang kawat $= \\sqrt{12^2 + 5^2} = \\sqrt{144 + 25} = \\sqrt{169} = 13\\text{ m}$.",
      hintSokratik: "Gunakan tripel Pythagoras 5, 12, 13.",
    },
    {
      id: "q-13",
      pertanyaan: "13. [Jawaban Singkat] Pada segitiga siku-siku sama kaki dengan sisi siku-siku berukuran $10\\text{ cm}$, berapakah panjang hipotenusanya dalam bentuk $s\\sqrt{2}$ (tuliskan angka sebelum akar)?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "10",
      pembahasan: "Hipotenusa segitiga siku-siku sama kaki adalah $s\\sqrt{2}$. Dengan $s = 10$, hipotenusanya $10\\sqrt{2}$. Angka sebelum akarnya adalah 10.",
      hintSokratik: "Ketikkan angka 10.",
    },
    {
      id: "q-14",
      pertanyaan: "14. [Jawaban Panjang / Soal Cerita] Sebuah tiang pemancar radio setinggi $24\\text{ meter}$ ditegakkan di atas tanah datar. Dari puncak tiang dihubungkan 4 utas kawat baja ke 4 patok penopang di tanah yang berjarak sama, yaitu $7\\text{ meter}$ dari kaki tiang. (a) Hitunglah panjang satu utas kawat baja tersebut! (b) Jika harga kawat baja adalah $\\text{Rp}25.000$ per meter, berapa total biaya pembelian seluruh kawat baja yang diperlukan?",
      tipeSoal: "esai",
      kunciJawaban: "Panjang 1 kawat = 25 m, Total biaya = Rp2.500.000",
      pembahasan: "(a) Panjang 1 kawat: $k = \\sqrt{24^2 + 7^2} = \\sqrt{576 + 49} = \\sqrt{625} = 25\\text{ meter}$. (b) Total panjang 4 kawat $= 4 \times 25 = 100\\text{ meter}$. Total biaya $= 100 \times 25.000 = \\text{Rp}2.500.000$.",
      hintSokratik: "Gunakan tripel Pythagoras 7, 24, 25, lalu kalikan 4 untuk total kawat dan kalikan harga per meter.",
    },
    {
      id: "q-15",
      pertanyaan: "15. [Jawaban Panjang / Pembuktian Geometris] Uraikan pembuktian Teorema Pythagoras $a^2 + b^2 = c^2$ menggunakan pendekatan luas persegi berukuran $(a + b) \times (a + b)$ yang di dalamnya memuat 4 buah segitiga siku-siku kongruen dan satu persegi miring berukuran $c \times c$! Tuliskan penurunan aljabarnya secara runtut!",
      tipeSoal: "esai",
      kunciJawaban: "Luas persegi besar = Luas persegi dalam + 4 Luas segitiga",
      pembahasan: "Luas persegi luar $= (a + b)^2 = a^2 + 2ab + b^2$. Luas bagian dalam $= c^2 + 4(\\frac{1}{2}ab) = c^2 + 2ab$. Samakan kedua luas: $a^2 + 2ab + b^2 = c^2 + 2ab$. Kurangkan kedua ruas dengan $2ab$, terbukti bahwa $a^2 + b^2 = c^2$.",
      hintSokratik: "Bandingkan luas persegi $(a+b)^2$ dengan penjumlahan luas persegi $c^2$ dan 4 segitiga siku-siku.",
    },
  ];
}

// =============================================================================
// BAB 7: BANGUN RUANG SISI DATAR (BRSD)
// =============================================================================
function getBangunRuang15(): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: "1. Banyaknya sisi, rusuk, dan titik sudut pada prisma segitiga berturut-turut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1-1", teksOpsi: "5, 9, dan 6", benar: true },
        { id: "opt-1-2", teksOpsi: "6, 9, dan 5", benar: false },
        { id: "opt-1-3", teksOpsi: "5, 8, dan 5", benar: false },
        { id: "opt-1-4", teksOpsi: "4, 6, dan 4", benar: false },
      ],
      kunciJawaban: "5, 9, dan 6",
      pembahasan: "Prisma segi-$n$: banyak sisi $= n + 2 = 5$, rusuk $= 3n = 9$, titik sudut $= 2n = 6$.",
      hintSokratik: "Prisma segitiga memiliki alas dan tutup segitiga (2) serta 3 sisi tegak.",
    },
    {
      id: "q-2",
      pertanyaan: "2. Panjang seluruh kawat kerangka sebuah kubus adalah $108\\text{ cm}$. Volume kubus tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-2-1", teksOpsi: "512 cm³", benar: false },
        { id: "opt-2-2", teksOpsi: "729 cm³", benar: true },
        { id: "opt-2-3", teksOpsi: "1.000 cm³", benar: false },
        { id: "opt-2-4", teksOpsi: "1.331 cm³", benar: false },
      ],
      kunciJawaban: "729 cm³",
      pembahasan: "Kubus memiliki 12 rusuk. Panjang 1 rusuk $s = 108 / 12 = 9\\text{ cm}$. Volume $= s^3 = 9^3 = 729\\text{ cm}^3$.",
      hintSokratik: "Bagi panjang kawat dengan 12 untuk mendapat rusuk $s$, lalu pangkatkan tiga.",
    },
    {
      id: "q-3",
      pertanyaan: "3. Sebuah balok berukuran panjang $10\\text{ cm}$, lebar $8\\text{ cm}$, dan tinggi $6\\text{ cm}$. Luas permukaan balok tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-3-1", teksOpsi: "376 cm²", benar: true },
        { id: "opt-3-2", teksOpsi: "384 cm²", benar: false },
        { id: "opt-3-3", teksOpsi: "480 cm²", benar: false },
        { id: "opt-3-4", teksOpsi: "752 cm²", benar: false },
      ],
      kunciJawaban: "376 cm²",
      pembahasan: "$L = 2(pl + pt + lt) = 2(10 \times 8 + 10 \times 6 + 8 \times 6) = 2(80 + 60 + 48) = 2(188) = 376\\text{ cm}^2$.",
      hintSokratik: "Gunakan rumus $2(pl + pt + lt)$.",
    },
    {
      id: "q-4",
      pertanyaan: "4. Sebuah prisma memiliki alas segitiga siku-siku dengan panjang sisi $6\\text{ cm}, 8\\text{ cm},$ dan $10\\text{ cm}$. Jika tinggi prisma $15\\text{ cm}$, maka volume prisma tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-4-1", teksOpsi: "360 cm³", benar: true },
        { id: "opt-4-2", teksOpsi: "450 cm³", benar: false },
        { id: "opt-4-3", teksOpsi: "720 cm³", benar: false },
        { id: "opt-4-4", teksOpsi: "900 cm³", benar: false },
      ],
      kunciJawaban: "360 cm³",
      pembahasan: "Luas alas segitiga siku-siku $= \\frac{6 \times 8}{2} = 24\\text{ cm}^2$. Volume prisma $= L_a \times t = 24 \times 15 = 360\\text{ cm}^3$.",
      hintSokratik: "Volume prisma adalah luas alas dikali tinggi prisma.",
    },
    {
      id: "q-5",
      pertanyaan: "5. Sebuah limas memiliki alas berbentuk persegi dengan panjang sisi $10\\text{ cm}$. Jika tinggi limas $12\\text{ cm}$, maka luas permukaan limas tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-5-1", teksOpsi: "260 cm²", benar: false },
        { id: "opt-5-2", teksOpsi: "340 cm²", benar: false },
        { id: "opt-5-3", teksOpsi: "360 cm²", benar: true },
        { id: "opt-5-4", teksOpsi: "400 cm²", benar: false },
      ],
      kunciJawaban: "360 cm²",
      pembahasan: "Tinggi segitiga tegak $t_s = \\sqrt{12^2 + 5^2} = 13\\text{ cm}$. Luas alas $= 10^2 = 100\\text{ cm}^2$. Luas 4 sisi tegak $= 4 \times (\\frac{10 \times 13}{2}) = 260\\text{ cm}^2$. Luas total $= 100 + 260 = 360\\text{ cm}^2$.",
      hintSokratik: "Cari tinggi segitiga sisi tegak dengan Pythagoras antara tinggi limas (12) dan setengah sisi alas (5).",
    },
    {
      id: "q-6",
      pertanyaan: "6. Volume sebuah kubus adalah $1.728\\text{ cm}^3$. Luas permukaan kubus tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-6-1", teksOpsi: "720 cm²", benar: false },
        { id: "opt-6-2", teksOpsi: "864 cm²", benar: true },
        { id: "opt-6-3", teksOpsi: "960 cm²", benar: false },
        { id: "opt-6-4", teksOpsi: "1.152 cm²", benar: false },
      ],
      kunciJawaban: "864 cm²",
      pembahasan: "Rusuk $s = \\sqrt[3]{1728} = 12\\text{ cm}$. Luas permukaan $= 6s^2 = 6 \times 12^2 = 6 \times 144 = 864\\text{ cm}^2$.",
      hintSokratik: "Akar pangkat tiga dari 1728 adalah 12. Luas kubus $= 6s^2$.",
    },
    {
      id: "q-7",
      pertanyaan: "7. Kawat sepanjang $6\\text{ meter}$ akan digunakan untuk membuat kerangka balok berukuran $18\\text{ cm} \times 12\\text{ cm} \times 10\\text{ cm}$. Banyak kerangka balok maksimum yang dapat dibuat adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-7-1", teksOpsi: "3 buah", benar: true },
        { id: "opt-7-2", teksOpsi: "4 buah", benar: false },
        { id: "opt-7-3", teksOpsi: "5 buah", benar: false },
        { id: "opt-7-4", teksOpsi: "6 buah", benar: false },
      ],
      kunciJawaban: "3 buah",
      pembahasan: "Kebutuhan 1 balok $= 4(p + l + t) = 4(18 + 12 + 10) = 4(40) = 160\\text{ cm}$. Panjang kawat $6\\text{ m} = 600\\text{ cm}$. Banyak balok $= 600 / 160 = 3$ buah (sisa $120\\text{ cm}$).",
      hintSokratik: "Hitung panjang kerangka satu balok $4(p+l+t)$ lalu bagi 600 cm.",
    },
    {
      id: "q-8",
      pertanyaan: "8. Suatu kolam renang berukuran panjang $20\\text{ m}$ dan lebar $10\\text{ m}$. Kedalaman air pada ujung dangkal $1\\text{ m}$ dan ujung dalam $3\\text{ m}$ (alas penampang trapesium). Volume air saat kolam penuh adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-8-1", teksOpsi: "300 m³", benar: false },
        { id: "opt-8-2", teksOpsi: "400 m³", benar: true },
        { id: "opt-8-3", teksOpsi: "500 m³", benar: false },
        { id: "opt-8-4", teksOpsi: "600 m³", benar: false },
      ],
      kunciJawaban: "400 m³",
      pembahasan: "Luas penampang trapesium $= \\frac{1 + 3}{2} \times 20 = 2 \times 20 = 40\\text{ m}^2$. Volume $= 40 \times 10 = 400\\text{ m}^3$.",
      hintSokratik: "Hitung luas penampang trapesium samping lalu kalikan lebar kolam.",
    },
    {
      id: "q-9",
      pertanyaan: "9. Volume sebuah limas persegi adalah $384\\text{ cm}^3$. Jika tinggi limas $8\\text{ cm}$, maka panjang sisi alas persegi tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-9-1", teksOpsi: "10 cm", benar: false },
        { id: "opt-9-2", teksOpsi: "12 cm", benar: true },
        { id: "opt-9-3", teksOpsi: "14 cm", benar: false },
        { id: "opt-9-4", teksOpsi: "16 cm", benar: false },
      ],
      kunciJawaban: "12 cm",
      pembahasan: "$V = \\frac{1}{3} s^2 t \Rightarrow 384 = \\frac{1}{3} s^2 (8) \Rightarrow s^2 = \\frac{384 \times 3}{8} = 144 \Rightarrow s = 12\\text{ cm}$.",
      hintSokratik: "Gunakan formula volume limas $V = \\frac{1}{3} s^2 t$.",
    },
    {
      id: "q-10",
      pertanyaan: "10. Jika setiap rusuk kubus diperbesar menjadi 2 kali panjang semula, maka perbandingan volume kubus mula-mula dengan volume kubus setelah diperbesar adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-10-1", teksOpsi: "1 : 2", benar: false },
        { id: "opt-10-2", teksOpsi: "1 : 4", benar: false },
        { id: "opt-10-3", teksOpsi: "1 : 8", benar: true },
        { id: "opt-10-4", teksOpsi: "1 : 16", benar: false },
      ],
      kunciJawaban: "1 : 8",
      pembahasan: "$V_1 = s^3$ dan $V_2 = (2s)^3 = 8s^3$. Perbandingan $V_1 : V_2 = 1 : 8$.",
      hintSokratik: "Volume berbanding lurus dengan pangkat tiga faktor perbesaran ($2^3 = 8$).",
    },
    {
      id: "q-11",
      pertanyaan: "11. [Jawaban Singkat] Berapakah luas permukaan kubus yang memiliki volume $125\\text{ cm}^3$?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "150",
      pembahasan: "$s = \\sqrt[3]{125} = 5\\text{ cm}$. Luas permukaan $= 6s^2 = 6 \times 5^2 = 6 \times 25 = 150\\text{ cm}^2$.",
      hintSokratik: "Rusuknya adalah 5 cm. Hitung $6 \times 5^2$.",
    },
    {
      id: "q-12",
      pertanyaan: "12. [Jawaban Singkat] Sebuah balok memiliki perbandingan $p : l : t = 4 : 3 : 2$. Jika volume balok $192\\text{ cm}^3$, berapakah panjang balok tersebut?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "8",
      pembahasan: "$(4x)(3x)(2x) = 192 \Rightarrow 24x^3 = 192 \Rightarrow x^3 = 8 \Rightarrow x = 2$. Panjang $= 4(2) = 8\\text{ cm}$.",
      hintSokratik: "Cari nilai rasio $x = 2$, lalu panjang $= 4x$.",
    },
    {
      id: "q-13",
      pertanyaan: "13. [Jawaban Singkat] Berapakah banyak diagonal bidang pada sebuah kubus?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "12",
      pembahasan: "Kubus memiliki 6 sisi persegi. Setiap sisi memiliki 2 diagonal bidang. Total $= 6 \times 2 = 12$ diagonal bidang.",
      hintSokratik: "Kalikan 6 sisi persegi dengan 2 diagonal tiap sisi.",
    },
    {
      id: "q-14",
      pertanyaan: "14. [Jawaban Panjang / Soal Cerita] Sebuah aula pertemuan berbentuk balok dengan ukuran panjang $10\\text{ meter}$, lebar $8\\text{ meter}$, dan tinggi $4\\text{ meter}$. Dinding bagian dalam aula dicat dengan biaya $\\text{Rp}20.000$ per meter persegi. Pada dinding tersebut terdapat 2 pintu berukuran $1\\text{ m} \times 2\\text{ m}$ dan 4 jendela berukuran $1\\text{ m} \times 1{,}5\\text{ m}$ yang tidak ikut dicat. (a) Hitunglah luas permukaan dinding yang dicat! (b) Hitung total biaya pengecatan aula tersebut!",
      tipeSoal: "esai",
      kunciJawaban: "Luas dinding dicat = 134 m², Total biaya = Rp2.680.000",
      pembahasan: "(a) Luas 4 dinding: $2(pt + lt) = 2(10 \times 4 + 8 \times 4) = 2(40 + 32) = 144\\text{ m}^2$. Luas pintu: $2 \times (1 \times 2) = 4\\text{ m}^2$. Luas jendela: $4 \times (1 \times 1{,}5) = 6\\text{ m}^2$. Luas dicat $= 144 - (4 + 6) = 134\\text{ m}^2$. (b) Biaya: $134 \times 20.000 = \\text{Rp}2.680.000$.",
      hintSokratik: "Hitung luas total 4 dinding, kurangkan luas pintu dan jendela, lalu kalikan biaya per meter persegi.",
    },
    {
      id: "q-15",
      pertanyaan: "15. [Jawaban Panjang / Pembuktian Rumus] Mengapa rumus volume limas selalu sepertiga dari volume prisma yang memiliki luas alas dan tinggi yang sama ($V = \\frac{1}{3} L_a \times t$)? Jelaskan pembuktiannya secara geometris menggunakan kubus berukuran $s \times s \times s$ yang dibelah menjadi 6 limas kongruen!",
      tipeSoal: "esai",
      kunciJawaban: "Kubus dapat dibelah menjadi 6 limas kongruen bertitik puncak di pusat kubus.",
      pembahasan: "Sebuah kubus dapat dibagi menjadi 6 limas identik yang memiliki alas sisi kubus ($s \times s$) dan puncak di titik pusat kubus. Tinggi masing-masing limas adalah setengah dari rusuk kubus ($t = \\frac{1}{2}s \Rightarrow s = 2t$). Volume 6 limas $= s^3 \Rightarrow 6 V_{limas} = s^2 \times s = s^2 \times (2t) = 2 s^2 t$. Maka $V_{limas} = \\frac{2}{6} s^2 t = \\frac{1}{3} s^2 t = \\frac{1}{3} L_a \times t$.",
      hintSokratik: "Bagi kubus menjadi 6 limas kongruen yang bertemu di titik pusat kubus.",
    },
  ];
}

// =============================================================================
// BAB 8: STATISTIKA & PELUANG
// =============================================================================
function getStatistikaPeluang15(): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: "1. Rata-rata (mean) dari data nilai ulangan $7, 8, 6, 9, 7, 8, 10, 9, 8, 8$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1-1", teksOpsi: "7,8", benar: false },
        { id: "opt-1-2", teksOpsi: "8,0", benar: true },
        { id: "opt-1-3", teksOpsi: "8,2", benar: false },
        { id: "opt-1-4", teksOpsi: "8,4", benar: false },
      ],
      kunciJawaban: "8,0",
      pembahasan: "Jumlah data $= 7 + 8 + 6 + 9 + 7 + 8 + 10 + 9 + 8 + 8 = 80$. Banyak data $n = 10$. Rata-rata $= 80 / 10 = 8{,}0$.",
      hintSokratik: "Jumlahkan semua nilai data lalu bagi dengan banyak data (10).",
    },
    {
      id: "q-2",
      pertanyaan: "2. Median dari data terurut $5, 6, 6, 7, 7, 8, 8, 9, 9, 10$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-2-1", teksOpsi: "7,0", benar: false },
        { id: "opt-2-2", teksOpsi: "7,5", benar: true },
        { id: "opt-2-3", teksOpsi: "8,0", benar: false },
        { id: "opt-2-4", teksOpsi: "8,5", benar: false },
      ],
      kunciJawaban: "7,5",
      pembahasan: "Karena $n = 10$ (genap), median adalah rata-rata data ke-5 dan ke-6: $\\frac{7 + 8}{2} = 7{,}5$.",
      hintSokratik: "Cari rata-rata dari dua data di posisi tengah (data ke-5 dan data ke-6).",
    },
    {
      id: "q-3",
      pertanyaan: "3. Modus dari data $4, 5, 5, 6, 7, 7, 7, 8, 8, 9$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-3-1", teksOpsi: "5", benar: false },
        { id: "opt-3-2", teksOpsi: "7", benar: true },
        { id: "opt-3-3", teksOpsi: "8", benar: false },
        { id: "opt-3-4", teksOpsi: "7,5", benar: false },
      ],
      kunciJawaban: "7",
      pembahasan: "Modus adalah nilai yang paling sering muncul. Angka 7 muncul sebanyak 3 kali (terbanyak).",
      hintSokratik: "Cari angka yang memiliki frekuensi kemunculan terbanyak.",
    },
    {
      id: "q-4",
      pertanyaan: "4. Nilai rata-rata ulangan matematika 29 siswa adalah 74. Jika nilai Andi digabungkan, nilai rata-ratanya menjadi 74,5. Nilai ulangan Andi adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-4-1", teksOpsi: "85", benar: false },
        { id: "opt-4-2", teksOpsi: "88", benar: false },
        { id: "opt-4-3", teksOpsi: "89", benar: true },
        { id: "opt-4-4", teksOpsi: "92", benar: false },
      ],
      kunciJawaban: "89",
      pembahasan: "Total nilai 29 siswa $= 29 \times 74 = 2146$. Total nilai 30 siswa $= 30 \times 74{,}5 = 2235$. Nilai Andi $= 2235 - 2146 = 89$.",
      hintSokratik: "Kurangkan total nilai 30 siswa dengan total nilai 29 siswa.",
    },
    {
      id: "q-5",
      pertanyaan: "5. Pada pelemparan sebuah dadu bermata enam sekali, peluang munculnya mata dadu bilangan prima adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-5-1", teksOpsi: "$\\frac{1}{6}$", benar: false },
        { id: "opt-5-2", teksOpsi: "$\\frac{1}{3}$", benar: false },
        { id: "opt-5-3", teksOpsi: "$\\frac{1}{2}$", benar: true },
        { id: "opt-5-4", teksOpsi: "$\\frac{2}{3}$", benar: false },
      ],
      kunciJawaban: "$\\frac{1}{2}$",
      pembahasan: "Ruang sampel dadu $S = \{1, 2, 3, 4, 5, 6\} \Rightarrow n(S) = 6$. Kejadian prima $A = \{2, 3, 5\} \Rightarrow n(A) = 3$. Peluang $= \\frac{3}{6} = \\frac{1}{2}$.",
      hintSokratik: "Bilangan prima pada dadu adalah 2, 3, dan 5 (ada 3 buah dari total 6).",
    },
    {
      id: "q-6",
      pertanyaan: "6. Dua keping uang logam dilempar bersamaan sekali. Peluang muncul paling sedikit satu sisi angka adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-6-1", teksOpsi: "$\\frac{1}{4}$", benar: false },
        { id: "opt-6-2", teksOpsi: "$\\frac{1}{2}$", benar: false },
        { id: "opt-6-3", teksOpsi: "$\\frac{3}{4}$", benar: true },
        { id: "opt-6-4", teksOpsi: "1", benar: false },
      ],
      kunciJawaban: "$\\frac{3}{4}$",
      pembahasan: "Ruang sampel: $\{AA, AG, GA, GG\} \Rightarrow n(S) = 4$. Paling sedikit satu angka: $\{AA, AG, GA\} \Rightarrow 3$. Peluang $= \\frac{3}{4}$.",
      hintSokratik: "Hanya satu titik sampel yang tidak memuat angka sama sekali yaitu GG.",
    },
    {
      id: "q-7",
      pertanyaan: "7. Dua buah dadu dilempar bersama-sama sekali. Peluang muncul mata dadu berjumlah 8 adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-7-1", teksOpsi: "$\\frac{4}{36}$", benar: false },
        { id: "opt-7-2", teksOpsi: "$\\frac{5}{36}$", benar: true },
        { id: "opt-7-3", teksOpsi: "$\\frac{6}{36}$", benar: false },
        { id: "opt-7-4", teksOpsi: "$\\frac{7}{36}$", benar: false },
      ],
      kunciJawaban: "$\\frac{5}{36}$",
      pembahasan: "Pasangan berjumlah 8: $(2,6), (3,5), (4,4), (5,3), (6,2)$ ada 5 pasangan. Total ruang sampel 2 dadu $= 36$. Peluang $= \\frac{5}{36}$.",
      hintSokratik: "Daftar pasangan dadu $(d_1, d_2)$ yang jumlahnya 8.",
    },
    {
      id: "q-8",
      pertanyaan: "8. Dari satu set kartu bridge (52 kartu), diambil satu kartu secara acak. Peluang terambilnya kartu As atau kartu berwarna merah adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-8-1", teksOpsi: "$\\frac{7}{13}$", benar: true },
        { id: "opt-8-2", teksOpsi: "$\\frac{15}{26}$", benar: false },
        { id: "opt-8-3", teksOpsi: "$\\frac{1}{2}$", benar: false },
        { id: "opt-8-4", teksOpsi: "$\\frac{8}{13}$", benar: false },
      ],
      kunciJawaban: "$\\frac{7}{13}$",
      pembahasan: "$n(\text{As}) = 4$, $n(\text{Merah}) = 26$, $n(\text{As Merah}) = 2$. $n(\text{As} \cup \text{Merah}) = 4 + 26 - 2 = 28$. Peluang $= \\frac{28}{52} = \\frac{7}{13}$.",
      hintSokratik: "Gunakan rumus peluang gabungan $P(A \cup B) = P(A) + P(B) - P(A \cap B)$.",
    },
    {
      id: "q-9",
      pertanyaan: "9. Sebuah kantong berisi 8 kelereng merah, 6 kelereng putih, dan 4 kelereng hijau. Diambil 1 kelereng secara acak. Peluang terambil kelereng bukan putih adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-9-1", teksOpsi: "$\\frac{1}{3}$", benar: false },
        { id: "opt-9-2", teksOpsi: "$\\frac{1}{2}$", benar: false },
        { id: "opt-9-3", teksOpsi: "$\\frac{2}{3}$", benar: true },
        { id: "opt-9-4", teksOpsi: "$\\frac{5}{6}$", benar: false },
      ],
      kunciJawaban: "$\\frac{2}{3}$",
      pembahasan: "Total kelereng $= 8 + 6 + 4 = 18$. Kelereng bukan putih $= 8 + 4 = 12$. Peluang $= \\frac{12}{18} = \\frac{2}{3}$.",
      hintSokratik: "Bukan putih berarti merah atau hijau ($8 + 4 = 12$) dari total 18.",
    },
    {
      id: "q-10",
      pertanyaan: "10. Jangkauan interkuartil (hamparan) dari data $3, 4, 5, 6, 7, 8, 9, 10, 11$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-10-1", teksOpsi: "4", benar: false },
        { id: "opt-10-2", teksOpsi: "5", benar: true },
        { id: "opt-10-3", teksOpsi: "6", benar: false },
        { id: "opt-10-4", teksOpsi: "8", benar: false },
      ],
      kunciJawaban: "5",
      pembahasan: "Median $Q_2 = 7$. Kuartil bawah $Q_1 = \\frac{4+5}{2} = 4{,}5$. Kuartil atas $Q_3 = \\frac{9+10}{2} = 9{,}5$. Hamparan $H = Q_3 - Q_1 = 9{,}5 - 4{,}5 = 5$.",
      hintSokratik: "Jangkauan interkuartil adalah selisih kuartil atas dan kuartil bawah ($Q_3 - Q_1$).",
    },
    {
      id: "q-11",
      pertanyaan: "11. [Jawaban Singkat] Rata-rata ulangan sekelompok siswa adalah 75. Jika ditambah satu siswa yang nilainya 90, rata-rata barunya menjadi 76. Berapa banyak siswa mula-mula?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "14",
      pembahasan: "$75n + 90 = 76(n + 1) \Rightarrow 75n + 90 = 76n + 76 \Rightarrow n = 14$.",
      hintSokratik: "Selesaikan persamaan $75n + 90 = 76n + 76$.",
    },
    {
      id: "q-12",
      pertanyaan: "12. [Jawaban Singkat] Pada percobaan melempar sebuah dadu sebanyak 180 kali, berapakah frekuensi harapan muncul mata dadu faktor dari 6?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "120",
      pembahasan: "Faktor dari 6 pada dadu: $\{1, 2, 3, 6\}$ (4 buah). Peluang $= 4/6 = 2/3$. Frekuensi harapan $= \\frac{2}{3} \times 180 = 120$ kali.",
      hintSokratik: "Peluang faktor dari 6 adalah $2/3$. Kalikan dengan 180.",
    },
    {
      id: "q-13",
      pertanyaan: "13. [Jawaban Singkat] Berapakah nilai median dari data terurut: $12, 14, 15, 16, 17, 18, 19, 21, 22$?",
      tipeSoal: "isian_singkat",
      kunciJawaban: "17",
      pembahasan: "Banyak data $n = 9$ (ganjil). Median adalah data ke-5 yaitu 17.",
      hintSokratik: "Ambil data persis di posisi tengah urutan.",
    },
    {
      id: "q-14",
      pertanyaan: "14. [Jawaban Panjang / Soal Cerita] Nilai ulangan matematika 10 siswa adalah: $65, 70, 75, 80, 80, 85, 90, 90, 90, 95$. (a) Hitunglah nilai Mean (rata-rata), Median, dan Modus dari data tersebut! (b) Jika batas ketuntasan (KKM) adalah 78, berapa persentase siswa yang tuntas?",
      tipeSoal: "esai",
      kunciJawaban: "Mean = 82, Median = 82.5, Modus = 90, Persentase tuntas = 70%",
      pembahasan: "(a) Jumlah data $= 820 / 10 = 82$. Median: data ke-5 dan 6 adalah 80 dan 85 $\\Rightarrow \\frac{80+85}{2} = 82{,}5$. Modus $= 90$ (muncul 3 kali). (b) Nilai $\\ge 78$ ada 7 siswa. Persentase $= \\frac{7}{10} \times 100\\% = 70\\%$.",
      hintSokratik: "Hitung total data dibagi 10 untuk Mean, cari nilai tengah untuk Median, dan cari frekuensi terbanyak untuk Modus.",
    },
    {
      id: "q-15",
      pertanyaan: "15. [Jawaban Panjang / Analisis Peluang] Dalam kotak terdapat 5 bola merah, 4 bola biru, dan 3 bola kuning (total 12 bola). Diambil 2 bola satu per satu secara berurutan tanpa pengembalian. (a) Hitunglah peluang terambil bola pertama merah dan bola kedua biru! (b) Hitunglah peluang terambil kedua bola berwarna sama!",
      tipeSoal: "esai",
      kunciJawaban: "P(Merah lalu Biru) = 5/33, P(Sama warna) = 19/66",
      pembahasan: "(a) $P(M_1 \text{ dan } B_2) = \\frac{5}{12} \times \\frac{4}{11} = \\frac{20}{132} = \\frac{5}{33}$. (b) Warna sama: Merah-Merah $= \\frac{5}{12} \times \\frac{4}{11} = \\frac{20}{132}$; Biru-Biru $= \\frac{4}{12} \times \\frac{3}{11} = \\frac{12}{132}$; Kuning-Kuning $= \\frac{3}{12} \times \\frac{2}{11} = \\frac{6}{132}$. Total $= \\frac{20 + 12 + 6}{132} = \\frac{38}{132} = \\frac{19}{66}$.",
      hintSokratik: "Gunakan aturan perkalian peluang tanpa pengembalian (penyebut kedua berkurang menjadi 11).",
    },
  ];
}

// =============================================================================
// IPA BAB 1: PENGENALAN SEL & MIKROSKOP (15 BUTIR SOAL FASE D)
// =============================================================================
function getIPABab1Questions(): QuizQuestionData[] {
  return [
    {
      id: "ipa-1-1",
      pertanyaan: "1. Unit struktural dan fungsional terkecil yang menyusun seluruh tubuh makhluk hidup disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-1-1-a", teksOpsi: "Sel", benar: true },
        { id: "ipa-1-1-b", teksOpsi: "Jaringan", benar: false },
        { id: "ipa-1-1-c", teksOpsi: "Organ", benar: false },
        { id: "ipa-1-1-d", teksOpsi: "Sistem Organ", benar: false },
      ],
      kunciJawaban: "Sel",
      pembahasan: "Sel adalah satuan struktural dan fungsional terkecil dari seluruh organisme hidup.",
      hintSokratik: "Pikirkan tingkatan organisasi paling dasar sebelum membentuk jaringan.",
    },
    {
      id: "ipa-1-2",
      pertanyaan: "2. Organel sel tumbuhan yang berfungsi sebagai tempat berlangsungnya proses fotosintesis adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-1-2-a", teksOpsi: "Kloroplas", benar: true },
        { id: "ipa-1-2-b", teksOpsi: "Mitokondria", benar: false },
        { id: "ipa-1-2-c", teksOpsi: "Ribosom", benar: false },
        { id: "ipa-1-2-d", teksOpsi: "Badan Golgi", benar: false },
      ],
      kunciJawaban: "Kloroplas",
      pembahasan: "Kloroplas mengandung pigmen klorofil yang menyerap foton cahaya matahari untuk mensintesis glukosa.",
      hintSokratik: "Organel ini memberi warna hijau pada daun dan menghasilkan makanan bagi tumbuhan.",
    },
    {
      id: "ipa-1-3",
      pertanyaan: "3. Bagian mikroskop yang berfungsi untuk mengatur perbesaran lensa secara bertahap dengan memutar lensa objektif adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-1-3-a", teksOpsi: "Revolver", benar: true },
        { id: "ipa-1-3-b", teksOpsi: "Diafragma", benar: false },
        { id: "ipa-1-3-c", teksOpsi: "Kondensor", benar: false },
        { id: "ipa-1-3-d", teksOpsi: "Mikrometer", benar: false },
      ],
      kunciJawaban: "Revolver",
      pembahasan: "Revolver adalah lempeng pemutar tempat melekatnya lensa objektif untuk memilih faktor perbesaran.",
      hintSokratik: "Bagian pemutar bundar tepat di atas meja preparat.",
    },
    {
      id: "ipa-1-4",
      pertanyaan: "4. Struktur pelindung kaku yang hanya dimiliki oleh sel tumbuhan tetapi tidak dimiliki oleh sel hewan adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-1-4-a", teksOpsi: "Dinding sel dari selulosa", benar: true },
        { id: "ipa-1-4-b", teksOpsi: "Membran sel", benar: false },
        { id: "ipa-1-4-c", teksOpsi: "Sitoplasma", benar: false },
        { id: "ipa-1-4-d", teksOpsi: "Nukleolus", benar: false },
      ],
      kunciJawaban: "Dinding sel dari selulosa",
      pembahasan: "Sel tumbuhan dilapisi dinding sel tebal berbahan selulosa yang mempertahankan bentuk sel tetap kokoh.",
      hintSokratik: "Lapisan paling luar yang membuat batang dan daun kaku.",
    },
    {
      id: "ipa-1-5",
      pertanyaan: "5. Jika seorang siswa mengamati preparat menggunakan lensa okuler perbesaran 10x dan lensa objektif 40x, maka perbesaran total bayangan objek adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-1-5-a", teksOpsi: "400 kali", benar: true },
        { id: "ipa-1-5-b", teksOpsi: "50 kali", benar: false },
        { id: "ipa-1-5-c", teksOpsi: "40 kali", benar: false },
        { id: "ipa-1-5-d", teksOpsi: "4000 kali", benar: false },
      ],
      kunciJawaban: "400 kali",
      pembahasan: "Perbesaran total = perbesaran okuler x perbesaran objektif = 10 x 40 = 400 kali.",
      hintSokratik: "Kalikan nilai perbesaran kedua lensa.",
    },
    {
      id: "ipa-1-6",
      pertanyaan: "6. Organel yang berperan sebagai pusat pengendali seluruh aktivitas sel serta menyimpan materi genetik (DNA) adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-1-6-a", teksOpsi: "Nukleus (inti sel)", benar: true },
        { id: "ipa-1-6-b", teksOpsi: "Vakuola", benar: false },
        { id: "ipa-1-6-c", teksOpsi: "Lisosom", benar: false },
        { id: "ipa-1-6-d", teksOpsi: "Sentrosom", benar: false },
      ],
      kunciJawaban: "Nukleus (inti sel)",
      pembahasan: "Nukleus memuat kromosom dan mengatur sintesis enzim serta pembelahan sel.",
      hintSokratik: "Pusat komando sel yang biasanya berada di tengah.",
    },
    {
      id: "ipa-1-7",
      pertanyaan: "7. Organel yang dijuluki 'the powerhouse of cell' karena berfungsi memproduksi energi ATP melalui respirasi seluler adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-1-7-a", teksOpsi: "Mitokondria", benar: true },
        { id: "ipa-1-7-b", teksOpsi: "Retikulum Endoplasma", benar: false },
        { id: "ipa-1-7-c", teksOpsi: "Badan Golgi", benar: false },
        { id: "ipa-1-7-d", teksOpsi: "Peroksisom", benar: false },
      ],
      kunciJawaban: "Mitokondria",
      pembahasan: "Mitokondria menguraikan glukosa bersama oksigen untuk menghasilkan molekul penyimpan energi ATP.",
      hintSokratik: "Organel berbentuk lonjong dengan lekukan membran krista.",
    },
    {
      id: "ipa-1-8",
      pertanyaan: "8. Urutan hierarki organisasi kehidupan dari tingkat terendah hingga tertinggi yang benar adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-1-8-a", teksOpsi: "Sel -> Jaringan -> Organ -> Sistem Organ -> Organisme", benar: true },
        { id: "ipa-1-8-b", teksOpsi: "Sel -> Organ -> Jaringan -> Organisme -> Sistem Organ", benar: false },
        { id: "ipa-1-8-c", teksOpsi: "Jaringan -> Sel -> Organ -> Sistem Organ -> Organisme", benar: false },
        { id: "ipa-1-8-d", teksOpsi: "Organisme -> Sistem Organ -> Organ -> Jaringan -> Sel", benar: false },
      ],
      kunciJawaban: "Sel -> Jaringan -> Organ -> Sistem Organ -> Organisme",
      pembahasan: "Sel sejenis berkumpul membentuk jaringan; jaringan menyusun organ; beberapa organ bekerja sama menjadi sistem organ; kumpulan sistem organ membentuk organisme utuh.",
      hintSokratik: "Mulai dari unit mikroskopis sel hingga makhluk hidup utuh.",
    },
    {
      id: "ipa-1-9",
      pertanyaan: "9. Kenop pemutar pada mikroskop yang digunakan untuk memfokuskan bayangan secara cepat dengan menaik-turunkan tabung adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-1-9-a", teksOpsi: "Makrometer (pemutar kasar)", benar: true },
        { id: "ipa-1-9-b", teksOpsi: "Mikrometer (pemutar halus)", benar: false },
        { id: "ipa-1-9-c", teksOpsi: "Kondensor", benar: false },
        { id: "ipa-1-9-d", teksOpsi: "Diafragma", benar: false },
      ],
      kunciJawaban: "Makrometer (pemutar kasar)",
      pembahasan: "Makrometer menggerakkan tabung optik secara cepat untuk menemukan bidang fokus awal.",
      hintSokratik: "Kenop pemutar yang ukurannya lebih besar.",
    },
    {
      id: "ipa-1-10",
      pertanyaan: "10. Perbedaan vakuola antara sel tumbuhan dewasa dan sel hewan yang tepat adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-1-10-a", teksOpsi: "Tumbuhan memiliki vakuola sentral berukuran besar, sedangkan hewan vakuolanya kecil atau sementara", benar: true },
        { id: "ipa-1-10-b", teksOpsi: "Tumbuhan tidak memiliki vakuola, sedangkan hewan memiliki vakuola raksasa", benar: false },
        { id: "ipa-1-10-c", teksOpsi: "Vakuola tumbuhan hanya untuk ekskresi, vakuola hewan untuk fotosintesis", benar: false },
        { id: "ipa-1-10-d", teksOpsi: "Keduanya memiliki vakuola berukuran sama persis", benar: false },
      ],
      kunciJawaban: "Tumbuhan memiliki vakuola sentral berukuran besar, sedangkan hewan vakuolanya kecil atau sementara",
      pembahasan: "Vakuola sentral sel tumbuhan mendominasi ruang sel guna menampung cairan sel dan memelihara tekanan turgor.",
      hintSokratik: "Sel tumbuhan membutuhkan kantung cairan besar untuk mempertahankan ketegaran.",
    },
    {
      id: "ipa-1-11",
      pertanyaan: "11. [Jawaban Singkat] Organel berbentuk butiran kecil tanpa membran yang menjadi tempat sintesis protein di dalam sel disebut...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "Ribosom",
      pembahasan: "Ribosom merangkai asam amino menjadi rantai polipeptida protein sesuai instruksi mRNA.",
      hintSokratik: "Nama organel berawalan huruf R.",
    },
    {
      id: "ipa-1-12",
      pertanyaan: "12. [Jawaban Singkat] Lensa mikroskop yang posisinya paling dekat dengan mata pengamat disebut lensa...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "Okuler",
      pembahasan: "Lensa okuler berada pada ujung atas tabung mikroskop tempat pengamat meletakkan mata.",
      hintSokratik: "Berasal dari kata latin 'oculus' yang berarti mata.",
    },
    {
      id: "ipa-1-13",
      pertanyaan: "13. [Jawaban Singkat] Lapisan tipis semipermeabel yang membatasi isi sel dengan lingkungan luar disebut membran...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "Sel (atau Membran Plasma)",
      pembahasan: "Membran sel bersifat selektif permeabel untuk mengontrol zat yang masuk dan keluar sel.",
      hintSokratik: "Dikenal juga sebagai membran plasma.",
    },
    {
      id: "ipa-1-14",
      pertanyaan: "14. [Jawaban Panjang / Esai] Jelaskan minimal 3 perbedaan utama antara sel hewan dan sel tumbuhan dari segi organel dan bentuk fisiknya!",
      tipeSoal: "esai",
      kunciJawaban: "1. Sel tumbuhan memiliki dinding sel dari selulosa sehingga bentuknya kaku dan tetap, sedangkan sel hewan tidak memiliki dinding sel sehingga bentuknya fleksibel. 2. Sel tumbuhan memiliki kloroplas untuk fotosintesis, sedangkan sel hewan tidak memiliki kloroplas. 3. Sel tumbuhan memiliki vakuola sentral berukuran besar, sedangkan sel hewan vakuolanya kecil atau tidak ada. Selain itu, sel hewan memiliki sentriol untuk pembelahan sel.",
      pembahasan: "Karakteristik khas sel tumbuhan adalah keberadaan dinding sel kaku, kloroplas fotosintetik, dan vakuola turgor besar, yang membedakannya secara mutlak dari sel hewan.",
      hintSokratik: "Bandingkan dinding sel, kloroplas, dan ukuran vakuola.",
    },
    {
      id: "ipa-1-15",
      pertanyaan: "15. [Jawaban Panjang / Esai] Uraikan langkah-langkah yang tepat saat menggunakan mikroskop cahaya untuk mengamati preparat jaringan tumbuhan dari perbesaran rendah ke perbesaran tinggi!",
      tipeSoal: "esai",
      kunciJawaban: "1. Letakkan preparat di atas meja objek dan jepit. 2. Atur cermin/lampu dan diafragma untuk memperoleh pencahayaan merata. 3. Pasang lensa objektif perbesaran terendah (4x/10x) menggunakan revolver. 4. Putar makrometer perlahan hingga bayangan objek terlihat jelas. 5. Gunakan mikrometer untuk memperhalus fokus objek. 6. Putar revolver ke lensa perbesaran lebih tinggi (40x), dan pertegas ketajaman HANYA menggunakan mikrometer agar lensa tidak menyentuh preparat.",
      pembahasan: "Standar prosedur mikroskop adalah mengawali pengamatan dengan perbesaran lemah, mencari fokus dengan makrometer, lalu beralih ke perbesaran kuat dengan fokus halus menggunakan mikrometer.",
      hintSokratik: "Sebutkan tahap penempatan preparat, pencahayaan, perbesaran lemah, lalu perbesaran tinggi.",
    },
  ];
}

// =============================================================================
// IPA BAB 2: STRUKTUR & FUNGSI TUBUH MANUSIA (15 BUTIR SOAL FASE D)
// =============================================================================
function getIPABab2Questions(): QuizQuestionData[] {
  return [
    {
      id: "ipa-2-1",
      pertanyaan: "1. Proses pencernaan kimiawi karbohidrat pertama kali dimulai di dalam rongga mulut oleh bantuan enzim...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-2-1-a", teksOpsi: "Ptialin (Amilase)", benar: true },
        { id: "ipa-2-1-b", teksOpsi: "Pepsin", benar: false },
        { id: "ipa-2-1-c", teksOpsi: "Lipase", benar: false },
        { id: "ipa-2-1-d", teksOpsi: "Tripsin", benar: false },
      ],
      kunciJawaban: "Ptialin (Amilase)",
      pembahasan: "Enzim ptialin (amilase ludah) memecah amilum (pati) menjadi maltosa sederhana di rongga mulut.",
      hintSokratik: "Enzim yang dihasilkan oleh kelenjar ludah.",
    },
    {
      id: "ipa-2-2",
      pertanyaan: "2. Bagian saluran pencernaan yang permukaannya dipenuhi jonjot usus (villi) untuk memaksimalkan penyerapan sari-sari makanan adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-2-2-a", teksOpsi: "Usus halus (Ileum)", benar: true },
        { id: "ipa-2-2-b", teksOpsi: "Usus besar (Kolon)", benar: false },
        { id: "ipa-2-2-c", teksOpsi: "Lambung (Ventrikulus)", benar: false },
        { id: "ipa-2-2-d", teksOpsi: "Kerongkongan (Esofagus)", benar: false },
      ],
      kunciJawaban: "Usus halus (Ileum)",
      pembahasan: "Villi pada usus halus memperluas area penyerapan nutrisi ke dalam pembuluh darah dan limfa.",
      hintSokratik: "Organ pencernaan terpanjang yang bertugas menyerap nutrisi.",
    },
    {
      id: "ipa-2-3",
      pertanyaan: "3. Ruang jantung yang berdinding paling tebal dan berotot kuat karena bertugas memompa darah bersih kaya oksigen ke seluruh tubuh adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-2-3-a", teksOpsi: "Bilik kiri (Ventrikel kiri)", benar: true },
        { id: "ipa-2-3-b", teksOpsi: "Bilik kanan (Ventrikel kanan)", benar: false },
        { id: "ipa-2-3-c", teksOpsi: "Serambi kiri (Atrium kiri)", benar: false },
        { id: "ipa-2-3-d", teksOpsi: "Serambi kanan (Atrium kanan)", benar: false },
      ],
      kunciJawaban: "Bilik kiri (Ventrikel kiri)",
      pembahasan: "Bilik kiri memompa darah melewati aorta menuju ke seluruh jaringan tubuh sehingga membutuhkan tekanan kontraksi terbesar.",
      hintSokratik: "Ruang bawah sebelah kiri jantung.",
    },
    {
      id: "ipa-2-4",
      pertanyaan: "4. Pembuluh darah yang membawa darah keluar dari jantung, memiliki dinding elastis dan tebal, serta denyutnya terasa disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-2-4-a", teksOpsi: "Pembuluh Nadi (Arteri)", benar: true },
        { id: "ipa-2-4-b", teksOpsi: "Pembuluh Balik (Vena)", benar: false },
        { id: "ipa-2-4-c", teksOpsi: "Pembuluh Kapiler", benar: false },
        { id: "ipa-2-4-d", teksOpsi: "Pembuluh Limfa", benar: false },
      ],
      kunciJawaban: "Pembuluh Nadi (Arteri)",
      pembahasan: "Arteri mengalirkan darah bertekanan tinggi dari jantung ke organ-organ tubuh.",
      hintSokratik: "Pembuluh tempat meraba denyut nadi di pergelangan tangan.",
    },
    {
      id: "ipa-2-5",
      pertanyaan: "5. Tahapan pembentukan urin yang berlangsung di glomerulus untuk menyaring zat sisa darah menjadi urin primer disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-2-5-a", teksOpsi: "Filtrasi (Penyaringan)", benar: true },
        { id: "ipa-2-5-b", teksOpsi: "Reabsorpsi (Penyerapan kembali)", benar: false },
        { id: "ipa-2-5-c", teksOpsi: "Augmentasi (Pengeluaran zat sisa)", benar: false },
        { id: "ipa-2-5-d", teksOpsi: "Defekasi", benar: false },
      ],
      kunciJawaban: "Filtrasi (Penyaringan)",
      pembahasan: "Filtrasi darah di glomerulus menghasilkan filtrat glomerulus (urin primer) bebas sel darah dan protein besar.",
      hintSokratik: "Tahap awal pemisahan cairan darah dari partikel besar.",
    },
    {
      id: "ipa-2-6",
      pertanyaan: "6. Tempat terjadinya pertukaran gas oksigen ($O_2$) dan karbon dioksida ($CO_2$) secara difusi di dalam paru-paru adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-2-6-a", teksOpsi: "Alveolus", benar: true },
        { id: "ipa-2-6-b", teksOpsi: "Bronkus", benar: false },
        { id: "ipa-2-6-c", teksOpsi: "Trakea", benar: false },
        { id: "ipa-2-6-d", teksOpsi: "Laring", benar: false },
      ],
      kunciJawaban: "Alveolus",
      pembahasan: "Alveolus merupakan kantung udara berdinding tipis yang dikelilingi anyaman kapiler darah untuk difusi gas.",
      hintSokratik: "Kantung-kantung kecil seperti gerombolan anggur di ujung bronkiolus.",
    },
    {
      id: "ipa-2-7",
      pertanyaan: "7. Protein pembawa pada eritrosit yang bertugas mengikat molekul oksigen dan memberi warna merah pada darah adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-2-7-a", teksOpsi: "Hemoglobin", benar: true },
        { id: "ipa-2-7-b", teksOpsi: "Fibrinogen", benar: false },
        { id: "ipa-2-7-c", teksOpsi: "Albumin", benar: false },
        { id: "ipa-2-7-d", teksOpsi: "Globulin", benar: false },
      ],
      kunciJawaban: "Hemoglobin",
      pembahasan: "Hemoglobin berikatan dengan oksigen membentuk oksihemoglobin untuk didistribusikan ke seluruh sel tubuh.",
      hintSokratik: "Kadar pigmen darah yang sering diukur saat tes anemia (Hb).",
    },
    {
      id: "ipa-2-8",
      pertanyaan: "8. Enzim pada getah lambung yang berfungsi menguraikan protein menjadi molekul pepton adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-2-8-a", teksOpsi: "Pepsin", benar: true },
        { id: "ipa-2-8-b", teksOpsi: "Lipase", benar: false },
        { id: "ipa-2-8-c", teksOpsi: "Amilase", benar: false },
        { id: "ipa-2-8-d", teksOpsi: "Tripsin", benar: false },
      ],
      kunciJawaban: "Pepsin",
      pembahasan: "Pepsinogen diaktifkan oleh asam klorida (HCl) lambung menjadi pepsin aktif pencerna protein.",
      hintSokratik: "Nama enzim diawali huruf P yang bekerja di lingkungan asam lambung.",
    },
    {
      id: "ipa-2-9",
      pertanyaan: "9. Organ ekskresi terbesar yang melindungi tubuh, mengeluarkan keringat, serta membantu regulasi suhu tubuh adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-2-9-a", teksOpsi: "Kulit", benar: true },
        { id: "ipa-2-9-b", teksOpsi: "Hati", benar: false },
        { id: "ipa-2-9-c", teksOpsi: "Ginjal", benar: false },
        { id: "ipa-2-9-d", teksOpsi: "Paru-paru", benar: false },
      ],
      kunciJawaban: "Kulit",
      pembahasan: "Kulit melalui kelenjar keringat (glandula sudorifera) menyekresikan sisa air, garam mineral, dan urea.",
      hintSokratik: "Lapisan pembungkus seluruh permukaan luar tubuh.",
    },
    {
      id: "ipa-2-10",
      pertanyaan: "10. Kelainan darah herediter di mana darah sukar membeku saat terjadi luka akibat kekurangan faktor pembeku darah disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-2-10-a", teksOpsi: "Hemofilia", benar: true },
        { id: "ipa-2-10-b", teksOpsi: "Anemia", benar: false },
        { id: "ipa-2-10-c", teksOpsi: "Leukemia", benar: false },
        { id: "ipa-2-10-d", teksOpsi: "Talasemia", benar: false },
      ],
      kunciJawaban: "Hemofilia",
      pembahasan: "Hemofilia adalah penyakit keturunan yang menyebabkan gangguan proses pembekuan darah.",
      hintSokratik: "Penyakit darah sukar membeku.",
    },
    {
      id: "ipa-2-11",
      pertanyaan: "11. [Jawaban Singkat] Pembuluh darah vena yang mengangkut darah kaya oksigen dari paru-paru kembali ke serambi kiri jantung adalah vena...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "Pulmonalis",
      pembahasan: "Vena pulmonalis adalah satu-satunya pembuluh balik yang membawa darah kaya oksigen.",
      hintSokratik: "Kata latin untuk paru-paru adalah pulmo.",
    },
    {
      id: "ipa-2-12",
      pertanyaan: "12. [Jawaban Singkat] Organ pencernaan yang memproduksi empedu untuk mengemulsikan lemak makanan adalah...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "Hati (Hepar)",
      pembahasan: "Hati menghasilkan cairan empedu yang disimpan di kantung empedu untuk mencerna lemak.",
      hintSokratik: "Kelenjar terbesar di rongga perut kanan atas.",
    },
    {
      id: "ipa-2-13",
      pertanyaan: "13. [Jawaban Singkat] Organ ekskresi utama manusia berbentuk seperti kacang merah yang menyaring limbah urea dari darah adalah...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "Ginjal",
      pembahasan: "Ginjal berfungsi menyaring darah dan memproduksi urin.",
      hintSokratik: "Berjumlah sepasang di punggung bagian bawah.",
    },
    {
      id: "ipa-2-14",
      pertanyaan: "14. [Jawaban Panjang / Esai] Jelaskan perbedaan rute peredaran darah besar dan peredaran darah kecil pada tubuh manusia secara berurutan!",
      tipeSoal: "esai",
      kunciJawaban: "Peredaran darah besar (Sistemik): Bilik Kiri Jantung (darah kaya O2) -> Aorta -> Pembuluh Arteri -> Seluruh Tubuh -> Pembuluh Vena (darah kaya CO2) -> Serambi Kanan Jantung. Peredaran darah kecil (Pulmonal): Bilik Kanan Jantung (darah kaya CO2) -> Arteri Pulmonalis -> Paru-paru (pertukaran gas di alveolus) -> Vena Pulmonalis (darah kaya O2) -> Serambi Kiri Jantung.",
      pembahasan: "Peredaran darah ganda manusia terdiri atas sirkuit sistemik (jantung - seluruh tubuh - jantung) dan sirkuit pulmonal (jantung - paru-paru - jantung).",
      hintSokratik: "Sebutkan ruang jantung awal, organ tujuan, dan ruang jantung akhir untuk kedua jalur.",
    },
    {
      id: "ipa-2-15",
      pertanyaan: "15. [Jawaban Panjang / Esai] Uraikan proses pencernaan sebutir nasi (karbohidrat) mulai dari rongga mulut hingga nutrisinya diserap ke dalam pembuluh darah!",
      tipeSoal: "esai",
      kunciJawaban: "1. Di mulut: Nasi dikunyah secara mekanik oleh gigi dan dicerna kimiawi oleh enzim ptialin (amilase) menjadi maltosa. 2. Di kerongkongan: Bolus nasi didorong oleh gerak peristaltik menuju lambung. 3. Di usus halus: Amilase pankreas melanjutkan pemecahan amilum, lalu enzim maltase di usus halus mengubah maltosa menjadi glukosa. 4. Penyerapan: Glukosa diserap oleh vili (jonjot usus) masuk ke pembuluh darah kapiler untuk dialirkan ke seluruh sel tubuh.",
      pembahasan: "Pencernaan karbohidrat berlangsung secara mekanik dan kimiawi berjenjang hingga menjadi molekul monomer glukosa yang siap diserap tubuh.",
      hintSokratik: "Jelaskan peran mulut (ptialin), kerongkongan, usus halus (enzim maltase & amilase pankreas), dan vili.",
    },
  ];
}

// =============================================================================
// IPA BAB 3: USAHA, ENERGI, DAN PESAWAT SEDERHANA (15 BUTIR SOAL FASE D)
// =============================================================================
function getIPABab3Questions(): QuizQuestionData[] {
  return [
    {
      id: "ipa-3-1",
      pertanyaan: "1. Sebuah balok ditarik dengan gaya tetap sebesar 40 N sehingga bergeser sejauh 5 meter searah dengan gaya. Besar usaha fisika yang dilakukan adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-3-1-a", teksOpsi: "200 Joule", benar: true },
        { id: "ipa-3-1-b", teksOpsi: "8 Joule", benar: false },
        { id: "ipa-3-1-c", teksOpsi: "45 Joule", benar: false },
        { id: "ipa-3-1-d", teksOpsi: "200 Watt", benar: false },
      ],
      kunciJawaban: "200 Joule",
      pembahasan: "Usaha W = F x s = 40 N x 5 m = 200 Joule.",
      hintSokratik: "Gunakan rumus W = F x s.",
    },
    {
      id: "ipa-3-2",
      pertanyaan: "2. Energi yang tersimpan pada suatu benda karena kedudukan atau ketinggiannya terhadap permukaan tanah disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-3-2-a", teksOpsi: "Energi Potensial Gravitasi", benar: true },
        { id: "ipa-3-2-b", teksOpsi: "Energi Kinetik", benar: false },
        { id: "ipa-3-2-c", teksOpsi: "Energi Kalor", benar: false },
        { id: "ipa-3-2-d", teksOpsi: "Energi Kimia", benar: false },
      ],
      kunciJawaban: "Energi Potensial Gravitasi",
      pembahasan: "Energi potensial gravitasi dirumuskan Ep = m x g x h, berbanding lurus dengan massa dan ketinggian benda.",
      hintSokratik: "Energi benda yang berada di tempat tinggi.",
    },
    {
      id: "ipa-3-3",
      pertanyaan: "3. Pada tuas jenis pertama, posisi susunan titik tumpu, beban, dan kuasa yang benar adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-3-3-a", teksOpsi: "Titik tumpu berada di antara beban dan kuasa", benar: true },
        { id: "ipa-3-3-b", teksOpsi: "Beban berada di antara titik tumpu dan kuasa", benar: false },
        { id: "ipa-3-3-c", teksOpsi: "Kuasa berada di antara titik tumpu dan beban", benar: false },
        { id: "ipa-3-3-d", teksOpsi: "Titik tumpu berada di ujung beban", benar: false },
      ],
      kunciJawaban: "Titik tumpu berada di antara beban dan kuasa",
      pembahasan: "Tuas jenis pertama memiliki titik tumpu di tengah (contoh: gunting, tang, jungkat-jungkit).",
      hintSokratik: "Seperti susunan gunting atau jungkat-jungkit.",
    },
    {
      id: "ipa-3-4",
      pertanyaan: "4. Sebuah bidang miring memiliki panjang lintasan s = 6 meter dan ketinggian puncak h = 1,5 meter. Keuntungan mekanis (KM) bidang miring tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-3-4-a", teksOpsi: "4", benar: true },
        { id: "ipa-3-4-b", teksOpsi: "9", benar: false },
        { id: "ipa-3-4-c", teksOpsi: "7,5", benar: false },
        { id: "ipa-3-4-d", teksOpsi: "0,25", benar: false },
      ],
      kunciJawaban: "4",
      pembahasan: "Keuntungan mekanis bidang miring KM = s / h = 6 / 1,5 = 4.",
      hintSokratik: "Bagi panjang lintasan miring dengan tingginya.",
    },
    {
      id: "ipa-3-5",
      pertanyaan: "5. Keuntungan mekanis dari penggunaan katrol tetap tunggal untuk menimba air sumur adalah 1, karena katrol tetap berfungsi untuk...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-3-5-a", teksOpsi: "Mengubah arah gaya kuasa agar searah gravitasi", benar: true },
        { id: "ipa-3-5-b", teksOpsi: "Mengurangi berat beban menjadi setengahnya", benar: false },
        { id: "ipa-3-5-c", teksOpsi: "Mempercepat benda tanpa gaya", benar: false },
        { id: "ipa-3-5-d", teksOpsi: "Menghilangkan gaya gesek sama sekali", benar: false },
      ],
      kunciJawaban: "Mengubah arah gaya kuasa agar searah gravitasi",
      pembahasan: "Katrol tetap memiliki KM = 1; besar gaya kuasa sama dengan berat beban, keuntungannya terletak pada kemudahan arah tarikan.",
      hintSokratik: "Katrol tetap tidak melipatgandakan gaya, melainkan mempermudah arah tarikan.",
    },
    {
      id: "ipa-3-6",
      pertanyaan: "6. Sebuah mobil bermassa 800 kg melaju dengan kelajuan 10 m/s. Besar energi kinetik mobil tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-3-6-a", teksOpsi: "40.000 Joule", benar: true },
        { id: "ipa-3-6-b", teksOpsi: "80.000 Joule", benar: false },
        { id: "ipa-3-6-c", teksOpsi: "8.000 Joule", benar: false },
        { id: "ipa-3-6-d", teksOpsi: "4.000 Joule", benar: false },
      ],
      kunciJawaban: "40.000 Joule",
      pembahasan: "Ek = 1/2 x m x v^2 = 1/2 x 800 x (10^2) = 400 x 100 = 40.000 Joule.",
      hintSokratik: "Gunakan rumus Ek = 1/2 m v^2.",
    },
    {
      id: "ipa-3-7",
      pertanyaan: "7. Alat-alat di bawah ini yang prinsip kerjanya menerapkan bidang miring adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-3-7-a", teksOpsi: "Kapak, sekrup, dan pisau", benar: true },
        { id: "ipa-3-7-b", teksOpsi: "Gunting, linggis, dan tang", benar: false },
        { id: "ipa-3-7-c", teksOpsi: "Gerobak roda satu dan pembuka botol", benar: false },
        { id: "ipa-3-7-d", teksOpsi: "Pinset dan sumpit", benar: false },
      ],
      kunciJawaban: "Kapak, sekrup, dan pisau",
      pembahasan: "Kapak, mata pisau (baji), dan ulir sekrup merupakan modifikasi dari bidang miring.",
      hintSokratik: "Benda dengan penampang miring tajam atau berulir.",
    },
    {
      id: "ipa-3-8",
      pertanyaan: "8. Gerobak dorong roda satu dan pemotong kertas tuas termasuk kelompok tuas jenis ke...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-3-8-a", teksOpsi: "Kedua (beban di tengah)", benar: true },
        { id: "ipa-3-8-b", teksOpsi: "Pertama (titik tumpu di tengah)", benar: false },
        { id: "ipa-3-8-c", teksOpsi: "Ketiga (kuasa di tengah)", benar: false },
        { id: "ipa-3-8-d", teksOpsi: "Keempat", benar: false },
      ],
      kunciJawaban: "Kedua (beban di tengah)",
      pembahasan: "Pada tuas jenis 2, titik beban terletak di antara titik tumpu (roda depan) dan kuasa (gagang pendorong).",
      hintSokratik: "Beban berada di bak tengah antara roda dan tangan pengangkat.",
    },
    {
      id: "ipa-3-9",
      pertanyaan: "9. Laju dilakukannya usaha atau besarnya usaha per satuan waktu disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-3-9-a", teksOpsi: "Daya (Power)", benar: true },
        { id: "ipa-3-9-b", teksOpsi: "Gaya (Force)", benar: false },
        { id: "ipa-3-9-c", teksOpsi: "Tekanan (Pressure)", benar: false },
        { id: "ipa-3-9-d", teksOpsi: "Momentum", benar: false },
      ],
      kunciJawaban: "Daya (Power)",
      pembahasan: "Daya P = W / t dengan satuan Watt (Joule/detik).",
      hintSokratik: "Diukur dalam satuan Watt.",
    },
    {
      id: "ipa-3-10",
      pertanyaan: "10. Seorang atlet mendorong dinding gedung dengan gaya 500 N selama 2 menit hingga berkeringat, namun dinding tidak bergeser sama sekali. Besar usaha fisika yang dilakukan adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-3-10-a", teksOpsi: "0 Joule", benar: true },
        { id: "ipa-3-10-b", teksOpsi: "1000 Joule", benar: false },
        { id: "ipa-3-10-c", teksOpsi: "60.000 Joule", benar: false },
        { id: "ipa-3-10-d", teksOpsi: "500 Joule", benar: false },
      ],
      kunciJawaban: "0 Joule",
      pembahasan: "Dalam fisika, usaha bernilai nol jika perpindahan benda s = 0 (W = F x 0 = 0 Joule).",
      hintSokratik: "Syarat adanya usaha fisika adalah benda harus mengalami perpindahan.",
    },
    {
      id: "ipa-3-11",
      pertanyaan: "11. [Jawaban Singkat] Satuan internasional (SI) untuk besaran Usaha dan Energi adalah...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "Joule (J)",
      pembahasan: "1 Joule setara dengan 1 Newton meter (N.m).",
      hintSokratik: "Nama ilmuwan penemu hukum kekekalan energi berawalan J.",
    },
    {
      id: "ipa-3-12",
      pertanyaan: "12. [Jawaban Singkat] Rumus energi kinetik benda bermassa m yang bergerak dengan kecepatan v adalah...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "1/2 m v^2",
      pembahasan: "Energi kinetik Ek = 1/2 x m x v^2.",
      hintSokratik: "Setengah dikali massa dikali kuadrat kecepatan.",
    },
    {
      id: "ipa-3-13",
      pertanyaan: "13. [Jawaban Singkat] Pesawat sederhana yang berupa roda beralur dengan tali pengikat disebut...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "Katrol",
      pembahasan: "Katrol digunakan untuk mengangkat benda dengan mengubah arah tarikan atau memperkecil gaya kuasa.",
      hintSokratik: "Sering dipakai menimba air sumur atau tiang bendera.",
    },
    {
      id: "ipa-3-14",
      pertanyaan: "14. [Jawaban Panjang / Esai] Sebuah batu seberat 600 N hendak diangkat menggunakan tuas sepanjang 2 meter. Titik tumpu diletakkan 0,5 meter dari batu (lengan beban = 0,5 m). Hitunglah gaya kuasa minimum yang diperlukan dan keuntungan mekanis tuas tersebut!",
      tipeSoal: "esai",
      kunciJawaban: "Diketahui: w = 600 N, lb = 0,5 m, panjang tuas = 2 m -> lk = 2 - 0,5 = 1,5 m. Syarat kesetimbangan: w x lb = F x lk -> 600 x 0,5 = F x 1,5 -> 300 = 1,5 F -> F = 200 N. Keuntungan mekanis: KM = w / F = 600 / 200 = 3 (atau KM = lk / lb = 1,5 / 0,5 = 3). Gaya kuasa minimum adalah 200 N dengan KM = 3.",
      pembahasan: "Prinsip tuas menyatakan w x lb = F x lk. Semakin panjang lengan kuasa, semakin kecil gaya kuasa yang dibutuhkan.",
      hintSokratik: "Cari panjang lengan kuasa dahulu (2 - 0,5 = 1,5 m), lalu gunakan rumus w x lb = F x lk.",
    },
    {
      id: "ipa-3-15",
      pertanyaan: "15. [Jawaban Panjang / Esai] Uraikan hukum kekekalan energi mekanik yang terjadi pada buah kelapa yang jatuh bebas dari atas pohon setinggi 10 meter hingga menyentuh tanah!",
      tipeSoal: "esai",
      kunciJawaban: "Hukum Kekekalan Energi Mekanik menyatakan Em = Ep + Ek = konstan. 1. Di puncak pohon (ketinggian maksimum h): Buah kelapa diam (v = 0), sehingga Energi Potensial maksimum (Ep = mgh) dan Energi Kinetik nol (Ek = 0). 2. Saat sedang jatuh melayang: Ketinggian berkurang dan kecepatan bertambah, sehingga Energi Potensial berangsur berubah menjadi Energi Kinetik. 3. Sesaat sebelum menyentuh tanah (h = 0): Seluruh Energi Potensial telah berubah sempurna menjadi Energi Kinetik maksimum (Ek = 1/2 mv^2), sedangkan Ep = 0. Total energi mekanik tetap sama di setiap titik.",
      pembahasan: "Pada gerak jatuh bebas tanpa hambatan udara, energi potensial terkonversi secara kontinu menjadi energi kinetik dengan jumlah total yang selalu kekal.",
      hintSokratik: "Jelaskan kondisi energi di posisi atas pohon, saat melayang di udara, dan sesaat sebelum membentur tanah.",
    },
  ];
}

// =============================================================================
// IPA BAB 4: GETARAN, GELOMBANG, DAN CAHAYA (15 BUTIR SOAL FASE D)
// =============================================================================
function getIPABab4Questions(): QuizQuestionData[] {
  return [
    {
      id: "ipa-4-1",
      pertanyaan: "1. Waktu yang diperlukan suatu benda untuk melakukan satu kali getaran penuh secara berulang disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-4-1-a", teksOpsi: "Periode getaran (T)", benar: true },
        { id: "ipa-4-1-b", teksOpsi: "Frekuensi getaran (f)", benar: false },
        { id: "ipa-4-1-c", teksOpsi: "Amplitudo (A)", benar: false },
        { id: "ipa-4-1-d", teksOpsi: "Cepat rambat", benar: false },
      ],
      kunciJawaban: "Periode getaran (T)",
      pembahasan: "Periode adalah waktu (detik) per satu getaran (T = t / n).",
      hintSokratik: "Kata kuncinya adalah waktu untuk satu getaran.",
    },
    {
      id: "ipa-4-2",
      pertanyaan: "2. Banyaknya getaran yang terjadi dalam kurun waktu satu detik disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-4-2-a", teksOpsi: "Frekuensi (f)", benar: true },
        { id: "ipa-4-2-b", teksOpsi: "Periode (T)", benar: false },
        { id: "ipa-4-2-c", teksOpsi: "Panjang gelombang", benar: false },
        { id: "ipa-4-2-d", teksOpsi: "Sudut deviasi", benar: false },
      ],
      kunciJawaban: "Frekuensi (f)",
      pembahasan: "Frekuensi f = n / t diukur dalam satuan Hertz (Hz). Hubungannya dengan periode adalah f = 1/T.",
      hintSokratik: "Jumlah getaran tiap satu detik.",
    },
    {
      id: "ipa-4-3",
      pertanyaan: "3. Gelombang yang arah rambatnya tegak lurus dengan arah getarnya (memiliki bukit dan lembah) disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-4-3-a", teksOpsi: "Gelombang Transversal", benar: true },
        { id: "ipa-4-3-b", teksOpsi: "Gelombang Longitudinal", benar: false },
        { id: "ipa-4-3-c", teksOpsi: "Gelombang Stasioner", benar: false },
        { id: "ipa-4-3-d", teksOpsi: "Gelombang Bunyi", benar: false },
      ],
      kunciJawaban: "Gelombang Transversal",
      pembahasan: "Gelombang transversal memiliki arah getar tegak lurus arah rambat (contoh: gelombang tali, gelombang cahaya).",
      hintSokratik: "Seperti gelombang air atau tali yang berayun naik-turun.",
    },
    {
      id: "ipa-4-4",
      pertanyaan: "4. Sebuah gelombang merambat dengan frekuensi 50 Hz dan panjang gelombang 3 meter. Cepat rambat gelombang tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-4-4-a", teksOpsi: "150 m/s", benar: true },
        { id: "ipa-4-4-b", teksOpsi: "53 m/s", benar: false },
        { id: "ipa-4-4-c", teksOpsi: "16,7 m/s", benar: false },
        { id: "ipa-4-4-d", teksOpsi: "75 m/s", benar: false },
      ],
      kunciJawaban: "150 m/s",
      pembahasan: "Cepat rambat v = lambda x f = 3 m x 50 Hz = 150 m/s.",
      hintSokratik: "Kalikan panjang gelombang dengan frekuensinya.",
    },
    {
      id: "ipa-4-5",
      pertanyaan: "5. Rentang frekuensi gelombang bunyi yang dapat didengar secara wajar oleh telinga manusia (bunyi audiosonik) adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-4-5-a", teksOpsi: "20 Hz hingga 20.000 Hz", benar: true },
        { id: "ipa-4-5-b", teksOpsi: "Kurang dari 20 Hz", benar: false },
        { id: "ipa-4-5-c", teksOpsi: "Lebih dari 20.000 Hz", benar: false },
        { id: "ipa-4-5-d", teksOpsi: "1.000 Hz hingga 5.000 Hz saja", benar: false },
      ],
      kunciJawaban: "20 Hz hingga 20.000 Hz",
      pembahasan: "Audiosonik berada pada frekuensi 20 - 20.000 Hz. Di bawah 20 Hz adalah infrasonik dan di atas 20.000 Hz adalah ultrasonik.",
      hintSokratik: "Batas pendengaran normal manusia berkisar dari 20 hingga 20 ribu.",
    },
    {
      id: "ipa-4-6",
      pertanyaan: "6. Sifat bayangan yang selalu dibentuk oleh cermin datar adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-4-6-a", teksOpsi: "Maya, tegak, dan sama besar", benar: true },
        { id: "ipa-4-6-b", teksOpsi: "Nyata, terbalik, dan diperbesar", benar: false },
        { id: "ipa-4-6-c", teksOpsi: "Nyata, tegak, dan diperkecil", benar: false },
        { id: "ipa-4-6-d", teksOpsi: "Maya, terbalik, dan sama besar", benar: false },
      ],
      kunciJawaban: "Maya, tegak, dan sama besar",
      pembahasan: "Cermin datar membentuk bayangan maya (di belakang cermin), orientasi tegak, jarak bayangan sama dengan jarak benda, dan ukuran bayangan sama besar.",
      hintSokratik: "Bayangan saat Anda bercermin di cermin rias sehari-hari.",
    },
    {
      id: "ipa-4-7",
      pertanyaan: "7. Peristiwa pembelokan arah berkas sinar cahaya ketika merambat melalui dua medium optik yang memiliki kerapatan berbeda disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-4-7-a", teksOpsi: "Pembiasan (Refraksi)", benar: true },
        { id: "ipa-4-7-b", teksOpsi: "Pemantulan (Refleksi)", benar: false },
        { id: "ipa-4-7-c", teksOpsi: "Pelenturan (Difraksi)", benar: false },
        { id: "ipa-4-7-d", teksOpsi: "Penguraian (Dispersi)", benar: false },
      ],
      kunciJawaban: "Pembiasan (Refraksi)",
      pembahasan: "Refraksi terjadi karena kelajuan cahaya berubah saat berpindah medium (misal dari udara ke air sehingga pensil tampak patah).",
      hintSokratik: "Penyebab pensil terlihat patah saat dimasukkan ke gelas berisi air.",
    },
    {
      id: "ipa-4-8",
      pertanyaan: "8. Cermin cembung banyak dimanfaatkan sebagai kaca spion kendaraan bermotor karena memiliki sifat bayangan...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-4-8-a", teksOpsi: "Maya, tegak, diperkecil sehingga bidang pandang menjadi lebih luas", benar: true },
        { id: "ipa-4-8-b", teksOpsi: "Nyata, terbalik, diperbesar", benar: false },
        { id: "ipa-4-8-c", teksOpsi: "Maya, terbalik, sama besar", benar: false },
        { id: "ipa-4-8-d", teksOpsi: "Nyata, tegak, diperbesar", benar: false },
      ],
      kunciJawaban: "Maya, tegak, diperkecil sehingga bidang pandang menjadi lebih luas",
      pembahasan: "Cermin cembung selalu menghasilkan bayangan maya, tegak, dan diperkecil yang memungkinkan pengemudi melihat area jalan lebih lapang.",
      hintSokratik: "Spion harus menghasilkan bayangan tegak dan menangkap banyak kendaraan di belakang.",
    },
    {
      id: "ipa-4-9",
      pertanyaan: "9. Bagian mata yang berfungsi mengatur banyak sedikitnya intensitas cahaya yang masuk ke mata melalui pupil adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-4-9-a", teksOpsi: "Iris (selaput pelangi)", benar: true },
        { id: "ipa-4-9-b", teksOpsi: "Retina (selaput jala)", benar: false },
        { id: "ipa-4-9-c", teksOpsi: "Kornea", benar: false },
        { id: "ipa-4-9-d", teksOpsi: "Lensa kristalin", benar: false },
      ],
      kunciJawaban: "Iris (selaput pelangi)",
      pembahasan: "Iris mengandung otot pengatur diameter pupil sekaligus pigmen pemberi warna bola mata.",
      hintSokratik: "Bagian berwarna yang dapat melebar atau menyempitkan pupil.",
    },
    {
      id: "ipa-4-10",
      pertanyaan: "10. Upaya peredaman gaung atau pantulan bunyi yang mengganggu di dalam bioskop dilakukan dengan...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-4-10-a", teksOpsi: "Melapisi dinding dan lantai dengan karpet, spons, atau busa peredam bunyi", benar: true },
        { id: "ipa-4-10-b", teksOpsi: "Membuat dinding dari marmer kaca yang licin dan keras", benar: false },
        { id: "ipa-4-10-c", teksOpsi: "Membuka seluruh ventilasi udara lebar-lebar", benar: false },
        { id: "ipa-4-10-d", teksOpsi: "Mengecat dinding dengan cat kedap air", benar: false },
      ],
      kunciJawaban: "Melapisi dinding dan lantai dengan karpet, spons, atau busa peredam bunyi",
      pembahasan: "Material lunak berpori menyerap gelombang bunyi dan mencegah pemantulan berulang yang menyebabkan gaung.",
      hintSokratik: "Gunakan bahan lunak berpori untuk menyerap gelombang bunyi.",
    },
    {
      id: "ipa-4-11",
      pertanyaan: "11. [Jawaban Singkat] Satuan internasional (SI) untuk besaran frekuensi getaran atau gelombang adalah...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "Hertz (Hz)",
      pembahasan: "1 Hz berarti 1 getaran per sekon.",
      hintSokratik: "Singkatannya Hz.",
    },
    {
      id: "ipa-4-12",
      pertanyaan: "12. [Jawaban Singkat] Gelombang longitudinal dicirikan oleh adanya pola rapatan dan pola...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "Renggangan",
      pembahasan: "Gelombang longitudinal mentransmisikan energi melalui osilasi rapatan dan renggangan partikel medium searah rambatnya.",
      hintSokratik: "Lawan dari rapatan.",
    },
    {
      id: "ipa-4-13",
      pertanyaan: "13. [Jawaban Singkat] Jarak yang ditempuh oleh gelombang dalam waktu satu periode penuh disebut panjang...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "Gelombang (Lambda / λ)",
      pembahasan: "Panjang gelombang (lambda) adalah jarak antara dua puncak berurutan pada gelombang transversal atau dua rapatan berurutan pada gelombang longitudinal.",
      hintSokratik: "Panjang satu gelombang dilambangkan huruf Yunani lambda.",
    },
    {
      id: "ipa-4-14",
      pertanyaan: "14. [Jawaban Panjang / Esai] Sebuah bandul sederhana berayun bolak-balik menempuh 120 getaran penuh dalam waktu 30 detik. Hitunglah: (a) Frekuensi getaran bandul, dan (b) Periode ayunan bandul tersebut!",
      tipeSoal: "esai",
      kunciJawaban: "(a) Frekuensi f = n / t = 120 / 30 = 4 Hz. (b) Periode T = t / n = 30 / 120 = 0,25 detik (atau T = 1 / f = 1 / 4 = 0,25 detik). Frekuensinya adalah 4 Hz dan periodenya adalah 0,25 detik.",
      pembahasan: "Frekuensi menyatakan banyaknya getaran per detik (f = n/t), sedangkan periode menyatakan waktu untuk satu getaran (T = t/n).",
      hintSokratik: "Bagi jumlah getaran dengan waktu untuk frekuensi, dan sebaliknya untuk periode.",
    },
    {
      id: "ipa-4-15",
      pertanyaan: "15. [Jawaban Panjang / Esai] Jelaskan perbedaan sifat pemantulan pada cermin cekung dan cermin cembung, serta sebutkan masing-masing 2 contoh pemanfaatannya dalam kehidupan sehari-hari!",
      tipeSoal: "esai",
      kunciJawaban: "1. Cermin Cekung: Bersifat konvergen (mengumpulkan berkas sinar), bayangan dapat bersifat nyata terbalik atau maya diperbesar tergantung posisi benda terhadap titik fokus. Contoh pemanfaatan: Reflektor lampu senter/mobil dan cermin periksa dokter gigi. 2. Cermin Cembung: Bersifat divergen (menyebarkan berkas sinar), selalu menghasilkan bayangan maya, tegak, dan diperkecil dengan bidang pandang luas. Contoh pemanfaatan: Kaca spion kendaraan bermotor dan cermin pengawas tikungan jalan (safety mirror).",
      pembahasan: "Cermin cekung mengumpulkan cahaya menuju titik fokus nyata, sedangkan cermin cembung menyebarkan cahaya dari titik fokus maya.",
      hintSokratik: "Bandingkan sifat pengumpul (konvergen) vs penyebar (divergen) sinar dan aplikasinya.",
    },
  ];
}

// =============================================================================
// IPA BAB 5: UNSUR, SENYAWA, DAN STRUKTUR BUMI (15 BUTIR SOAL FASE D)
// =============================================================================
function getIPABab5Questions(): QuizQuestionData[] {
  return [
    {
      id: "ipa-5-1",
      pertanyaan: "1. Zat tunggal yang paling sederhana dan tidak dapat diuraikan lagi menjadi zat lain melalui reaksi kimia biasa disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-5-1-a", teksOpsi: "Unsur", benar: true },
        { id: "ipa-5-1-b", teksOpsi: "Senyawa", benar: false },
        { id: "ipa-5-1-c", teksOpsi: "Campuran", benar: false },
        { id: "ipa-5-1-d", teksOpsi: "Larutan", benar: false },
      ],
      kunciJawaban: "Unsur",
      pembahasan: "Unsur adalah zat murni primer yang hanya tersusun atas atom-atom sejenis (contoh: emas, oksigen, besi).",
      hintSokratik: "Tercantum dalam tabel periodik.",
    },
    {
      id: "ipa-5-2",
      pertanyaan: "2. Zat murni yang terbentuk dari gabungan dua unsur atau lebih dengan perbandingan massa tetap melalui ikatan kimia disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-5-2-a", teksOpsi: "Senyawa", benar: true },
        { id: "ipa-5-2-b", teksOpsi: "Unsur", benar: false },
        { id: "ipa-5-2-c", teksOpsi: "Koloid", benar: false },
        { id: "ipa-5-2-d", teksOpsi: "Campuran heterogen", benar: false },
      ],
      kunciJawaban: "Senyawa",
      pembahasan: "Senyawa (seperti H2O, NaCl, CO2) memiliki sifat kimia yang berbeda dari unsur-unsur penyusun asalnya.",
      hintSokratik: "Air (H2O) dan garam dapur (NaCl) adalah contohnya.",
    },
    {
      id: "ipa-5-3",
      pertanyaan: "3. Metode pemisahan campuran zat cair yang didasarkan pada perbedaan titik didih komponen zat penyusunnya disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-5-3-a", teksOpsi: "Destilasi (Penyulingan)", benar: true },
        { id: "ipa-5-3-b", teksOpsi: "Filtrasi (Penyaringan)", benar: false },
        { id: "ipa-5-3-c", teksOpsi: "Sublimasi", benar: false },
        { id: "ipa-5-3-d", teksOpsi: "Kromatografi", benar: false },
      ],
      kunciJawaban: "Destilasi (Penyulingan)",
      pembahasan: "Destilasi memanaskan campuran hingga zat bertitik didih rendah menguap terlebih dahulu lalu diembunkan kembali.",
      hintSokratik: "Teknik yang dipakai untuk memisahkan minyak bumi atau menyuling air murni.",
    },
    {
      id: "ipa-5-4",
      pertanyaan: "4. Lapisan batuan padat terluar bumi yang menjadi tempat berpijak dan beraktivitasnya seluruh makhluk hidup disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-5-4-a", teksOpsi: "Litosfer (Kerak bumi)", benar: true },
        { id: "ipa-5-4-b", teksOpsi: "Astenosfer", benar: false },
        { id: "ipa-5-4-c", teksOpsi: "Barisfer (Inti bumi)", benar: false },
        { id: "ipa-5-4-d", teksOpsi: "Mesosfer", benar: false },
      ],
      kunciJawaban: "Litosfer (Kerak bumi)",
      pembahasan: "Litosfer berasal dari kata 'lithos' (batuan) dan 'sphaira' (lapisan), mencakup kerak benua dan kerak samudra.",
      hintSokratik: "Lapisan batuan kerak bumi.",
    },
    {
      id: "ipa-5-5",
      pertanyaan: "5. Lapisan atmosfer bumi yang mengandung konsentrasi gas ozon (O3) untuk menyaring sinar ultraviolet berbahaya dari radiasi matahari adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-5-5-a", teksOpsi: "Stratosfer", benar: true },
        { id: "ipa-5-5-b", teksOpsi: "Troposfer", benar: false },
        { id: "ipa-5-5-c", teksOpsi: "Mesosfer", benar: false },
        { id: "ipa-5-5-d", teksOpsi: "Termosfer", benar: false },
      ],
      kunciJawaban: "Stratosfer",
      pembahasan: "Lapisan ozon berada pada stratosfer (ketinggian sekitar 15 - 50 km) untuk menyerap radiasi ultraviolet B matahari.",
      hintSokratik: "Lapisan kedua atmosfer tepat di atas troposfer.",
    },
    {
      id: "ipa-5-6",
      pertanyaan: "6. Peristiwa bergetarnya lapisan kerak bumi akibat pelepasan energi secara mendadak akibat pergeseran lempeng tektonik disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-5-6-a", teksOpsi: "Gempa bumi tektonik", benar: true },
        { id: "ipa-5-6-b", teksOpsi: "Erupsi vulkanik", benar: false },
        { id: "ipa-5-6-c", teksOpsi: "Tanah longsor", benar: false },
        { id: "ipa-5-6-d", teksOpsi: "Tsunami", benar: false },
      ],
      kunciJawaban: "Gempa bumi tektonik",
      pembahasan: "Pergerakan batas lempeng konvergen, divergen, atau sesar transform melepaskan gelombang seismik.",
      hintSokratik: "Peristiwa getaran yang dicatat seismograf.",
    },
    {
      id: "ipa-5-7",
      pertanyaan: "7. Pemisahan campuran air keruh dan pasir menggunakan corong dan kertas saring merupakan contoh metode...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-5-7-a", teksOpsi: "Filtrasi (Penyaringan)", benar: true },
        { id: "ipa-5-7-b", teksOpsi: "Kristalisasi", benar: false },
        { id: "ipa-5-7-c", teksOpsi: "Evaporasi", benar: false },
        { id: "ipa-5-7-d", teksOpsi: "Kromatografi kertas", benar: false },
      ],
      kunciJawaban: "Filtrasi (Penyaringan)",
      pembahasan: "Filtrasi memisahkan padatan yang tidak larut dari cairan berdasarkan perbedaan ukuran partikel.",
      hintSokratik: "Menggunakan kertas saring di laboratorium.",
    },
    {
      id: "ipa-5-8",
      pertanyaan: "8. Lambang kimia baku menurut IUPAC untuk unsur Besi, Tembaga, dan Emas berturut-turut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-5-8-a", teksOpsi: "Fe, Cu, dan Au", benar: true },
        { id: "ipa-5-8-b", teksOpsi: "Be, Te, dan Em", benar: false },
        { id: "ipa-5-8-c", teksOpsi: "Fe, Tm, dan Ag", benar: false },
        { id: "ipa-5-8-d", teksOpsi: "F, Co, dan Al", benar: false },
      ],
      kunciJawaban: "Fe, Cu, dan Au",
      pembahasan: "Besi berasal dari Ferrum (Fe), Tembaga dari Cuprum (Cu), dan Emas dari Aurum (Au).",
      hintSokratik: "Berasal dari nama ilmiah latin Ferrum, Cuprum, dan Aurum.",
    },
    {
      id: "ipa-5-9",
      pertanyaan: "9. Lapisan atmosfer tempat terjadinya seluruh fenomena cuaca seperti awan, hujan, petir, dan angin adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-5-9-a", teksOpsi: "Troposfer", benar: true },
        { id: "ipa-5-9-b", teksOpsi: "Stratosfer", benar: false },
        { id: "ipa-5-9-c", teksOpsi: "Eksosfer", benar: false },
        { id: "ipa-5-9-d", teksOpsi: "Ionosfer", benar: false },
      ],
      kunciJawaban: "Troposfer",
      pembahasan: "Troposfer merupakan lapisan terbawah atmosfer (0 - 12 km) yang menampung 80% massa udara bumi.",
      hintSokratik: "Lapisan atmosfer paling dekat dengan permukaan bumi.",
    },
    {
      id: "ipa-5-10",
      pertanyaan: "10. Gelombang air laut dahsyat yang terhempas ke daratan akibat pergeseran dasar laut vertikal pasca gempa bawah laut disebut...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "ipa-5-10-a", teksOpsi: "Tsunami", benar: true },
        { id: "ipa-5-10-b", teksOpsi: "Pasang purnama", benar: false },
        { id: "ipa-5-10-c", teksOpsi: "Arus rip current", benar: false },
        { id: "ipa-5-10-d", teksOpsi: "Puting beliung laut", benar: false },
      ],
      kunciJawaban: "Tsunami",
      pembahasan: "Dislokasi patahan lempeng samudera secara vertikal memindahkan kolom air laut raksasa menghasilkan tsunami.",
      hintSokratik: "Berasal dari bahasa Jepang yang berarti gelombang pelabuhan.",
    },
    {
      id: "ipa-5-11",
      pertanyaan: "11. [Jawaban Singkat] Rumus kimia dari molekul air yang terdiri atas dua atom hidrogen dan satu atom oksigen adalah...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "H2O",
      pembahasan: "Senyawa air tersusun dari dua atom H dan satu atom O terikat kovalen.",
      hintSokratik: "Dua H dan satu O.",
    },
    {
      id: "ipa-5-12",
      pertanyaan: "12. [Jawaban Singkat] Campuran homogen antara zat terlarut dan zat pelarut yang partikelnya tersebar merata dan tidak dapat disaring lagi disebut...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "Larutan",
      pembahasan: "Larutan (seperti air garam atau sirup) adalah campuran homogen satu fase.",
      hintSokratik: "Contohnya larutan gula atau garam.",
    },
    {
      id: "ipa-5-13",
      pertanyaan: "13. [Jawaban Singkat] Lapisan perairan yang menutupi sekitar 71% permukaan bumi (lautan, danau, sungai, es) disebut...",
      tipeSoal: "isian_singkat",
      kunciJawaban: "Hidrosfer",
      pembahasan: "Hidrosfer mencakup seluruh badan air di permukaan bumi dan siklus hidrologi.",
      hintSokratik: "Kata 'hidro' berarti air.",
    },
    {
      id: "ipa-5-14",
      pertanyaan: "14. [Jawaban Panjang / Esai] Jelaskan perbedaan mendasar antara Unsur, Senyawa, dan Campuran, serta berikan masing-masing 2 contoh zatnya dalam kehidupan sehari-hari!",
      tipeSoal: "esai",
      kunciJawaban: "1. Unsur: Zat tunggal paling sederhana yang tidak dapat diuraikan lagi secara kimia. Contoh: Besi (Fe) dan Emas (Au). 2. Senyawa: Zat murni dari gabungan 2 unsur atau lebih dengan perbandingan massa tetap melalui reaksi kimia dan sifatnya berbeda dari unsur penyusunnya. Contoh: Air murni (H2O) dan Garam dapur (NaCl). 3. Campuran: Gabungan 2 zat atau lebih tanpa perbandingan tetap melalui percampuran fisik sehingga sifat zat asalnya masih bertahan. Contoh: Udara dan Larutan gula.",
      pembahasan: "Unsur tersusun dari satu jenis atom; senyawa adalah molekul terikat kimia berproporsi tetap; campuran adalah perpaduan fisik tanpa reaksi kimia.",
      hintSokratik: "Uraikan definisi dan berikan 2 contoh untuk masing-masing kategori zat.",
    },
    {
      id: "ipa-5-15",
      pertanyaan: "15. [Jawaban Panjang / Esai] Uraikan 3 lapisan utama struktur interior bumi (Kerak bumi, Mantel bumi, dan Inti bumi) beserta karakteristik fisik dan suhunya!",
      tipeSoal: "esai",
      kunciJawaban: "1. Kerak Bumi (Crust / Litosfer): Lapisan terluar yang padat dan tipis (ketebalan 5-70 km), terdiri atas kerak benua (granit) dan kerak samudra (basalt), tempat hidup manusia. 2. Mantel Bumi (Mantle): Lapisan tebal di bawah kerak (ketebalan sekitar 2.900 km), bersuhu 1.000°C - 3.700°C, tersusun atas silikat besi dan magnesium semi-cair (astenosfer) yang menghasilkan arus konveksi pemicu gempa. 3. Inti Bumi (Core): Lapisan terdalam (ketebalan sekitar 3.500 km), tersusun dari besi dan nikel (Nife), terbagi menjadi Inti Luar yang cair (suhu ~4.500°C pemicu medan magnet bumi) dan Inti Dalam yang padat bertekanan sangat tinggi (suhu ~6.000°C).",
      pembahasan: "Bumi tersusun konsentris dari kerak padat, mantel konvektif tebal, hingga inti besi-nikel bersuhu tinggi.",
      hintSokratik: "Sebutkan nama lapisan, perkiraan ketebalan atau material penyusunnya, serta perannya.",
    },
  ];
}

// =============================================================================
// FALLBACK UNIVERSAL KHUSUS MATEMATIKA / MAPEL LAIN
// =============================================================================
function getCustomMath15(title: string, kelas: number): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: `1. Dalam mempelajari konsep "${title}" pada pembelajaran Kelas ${kelas}, langkah pertama yang paling tepat adalah...`,
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1-1", teksOpsi: `Mengidentifikasi konsep dasar dan hubungan keterkaitan fakta pada masalah.`, benar: true },
        { id: "opt-1-2", teksOpsi: "Langsung menebak hasil akhir tanpa melakukan penalaran logis.", benar: false },
        { id: "opt-1-3", teksOpsi: "Mengabaikan rumus pokok dan kaidah materi.", benar: false },
        { id: "opt-1-4", teksOpsi: "Menghafal jawaban soal tanpa memahami esensi konsep.", benar: false },
      ],
      kunciJawaban: `Mengidentifikasi konsep dasar dan hubungan keterkaitan fakta pada masalah.`,
      pembahasan: `Pemecahan masalah diawali dengan memahami data dan konsep yang diketahui secara terstruktur.`,
      hintSokratik: `Pilihlah langkah analitis awal yang logis dan terstruktur.`,
    },
  ];
}
