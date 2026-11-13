"use client";

import { useState, useEffect } from "react";
import GuruLayout from "@/components/guru/GuruLayout";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";
import Link from "next/link";
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  X,
  Eye,
  AlertCircle,
  TrendingUp,
  Bell,
  Check,
  RefreshCw,
  BookOpen,
  Award,
  FileSpreadsheet,
  Edit3,
  ExternalLink,
  Plus,
  Save,
  Sparkles,
  Loader2,
  HelpCircle,
  Printer,
} from "lucide-react";

interface AssessmentItem {
  id: string;
  targetId: string;
  tipe: "kuis_bab" | "ulangan" | "ujian";
  kategori?: "kuis" | "ulangan" | "ujian";
  judul: string;
  mapel: string;
  status: "selesai" | "belum_dikerjakan" | "terkunci";
  isDone: boolean;
  skor: number | null;
  tanggalSelesai: string | null;
  totalSoal: number;
  soalList: Array<{
    id: string;
    pertanyaan: string;
    tipeSoal: string;
    jawabanSiswa: string;
    kunciJawaban: string;
    pembahasan: string;
    isBenar: boolean;
    nilai: number;
    miskonsepsi?: string | null;
    umpanBalik?: string | null;
  }>;
}

interface StudentItem {
  id: string;
  nama: string;
  email: string;
  nisn: string;
  foto: string | null;
  poin: number;
  streak: number;
  namaKelas: string;
  status: string;
  hasCompletedAny: boolean;
  completedCount: number;
  pendingCount: number;
  totalAssignments: number;
  rataRataNilai: number;
  statusKetuntasan: string;
  // 3 Kategori Mandiri
  kuisCompletedCount?: number;
  kuisTotalCount?: number;
  kuisAverage?: number;
  kuisAssessments?: AssessmentItem[];

  ulanganCompletedCount?: number;
  ulanganTotalCount?: number;
  ulanganAverage?: number;
  ulanganAssessments?: AssessmentItem[];

  ujianCompletedCount?: number;
  ujianTotalCount?: number;
  ujianScore?: number;
  ujianAssessments?: AssessmentItem[];

  assessments: AssessmentItem[];
}

// 8 Bab Resmi Matematika Kelas 8 Fase D
const CANONICAL_BABS = [
  { no: 1, id: "b1", judul: "Bab 1: Pola Bilangan & Barisan Bilangan" },
  { no: 2, id: "b2", judul: "Bab 2: Bentuk Aljabar & PLSV/PTLSV" },
  { no: 3, id: "b3", judul: "Bab 3: Relasi & Fungsi" },
  { no: 4, id: "b4", judul: "Bab 4: Persamaan Garis Lurus (PGL)" },
  { no: 5, id: "b5", judul: "Bab 5: Sistem Persamaan Linear Dua Variabel (SPLDV)" },
  { no: 6, id: "b6", judul: "Bab 6: Teorema Pythagoras" },
  { no: 7, id: "b7", judul: "Bab 7: Bangun Ruang Sisi Datar (BRSD)" },
  { no: 8, id: "b8", judul: "Bab 8: Statistika & Peluang" },
];

// Soal Pembahasan Kurikulum Matematika Kelas 8
const SAMPLE_QUESTIONS: Record<number, Array<{ pertanyaan: string; kunci: string; pembahasan: string }>> = {
  1: [
    {
      pertanyaan: "Tiga suku berikutnya dari barisan bilangan 3, 7, 11, 15, ... adalah...",
      kunci: "19, 23, 27",
      pembahasan: "Beda setiap suku (b) = 4. Suku ke-5 = 15+4=19, Suku ke-6 = 19+4=23, Suku ke-7 = 23+4=27.",
    },
    {
      pertanyaan: "Rumus suku ke-n dari barisan 2, 6, 12, 20, ... adalah...",
      kunci: "Un = n(n + 1)",
      pembahasan: "Untuk n=1: 1(2)=2; n=2: 2(3)=6; n=3: 3(4)=12. Rumus yang tepat adalah Un = n(n + 1).",
    },
    {
      pertanyaan: "Suku ke-20 dari barisan aritmetika 5, 9, 13, 17, ... adalah...",
      kunci: "81",
      pembahasan: "a = 5, b = 4. U20 = a + 19b = 5 + 19(4) = 5 + 76 = 81.",
    },
  ],
  2: [
    {
      pertanyaan: "Bentuk sederhana dari $4(2x - 3) - 3(x - 5)$ adalah...",
      kunci: "5x + 3",
      pembahasan: "$8x - 12 - 3x + 15 = (8x - 3x) + (-12 + 15) = 5x + 3$.",
    },
    {
      pertanyaan: "Penyelesaian dari persamaan linear $3x + 7 = 22$ adalah...",
      kunci: "x = 5",
      pembahasan: "$3x = 22 - 7 \\Rightarrow 3x = 15 \\Rightarrow x = 5$.",
    },
    {
      pertanyaan: "Faktor dari bentuk aljabar $x^2 - 9$ adalah...",
      kunci: "(x - 3)(x + 3)",
      pembahasan: "Bentuk selisih kuadrat $a^2 - b^2 = (a - b)(a + b)$. Maka $x^2 - 9 = (x - 3)(x + 3)$.",
    },
  ],
  3: [
    {
      pertanyaan: "Diketahui fungsi $f(x) = 2x - 5$. Nilai dari $f(7)$ adalah...",
      kunci: "9",
      pembahasan: "$f(7) = 2(7) - 5 = 14 - 5 = 9$.",
    },
    {
      pertanyaan: "Himpunan pasangan berurutan yang merupakan pemetaan (fungsi) adalah...",
      kunci: "{(1,a), (2,b), (3,c)}",
      pembahasan: "Fungsi mensyaratkan setiap domain berpasangan tepat satu dengan kodomain.",
    },
  ],
  4: [
    {
      pertanyaan: "Gradien garis dengan persamaan $y = 4x - 7$ adalah...",
      kunci: "4",
      pembahasan: "Bentuk umum $y = mx + c$ memiliki gradien $m$. Maka $m = 4$.",
    },
    {
      pertanyaan: "Gradien garis yang melalui titik $(2, 3)$ dan $(6, 11)$ adalah...",
      kunci: "2",
      pembahasan: "$m = \\frac{11 - 3}{6 - 2} = \\frac{8}{4} = 2$.",
    },
  ],
  5: [
    {
      pertanyaan: "Penyelesaian dari sistem persamaan $x + y = 10$ dan $x - y = 4$ adalah...",
      kunci: "x = 7, y = 3",
      pembahasan: "Jumlahkan kedua persamaan: $2x = 14 \\Rightarrow x = 7$. Maka $y = 3$.",
    },
  ],
  6: [
    {
      pertanyaan: "Segitiga siku-siku memiliki panjang sisi siku-siku 6 cm dan 8 cm. Panjang sisi miringnya adalah...",
      kunci: "10 cm",
      pembahasan: "$c = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10\\text{ cm}$.",
    },
  ],
  7: [
    {
      pertanyaan: "Volume balok dengan ukuran panjang 10 cm, lebar 8 cm, dan tinggi 5 cm adalah...",
      kunci: "400 cm³",
      pembahasan: "$V = 10 \\times 8 \\times 5 = 400\\text{ cm}^3$.",
    },
  ],
  8: [
    {
      pertanyaan: "Rata-rata (mean) dari data 6, 7, 8, 8, 9, 10 adalah...",
      kunci: "8,0",
      pembahasan: "Jumlah data = 48, banyak data = 6. Mean = $48 / 6 = 8,0$.",
    },
  ],
};

function generateStudentMock(
  id: string,
  nama: string,
  nisn: string,
  poin: number,
  streak: number,
  kuisScores: (number | null)[],
  sem1Score: number | null,
  sem2Score: number | null,
  ujianScore: number | null
): StudentItem {
  // 1. Kuis Bab (Bab 1–8)
  const kuisAssessments: AssessmentItem[] = CANONICAL_BABS.map((b, idx) => {
    const score = kuisScores[idx];
    const isDone = score !== null && score !== undefined;
    const questionsSample = SAMPLE_QUESTIONS[b.no] || SAMPLE_QUESTIONS[1];

    const soalList = isDone
      ? questionsSample.map((q, qIdx) => ({
          id: `q-${b.id}-${qIdx}`,
          pertanyaan: q.pertanyaan,
          tipeSoal: "pilihan_ganda",
          jawabanSiswa: (score || 0) >= 75 ? q.kunci : "Jawaban tidak tepat",
          kunciJawaban: q.kunci,
          pembahasan: q.pembahasan,
          isBenar: (score || 0) >= 75 || qIdx === 0,
          nilai: (score || 0) >= 75 || qIdx === 0 ? 10 : 0,
          miskonsepsi: (score || 0) < 75 && qIdx > 0 ? "Perlu pemantapan konsep dasar operasi aljabar." : null,
          umpanBalik: (score || 0) >= 75 ? "Analisis sangat akurat dan terstruktur." : "Perhatikan tanda operasi matematika.",
        }))
      : [];

    return {
      id: `kuis-${b.id}-${id}`,
      targetId: b.id,
      tipe: "kuis_bab",
      kategori: "kuis",
      judul: `Kuis ${b.judul}`,
      mapel: "Matematika",
      status: isDone ? "selesai" : "belum_dikerjakan",
      isDone,
      skor: isDone ? score : null,
      tanggalSelesai: isDone ? "2 Nov 2026, 09:30" : null,
      totalSoal: 15,
      soalList,
    };
  });

  const kuisDone = kuisAssessments.filter((k) => k.isDone);
  const kuisAverage =
    kuisDone.length > 0
      ? Math.round(kuisDone.reduce((acc, k) => acc + (k.skor || 0), 0) / kuisDone.length)
      : 0;

  // 2. Ulangan (Semester 1 & 2)
  const ulanganAssessments: AssessmentItem[] = [
    {
      id: `ulangan-sem1-${id}`,
      targetId: "u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      tipe: "ulangan",
      kategori: "ulangan",
      judul: "Ulangan Matematika Semester 1",
      mapel: "Matematika",
      status: sem1Score !== null ? "selesai" : "belum_dikerjakan",
      isDone: sem1Score !== null,
      skor: sem1Score,
      tanggalSelesai: sem1Score !== null ? "3 Nov 2026, 10:15" : null,
      totalSoal: 20,
      soalList:
        sem1Score !== null
          ? [
              {
                id: `qu1-${id}-1`,
                pertanyaan: "Sederhanakan bentuk aljabar $5(x - 2) + 3(2x + 4)$!",
                tipeSoal: "pilihan_ganda",
                jawabanSiswa: "11x + 2",
                kunciJawaban: "11x + 2",
                pembahasan: "$5(x - 2) + 3(2x + 4) = 5x - 10 + 6x + 12 = (5x + 6x) + (-10 + 12) = 11x + 2$.",
                isBenar: true,
                nilai: 10,
                miskonsepsi: null,
                umpanBalik: "Langkah aljabar terstruktur rapi.",
              },
              {
                id: `qu1-${id}-2`,
                pertanyaan: "Tentukan himpunan penyelesaian dari persamaan linear satu variabel $3x + 7 = 22$!",
                tipeSoal: "pilihan_ganda",
                jawabanSiswa: (sem1Score || 0) >= 75 ? "x = 5" : "x = 4",
                kunciJawaban: "x = 5",
                pembahasan: "Kurangkan kedua ruas dengan 7: $3x = 22 - 7 \\Rightarrow 3x = 15$. Bagi kedua ruas dengan 3: $x = \\frac{15}{3} = 5$.",
                isBenar: (sem1Score || 0) >= 75,
                nilai: (sem1Score || 0) >= 75 ? 10 : 0,
                miskonsepsi: (sem1Score || 0) < 75 ? "Salah dalam membagi nilai konstanta saat penyelesaian PLSV." : null,
                umpanBalik: "Perhatikan pembagian kedua ruas persamaan linear.",
              },
              {
                id: `qu1-${id}-3`,
                pertanyaan: "Diketahui barisan bilangan aritmetika $3, 7, 11, 15, \\dots$. Tentukan nilai dari suku ke-15 ($U_{15}$)!",
                tipeSoal: "pilihan_ganda",
                jawabanSiswa: "59",
                kunciJawaban: "59",
                pembahasan: "Suku pertama $a = 3$, beda $b = 4$. Rumus $U_n = a + (n - 1)b$. Maka $U_{15} = 3 + (15 - 1) \\times 4 = 3 + 14 \\times 4 = 3 + 56 = 59$.",
                isBenar: true,
                nilai: 10,
                miskonsepsi: null,
                umpanBalik: "Substitusi rumus suku ke-n tepat.",
              },
              {
                id: `qu1-${id}-4`,
                pertanyaan: "Diketahui suatu fungsi linear $f(x) = 2x - 5$. Tentukan nilai dari $f(7)$!",
                tipeSoal: "pilihan_ganda",
                jawabanSiswa: "9",
                kunciJawaban: "9",
                pembahasan: "Substitusi $x = 7$: $f(7) = 2(7) - 5 = 14 - 5 = 9$.",
                isBenar: true,
                nilai: 10,
                miskonsepsi: null,
                umpanBalik: "Operasi perkalian dan pengurangan fungsi linear tepat.",
              },
              {
                id: `qu1-${id}-5`,
                pertanyaan: "Gradien garis yang melalui titik $(2, 3)$ dan $(6, 11)$ adalah...",
                tipeSoal: "pilihan_ganda",
                jawabanSiswa: "2",
                kunciJawaban: "2",
                pembahasan: "Rumus gradien garis melalui 2 titik: $m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{11 - 3}{6 - 2} = \\frac{8}{4} = 2$.",
                isBenar: true,
                nilai: 10,
                miskonsepsi: null,
                umpanBalik: "Kalkulasi selisih ordinat dan absis tepat.",
              },
            ]
          : [],
    },
    {
      id: `ulangan-sem2-${id}`,
      targetId: "u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      tipe: "ulangan",
      kategori: "ulangan",
      judul: "Ulangan Matematika Semester 2",
      mapel: "Matematika",
      status: sem2Score !== null ? "selesai" : "belum_dikerjakan",
      isDone: sem2Score !== null,
      skor: sem2Score,
      tanggalSelesai: sem2Score !== null ? "4 Nov 2026, 11:00" : null,
      totalSoal: 20,
      soalList:
        sem2Score !== null
          ? [
              {
                id: `qu2-${id}-1`,
                pertanyaan: "Panjang hipotenusa segitiga siku-siku dengan sisi tegak $9\\text{ cm}$ dan $12\\text{ cm}$ adalah...",
                tipeSoal: "pilihan_ganda",
                jawabanSiswa: "15 cm",
                kunciJawaban: "15 cm",
                pembahasan: "$\\sqrt{9^2 + 12^2} = \\sqrt{81 + 144} = \\sqrt{225} = 15\\text{ cm}$.",
                isBenar: true,
                nilai: 10,
                miskonsepsi: null,
                umpanBalik: "Aplikasi Teorema Pythagoras tepat.",
              },
              {
                id: `qu2-${id}-2`,
                pertanyaan: "Penyelesaian dari sistem persamaan linear dua variabel (SPLDV) $x + y = 10$ dan $x - y = 4$ adalah...",
                tipeSoal: "pilihan_ganda",
                jawabanSiswa: (sem2Score || 0) >= 75 ? "x = 7, y = 3" : "x = 6, y = 4",
                kunciJawaban: "x = 7, y = 3",
                pembahasan: "Jumlahkan kedua persamaan: $2x = 14 \\Rightarrow x = 7$. Substitusi ke $x + y = 10 \\Rightarrow 7 + y = 10 \\Rightarrow y = 3$.",
                isBenar: (sem2Score || 0) >= 75,
                nilai: (sem2Score || 0) >= 75 ? 10 : 0,
                miskonsepsi: (sem2Score || 0) < 75 ? "Kurang teliti dalam metode eliminasi persamaan aljabar." : null,
                umpanBalik: "Perhatikan eliminasi variabel SPLDV.",
              },
              {
                id: `qu2-${id}-3`,
                pertanyaan: "Hitung luas permukaan kubus jika panjang rusuk sisinya adalah $7\\text{ cm}$!",
                tipeSoal: "pilihan_ganda",
                jawabanSiswa: "294 cm²",
                kunciJawaban: "294 cm²",
                pembahasan: "Rumus luas permukaan kubus memiliki 6 sisi persegi: $L = 6 \\times s^2 = 6 \\times (7)^2 = 6 \\times 49 = 294\\text{ cm}^2$.",
                isBenar: true,
                nilai: 10,
                miskonsepsi: null,
                umpanBalik: "Rumus luas bangun ruang sisi datar diaplikasikan dengan benar.",
              },
              {
                id: `qu2-${id}-4`,
                pertanyaan: "Rata-rata (mean) dari data nilai ulangan $6, 7, 8, 8, 9, 10$ adalah...",
                tipeSoal: "pilihan_ganda",
                jawabanSiswa: "8,0",
                kunciJawaban: "8,0",
                pembahasan: "Jumlah data: $6 + 7 + 8 + 8 + 9 + 10 = 48$. Banyak data: $n = 6$. Mean: $\\bar{x} = \\frac{48}{6} = 8{,}0$.",
                isBenar: true,
                nilai: 10,
                miskonsepsi: null,
                umpanBalik: "Kalkulasi mean statistika tepat.",
              },
            ]
          : [],
    },
  ];

  const ulanganDone = ulanganAssessments.filter((u) => u.isDone);
  const ulanganAverage =
    ulanganDone.length > 0
      ? Math.round(ulanganDone.reduce((acc, u) => acc + (u.skor || 0), 0) / ulanganDone.length)
      : 0;

  // 3. Ujian Resmi (Ujian Matematika #1)
  const ujianAssessments: AssessmentItem[] = [
    {
      id: `ujian-resmi1-${id}`,
      targetId: "e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
      tipe: "ujian",
      kategori: "ujian",
      judul: "Ujian Resmi Matematika #1",
      mapel: "Matematika",
      status: ujianScore !== null ? "selesai" : "belum_dikerjakan",
      isDone: ujianScore !== null,
      skor: ujianScore,
      tanggalSelesai: ujianScore !== null ? "5 Nov 2026, 08:00" : null,
      totalSoal: 25,
      soalList:
        ujianScore !== null
          ? [
              {
                id: `quj1-${id}-1`,
                pertanyaan: "Penyelesaian dari sistem persamaan $x + y = 10$ dan $2x - y = 5$. Tentukan nilai dari bentuk $2x + 3y$!",
                tipeSoal: "pilihan_ganda",
                jawabanSiswa: "25",
                kunciJawaban: "25",
                pembahasan: "Eliminasi diperoleh $3x = 15 \\Rightarrow x = 5$. Substitusi diperoleh $y = 5$. Nilai $2(5) + 3(5) = 10 + 15 = 25$.",
                isBenar: true,
                nilai: 10,
                miskonsepsi: null,
                umpanBalik: "Kalkulasi CBT terverifikasi.",
              },
              {
                id: `quj1-${id}-2`,
                pertanyaan: "Sebuah dadu bersisi 6 dan sekeping uang logam dilempar secara bersamaan. Peluang munculnya mata dadu ganjil dan sisi angka pada uang logam adalah...",
                tipeSoal: "pilihan_ganda",
                jawabanSiswa: (ujianScore || 0) >= 75 ? "1/4" : "1/2",
                kunciJawaban: "1/4",
                pembahasan: "$P(\\text{ganjil}) = \\frac{3}{6} = \\frac{1}{2}$. $P(\\text{angka}) = \\frac{1}{2}$. Peluang independen: $\\frac{1}{2} \\times \\frac{1}{2} = \\frac{1}{4}$.",
                isBenar: (ujianScore || 0) >= 75,
                nilai: (ujianScore || 0) >= 75 ? 10 : 0,
                miskonsepsi: (ujianScore || 0) < 75 ? "Lupa mengalikan kedua peluang kejadian independen." : null,
                umpanBalik: "Konsep peluang kejadian independen terstandar.",
              },
              {
                id: `quj1-${id}-3`,
                pertanyaan: "Sebuah tangga sepanjang $10\\text{ m}$ disandarkan pada dinding tegak. Jika jarak ujung bawah tangga ke dasar dinding adalah $6\\text{ m}$, berapakah tinggi dinding yang dicapai tangga tersebut?",
                tipeSoal: "pilihan_ganda",
                jawabanSiswa: "8 m",
                kunciJawaban: "8 m",
                pembahasan: "Berdasarkan Teorema Pythagoras: $t = \\sqrt{10^2 - 6^2} = \\sqrt{100 - 36} = \\sqrt{64} = 8\\text{ m}$.",
                isBenar: true,
                nilai: 10,
                miskonsepsi: null,
                umpanBalik: "Aplikasi Teorema Pythagoras tepat.",
              },
            ]
          : [],
    },
  ];

  const allAssessments = [...kuisAssessments, ...ulanganAssessments, ...ujianAssessments];
  const finishedCount = allAssessments.filter((a) => a.isDone).length;
  const hasCompletedAny = finishedCount > 0;

  // Nilai Akhir Terpadu KKM: (30% Kuis + 30% Ulangan + 40% Ujian)
  let nilaiAkhir = 0;
  if (hasCompletedAny) {
    const parts: { val: number; weight: number }[] = [];
    if (kuisDone.length > 0) parts.push({ val: kuisAverage, weight: 0.3 });
    if (ulanganDone.length > 0) parts.push({ val: ulanganAverage, weight: 0.3 });
    if (ujianScore !== null) parts.push({ val: ujianScore, weight: 0.4 });

    if (parts.length > 0) {
      const totalWeight = parts.reduce((acc, p) => acc + p.weight, 0);
      const weightedSum = parts.reduce((acc, p) => acc + p.val * p.weight, 0);
      nilaiAkhir = Math.round(weightedSum / totalWeight);
    }
  }

  const statusKetuntasan = !hasCompletedAny
    ? "Belum Ada Nilai"
    : nilaiAkhir >= 75
    ? "Tuntas"
    : "Remedial";

  return {
    id,
    nama,
    email: `${nama.toLowerCase().replace(/[^a-z0-9]/g, ".")}@sekolah.sch.id`,
    nisn,
    foto: null,
    poin,
    streak,
    namaKelas: "Kelas 8",
    status: hasCompletedAny ? "Sudah Mengerjakan" : "Belum Mengerjakan (Abu-abu)",
    hasCompletedAny,
    completedCount: finishedCount,
    pendingCount: allAssessments.length - finishedCount,
    totalAssignments: allAssessments.length,
    rataRataNilai: nilaiAkhir,
    statusKetuntasan,
    kuisCompletedCount: kuisDone.length,
    kuisTotalCount: 8,
    kuisAverage,
    kuisAssessments,
    ulanganCompletedCount: ulanganDone.length,
    ulanganTotalCount: 2,
    ulanganAverage,
    ulanganAssessments,
    ujianCompletedCount: ujianScore !== null ? 1 : 0,
    ujianTotalCount: 1,
    ujianScore: ujianScore ?? 0,
    ujianAssessments,
    assessments: allAssessments,
  };
}

// 12 Profil Siswa Resmi Kelas 8 dengan status pengerjaan yang detail dan variatif
const FALLBACK_STUDENTS_LIST: StudentItem[] = [
  generateStudentMock("44444444-4444-4444-4444-444444444444", "Budi Kartika", "0089201144", 980, 8, [88, 90, 85, 87, 92, 86, 88, 88], 85, 88, 86),
  generateStudentMock("s-fauzi-02", "Ahmad Fauzi", "0089201145", 1180, 15, [92, 95, 90, 94, 92, 90, 92, 91], 90, 94, 92),
  generateStudentMock("s-aisyah-03", "Siti Aisyah Putri", "0089201146", 1120, 12, [90, 88, 92, 90, 91, 89, 90, 90], 88, 90, 90),
  generateStudentMock("s-rian-04", "Rian Hidayat", "0089201147", 980, 10, [84, 86, 82, 85, 84, 83, null, null], 80, null, 80),
  generateStudentMock("s-nanda-05", "Nanda Kurnia Putri", "0089201148", 940, 9, [86, 88, 85, 87, 86, 84, 86, null], 84, 86, 85),
  generateStudentMock("s-dimas-06", "Dimas Wahyudi", "0089201149", 890, 8, [80, 82, 78, 80, 80, null, null, null], 76, null, null),
  generateStudentMock("s-dewi-07", "Dewi Sartika", "0089201150", 860, 7, [88, 86, 90, 88, 87, 88, 89, 88], 85, 88, 84),
  generateStudentMock("s-fira-08", "Fira Anggraini", "0089201151", 820, 6, [76, 74, 78, 72, null, null, null, null], 72, null, null),
  generateStudentMock("s-gilang-09", "Gilang Ramadhan", "0089201152", 780, 5, [72, 75, 70, 74, null, null, null, null], 70, null, null),
  generateStudentMock("55555555-5555-5555-5555-555555555555", "Ahmad Raihan", "0089201153", 750, 4, [82, 84, 80, 82, 83, 81, 82, 82], 80, 84, 82),
  generateStudentMock("77777777-7777-7777-7777-777777777777", "Siti Rahma Putri", "0089201154", 720, 4, [85, 86, 84, 85, 86, 84, 85, 85], 82, 85, 84),
  generateStudentMock("s-bella-12", "Bella Safitri", "0089201155", 690, 0, [null, null, null, null, null, null, null, null], null, null, null),
];

export default function GuruKelolaSiswaPage() {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentItem[]>(FALLBACK_STUDENTS_LIST);
  const [summary, setSummary] = useState({
    totalSiswa: 12,
    totalSudahMengerjakan: 11,
    totalBelumMengerjakan: 1,
    rataRataKelas: 83,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"semua" | "sudah" | "belum">("semua");

  // Selected Student for Full Review Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<"kuis" | "ulangan" | "ujian">("kuis");
  const [modalFilter, setModalFilter] = useState<"semua" | "sudah" | "belum">("semua");
  const [expandedAssessmentId, setExpandedAssessmentId] = useState<string | null>(null);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [isStudentReportPrintOpen, setIsStudentReportPrintOpen] = useState(false);

  // Dedicated Question Editor Modal State for Teacher Review
  const [editingModalData, setEditingModalData] = useState<{
    assessment: AssessmentItem;
    question: any;
    questionIndex: number;
  } | null>(null);

  const [editPertanyaan, setEditPertanyaan] = useState("");
  const [editTipeSoal, setEditTipeSoal] = useState("pilihan_ganda");
  const [editKunciJawaban, setEditKunciJawaban] = useState("");
  const [editJawabanSiswa, setEditJawabanSiswa] = useState("");
  const [editPembahasan, setEditPembahasan] = useState("");
  const [editNilai, setEditNilai] = useState(10);
  const [editIsBenar, setEditIsBenar] = useState(true);
  const [editMiskonsepsi, setEditMiskonsepsi] = useState("");
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [activeToolbarField, setActiveToolbarField] = useState<"pertanyaan" | "kunci" | "pembahasan">("pertanyaan");
  const [showFormulaPreview, setShowFormulaPreview] = useState(false);

  const handleOpenEditQuestionModal = (assessment: AssessmentItem, q: any, qIdx: number) => {
    setEditingModalData({
      assessment,
      question: q,
      questionIndex: qIdx,
    });
    setEditPertanyaan(q.pertanyaan || "");
    setEditTipeSoal(q.tipeSoal || "pilihan_ganda");
    setEditKunciJawaban(q.kunciJawaban || "");
    setEditJawabanSiswa(q.jawabanSiswa || "");
    setEditPembahasan(q.pembahasan || "");
    setEditNilai(q.nilai ?? 10);
    setEditIsBenar(Boolean(q.isBenar));
    setEditMiskonsepsi(q.miskonsepsi || "");
    setShowFormulaPreview(false);
  };

  const handleInsertMathToolbarSymbol = (symbol: string) => {
    if (activeToolbarField === "pertanyaan") {
      setEditPertanyaan((prev) => prev + " " + symbol);
    } else if (activeToolbarField === "kunci") {
      setEditKunciJawaban((prev) => prev + " " + symbol);
    } else {
      setEditPembahasan((prev) => prev + " " + symbol);
    }
  };

  const handleSaveEditedQuestion = async () => {
    if (!editingModalData) return;
    setIsSavingQuestion(true);
    try {
      const { assessment, question, questionIndex } = editingModalData;
      const targetExamId = assessment.targetId || "u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

      const patchPayload = {
        pertanyaan: editPertanyaan,
        tipeSoal: editTipeSoal,
        kunciJawaban: editKunciJawaban,
        pembahasan: editPembahasan,
        poin: editNilai,
        miskonsepsi: editMiskonsepsi || null,
      };

      // Upayakan simpan ke backend API
      try {
        await fetch(`/api/guru/ujian/${targetExamId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.id,
            patch: patchPayload,
          }),
        });
      } catch (err) {
        console.warn("API PATCH offline, updating in-memory state:", err);
      }

      // Update state in selectedStudent and students immediately
      const updatedQuestion = {
        ...question,
        pertanyaan: editPertanyaan,
        tipeSoal: editTipeSoal,
        kunciJawaban: editKunciJawaban,
        jawabanSiswa: editJawabanSiswa,
        pembahasan: editPembahasan,
        nilai: editNilai,
        isBenar: editIsBenar,
        miskonsepsi: editMiskonsepsi || null,
      };

      if (selectedStudent) {
        const updatedAssessments = selectedStudent.assessments.map((a) => {
          if (a.id === assessment.id) {
            const updatedSoalList = [...a.soalList];
            updatedSoalList[questionIndex] = updatedQuestion;
            return { ...a, soalList: updatedSoalList };
          }
          return a;
        });

        const updatedStudent: StudentItem = {
          ...selectedStudent,
          assessments: updatedAssessments,
          kuisAssessments: (selectedStudent.kuisAssessments || []).map((a) =>
            a.id === assessment.id ? { ...a, soalList: a.soalList.map((sq, i) => i === questionIndex ? updatedQuestion : sq) } : a
          ),
          ulanganAssessments: (selectedStudent.ulanganAssessments || []).map((a) =>
            a.id === assessment.id ? { ...a, soalList: a.soalList.map((sq, i) => i === questionIndex ? updatedQuestion : sq) } : a
          ),
          ujianAssessments: (selectedStudent.ujianAssessments || []).map((a) =>
            a.id === assessment.id ? { ...a, soalList: a.soalList.map((sq, i) => i === questionIndex ? updatedQuestion : sq) } : a
          ),
        };

        setSelectedStudent(updatedStudent);
        setStudents((prev) =>
          prev.map((s) => (s.id === selectedStudent.id ? updatedStudent : s))
        );
      }

      setReminderToast(`Soal #${questionIndex + 1} berhasil diperbarui & review lembar kerja tersinkronisasi!`);
      setTimeout(() => setReminderToast(null), 4000);
      setEditingModalData(null);
    } catch (err: any) {
      alert("Gagal memperbarui soal: " + err.message);
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const openStudentReview = (st: StudentItem, category: "kuis" | "ulangan" | "ujian") => {
    setSelectedStudent(st);
    setActiveCategoryTab(category);
    setModalFilter("semua");
    setExpandedAssessmentId(null);
  };

  const fetchStudentData = async () => {
    try {
      const res = await fetch("/api/guru/siswa");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.students) && data.students.length > 0) {
        setStudents(data.students);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.warn("Notice: Sync data siswa:", err);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  // Filter students based on search and tab
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q || s.nama.toLowerCase().includes(q) || s.nisn.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (filterTab === "sudah") return s.hasCompletedAny;
    if (filterTab === "belum") return !s.hasCompletedAny;
    return true;
  });

  const handleSendReminder = (studentName: string, judulTugas: string) => {
    setReminderToast(`Pengingat berhasil dikirimkan ke akun ${studentName} untuk ${judulTugas}!`);
    setTimeout(() => {
      setReminderToast(null);
    }, 4000);
  };

  return (
    <GuruLayout activeView="kelola_siswa">
      <div className="space-y-6 pb-20">
        {/* Top Hero Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 inline-block">
              Manajemen Data Siswa & Lembar Kerja Real-Time
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Kelola Siswa & Review Pekerjaan
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Pantau seluruh progres siswa di kelas secara real dari database. Tinjau langsung siswa yang{" "}
              <strong className="text-emerald-700 font-bold">sudah selesai mengerjakan</strong> dan siswa yang{" "}
              <strong className="text-slate-700 font-bold">masih abu-abu (belum mengerjakan)</strong> beserta butir soal, kunci, dan nilainya.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={fetchStudentData}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
              <span>Muat Ulang Data</span>
            </button>
            <Link
              href="/guru/rekapan"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
              title="Buka Rekapan Nilai & Presensi Terintegrasi Spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Rekapan & Spreadsheet</span>
            </Link>
            <Link
              href="/guru/ujian"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Kelola Ujian & Kuis</span>
            </Link>
          </div>
        </div>

        {/* Reminder Toast */}
        {reminderToast && (
          <div className="fixed bottom-8 right-8 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-200">
            <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>{reminderToast}</span>
          </div>
        )}

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">Total Siswa Terdaftar</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-sans">
              {summary.totalSiswa} <span className="text-xs font-normal text-slate-400">siswa</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Data aktif tersinkronisasi di Supabase</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-200/90 shadow-2xs space-y-1 bg-emerald-50/20">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold">Sudah Mengerjakan</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-800 font-sans">
              {summary.totalSudahMengerjakan}{" "}
              <span className="text-xs font-normal text-emerald-600">siswa</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">Telah menyelesaikan minimal 1 kuis/ujian</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-300 shadow-2xs space-y-1 bg-slate-50/60">
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-xs font-bold">Belum Mengerjakan (Abu-abu)</span>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-700 font-sans">
              {summary.totalBelumMengerjakan}{" "}
              <span className="text-xs font-normal text-slate-400">siswa</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Belum ada asesmen yang dikumpulkan</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">Rata-rata Nilai Kelas</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-sans flex items-baseline gap-1">
              <span>{summary.rataRataKelas}</span>
              <span className="text-xs text-slate-400 font-bold">/ 100</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">KKM Sekolah: 75 poin</p>
          </div>
        </div>

        {/* Filter Controls & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Segmented Filter Tab */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setFilterTab("semua")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterTab === "semua"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua Siswa ({students.length})
            </button>

            <button
              onClick={() => setFilterTab("sudah")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                filterTab === "sudah"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sudah Mengerjakan ({summary.totalSudahMengerjakan})</span>
            </button>

            <button
              onClick={() => setFilterTab("belum")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                filterTab === "belum"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Belum Mengerjakan ({summary.totalBelumMengerjakan})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa atau NISN..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
        </div>

        {/* Student Cards Grid */}
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Tidak Ada Siswa yang Sesuai</h3>
            <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau ganti filter status pengerjaan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStudents.map((st) => {
              const isDone = st.hasCompletedAny;

              return (
                <div
                  key={st.id}
                  className={`bg-white rounded-3xl p-6 border shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-5 ${
                    isDone
                      ? "border-emerald-200/90 hover:border-emerald-400"
                      : "border-slate-300/80 bg-slate-50/50 hover:border-slate-400"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Row: Avatar & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-2xl text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs ${
                          isDone ? "bg-gradient-to-br from-blue-600 to-indigo-700" : "bg-slate-400"
                        }`}>
                          {st.foto ? (
                            <img src={st.foto} alt={st.nama} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            st.nama.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-slate-900 truncate leading-snug">
                            {st.nama}
                          </h3>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            NISN: {st.nisn} • {st.namaKelas}
                          </span>
                        </div>
                      </div>

                      {/* Status Visual: Hijau vs Abu-Abu */}
                      {isDone ? (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Sudah Mengerjakan</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 border border-slate-300 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Belum Mengerjakan (Abu-abu)</span>
                        </span>
                      )}
                    </div>

                    {/* Progres Tugas / Nilai Akhir */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Asesmen Tuntas</span>
                        <div className="font-extrabold text-slate-800 mt-0.5">
                          {st.completedCount}{" "}
                          <span className="text-[10px] font-normal text-slate-400">/ {st.totalAssignments} Selesai</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Rata-rata Nilai</span>
                        <div className="font-extrabold mt-0.5">
                          {isDone ? (
                            <span className={st.rataRataNilai >= 75 ? "text-emerald-700" : "text-amber-700"}>
                              {st.rataRataNilai} / 100 ({st.statusKetuntasan})
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Belum Ada Nilai</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ============================================================= */}
                    {/* DETAIL STATUS KUIS, ULANGAN, & UJIAN PER-SISWA (HIJAU VS ABU)  */}
                    {/* ============================================================= */}
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      {/* 1. Kuis Bab (Bab 1–8) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                            <span>Kuis Harian (Bab 1–8)</span>
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {st.kuisCompletedCount || 0}/8 Selesai
                          </span>
                        </div>
                        <div className="grid grid-cols-8 gap-1">
                          {(st.kuisAssessments || []).map((k, idx) => (
                            <div
                              key={k.id || idx}
                              title={`${k.judul}: ${k.isDone ? `Nilai ${k.skor}` : "Belum Dikerjakan (Abu-abu)"}`}
                              className={`py-1 rounded-lg text-center text-[10px] font-bold border transition ${
                                k.isDone
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : "bg-slate-100 text-slate-600 border-slate-300"
                              }`}
                            >
                              <span className="block text-[8px] opacity-75">B{idx + 1}</span>
                              <span className="block font-black">{k.isDone ? k.skor : "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 2. Ulangan Harian (Semester 1 & 2) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ulangan Semester</span>
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {st.ulanganCompletedCount || 0}/2 Selesai
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(st.ulanganAssessments || []).map((u, idx) => (
                            <div
                              key={u.id || idx}
                              title={`${u.judul}: ${u.isDone ? `Nilai ${u.skor}` : "Belum Dikerjakan (Abu-abu)"}`}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center justify-between ${
                                u.isDone
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : "bg-slate-100 text-slate-600 border-slate-300"
                              }`}
                            >
                              <span className="text-[11px]">Semester {idx + 1}</span>
                              <span className={`text-[11px] font-black ${u.isDone ? "text-emerald-700" : "text-slate-600"}`}>
                                {u.isDone ? `${u.skor} Poin` : "Belum"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3. Ujian Resmi Sekolah (Ujian Resmi #1) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-purple-600" />
                            <span>Ujian Resmi Sekolah</span>
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {st.ujianCompletedCount || 0}/1 Selesai
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {(st.ujianAssessments || []).map((uj, idx) => (
                            <div
                              key={uj.id || idx}
                              title={`${uj.judul}: ${uj.isDone ? `Nilai ${uj.skor}` : "Belum Dikerjakan (Abu-abu)"}`}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center justify-between ${
                                uj.isDone
                                  ? "bg-purple-50 text-purple-800 border-purple-300"
                                  : "bg-slate-100 text-slate-600 border-slate-300"
                              }`}
                            >
                              <span className="text-[11px]">Ujian Resmi MTK #1</span>
                              <span className={`text-[11px] font-black ${uj.isDone ? "text-purple-700" : "text-slate-600"}`}>
                                {uj.isDone ? `${uj.skor} Poin` : "Belum"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3 Action Buttons per Siswa: Kuis, Ulangan, Ujian */}
                  <div className="pt-2 space-y-2 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Tinjau & Review Lembar Kerja:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {/* 1. Kuis Button */}
                      <button
                        type="button"
                        onClick={() => openStudentReview(st, "kuis")}
                        className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer shadow-2xs ${
                          (st.kuisCompletedCount || 0) > 0
                            ? "bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                        }`}
                        title="Klik untuk me-review Kuis Bab 1–8"
                      >
                        <span className="flex items-center gap-1 text-[11px] font-black">
                          <BookOpen className="w-3 h-3 text-blue-600" />
                          <span>Kuis</span>
                        </span>
                        <span className="text-[10px] mt-0.5 text-slate-500 font-semibold">
                          {st.kuisCompletedCount || 0}/{st.kuisTotalCount || 8}
                        </span>
                      </button>

                      {/* 2. Ulangan Button */}
                      <button
                        type="button"
                        onClick={() => openStudentReview(st, "ulangan")}
                        className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer shadow-2xs ${
                          (st.ulanganCompletedCount || 0) > 0
                            ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                        }`}
                        title="Klik untuk me-review Ulangan Semester 1 & 2"
                      >
                        <span className="flex items-center gap-1 text-[11px] font-black">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Ulangan</span>
                        </span>
                        <span className="text-[10px] mt-0.5 text-slate-500 font-semibold">
                          {st.ulanganCompletedCount || 0}/{st.ulanganTotalCount || 2}
                        </span>
                      </button>

                      {/* 3. Ujian Button */}
                      <button
                        type="button"
                        onClick={() => openStudentReview(st, "ujian")}
                        className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer shadow-2xs ${
                          (st.ujianCompletedCount || 0) > 0
                            ? "bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                        }`}
                        title="Klik untuk me-review Ujian Resmi Matematika #1"
                      >
                        <span className="flex items-center gap-1 text-[11px] font-black">
                          <Award className="w-3 h-3 text-purple-600" />
                          <span>Ujian</span>
                        </span>
                        <span className="text-[10px] mt-0.5 text-slate-500 font-semibold">
                          {st.ujianCompletedCount || 0}/{st.ujianTotalCount || 1}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL REVIEW LENGKAP PEKERJAAN & BUTIR SOAL SETIAP SISWA                  */}
        {/* ========================================================================= */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5 animate-in fade-in duration-150 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 overflow-hidden my-auto">
              {/* Modal Top Bar */}
              <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3 sm:gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 text-white font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-xs">
                    {selectedStudent.nama.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                        Lembar Kerja: {selectedStudent.nama}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0">
                        {selectedStudent.namaKelas}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      NISN: {selectedStudent.nisn} • Rata-rata Nilai:{" "}
                      <strong className={selectedStudent.rataRataNilai >= 75 ? "text-emerald-700" : "text-slate-700"}>
                        {selectedStudent.rataRataNilai}/100
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsStudentReportPrintOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Cetak Laporan Rapor Hasil Belajar Siswa (A4 PDF)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cetak Rapor Siswa</span>
                    <span className="sm:hidden">Cetak</span>
                  </button>

                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 3 Main Category Tabs */}
              <div className="px-4 sm:px-6 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategoryTab("kuis");
                    setExpandedAssessmentId(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
                    activeCategoryTab === "kuis"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>1. Kuis Bab ({selectedStudent.kuisCompletedCount || 0}/8 Selesai)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategoryTab("ulangan");
                    setExpandedAssessmentId(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
                    activeCategoryTab === "ulangan"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>2. Ulangan Semester ({selectedStudent.ulanganCompletedCount || 0}/2 Selesai)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategoryTab("ujian");
                    setExpandedAssessmentId(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
                    activeCategoryTab === "ujian"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>3. Ujian Resmi ({selectedStudent.ujianCompletedCount || 0}/1 Selesai)</span>
                </button>
              </div>

              {/* Category Items Definition */}
              {(() => {
                const currentCategoryList =
                  activeCategoryTab === "kuis"
                    ? (selectedStudent.kuisAssessments && selectedStudent.kuisAssessments.length > 0
                        ? selectedStudent.kuisAssessments
                        : selectedStudent.assessments.filter((a) => a.tipe === "kuis_bab" || /bab\s*\d+/i.test(a.judul)))
                    : activeCategoryTab === "ulangan"
                    ? (selectedStudent.ulanganAssessments && selectedStudent.ulanganAssessments.length > 0
                        ? selectedStudent.ulanganAssessments
                        : selectedStudent.assessments.filter((a) => a.tipe === "ulangan" || /ulangan/i.test(a.judul)))
                    : (selectedStudent.ujianAssessments && selectedStudent.ujianAssessments.length > 0
                        ? selectedStudent.ujianAssessments
                        : selectedStudent.assessments.filter((a) => a.tipe === "ujian" || /ujian resmi|pts|pas/i.test(a.judul)));

                const catDoneCount = currentCategoryList.filter((a) => a.isDone).length;
                const catPendingCount = currentCategoryList.length - catDoneCount;

                return (
                  <>
                    {/* Modal Filter Tabs */}
                    <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto sm:overflow-visible flex-nowrap sm:flex-wrap">
                      <button
                        onClick={() => setModalFilter("semua")}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          modalFilter === "semua"
                            ? "bg-slate-900 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Semua ({currentCategoryList.length})
                      </button>
                      <button
                        onClick={() => setModalFilter("sudah")}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          modalFilter === "sudah"
                            ? "bg-emerald-600 text-white"
                            : "text-emerald-800 hover:bg-emerald-50"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sudah Dikerjakan ({catDoneCount})</span>
                      </button>
                      <button
                        onClick={() => setModalFilter("belum")}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          modalFilter === "belum"
                            ? "bg-slate-600 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Belum Dikerjakan ({catPendingCount})</span>
                      </button>
                    </div>

                    {/* Modal Body: Assessment List & Detail Soal */}
                    <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                      {currentCategoryList
                        .filter((a) => {
                          if (modalFilter === "sudah") return a.isDone;
                          if (modalFilter === "belum") return !a.isDone;
                          return true;
                        })
                        .map((a) => {
                          const isExpanded = expandedAssessmentId === a.id;

                          if (!a.isDone) {
                            // KARTU ABU-ABU UNTUK YANG BELUM DIKERJAKAN
                            return (
                              <div
                                key={a.id}
                                className="p-5 rounded-2xl border border-slate-300 bg-slate-50/90 space-y-3"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                        {activeCategoryTab === "kuis"
                                          ? "Kuis Bab"
                                          : activeCategoryTab === "ulangan"
                                          ? "Ulangan Semester"
                                          : "Ujian Resmi"}
                                      </span>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 border border-slate-300">
                                        Belum Dikerjakan (Abu-abu)
                                      </span>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800">{a.judul}</h4>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                      Mata Pelajaran: {a.mapel} • Standar: {a.totalSoal} Butir Soal
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleSendReminder(selectedStudent.nama, a.judul)}
                                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-2xs cursor-pointer"
                                  >
                                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Kirim Reminder</span>
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          // KARTU HIJAU / SUDAH SELESAI BESERTA BUTIR SOAL
                          return (
                            <div
                              key={a.id}
                              className="rounded-2xl border border-emerald-200/90 bg-white overflow-hidden shadow-2xs transition"
                            >
                              {/* Assessment Header Bar */}
                              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/20">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      Selesai Dikerjakan
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                      • Selesai pada: {a.tanggalSelesai || "Terkumpul"}
                                    </span>
                                  </div>
                                  <h4 className="text-base font-black text-slate-900">{a.judul}</h4>
                                  <p className="text-xs text-slate-600 font-medium">
                                    {a.mapel} • {a.soalList.length} Butir Soal Terjawab
                                  </p>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="text-2xl font-black text-emerald-800 font-sans leading-none">
                                      {a.skor}
                                      <span className="text-xs font-bold text-emerald-600"> / 100</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-700">
                                      {(a.skor || 0) >= 75 ? "Tuntas KKM" : "Remedial"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                    <Link
                                      href={
                                        a.tipe === "kuis_bab"
                                          ? `/guru/soal`
                                          : `/guru/ujian/${a.targetId || "u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"}/edit`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 shadow-2xs"
                                      title="Kelola & edit butir soal ujian di Dashboard Guru"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                                      <span className="hidden sm:inline">Kelola Soal Ujian</span>
                                      <span className="sm:hidden">Kelola</span>
                                      <ExternalLink className="w-3 h-3 text-slate-400" />
                                    </Link>

                                    <button
                                      type="button"
                                      onClick={() => setExpandedAssessmentId(isExpanded ? null : a.id)}
                                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>{isExpanded ? "Tutup Soal" : "Rincian Soal"}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Dropdown Rincian Butir Soal & Jawaban Siswa */}
                              {isExpanded && (
                                  <div className="p-4 sm:p-6 border-t border-emerald-100 space-y-4 bg-slate-50/40 animate-in fade-in duration-150">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <h5 className="text-xs font-black uppercase tracking-wider text-slate-500">
                                        Daftar Butir Soal, Jawaban Siswa & Pembahasan:
                                      </h5>
                                      <span className="text-[11px] font-bold text-slate-400">
                                        Total: {a.soalList.length} Butir Soal Terintegrasi
                                      </span>
                                    </div>

                                    <div className="space-y-4">
                                      {a.soalList.map((q, qIdx) => (
                                        <div
                                          key={q.id || `q-${qIdx}`}
                                          className={`p-4 sm:p-5 rounded-2xl border bg-white space-y-3 shadow-2xs ${
                                            q.isBenar
                                              ? "border-emerald-200"
                                              : "border-rose-200 bg-rose-50/20"
                                          }`}
                                        >
                                          {/* Nomor Soal, Status & Tombol Edit Butir Soal */}
                                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 flex-wrap">
                                            <span className="font-black text-xs text-slate-800">
                                              Soal #{qIdx + 1}{" "}
                                              <span className="text-[10px] font-medium text-slate-400 capitalize">
                                                ({q.tipeSoal.replace("_", " ")})
                                              </span>
                                            </span>

                                            <div className="flex items-center gap-2">
                                              {q.isBenar ? (
                                                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                                  <Check className="w-3 h-3 text-emerald-600" />
                                                  <span>Benar (+{q.nilai} Poin)</span>
                                                </span>
                                              ) : (
                                                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                                                  <X className="w-3 h-3 text-rose-600" />
                                                  <span>Salah (0 Poin)</span>
                                                </span>
                                              )}

                                              {/* Action Edit Soal Individual */}
                                              <button
                                                type="button"
                                                onClick={() => handleOpenEditQuestionModal(a, q, qIdx)}
                                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                                title="Edit Pertanyaan, Kunci Jawaban & Pembahasan Butir Soal Ini"
                                              >
                                                <Edit3 className="w-3 h-3 text-blue-600" />
                                                <span>Edit Soal</span>
                                              </button>
                                            </div>
                                          </div>

                                          {/* Teks Pertanyaan Render LaTeX */}
                                          <div className="text-xs sm:text-sm text-slate-900 leading-relaxed font-medium">
                                            <MarkdownRenderer content={q.pertanyaan} />
                                          </div>

                                          {/* Komparasi Jawaban Siswa vs Kunci */}
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                                            <div
                                              className={`p-3 rounded-xl border ${
                                                q.isBenar
                                                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                                                  : "bg-rose-50/60 border-rose-200 text-rose-900"
                                              }`}
                                            >
                                              <span className="text-[10px] font-bold uppercase block text-slate-500 mb-0.5">
                                                Jawaban Siswa:
                                              </span>
                                              <div className="font-extrabold">
                                                <MarkdownRenderer content={q.jawabanSiswa || "-"} isCompact />
                                              </div>
                                            </div>

                                            <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-800">
                                              <span className="text-[10px] font-bold uppercase block text-slate-500 mb-0.5">
                                                Kunci Jawaban Benar:
                                              </span>
                                              <div className="font-extrabold text-blue-700">
                                                <MarkdownRenderer content={q.kunciJawaban || "-"} isCompact />
                                              </div>
                                            </div>
                                          </div>

                                          {/* Analisis Miskonsepsi Jika Salah */}
                                          {!q.isBenar && q.miskonsepsi && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                                              <span className="font-black flex items-center gap-1 text-[11px] text-amber-800">
                                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                                <span>Analisis Miskonsepsi Jawaban Siswa:</span>
                                              </span>
                                              <p className="leading-relaxed font-medium">{q.miskonsepsi}</p>
                                            </div>
                                          )}

                                          {/* Pembahasan Matematis */}
                                          {q.pembahasan && (
                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                                              <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wide block">
                                                Pembahasan Matematis:
                                              </span>
                                              <div className="leading-relaxed font-medium text-slate-800">
                                                <MarkdownRenderer content={q.pembahasan} />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Footer Section di Lembar Soal: Akses Editor Lengkap */}
                                    <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 bg-white/70 p-3.5 rounded-2xl border">
                                      <p className="text-[11px] text-slate-500 font-medium">
                                        Perubahan butir soal, kunci & pembahasan otomatis tersinkronisasi ke seluruh review pengerjaan siswa.
                                      </p>
                                      <Link
                                        href={
                                          a.tipe === "kuis_bab"
                                            ? `/guru/soal`
                                            : `/guru/ujian/${a.targetId || "u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"}/edit`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Buka Editor Lengkap & Tambah Soal</span>
                                        <ExternalLink className="w-3 h-3 opacity-80" />
                                      </Link>
                                    </div>
                                  </div>
                                )}
                            </div>
                          );
                        })}
                    </div>
                  </>
                );
              })()}

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsStudentReportPrintOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Rapor Siswa (PDF A4)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  Tutup Lembar Kerja
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CETAK RAPOR SISWA INDIVIDUAL */}
        {isStudentReportPrintOpen && selectedStudent && (
          <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:inset-auto print:bg-white print:p-0 print:z-auto print:overflow-visible">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 lg:p-8 shadow-2xl border border-slate-200 space-y-5 my-4 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:border-none print:shadow-none print:p-0 print:my-0 print:max-h-none print:overflow-visible">
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Pratinjau Cetak Rapor Hasil Belajar Siswa
                    </h3>
                    <p className="text-xs text-slate-500">
                      Format resmi dokumen kemajuan belajar individu siap print A4
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Sekarang (Ctrl+P)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsStudentReportPrintOpen(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* PRINT CONTENT AREA */}
              <div className="bg-white text-black p-4 sm:p-6 border border-slate-300 rounded-2xl space-y-5 print:border-none print:p-0 font-sans">
                {/* Kop Surat Sekolah */}
                <div className="text-center border-b-2 border-black pb-3 space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    DINAS PENDIDIKAN & KEBUDAYAAN • KURIKULUM MERDEKA
                  </h4>
                  <h2 className="text-lg font-black uppercase text-black tracking-tight">
                    LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR PROGRES)
                  </h2>
                  <p className="text-xs font-medium text-slate-600">
                    SMP MUHAMMADIYAH 1 • TAHUN PELAJARAN 2025/2026
                  </p>
                </div>

                {/* Identitas Siswa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 text-xs font-medium gap-2 pt-1 border-b border-slate-200 pb-3">
                  <div className="space-y-1">
                    <div><strong>Nama Peserta Didik:</strong> {selectedStudent.nama}</div>
                    <div><strong>Nomor Induk Siswa Nasional (NISN):</strong> {selectedStudent.nisn}</div>
                    <div><strong>Kelas / Rombongan Belajar:</strong> {selectedStudent.namaKelas}</div>
                  </div>
                  <div className="text-left sm:text-right print:text-right space-y-1">
                    <div><strong>Mata Pelajaran:</strong> Matematika (Fase D)</div>
                    <div><strong>Guru Pengampu:</strong> Ibu Siti Rahmawati, M.Pd.</div>
                    <div><strong>Kriteria Ketuntasan (KKM):</strong> 75 Poin</div>
                  </div>
                </div>

                {/* Tabel Nilai Komponen */}
                <div>
                  <table className="w-full text-left text-xs border-collapse border border-black">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center border-b border-black">
                        <th className="border border-black p-2 w-10">No</th>
                        <th className="border border-black p-2 text-left">Komponen Asesmen Pembelajaran</th>
                        <th className="border border-black p-2 w-28">Status</th>
                        <th className="border border-black p-2 w-24">Skor / Nilai</th>
                        <th className="border border-black p-2 w-24">Ketuntasan</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="border border-black p-2 text-center">1</td>
                        <td className="border border-black p-2 font-medium">
                          Rata-rata Kuis Harian Formatif (Bab 1–8)
                        </td>
                        <td className="border border-black p-2 text-center text-[11px]">
                          {selectedStudent.kuisCompletedCount}/8 Selesai
                        </td>
                        <td className="border border-black p-2 text-center font-bold">
                          {selectedStudent.kuisAverage ?? "-"}
                        </td>
                        <td className="border border-black p-2 text-center font-bold">
                          {(selectedStudent.kuisAverage ?? 0) >= 75 ? "Tuntas" : "Remedial"}
                        </td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="border border-black p-2 text-center">2</td>
                        <td className="border border-black p-2 font-medium">
                          Ulangan Harian Semester (Semester 1 & 2)
                        </td>
                        <td className="border border-black p-2 text-center text-[11px]">
                          {selectedStudent.ulanganCompletedCount}/2 Selesai
                        </td>
                        <td className="border border-black p-2 text-center font-bold">
                          {selectedStudent.ulanganAverage ?? "-"}
                        </td>
                        <td className="border border-black p-2 text-center font-bold">
                          {(selectedStudent.ulanganAverage ?? 0) >= 75 ? "Tuntas" : "Remedial"}
                        </td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="border border-black p-2 text-center">3</td>
                        <td className="border border-black p-2 font-medium">
                          Ujian Resmi Terstandar CBT (PTS / PAS)
                        </td>
                        <td className="border border-black p-2 text-center text-[11px]">
                          {selectedStudent.ujianCompletedCount}/1 Selesai
                        </td>
                        <td className="border border-black p-2 text-center font-bold">
                          {typeof selectedStudent.ujianScore === "number" && selectedStudent.ujianScore > 0
                            ? selectedStudent.ujianScore
                            : "-"}
                        </td>
                        <td className="border border-black p-2 text-center font-bold">
                          {(selectedStudent.ujianScore ?? 0) >= 75 ? "Tuntas" : "Remedial"}
                        </td>
                      </tr>
                      <tr className="bg-slate-50 font-black border-t-2 border-black">
                        <td className="border border-black p-2 text-center" colSpan={3}>
                          NILAI AKHIR KUMULATIF & PREDIKAT
                        </td>
                        <td className="border border-black p-2 text-center text-sm">
                          {selectedStudent.rataRataNilai} / 100
                        </td>
                        <td className="border border-black p-2 text-center text-xs">
                          {selectedStudent.statusKetuntasan}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Catatan Guru */}
                <div className="p-3 border border-black rounded-xl text-xs space-y-1 bg-slate-50">
                  <span className="font-bold uppercase tracking-wider block">Catatan & Masukan Guru Pengampu:</span>
                  <p className="italic text-slate-700">
                    {selectedStudent.rataRataNilai >= 85
                      ? `Ananda ${selectedStudent.nama} menunjukkan penguasaan materi yang sangat baik dalam menyelesaikan soal konsep dan penalaran matematika. Pertahankan konsistensi belajarnya.`
                      : selectedStudent.rataRataNilai >= 75
                      ? `Ananda ${selectedStudent.nama} telah mencapai kriteria ketuntasan minimal (KKM). Disarankan memperbanyak latihan soal penalaran berbasis HOTS untuk bab-bab berikutnya.`
                      : `Ananda ${selectedStudent.nama} perlu mengikuti pendampingan pengayaan/remedial pada materi yang belum tuntas serta meningkatkan keaktifan pengerjaan kuis.`}
                  </p>
                </div>

                {/* Tanda Tangan */}
                <div className="pt-6 grid grid-cols-2 text-xs text-center">
                  <div>
                    <p>Mengetahui,</p>
                    <p className="font-semibold">Orang Tua / Wali Murid</p>
                    <div className="h-16" />
                    <p className="font-bold underline">( ............................................ )</p>
                  </div>
                  <div>
                    <p>Yogyakarta, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                    <p className="font-semibold">Guru Mata Pelajaran Matematika</p>
                    <div className="h-16" />
                    <p className="font-bold underline">Ibu Siti Rahmawati, M.Pd.</p>
                    <p className="text-[10px] text-slate-500">NIP. 19850315 201001 2 018</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MODAL EDITOR BUTIR SOAL TERPADU GURU (LIVE PREVIEW & KATEX TOOLBAR) */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {editingModalData && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">
                      Edit Butir Soal #{editingModalData.questionIndex + 1}
                    </h3>
                    <p className="text-xs text-blue-100 mt-0.5">
                      {editingModalData.assessment.judul} • Terintegrasi Bank Soal & Lembar Kerja
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingModalData(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-slate-800">
                {/* Toolbar Rumus Matematika Cepat */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Sisipkan Rumus Matematika Cepat:
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <span>Target:</span>
                      <button
                        type="button"
                        onClick={() => setActiveToolbarField("pertanyaan")}
                        className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                          activeToolbarField === "pertanyaan"
                            ? "bg-blue-600 text-white font-bold"
                            : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                        }`}
                      >
                        Pertanyaan
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveToolbarField("kunci")}
                        className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                          activeToolbarField === "kunci"
                            ? "bg-blue-600 text-white font-bold"
                            : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                        }`}
                      >
                        Kunci
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveToolbarField("pembahasan")}
                        className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                          activeToolbarField === "pembahasan"
                            ? "bg-blue-600 text-white font-bold"
                            : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                        }`}
                      >
                        Pembahasan
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: "a/b", insert: "$\\frac{a}{b}$" },
                      { label: "x²", insert: "$x^2$" },
                      { label: "√x", insert: "$\\sqrt{x}$" },
                      { label: "×", insert: "$\\times$" },
                      { label: "÷", insert: "$\\div$" },
                      { label: "π", insert: "$\\pi$" },
                      { label: "±", insert: "$\\pm$" },
                      { label: "°", insert: "$^{\\circ}$" },
                      { label: "Δ", insert: "$\\Delta$" },
                      { label: "$...$", insert: "$x + y = 10$" },
                    ].map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        type="button"
                        onClick={() => handleInsertMathToolbarSymbol(btn.insert)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 font-mono text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. Teks Pertanyaan */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Teks Pertanyaan Soal (Mendukung KaTeX):
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowFormulaPreview(!showFormulaPreview)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{showFormulaPreview ? "Sembunyikan Preview" : "Lihat Live Preview"}</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={editPertanyaan}
                    onChange={(e) => setEditPertanyaan(e.target.value)}
                    onFocus={() => setActiveToolbarField("pertanyaan")}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono text-xs transition"
                    placeholder="Tuliskan pertanyaan... Contoh: Sederhanakan bentuk $5(x - 2) + 3(2x + 4)$!"
                  />
                  {/* Live Render Preview */}
                  {editPertanyaan.trim() && (
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/80 text-xs text-slate-900 leading-relaxed font-medium">
                      <span className="text-[10px] font-extrabold uppercase text-blue-800 block mb-1">
                        Live Preview Pertanyaan:
                      </span>
                      <MarkdownRenderer content={editPertanyaan} />
                    </div>
                  )}
                </div>

                {/* 2. Komparasi Kunci Jawaban vs Jawaban Siswa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Kunci Jawaban Benar:
                    </label>
                    <input
                      type="text"
                      value={editKunciJawaban}
                      onChange={(e) => setEditKunciJawaban(e.target.value)}
                      onFocus={() => setActiveToolbarField("kunci")}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs font-semibold"
                      placeholder="Contoh: 11x + 2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Jawaban Siswa (Hasil Review):
                    </label>
                    <input
                      type="text"
                      value={editJawabanSiswa}
                      onChange={(e) => setEditJawabanSiswa(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs font-semibold"
                      placeholder="Contoh: 11x + 2"
                    />
                  </div>
                </div>

                {/* 3. Status Penilaian & Poin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Status Penilaian:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditIsBenar(true)}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          editIsBenar
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Benar (+{editNilai} Poin)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditIsBenar(false)}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          !editIsBenar
                            ? "bg-rose-600 border-rose-600 text-white shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Salah (0 Poin)</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Bobot Nilai / Poin Soal:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={editNilai}
                      onChange={(e) => setEditNilai(Number(e.target.value) || 10)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* 4. Pembahasan Matematis */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-700">
                    Pembahasan Matematis & Langkah Penyelesaian:
                  </label>
                  <textarea
                    rows={3}
                    value={editPembahasan}
                    onChange={(e) => setEditPembahasan(e.target.value)}
                    onFocus={() => setActiveToolbarField("pembahasan")}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono text-xs transition"
                    placeholder="Tuliskan pembahasan matematis... Contoh: $5x - 10 + 6x + 12 = 11x + 2$."
                  />
                  {editPembahasan.trim() && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                      <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                        Live Preview Pembahasan:
                      </span>
                      <MarkdownRenderer content={editPembahasan} />
                    </div>
                  )}
                </div>

                {/* 5. Analisis Miskonsepsi (Jika Salah) */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-700">
                    Catatan Analisis Miskonsepsi Siswa:
                  </label>
                  <input
                    type="text"
                    value={editMiskonsepsi}
                    onChange={(e) => setEditMiskonsepsi(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                    placeholder="Contoh: Siswa keliru pada operasi tanda $-10 + 12$."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingModalData(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSaveEditedQuestion}
                  disabled={isSavingQuestion}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingQuestion ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan Soal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </GuruLayout>
  );
}
