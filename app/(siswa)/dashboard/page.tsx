import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import StudentDashboardClient from "./StudentDashboardClient";
import { normalizeMapel } from "@/lib/mapel";
import { isClassDeleted, isClassArchived } from "@/lib/shared-classes";
import { StudentDashboardProps, SekolahData, PeerStudent, ClassroomCardItem } from "./types";

export default async function SiswaDashboardPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Default User Profile
  let userProfile: StudentDashboardProps["userProfile"] = {
    id: undefined,
    nama_lengkap: "Budi Kartika",
    email: "budi.kartika@sekolah.sch.id",
    peran: "siswa",
    poin: 0,
    streak: 0,
    rank: 3,
    totalStudents: 120,
    isCheckedIn: false,
    checkInTime: null,
    checkInStatus: null,
    tingkat_kelas: 8,
    nama_kelas: "Kelas 8",
    nisn: "0089247182",
    nis: "260481",
    jurusan: "Fase D (Kurikulum Merdeka)",
    tahun_ajaran: "2026/2027",
    foto_url: null,
  };

  let completedQuizCount = 0;
  let answeredSoalCount = 0;
  let totalSoalCount = 0;
  let learningProgressPercent = 0;

  let sekolahData: SekolahData | null = null;

  let peerStudents: Array<{
    id: string;
    name: string;
    avatarUrl?: string | null;
    initials: string;
  }> = [];

  if (user) {
    // Get user profile data
    const { data: profil } = await supabase
      .from("profil")
      .select("id, nama_lengkap, peran, poin, streak, sekolah_id, nisn, nis, jurusan, tahun_ajaran, foto_url, jenis_kelamin, tempat_lahir, tanggal_lahir")
      .eq("id", user.id)
      .single();

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
          } catch { }
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

    const currentPoin = profil?.poin ?? 0;
    const currentStreak = profil?.streak ?? 0;

    // Calculate completed quiz count (sesi kuis/latihan mandiri)
    const { count: quizDoneCount } = await adminSupabase
      .from("sesi")
      .select("id", { count: "exact", head: true })
      .eq("siswa_id", user.id)
      .eq("status_sesi", "selesai");

    completedQuizCount = quizDoneCount || 0;

    // Calculate dynamic student rank among ALL users with peran = 'siswa' sorted by learning points
    let { data: allStudents } = await adminSupabase
      .from("profil")
      .select("id, nama_lengkap, poin")
      .eq("peran", "siswa")
      .order("poin", { ascending: false })
      .order("dibuat_pada", { ascending: true });

    if (!allStudents || allStudents.length <= 1) {
      const fallbackAll = await supabase
        .from("profil")
        .select("id, nama_lengkap, poin")
        .eq("peran", "siswa")
        .order("poin", { ascending: false })
        .order("dibuat_pada", { ascending: true });

      if (fallbackAll.data && fallbackAll.data.length > 0) {
        allStudents = fallbackAll.data;
      }
    }

    const totalSiswaCount = allStudents?.length || 1;
    const studentIndex = allStudents?.findIndex((s) => s.id === user.id) ?? -1;
    const studentRank = studentIndex >= 0 ? studentIndex + 1 : 1;

    // Fetch peer students in same school for class avatar badges
    let peersQuery = adminSupabase
      .from("profil")
      .select("id, nama_lengkap")
      .eq("peran", "siswa");

    if (profil?.sekolah_id) {
      peersQuery = peersQuery.eq("sekolah_id", profil.sekolah_id);
    }

    const { data: rawPeers } = await peersQuery.limit(20);

    if (rawPeers && rawPeers.length > 0) {
      peerStudents = rawPeers.map((p) => {
        const parts = (p.nama_lengkap || "Siswa").trim().split(" ");
        const initials =
          parts.length >= 2
            ? (parts[0][0] + parts[1][0]).toUpperCase()
            : (parts[0][0] || "S").toUpperCase();

        return {
          id: p.id,
          name: p.nama_lengkap || "Siswa",
          avatarUrl: null,
          initials,
        };
      });
    }

    // Calculate overall Learning Progress
    const { count: dbTotalSoal } = await supabase
      .from("soal_publik")
      .select("id", { count: "exact", head: true });

    totalSoalCount = dbTotalSoal || 10;

    const { data: answeredRows } = await adminSupabase
      .from("jawaban")
      .select("soal_id, sesi!inner(siswa_id)")
      .eq("sesi.siswa_id", user.id);

    const { data: answeredUjianRows } = await adminSupabase
      .from("jawaban_ujian")
      .select("soal_id, sesi_ujian!inner(siswa_id)")
      .eq("sesi_ujian.siswa_id", user.id);

    const answeredSet = new Set<string>();
    answeredRows?.forEach((r: any) => {
      if (r.soal_id) answeredSet.add(r.soal_id);
    });
    answeredUjianRows?.forEach((r: any) => {
      if (r.soal_id) answeredSet.add(r.soal_id);
    });
    answeredSoalCount = answeredSet.size;

    if (totalSoalCount > 0) {
      learningProgressPercent = Math.min(
        100,
        Math.round((answeredSoalCount / totalSoalCount) * 100)
      );
    }

    // Check today's attendance status in WIB timezone (Asia/Jakarta)
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
    let checkInTime = null;
    let checkInStatus = null;

    if (presensiToday) {
      isCheckedIn = true;
      checkInTime = new Date(presensiToday.waktu_masuk).toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
      });
      checkInStatus = presensiToday.status || "Hadir (Tepat Waktu)";
    }

    // Check student's enrolled class level
    let userTingkatKelas = 8; // Default SMP Kelas 8
    let userNamaKelas = "Kelas 8";

    const { data: memberKelas } = await adminSupabase
      .from("anggota_kelas")
      .select("kelas ( id, nama_kelas )")
      .eq("siswa_id", user.id)
      .maybeSingle();

    if (memberKelas?.kelas) {
      const namaK = (memberKelas.kelas as any).nama_kelas || "";
      if (namaK) {
        userNamaKelas = namaK;
        if (/\b7\b|VII|Kelas\s*7/i.test(namaK)) {
          userTingkatKelas = 7;
        } else if (/\b8\b|VIII|Kelas\s*8/i.test(namaK)) {
          userTingkatKelas = 8;
        } else if (/\b9\b|IX|Kelas\s*9/i.test(namaK)) {
          userTingkatKelas = 9;
        }
      }
    }

    const userJenisKelamin =
      profil?.jenis_kelamin ||
      (user.user_metadata?.jenis_kelamin as string) ||
      "Laki-laki";

    const tempatLahir =
      profil?.tempat_lahir ||
      (user.user_metadata?.tempat_lahir as string) ||
      "Gunungkidul";
    const tglLahir =
      profil?.tanggal_lahir ||
      (user.user_metadata?.tanggal_lahir as string) ||
      "12 Agustus 2010";
    const tempatTglLahir = `${tempatLahir}, ${tglLahir}`;

    const defaultFotoByGender =
      userJenisKelamin === "Perempuan"
        ? "/images/pasfoto-siswi-1.jpg"
        : "/images/pasfoto-siswa-1.jpg";

    userProfile = {
      id: user.id,
      nama_lengkap:
        profil?.nama_lengkap ||
        (user.user_metadata?.nama_lengkap as string) ||
        user.email?.split("@")[0] ||
        "Siswa Thinksy",
      email: user.email || "budi.kartika@sekolah.sch.id",
      peran: profil?.peran || "siswa",
      poin: currentPoin,
      streak: currentStreak,
      rank: studentRank,
      totalStudents: totalSiswaCount,
      isCheckedIn,
      checkInTime,
      checkInStatus,
      tingkat_kelas: userTingkatKelas,
      nama_kelas: userNamaKelas,
      nisn: profil?.nisn || (user.user_metadata?.nisn as string) || "0089247182",
      nis: profil?.nis || (user.user_metadata?.nis as string) || "260481",
      jurusan: profil?.jurusan || "Fase D (Kurikulum Merdeka)",
      tahun_ajaran: profil?.tahun_ajaran || "2026/2027",
      foto_url: profil?.foto_url || (user.user_metadata?.foto_url as string) || defaultFotoByGender,
      jenis_kelamin: userJenisKelamin,
      tempat_tgl_lahir: tempatTglLahir,
    };
  }

  // 2. Fetch Jadwal Kelas Pelajaran Mingguan
  let schedules = [
    { id: "s1", subject: "Matematika", teacher: "Ibu Siti Rahmawati, M.Pd.", day: "Senin", time: "08:00 - 09:30 WIB", room: "Ruang 8A" },
    { id: "s2", subject: "Bahasa Inggris", teacher: "Budi Santoso, S.Pd.", day: "Rabu", time: "10:00 - 11:30 WIB", room: "Ruang 8A" },
    { id: "s3", subject: "Bahasa Indonesia", teacher: "Dra. Nurul Hidayah", day: "Jumat", time: "08:00 - 09:30 WIB", room: "Lab Bahasa" },
  ];

  const { data: dbSchedules } = await supabase
    .from("jadwal_kelas")
    .select("*")
    .order("urutan", { ascending: true });

  if (dbSchedules && dbSchedules.length > 0) {
    schedules = dbSchedules.map((s) => ({
      id: s.id,
      subject: s.mata_pelajaran,
      teacher: s.nama_guru,
      day: s.hari,
      time: `${s.jam_mulai.substring(0, 5)} - ${s.jam_selesai.substring(0, 5)} WIB`,
      room: s.ruangan,
    }));
  }

  // 3. Fetch List of Chapters (Bab) with Semester and Compute Real Progress
  const { data: rawListBab } = await supabase
    .from("bab")
    .select(
      `
      id,
      judul,
      deskripsi,
      urutan,
      mapel,
      kelas,
      semester,
      materi (
        id,
        judul,
        urutan
      )
    `
    )
    .order("urutan", { ascending: true });

  // Filter strictly for Matematika SMP Kelas 8 Fase D per Modul Kerja
  const listBab = (rawListBab || []).filter((b: any) => {
    const mapelLower = (b.mapel || "").toLowerCase();
    const judulLower = (b.judul || "").toLowerCase();
    const isExplicitMath = mapelLower.includes("matematika") || mapelLower.includes("mtk") || !b.mapel;
    const isOtherSubject =
      mapelLower.includes("indonesia") ||
      mapelLower.includes("inggris") ||
      mapelLower.includes("ipa") ||
      mapelLower.includes("ips") ||
      mapelLower.includes("seni") ||
      mapelLower.includes("pjok") ||
      mapelLower.includes("agama") ||
      mapelLower.includes("pancasila") ||
      mapelLower.includes("informatika") ||
      judulLower.includes("observasi") ||
      judulLower.includes("puisi") ||
      judulLower.includes("surat") ||
      judulLower.includes("pidato") ||
      judulLower.includes("iklan");
    const isKelas8 = !b.kelas || Number(b.kelas) === 8;
    return isExplicitMath && !isOtherSubject && isKelas8;
  });

  // Fetch all questions per chapter to compute accurate per-chapter progress
  let chaptersWithProgress: Array<{
    id: string;
    judul: string;
    deskripsi: string | null;
    urutan: number;
    mapel?: string | null;
    kelas?: number | null;
    semester?: number | null;
    progress: number;
    materi?: Array<{ id: string; judul: string; urutan: number }>;
  }> = [];

  if (listBab && listBab.length > 0) {
    const { data: allQuestions } = await supabase
      .from("soal_publik")
      .select("id, bab_id");

    const questionsByBab = new Map<string, string[]>();
    allQuestions?.forEach((q) => {
      if (q.bab_id) {
        const arr = questionsByBab.get(q.bab_id) || [];
        arr.push(q.id);
        questionsByBab.set(q.bab_id, arr);
      }
    });

    let studentAnsweredIds = new Set<string>();
    if (user) {
      const { data: userAnswers } = await adminSupabase
        .from("jawaban")
        .select("soal_id, sesi!inner(siswa_id)")
        .eq("sesi.siswa_id", user.id);

      studentAnsweredIds = new Set(userAnswers?.map((a: any) => a.soal_id));
    }

    chaptersWithProgress = listBab.map((ch: any) => {
      const babQuestionIds = questionsByBab.get(ch.id) || [];
      const totalQ = babQuestionIds.length;
      const answeredQ = babQuestionIds.filter((qId) => studentAnsweredIds.has(qId)).length;
      const progress = totalQ > 0 ? Math.min(100, Math.round((answeredQ / totalQ) * 100)) : 0;

      return {
        id: ch.id,
        judul: ch.judul,
        deskripsi: ch.deskripsi,
        urutan: ch.urutan || 1,
        mapel: normalizeMapel(ch.mapel),
        kelas: ch.kelas || 8,
        semester: ch.semester || (ch.urutan <= 3 ? 1 : 2),
        progress,
        materi: ch.materi,
      };
    });
  }

  // 4. Fetch Agenda Akademik Kalender dari Supabase
  let agendasData: any[] = [];
  const { data: dbAgendas } = await supabase
    .from("agenda_akademik")
    .select("*")
    .order("tanggal", { ascending: true });

  if (dbAgendas) {
    agendasData = dbAgendas.map((a: any) => ({
      id: a.id,
      judul: a.judul,
      deskripsi: a.deskripsi,
      kategori: a.kategori || "agenda",
      tanggal: a.tanggal,
      jam_mulai: a.jam_mulai,
      jam_selesai: a.jam_selesai,
      lokasi: a.lokasi,
    }));
  }

  // 5. Ujian & Ulangan terintegrasi real-time dari database ujian
  let examsData: any[] = [];
  try {
    let examQuery = adminSupabase
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

    if (sekolahData?.id) {
      examQuery = examQuery.or(`sekolah_id.eq.${sekolahData.id},sekolah_id.eq.a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11,sekolah_id.is.null`);
    }

    const { data: rawExams } = await examQuery;

    // Ambil riwayat sesi_ujian siswa
    const userSessionMap = new Map<string, any>();
    if (user?.id) {
      const { data: userExamsSessions } = await adminSupabase
        .from("sesi_ujian")
        .select("id, ujian_id, status, nilai_akhir")
        .eq("siswa_id", user.id);

      (userExamsSessions || []).forEach((s) => {
        userSessionMap.set(s.ujian_id, s);
      });
    }

    const validMathExams = (rawExams || []).filter((u) => {
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

    const CANONICAL_EXAMS_MAP: Record<string, any> = {
      "u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11": {
        id: "u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        judul: "Ulangan Matematika Semester 1",
        deskripsi:
          "Evaluasi formatif komprehensif Matematika Semester 1 mencakup Bab 1 sampai Bab 4 (Pola Bilangan, Bentuk Aljabar, Relasi & Fungsi, Persamaan Garis Lurus).",
        mapel: "Matematika",
        tipe: "ulangan" as const,
        durasi_menit: 60,
        passing_grade: 75,
        status: "dipublikasi",
        token: "MTK-SEM1",
        bab_id: null,
      },
      "u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22": {
        id: "u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        judul: "Ulangan Matematika Semester 2",
        deskripsi:
          "Evaluasi formatif komprehensif Matematika Semester 2 mencakup Bab 5 sampai Bab 8 (SPLDV, Teorema Pythagoras, Bangun Ruang Sisi Datar, Statistika & Peluang).",
        mapel: "Matematika",
        tipe: "ulangan" as const,
        durasi_menit: 60,
        passing_grade: 75,
        status: "dipublikasi",
        token: "MTK-SEM2",
        bab_id: null,
      },
      "e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55": {
        id: "e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
        judul: "Ujian Resmi Matematika #1",
        deskripsi:
          "Asesmen sumatif resmi terstandar CBT Matematika Kelas 8 (Part 1 - Semester 1) materi Aljabar, Teorema Pythagoras, dan Relasi Fungsi.",
        mapel: "Matematika",
        tipe: "ujian" as const,
        durasi_menit: 90,
        passing_grade: 75,
        status: "dipublikasi",
        token: "MTK-PTS26",
        bab_id: null,
      },
    };

    const examSourceMap = new Map<string, any>();
    Object.values(CANONICAL_EXAMS_MAP).forEach((item) => {
      examSourceMap.set(item.id, item);
    });

    validMathExams.forEach((u) => {
      const isOfficial =
        u.tipe === "ujian" ||
        u.id === "e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55" ||
        /pts|pas|ujian resmi/i.test(u.judul || "");
      const calculatedTipe: "ulangan" | "ujian" = isOfficial ? "ujian" : "ulangan";
      const judul = isOfficial ? "Ujian Resmi Matematika #1" : u.judul;

      examSourceMap.set(u.id, {
        ...u,
        judul,
        tipe: calculatedTipe,
        durasi_menit: u.durasi_menit || (isOfficial ? 90 : 60),
        passing_grade: u.passing_grade || 75,
      });
    });

    examsData = Array.from(examSourceMap.values()).map((u) => {
      const sesi = userSessionMap.get(u.id);
      const calculatedTipe: "ulangan" | "ujian" = u.tipe || "ulangan";

      let sessionStatus = sesi?.status || "belum_mulai";
      if (calculatedTipe === "ujian" && sessionStatus === "sedang_mengerjakan" && sesi?.id) {
        sessionStatus = "terkunci";
        adminSupabase
          .from("sesi_ujian")
          .update({ status: "terkunci" })
          .eq("id", sesi.id)
          .then(() => { });
      }

      return {
        id: u.id,
        judul: u.judul,
        deskripsi: u.deskripsi,
        mapel: u.mapel || "Matematika",
        durasi_menit: u.durasi_menit,
        passing_grade: u.passing_grade,
        waktu_mulai: u.waktu_mulai || new Date().toISOString(),
        waktu_berakhir: u.waktu_berakhir || new Date(Date.now() + 30 * 86400000).toISOString(),
        status: u.status || "dipublikasi", // "dipublikasi" | "ditutup"
        tipe: calculatedTipe,
        bab_id: u.bab_id,
        token: u.token,
        sessionStatus,
        score: sesi?.nilai_akhir ?? null,
        sesiId: sesi?.id,
      };
    });
  } catch { }

  // Fallback default sample peer avatars if no peers in DB yet
  if (peerStudents.length === 0) {
    peerStudents = [
      { id: "p1", name: "Raka Prasetya", initials: "RP" },
      { id: "p2", name: "Naya Anindita", initials: "NA" },
      { id: "p3", name: "Andi Wijaya", initials: "AW" },
      { id: "p4", name: "Siti Aminah", initials: "SA" },
      { id: "p5", name: "Budi Santoso", initials: "BS" },
      { id: "p6", name: "Dewi Lestari", initials: "DL" },
    ];
  }

  if (!sekolahData) {
    sekolahData = {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      nama: "SMK Muhammadiyah 1",
      npsn: "20401318",
      alamat: "Jl. Pakem - Turi No.23, Area Sawah, Pakembinangun, Kec. Pakem, Kab. Sleman, D.I. Yogyakarta 55582",
      motto: "Pusat Keunggulan & Pesantren Vokasi • Bahagia Bersama",
      deskripsi: "SMK Muhammadiyah 1 merupakan Sekolah Pusat Keunggulan dan Pesantren Vokasi yang berkomitmen mencetak generasi muda berakhlak mulia, terampil, mandiri, dan menguasai keahlian industri masa depan.",
      bg_image_url: "/images/smk-muh-pakem-gedung.jpg",
      links: [
        { label: "Website Resmi", url: "https://smkmuhpakem.sch.id", icon: "Globe" },
        { label: "Portal PPDB", url: "https://smkmuhpakem.sch.id/ppdb/", icon: "ExternalLink" },
        { label: "Instagram", url: "https://www.instagram.com/smkmuhpakem/?hl=id", icon: "Instagram" },
      ],
      jam_masuk: "07:00:00",
      jam_terlambat: "07:15:00",
      jam_tutup: "08:00:00",
    };
  }

  // 6. Fetch real classes and assigned teachers directly from database (Google Classroom Cards)
  let classesData: ClassroomCardItem[] = [];
  try {
    const { data: rawDbClasses } = await adminSupabase
      .from("kelas")
      .select(`
        id,
        nama_kelas,
        wali_kelas_id,
        profil:wali_kelas_id (
          id,
          nama_lengkap,
          foto_url
        )
      `)
      .order("dibuat_pada", { ascending: true });

    // Also fetch all guru in case a class has no wali_kelas_id
    const { data: allGurus } = await adminSupabase
      .from("profil")
      .select("id, nama_lengkap, foto_url")
      .eq("peran", "guru")
      .order("dibuat_pada", { ascending: true });

    const fallbackGuru = allGurus && allGurus.length > 0 ? allGurus[0] : null;

    if (rawDbClasses && rawDbClasses.length > 0) {
      // Sesuai aturan kontrak MVP & integrasi dengan Ruang Belajar: hanya ada mapel "Matematika"
      const mathClass =
        rawDbClasses.find((k) => k.nama_kelas.toLowerCase().includes("matematika")) ||
        rawDbClasses[0];

      const isDel =
        isClassDeleted(mathClass?.id || "") ||
        isClassDeleted(mathClass?.nama_kelas || "") ||
        isClassDeleted("mat-8") ||
        isClassDeleted("matematika") ||
        isClassArchived(mathClass?.id || "") ||
        isClassArchived(mathClass?.nama_kelas || "") ||
        isClassArchived("mat-8") ||
        isClassArchived("matematika");

      if (!isDel) {
        const rawTeacher: any = mathClass?.profil;
        const teacherObj: any = Array.isArray(rawTeacher)
          ? rawTeacher[0]
          : rawTeacher || (allGurus && allGurus.length > 0 ? allGurus[0] : fallbackGuru);
        const namaGuru: string = teacherObj?.nama_lengkap || "Ibu Rani Kamayasha, S.Pd.";
        const fotoGuru: string | null = teacherObj?.foto_url || null;

        classesData = [
          {
            id: mathClass?.id || "class_matematika",
            nama_kelas: "Matematika",
            nama_guru: namaGuru,
            foto_guru: fotoGuru,
            banner_color: "#4338CA",
            banner_pattern: "matematika" as const,
          },
        ];
      }
    }
  } catch (err) {
    console.error("Error fetching classes from database:", err);
  }

  // Graceful fallback strictly for Matematika jika belum dihapus atau diarsipkan guru
  if (
    classesData.length === 0 &&
    !isClassDeleted("mat-8") &&
    !isClassDeleted("matematika") &&
    !isClassDeleted("class_matematika") &&
    !isClassArchived("mat-8") &&
    !isClassArchived("matematika") &&
    !isClassArchived("class_matematika")
  ) {
    classesData = [
      {
        id: "class_matematika",
        nama_kelas: "Matematika",
        nama_guru: "Ibu Rani Kamayasha, S.Pd.",
        foto_guru: null,
        banner_color: "#4338CA",
        banner_pattern: "matematika",
      },
    ];
  }

  return (
    <Suspense fallback={null}>
      <StudentDashboardClient
        userProfile={userProfile}
        sekolahData={sekolahData}
        schedulesData={schedules}
        chapters={chaptersWithProgress}
        peerStudents={peerStudents}
        agendasData={agendasData}
        examsData={examsData}
        completedQuizCount={completedQuizCount}
        answeredSoalCount={answeredSoalCount}
        totalSoalCount={totalSoalCount}
        learningProgressPercent={learningProgressPercent}
        classesData={classesData}
      />
    </Suspense>
  );
}

