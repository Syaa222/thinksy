"use client";

import { useState, useEffect } from "react";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import {
  StudentDashboardProps,
  CalendarWeekItem,
  DailyMission,
  NoteItem,
  GlobalChatItem,
  ChatCommentItem,
  LeaderboardStudent,
  NotificationItem,
  ToastNotificationData,
} from "./types";

// Sub-components
import StudentNavbar from "./components/layout/StudentNavbar";
import FloatingActionHub from "./components/layout/FloatingActionHub";
import TabBelajar from "./components/tabs/TabBelajar";
import TabKursusSaya from "./components/tabs/TabKursusSaya";
import TabPeringkat from "./components/tabs/TabPeringkat";
import TabPencapaian from "./components/tabs/TabPencapaian";

// Modals
import AttendanceModal from "./components/attendance/AttendanceModal";
import UatDevMenu from "./components/attendance/UatDevMenu";
import StudentNotesModal from "./components/modals/StudentNotesModal";
import StudentAiAssistantModal from "./components/modals/StudentAiAssistantModal";
import GlobalDiscussionModal from "./components/modals/GlobalDiscussionModal";
import StudentProfileModal from "./components/modals/StudentProfileModal";
import SettingsModal from "./components/modals/SettingsModal";
import HelpCenterModal from "./components/modals/HelpCenterModal";
import ToastNotification from "./components/modals/ToastNotification";

export default function StudentDashboardClient({
  userProfile,
  sekolahData,
  schedulesData,
  chapters = [],
  peerStudents = [],
  completedQuizCount = 0,
  answeredSoalCount = 0,
  totalSoalCount = 10,
  learningProgressPercent = 0,
}: StudentDashboardProps) {
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState<
    "Belajar" | "Kursus Saya" | "Peringkat" | "Pencapaian"
  >("Belajar");

  // UI Preferences & Themes
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [tutorGuidanceLevel, setTutorGuidanceLevel] = useState("sedang");

  // User Gamification State
  const [learningPoints, setLearningPoints] = useState(userProfile?.poin ?? 0);
  const [dailyStreak, setDailyStreak] = useState(userProfile?.streak ?? 0);
  const [isCheckedIn, setIsCheckedIn] = useState(userProfile?.isCheckedIn || false);
  const [checkInTime, setCheckInTime] = useState<string | null>(
    userProfile?.checkInTime || null
  );
  const [checkInStatus, setCheckInStatus] = useState<string | null>(
    userProfile?.checkInStatus || null
  );

  // Modals Visibility State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // UAT Mock Time State
  const [mockTime, setMockTime] = useState<string | null>(null);
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);

  // Toast Notification State
  const [toastNotification, setToastNotification] =
    useState<ToastNotificationData | null>(null);

  // Notes State
  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: "n1",
      judul: "Rangkuman Fotosintesis & Kloroplas",
      konten:
        "Fotosintesis terjadi di membran tilakoid kloroplas memanfaatkan energi foton cahaya matahari...",
      mata_pelajaran: "IPA Biologi",
      dibuat_pada: "31 Agustus 2026",
    },
    {
      id: "n2",
      judul: "Persiapan Ujian Matematika (Pythagoras)",
      konten:
        "Segitiga siku-siku memenuhi c^2 = a^2 + b^2. Tripel pythagoras populer: (3,4,5), (5,12,13), (7,24,25), (8,15,17).",
      mata_pelajaran: "Matematika",
      dibuat_pada: "30 Agustus 2026",
    },
  ]);

  // Global Chat & Comments State
  const [globalChats, setGlobalChats] = useState<GlobalChatItem[]>([
    {
      id: "c1",
      nama_penulis: "Raka Prasetya",
      kelas_penulis: "XI RPL 1",
      konten: "Siapa yang berminat ikut seleksi Lomba Robotik antar sekolah bulan ini?",
      minat_kategori: "Robotik",
      jumlah_suka: 5,
      jumlah_komentar: 2,
      dibuat_pada: "10 menit lalu",
    },
    {
      id: "c2",
      nama_penulis: "Naya Anindita",
      kelas_penulis: "XII DKV",
      konten: "Ada yang mau diskusi belajar bersama mengenai soal penalaran Pythagoras?",
      minat_kategori: "Matematika",
      jumlah_suka: 8,
      jumlah_komentar: 1,
      dibuat_pada: "25 menit lalu",
    },
  ]);
  const [chatComments, setChatComments] = useState<Record<string, ChatCommentItem[]>>({
    c1: [
      {
        id: "cm1",
        nama_penulis: "Budi Santoso",
        kelas_penulis: "Kelas 8B",
        konten: "Saya tertarik ikut seleksi robotik!",
        dibuat_pada: "5 menit lalu",
      },
      {
        id: "cm2",
        nama_penulis: "Siti Aminah",
        kelas_penulis: "XI IPA 2",
        konten: "Bisa hubungi siapa untuk info lebih lanjut?",
        dibuat_pada: "2 menit lalu",
      },
    ],
    c2: [
      {
        id: "cm3",
        nama_penulis: "Andi Wijaya",
        kelas_penulis: "Kelas 8A",
        konten: "Boleh banget, nanti sore di perpustakaan ya!",
        dibuat_pada: "15 menit lalu",
      },
    ],
  });
  const [expandedCommentsChatId, setExpandedCommentsChatId] = useState<string | null>(
    null
  );
  const [loadingCommentsId, setLoadingCommentsId] = useState<string | null>(null);
  const [reportingChatId, setReportingChatId] = useState<string | null>(null);

  // Leaderboard, Missions & Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number>(
    userProfile?.rank || 1
  );
  const [totalStudentsCount, setTotalStudentsCount] = useState<number>(
    userProfile?.totalStudents || 1
  );
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardStudent[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>([]);
  const [isMissionsLoading, setIsMissionsLoading] = useState(false);
  const [isClaimingMissionId, setIsClaimingMissionId] = useState<string | null>(
    null
  );

  const studentName = userProfile?.nama_lengkap || "Budi Kartika";
  const studentEmail = userProfile?.email || "budi.kartika@sekolah.sch.id";

  // Effective Time Calculator (incorporating Dev Mock Time)
  const getEffectiveCurrentTime = () => {
    if (mockTime) return mockTime;
    const now = new Date();
    return now.toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getEffectiveMinutes = () => {
    const timeStr = getEffectiveCurrentTime();
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Time boundaries: > 08.00 WIB (> 480 mins) = Closed/Alpha | 07.16 - 08.00 WIB = Late
  const isPresensiClosed = () => getEffectiveMinutes() > 480;
  const isPresensiLate = () =>
    getEffectiveMinutes() > 435 && getEffectiveMinutes() <= 480;

  // Mount effects: load persisted theme & remote data
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("thinksy_theme");
      if (savedTheme === "dark") setIsDarkMode(true);
      else if (savedTheme === "light") setIsDarkMode(false);

      const savedGuidance = localStorage.getItem("thinksy_tutor_guidance");
      if (savedGuidance) setTutorGuidanceLevel(savedGuidance);
    } catch {}

    fetchPresensiStatus();
    fetchNotifications();
    fetchLeaderboard();
    fetchMissions();
    fetchNotes();
    fetchGlobalChat();
  }, []);

  // Data Fetchers
  const fetchPresensiStatus = async () => {
    try {
      const res = await fetch("/api/siswa/presensi");
      if (res.ok) {
        const data = await res.json();
        if (data.isCheckedIn) {
          setIsCheckedIn(true);
          setCheckInTime(data.checkInTime || null);
          setCheckInStatus(data.status || "Hadir (Tepat Waktu)");
        }
      }
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/siswa/notifikasi");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notifications)) setNotifications(data.notifications);
      }
    } catch {}
  };

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const res = await fetch("/api/siswa/peringkat");
      if (res.ok) {
        const data = await res.json();
        if (data.leaderboard) {
          setLeaderboardList(data.leaderboard);
          const me = data.leaderboard.find((st: any) => st.isCurrentUser);
          if (me) setCurrentUserRank(me.rank);
          if (data.totalStudents) setTotalStudentsCount(data.totalStudents);
        }
      }
    } catch {} finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const fetchMissions = async () => {
    setIsMissionsLoading(true);
    try {
      const res = await fetch("/api/siswa/misi");
      if (res.ok) {
        const data = await res.json();
        const list = data.missions || data.misi;
        if (Array.isArray(list)) setDailyMissions(list);
      }
    } catch {} finally {
      setIsMissionsLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/siswa/catatan");
      if (res.ok) {
        const data = await res.json();
        if (data.notes && data.notes.length > 0) {
          setNotes(
            data.notes.map((n: any) => ({
              id: n.id,
              judul: n.judul,
              konten: n.konten,
              mata_pelajaran: n.mata_pelajaran || "Umum",
              dibuat_pada: new Date(n.dibuat_pada).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            }))
          );
        }
      }
    } catch {}
  };

  const fetchGlobalChat = async () => {
    try {
      const res = await fetch("/api/siswa/chat");
      if (res.ok) {
        const data = await res.json();
        if (data.chats && data.chats.length > 0) {
          setGlobalChats(
            data.chats.map((c: any) => ({
              id: c.id,
              nama_penulis: c.nama_penulis,
              kelas_penulis: c.kelas_penulis || "Siswa",
              konten: c.konten,
              minat_kategori: c.minat_kategori || "Umum",
              jumlah_suka: c.jumlah_suka || 0,
              jumlah_komentar: c.jumlah_komentar || 0,
              dibuat_pada: new Date(c.dibuat_pada).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }))
          );
        }
      }
    } catch {}
  };

  // Real-Time Events Hook
  const { broadcastEvent } = useRealtimeDashboard((event) => {
    if (event.type === "SOAL_PUBLISHED" || event.type === "ESSAY_GRADED") {
      fetchNotifications();
    } else if (event.type === "CHAT_POSTED" && event.payload?.chat) {
      setGlobalChats((prev) => [
        event.payload.chat,
        ...prev.filter((c) => c.id !== event.payload.chat.id),
      ]);
    } else if (event.type === "CHAT_LIKED" && event.payload?.chatId) {
      setGlobalChats((prev) =>
        prev.map((c) =>
          c.id === event.payload.chatId
            ? { ...c, jumlah_suka: event.payload.newLikes }
            : c
        )
      );
    } else if (event.type === "CHAT_COMMENTED" && event.payload?.chatId) {
      const { chatId, comment, newCommentCount } = event.payload;
      setGlobalChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, jumlah_komentar: newCommentCount || c.jumlah_komentar + 1 }
            : c
        )
      );
      if (comment) {
        setChatComments((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []).filter((cm) => cm.id !== comment.id), comment],
        }));
      }
    }
  });

  // Action Handlers
  const handleStartAttendance = () => {
    if (isPresensiClosed()) {
      const activeTime = getEffectiveCurrentTime();
      setToastNotification({
        show: true,
        title: "Presensi Ditutup (Status: Alpha)",
        message:
          "Batas waktu presensi telah berakhir (Pukul >08.00 WIB). Status kehadiran Anda tercatat Alpha. Silakan hubungi wali kelas Anda untuk merubah status kehadiran menjadi hadir.",
        time: `${activeTime} WIB`,
        type: "alpha",
      });
      return;
    }
    setIsAttendanceModalOpen(true);
  };

  const handleAttendanceSuccess = (data: {
    waktu: string;
    status: string;
    poinReward: number;
    streak?: number;
    poinTotal?: number;
  }) => {
    setIsCheckedIn(true);
    setCheckInTime(data.waktu);
    setCheckInStatus(data.status);
    if (typeof data.streak === "number") setDailyStreak(data.streak);
    if (typeof data.poinTotal === "number") setLearningPoints(data.poinTotal);

    fetchMissions();

    setToastNotification({
      show: true,
      title: `Presensi Berhasil (${data.status})!`,
      message: `Kehadiran Anda dicatat pukul ${data.waktu} WIB. Selamat! +${data.poinReward} Poin ditambahkan.`,
      time: `${data.waktu} WIB`,
      type: "success",
    });

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: `Presensi Berhasil (${data.status})`,
        desc: `Kehadiran dicatat pukul ${data.waktu} WIB (+${data.poinReward} Poin).`,
        time: "Baru saja",
        type: "urgent",
      },
      ...prev,
    ]);

    broadcastEvent("ATTENDANCE_CHECKIN", {
      studentName,
      time: data.waktu,
      status: data.status,
    });
  };

  const handleClaimMission = async (misiId: string) => {
    setIsClaimingMissionId(misiId);
    try {
      const res = await fetch("/api/siswa/misi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ misiId }),
      });
      const data = await res.json();

      if (res.ok && data.success === true) {
        setToastNotification({
          show: true,
          title: "Klaim Misi Berhasil! 🎉",
          message: data.message || `Selamat! +${data.poinDitambahkan || 20} Poin ditambahkan.`,
          time: "Baru saja",
        });
        if (typeof data.poinTotal === "number") {
          setLearningPoints(data.poinTotal);
        } else {
          setLearningPoints((prev) => prev + (data.poinDitambahkan || 20));
        }
        fetchMissions();
      } else {
        setToastNotification({
          show: true,
          title: "Misi Belum Selesai ⚠️",
          message:
            data.error ||
            "Kamu belum menyelesaikan target misi ini hari ini. Silakan kerjakan terlebih dahulu!",
          time: "Baru saja",
        });
      }
    } catch {
      setToastNotification({
        show: true,
        title: "Kesalahan Koneksi ⚠️",
        message: "Gagal terhubung ke server. Coba lagi.",
        time: "Baru saja",
      });
    } finally {
      setIsClaimingMissionId(null);
    }
  };

  const handleCreateNote = async (
    judul: string,
    konten: string,
    mata_pelajaran: string
  ) => {
    const newNoteObj: NoteItem = {
      id: Date.now().toString(),
      judul,
      konten,
      mata_pelajaran,
      dibuat_pada: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
    setNotes((prev) => [newNoteObj, ...prev]);

    try {
      await fetch("/api/siswa/catatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul, konten, mata_pelajaran }),
      });
    } catch {}
  };

  const handleDeleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/siswa/catatan?id=${id}`, { method: "DELETE" });
    } catch {}
  };

  const handleSendChat = async (konten: string) => {
    const tempId = Date.now().toString();
    const newChatObj: GlobalChatItem = {
      id: tempId,
      nama_penulis: studentName,
      kelas_penulis: "Kelas 8A",
      konten,
      minat_kategori: "Diskusi",
      jumlah_suka: 0,
      jumlah_komentar: 0,
      dibuat_pada: "Baru saja",
    };
    setGlobalChats((prev) => [newChatObj, ...prev]);
    broadcastEvent("CHAT_POSTED", { chat: newChatObj });

    try {
      const res = await fetch("/api/siswa/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ konten, minat_kategori: "Diskusi" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.chat) {
          setGlobalChats((prev) =>
            prev.map((c) => (c.id === tempId ? { ...data.chat, dibuat_pada: "Baru saja" } : c))
          );
        }
      }
    } catch {}
  };

  const handleLikeChat = async (chatId: string) => {
    let updatedLikes = 0;
    setGlobalChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          updatedLikes = c.jumlah_suka + 1;
          return { ...c, jumlah_suka: updatedLikes };
        }
        return c;
      })
    );
    broadcastEvent("CHAT_LIKED", { chatId, newLikes: updatedLikes });

    try {
      await fetch("/api/siswa/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like", chatId }),
      });
    } catch {}
  };

  const handleToggleComments = async (chatId: string) => {
    if (expandedCommentsChatId === chatId) {
      setExpandedCommentsChatId(null);
      return;
    }
    setExpandedCommentsChatId(chatId);
    if (!chatComments[chatId]) {
      setLoadingCommentsId(chatId);
      try {
        const res = await fetch(`/api/siswa/chat?chatId=${chatId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.comments) {
            setChatComments((prev) => ({
              ...prev,
              [chatId]: data.comments.map((cm: any) => ({
                id: cm.id,
                nama_penulis: cm.nama_penulis,
                kelas_penulis: cm.kelas_penulis || "Siswa",
                konten: cm.konten,
                dibuat_pada: new Date(cm.dibuat_pada).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })),
            }));
          }
        }
      } catch {} finally {
        setLoadingCommentsId(null);
      }
    }
  };

  const handleSendReply = async (chatId: string, replyText: string) => {
    const tempComment: ChatCommentItem = {
      id: Date.now().toString(),
      nama_penulis: studentName,
      kelas_penulis: "Kelas 8A",
      konten: replyText,
      dibuat_pada: "Baru saja",
    };

    setChatComments((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), tempComment],
    }));

    let newCount = 0;
    setGlobalChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          newCount = c.jumlah_komentar + 1;
          return { ...c, jumlah_komentar: newCount };
        }
        return c;
      })
    );

    broadcastEvent("CHAT_COMMENTED", {
      chatId,
      comment: tempComment,
      newCommentCount: newCount,
    });

    try {
      await fetch("/api/siswa/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", chatId, konten: replyText }),
      });
    } catch {}
  };

  const handleReportContent = async (chatId: string, reason: string) => {
    setReportingChatId(null);
    setToastNotification({
      show: true,
      title: "Laporan Diterima",
      message: "Terima kasih. Tim moderasi sekolah akan meninjau postingan ini.",
      time: "Baru saja",
    });
    try {
      await fetch("/api/siswa/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report", chatId, reason }),
      });
    } catch {}
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem("thinksy_theme", isDarkMode ? "dark" : "light");
      localStorage.setItem("thinksy_tutor_guidance", tutorGuidanceLevel);
    } catch {}
    setIsSettingsModalOpen(false);
    setToastNotification({
      show: true,
      title: "Pengaturan Disimpan",
      message: "Preferensi mode tampilan & bimbingan Tutor AI berhasil diperbarui.",
      time: "Baru saja",
    });
  };

  const handleMarkAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, dibaca: true })));
    try {
      await fetch("/api/siswa/notifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_as_read" }),
      });
    } catch {}
  };

  // Top 3 chapters for dashboard preview
  const sortedChapters = [...chapters].sort(
    (a, b) => (b.progress || 0) - (a.progress || 0)
  );
  const top3Chapters = sortedChapters.slice(0, 3);

  // September 2026 Interactive Calendar Weeks Definition
  const calendarWeeks: CalendarWeekItem[] = [
    {
      weekIndex: 0,
      hasStreakBadge: true,
      streakCount: Math.min(dailyStreak, 3),
      days: [
        {
          day: 31,
          isCurrentMonth: false,
          isToday: false,
          status: "muted",
          fullDateStr: "Senin, 31 Agustus 2026",
          schedule: {
            bab: "Bab 1: Bilangan Bulat & Garis Bilangan",
            jam: "08:00 - 09:30 WIB",
            room: "Ruang 8A",
            teacher: "Ibu Siti Rahmawati, M.Pd.",
          },
        },
        {
          day: 1,
          isCurrentMonth: true,
          isToday: false,
          status: "past",
          fullDateStr: "Selasa, 1 September 2026",
          schedule: null,
        },
        {
          day: 2,
          isCurrentMonth: true,
          isToday: false,
          status: "past",
          fullDateStr: "Rabu, 2 September 2026",
          schedule: {
            bab: "Bab 1: Operasi Hitung Campuran",
            jam: "10:00 - 11:30 WIB",
            room: "Lab Komputer 1",
            teacher: "Pak Joko Susilo, S.Pd.",
          },
        },
        {
          day: 3,
          isCurrentMonth: true,
          isToday: false,
          status: "streak",
          fullDateStr: "Kamis, 3 September 2026",
          schedule: null,
        },
        {
          day: 4,
          isCurrentMonth: true,
          isToday: true,
          status: "today",
          fullDateStr: "Jumat, 4 September 2026",
          schedule: {
            bab: "Bab 2: Teorema Pythagoras & Segitiga",
            jam: "08:00 - 09:30 WIB",
            room: "Ruang 8A",
            teacher: "Ibu Siti Rahmawati, M.Pd.",
          },
        },
        {
          day: 5,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Sabtu, 5 September 2026",
          schedule: null,
        },
        {
          day: 6,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Minggu, 6 September 2026",
          schedule: null,
        },
      ],
    },
    {
      weekIndex: 1,
      hasStreakBadge: false,
      streakCount: 0,
      days: [
        {
          day: 7,
          isCurrentMonth: true,
          isToday: false,
          status: "scheduled",
          fullDateStr: "Senin, 7 September 2026",
          schedule: {
            bab: "Bab 2: Tripel Pythagoras & Aplikasinya",
            jam: "08:00 - 09:30 WIB",
            room: "Ruang 8A",
            teacher: "Ibu Siti Rahmawati, M.Pd.",
          },
        },
        {
          day: 8,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Selasa, 8 September 2026",
          schedule: null,
        },
        {
          day: 9,
          isCurrentMonth: true,
          isToday: false,
          status: "scheduled",
          fullDateStr: "Rabu, 9 September 2026",
          schedule: {
            bab: "Bab 2: Latihan Penalaran Soal HOTS",
            jam: "10:00 - 11:30 WIB",
            room: "Ruang 8A",
            teacher: "Ibu Siti Rahmawati, M.Pd.",
          },
        },
        {
          day: 10,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Kamis, 10 September 2026",
          schedule: null,
        },
        {
          day: 11,
          isCurrentMonth: true,
          isToday: false,
          status: "scheduled",
          fullDateStr: "Jumat, 11 September 2026",
          schedule: {
            bab: "Bab 3: Persamaan Linear Satu Variabel",
            jam: "08:00 - 09:30 WIB",
            room: "Ruang 8A",
            teacher: "Pak Joko Susilo, S.Pd.",
          },
        },
        {
          day: 12,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Sabtu, 12 September 2026",
          schedule: null,
        },
        {
          day: 13,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Minggu, 13 September 2026",
          schedule: null,
        },
      ],
    },
    {
      weekIndex: 2,
      hasStreakBadge: false,
      streakCount: 0,
      days: [
        {
          day: 14,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Senin, 14 September 2026",
          schedule: null,
        },
        {
          day: 15,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Selasa, 15 September 2026",
          schedule: null,
        },
        {
          day: 16,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Rabu, 16 September 2026",
          schedule: null,
        },
        {
          day: 17,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Kamis, 17 September 2026",
          schedule: null,
        },
        {
          day: 18,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Jumat, 18 September 2026",
          schedule: null,
        },
        {
          day: 19,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Sabtu, 19 September 2026",
          schedule: null,
        },
        {
          day: 20,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Minggu, 20 September 2026",
          schedule: null,
        },
      ],
    },
    {
      weekIndex: 3,
      hasStreakBadge: false,
      streakCount: 0,
      days: [
        {
          day: 21,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Senin, 21 September 2026",
          schedule: null,
        },
        {
          day: 22,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Selasa, 22 September 2026",
          schedule: null,
        },
        {
          day: 23,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Rabu, 23 September 2026",
          schedule: null,
        },
        {
          day: 24,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Kamis, 24 September 2026",
          schedule: null,
        },
        {
          day: 25,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Jumat, 25 September 2026",
          schedule: null,
        },
        {
          day: 26,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Sabtu, 26 September 2026",
          schedule: null,
        },
        {
          day: 27,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Minggu, 27 September 2026",
          schedule: null,
        },
      ],
    },
    {
      weekIndex: 4,
      hasStreakBadge: false,
      streakCount: 0,
      days: [
        {
          day: 28,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Senin, 28 September 2026",
          schedule: null,
        },
        {
          day: 29,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Selasa, 29 September 2026",
          schedule: null,
        },
        {
          day: 30,
          isCurrentMonth: true,
          isToday: false,
          status: "normal",
          fullDateStr: "Rabu, 30 September 2026",
          schedule: null,
        },
        {
          day: 1,
          isCurrentMonth: false,
          isToday: false,
          status: "muted",
          fullDateStr: "Kamis, 1 Oktober 2026",
          schedule: null,
        },
        {
          day: 2,
          isCurrentMonth: false,
          isToday: false,
          status: "muted",
          fullDateStr: "Jumat, 2 Oktober 2026",
          schedule: null,
        },
        {
          day: 3,
          isCurrentMonth: false,
          isToday: false,
          status: "muted",
          fullDateStr: "Sabtu, 3 Oktober 2026",
          schedule: null,
        },
        {
          day: 4,
          isCurrentMonth: false,
          isToday: false,
          status: "muted",
          fullDateStr: "Minggu, 4 Oktober 2026",
          schedule: null,
        },
      ],
    },
  ];

  return (
    <div
      className={`min-h-screen font-sans pb-20 transition-colors duration-200 ${
        isDarkMode ? "bg-slate-950 text-slate-100" : "bg-[#F8FAFC] text-slate-900"
      }`}
    >
      {/* 1. SAAS NAVBAR */}
      <StudentNavbar
        isDarkMode={isDarkMode}
        sekolahData={sekolahData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCheckedIn={isCheckedIn}
        checkInStatus={checkInStatus}
        checkInTime={checkInTime}
        isPresensiClosed={isPresensiClosed}
        onStartAttendance={handleStartAttendance}
        notifications={notifications}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        studentName={studentName}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* 2. TAB VIEWS */}
      {activeTab === "Belajar" && (
        <TabBelajar
          studentName={studentName}
          currentUserRank={currentUserRank}
          learningProgressPercent={learningProgressPercent}
          learningPoints={learningPoints}
          dailyStreak={dailyStreak}
          sekolahData={sekolahData}
          calendarWeeks={calendarWeeks}
          dailyMissions={dailyMissions}
          isMissionsLoading={isMissionsLoading}
          isClaimingMissionId={isClaimingMissionId}
          onClaimMission={handleClaimMission}
          top3Chapters={top3Chapters}
          peerStudents={peerStudents}
          onNavigateToCourses={() => setActiveTab("Kursus Saya")}
        />
      )}

      {activeTab === "Peringkat" && (
        <TabPeringkat
          leaderboardList={leaderboardList}
          isLoadingLeaderboard={isLoadingLeaderboard}
          onRefreshLeaderboard={fetchLeaderboard}
        />
      )}

      {activeTab === "Kursus Saya" && (
        <TabKursusSaya chapters={chapters} peerStudents={peerStudents} />
      )}

      {activeTab === "Pencapaian" && (
        <TabPencapaian
          completedQuizCount={completedQuizCount}
          dailyStreak={dailyStreak}
          learningPoints={learningPoints}
          answeredSoalCount={answeredSoalCount}
        />
      )}

      {/* 3. MODALS */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        effectiveTime={getEffectiveCurrentTime()}
        isLate={isPresensiLate()}
        mockTime={mockTime}
        onSubmitSuccess={handleAttendanceSuccess}
        onPresensiClosed={(time, errorMsg) => {
          setToastNotification({
            show: true,
            title: "Presensi Ditutup (Status: Alpha)",
            message:
              errorMsg ||
              "Batas waktu presensi telah berakhir (Pukul >08.00 WIB). Status kehadiran Anda tercatat Alpha. Silakan hubungi wali kelas Anda.",
            time: `${time} WIB`,
            type: "alpha",
          });
        }}
      />

      <StudentNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        notes={notes}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
      />

      <StudentAiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        studentName={studentName}
      />

      <GlobalDiscussionModal
        isOpen={isGlobalChatOpen}
        onClose={() => setIsGlobalChatOpen(false)}
        globalChats={globalChats}
        chatComments={chatComments}
        expandedCommentsChatId={expandedCommentsChatId}
        setExpandedCommentsChatId={setExpandedCommentsChatId}
        loadingCommentsId={loadingCommentsId}
        reportingChatId={reportingChatId}
        setReportingChatId={setReportingChatId}
        onSendChat={handleSendChat}
        onLikeChat={handleLikeChat}
        onSendReply={handleSendReply}
        onToggleComments={handleToggleComments}
        onReportContent={handleReportContent}
      />

      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        studentName={studentName}
        studentEmail={studentEmail}
        learningPoints={learningPoints}
        dailyStreak={dailyStreak}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        tutorGuidanceLevel={tutorGuidanceLevel}
        setTutorGuidanceLevel={setTutorGuidanceLevel}
        onSave={handleSaveSettings}
      />

      <HelpCenterModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* 4. TOAST NOTIFICATION */}
      <ToastNotification
        notification={toastNotification}
        onClose={() => setToastNotification(null)}
      />

      {/* 5. FLOATING ACTION HUB (FAB +) */}
      <FloatingActionHub
        onOpenNotes={() => setIsNotesModalOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onOpenGlobalChat={() => setIsGlobalChatOpen(true)}
      />

      {/* 6. UAT / DEV MENU MOCK TIME */}
      <UatDevMenu
        mockTime={mockTime}
        setMockTime={setMockTime}
        isOpen={isDevMenuOpen}
        setIsOpen={setIsDevMenuOpen}
      />
    </div>
  );
}
