import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getExamPackage } from "@/lib/exam-questions-store";
import DaftarUjianClient from "./DaftarUjianClient";

export default async function DaftarUjianPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/masuk");
  }

  // 1. Ambil profil siswa
  const { data: profil } = await adminSupabase
    .from("profil")
    .select(`
      id,
      nama_lengkap,
      email,
      peran,
      poin,
      streak,
      nisn,
      nis,
      jurusan,
      tahun_ajaran,
      foto_url,
      sekolah_id,
      anggota_kelas (
        kelas (
          id,
          nama,
          tingkat
        )
      )
    `)
    .eq("id", user.id)
    .maybeSingle();

  const rawKelas = (profil as any)?.anggota_kelas?.[0]?.kelas;
  const userGrade = rawKelas?.tingkat || 8;
  const namaKelas = rawKelas?.nama || "Kelas 8A";

  // 2. Ambil data sekolah
  let sekolahData = null;
  if (profil?.sekolah_id) {
    const { data: sek } = await supabase
      .from("sekolah")
      .select("id, nama, motto, deskripsi, bg_image_url, links, alamat, npsn, jam_masuk, jam_terlambat, jam_tutup")
      .eq("id", profil.sekolah_id)
      .single();

    if (sek) {
      let parsedLinks = [];
      if (typeof sek.links === "string") {
        try {
          parsedLinks = JSON.parse(sek.links);
        } catch {}
      } else if (Array.isArray(sek.links)) {
        parsedLinks = sek.links;
      }

      sekolahData = {
        id: sek.id,
        nama: sek.nama,
        motto: sek.motto,
        deskripsi: sek.deskripsi,
        bg_image_url: sek.bg_image_url,
        links: parsedLinks,
        alamat: sek.alamat,
        npsn: sek.npsn,
        jam_masuk: sek.jam_masuk || "07:00:00",
        jam_terlambat: sek.jam_terlambat || "07:15:00",
        jam_tutup: sek.jam_tutup || "08:00:00",
      };
    }
  }

  if (!sekolahData) {
    sekolahData = {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      nama: "SMK Muhammadiyah Pakem",
      npsn: "20402099",
      alamat: "Jl. Pakem - Turi No.23, Area Sawah, Pakembinangun, Kec. Pakem, Kab. Sleman, D.I. Yogyakarta",
      motto: "Pusat Keunggulan & Pesantren Vokasi • Bahagia Bersama",
      deskripsi: "SMK Muhammadiyah Pakem (MUPA) merupakan Sekolah Pusat Keunggulan dan Sekolah yang mengusung konsep Pesantren Vokasi dengan jurusan unggulan berstandar industri dan teknologi modern.",
      bg_image_url: "/images/smk-muh-pakem.png",
      links: [
        { label: "Website Resmi", url: "https://smkmuhpakem.sch.id/#", icon: "Globe" },
        { label: "Portal SPMB", url: "https://smkmuhpakem.sch.id/ppdb/", icon: "ExternalLink" },
        { label: "Instagram", url: "https://www.instagram.com/smkmuhpakem/?hl=id", icon: "Instagram" },
      ],
      jam_masuk: "07:00:00",
      jam_terlambat: "07:15:00",
      jam_tutup: "08:00:00",
    };
  }

  // 3. Ambil data presensi hari ini (Asia/Jakarta)
  const todayWIB = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const { data: presensiToday } = await supabase
    .from("presensi")
    .select("waktu_masuk, status")
    .eq("siswa_id", user.id)
    .eq("tanggal", todayWIB)
    .maybeSingle();

  let isCheckedIn = false;
  let checkInTime: string | null = null;
  let checkInStatus: string | null = null;

  if (presensiToday) {
    isCheckedIn = true;
    checkInTime = new Date(presensiToday.waktu_masuk).toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
    });
    checkInStatus = presensiToday.status || "Hadir (Tepat Waktu)";
  }

  // 3b. Ambil data bab / kurikulum khusus Matematika Fase D SMP Kelas 8
  const DEFAULT_MATEMATIKA_BABS = [
    { id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", judul: "Bab 1: Pola Bilangan & Barisan Bilangan", deskripsi: "Pola aritmetika, geometri, konfigurasi objek, dan rumus suku ke-n.", urutan: 1, mapel: "Matematika", kelas: 8, semester: 1 },
    { id: "b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22", judul: "Bab 2: Bentuk Aljabar & PLSV/PTLSV", deskripsi: "Operasi aljabar, faktorisasi, persamaan & pertidaksamaan linear satu variabel.", urutan: 2, mapel: "Matematika", kelas: 8, semester: 1 },
    { id: "b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33", judul: "Bab 3: Relasi & Fungsi", deskripsi: "Diagram panah, himpunan pasangan berurutan, notasi f(x) = ax + b, dan domain/kodomain/range.", urutan: 3, mapel: "Matematika", kelas: 8, semester: 1 },
    { id: "b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44", judul: "Bab 4: Persamaan Garis Lurus (PGL)", deskripsi: "Gradien (kemiringan garis), titik potong sumbu, hubungan garis sejajar dan tegak lurus.", urutan: 4, mapel: "Matematika", kelas: 8, semester: 1 },
    { id: "b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55", judul: "Bab 5: Sistem Persamaan Linear Dua Variabel (SPLDV)", deskripsi: "Metode eliminasi, substitusi, grafik, dan pemodelan masalah belanja kontekstual.", urutan: 5, mapel: "Matematika", kelas: 8, semester: 1 },
    { id: "b6eebc99-9c0b-4ef8-bb6d-6bb9bd380a66", judul: "Bab 6: Teorema Pythagoras", deskripsi: "Hubungan kuadrat sisi segitiga siku-siku, tripel Pythagoras, dan segitiga istimewa sudut 30°-60°-90° & 45°-45°-90°.", urutan: 6, mapel: "Matematika", kelas: 8, semester: 2 },
    { id: "b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a77", judul: "Bab 7: Bangun Ruang Sisi Datar (BRSD)", deskripsi: "Kubus, balok, prisma, limas, luas jaring-jaring permukaan, volume dan diagonal ruang.", urutan: 7, mapel: "Matematika", kelas: 8, semester: 2 },
    { id: "b8eebc99-9c0b-4ef8-bb6d-6bb9bd380a88", judul: "Bab 8: Statistika & Peluang", deskripsi: "Ukuran pemusatan data (mean, median, modus), jangkauan interkuartil, diagram lingkaran & frekuensi relatif peluang empiris/teoretis.", urutan: 8, mapel: "Matematika", kelas: 8, semester: 2 },
  ];

  const { data: rawListBab } = await supabase
    .from("bab")
    .select(`
      id,
      judul,
      deskripsi,
      urutan,
      mapel,
      kelas,
      semester
    `)
    .order("urutan", { ascending: true });

  let listBab = (rawListBab || []).filter((b: any) => {
    const mapelLower = (b.mapel || "").toLowerCase();
    const isExplicitMath = mapelLower.includes("matematika") || mapelLower.includes("mtk") || !b.mapel;
    const isKelas8 = !b.kelas || Number(b.kelas) === 8;
    return isExplicitMath && isKelas8;
  });

  if (listBab.length === 0) {
    listBab = DEFAULT_MATEMATIKA_BABS;
  }

  // 4. Ambil daftar ujian aktif khusus Matematika
  let query = adminSupabase
    .from("ujian")
    .select(`
      id,
      judul,
      deskripsi,
      mapel,
      tipe,
      durasi_menit,
      passing_grade,
      waktu_mulai,
      waktu_berakhir,
      status,
      token,
      bab_id,
      dibuat_pada
    `)
    .in("status", ["dipublikasi", "ditutup"])
    .order("dibuat_pada", { ascending: false });

  if (profil?.sekolah_id) {
    query = query.or(`sekolah_id.eq.${profil.sekolah_id},sekolah_id.eq.a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11,sekolah_id.is.null`);
  }

  const { data: rawExams } = await query;

  // 5. Ambil riwayat sesi_ujian siswa
  const userSessions: Record<string, any> = {};
  const { data: sesiList } = await adminSupabase
    .from("sesi_ujian")
    .select("id, ujian_id, status, nilai_akhir, server_start_time, server_end_time")
    .eq("siswa_id", user.id);

  if (sesiList) {
    sesiList.forEach((s) => {
      userSessions[s.ujian_id] = s;
    });
  }

  const p1 = getExamPackage("u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
  const p2 = getExamPackage("u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22");
  const p3 = getExamPackage("e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55");

  const CANONICAL_EXAMS_MAP: Record<string, any> = {
    "u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11": {
      id: "u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      judul: "Ulangan Matematika Semester 1",
      deskripsi:
        "Evaluasi formatif komprehensif Matematika Semester 1 mencakup Bab 1 sampai Bab 4 (Pola Bilangan, Bentuk Aljabar, Relasi & Fungsi, Persamaan Garis Lurus).",
      mapel: "Matematika",
      tipe: "ulangan" as const,
      durasi_menit: p1?.durasi_menit || 60,
      passing_grade: p1?.passing_grade || 75,
      status: p1?.status || "dipublikasi",
      token: p1?.token || "MTK-SEM1",
      bab_id: null,
      isKeseluruhanBab: true,
      isPerBab: false,
    },
    "u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22": {
      id: "u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      judul: "Ulangan Matematika Semester 2",
      deskripsi:
        "Evaluasi formatif komprehensif Matematika Semester 2 mencakup Bab 5 sampai Bab 8 (SPLDV, Teorema Pythagoras, Bangun Ruang Sisi Datar, Statistika & Peluang).",
      mapel: "Matematika",
      tipe: "ulangan" as const,
      durasi_menit: p2?.durasi_menit || 60,
      passing_grade: p2?.passing_grade || 75,
      status: p2?.status || "dipublikasi",
      token: p2?.token || "MTK-SEM2",
      bab_id: null,
      isKeseluruhanBab: true,
      isPerBab: false,
    },
    "e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55": {
      id: "e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
      judul: "Ujian Resmi Matematika #1",
      deskripsi:
        "Asesmen sumatif resmi terstandar CBT Matematika Kelas 8 (Part 1 - Semester 1) materi Aljabar, Teorema Pythagoras, dan Relasi Fungsi.",
      mapel: "Matematika",
      tipe: "ujian" as const,
      durasi_menit: p3?.durasi_menit || 90,
      passing_grade: p3?.passing_grade || 75,
      status: p3?.status || "dipublikasi",
      token: p3?.token || "MTK-PTS26",
      bab_id: null,
      isKeseluruhanBab: false,
      isPerBab: false,
    },
  };

  // Background sync canonical exams to DB if needed
  try {
    adminSupabase
      .from("ujian")
      .upsert([
        {
          id: "u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          judul: "Ulangan Matematika Semester 1",
          deskripsi: "Evaluasi formatif komprehensif Matematika Semester 1 mencakup Bab 1 sampai Bab 4 (Pola Bilangan, Bentuk Aljabar, Relasi & Fungsi, Persamaan Garis Lurus).",
          mapel: "Matematika",
          tipe: "ulangan",
          durasi_menit: p1?.durasi_menit || 60,
          passing_grade: p1?.passing_grade || 75,
          status: p1?.status || "dipublikasi",
          token: p1?.token || "MTK-SEM1",
        },
        {
          id: "u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
          judul: "Ulangan Matematika Semester 2",
          deskripsi: "Evaluasi formatif komprehensif Matematika Semester 2 mencakup Bab 5 sampai Bab 8 (SPLDV, Teorema Pythagoras, Bangun Ruang Sisi Datar, Statistika & Peluang).",
          mapel: "Matematika",
          tipe: "ulangan",
          durasi_menit: p2?.durasi_menit || 60,
          passing_grade: p2?.passing_grade || 75,
          status: p2?.status || "dipublikasi",
          token: p2?.token || "MTK-SEM2",
        },
        {
          id: "e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
          judul: "Ujian Resmi Matematika #1",
          deskripsi: "Asesmen sumatif resmi terstandar CBT Matematika Kelas 8 (Part 1 - Semester 1) materi Aljabar, Teorema Pythagoras, dan Relasi Fungsi.",
          mapel: "Matematika",
          tipe: "ujian",
          durasi_menit: p3?.durasi_menit || 90,
          passing_grade: p3?.passing_grade || 75,
          status: p3?.status || "dipublikasi",
          token: p3?.token || "MTK-PTS26",
        },
      ])
      .then(() => {});
  } catch {}

  const filteredMathExams = (rawExams || []).filter((u) => {
    // Jika siswa dihapus/dikeluarkan oleh guru dari ujian ini, sembunyikan kartu
    if (u.deskripsi && user?.id) {
      const match = u.deskripsi.match(/<!-- EXAM_ROSTER:(.*?) -->/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          if (Array.isArray(parsed.excluded) && parsed.excluded.includes(user.id)) {
            return false;
          }
        } catch {}
      }
    }

    const m = (u.mapel || "").toLowerCase();
    const j = (u.judul || "").toLowerCase();
    const isOther =
      m.includes("ipa") ||
      m.includes("inggris") ||
      m.includes("indonesia") ||
      m.includes("ips") ||
      m.includes("agama") ||
      m.includes("pjok") ||
      m.includes("seni") ||
      m.includes("karakter") ||
      m.includes("literasi") ||
      m.includes("logika") ||
      j.includes("survei karakter") ||
      j.includes("literasi membaca") ||
      j.includes("numerasi bernalar") ||
      u.tipe === "simulasi";
    return !isOther;
  });

  // Gabungkan dengan canonical semester exams agar selalu tepat 2 card Ulangan + 1 card Ujian Resmi Matematika #1
  const examMap = new Map<string, any>();

  // Masukkan default canonical terlebih dahulu
  Object.values(CANONICAL_EXAMS_MAP).forEach((item) => {
    examMap.set(item.id, item);
  });

  // Timpa dengan data dari database jika ada
  filteredMathExams.forEach((u) => {
    const isOfficial =
      u.tipe === "ujian" ||
      u.id === "e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55" ||
      /pts|pas|ujian resmi/i.test(u.judul || "");

    const calculatedTipe: "ulangan" | "ujian" = isOfficial ? "ujian" : "ulangan";
    const judul = isOfficial ? "Ujian Resmi Matematika #1" : u.judul;

    const isPerBab = calculatedTipe === "ulangan" && (Boolean(u.bab_id) || /bab\s*\d+/i.test(u.judul || ""));
    const isKeseluruhanBab = calculatedTipe === "ulangan" && !isPerBab;
    const localPkg = getExamPackage(u.id);

    examMap.set(u.id, {
      ...u,
      judul,
      tipe: calculatedTipe,
      isPerBab,
      isKeseluruhanBab,
      status: localPkg?.status || u.status || "dipublikasi",
      durasi_menit: localPkg?.durasi_menit || u.durasi_menit || (isOfficial ? 90 : 60),
      passing_grade: localPkg?.passing_grade || u.passing_grade || 75,
    });
  });

  const exams = Array.from(examMap.values())
    .filter((u) => u.status !== "draft")
    .map((u) => {
    const sesi = userSessions[u.id];
    let sessionStatus = "belum_mulai";
    let score = null;

    if (sesi) {
      sessionStatus = sesi.status;
      score = sesi.nilai_akhir;
    }

    const calculatedTipe: "ulangan" | "ujian" = u.tipe || "ulangan";

    // Jika ini adalah ujian resmi dan status sesi masih 'sedang_mengerjakan' padahal siswa sedang berada di luar ruang ujian
    // (misalnya siswa navigasi kembali, keluar tab, dsb), otomatis kunci status sesi di database
    if (calculatedTipe === "ujian" && sessionStatus === "sedang_mengerjakan" && sesi?.id) {
      sessionStatus = "terkunci";
      adminSupabase
        .from("sesi_ujian")
        .update({ status: "terkunci" })
        .eq("id", sesi.id)
        .then(() => {});
    }

    return {
      id: u.id,
      judul: u.judul,
      deskripsi: u.deskripsi,
      mapel: u.mapel || "Matematika",
      tipe: calculatedTipe,
      bab_id: u.bab_id || null,
      isPerBab: Boolean(u.isPerBab),
      isKeseluruhanBab: Boolean(u.isKeseluruhanBab),
      durasi_menit: u.durasi_menit || 60,
      passing_grade: u.passing_grade || 75,
      sessionStatus,
      score,
      sesiId: sesi?.id,
      status: u.status || "dipublikasi",
      hasToken: Boolean(u.token),
    };
  });

  return (
    <DaftarUjianClient
      userProfile={{
        nama_lengkap: profil?.nama_lengkap || "Siswa THINKSY",
        email: profil?.email || user.email || "",
        peran: "siswa",
        poin: profil?.poin || 0,
        streak: profil?.streak || 0,
        rank: 1,
        totalStudents: 1,
        isCheckedIn,
        checkInTime,
        checkInStatus,
        tingkat_kelas: userGrade,
        nama_kelas: namaKelas,
        nisn: profil?.nisn || "0089247182",
        nis: profil?.nis || "260481",
        jurusan: profil?.jurusan || "Teknik Komputer & Jaringan",
        tahun_ajaran: profil?.tahun_ajaran || "2026/2027",
        foto_url: profil?.foto_url || null,
      }}
      sekolahData={sekolahData}
      exams={exams}
      chapters={listBab || []}
    />
  );
}
