"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  AgendaAkademikItem,
} from "./types";

// Sub-components
import StudentNavbar from "./components/layout/StudentNavbar";
import TabBelajar from "./components/tabs/TabBelajar";

// Google Classroom Layout Components
import ClassroomTopBar from "./components/classroom/ClassroomTopBar";
import ClassroomSidebar, { ClassroomViewMode } from "./components/classroom/ClassroomSidebar";
import RuangBelajarSubjectChaptersView from "./components/classroom/RuangBelajarSubjectChaptersView";
import ClassroomHomeView from "./components/classroom/ClassroomHomeView";
import ClassroomClassDetailView from "./components/classroom/ClassroomClassDetailView";
import ClassroomTodoView, { LastActivityItem } from "./components/classroom/ClassroomTodoView";
import ClassroomCalendarView from "./components/classroom/ClassroomCalendarView";
import ClassroomArchivedView from "./components/classroom/ClassroomArchivedView";
import ClassroomProfileView from "./components/classroom/ClassroomProfileView";

// Modals
import AttendanceModal from "./components/attendance/AttendanceModal";
import UatDevMenu from "./components/attendance/UatDevMenu";
import StudentNotesModal from "./components/modals/StudentNotesModal";
import JoinClassModal from "./components/modals/JoinClassModal";
import StudentAiAssistantModal from "./components/modals/StudentAiAssistantModal";
import GlobalDiscussionModal from "./components/modals/GlobalDiscussionModal";
import StudentProfileModal from "./components/modals/StudentProfileModal";
import SettingsModal from "./components/modals/SettingsModal";
import HelpCenterModal from "./components/modals/HelpCenterModal";
import ToastNotification from "./components/modals/ToastNotification";
import {
  getStoredStudentProfile,
  getStoredStudentPhoto,
  getStoredThemeMode,
  getStoredThemeColor,
  getStoredLanguage,
  applyTheme,
  StudentCardProfile,
  DEFAULT_STUDENT_PHOTO,
  FEMALE_STUDENT_PHOTO,
} from "@/lib/student-settings";

export default function StudentDashboardClient({
  userProfile,
  sekolahData,
  schedulesData,
  chapters = [],
  peerStudents = [],
  agendasData = [],
  examsData = [],
  completedQuizCount: initialCompletedQuizCount = 0,
  answeredSoalCount: initialAnsweredSoalCount = 0,
  totalSoalCount = 10,
  learningProgressPercent = 0,
  classesData = [],
}: StudentDashboardProps) {
  // Navigation Tabs State & Google Classroom View Mode
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "Home" | "Belajar" | "Ruang Ujian" | "Peringkat" | "Pencapaian"
  >("Home");
  const [classroomView, setClassroomView] = useState<ClassroomViewMode>("home");
  const [selectedSubjectClass, setSelectedSubjectClass] = useState<string>("Matematika");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Dynamic Student Profile (synced with settings & localStorage after mount)
  const [profileState, setProfileState] = useState<StudentCardProfile>(() => {
    const defaultPhoto =
      userProfile?.jenis_kelamin === "Perempuan"
        ? FEMALE_STUDENT_PHOTO
        : DEFAULT_STUDENT_PHOTO;
    return getStoredStudentProfile({
      nama_lengkap: userProfile?.nama_lengkap || "Siswa Thinksy",
      nama_kelas: userProfile?.nama_kelas || "Kelas 8",
      nis: userProfile?.nis || "260481",
      nisn: userProfile?.nisn || "0089247182",
      jurusan: userProfile?.jurusan || "Fase D (Kurikulum Merdeka)",
      tahun_ajaran: userProfile?.tahun_ajaran || "2026/2027",
      foto_url: userProfile?.foto_url || defaultPhoto,
      tempat_tgl_lahir: userProfile?.tempat_tgl_lahir || "Gunungkidul, 12 Agustus 2010",
      jenis_kelamin: userProfile?.jenis_kelamin || "Laki-laki",
      agama: "Islam",
    });
  });

  // UI Preferences & Themes
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [tutorGuidanceLevel, setTutorGuidanceLevel] = useState("sedang");

  // User Gamification State
  const [learningPoints, setLearningPoints] = useState(userProfile?.poin ?? 0);
  const [dailyStreak, setDailyStreak] = useState(userProfile?.streak ?? 0);
  const [completedQuizCount, setCompletedQuizCount] = useState(
    initialCompletedQuizCount || 0
  );
  const [answeredSoalCount, setAnsweredSoalCount] = useState(
    initialAnsweredSoalCount || 0
  );
  const [pencapaianBadges, setPencapaianBadges] = useState<any[]>([]);
  const [isLoadingPencapaian, setIsLoadingPencapaian] = useState(false);
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
  const [isJoinClassModalOpen, setIsJoinClassModalOpen] = useState(false);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>(classesData || []);
  const [isGamesModalOpen, setIsGamesModalOpen] = useState(false);
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Sync joined classes from localStorage on mount & dengarkan event kelas baru / kelas dihapus
  useEffect(() => {
    // 1. Inisialisasi awal dari localStorage
    try {
      const saved =
        localStorage.getItem("thinksy_joined_classes") ||
        localStorage.getItem("thinksy_permanent_classes");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEnrolledClasses((prev) => {
            const existingIds = new Set(prev.map((c: any) => c.id));
            const toAdd = parsed.filter((c: any) => !existingIds.has(c.id));
            return [...toAdd, ...prev];
          });
        }
      }
    } catch {}

    // Helper untuk menghapus kelas yang dihapus atau di-unenroll
    const removeClassById = (classIdOrCode: string) => {
      if (!classIdOrCode) return;
      const clean = classIdOrCode.toLowerCase().trim();

      setEnrolledClasses((prev) => {
        const next = prev.filter((c: any) => {
          const cId = (c.id || "").toLowerCase();
          const cCode = (c.kode_kelas || c.subjectCode || "").toLowerCase();
          const cName = (c.nama_kelas || "").toLowerCase();
          const cSubj = (c.mata_pelajaran || "").toLowerCase();

          if (cId === clean || cId.includes(clean) || clean.includes(cId)) return false;
          if (cCode && (cCode === clean || cCode.includes(clean) || clean.includes(cCode))) return false;
          if (cName && (cName === clean || clean.includes(cName))) return false;
          if (clean.includes("ipa") && (cId.includes("ipa") || cSubj.includes("ipa") || cName.includes("ipa"))) return false;
          if (clean.includes("mat") && (cId.includes("mat") || cSubj.includes("mat") || cName.includes("mat"))) return false;
          return true;
        });

        try {
          localStorage.setItem("thinksy_joined_classes", JSON.stringify(next));
          localStorage.setItem("thinksy_permanent_classes", JSON.stringify(next));
        } catch {}

        return next;
      });

      // Jika sedang membuka kelas yang baru saja dihapus atau diarsipkan, kembalikan ke home
      setSelectedSubjectClass((prevSubj) => {
        const prevClean = (prevSubj || "").toLowerCase();
        if (
          prevClean === clean ||
          prevClean.includes(clean) ||
          clean.includes(prevClean) ||
          (clean.includes("ipa") && prevClean.includes("ipa")) ||
          (clean.includes("mat") && prevClean.includes("mat"))
        ) {
          setClassroomView("home");
          return "Matematika";
        }
        return prevSubj;
      });
    };

    // 2. Sinkronisasi dengan server: hapus kelas yang sudah di-blacklist/dihapus atau diarsipkan/di-unenroll guru
    async function syncClassesWithServer() {
      try {
        const res = await fetch("/api/classroom/classes");
        if (res.ok) {
          const data = await res.json();
          const deletedIds: string[] = (data.deletedClassIds || []).map((d: string) => d.toLowerCase());
          const archivedIds: string[] = (data.archivedClassIds || []).map((a: string) => a.toLowerCase());
          const inactiveIds = [...deletedIds, ...archivedIds];

          if (inactiveIds.length > 0) {
            setEnrolledClasses((prev) => {
              const cleaned = prev.filter((c: any) => {
                const cId = (c.id || "").toLowerCase();
                const cCode = (c.kode_kelas || c.subjectCode || "").toLowerCase();
                const cName = (c.nama_kelas || "").toLowerCase();
                const isInactive = inactiveIds.some(
                  (d) =>
                    d === cId ||
                    cId.includes(d) ||
                    (cCode && (d === cCode || cCode.includes(d))) ||
                    (cName && (d === cName || cName.includes(d)))
                );
                return !isInactive;
              });

              try {
                localStorage.setItem("thinksy_joined_classes", JSON.stringify(cleaned));
                localStorage.setItem("thinksy_permanent_classes", JSON.stringify(cleaned));
              } catch {}
              return cleaned;
            });
          }
        }

        // Cek juga apakah ada permohonan unenroll yang sudah disetujui guru
        const unres = await fetch("/api/classroom/unenroll-request");
        if (unres.ok) {
          const unData = await unres.json();
          if (unData.requests && Array.isArray(unData.requests)) {
            const approvedReqs = unData.requests.filter((r: any) => r.status === "approved");
            for (const req of approvedReqs) {
              if (req.classId) removeClassById(req.classId);
              if (req.className) removeClassById(req.className);
            }
          }
        }
      } catch (err) {
        console.warn("[STUDENT SYNC ERROR]", err);
      }
    }
    syncClassesWithServer();

    // 3. Event Handlers
    const handleClassJoined = (e: any) => {
      if (e.detail?.classData) {
        const newCls = e.detail.classData;
        setEnrolledClasses((prev) => {
          if (prev.some((c: any) => c.id === newCls.id)) return prev;
          return [newCls, ...prev];
        });
      }
    };

    const handleClassLeft = (e: any) => {
      const idToRemove = e.detail?.classId;
      if (idToRemove) removeClassById(idToRemove);
    };

    const handleClassArchived = (e: any) => {
      const idToRemove = e.detail?.classId;
      if (idToRemove) {
        removeClassById(idToRemove);
        const isEn = getStoredLanguage() === "en";
        setToastNotification({
          show: true,
          title: isEn ? "Class Unenrolled" : "Kelas Di-unenroll",
          message: isEn
            ? "A class has been unenrolled by the teacher and moved to archive."
            : "Kelas telah di-unenroll oleh guru pengampu dan dipindahkan ke arsip.",
          time: isEn ? "Just now" : "Baru saja",
          type: "info",
        });
      }
    };

    const handleClassDeleted = (e: any) => {
      const idToRemove = e.detail?.classId;
      if (idToRemove) {
        removeClassById(idToRemove);
        const isEn = getStoredLanguage() === "en";
        setToastNotification({
          show: true,
          title: isEn ? "Class Removed" : "Kelas Dihapus Pengampu",
          message: isEn
            ? "A class has been permanently deleted by the teacher."
            : "Kelas telah dihapus secara permanen oleh guru pengampu.",
          time: isEn ? "Just now" : "Baru saja",
          type: "info",
        });
      }
    };

    const handleUnenrollApproved = (e: any) => {
      const classId = e.detail?.classId;
      const className = e.detail?.className || "Kelas";
      if (classId) {
        removeClassById(classId);

        try {
          const pending = JSON.parse(localStorage.getItem("thinksy_pending_unenroll_classes") || "[]");
          const nextPending = pending.filter((id: string) => id !== classId);
          localStorage.setItem("thinksy_pending_unenroll_classes", JSON.stringify(nextPending));
        } catch {}

        const isEn = getStoredLanguage() === "en";
        setToastNotification({
          show: true,
          title: isEn ? "Class Left (Approved)" : "Keluar Kelas Disetujui",
          message: isEn
            ? `Teacher has approved your request to leave ${className}.`
            : `Guru telah menyetujui permintaan Anda untuk keluar dari kelas ${className}.`,
          time: isEn ? "Just now" : "Baru saja",
          type: "success",
        });
      }
    };

    const handleUnenrollRejected = (e: any) => {
      const classId = e.detail?.classId;
      const className = e.detail?.className || "Kelas";
      if (classId) {
        try {
          const pending = JSON.parse(localStorage.getItem("thinksy_pending_unenroll_classes") || "[]");
          const nextPending = pending.filter((id: string) => id !== classId);
          localStorage.setItem("thinksy_pending_unenroll_classes", JSON.stringify(nextPending));
        } catch {}

        const isEn = getStoredLanguage() === "en";
        setToastNotification({
          show: true,
          title: isEn ? "Request Declined" : "Permintaan Ditolak",
          message: isEn
            ? `Teacher declined your request to leave ${className}. You remain enrolled.`
            : `Guru menolak permintaan keluar dari kelas ${className}. Anda tetap terdaftar di kelas.`,
          time: isEn ? "Just now" : "Baru saja",
          type: "info",
        });
      }
    };

    // Cross-tab synchronization via storage event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "thinksy_class_archived_event" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.classId) removeClassById(data.classId);
        } catch {}
      }
      if (e.key === "thinksy_class_deleted_event" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.classId) removeClassById(data.classId);
        } catch {}
      }
      if (e.key === "thinksy_unenroll_approved_event" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.classId) removeClassById(data.classId);
        } catch {}
      }
    };

    window.addEventListener("thinksy_class_joined", handleClassJoined);
    window.addEventListener("thinksy_class_left", handleClassLeft);
    window.addEventListener("thinksy_class_archived", handleClassArchived);
    window.addEventListener("thinksy_class_deleted", handleClassDeleted);
    window.addEventListener("thinksy_unenroll_approved", handleUnenrollApproved);
    window.addEventListener("thinksy_unenroll_rejected", handleUnenrollRejected);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("thinksy_class_joined", handleClassJoined);
      window.removeEventListener("thinksy_class_left", handleClassLeft);
      window.removeEventListener("thinksy_class_archived", handleClassArchived);
      window.removeEventListener("thinksy_class_deleted", handleClassDeleted);
      window.removeEventListener("thinksy_unenroll_approved", handleUnenrollApproved);
      window.removeEventListener("thinksy_unenroll_rejected", handleUnenrollRejected);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // UAT Mock Time State (persisted & synced with localStorage after mount to prevent hydration mismatch)
  const [mockTime, setMockTime] = useState<string | null>(null);
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);

  // Dynamic Last Activity (Chapter or Quiz) synced with localStorage
  const [lastActivity, setLastActivity] = useState<LastActivityItem | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("thinksy_last_activity");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    if (chapters && chapters.length > 0) {
      return {
        type: "bab",
        id: chapters[0].id,
        judul: chapters[0].judul,
        mapel: chapters[0].mapel || "Matematika",
        link: `/bab/${chapters[0].id}`,
      };
    }
    return {
      type: "bab",
      id: "bab-1",
      judul: "Bab 1: Bilangan Berpangkat & Bentuk Akar",
      mapel: "Matematika",
      link: "/bab/bab-1",
    };
  });

  useEffect(() => {
    const handleActivitySync = (e?: any) => {
      try {
        if (e?.detail) {
          setLastActivity(e.detail);
          return;
        }
        const saved = localStorage.getItem("thinksy_last_activity");
        if (saved) {
          setLastActivity(JSON.parse(saved));
        }
      } catch {}
    };

    window.addEventListener("thinksy_activity_update", handleActivitySync);
    window.addEventListener("storage", handleActivitySync);
    return () => {
      window.removeEventListener("thinksy_activity_update", handleActivitySync);
      window.removeEventListener("storage", handleActivitySync);
    };
  }, []);

  // Read searchParams for direct tab linking
  const searchParams = useSearchParams();
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "todo") {
      setClassroomView("todo");
    } else if (tabParam === "matematika" || tabParam === "stream") {
      setClassroomView("matematika");
    } else if (tabParam === "belajar" || tabParam === "home") {
      setActiveTab("Home");
      setClassroomView("home");
    }
  }, [searchParams]);
  // Auto-expand sidebar on desktop screen (>= 1024px) on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  const handleSelectClassroomView = (view: ClassroomViewMode) => {
    setClassroomView(view);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    if (view === "home") {
      setActiveTab("Home");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (view === "todo" || view === "matematika") {
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleOpenClassSubject = (classId?: string, subjectName?: string) => {
    let resolvedSubj = "Matematika";
    if (subjectName) {
      resolvedSubj = subjectName.toLowerCase().includes("ipa") ? "IPA" : subjectName;
    } else if (classId) {
      const found = enrolledClasses.find((c: any) => c.id === classId);
      if (found) {
        resolvedSubj = (found.mata_pelajaran || found.nama_kelas || "").toLowerCase().includes("ipa") ? "IPA" : "Matematika";
      }
    }
    setSelectedSubjectClass(resolvedSubj);
    setClassroomView("matematika");
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Sync mockTime across tabs/windows & initial load after mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("thinksy_mock_time") || null;
      if (saved) setMockTime(saved);
    } catch {}

    const handleMockTimeSync = () => {
      try {
        const saved = localStorage.getItem("thinksy_mock_time") || null;
        setMockTime(saved);
      } catch {}
    };

    window.addEventListener("thinksy_mock_time_change", handleMockTimeSync);
    window.addEventListener("storage", handleMockTimeSync);
    return () => {
      window.removeEventListener("thinksy_mock_time_change", handleMockTimeSync);
      window.removeEventListener("storage", handleMockTimeSync);
    };
  }, []);

  // Toast Notification State
  const [toastNotification, setToastNotification] =
    useState<ToastNotificationData | null>(null);

  // Realtime Sync Listener for Student
  useRealtimeDashboard((event) => {
    if (event.type === "ATTENDANCE_VERIFIED" || event.type === "ATTENDANCE_CHECKIN") {
      setIsCheckedIn(true);
      setCheckInStatus(event.payload?.status || "Hadir (Terverifikasi)");
      if (event.payload?.waktu_masuk) {
        setCheckInTime(
          new Date(event.payload.waktu_masuk).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB"
        );
      }
      setToastNotification({
        show: true,
        title: "Presensi Terverifikasi 🎉",
        message: "Kehadiran Anda telah disetujui resmi oleh Guru di dashboard!",
        time: "Baru saja",
        type: "success",
      });
    } else if (event.type === "ESSAY_GRADED") {
      setLearningPoints((prev) => prev + 20);
      setToastNotification({
        show: true,
        title: "Nilai Tugas Diverifikasi Guru 📝",
        message: "Guru telah memeriksa jawaban tugas Anda! Poin bertambah +20.",
        time: "Baru saja",
        type: "success",
      });
    } else if (event.type === "SOAL_PUBLISHED") {
      setToastNotification({
        show: true,
        title: "Soal Latihan Baru Diterbitkan! ✨",
        message: "Guru baru saja menambahkan soal latihan baru di Bank Soal.",
        time: "Baru saja",
        type: "info",
      });
    } else if (event.type === "ACADEMIC_CALENDAR_UPDATED") {
      const payload = event.payload || {};
      const notifMsg =
        payload.message ||
        `Guru memperbarui tanggal "${payload.judul || "Jadwal"}": ${payload.tanggalFormatted || payload.tanggal || "Tanggal baru"}.`;
      setToastNotification({
        show: true,
        title: "Jadwal Akademik Diperbarui 📅",
        message: notifMsg,
        time: "Baru saja",
        type: "info",
      });
      setNotifications((prev) => [
        {
          id: `acad-${Date.now()}`,
          title: "Jadwal Akademik Diperbarui 📅",
          desc: notifMsg,
          time: "Baru saja",
          type: "info",
          dibaca: false,
          link_url: "/dashboard?tab=calendar",
        },
        ...prev,
      ]);
      if (payload.agenda) {
        setAgendasState((prev) => {
          const item = payload.agenda;
          const exists = prev.some((a) => a.id === item.id);
          const mappedItem: AgendaAkademikItem = {
            id: item.id,
            judul: item.judul,
            deskripsi: item.deskripsi,
            kategori: (item.kategori === "kbm" ? "agenda" : item.kategori) as any,
            tanggal: item.tanggal,
            jam_mulai: item.jam?.split("-")[0]?.trim() || "07:30:00",
            jam_selesai: item.jam?.split("-")[1]?.trim() || "09:00:00",
            lokasi: item.lokasi,
          };
          if (exists) {
            return prev.map((a) => (a.id === item.id ? mappedItem : a));
          }
          return [mappedItem, ...prev];
        });
      }
    } else if (event.type === "ANNOUNCEMENT_POSTED") {
      const payload = event.payload || {};
      const author = payload.authorName || "Guru";
      const preview = (payload.text || "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/<u>(.*?)<\/u>/gi, "$1")
        .substring(0, 100);

      setToastNotification({
        show: true,
        title: `📢 Pengumuman Baru dari ${author}`,
        message: preview
          ? `"${preview}${preview.length >= 100 ? "..." : ""}"`
          : "Guru telah membagikan pengumuman di Stream kelas.",
        time: "Baru saja",
        type: "info",
      });

      setNotifications((prev) => [
        {
          id: `ann-${Date.now()}`,
          title: `📢 Pengumuman: ${author}`,
          desc: preview || "Guru membagikan pengumuman baru di kelas.",
          time: "Baru saja",
          type: "info",
          dibaca: false,
          link_url: "/dashboard?tab=stream",
        },
        ...prev,
      ]);
    } else if (event.type === "UPCOMING_TASK_UPDATED") {
      const payload = event.payload || {};
      setToastNotification({
        show: true,
        title: "Tugas Mendatang Baru 📌",
        message: `${payload.title || "Tugas baru"} (Due: ${payload.dueDate || "Segera"})`,
        time: "Baru saja",
        type: "info",
      });
      setNotifications((prev) => [
        {
          id: `task-${Date.now()}`,
          title: "Tugas Mendatang Baru 📌",
          desc: `${payload.title || "Tugas"} - Due ${payload.dueDate || "Segera"}`,
          time: "Baru saja",
          type: "info",
          dibaca: false,
          link_url: "/dashboard?tab=todo",
        },
        ...prev,
      ]);
    } else if (
      event.type === "NOTIFICATION_RECEIVED" ||
      (event as any).type === "TASK_REMINDER"
    ) {
      const payload = event.payload || {};
      const targetId = payload.user_id || payload.targetUserId || payload.studentId;
      const targetName = payload.studentName || payload.nama_lengkap;
      const targetNisn = payload.nisn;
      const title =
        payload.judul || payload.title || "🔔 Pengingat Tugas dari Guru";
      const desc =
        payload.pesan ||
        payload.desc ||
        "Guru mengingatkan Anda untuk segera menyelesaikan tugas yang belum dikumpulkan.";
      const linkUrl = payload.link_url || "/dashboard?tab=todo";

      const currentStudentName =
        userProfile?.nama_lengkap &&
        userProfile.nama_lengkap.trim() !== "" &&
        userProfile.nama_lengkap !== "Siswa Thinksy"
          ? userProfile.nama_lengkap
          : profileState.nama_lengkap || "Siswa Thinksy";

      const isTarget =
        payload.isBroadcastAll === true ||
        !targetId ||
        targetId === userProfile?.id ||
        (targetName &&
          currentStudentName &&
          (targetName.toLowerCase().trim() === currentStudentName.toLowerCase().trim() ||
            currentStudentName.toLowerCase().includes(targetName.toLowerCase().trim()) ||
            targetName.toLowerCase().includes(currentStudentName.toLowerCase().trim()))) ||
        (targetNisn && profileState.nisn && targetNisn === profileState.nisn);

      if (isTarget) {
        const notifId = payload.id || `notif-${Date.now()}`;
        const newNotifItem: NotificationItem = {
          id: notifId,
          title,
          desc,
          time: "Baru saja",
          type: (payload.type as any) || (payload.tipe as any) || "warning",
          dibaca: false,
          link_url: linkUrl,
        };

        setNotifications((prev) => [
          newNotifItem,
          ...prev.filter((n) => String(n.id) !== String(notifId)),
        ]);

        setToastNotification({
          show: true,
          title,
          message: desc,
          time: "Baru saja",
          type: "warning",
        });

        // Background refetch to sync Supabase database
        fetchNotifications();
      }
    }
  });

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
        kelas_penulis: "Kelas 8",
        konten: "Saya tertarik ikut seleksi robotik!",
        dibuat_pada: "5 menit lalu",
      },
      {
        id: "cm2",
        nama_penulis: "Siti Aminah",
        kelas_penulis: "Kelas 8",
        konten: "Bisa hubungi siapa untuk info lebih lanjut?",
        dibuat_pada: "2 menit lalu",
      },
    ],
    c2: [
      {
        id: "cm3",
        nama_penulis: "Andi Wijaya",
        kelas_penulis: "Kelas 8",
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
  const [agendasState, setAgendasState] = useState<AgendaAkademikItem[]>(agendasData || []);

  // Cross-tab real-time sync for academic calendar updates from Guru
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "thinksy_realtime_calendar_event" && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          const notifMsg =
            payload.message ||
            `Guru memperbarui tanggal "${payload.judul || "Jadwal"}": ${payload.tanggalFormatted || payload.tanggal || "Tanggal baru"}.`;
          setToastNotification({
            show: true,
            title: "Jadwal Akademik Diperbarui 📅",
            message: notifMsg,
            time: "Baru saja",
            type: "info",
          });
          setNotifications((prev) => [
            {
              id: `acad-storage-${Date.now()}`,
              title: "Jadwal Akademik Diperbarui 📅",
              desc: notifMsg,
              time: "Baru saja",
              type: "info",
              dibaca: false,
              link_url: "/dashboard?tab=calendar",
            },
            ...prev,
          ]);
          if (payload.agenda) {
            setAgendasState((prev) => {
              const item = payload.agenda;
              const exists = prev.some((a) => a.id === item.id);
              const mappedItem: AgendaAkademikItem = {
                id: item.id,
                judul: item.judul,
                deskripsi: item.deskripsi,
                kategori: (item.kategori === "kbm" ? "agenda" : item.kategori) as any,
                tanggal: item.tanggal,
                jam_mulai: item.jam?.split("-")[0]?.trim() || "07:30:00",
                jam_selesai: item.jam?.split("-")[1]?.trim() || "09:00:00",
                lokasi: item.lokasi,
              };
              if (exists) {
                return prev.map((a) => (a.id === item.id ? mappedItem : a));
              }
              return [mappedItem, ...prev];
            });
          }
        } catch {}
      } else if (e.key === "thinksy_student_reminder_event" && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          handleIncomingReminder(payload);
        } catch {}
      }
    };

    const handleIncomingReminder = (payload: any) => {
      if (!payload) return;
      const targetId = payload.targetStudentId || payload.studentId || payload.user_id;
      const targetName = payload.studentName || payload.nama_lengkap;
      const targetNisn = payload.nisn;
      const currentStudentName =
        userProfile?.nama_lengkap &&
        userProfile.nama_lengkap.trim() !== "" &&
        userProfile.nama_lengkap !== "Siswa Thinksy"
          ? userProfile.nama_lengkap
          : profileState.nama_lengkap || "Siswa Thinksy";

      const isTarget =
        payload.isBroadcastAll === true ||
        !targetId ||
        targetId === userProfile?.id ||
        (targetName &&
          currentStudentName &&
          (targetName.toLowerCase().trim() === currentStudentName.toLowerCase().trim() ||
            currentStudentName.toLowerCase().includes(targetName.toLowerCase().trim()) ||
            targetName.toLowerCase().includes(currentStudentName.toLowerCase().trim()))) ||
        (targetNisn && profileState.nisn && targetNisn === profileState.nisn);

      if (isTarget) {
        const notifId = payload.id || `remind-${Date.now()}`;
        const title = payload.title || "🔔 Pengingat Tugas dari Guru";
        const desc =
          payload.desc ||
          payload.pesan ||
          "Guru mengingatkan Anda untuk segera menyelesaikan tugas yang belum dikumpulkan.";

        const newNotifItem: NotificationItem = {
          id: notifId,
          title,
          desc,
          time: payload.time || "Baru saja",
          type: "warning",
          dibaca: false,
          link_url: payload.link_url || "/dashboard?tab=todo",
        };

        setNotifications((prev) => [
          newNotifItem,
          ...prev.filter((n) => String(n.id) !== String(notifId)),
        ]);

        setToastNotification({
          show: true,
          title,
          message: desc,
          time: "Baru saja",
          type: "warning",
        });

        fetchNotifications();
      }
    };

    const handleCustomReminder = (e: any) => {
      if (e?.detail) {
        handleIncomingReminder(e.detail);
      }
    };

    window.addEventListener("storage", handleStorageEvent);
    window.addEventListener("thinksy_reminder_sent", handleCustomReminder);
    return () => {
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener("thinksy_reminder_sent", handleCustomReminder);
    };
  }, [userProfile?.id, userProfile?.nama_lengkap, profileState.nama_lengkap, profileState.nisn]);

  const [currentUserRank, setCurrentUserRank] = useState<number>(
    userProfile?.rank || 1
  );
  const [totalStudentsCount, setTotalStudentsCount] = useState<number>(
    userProfile?.totalStudents || 1
  );
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardStudent[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  // Pending tasks count for To-do navigation badge (Exams and Last unfinished activity)
  const activeExamsCount = (examsData || []).filter(
    (e) => e.status === "dipublikasi" && e.sessionStatus !== "selesai"
  ).length;
  const todoCount = activeExamsCount + (lastActivity ? 1 : 0);

  const studentName =
    userProfile?.nama_lengkap &&
    userProfile.nama_lengkap.trim() !== "" &&
    userProfile.nama_lengkap !== "Siswa Thinksy"
      ? userProfile.nama_lengkap
      : profileState.nama_lengkap || "Siswa Thinksy";
  const studentEmail = userProfile?.email || "siswa@sekolah.sch.id";
  const studentPhoto = profileState.foto_url || userProfile?.foto_url || DEFAULT_STUDENT_PHOTO;

  // Effective Time Calculator (incorporating Dev Mock Time)
  const getEffectiveCurrentTime = () => {
    if (mockTime) return mockTime;
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return formatter.format(now);
  };

  const getEffectiveMinutes = () => {
    const timeStr = getEffectiveCurrentTime();
    const normalized = timeStr.replace(".", ":");
    const [h, m] = normalized.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Dynamic Cutoff & Late Threshold from Sekolah Data (default: Tutup 08:00 WIB, Terlambat > 07:15 WIB)
  const getCutoffMinutes = () => {
    if (sekolahData?.jam_tutup) {
      const [h, m] = sekolahData.jam_tutup.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
    }
    return 480; // Default 08.00 WIB
  };

  const getLateMinutes = () => {
    if (sekolahData?.jam_masuk) {
      const [h, m] = sekolahData.jam_masuk.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
    }
    return 435; // Default 07.15 WIB
  };

  const isPresensiClosed = () => getEffectiveMinutes() > getCutoffMinutes();
  const isPresensiLate = () =>
    getEffectiveMinutes() > getLateMinutes() && getEffectiveMinutes() <= getCutoffMinutes();

  // Mount effects: load persisted theme & remote data
  useEffect(() => {
    try {
      const storedProfile = getStoredStudentProfile({
        nama_lengkap: userProfile?.nama_lengkap,
        nama_kelas: userProfile?.nama_kelas,
        nis: userProfile?.nis || undefined,
        nisn: userProfile?.nisn || undefined,
        jurusan: userProfile?.jurusan || undefined,
        tahun_ajaran: userProfile?.tahun_ajaran || undefined,
        foto_url: userProfile?.foto_url || undefined,
      });
      if (
        userProfile?.nama_lengkap &&
        userProfile.nama_lengkap.trim() !== "" &&
        userProfile.nama_lengkap !== "Siswa Thinksy"
      ) {
        storedProfile.nama_lengkap = userProfile.nama_lengkap;
      }
      setProfileState(storedProfile);

      const mode = getStoredThemeMode();
      const color = getStoredThemeColor();
      setIsDarkMode(mode === "dark" || mode === "dim");
      applyTheme(mode, color);

      const savedGuidance = localStorage.getItem("thinksy_tutor_guidance");
      if (savedGuidance) setTutorGuidanceLevel(savedGuidance);
    } catch {}

    const handleProfileChange = (e: any) => {
      if (e.detail) {
        setProfileState(e.detail);
      }
    };
    const handleThemeChange = (e: any) => {
      if (e.detail?.mode) {
        setIsDarkMode(e.detail.mode === "dark" || e.detail.mode === "dim");
      }
    };
    window.addEventListener("thinksy_profile_change", handleProfileChange);
    window.addEventListener("thinksy_theme_change", handleThemeChange);

    fetchPresensiStatus();
    fetchNotifications();
    fetchNotes();
    fetchGlobalChat();

    return () => {
      window.removeEventListener("thinksy_profile_change", handleProfileChange);
      window.removeEventListener("thinksy_theme_change", handleThemeChange);
    };
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
      const params = new URLSearchParams();
      if (userProfile?.id) params.set("studentId", userProfile.id);
      const activeName =
        userProfile?.nama_lengkap &&
        userProfile.nama_lengkap.trim() !== "" &&
        userProfile.nama_lengkap !== "Siswa Thinksy"
          ? userProfile.nama_lengkap
          : profileState.nama_lengkap || "Siswa Thinksy";
      if (activeName) params.set("studentName", activeName);

      const res = await fetch(`/api/siswa/notifikasi?${params.toString()}`);
      let serverNotifs: NotificationItem[] = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notifications)) {
          serverNotifs = data.notifications;
        }
      }

      // Check localStorage for local & cross-tab notifications
      let localNotifs: any[] = [];
      try {
        const raw = localStorage.getItem("thinksy_student_notifications");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localNotifs = parsed.filter((item: any) => {
              if (item.isBroadcastAll) return true;
              if (!item.studentName && !item.studentId) return true;
              if (item.studentId && userProfile?.id && item.studentId === userProfile.id) return true;
              if (
                item.studentName &&
                activeName &&
                (item.studentName.toLowerCase().trim() === activeName.toLowerCase().trim() ||
                  activeName.toLowerCase().includes(item.studentName.toLowerCase().trim()) ||
                  item.studentName.toLowerCase().includes(activeName.toLowerCase().trim()))
              )
                return true;
              return false;
            });
          }
        }
      } catch {}

      // Deduplicate notifications by ID
      const combined = [...localNotifs, ...serverNotifs];
      const seen = new Set<string>();
      const merged: NotificationItem[] = [];
      for (const item of combined) {
        const key = String(item.id);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      }

      setNotifications(merged);
    } catch (err) {
      console.warn("[FETCH NOTIFICATIONS ERROR]", err);
    }
  };

  const fetchLeaderboard = async () => {
    // Only show full spinner on initial empty load to avoid jarring flicker during real-time sync
    if (leaderboardList.length === 0) {
      setIsLoadingLeaderboard(true);
    }
    try {
      const res = await fetch("/api/siswa/peringkat", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.leaderboard)) {
          setLeaderboardList(data.leaderboard);
          const me = data.leaderboard.find((st: any) => st.isCurrentUser);
          if (me) {
            setCurrentUserRank(me.rank);
            if (typeof me.points === "number" && me.points > 0) {
              setLearningPoints(me.points);
            }
            if (typeof me.streak === "number" && me.streak > 0) {
              setDailyStreak(me.streak);
            }
          }
          if (data.totalStudents) setTotalStudentsCount(data.totalStudents);
        }
      }
    } catch (err) {
      console.warn("[FETCH LEADERBOARD ERROR]", err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const fetchPencapaian = async () => {
    setIsLoadingPencapaian(true);
    try {
      const res = await fetch("/api/siswa/pencapaian");
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          if (typeof data.stats.learningPoints === "number") {
            setLearningPoints(data.stats.learningPoints);
          }
          if (typeof data.stats.dailyStreak === "number") {
            setDailyStreak(data.stats.dailyStreak);
          }
          if (typeof data.stats.completedQuizCount === "number") {
            setCompletedQuizCount(data.stats.completedQuizCount);
          }
          if (typeof data.stats.answeredSoalCount === "number") {
            setAnsweredSoalCount(data.stats.answeredSoalCount);
          }
        }
        if (Array.isArray(data.badges)) {
          setPencapaianBadges(data.badges);
        }
      }
    } catch {} finally {
      setIsLoadingPencapaian(false);
    }
  };

  const fetchMissions = async () => {
    // Gamifikasi & misi harian dinonaktifkan sesuai modul kerja MVP
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
    if (event.type === "SOAL_PUBLISHED") {
      fetchNotifications();
    } else if (event.type === "ESSAY_GRADED") {
      fetchNotifications();
      fetchPencapaian();
    } else if (
      event.type === "POINTS_UPDATED" ||
      event.type === "ATTENDANCE_CHECKIN" ||
      event.type === "ATTENDANCE_VERIFIED" ||
      event.type === "EXAM_STATUS_CHANGED"
    ) {
      fetchLeaderboard();
      fetchPencapaian();
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

    setToastNotification({
      show: true,
      title: `Presensi Berhasil (${data.status})!`,
      message: `Kehadiran Anda dicatat resmi pukul ${data.waktu} WIB di portal akademik.`,
      time: `${data.waktu} WIB`,
      type: "success",
    });

    setNotifications((prev) => [
      {
        id: Date.now(),
        title: `Presensi Berhasil (${data.status})`,
        desc: `Kehadiran tercatat resmi pukul ${data.waktu} WIB.`,
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

  const handleClaimMission = async (_misiId: string) => {
    // Gamifikasi & misi harian dinonaktifkan sesuai modul kerja MVP
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

  const handleJoinClassSuccess = (newClass: any) => {
    const isIpa =
      (newClass.nama_kelas || "").toLowerCase().includes("ipa") ||
      (newClass.mata_pelajaran || "").toLowerCase().includes("ipa");

    const formattedClass = {
      id: newClass.id || `class-${Date.now()}`,
      nama_kelas: newClass.nama_kelas,
      nama_guru: newClass.nama_guru || "Ibu Siti Rahmawati, M.Pd.",
      mata_pelajaran: newClass.mata_pelajaran || (isIpa ? "IPA" : "Matematika"),
      ruang: newClass.ruang || (isIpa ? "Lab IPA" : "Ruang 8-A"),
      kode_kelas: newClass.kode_kelas || newClass.subjectCode || (isIpa ? "ipa8xpk" : "mtk8xpk"),
      banner_color: newClass.banner_color || newClass.themeColor || (isIpa ? "#0F9D58" : "#1967D2"),
      banner_pattern: newClass.banner_pattern || newClass.bannerIllustration || (isIpa ? "science" : "matematika"),
      bgGradient: newClass.bgGradient || (isIpa ? "from-emerald-600 via-teal-700 to-slate-950" : "from-blue-700 via-indigo-700 to-slate-900"),
      bannerPhotoUrl: newClass.bannerPhotoUrl || "",
      bannerType: newClass.bannerPhotoUrl ? "photo" : (newClass.bannerType || "illustration"),
      description: newClass.description || `Kelas ${newClass.nama_kelas}`,
    };

    setEnrolledClasses((prev) => {
      const existingIds = new Set(prev.map((c: any) => c.id));
      if (existingIds.has(formattedClass.id)) return prev;
      const next = [formattedClass, ...prev];
      try {
        localStorage.setItem("thinksy_joined_classes", JSON.stringify(next));
        localStorage.setItem("thinksy_permanent_classes", JSON.stringify(next));
      } catch {}
      return next;
    });

    const joinedStudent = {
      id: `st-joined-${Date.now()}`,
      name: studentName,
      nisn: profileState.nisn || "0089247182",
      kelas: formattedClass.nama_kelas,
      points: learningPoints || 450,
      hadir: true,
      online: true,
      foto: studentPhoto,
      joinedAt: new Date().toISOString(),
    };

    try {
      const existingStudents = JSON.parse(
        localStorage.getItem("thinksy_joined_students") || "[]"
      );
      const updatedStudents = [
        joinedStudent,
        ...existingStudents.filter((s: any) => s.name !== studentName),
      ];
      localStorage.setItem(
        "thinksy_joined_students",
        JSON.stringify(updatedStudents)
      );
    } catch {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("thinksy_class_joined", {
          detail: {
            classData: formattedClass,
            student: joinedStudent,
          },
        })
      );
    }

    setToastNotification({
      show: true,
      title: "Berhasil Bergabung Selamanya! 🎉",
      message: `Selamat, Anda telah terdaftar secara permanen di kelas ${formattedClass.nama_kelas} (${formattedClass.nama_guru}). Kelas aktif selamanya di dashboard Anda.`,
      time: "Baru saja",
      type: "success",
    });
  };

  const handleLeaveClass = async (classId: string, className: string) => {
    // 1. Simpan status pending di localStorage
    try {
      const pending = JSON.parse(localStorage.getItem("thinksy_pending_unenroll_classes") || "[]");
      if (!pending.includes(classId)) {
        pending.push(classId);
        localStorage.setItem("thinksy_pending_unenroll_classes", JSON.stringify(pending));
      }
    } catch {}

    // 2. Kirim request ke backend unenroll API
    try {
      await fetch("/api/classroom/unenroll-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: userProfile?.id || "student-1",
          studentName: userProfile?.nama_lengkap || profileState.nama_lengkap || studentName || "Siswa Thinksy",
          classId,
          className,
        }),
      });
    } catch (err) {
      console.warn("Failed to send unenroll request:", err);
    }

    // 3. Dispatch event agar UI bereaksi langsung
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("thinksy_unenroll_requested", {
          detail: { classId, className },
        })
      );
    }

    // 4. Tampilkan Toast Pending Konfirmasi Guru
    const isEn = getStoredLanguage() === "en";
    setToastNotification({
      show: true,
      title: isEn ? "Request Submitted" : "Permintaan Dikirim",
      message: isEn
        ? "Unenroll request submitted. Waiting for teacher's confirmation."
        : "Permintaan keluar kelas telah dikirim. Menunggu konfirmasi dari guru pengampu.",
      time: isEn ? "Just now" : "Baru saja",
      type: "info",
    });
  };

  const handleCancelLeaveRequest = async (classId: string) => {
    try {
      const pending = JSON.parse(localStorage.getItem("thinksy_pending_unenroll_classes") || "[]");
      const nextPending = pending.filter((id: string) => id !== classId);
      localStorage.setItem("thinksy_pending_unenroll_classes", JSON.stringify(nextPending));
    } catch {}

    try {
      await fetch("/api/classroom/unenroll-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: userProfile?.id || "student-1",
          classId,
          action: "cancel",
        }),
      });
    } catch {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("thinksy_unenroll_canceled", {
          detail: { classId },
        })
      );
    }

    const isEn = getStoredLanguage() === "en";
    setToastNotification({
      show: true,
      title: isEn ? "Request Canceled" : "Permintaan Dibatalkan",
      message: isEn
        ? "Unenroll request has been canceled."
        : "Permintaan keluar kelas telah dibatalkan.",
      time: isEn ? "Just now" : "Baru saja",
      type: "info",
    });
  };

  const handleShareNoteToForum = (
    title: string,
    content: string,
    subject: string
  ) => {
    const sharedNotePost = {
      id: `post-note-${Date.now()}`,
      authorName: studentName,
      authorAvatarText: (studentName || "S").charAt(0).toUpperCase(),
      authorAvatarColor: "bg-blue-600",
      timeAgo: "Baru saja",
      text: `📌 [Catatan Belajar Siswa - ${subject}]\n${title}\n\n${content}`,
      subjectTag: "mat-8",
      comments: [],
    };

    try {
      const existingNotes = JSON.parse(
        localStorage.getItem("thinksy_shared_notes") || "[]"
      );
      localStorage.setItem(
        "thinksy_shared_notes",
        JSON.stringify([sharedNotePost, ...existingNotes])
      );
    } catch {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("thinksy_note_shared", {
          detail: sharedNotePost,
        })
      );
    }

    setToastNotification({
      show: true,
      title: "Catatan Dibagikan ke Kelas!",
      message:
        "Catatan belajar Anda berhasil dibagikan ke forum kelas dan terintegrasi di dashboard guru pengampu.",
      time: "Baru saja",
      type: "info",
    });
  };

  const handleSendChat = async (konten: string) => {
    const tempId = Date.now().toString();
    const newChatObj: GlobalChatItem = {
      id: tempId,
      nama_penulis: studentName,
      kelas_penulis: profileState.nama_kelas || "Kelas 8",
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
      kelas_penulis: profileState.nama_kelas || "Kelas 8",
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
      const raw = localStorage.getItem("thinksy_student_notifications");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((item: any) => ({ ...item, dibaca: true }));
          localStorage.setItem("thinksy_student_notifications", JSON.stringify(updated));
        }
      }
    } catch {}
    try {
      await fetch("/api/siswa/notifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_as_read",
          studentId: userProfile?.id,
        }),
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
      hasStreakBadge: false,
      streakCount: 0,
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
          status: "past",
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
      className={`min-h-screen font-sans transition-colors duration-200 ${
        isDarkMode ? "bg-slate-950 text-slate-100" : "bg-[#F8FAFD] text-slate-900"
      }`}
    >
      {/* 1. GOOGLE CLASSROOM TOP BAR */}
      <ClassroomTopBar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        studentName={studentName}
        studentPhoto={studentPhoto}
        studentEmail={studentEmail}
        studentClass={profileState.nama_kelas || userProfile?.nama_kelas || "Kelas 8"}
        waliKelas={classesData?.[0]?.nama_guru || "Ibu Siti Rahmawati, M.Pd."}
        isCheckedIn={isCheckedIn}
        checkInStatus={checkInStatus}
        checkInTime={checkInTime}
        isPresensiClosed={isPresensiClosed}
        onStartAttendance={handleStartAttendance}
        notifications={notifications}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onOpenSettings={() => setClassroomView("profil")}
        onOpenProfile={() => setClassroomView("profil")}
        onOpenNotes={() => setIsNotesModalOpen(true)}
        onOpenJoinClass={() => setIsJoinClassModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        sekolahData={sekolahData}
      />

      {/* 2. BODY WITH SIDEBAR & MAIN CANVAS */}
      <div className="flex pt-16 min-h-screen">
        {/* Left Sidebar */}
        <ClassroomSidebar
          isOpen={isSidebarOpen}
          activeView={classroomView}
          onSelectView={handleSelectClassroomView}
          onOpenSettings={() => setClassroomView("profil")}
          onOpenProfile={() => setClassroomView("profil")}
          todoCount={todoCount}
          studentName={studentName}
          studentClass={profileState.nama_kelas || userProfile?.nama_kelas || "Kelas 8"}
          schoolName={sekolahData?.nama || "SMK Muhammadiyah 1"}
          studentPhoto={studentPhoto}
          isActive={true}
          enrolledClasses={enrolledClasses}
          selectedSubject={selectedSubjectClass}
          onSelectSubjectClass={(classId, subj) => handleOpenClassSubject(classId, subj)}
        />

        {/* Desktop Spacer for Fixed Sidebar so content flows properly next to fixed sidebar */}
        {isSidebarOpen && (
          <div
            className="w-68 sm:w-72 shrink-0 hidden lg:block pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Mobile & Tablet Backdrop Overlay when Sidebar is open */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 top-16 bg-black/40 z-20 lg:hidden backdrop-blur-xs transition-opacity cursor-pointer"
            aria-hidden="true"
          />
        )}

        {/* Main Content Area: Tightened top layout without wasted blank space */}
        <main className="flex-1 min-w-0 px-2 sm:px-6 pt-2.5 sm:pt-3.5 pb-20 max-w-7xl mx-auto">
          {classroomView === "todo" ? (
            <ClassroomTodoView
              examsData={examsData}
              lastActivity={lastActivity}
              onBackToHome={() => setClassroomView("home")}
            />
          ) : classroomView === "calendar" ? (
            <ClassroomCalendarView
              calendarWeeks={calendarWeeks}
              agendasData={agendasState}
              examsData={examsData}
              chapters={chapters}
              studentId={(userProfile as any)?.id || userProfile?.email || "student"}
              studentName={studentName}
              onBackToHome={() => setClassroomView("home")}
            />
          ) : classroomView === "matematika" ? (
            <RuangBelajarSubjectChaptersView
              selectedSubject={selectedSubjectClass}
              chapters={chapters}
              userProfile={userProfile}
              onBackToHome={() => setClassroomView("home")}
              onSelectSubject={(subj) => handleOpenClassSubject(undefined, subj)}
            />
          ) : classroomView === "profil" ? (
            <ClassroomProfileView
              studentName={studentName}
              studentEmail={studentEmail}
              studentClass={profileState.nama_kelas || userProfile?.nama_kelas || "Kelas 8A"}
              schoolName={sekolahData?.nama || "SMK Muhammadiyah 1"}
              waliKelas={classesData?.[0]?.nama_guru || "Ibu Siti Rahmawati, M.Pd."}
              studentPhoto={studentPhoto}
              learningProgressPercent={learningProgressPercent}
              allChapters={chapters}
              agendasData={agendasState}
              onBackToHome={() => setClassroomView("home")}
              onPhotoUpdated={(newPhoto) => {
                setProfileState((prev) => ({ ...prev, foto_url: newPhoto }));
              }}
            />
          ) : (
            <TabBelajar
              studentId={userProfile?.id || "student-1"}
              studentName={studentName}
              namaKelas={userProfile.nama_kelas || "Kelas 8"}
              learningProgressPercent={learningProgressPercent}
              sekolahData={sekolahData}
              calendarWeeks={calendarWeeks}
              allChapters={chapters}
              peerStudents={peerStudents}
              agendasData={agendasState}
              examsData={examsData}
              lastActivity={lastActivity}
              onNavigateToCourses={() => handleOpenClassSubject(undefined, "Matematika")}
              onOpenCalendar={() => setClassroomView("calendar")}
              onOpenTodo={() => setClassroomView("todo")}
              classesData={enrolledClasses}
              onOpenClass={(classId?: string, subjectName?: string) => {
                handleOpenClassSubject(classId, subjectName);
              }}
              onLeaveClass={handleLeaveClass}
              onCancelLeaveRequest={handleCancelLeaveRequest}
            />
          )}
        </main>
      </div>

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
        onShareToForum={handleShareNoteToForum}
      />

      <JoinClassModal
        isOpen={isJoinClassModalOpen}
        onClose={() => setIsJoinClassModalOpen(false)}
        studentName={studentName}
        studentEmail={studentEmail}
        studentPhoto={studentPhoto}
        schoolName={sekolahData?.nama || "SMK Muhammadiyah 1"}
        onJoinSuccess={handleJoinClassSuccess}
      />



      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        studentName={studentName}
        studentEmail={studentEmail}
        namaKelas={profileState.nama_kelas || userProfile?.nama_kelas || "Kelas 8"}
        fotoUrl={studentPhoto}
        sekolahData={sekolahData}
        waliKelas={classesData?.[0]?.nama_guru || "Ibu Siti Rahmawati, M.Pd."}
      />

      {/* SEMENTARA DINONAKTIFKAN: PENGATURAN SISWA DIHILANGKAN BESERTA ISINYA */}
      {/* 
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        tutorGuidanceLevel={tutorGuidanceLevel}
        setTutorGuidanceLevel={setTutorGuidanceLevel}
        profileData={profileState}
        onSaveProfile={(updated) => {
          setProfileState(updated);
        }}
        onSave={handleSaveSettings}
        onOpenProfileCard={() => setIsProfileModalOpen(true)}
      />
      */}

      <HelpCenterModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* 4. TOAST NOTIFICATION */}
      <ToastNotification
        notification={toastNotification}
        onClose={() => setToastNotification(null)}
      />

      {/* 5. UAT / DEV MENU MOCK TIME */}
      <UatDevMenu
        mockTime={mockTime}
        setMockTime={setMockTime}
        isOpen={isDevMenuOpen}
        setIsOpen={setIsDevMenuOpen}
      />
    </div>
  );
}
