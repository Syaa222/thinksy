import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import StudentDashboardClient from "./StudentDashboardClient";
import { normalizeMapel } from "@/lib/mapel";
import { StudentDashboardProps, SekolahData, PeerStudent } from "./types";

export default async function SiswaDashboardPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Default User Profile
  let userProfile: StudentDashboardProps["userProfile"] = {
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
    jurusan: "Teknik Komputer & Jaringan",
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
      .select("id, nama_lengkap, peran, poin, streak, sekolah_id, nisn, nis, jurusan, tahun_ajaran, foto_url")
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

    const currentPoin = profil?.poin ?? 0;
    const currentStreak = profil?.streak ?? 0;

    // Calculate completed quiz count (sesi kuis/latihan + sesi_ujian resmi)
    const { count: quizDoneCount } = await adminSupabase
      .from("sesi")
      .select("id", { count: "exact", head: true })
      .eq("siswa_id", user.id)
      .eq("status_sesi", "selesai");

    const { count: ujianDoneCount } = await adminSupabase
      .from("sesi_ujian")
      .select("id", { count: "exact", head: true })
      .eq("siswa_id", user.id)
      .eq("status", "selesai");

    completedQuizCount = (quizDoneCount || 0) + (ujianDoneCount || 0);

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

    userProfile = {
      nama_lengkap: profil?.nama_lengkap || user.email?.split("@")[0] || "Budi Kartika",
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
      nisn: profil?.nisn || "0089247182",
      nis: profil?.nis || "260481",
      jurusan: profil?.jurusan || "Teknik Komputer & Jaringan",
      tahun_ajaran: profil?.tahun_ajaran || "2026/2027",
      foto_url: profil?.foto_url || null,
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
  const { data: listBab } = await supabase
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

  // 5. Fetch Ujian & Ulangan untuk Section "AKU LULUS"
  let examsData: any[] = [];
  const { data: dbExams } = await adminSupabase
    .from("ujian")
    .select(`
      id,
      judul,
      deskripsi,
      mapel,
      durasi_menit,
      passing_grade,
      waktu_mulai,
      waktu_berakhir,
      status,
      tipe
    `)
    .order("waktu_mulai", { ascending: false });

  let userExamSessions: Record<string, any> = {};
  if (user) {
    const { data: sesiList } = await adminSupabase
      .from("sesi_ujian")
      .select("id, ujian_id, status, nilai_akhir")
      .eq("siswa_id", user.id);

    if (sesiList) {
      sesiList.forEach((s: any) => {
        userExamSessions[s.ujian_id] = s;
      });
    }
  }

  if (dbExams) {
    examsData = dbExams.map((e: any) => {
      const s = userExamSessions[e.id];
      return {
        ...e,
        tipe: e.tipe || "ujian",
        sessionStatus: s?.status || "belum_mulai",
        score: s?.nilai_akhir ?? null,
        sesiId: s?.id,
      };
    });
  }

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

  return (
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
    />
  );
}

