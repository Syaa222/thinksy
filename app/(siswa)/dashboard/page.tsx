import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import StudentDashboardClient from "./StudentDashboardClient";

export default async function SiswaDashboardPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Default User Profile
  let userProfile = {
    nama_lengkap: "Budi Kartika",
    email: "budi.kartika@sekolah.sch.id",
    peran: "siswa",
    poin: 0,
    streak: 0,
    rank: 3,
    totalStudents: 120,
    isCheckedIn: false,
    checkInTime: null as string | null,
    checkInStatus: null as string | null,
  };

  let completedQuizCount = 0;
  let answeredSoalCount = 0;
  let totalSoalCount = 0;
  let learningProgressPercent = 0;

  let sekolahData: {
    id: string;
    nama: string;
    motto?: string | null;
    deskripsi?: string | null;
    bg_image_url?: string | null;
    links?: { label: string; url: string; icon?: string }[] | null;
    alamat?: string | null;
    npsn?: string | null;
  } | null = null;

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
      .select("nama_lengkap, peran, poin, streak, sekolah_id")
      .eq("id", user.id)
      .single();

    if (profil?.sekolah_id) {
      const { data: sek } = await supabase
        .from("sekolah")
        .select("id, nama, motto, deskripsi, bg_image_url, links, alamat, npsn")
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
        };
      }
    }

    const currentPoin = profil?.poin ?? 0;
    const currentStreak = profil?.streak ?? 0;

    // Calculate completed quiz count (status_sesi = 'selesai')
    const { count: quizDoneCount } = await supabase
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

    const answeredSet = new Set(answeredRows?.map((r: any) => r.soal_id));
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
    };
  }

  // 2. Fetch Jadwal Kelas Pelajaran Mingguan
  let schedules = [
    { id: "s1", subject: "Matematika", teacher: "Ibu Siti Rahmawati, S.Pd.", day: "Senin", time: "08:00 - 09:30 WIB", room: "Ruang 8A" },
    { id: "s2", subject: "Matematika", teacher: "Budi Santoso, S.Pd.", day: "Rabu", time: "10:00 - 11:30 WIB", room: "Ruang 8A" },
    { id: "s3", subject: "Matematika (AI Sokratik)", teacher: "thinksy AI Tutor", day: "Jumat", time: "08:00 - 09:30 WIB", room: "Lab Komputer" },
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

  // 3. Fetch List of Chapters (Bab) and Compute Real Per-Chapter Progress
  const { data: listBab } = await supabase
    .from("bab")
    .select(
      `
      id,
      judul,
      deskripsi,
      urutan,
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

    chaptersWithProgress = listBab.map((ch) => {
      const babQuestionIds = questionsByBab.get(ch.id) || [];
      const totalQ = babQuestionIds.length;
      const answeredQ = babQuestionIds.filter((qId) => studentAnsweredIds.has(qId)).length;
      const progress = totalQ > 0 ? Math.min(100, Math.round((answeredQ / totalQ) * 100)) : 0;

      return {
        id: ch.id,
        judul: ch.judul,
        deskripsi: ch.deskripsi,
        urutan: ch.urutan || 1,
        progress,
        materi: ch.materi,
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

  if (!user && !sekolahData) {
    sekolahData = {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      nama: "SMK Muhammadiyah 1 Playen",
      npsn: "20402099",
      alamat: "Jl. Logandeng No. 1, Playen, Gunungkidul, D.I. Yogyakarta",
      motto: "Pusat Keunggulan • Unggul, Terampil, Berkarakter & Berdaya Saing Global",
      deskripsi: "SMK Muhammadiyah 1 Playen (Muspla) adalah Sekolah Pusat Keunggulan yang berkomitmen mencetak generasi muda yang cerdas, beriman, dan menguasai teknologi serta keahlian industri masa depan.",
      bg_image_url: "/images/smk-muh1-playen.jpg",
      links: [
        { label: "Website Resmi", url: "https://smkmuh1playen.sch.id", icon: "Globe" },
        { label: "Portal PPDB", url: "https://ppdb.smkmuh1playen.sch.id", icon: "ExternalLink" },
        { label: "Instagram", url: "https://instagram.com/smkmuh1playen", icon: "Instagram" }
      ]
    };
  }

  return (
    <StudentDashboardClient
      userProfile={userProfile}
      sekolahData={sekolahData}
      schedulesData={schedules}
      chapters={chaptersWithProgress}
      peerStudents={peerStudents}
      completedQuizCount={completedQuizCount}
      answeredSoalCount={answeredSoalCount}
      totalSoalCount={totalSoalCount}
      learningProgressPercent={learningProgressPercent}
    />
  );
}
