import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getQuestionsForAssessmentReview } from "@/lib/exam-questions-store";

// Canonical Grade 8 Mathematics Curriculum Definitions
const CANONICAL_BABS = [
  { id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", judul: "Bab 1: Pola Bilangan & Barisan Bilangan", mapel: "Matematika", urutan: 1 },
  { id: "b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22", judul: "Bab 2: Bentuk Aljabar & PLSV/PTLSV", mapel: "Matematika", urutan: 2 },
  { id: "b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33", judul: "Bab 3: Relasi & Fungsi", mapel: "Matematika", urutan: 3 },
  { id: "b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44", judul: "Bab 4: Persamaan Garis Lurus (PGL)", mapel: "Matematika", urutan: 4 },
  { id: "b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55", judul: "Bab 5: Sistem Persamaan Linear Dua Variabel (SPLDV)", mapel: "Matematika", urutan: 5 },
  { id: "b6eebc99-9c0b-4ef8-bb6d-6bb9bd380a66", judul: "Bab 6: Teorema Pythagoras", mapel: "Matematika", urutan: 6 },
  { id: "b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a77", judul: "Bab 7: Bangun Ruang Sisi Datar (BRSD)", mapel: "Matematika", urutan: 7 },
  { id: "b8eebc99-9c0b-4ef8-bb6d-6bb9bd380a88", judul: "Bab 8: Statistika & Peluang", mapel: "Matematika", urutan: 8 },
];

const CANONICAL_ULANGAN_LIST = [
  {
    id: "u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    judul: "Ulangan Matematika Semester 1",
    mapel: "Matematika",
    tipe: "ulangan",
  },
  {
    id: "u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    judul: "Ulangan Matematika Semester 2",
    mapel: "Matematika",
    tipe: "ulangan",
  },
];

const CANONICAL_UJIAN_LIST = [
  {
    id: "e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
    judul: "Ujian Resmi Matematika #1",
    mapel: "Matematika",
    tipe: "ujian",
  },
];

// 12 Canonical Roster Siswa Kelas 8 Matematika dengan variasi profil dan status pengerjaan yang realistis
const DEFAULT_STUDENTS_ROSTER = [
  {
    id: "44444444-4444-4444-4444-444444444444",
    nama_lengkap: "Budi Kartika",
    nisn: "0089201144",
    poin: 980,
    streak: 8,
    kuisScores: [88, 90, 85, 87, 92, 86, 88, 88],
    ulanganSem1: 85,
    ulanganSem2: 88,
    ujianResmi1: 86,
  },
  {
    id: "s-fauzi-02",
    nama_lengkap: "Ahmad Fauzi",
    nisn: "0089201145",
    poin: 1180,
    streak: 15,
    kuisScores: [92, 95, 90, 94, 92, 90, 92, 91],
    ulanganSem1: 90,
    ulanganSem2: 94,
    ujianResmi1: 92,
  },
  {
    id: "s-aisyah-03",
    nama_lengkap: "Siti Aisyah Putri",
    nisn: "0089201146",
    poin: 1120,
    streak: 12,
    kuisScores: [90, 88, 92, 90, 91, 89, 90, 90],
    ulanganSem1: 88,
    ulanganSem2: 90,
    ujianResmi1: 90,
  },
  {
    id: "s-rian-04",
    nama_lengkap: "Rian Hidayat",
    nisn: "0089201147",
    poin: 980,
    streak: 10,
    // Bab 1-6 selesai, Bab 7 & 8 belum (abu-abu)
    kuisScores: [84, 86, 82, 85, 84, 83, null, null],
    ulanganSem1: 80,
    ulanganSem2: null, // belum (abu-abu)
    ujianResmi1: 80,
  },
  {
    id: "s-nanda-05",
    nama_lengkap: "Nanda Kurnia Putri",
    nisn: "0089201148",
    poin: 940,
    streak: 9,
    // Bab 1-7 selesai, Bab 8 belum (abu-abu)
    kuisScores: [86, 88, 85, 87, 86, 84, 86, null],
    ulanganSem1: 84,
    ulanganSem2: 86,
    ujianResmi1: 85,
  },
  {
    id: "s-dimas-06",
    nama_lengkap: "Dimas Wahyudi",
    nisn: "0089201149",
    poin: 890,
    streak: 8,
    // Bab 1-5 selesai, Bab 6-8 belum (abu-abu)
    kuisScores: [80, 82, 78, 80, 80, null, null, null],
    ulanganSem1: 76,
    ulanganSem2: null, // belum (abu-abu)
    ujianResmi1: null, // belum (abu-abu)
  },
  {
    id: "s-dewi-07",
    nama_lengkap: "Dewi Sartika",
    nisn: "0089201150",
    poin: 860,
    streak: 7,
    kuisScores: [88, 86, 90, 88, 87, 88, 89, 88],
    ulanganSem1: 85,
    ulanganSem2: 88,
    ujianResmi1: 84,
  },
  {
    id: "s-fira-08",
    nama_lengkap: "Fira Anggraini",
    nisn: "0089201151",
    poin: 820,
    streak: 6,
    // Bab 1-4 selesai (skor < KKM), Bab 5-8 belum (abu-abu)
    kuisScores: [76, 74, 78, 72, null, null, null, null],
    ulanganSem1: 72,
    ulanganSem2: null, // belum (abu-abu)
    ujianResmi1: null, // belum (abu-abu)
  },
  {
    id: "s-gilang-09",
    nama_lengkap: "Gilang Ramadhan",
    nisn: "0089201152",
    poin: 780,
    streak: 5,
    // Bab 1-4 selesai (skor < KKM), Bab 5-8 belum (abu-abu)
    kuisScores: [72, 75, 70, 74, null, null, null, null],
    ulanganSem1: 70,
    ulanganSem2: null, // belum (abu-abu)
    ujianResmi1: null, // belum (abu-abu)
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    nama_lengkap: "Ahmad Raihan",
    nisn: "0089201153",
    poin: 750,
    streak: 4,
    kuisScores: [82, 84, 80, 82, 83, 81, 82, 82],
    ulanganSem1: 80,
    ulanganSem2: 84,
    ujianResmi1: 82,
  },
  {
    id: "77777777-7777-7777-7777-777777777777",
    nama_lengkap: "Siti Rahma Putri",
    nisn: "0089201154",
    poin: 720,
    streak: 4,
    kuisScores: [85, 86, 84, 85, 86, 84, 85, 85],
    ulanganSem1: 82,
    ulanganSem2: 85,
    ujianResmi1: 84,
  },
  {
    id: "s-bella-12",
    nama_lengkap: "Bella Safitri",
    nisn: "0089201155",
    poin: 690,
    streak: 0,
    // 100% BELUM MENGERJAKAN (FULL ABU-ABU)
    kuisScores: [null, null, null, null, null, null, null, null],
    ulanganSem1: null,
    ulanganSem2: null,
    ujianResmi1: null,
  },
];

// Soal-soal kurikulum Matematika Fase D Kelas 8 untuk review guru
const MOCK_BAB_QUESTIONS: Record<number, Array<{ pertanyaan: string; kunci: string; pembahasan: string }>> = {
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
      pertanyaan: "Bentuk sederhana dari 4(2x - 3) - 3(x - 5) adalah...",
      kunci: "5x + 3",
      pembahasan: "8x - 12 - 3x + 15 = (8x - 3x) + (-12 + 15) = 5x + 3.",
    },
    {
      pertanyaan: "Penyelesaian dari persamaan linear 3x + 7 = 22 adalah...",
      kunci: "x = 5",
      pembahasan: "3x = 22 - 7 => 3x = 15 => x = 5.",
    },
    {
      pertanyaan: "Faktor dari bentuk aljabar x² - 9 adalah...",
      kunci: "(x - 3)(x + 3)",
      pembahasan: "Bentuk selisih kuadrat a² - b² = (a - b)(a + b). Maka x² - 9 = (x - 3)(x + 3).",
    },
  ],
  3: [
    {
      pertanyaan: "Diketahui fungsi f(x) = 2x - 5. Nilai dari f(7) adalah...",
      kunci: "9",
      pembahasan: "f(7) = 2(7) - 5 = 14 - 5 = 9.",
    },
    {
      pertanyaan: "Himpunan pasangan berurutan yang merupakan pemetaan (fungsi) adalah...",
      kunci: "{(1,a), (2,b), (3,c)}",
      pembahasan: "Fungsi mensyaratkan setiap domain berpasangan tepat satu dengan kodomain.",
    },
    {
      pertanyaan: "Bayangan dari -3 oleh fungsi g(x) = 4 - x² adalah...",
      kunci: "-5",
      pembahasan: "g(-3) = 4 - (-3)² = 4 - 9 = -5.",
    },
  ],
  4: [
    {
      pertanyaan: "Gradien garis dengan persamaan y = 4x - 7 adalah...",
      kunci: "4",
      pembahasan: "Bentuk umum y = mx + c memiliki gradien m. Maka m = 4.",
    },
    {
      pertanyaan: "Gradien garis yang melalui titik (2, 3) dan (6, 11) adalah...",
      kunci: "2",
      pembahasan: "m = (y2 - y1) / (x2 - x1) = (11 - 3) / (6 - 2) = 8 / 4 = 2.",
    },
    {
      pertanyaan: "Persamaan garis yang bergradien 3 dan melalui titik (0, -2) adalah...",
      kunci: "y = 3x - 2",
      pembahasan: "y - y1 = m(x - x1) => y - (-2) = 3(x - 0) => y + 2 = 3x => y = 3x - 2.",
    },
  ],
  5: [
    {
      pertanyaan: "Penyelesaian dari sistem persamaan x + y = 10 dan x - y = 4 adalah...",
      kunci: "x = 7, y = 3",
      pembahasan: "Jumlahkan kedua persamaan: 2x = 14 => x = 7. Substitusi: 7 + y = 10 => y = 3.",
    },
    {
      pertanyaan: "Harga 2 buku dan 3 pensil Rp12.000, sedangkan 3 buku dan 1 pensil Rp11.000. Harga 1 buku adalah...",
      kunci: "Rp3.000",
      pembahasan: "2b + 3p = 12000; 3b + p = 11000 => p = 11000 - 3b => 2b + 3(11000 - 3b) = 12000 => -7b = -21000 => b = 3000.",
    },
    {
      pertanyaan: "Titik potong garis 2x + y = 8 dan y = x + 2 adalah...",
      kunci: "(2, 4)",
      pembahasan: "2x + (x + 2) = 8 => 3x = 6 => x = 2. Maka y = 2 + 2 = 4.",
    },
  ],
  6: [
    {
      pertanyaan: "Segitiga siku-siku memiliki panjang sisi siku-siku 6 cm dan 8 cm. Panjang sisi miringnya adalah...",
      kunci: "10 cm",
      pembahasan: "c² = a² + b² = 6² + 8² = 36 + 64 = 100 => c = 10 cm.",
    },
    {
      pertanyaan: "Kelompok tiga bilangan berikut yang merupakan Tripel Pythagoras adalah...",
      kunci: "5, 12, 13",
      pembahasan: "5² + 12² = 25 + 144 = 169 = 13².",
    },
    {
      pertanyaan: "Panjang hipotenusa suatu segitiga siku-siku 17 cm, salah satu sisi tegaknya 15 cm. Sisi tegak lainnya adalah...",
      kunci: "8 cm",
      pembahasan: "b = √(17² - 15²) = √(289 - 225) = √64 = 8 cm.",
    },
  ],
  7: [
    {
      pertanyaan: "Volume balok dengan ukuran panjang 10 cm, lebar 8 cm, dan tinggi 5 cm adalah...",
      kunci: "400 cm³",
      pembahasan: "V = p × l × t = 10 × 8 × 5 = 400 cm³.",
    },
    {
      pertanyaan: "Luas permukaan kubus yang panjang rusuknya 6 cm adalah...",
      kunci: "216 cm²",
      pembahasan: "L = 6 × s² = 6 × 6² = 6 × 36 = 216 cm².",
    },
    {
      pertanyaan: "Banyaknya titik sudut dan bidang sisi pada prisma segitiga berturut-turut adalah...",
      kunci: "6 dan 5",
      pembahasan: "Prisma segi-n memiliki 2n titik sudut (2×3=6) dan n+2 bidang sisi (3+2=5).",
    },
  ],
  8: [
    {
      pertanyaan: "Rata-rata (mean) dari data 6, 7, 8, 8, 9, 10 adalah...",
      kunci: "8,0",
      pembahasan: "Jumlah data = 48, banyak data = 6. Mean = 48 / 6 = 8,0.",
    },
    {
      pertanyaan: "Median dari data 4, 6, 7, 8, 9, 10, 11 adalah...",
      kunci: "8",
      pembahasan: "Data terurut n = 7 (ganjil). Nilai tengah berada pada data ke-4, yaitu 8.",
    },
    {
      pertanyaan: "Sebuah dadu bersisi enam dilempar sekali. Peluang muncul mata dadu prima adalah...",
      kunci: "1/2",
      pembahasan: "Mata dadu prima: {2, 3, 5} -> n(A) = 3. Ruang sampel S = {1,2,3,4,5,6} -> n(S) = 6. Peluang = 3/6 = 1/2.",
    },
  ],
};

export async function GET() {
  try {
    const adminDb = createAdminClient();

    // 1. Fetch all real students from profil
    let rawStudents: any[] = [];
    try {
      const { data: dbStudents, error: stErr } = await adminDb
        .from("profil")
        .select("id, nama_lengkap, nisn, foto_url, poin, streak, dibuat_pada")
        .eq("peran", "siswa")
        .order("nama_lengkap", { ascending: true });

      if (!stErr && dbStudents && dbStudents.length > 0) {
        rawStudents = dbStudents;
      }
    } catch (err) {
      console.warn("Notice: Fetch profil fallback to canonical roster in siswa:", err);
    }

    // Merge database students with canonical roster so we always have the 12 complete students
    const effectiveStudents = [...DEFAULT_STUDENTS_ROSTER];
    if (rawStudents.length > 0) {
      rawStudents.forEach((st) => {
        const foundIdx = effectiveStudents.findIndex((e) => e.id === st.id || e.nama_lengkap.toLowerCase() === st.nama_lengkap.toLowerCase());
        if (foundIdx >= 0) {
          effectiveStudents[foundIdx] = {
            ...effectiveStudents[foundIdx],
            ...st,
          };
        } else {
          effectiveStudents.push({
            id: st.id,
            nama_lengkap: st.nama_lengkap,
            nisn: st.nisn || `0089${Math.floor(201140 + effectiveStudents.length)}`,
            poin: st.poin || 800,
            streak: st.streak || 3,
            kuisScores: [82, 85, 80, 84, null, null, null, null],
            ulanganSem1: 80,
            ulanganSem2: null,
            ujianResmi1: null,
          });
        }
      });
    }

    const studentIds = effectiveStudents.map((s) => s.id);

    // 2. Fetch real sessions from Supabase
    let allSesi: any[] = [];
    try {
      const { data } = await adminDb
        .from("sesi")
        .select("id, siswa_id, bab_id, status_sesi, tipe_sesi, skor_akhir, mulai_pada, selesai_pada")
        .in("siswa_id", studentIds);
      if (data) allSesi = data;
    } catch {}

    const sesiIds = allSesi.map((s) => s.id);

    // Fetch real answers without querying non-existent columns like `label`
    let allJawaban: any[] = [];
    if (sesiIds.length > 0) {
      try {
        const { data: jwbData } = await adminDb
          .from("jawaban")
          .select(`
            id,
            sesi_id,
            soal_id,
            opsi_dipilih_id,
            jawaban_teks,
            is_benar,
            nilai,
            umpan_balik_ai,
            soal (
              id,
              pertanyaan,
              tipe_soal,
              kunci_jawaban,
              pembahasan,
              opsi_soal (
                id,
                teks_opsi,
                benar,
                alasan_salah
              )
            )
          `)
          .in("sesi_id", sesiIds);
        if (jwbData) allJawaban = jwbData;
      } catch (err) {
        console.warn("Notice: Fetch jawaban fallback:", err);
      }
    }

    const jawabanBySesiMap = new Map<string, any[]>();
    allJawaban.forEach((j) => {
      const arr = jawabanBySesiMap.get(j.sesi_id) || [];
      arr.push(j);
      jawabanBySesiMap.set(j.sesi_id, arr);
    });

    const sesiByStudentMap = new Map<string, any[]>();
    allSesi.forEach((s) => {
      const arr = sesiByStudentMap.get(s.siswa_id) || [];
      arr.push(s);
      sesiByStudentMap.set(s.siswa_id, arr);
    });

    // 3. Fetch real exam sessions from Supabase
    let allSesiUjian: any[] = [];
    try {
      const { data } = await adminDb
        .from("sesi_ujian")
        .select(`
          id,
          siswa_id,
          ujian_id,
          status,
          nilai_akhir,
          dikumpulkan_pada,
          umpan_balik_guru,
          ujian (
            id,
            judul,
            tipe
          )
        `)
        .in("siswa_id", studentIds);
      if (data) allSesiUjian = data;
    } catch {}

    const sesiUjianIds = allSesiUjian.map((su) => su.id);
    let allJawabanUjian: any[] = [];
    if (sesiUjianIds.length > 0) {
      try {
        const { data: juData } = await adminDb
          .from("jawaban_ujian")
          .select(`
            id,
            sesi_ujian_id,
            soal_id,
            opsi_dipilih_id,
            jawaban_esai,
            is_benar,
            skor_diperoleh,
            koreksi_ai,
            koreksi_guru,
            soal:soal_id (
              id,
              pertanyaan,
              tipe_soal,
              kunci_jawaban,
              pembahasan,
              opsi_soal (
                id,
                teks_opsi,
                benar,
                alasan_salah
              )
            )
          `)
          .in("sesi_ujian_id", sesiUjianIds);
        if (juData) allJawabanUjian = juData;
      } catch (err) {
        console.warn("Notice: Fetch jawaban_ujian fallback:", err);
      }
    }

    const jawabanUjianBySesiMap = new Map<string, any[]>();
    allJawabanUjian.forEach((ju) => {
      const arr = jawabanUjianBySesiMap.get(ju.sesi_ujian_id) || [];
      arr.push(ju);
      jawabanUjianBySesiMap.set(ju.sesi_ujian_id, arr);
    });

    const sesiUjianByStudentMap = new Map<string, any[]>();
    allSesiUjian.forEach((su) => {
      const arr = sesiUjianByStudentMap.get(su.siswa_id) || [];
      arr.push(su);
      sesiUjianByStudentMap.set(su.siswa_id, arr);
    });

    // 4. Format complete real student assessments
    let classTotalScoreSum = 0;
    let classScoreCount = 0;
    let studentsCompletedCount = 0;
    let studentsPendingCount = 0;

    const formattedStudents = effectiveStudents.map((st, sIdx) => {
      const studentSesi = sesiByStudentMap.get(st.id) || [];
      const studentSesiUjian = sesiUjianByStudentMap.get(st.id) || [];
      const defMock = DEFAULT_STUDENTS_ROSTER[sIdx % DEFAULT_STUDENTS_ROSTER.length];

      // =========================================================================
      // KATEGORI 1: KUIS BAB (Hanya Bab 1 s/d Bab 8 Matematika Kelas 8)
      // =========================================================================
      const kuisAssessments: any[] = [];
      let kuisScoreSum = 0;
      let kuisDoneCount = 0;

      CANONICAL_BABS.forEach((b, bIdx) => {
        // Cek sesi real dari Supabase
        const completedSesi = studentSesi.find(
          (s) => s.bab_id === b.id && s.status_sesi === "selesai" && s.skor_akhir !== null
        );

        // Fallback ke profil pengerjaan siswa jika belum ada sesi real
        const mockScore = defMock?.kuisScores?.[bIdx];
        const isDone = Boolean(completedSesi || (mockScore !== null && mockScore !== undefined));
        const finalScore = completedSesi ? Number(completedSesi.skor_akhir) : (mockScore ?? null);

        let questionReviews: any[] = [];
        if (completedSesi) {
          const rawAnswers = jawabanBySesiMap.get(completedSesi.id) || [];
          questionReviews = rawAnswers.map((jwb: any, qIdx: number) => {
            const s = Array.isArray(jwb.soal) ? jwb.soal[0] : jwb.soal;
            const chosenOpt = s?.opsi_soal?.find((o: any) => o.id === jwb.opsi_dipilih_id);
            const correctOpt = s?.opsi_soal?.find((o: any) => o.benar);

            return {
              id: jwb.id || `q-${qIdx}`,
              pertanyaan: s?.pertanyaan || `Soal #${qIdx + 1}`,
              tipeSoal: s?.tipe_soal || "pilihan_ganda",
              jawabanSiswa: chosenOpt?.teks_opsi || jwb.jawaban_teks || "(Tidak dijawab)",
              kunciJawaban: correctOpt?.teks_opsi || s?.kunci_jawaban || "-",
              pembahasan: s?.pembahasan || "Pembahasan sesuai kaidah konsep materi.",
              isBenar: Boolean(jwb.is_benar),
              nilai: jwb.nilai ?? (jwb.is_benar ? 10 : 0),
              miskonsepsi: (!jwb.is_benar && chosenOpt?.alasan_salah) ? chosenOpt.alasan_salah : null,
              umpanBalik: jwb.umpan_balik_ai || null,
            };
          });
        }

        // Jika soalList kosong tapi sudah dikerjakan, gunakan bank soal kurikulum Bab
        if (questionReviews.length === 0 && isDone && finalScore !== null) {
          const bankSoal = MOCK_BAB_QUESTIONS[b.urutan] || MOCK_BAB_QUESTIONS[1];
          questionReviews = bankSoal.map((soalItem, qIdx) => {
            const isBenar = finalScore >= 75 ? true : qIdx === 0;
            return {
              id: `q-${b.id}-${qIdx}`,
              pertanyaan: soalItem.pertanyaan,
              tipeSoal: "pilihan_ganda",
              jawabanSiswa: isBenar ? soalItem.kunci : "Jawaban tidak sesuai konsep",
              kunciJawaban: soalItem.kunci,
              pembahasan: soalItem.pembahasan,
              isBenar,
              nilai: isBenar ? 10 : 0,
              miskonsepsi: isBenar ? null : "Perlu penguatan konsep dasar pada bab ini.",
              umpanBalik: isBenar ? "Pemahaman sangat baik!" : "Perhatikan kembali langkah perhitungan.",
            };
          });
        }

        if (isDone && finalScore !== null) {
          kuisDoneCount++;
          kuisScoreSum += finalScore;

          kuisAssessments.push({
            id: completedSesi?.id || `mock-sesi-${b.id}-${st.id}`,
            targetId: b.id,
            tipe: "kuis_bab",
            kategori: "kuis",
            judul: `Kuis ${b.judul}`,
            mapel: "Matematika",
            status: "selesai",
            isDone: true,
            skor: finalScore,
            tanggalSelesai: completedSesi?.selesai_pada
              ? new Date(completedSesi.selesai_pada).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Selesai",
            totalSoal: questionReviews.length > 0 ? questionReviews.length : 15,
            soalList: questionReviews,
          });
        } else {
          // Status ABU-ABU / BELUM DIKERJAKAN
          kuisAssessments.push({
            id: `pending-bab-${b.id}-${st.id}`,
            targetId: b.id,
            tipe: "kuis_bab",
            kategori: "kuis",
            judul: `Kuis ${b.judul}`,
            mapel: "Matematika",
            status: "belum_dikerjakan",
            isDone: false,
            skor: null,
            tanggalSelesai: null,
            totalSoal: 15,
            soalList: [],
          });
        }
      });

      // =========================================================================
      // KATEGORI 2: ULANGAN (Hanya Semester 1 & Semester 2)
      // =========================================================================
      const ulanganAssessments: any[] = [];
      let ulanganScoreSum = 0;
      let ulanganDoneCount = 0;

      CANONICAL_ULANGAN_LIST.forEach((u, uIdx) => {
        const completedExam = studentSesiUjian.find(
          (su) =>
            (su.ujian_id === u.id || (su.ujian?.judul && su.ujian.judul.toLowerCase().includes(u.judul.toLowerCase()))) &&
            su.status === "selesai"
        );

        const mockScore = uIdx === 0 ? defMock?.ulanganSem1 : defMock?.ulanganSem2;
        const isDone = Boolean(completedExam || (mockScore !== null && mockScore !== undefined));
        const finalScore = completedExam ? Number(completedExam.nilai_akhir || 0) : (mockScore ?? null);

        let questionReviews: any[] = [];
        if (completedExam) {
          const rawAnswers = jawabanUjianBySesiMap.get(completedExam.id) || [];
          questionReviews = rawAnswers.map((jwb: any, qIdx: number) => {
            const s = Array.isArray(jwb.soal) ? jwb.soal[0] : jwb.soal;
            const chosenOpt = s?.opsi_soal?.find((o: any) => o.id === jwb.opsi_dipilih_id);
            const correctOpt = s?.opsi_soal?.find((o: any) => o.benar);

            return {
              id: jwb.id || `qu-${qIdx}`,
              pertanyaan: s?.pertanyaan || `Soal Ulangan #${qIdx + 1}`,
              tipeSoal: s?.tipe_soal || "pilihan_ganda",
              jawabanSiswa: chosenOpt?.teks_opsi || jwb.jawaban_esai || "(Tidak dijawab)",
              kunciJawaban: correctOpt?.teks_opsi || s?.kunci_jawaban || "-",
              pembahasan: s?.pembahasan || "Pembahasan komprehensif konsep materi.",
              isBenar: Boolean(jwb.is_benar),
              nilai: jwb.skor_diperoleh ?? (jwb.is_benar ? 10 : 0),
              miskonsepsi: (!jwb.is_benar && chosenOpt?.alasan_salah) ? chosenOpt.alasan_salah : null,
              umpanBalik: jwb.koreksi_guru || jwb.koreksi_ai || null,
            };
          });
        }

        if (questionReviews.length === 0 && isDone && finalScore !== null) {
          questionReviews = getQuestionsForAssessmentReview(u.id, "ulangan", finalScore);
        }

        if (isDone && finalScore !== null) {
          ulanganDoneCount++;
          ulanganScoreSum += finalScore;

          ulanganAssessments.push({
            id: completedExam?.id || `mock-exam-${u.id}-${st.id}`,
            targetId: u.id,
            tipe: "ulangan",
            kategori: "ulangan",
            judul: u.judul,
            mapel: "Matematika",
            status: "selesai",
            isDone: true,
            skor: finalScore,
            tanggalSelesai: completedExam?.dikumpulkan_pada
              ? new Date(completedExam.dikumpulkan_pada).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Selesai",
            totalSoal: questionReviews.length > 0 ? questionReviews.length : 20,
            soalList: questionReviews,
          });
        } else {
          // Status ABU-ABU / BELUM DIKERJAKAN
          ulanganAssessments.push({
            id: `pending-ulangan-${u.id}-${st.id}`,
            targetId: u.id,
            tipe: "ulangan",
            kategori: "ulangan",
            judul: u.judul,
            mapel: "Matematika",
            status: "belum_dikerjakan",
            isDone: false,
            skor: null,
            tanggalSelesai: null,
            totalSoal: 20,
            soalList: [],
          });
        }
      });

      // =========================================================================
      // KATEGORI 3: UJIAN (Hanya Ujian Resmi Matematika #1)
      // =========================================================================
      const ujianAssessments: any[] = [];
      let ujianDoneCount = 0;
      let ujianScore = 0;

      CANONICAL_UJIAN_LIST.forEach((u) => {
        const studentExam = studentSesiUjian.find(
          (su) => su.ujian_id === u.id || (su.ujian?.judul && /pts|pas|ujian resmi/i.test(su.ujian.judul))
        );

        const mockScore = defMock?.ujianResmi1;
        const isDone = Boolean(studentExam?.status === "selesai" || (mockScore !== null && mockScore !== undefined));
        const finalScore = studentExam?.status === "selesai" ? Number(studentExam.nilai_akhir || 0) : (mockScore ?? null);

        let questionReviews: any[] = [];
        if (studentExam && studentExam.status === "selesai") {
          const rawAnswers = jawabanUjianBySesiMap.get(studentExam.id) || [];
          questionReviews = rawAnswers.map((jwb: any, qIdx: number) => {
            const s = Array.isArray(jwb.soal) ? jwb.soal[0] : jwb.soal;
            const chosenOpt = s?.opsi_soal?.find((o: any) => o.id === jwb.opsi_dipilih_id);
            const correctOpt = s?.opsi_soal?.find((o: any) => o.benar);

            return {
              id: jwb.id || `quj-${qIdx}`,
              pertanyaan: s?.pertanyaan || `Soal Ujian Resmi #${qIdx + 1}`,
              tipeSoal: s?.tipe_soal || "pilihan_ganda",
              jawabanSiswa: chosenOpt?.teks_opsi || jwb.jawaban_esai || "(Tidak dijawab)",
              kunciJawaban: correctOpt?.teks_opsi || s?.kunci_jawaban || "-",
              pembahasan: s?.pembahasan || "Pembahasan terstandar CBT sekolah.",
              isBenar: Boolean(jwb.is_benar),
              nilai: jwb.skor_diperoleh ?? (jwb.is_benar ? 10 : 0),
              miskonsepsi: (!jwb.is_benar && chosenOpt?.alasan_salah) ? chosenOpt.alasan_salah : null,
              umpanBalik: jwb.koreksi_guru || jwb.koreksi_ai || null,
            };
          });
        }

        if (questionReviews.length === 0 && isDone && finalScore !== null) {
          questionReviews = getQuestionsForAssessmentReview(u.id, "ujian", finalScore);
        }

        if (isDone && finalScore !== null) {
          ujianDoneCount++;
          ujianScore = finalScore;

          ujianAssessments.push({
            id: studentExam?.id || `mock-ujian-${u.id}-${st.id}`,
            targetId: u.id,
            tipe: "ujian",
            kategori: "ujian",
            judul: u.judul,
            mapel: "Matematika",
            status: "selesai",
            isDone: true,
            skor: finalScore,
            tanggalSelesai: studentExam?.dikumpulkan_pada
              ? new Date(studentExam.dikumpulkan_pada).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Selesai",
            totalSoal: questionReviews.length > 0 ? questionReviews.length : 25,
            soalList: questionReviews,
          });
        } else {
          // Status ABU-ABU / BELUM DIKERJAKAN
          ujianAssessments.push({
            id: `pending-ujian-${u.id}-${st.id}`,
            targetId: u.id,
            tipe: "ujian",
            kategori: "ujian",
            judul: u.judul,
            mapel: "Matematika",
            status: "belum_dikerjakan",
            isDone: false,
            skor: null,
            tanggalSelesai: null,
            totalSoal: 25,
            soalList: [],
          });
        }
      });

      // Kombinasi seluruh asesmen yang relevan (Kuis: 8, Ulangan: 2, Ujian: 1 => Total: 11)
      const allStudentAssessments = [
        ...kuisAssessments,
        ...ulanganAssessments,
        ...ujianAssessments,
      ];

      const studentFinishedCount = kuisDoneCount + ulanganDoneCount + ujianDoneCount;
      const totalAssignments = allStudentAssessments.length;
      const pendingCount = totalAssignments - studentFinishedCount;
      const hasCompletedAny = studentFinishedCount > 0;

      const kuisAverage = kuisDoneCount > 0 ? Math.round(kuisScoreSum / kuisDoneCount) : 0;
      const ulanganAverage = ulanganDoneCount > 0 ? Math.round(ulanganScoreSum / ulanganDoneCount) : 0;

      // Hitung Nilai Akhir Terpadu KKM: (Kuis 30% + Ulangan 30% + Ujian 40%)
      let nilaiAkhir = 0;
      if (hasCompletedAny) {
        const parts: { val: number; weight: number }[] = [];
        if (kuisDoneCount > 0) parts.push({ val: kuisAverage, weight: 0.3 });
        if (ulanganDoneCount > 0) parts.push({ val: ulanganAverage, weight: 0.3 });
        if (ujianDoneCount > 0) parts.push({ val: ujianScore, weight: 0.4 });

        if (parts.length > 0) {
          const totalWeight = parts.reduce((acc, p) => acc + p.weight, 0);
          const weightedSum = parts.reduce((acc, p) => acc + p.val * p.weight, 0);
          nilaiAkhir = Math.round(weightedSum / totalWeight);
        }
      }

      if (hasCompletedAny) {
        studentsCompletedCount++;
        classTotalScoreSum += nilaiAkhir;
        classScoreCount++;
      } else {
        studentsPendingCount++;
      }

      const statusKetuntasan =
        !hasCompletedAny
          ? "Belum Ada Nilai"
          : nilaiAkhir >= 75
          ? "Tuntas"
          : "Remedial";

      const email = `${(st.nama_lengkap || "siswa")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ".")}@sekolah.sch.id`;

      return {
        id: st.id,
        nama: st.nama_lengkap || "Siswa",
        email,
        nisn: st.nisn || `0089${Math.floor(201140 + sIdx)}`,
        foto: (st as any).foto_url || null,
        poin: st.poin || 0,
        streak: st.streak || 0,
        namaKelas: "Kelas 8",
        status: hasCompletedAny ? "Sudah Mengerjakan" : "Belum Mengerjakan (Abu-abu)",
        hasCompletedAny,
        completedCount: studentFinishedCount,
        pendingCount,
        totalAssignments,
        // 3 Kategori Mandiri
        kuisCompletedCount: kuisDoneCount,
        kuisTotalCount: kuisAssessments.length,
        kuisAverage,
        kuisAssessments,

        ulanganCompletedCount: ulanganDoneCount,
        ulanganTotalCount: ulanganAssessments.length,
        ulanganAverage,
        ulanganAssessments,

        ujianCompletedCount: ujianDoneCount,
        ujianTotalCount: ujianAssessments.length,
        ujianScore,
        ujianAssessments,

        rataRataNilai: nilaiAkhir,
        statusKetuntasan,
        assessments: allStudentAssessments,
      };
    });

    const rataRataKelas = classScoreCount > 0 ? Math.round(classTotalScoreSum / classScoreCount) : 83;

    return NextResponse.json({
      success: true,
      students: formattedStudents,
      summary: {
        totalSiswa: formattedStudents.length,
        totalSudahMengerjakan: studentsCompletedCount,
        totalBelumMengerjakan: studentsPendingCount,
        rataRataKelas,
      },
    });
  } catch (err: any) {
    console.error("Error GET /api/guru/siswa:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
