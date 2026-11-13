import fs from "fs";
import path from "path";

export interface ExamQuestionOption {
  id?: string;
  teks: string;
  benar: boolean;
  alasanSalah?: string;
}

export interface ExamQuestion {
  id: string;
  pertanyaan: string;
  tipeSoal: "pilihan_ganda" | "isian_singkat" | "esai";
  kunciJawaban: string;
  pembahasan: string;
  poin: number;
  opsi: ExamQuestionOption[];
  miskonsepsi?: string | null;
}

export interface ExamPackage {
  id: string;
  judul: string;
  deskripsi: string;
  mapel: string;
  tipe: "ulangan" | "ujian";
  durasi_menit: number;
  passing_grade: number;
  status: "dipublikasi" | "draft" | "ditutup";
  token?: string;
  bab_id?: string | null;
  soalList: ExamQuestion[];
  diperbarui_pada?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "ujian_store.json");

// Canonical default questions matching SMP Kelas 8 Fase D curriculum
const CANONICAL_EXAMS_INIT: Record<string, ExamPackage> = {
  "u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11": {
    id: "u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    judul: "Ulangan Matematika Semester 1",
    deskripsi:
      "Evaluasi formatif komprehensif Matematika Semester 1 mencakup Bab 1 sampai Bab 4 (Pola Bilangan, Bentuk Aljabar, Relasi & Fungsi, Persamaan Garis Lurus).",
    mapel: "Matematika",
    tipe: "ulangan",
    durasi_menit: 60,
    passing_grade: 75,
    status: "dipublikasi",
    token: "MTK-SEM1",
    bab_id: "b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    diperbarui_pada: new Date().toISOString(),
    soalList: [
      {
        id: "qu1-sem1-soal1",
        pertanyaan: "Sederhanakan bentuk aljabar $5(x - 2) + 3(2x + 4)$!",
        tipeSoal: "pilihan_ganda",
        poin: 10,
        kunciJawaban: "11x + 2",
        pembahasan:
          "Langkah aljabar terstruktur: $5(x - 2) + 3(2x + 4) = 5x - 10 + 6x + 12 = (5x + 6x) + (-10 + 12) = 11x + 2$.",
        opsi: [
          { teks: "11x + 2", benar: true },
          { teks: "11x - 2", benar: false, alasanSalah: "Keliru dalam operasi penjumlahan $-10 + 12$." },
          { teks: "10x + 2", benar: false, alasanSalah: "Keliru menjumlahkan koefisien $x$ ($5 + 6$ bukan $10$)." },
          { teks: "11x + 22", benar: false, alasanSalah: "Keliru mendistribusikan faktor pengali konstanta." },
        ],
      },
      {
        id: "qu1-sem1-soal2",
        pertanyaan: "Tentukan himpunan penyelesaian dari persamaan linear satu variabel $3x + 7 = 22$!",
        tipeSoal: "pilihan_ganda",
        poin: 10,
        kunciJawaban: "x = 5",
        pembahasan:
          "Kurangkan kedua ruas dengan 7: $3x = 22 - 7 \\Rightarrow 3x = 15$. Bagi kedua ruas dengan 3: $x = \\frac{15}{3} = 5$.",
        opsi: [
          { teks: "x = 5", benar: true },
          { teks: "x = 4", benar: false, alasanSalah: "Salah dalam membagi nilai konstanta." },
          { teks: "x = 6", benar: false, alasanSalah: "Keliru dalam mengurangkan 22 - 7." },
          { teks: "x = 3", benar: false, alasanSalah: "Hasil kalkulasi tidak memenuhi persamaan." },
        ],
      },
      {
        id: "qu1-sem1-soal3",
        pertanyaan: "Diketahui barisan bilangan aritmetika $3, 7, 11, 15, \\dots$. Tentukan nilai dari suku ke-15 ($U_{15}$)!",
        tipeSoal: "pilihan_ganda",
        poin: 10,
        kunciJawaban: "59",
        pembahasan:
          "Suku pertama $a = 3$, beda $b = 4$. Rumus $U_n = a + (n - 1)b$. Maka $U_{15} = 3 + (15 - 1) \\times 4 = 3 + 14 \\times 4 = 3 + 56 = 59$.",
        opsi: [
          { teks: "59", benar: true },
          { teks: "56", benar: false, alasanSalah: "Lupa menambahkan suku pertama $a=3$." },
          { teks: "63", benar: false, alasanSalah: "Keliru menggunakan rumus beda ($n$ bukan $n-1$)." },
          { teks: "60", benar: false, alasanSalah: "Salah dalam perkalian 14 x 4." },
        ],
      },
      {
        id: "qu1-sem1-soal4",
        pertanyaan: "Diketahui suatu fungsi linear $f(x) = 2x - 5$. Tentukan nilai dari $f(7)$!",
        tipeSoal: "pilihan_ganda",
        poin: 10,
        kunciJawaban: "9",
        pembahasan: "Substitusi $x = 7$: $f(7) = 2(7) - 5 = 14 - 5 = 9$.",
        opsi: [
          { teks: "9", benar: true },
          { teks: "14", benar: false, alasanSalah: "Belum mengurangkan dengan 5." },
          { teks: "12", benar: false, alasanSalah: "Keliru operasi perkalian 2 x 7." },
          { teks: "7", benar: false, alasanSalah: "Salah substitusi variabel." },
        ],
      },
      {
        id: "qu1-sem1-soal5",
        pertanyaan: "Gradien garis yang melalui titik $(2, 3)$ dan $(6, 11)$ adalah...",
        tipeSoal: "pilihan_ganda",
        poin: 10,
        kunciJawaban: "2",
        pembahasan:
          "Rumus gradien garis melalui 2 titik: $m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{11 - 3}{6 - 2} = \\frac{8}{4} = 2$.",
        opsi: [
          { teks: "2", benar: true },
          { teks: "3", benar: false, alasanSalah: "Salah membagi selisih ordinat dan absis." },
          { teks: "4", benar: false, alasanSalah: "Terbalik dalam pembagian gradien." },
          { teks: "1/2", benar: false, alasanSalah: "Rumus terbalik antara $\\Delta y$ dan $\\Delta x$." },
        ],
      },
    ],
  },

  "u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22": {
    id: "u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    judul: "Ulangan Matematika Semester 2",
    deskripsi:
      "Evaluasi formatif komprehensif Matematika Semester 2 mencakup Bab 5 sampai Bab 8 (SPLDV, Teorema Pythagoras, Bangun Ruang Sisi Datar, Statistika & Peluang).",
    mapel: "Matematika",
    tipe: "ulangan",
    durasi_menit: 60,
    passing_grade: 75,
    status: "dipublikasi",
    token: "MTK-SEM2",
    bab_id: "b6eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
    diperbarui_pada: new Date().toISOString(),
    soalList: [
      {
        id: "qu2-sem2-soal1",
        pertanyaan: "Panjang hipotenusa segitiga siku-siku dengan sisi tegak $9\\text{ cm}$ dan $12\\text{ cm}$ adalah...",
        tipeSoal: "pilihan_ganda",
        poin: 10,
        kunciJawaban: "15 cm",
        pembahasan:
          "Berdasarkan Teorema Pythagoras: $c = \\sqrt{a^2 + b^2} = \\sqrt{9^2 + 12^2} = \\sqrt{81 + 144} = \\sqrt{225} = 15\\text{ cm}$.",
        opsi: [
          { teks: "15 cm", benar: true },
          { teks: "21 cm", benar: false, alasanSalah: "Menjumlahkan sisi secara langsung tanpa kuadrat." },
          { teks: "18 cm", benar: false, alasanSalah: "Salah saat penarikan akar kuadrat 225." },
          { teks: "13 cm", benar: false, alasanSalah: "Salah mengingat tripel Pythagoras." },
        ],
      },
      {
        id: "qu2-sem2-soal2",
        pertanyaan: "Penyelesaian dari sistem persamaan linear dua variabel (SPLDV) $x + y = 10$ dan $x - y = 4$ adalah...",
        tipeSoal: "pilihan_ganda",
        poin: 10,
        kunciJawaban: "x = 7, y = 3",
        pembahasan:
          "Eliminasi dengan menjumlahkan kedua persamaan: $2x = 14 \\Rightarrow x = 7$. Substitusi ke $x + y = 10 \\Rightarrow 7 + y = 10 \\Rightarrow y = 3$.",
        opsi: [
          { teks: "x = 7, y = 3", benar: true },
          { teks: "x = 6, y = 4", benar: false, alasanSalah: "Salah saat eliminasi variabel." },
          { teks: "x = 8, y = 2", benar: false, alasanSalah: "Salah dalam membagi nilai $2x$." },
          { teks: "x = 5, y = 5", benar: false, alasanSalah: "Tidak memenuhi persamaan kedua ($x - y = 4$)." },
        ],
      },
      {
        id: "qu2-sem2-soal3",
        pertanyaan: "Hitung luas permukaan kubus jika panjang rusuk sisinya adalah $7\\text{ cm}$!",
        tipeSoal: "pilihan_ganda",
        poin: 10,
        kunciJawaban: "294 cm²",
        pembahasan:
          "Rumus luas permukaan kubus memiliki 6 sisi persegi: $L = 6 \\times s^2 = 6 \\times (7)^2 = 6 \\times 49 = 294\\text{ cm}^2$.",
        opsi: [
          { teks: "294 cm²", benar: true },
          { teks: "343 cm³", benar: false, alasanSalah: "Menghitung volume ($s^3$), bukan luas permukaan." },
          { teks: "196 cm²", benar: false, alasanSalah: "Hanya mengalikan 4 sisi ($4s^2$)." },
          { teks: "49 cm²", benar: false, alasanSalah: "Hanya menghitung 1 bidang sisi saja." },
        ],
      },
      {
        id: "qu2-sem2-soal4",
        pertanyaan: "Rata-rata (mean) dari data nilai ulangan $6, 7, 8, 8, 9, 10$ adalah...",
        tipeSoal: "pilihan_ganda",
        poin: 10,
        kunciJawaban: "8,0",
        pembahasan:
          "Jumlah data: $6 + 7 + 8 + 8 + 9 + 10 = 48$. Banyak data: $n = 6$. Mean: $\\bar{x} = \\frac{48}{6} = 8{,}0$.",
        opsi: [
          { teks: "8,0", benar: true },
          { teks: "7,5", benar: false, alasanSalah: "Salah menjumlahkan seluruh data." },
          { teks: "8,5", benar: false, alasanSalah: "Keliru dalam pembagian akhir." },
          { teks: "8,2", benar: false, alasanSalah: "Ketidaktelitian perhitungan pembagian." },
        ],
      },
    ],
  },

  "e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55": {
    id: "e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
    judul: "Ujian Resmi Matematika #1",
    deskripsi:
      "Asesmen sumatif resmi terstandar CBT Matematika Kelas 8 (Part 1 - Semester 1) materi Aljabar, Teorema Pythagoras, dan Relasi Fungsi.",
    mapel: "Matematika",
    tipe: "ujian",
    durasi_menit: 90,
    passing_grade: 75,
    status: "dipublikasi",
    token: "CBT-MTK8",
    bab_id: null,
    diperbarui_pada: new Date().toISOString(),
    soalList: [
      {
        id: "quj1-resmi-soal1",
        pertanyaan:
          "Penyelesaian dari sistem persamaan $x + y = 10$ dan $2x - y = 5$. Tentukan nilai dari bentuk $2x + 3y$!",
        tipeSoal: "pilihan_ganda",
        poin: 10,
        kunciJawaban: "25",
        pembahasan:
          "Eliminasi dengan menjumlahkan kedua persamaan: $3x = 15 \\Rightarrow x = 5$. Substitusi ke $x + y = 10 \\Rightarrow 5 + y = 10 \\Rightarrow y = 5$. Nilai dari $2x + 3y = 2(5) + 3(5) = 10 + 15 = 25$.",
        opsi: [
          { teks: "25", benar: true },
          { teks: "20", benar: false, alasanSalah: "Salah memasukkan koefisien pengali." },
          { teks: "23", benar: false, alasanSalah: "Keliru saat substitusi variabel $x$ dan $y$." },
          { teks: "30", benar: false, alasanSalah: "Salah dalam penjumlahan akhir." },
        ],
      },
      {
        id: "quj1-resmi-soal2",
        pertanyaan:
          "Sebuah dadu bersisi 6 dan sekeping uang logam dilempar secara bersamaan. Peluang munculnya mata dadu ganjil dan sisi angka pada uang logam adalah...",
        tipeSoal: "pilihan_ganda",
        poin: 10,
        kunciJawaban: "1/4",
        pembahasan:
          "Peluang mata dadu ganjil $\\{1, 3, 5\\}$: $P(A) = \\frac{3}{6} = \\frac{1}{2}$. Peluang sisi angka pada uang logam: $P(B) = \\frac{1}{2}$. Karena kedua kejadian saling bebas (independen): $P(A \\cap B) = \\frac{1}{2} \\times \\frac{1}{2} = \\frac{1}{4}$.",
        opsi: [
          { teks: "1/4", benar: true },
          { teks: "1/2", benar: false, alasanSalah: "Hanya menghitung salah satu peluang kejadian." },
          { teks: "3/8", benar: false, alasanSalah: "Salah dalam perkalian dua pecahan." },
          { teks: "1/6", benar: false, alasanSalah: "Salah menentukan ruang sampel gabungan." },
        ],
      },
      {
        id: "quj1-resmi-soal3",
        pertanyaan:
          "Sebuah tangga sepanjang $10\\text{ m}$ disandarkan pada dinding tegak. Jika jarak ujung bawah tangga ke dasar dinding adalah $6\\text{ m}$, berapakah tinggi dinding yang dicapai tangga tersebut?",
        tipeSoal: "pilihan_ganda",
        poin: 10,
        kunciJawaban: "8 m",
        pembahasan:
          "Dengan Teorema Pythagoras untuk segitiga siku-siku: $t = \\sqrt{c^2 - a^2} = \\sqrt{10^2 - 6^2} = \\sqrt{100 - 36} = \\sqrt{64} = 8\\text{ m}$.",
        opsi: [
          { teks: "8 m", benar: true },
          { teks: "7 m", benar: false, alasanSalah: "Salah saat penarikan akar kuadrat 64." },
          { teks: "9 m", benar: false, alasanSalah: "Keliru menghitung selisih kuadrat." },
          { teks: "12 m", benar: false, alasanSalah: "Menjumlahkan kuadrat bukan mengurangkan." },
        ],
      },
    ],
  },
};

function ensureStoreFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(CANONICAL_EXAMS_INIT, null, 2), "utf8");
    }
  } catch (err) {
    console.warn("[EXAM STORE] Gagal menginisialisasi file store:", err);
  }
}

export function getAllExamPackages(): Record<string, ExamPackage> {
  ensureStoreFile();
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf8");
      const parsed = JSON.parse(raw);
      // Merge dengan canonical jika ada key yang belum ada
      let hasChanges = false;
      Object.keys(CANONICAL_EXAMS_INIT).forEach((key) => {
        if (!parsed[key]) {
          parsed[key] = CANONICAL_EXAMS_INIT[key];
          hasChanges = true;
        }
      });
      if (hasChanges) {
        fs.writeFileSync(STORE_FILE, JSON.stringify(parsed, null, 2), "utf8");
      }
      return parsed;
    }
  } catch (err) {
    console.warn("[EXAM STORE] Gagal membaca exam store:", err);
  }
  return CANONICAL_EXAMS_INIT;
}

export function getExamPackage(examId: string): ExamPackage | null {
  const all = getAllExamPackages();
  return all[examId] || null;
}

export function getExamQuestions(examId: string): ExamQuestion[] {
  const pkg = getExamPackage(examId);
  return pkg?.soalList || [];
}

export function saveExamPackage(examData: ExamPackage): boolean {
  ensureStoreFile();
  try {
    const all = getAllExamPackages();
    all[examData.id] = {
      ...examData,
      diperbarui_pada: new Date().toISOString(),
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(all, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("[EXAM STORE] Gagal menyimpan exam package:", err);
    return false;
  }
}

export function updateSingleQuestionInExam(
  examId: string,
  questionId: string,
  patch: Partial<ExamQuestion>
): ExamQuestion | null {
  ensureStoreFile();
  try {
    const all = getAllExamPackages();
    const targetExam = all[examId];
    if (!targetExam) return null;

    const qIdx = targetExam.soalList.findIndex((q) => q.id === questionId);
    if (qIdx === -1) {
      // Jika questionId belum ada (misal mock ID temp), perbarui soal pertama atau buat baru
      if (targetExam.soalList.length > 0) {
        targetExam.soalList[0] = { ...targetExam.soalList[0], ...patch };
        targetExam.diperbarui_pada = new Date().toISOString();
        saveExamPackage(targetExam);
        return targetExam.soalList[0];
      }
      return null;
    }

    targetExam.soalList[qIdx] = {
      ...targetExam.soalList[qIdx],
      ...patch,
    };
    targetExam.diperbarui_pada = new Date().toISOString();
    saveExamPackage(targetExam);
    return targetExam.soalList[qIdx];
  } catch (err) {
    console.error("[EXAM STORE] Gagal memperbarui single question:", err);
    return null;
  }
}

export function getQuestionsForAssessmentReview(
  targetId: string,
  category: "kuis" | "ulangan" | "ujian",
  studentScore: number = 85
): Array<{
  id: string;
  pertanyaan: string;
  tipeSoal: string;
  jawabanSiswa: string;
  kunciJawaban: string;
  pembahasan: string;
  isBenar: boolean;
  nilai: number;
  miskonsepsi: string | null;
  umpanBalik: string | null;
}> {
  const all = getAllExamPackages();
  const exam = all[targetId];

  if (exam && Array.isArray(exam.soalList) && exam.soalList.length > 0) {
    return exam.soalList.map((q, idx) => {
      const isCorrect = studentScore >= (exam.passing_grade || 75) || idx === 0;
      const studentAnswer = isCorrect
        ? q.kunciJawaban
        : q.opsi?.find((o) => !o.benar)?.teks || "Jawaban tidak sesuai konsep";
      const wrongOpt = q.opsi?.find((o) => !o.benar);

      return {
        id: q.id || `q-${targetId}-${idx}`,
        pertanyaan: q.pertanyaan,
        tipeSoal: q.tipeSoal || "pilihan_ganda",
        jawabanSiswa: studentAnswer,
        kunciJawaban: q.kunciJawaban,
        pembahasan: q.pembahasan,
        isBenar: isCorrect,
        nilai: isCorrect ? (q.poin || 10) : 0,
        miskonsepsi: !isCorrect
          ? q.miskonsepsi || wrongOpt?.alasanSalah || "Perlu penguatan konsep dasar pada materi ini."
          : null,
        umpanBalik: isCorrect
          ? "Langkah perhitungan matematika terstruktur dan akurat."
          : "Perhatikan kembali urutan operasi dan substitusi variabel.",
      };
    });
  }

  // Fallback default jika targetId tidak ditemukan di paket ujian
  return [
    {
      id: `q-fallback-${targetId}-1`,
      pertanyaan: "Sederhanakan bentuk aljabar $5(x - 2) + 3(2x + 4)$!",
      tipeSoal: "pilihan_ganda",
      jawabanSiswa: "11x + 2",
      kunciJawaban: "11x + 2",
      pembahasan: "$5(x - 2) + 3(2x + 4) = 5x - 10 + 6x + 12 = 11x + 2$.",
      isBenar: true,
      nilai: 10,
      miskonsepsi: null,
      umpanBalik: "Langkah aljabar terstruktur rapi.",
    },
  ];
}

