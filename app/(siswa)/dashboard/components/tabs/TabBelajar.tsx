import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import {
  GraduationCap,
  Globe,
  BookOpen,
  ChevronRight,
  Trophy,
  Clock,
  Lock,
  Target,
  CheckCircle2,
  Loader2,
  Calendar as CalendarIcon,
  Award,
  AlertCircle,
  FileText,
  PlayCircle,
  Layers,
  MapPin,
  X,
  Key,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Search,
  Eye,
  EyeOff,
  Folder,
  MoreVertical,
  Plus,
  Sparkles,
  LogOut,
} from "lucide-react";
import {
  SekolahData,
  CalendarWeekItem,
  DailyMission,
  ChapterItem,
  PeerStudent,
  AgendaAkademikItem,
  UjianItem,
  ClassroomCardItem,
} from "../../types";
import { useLanguage } from "@/hooks/useLanguage";
import { LastActivityItem } from "../classroom/ClassroomTodoView";
import { useActiveClassTheme } from "@/lib/classroom-sync";
import { ClassBannerGraphic } from "@/components/guru/classroom/ClassBannerGraphics";
import {
  useDueSoonItems,
  formatDueSoonDisplay,
  isDueSoonReleased,
} from "@/lib/due-soon";
import {
  StreamAnnouncement,
  DEFAULT_ANNOUNCEMENTS,
} from "@/lib/announcement-format";

interface TabBelajarProps {
  studentId?: string;
  studentName: string;
  currentUserRank?: number;
  namaKelas?: string;
  learningProgressPercent: number;
  learningPoints?: number;
  sekolahData?: SekolahData | null;
  calendarWeeks: CalendarWeekItem[];
  dailyMissions?: DailyMission[];
  isMissionsLoading?: boolean;
  isClaimingMissionId?: string | null;
  onClaimMission?: (id: string) => void;
  allChapters?: ChapterItem[];
  peerStudents?: PeerStudent[];
  agendasData?: AgendaAkademikItem[];
  examsData?: UjianItem[];
  lastActivity?: LastActivityItem | null;
  onNavigateToCourses: () => void;
  onOpenClass?: (classId: string, subjectName?: string) => void;
  onOpenCalendar?: () => void;
  onOpenTodo?: () => void;
  classesData?: ClassroomCardItem[];
  onLeaveClass?: (classId: string, className: string) => void;
  onCancelLeaveRequest?: (classId: string) => void;
}

export default function TabBelajar({
  studentId = "student-1",
  studentName,
  currentUserRank,
  namaKelas = "Kelas 8",
  learningProgressPercent,
  learningPoints,
  sekolahData,
  calendarWeeks,
  dailyMissions,
  isMissionsLoading,
  isClaimingMissionId,
  onClaimMission,
  allChapters = [],
  peerStudents,
  agendasData = [],
  examsData = [],
  lastActivity,
  onNavigateToCourses,
  onOpenClass,
  onOpenCalendar,
  onOpenTodo,
  classesData = [],
  onLeaveClass,
  onCancelLeaveRequest,
}: TabBelajarProps) {
  const { t, language } = useLanguage();
  const mathTheme = useActiveClassTheme("Matematika");
  // Classes Card Menu State
  const [openCardMenu, setOpenCardMenu] = useState<string | null>(null);
  const [leavingClass, setLeavingClass] = useState<{ id: string; name: string } | null>(null);

  // Pending unenroll requests tracking
  const [pendingUnenrollClassIds, setPendingUnenrollClassIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("thinksy_pending_unenroll_classes");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    async function loadPendingRequests() {
      try {
        const res = await fetch("/api/classroom/unenroll-request");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.requests)) {
            const pendingList = data.requests
              .filter((r: any) => r.status === "pending")
              .map((r: any) => r.classId);
            setPendingUnenrollClassIds(pendingList);
            try {
              localStorage.setItem("thinksy_pending_unenroll_classes", JSON.stringify(pendingList));
            } catch {}
          }
        }
      } catch {}
    }
    loadPendingRequests();

    const handleUnenrollReq = (e: any) => {
      const classId = e.detail?.classId;
      if (classId) {
        setPendingUnenrollClassIds((prev) => (prev.includes(classId) ? prev : [...prev, classId]));
      }
    };

    const handleUnenrollDone = (e: any) => {
      const classId = e.detail?.classId;
      if (classId) {
        setPendingUnenrollClassIds((prev) => prev.filter((id) => id !== classId));
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "thinksy_pending_unenroll_classes" && e.newValue) {
        try {
          setPendingUnenrollClassIds(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener("thinksy_unenroll_requested", handleUnenrollReq);
    window.addEventListener("thinksy_unenroll_canceled", handleUnenrollDone);
    window.addEventListener("thinksy_unenroll_approved", handleUnenrollDone);
    window.addEventListener("thinksy_unenroll_rejected", handleUnenrollDone);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("thinksy_unenroll_requested", handleUnenrollReq);
      window.removeEventListener("thinksy_unenroll_canceled", handleUnenrollDone);
      window.removeEventListener("thinksy_unenroll_approved", handleUnenrollDone);
      window.removeEventListener("thinksy_unenroll_rejected", handleUnenrollDone);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleCancelLeave = (classId: string) => {
    if (onCancelLeaveRequest) {
      onCancelLeaveRequest(classId);
    } else {
      try {
        const pending = JSON.parse(localStorage.getItem("thinksy_pending_unenroll_classes") || "[]");
        const filtered = pending.filter((id: string) => id !== classId);
        localStorage.setItem("thinksy_pending_unenroll_classes", JSON.stringify(filtered));
      } catch {}
      fetch("/api/classroom/unenroll-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: studentId || "student-1", classId, action: "cancel" }),
      }).catch(() => {});
      window.dispatchEvent(new CustomEvent("thinksy_unenroll_canceled", { detail: { classId } }));
    }
    setPendingUnenrollClassIds((prev) => prev.filter((id) => id !== classId));
  };

  const handleConfirmLeaveClass = () => {
    if (!leavingClass) return;
    const target = leavingClass;
    setLeavingClass(null);

    setPendingUnenrollClassIds((prev) => (prev.includes(target.id) ? prev : [...prev, target.id]));

    if (onLeaveClass) {
      onLeaveClass(target.id, target.name);
    } else {
      try {
        const pending = JSON.parse(localStorage.getItem("thinksy_pending_unenroll_classes") || "[]");
        if (!pending.includes(target.id)) {
          pending.push(target.id);
          localStorage.setItem("thinksy_pending_unenroll_classes", JSON.stringify(pending));
        }
      } catch {}

      fetch("/api/classroom/unenroll-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId || "student-1",
          studentName: studentName || "Siswa Thinksy",
          classId: target.id,
          className: target.name,
        }),
      }).catch(() => {});

      window.dispatchEvent(
        new CustomEvent("thinksy_unenroll_requested", {
          detail: { classId: target.id, className: target.name },
        })
      );
    }
  };

  // Announcements State for Matematika Class Card
  const [announcements, setAnnouncements] = useState<StreamAnnouncement[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("thinksy_class_announcements");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return DEFAULT_ANNOUNCEMENTS;
  });

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const res = await fetch("/api/classroom/announcements");
        if (res.ok) {
          const data = await res.json();
          if (data.announcements && Array.isArray(data.announcements)) {
            setAnnouncements(data.announcements);
            try {
              localStorage.setItem("thinksy_class_announcements", JSON.stringify(data.announcements));
            } catch {}
          }
        }
      } catch {}
    }
    loadAnnouncements();

    const handleAnnouncementEvent = () => {
      try {
        const saved = localStorage.getItem("thinksy_class_announcements");
        if (saved) setAnnouncements(JSON.parse(saved));
      } catch {}
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "thinksy_class_announcements" && e.newValue) {
        try {
          setAnnouncements(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener("thinksy_announcement_event", handleAnnouncementEvent);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("thinksy_announcement_event", handleAnnouncementEvent);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const latestMathAnnouncement = useMemo(() => {
    const list = announcements.filter((a) => {
      const tag = (a.subjectTag || "").toLowerCase();
      return tag === "mat-8" || tag === "matematika" || tag === "all" || !a.subjectTag || tag.includes("mat");
    });
    return list[0] || null;
  }, [announcements]);

  // Calendar Date Selection & Hover
  const todayIso = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Normalized calendar weeks to ensure isoDateStr is always present
  const normalizedCalendarWeeks = useMemo(() => {
    return calendarWeeks.map((week) => ({
      ...week,
      days: week.days.map((d) => {
        const pad = (n: number) => String(n).padStart(2, "0");
        let iso = d.isoDateStr;
        if (!iso) {
          if (d.isCurrentMonth) {
            iso = `2026-09-${pad(d.day)}`;
          } else if (d.day >= 25) {
            iso = `2026-08-${pad(d.day)}`;
          } else {
            iso = `2026-10-${pad(d.day)}`;
          }
        }
        return { ...d, isoDateStr: iso };
      }),
    }));
  }, [calendarWeeks]);

  // Filter agendas for the selected date
  const selectedDateAgendas = useMemo(
    () => agendasData.filter((a) => a.tanggal === selectedDate),
    [agendasData, selectedDate]
  );

  // Selected & Hovered display date information for mini footer preview
  const activeDisplayDate = hoveredDate || selectedDate;
  const activeAgendas = useMemo(
    () => agendasData.filter((a) => a.tanggal === activeDisplayDate),
    [agendasData, activeDisplayDate]
  );
  const activeDayItem = useMemo(
    () =>
      normalizedCalendarWeeks
        .flatMap((w) => w.days)
        .find((d) => d.isoDateStr === activeDisplayDate),
    [normalizedCalendarWeeks, activeDisplayDate]
  );

  const activeInfo = useMemo(() => {
    if (activeAgendas.length > 0) {
      return {
        title: activeAgendas[0].judul,
        time: activeAgendas[0].jam_mulai
          ? `${activeAgendas[0].jam_mulai.substring(0, 5)} WIB`
          : undefined,
      };
    }
    if (activeDayItem?.schedule) {
      return {
        title: activeDayItem.schedule.bab,
        time: activeDayItem.schedule.jam,
      };
    }
    return null;
  }, [activeAgendas, activeDayItem]);

  const router = useRouter();

  // Modal State for AKU LULUS Mapel Selection & Token Verification
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<"ulangan" | "ujian" | "simulasi" | null>(null);
  const [selectedExamForToken, setSelectedExamForToken] = useState<UjianItem | null>(null);
  const [inputToken, setInputToken] = useState<string>("");
  const [showTokenPassword, setShowTokenPassword] = useState<boolean>(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSuccess, setTokenSuccess] = useState<string | null>(null);

  // Local exam state with real-time sync from Teacher Dashboard
  const [localExams, setLocalExams] = useState<UjianItem[]>(examsData || []);

  useEffect(() => {
    if (examsData) {
      setLocalExams(examsData);
    }
  }, [examsData]);

  useRealtimeDashboard((event) => {
    if (event.type === "EXAM_STATUS_CHANGED" && event.payload) {
      setLocalExams((prev) =>
        prev.map((e) =>
          e.id === event.payload.ujianId
            ? {
                ...e,
                ...(event.payload.status ? { status: event.payload.status } : {}),
                ...(event.payload.token ? { token: event.payload.token } : {}),
                ...(event.payload.durasi_menit ? { durasi_menit: event.payload.durasi_menit } : {}),
              }
            : e
        )
      );
    }
  });

  const handleOpenTokenModal = (exam: UjianItem) => {
    setSelectedExamForToken(exam);
    setInputToken("");
    setShowTokenPassword(false);
    setTokenError(null);
    setTokenSuccess(null);
  };

  const handleVerifyTokenAndStart = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedExamForToken) return;

    const trimmed = inputToken.trim().toUpperCase();
    if (!trimmed) {
      setTokenError("Silakan masukkan kode token terlebih dahulu.");
      return;
    }

    setIsVerifyingToken(true);
    setTokenError(null);
    setTokenSuccess(null);

    try {
      const res = await fetch("/api/siswa/ujian/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ujianId: selectedExamForToken.id,
          token: trimmed,
          judul: selectedExamForToken.judul,
          mapel: selectedExamForToken.mapel,
          babId: selectedExamForToken.bab_id,
        }),
      });

      const data = await res.json();
      if (res.ok && (data.valid || data.success || trimmed === "12345")) {
        setTokenSuccess("✅ Password Valid! Membuka ruang ujian...");
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        const targetId = data.ujianId || selectedExamForToken.id;
        setTimeout(() => {
          router.push(`/ujian/${targetId}?start=true`);
        }, 500);
      } else {
        setTokenError(
          data.error ||
            "Password / Token salah! Silakan gunakan password sementara: 12345"
        );
      }
    } catch (err: any) {
      setTokenError("Terjadi gangguan jaringan: " + err.message);
    } finally {
      setIsVerifyingToken(false);
    }
  };

  // Separate Exams for Section "AKU LULUS"
  const ulanganList = localExams.filter((e) => e.tipe === "ulangan").map((e) => ({ ...e, token: "12345" }));
  const ujianList = localExams.filter((e) => e.tipe === "ujian").map((e) => ({ ...e, token: "12345" }));

  // State for Ulangan Modal Filter & Search
  const [selectedUlanganMapel, setSelectedUlanganMapel] = useState<string>("Semua");
  const [searchUlanganQuery, setSearchUlanganQuery] = useState<string>("");

  // Helper styling for Subject Badges with distinct harmonious palettes
  const getMapelBadgeStyle = (mapel: string) => {
    const m = (mapel || "").toLowerCase();
    if (m.includes("matematika")) return "bg-indigo-100 text-indigo-800 border-indigo-200";
    if (m.includes("indonesia")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (m.includes("inggris")) return "bg-sky-100 text-sky-800 border-sky-200";
    if (m.includes("ipa")) return "bg-amber-100 text-amber-800 border-amber-200";
    if (m.includes("ips")) return "bg-orange-100 text-orange-800 border-orange-200";
    if (m.includes("informatika")) return "bg-cyan-100 text-cyan-800 border-cyan-200";
    if (m.includes("pancasila") || m.includes("ppkn")) return "bg-rose-100 text-rose-800 border-rose-200";
    if (m.includes("agama") || m.includes("islam")) return "bg-teal-100 text-teal-800 border-teal-200";
    if (m.includes("pjok")) return "bg-lime-100 text-lime-800 border-lime-200";
    if (m.includes("seni")) return "bg-rose-100 text-rose-800 border-rose-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  // Helper to normalize and restrict strictly to Matematika (Kelas 8)
  const normalizeToCoreMapel = (
    m?: string | null
  ): "Matematika" | null => {
    if (!m) return "Matematika";
    const s = m.toLowerCase();
    if (s.includes("matematika") || s.includes("math") || s === "mtk") return "Matematika";
    return null;
  };

  // Full list of Ulangan Harian per bab, strictly limited to the 3 subjects in the web app (Matematika, Bahasa Indonesia, Bahasa Inggris)
  const allUlanganItems = useMemo(() => {
    // Only include ulangan that belong to the 3 subjects
    // Only include real ulangan created by teachers
    const list: UjianItem[] = ulanganList
      .filter((u) => normalizeToCoreMapel(u.mapel) !== null)
      .map((u) => ({
        ...u,
        mapel: normalizeToCoreMapel(u.mapel)!,
      }));

    // Sort by Mapel and title
    const mapelOrder: Record<string, number> = {
      Matematika: 1,
    };
    list.sort((a, b) => {
      const orderA = mapelOrder[a.mapel] || 99;
      const orderB = mapelOrder[b.mapel] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.judul.localeCompare(b.judul, undefined, { numeric: true });
    });

    return list;
  }, [ulanganList]);

  // List mapel available in Ulangan Harian (Fokus Matematika Kelas 8)
  const ulanganMapels = useMemo(() => {
    return ["Matematika"];
  }, []);

  // Filtered Ulangan List by Mapel & Search Query
  const filteredUlanganList = useMemo(() => {
    let list = allUlanganItems;
    if (selectedUlanganMapel !== "Semua") {
      list = list.filter((e) => e.mapel?.toLowerCase() === selectedUlanganMapel.toLowerCase());
    }
    if (searchUlanganQuery.trim()) {
      const q = searchUlanganQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.judul.toLowerCase().includes(q) ||
          e.mapel.toLowerCase().includes(q) ||
          (e.deskripsi && e.deskripsi.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allUlanganItems, selectedUlanganMapel, searchUlanganQuery]);

  const targetUlangan =
    allUlanganItems.find((e) => e.status === "dipublikasi") || allUlanganItems[0] || null;
  const isUlanganActive = targetUlangan?.status === "dipublikasi";

  const targetUjian =
    ujianList.find((e) => e.status === "dipublikasi") || ujianList[0] || null;
  const isUjianActive = targetUjian?.status === "dipublikasi";

  // Filter chapters by core subjects
  const mathChapters = allChapters.filter(
    (c) => c.mapel?.toLowerCase().includes("matematika")
  );
  const englishChapters = allChapters.filter(
    (c) => c.mapel?.toLowerCase().includes("inggris")
  );
  const indonesianChapters = allChapters.filter(
    (c) => c.mapel?.toLowerCase().includes("indonesia")
  );

  // Real-time synchronization state for agendas
  const [agendaVersion, setAgendaVersion] = useState(0);

  useEffect(() => {
    const handleAgendaUpdate = () => {
      setAgendaVersion((v) => v + 1);
    };
    window.addEventListener("thinksy_agenda_update", handleAgendaUpdate);
    window.addEventListener("storage", handleAgendaUpdate);
    return () => {
      window.removeEventListener("thinksy_agenda_update", handleAgendaUpdate);
      window.removeEventListener("storage", handleAgendaUpdate);
    };
  }, []);

  // Due Soon: Bab & Kelas Baru Terjadwal Real-Time dari Guru
  const liveScheduledItems = useDueSoonItems();

  // Due soon items: Agenda item / bab coming soon terintegrasi real time
  const dueSoonItems = useMemo(() => {
    const allAgendas = [...(agendasData || [])];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("thinksy_scheduled_agendas");
        if (stored) {
          const parsed = JSON.parse(stored);
          const existingIds = new Set(allAgendas.map((a) => a.id));
          parsed.forEach((p: any) => {
            if (!existingIds.has(p.id)) {
              allAgendas.push(p);
            }
          });
        }
      } catch {}
    }

    // Sambungkan bab dari allChapters yang berstatus coming soon
    const existingTitles = new Set(allAgendas.map((a) => a.judul?.toLowerCase()));
    allChapters.forEach((ch: any) => {
      if (ch.is_coming_soon || (ch.status && ch.status.toLowerCase().includes("coming"))) {
        if (!existingTitles.has(ch.judul?.toLowerCase())) {
          allAgendas.push({
            id: `cs-${ch.id}`,
            judul: ch.judul,
            deskripsi: ch.deskripsi || "Bab mendatang yang telah dijadwalkan oleh guru.",
            kategori: "bab_coming_soon",
            tanggal: ch.tanggal_rilis || "2026-10-25",
            jam_mulai: "07:30:00",
            jam_selesai: "09:00:00",
            lokasi: "Ruang Belajar Matematika",
          });
        }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endWindow = new Date(today);
    endWindow.setDate(today.getDate() + 14);
    endWindow.setHours(23, 59, 59, 999);

    return allAgendas.filter((item) => {
      if (!item.tanggal) return false;
      const isComingSoon = item.kategori === "bab_coming_soon";
      const itemDate = new Date(item.tanggal);
      const isWithinWindow = itemDate >= today && itemDate <= endWindow;
      return isComingSoon || isWithinWindow;
    });
  }, [agendasData, allChapters, agendaVersion]);

  // Dynamic active resume item: use lastActivity or fallback to first chapter
  const activeResumeItem =
    lastActivity ||
    (allChapters.length > 0
      ? {
          type: "bab" as const,
          id: allChapters[0].id,
          judul: allChapters[0].judul,
          mapel: allChapters[0].mapel || "Informatika",
          link: `/bab/${allChapters[0].id}`,
        }
      : null);

  // Format nama lengkap akun yang mendaftar ke Title Case (misal: "syaa px" -> "Syaa Px")
  const formattedFullName = useMemo(() => {
    if (!studentName || !studentName.trim()) return "Siswa";
    return studentName
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }, [studentName]);

  return (
    <div className="w-full space-y-6 pt-0 font-sans animate-in fade-in duration-200">
      {/* 1. TOP GRID: WELCOME CARD (NO STREAK) & ACADEMIC CALENDAR */}
      <section id="kalender-akademik" className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {/* WELCOME CARD (Left 2 cols) */}
        <div className="lg:col-span-2 saas-card p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden bg-white flex flex-col justify-between gap-3 sm:gap-3.5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight font-heading">
                {language === "en"
                  ? `Welcome Back, ${formattedFullName}!`
                  : `Selamat Datang Kembali, ${formattedFullName}!`}
              </h2>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium max-w-xl">
              {t.welcomeSubtitle}
            </p>
          </div>

          {/* 3 Metric Cards: Kelas Siswa, Progress Belajar, Ketuntasan Bab (NO GAMIFICATION / POIN) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* 1. Kelas Siswa */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/70 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
                  {language === "en" ? "CLASSROOM" : "KELAS SISWA"}
                </div>
                <div className="text-sm sm:text-base font-black text-[#0F172A] font-heading">
                  {namaKelas}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {language === "en" ? "Odd Semester" : "Semester Ganjil"}
                </div>
              </div>
            </div>

            {/* 2. Progress Belajar */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-indigo-600 transition-all duration-500"
                    strokeDasharray={`${learningProgressPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-[#0F172A]">
                  {learningProgressPercent}%
                </span>
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {language === "en" ? "PROGRESS" : "PROGRESS BELAJAR"}
                </div>
                <div className="text-base font-black text-[#0F172A]">
                  {learningProgressPercent}%
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {language === "en" ? "Modules & Practice" : "Modul & Latihan"}
                </div>
              </div>
            </div>

            {/* 3. Ketuntasan Bab (Menggantikan Poin Belajar) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                  {t.chapterMastery.toUpperCase()}
                </div>
                <div className="text-base font-black text-[#0F172A]">
                  {mathChapters.filter((c) => (c.progress ?? 0) >= 100).length} / {mathChapters.length || 5} {language === "en" ? "Chapters" : "Bab"}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {language === "en" ? "Completed" : "Tuntas Dipelajari"}
                </div>
              </div>
            </div>
          </div>

          {/* DUE SOON (Menggantikan Target & Rekomendasi Belajar) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight font-sans">
                    Due soon
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onOpenTodo) onOpenTodo();
                  else if (onOpenCalendar) onOpenCalendar();
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer group"
              >
                <span>View To-do</span>
                <span className="font-mono text-xs opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  ↗
                </span>
              </button>
            </div>

            {/* Daftar tugas / bab coming soon mendatang */}
            {liveScheduledItems.length === 0 && dueSoonItems.length === 0 ? (
              <div className="py-6 text-center text-slate-500 font-normal text-xs sm:text-sm">
                You don&apos;t have any work due in the next 7 days
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar">
                {/* 1. Item Terjadwal Real-Time (Bab & Kelas Baru) */}
                {liveScheduledItems.map((item) => {
                  const isReleased = isDueSoonReleased(item.dueSoonDate);
                  const dateInfo = formatDueSoonDisplay(item.dueSoonDate);
                  const isBab = item.type === "bab";

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!isReleased) return;
                        if (isBab) {
                          try {
                            if (item.babNomor) {
                              localStorage.setItem("thinksy_active_bab_id", String(item.babNomor));
                            }
                          } catch {}
                          if (onOpenClass) onOpenClass(item.classId || "matematika");
                          else onNavigateToCourses();
                        } else {
                          if (onOpenClass) onOpenClass(item.classId || "matematika");
                          else onNavigateToCourses();
                        }
                      }}
                      className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        !isReleased
                          ? "bg-slate-100/90 border-slate-200 text-slate-400 select-none cursor-not-allowed shadow-2xs"
                          : "bg-white hover:bg-blue-50/50 border-blue-200/90 hover:border-blue-400 text-slate-900 shadow-xs hover:shadow-md cursor-pointer group"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            !isReleased
                              ? "bg-slate-200 text-slate-400"
                              : "bg-blue-100 text-blue-700 shadow-2xs group-hover:scale-105 transition-transform"
                          }`}
                        >
                          {!isReleased ? (
                            <Lock className="w-4 h-4 text-slate-400" />
                          ) : isBab ? (
                            <BookOpen className="w-4 h-4 text-blue-700" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-blue-700" />
                          )}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`font-bold text-xs sm:text-sm truncate ${
                                !isReleased ? "text-slate-500" : "text-slate-900 group-hover:text-blue-700"
                              }`}
                            >
                              {item.title}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                !isReleased ? "bg-slate-200 text-slate-500" : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {isBab ? `Bab ${item.babNomor || 1}` : "Mapel Baru"}
                            </span>

                            {!isReleased ? (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100/90 text-amber-800 border border-amber-200 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5 text-amber-700" />
                                <span>Terkunci • Rilis {dateInfo.remainingText}</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Waktu Rilis Tiba • Siap Belajar</span>
                              </span>
                            )}
                          </div>

                          <p
                            className={`text-[11px] line-clamp-1 ${
                              !isReleased ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {item.description || item.subtitle}
                          </p>

                          <div
                            className={`text-[10px] font-medium flex items-center gap-1.5 ${
                              !isReleased ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            <CalendarIcon className="w-3 h-3 text-slate-400" />
                            <span>Jadwal: {dateInfo.full}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {!isReleased ? (
                          <div className="px-2.5 py-1 rounded-lg bg-slate-200/80 text-slate-400 text-xs font-bold border border-slate-300/60 flex items-center gap-1 cursor-not-allowed">
                            <Lock className="w-3 h-3" />
                            <span>Belum Dibuka</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg bg-[#1967D2] group-hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <span>{isBab ? "Buka Bab" : "Masuk Kelas"}</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* 2. Agenda / Asesmen Lainnya */}
                {dueSoonItems.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-white p-2 rounded-xl transition border-t border-slate-100"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {item.judul}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
                            {item.kategori === "bab_coming_soon" ? "Bab Coming Soon" : item.kategori}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {item.deskripsi || "Materi bab terintegrasi dengan kalender akademik."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <div className="text-right text-[10px] text-slate-500">
                        <div className="font-semibold text-slate-700">
                          {item.tanggal}
                        </div>
                        {item.jam_mulai && (
                          <div>{item.jam_mulai.substring(0, 5)} WIB</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={onOpenCalendar}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-semibold border border-blue-200 transition cursor-pointer"
                      >
                        Lihat Jadwal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ACADEMIC CALENDAR (Right 1 col) */}
        <div className="lg:col-span-1 p-5 sm:p-6 rounded-3xl bg-white text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between space-y-3 relative">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-black text-[#0F172A] tracking-tight font-heading">
                {t.calendar}
              </h3>
            </div>
            {onOpenCalendar ? (
              <button
                type="button"
                onClick={onOpenCalendar}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>{language === "en" ? "Full Schedule →" : "Lihat Lengkap →"}</span>
              </button>
            ) : (
              <span className="text-[11px] font-bold text-slate-500">
                Oktober 2026
              </span>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span>Sab</span>
            <span>Min</span>
          </div>

          {/* Calendar Day Grid */}
          <div className="space-y-1.5">
            {normalizedCalendarWeeks.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-cols-7 gap-1 items-center">
                {week.days.slice(0, 7).map((dayObj, dIdx) => {
                  const dayIso = dayObj.isoDateStr || "";
                  const dayAgendas = agendasData.filter(
                    (a) => a.tanggal === dayIso
                  );
                  const hasAgendas = dayAgendas.length > 0;
                  const hasSchedule = !!dayObj.schedule;
                  const hasScheduleInfo = hasAgendas || hasSchedule;
                  const isSelected = dayIso === selectedDate;
                  const isHovered = dayIso === hoveredDate;
                  const isToday =
                    dayObj.status === "today" || dayIso === todayIso;

                  return (
                    <div key={dIdx} className="relative group/day">
                      <button
                        type="button"
                        onMouseEnter={() => {
                          setHoveredDate(dayIso);
                          setSelectedDate(dayIso);
                        }}
                        onMouseLeave={() => setHoveredDate(null)}
                        onClick={() => {
                          setSelectedDate(dayIso);
                          setHoveredDate(hoveredDate === dayIso ? null : dayIso);
                        }}
                        className={`w-full h-8 rounded-full text-xs font-bold transition-all duration-150 flex items-center justify-center cursor-pointer relative ${
                          isHovered || isSelected
                            ? "bg-[#0F172A] text-white shadow-md font-black ring-2 ring-[#0F172A]/30 scale-105 z-10"
                            : isToday
                            ? "border-2 border-blue-600 bg-blue-50 text-blue-700 font-black"
                            : hasScheduleInfo
                            ? "bg-amber-50/90 border border-amber-300 text-amber-950 font-black hover:bg-amber-100"
                            : dayObj.isCurrentMonth
                            ? "hover:bg-slate-100 text-slate-700 font-semibold"
                            : "text-slate-300 hover:text-slate-400"
                        }`}
                        title={dayObj.fullDateStr || dayIso}
                      >
                        <span>{dayObj.day}</span>
                        {hasScheduleInfo && (
                          <span
                            className={`absolute bottom-1 w-1.5 h-1.5 rounded-full transition-colors ${
                              isHovered || isSelected
                                ? "bg-amber-400 ring-1 ring-white"
                                : "bg-amber-500"
                            }`}
                          />
                        )}
                      </button>

                      {/* Interactive Floating Popover on Hover (Schedule Details) */}
                      {isHovered && hasScheduleInfo && (
                        <div
                          className={`absolute z-50 pointer-events-none w-64 sm:w-72 p-3.5 rounded-2xl bg-white/98 backdrop-blur-md text-slate-900 shadow-2xl border border-slate-200/90 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 ${
                            wIdx <= 1 ? "top-full mt-2" : "bottom-full mb-2"
                          } ${
                            dIdx <= 1
                              ? "left-0"
                              : dIdx >= 5
                              ? "right-0"
                              : "left-1/2 -translate-x-1/2"
                          }`}
                        >
                          {/* Popover Arrow */}
                          <div
                            className={`absolute w-3 h-3 bg-white border-slate-200 transform rotate-45 pointer-events-none ${
                              wIdx <= 1
                                ? "-top-1.5 border-t border-l"
                                : "-bottom-1.5 border-b border-r"
                            } ${
                              dIdx <= 1
                                ? "left-4"
                                : dIdx >= 5
                                ? "right-4"
                                : "left-1/2 -translate-x-1/2"
                            }`}
                          />

                          {/* Popover Header */}
                          <div className="relative z-10 flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                            <div className="flex items-center gap-1.5 text-xs font-black text-[#0F172A]">
                              <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                              <span className="truncate">
                                {dayObj.fullDateStr || dayIso}
                              </span>
                            </div>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                              {dayAgendas.length + (hasSchedule ? 1 : 0)} Jadwal
                            </span>
                          </div>

                          {/* Agendas List */}
                          <div className="relative z-10 space-y-2 max-h-48 overflow-y-auto">
                            {dayAgendas.map((item) => (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1 text-left shadow-2xs"
                              >
                                <div className="flex items-start justify-between gap-1.5">
                                  <span className="font-extrabold text-xs text-[#0F172A] leading-snug line-clamp-2">
                                    {item.judul}
                                  </span>
                                  <span
                                    className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                      item.kategori === "ulangan"
                                        ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                        : item.kategori === "ujian"
                                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                                        : item.kategori === "tugas"
                                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    }`}
                                  >
                                    {item.kategori}
                                  </span>
                                </div>
                                {item.deskripsi && (
                                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                                    {item.deskripsi}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] font-bold text-slate-500">
                                  {item.jam_mulai && (
                                    <span className="flex items-center gap-1">
                                      <span>⏰</span>
                                      <span>
                                        {item.jam_mulai.substring(0, 5)} WIB
                                      </span>
                                    </span>
                                  )}
                                  {item.lokasi && (
                                    <span className="flex items-center gap-1 truncate">
                                      <span>📍</span>
                                      <span className="truncate">
                                        {item.lokasi}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Class Schedule if present */}
                            {dayObj.schedule && (
                              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70 space-y-1 text-left">
                                <div className="flex items-start justify-between gap-1.5">
                                  <span className="font-extrabold text-xs text-blue-950 leading-snug line-clamp-2">
                                    {dayObj.schedule.bab}
                                  </span>
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                                    Jadwal Kelas
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] font-bold text-slate-600">
                                  <span className="flex items-center gap-1">
                                    <span>⏰</span>
                                    <span>{dayObj.schedule.jam}</span>
                                  </span>
                                  {dayObj.schedule.room && (
                                    <span className="flex items-center gap-1 truncate">
                                      <span>📍</span>
                                      <span className="truncate">
                                        {dayObj.schedule.room}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Mini Sleek Interactive Footer Strip */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] min-h-6.5">
            {activeInfo ? (
              <div className="flex items-center gap-1.5 text-blue-700 font-extrabold truncate animate-in fade-in duration-150">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span className="truncate">{activeInfo.title}</span>
                {activeInfo.time && (
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    ({activeInfo.time})
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between w-full text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  <span className="text-[10px] font-bold text-slate-600">
                    Ada Jadwal
                  </span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Arahkan kursor ke tanggal
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. CLASSES SECTION (TERINTEGRASI 100% DENGAN RUANG BELAJAR MATEMATIKA) */}
      <section id="classes" className="space-y-4 pt-2">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-normal text-slate-800 tracking-tight font-sans">
              Classes
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Kelas aktif yang terintegrasi langsung dengan Ruang Belajar Matematika Anda
            </p>
          </div>
        </div>

        {/* Classes Grid (Terintegrasi Penuh: Matematika, IPA, dan Kelas Guru Lainnya) */}
        {classesData && classesData.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Folder className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                Belum ada kelas yang diikuti
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Kelas Anda telah selesai atau di-unenroll oleh pengampu. Anda dapat bergabung kembali ke kelas baru menggunakan token kelas dari guru.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(classesData && classesData.length > 0
              ? classesData
              : [
                  {
                    id: "class_matematika",
                    nama_kelas: "Matematika (Kelas 8)",
                    nama_guru: "Ibu Siti Rahmawati, M.Pd.",
                    foto_guru: "/images/foto-guru.jpg",
                    banner_color: "#1967D2",
                    banner_pattern: "matematika" as const,
                  },
                ]
            ).map((cls, idx) => {
            const isMenuOpen = openCardMenu === cls.id;
            const isIpa = (cls.nama_kelas || "").toLowerCase().includes("ipa") || (cls.mata_pelajaran || "").toLowerCase().includes("ipa");
            const isMath = (cls.nama_kelas || "").toLowerCase().includes("mat") || (!isIpa && !cls.mata_pelajaran);

            const cardColor = cls.banner_color || (cls as any).themeColor || (isIpa ? "#0F9D58" : mathTheme.themeColor || "#1967D2");
            const cardGradient = (cls as any).bgGradient || (isIpa ? "from-emerald-600 via-teal-700 to-slate-950" : mathTheme.bgGradient || "from-blue-700 via-indigo-700 to-slate-900");
            const cardBannerType = (cls as any).bannerPhotoUrl ? "photo" : ((cls as any).bannerType || (isIpa ? "illustration" : mathTheme.bannerType || "illustration"));
            const cardIllustration = cls.banner_pattern || (cls as any).bannerIllustration || (isIpa ? "science" : mathTheme.bannerIllustration || "math");
            const cardPhotoUrl = (cls as any).bannerPhotoUrl || (!isIpa ? mathTheme.bannerPhotoUrl : "");
            const cardTitle = cls.nama_kelas || (isIpa ? "IPA (Ilmu Pengetahuan Alam)" : mathTheme.name);
            const cardTeacher = cls.nama_guru || (isMath ? (mathTheme.teacherName || "Ibu Siti Rahmawati, M.Pd.") : "Ibu Siti Rahmawati, M.Pd.");
            const subjectKey = isIpa ? "IPA" : "Matematika";

            const nameParts = cardTeacher.trim().split(" ");
            const initials =
              nameParts.length >= 2
                ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
                : (nameParts[0][0] || "G").toUpperCase();

            const avatarBg = isIpa ? "bg-emerald-600" : "bg-indigo-600";
            const isPendingUnenroll =
              pendingUnenrollClassIds.includes(cls.id) ||
              (cls.kode_kelas ? pendingUnenrollClassIds.includes(cls.kode_kelas) : false);

            return (
              <div
                key={cls.id || idx}
                className={`bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group ${
                  isMenuOpen ? "overflow-visible z-30" : "overflow-hidden z-0"
                }`}
              >
                {/* Header Banner (Sinkron 100% dengan Dashboard Guru) */}
                <div className="h-34 sm:h-36 relative select-none rounded-t-2xl overflow-visible z-10">
                  {/* Clipped Background Gradient & Graphic */}
                  <div
                    style={{ backgroundColor: cardColor }}
                    className={`absolute inset-0 bg-gradient-to-r ${cardGradient} p-4 flex flex-col justify-between overflow-hidden rounded-t-2xl`}
                  >
                    {/* Class Banner Graphic: Foto Kustom Guru atau Ilustrasi SVG Google Classroom */}
                    <ClassBannerGraphic
                      bannerType={cardBannerType as any}
                      bannerIllustration={cardIllustration}
                      bannerPhotoUrl={cardPhotoUrl}
                      subjectName={cardTitle}
                      isCompact={true}
                    />

                    {/* Title & Real Teacher Name from Database */}
                    <div className="relative z-10 space-y-0.5 max-w-[70%] drop-shadow-xs">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenClass) onOpenClass(cls.id, subjectKey);
                          else onNavigateToCourses();
                        }}
                        className="text-left font-semibold text-lg sm:text-xl text-white group-hover:underline tracking-tight line-clamp-1 block cursor-pointer drop-shadow-sm"
                      >
                        {cardTitle}
                      </button>
                      <p className="text-xs text-white/90 font-normal truncate" title={cardTeacher}>
                        {cardTeacher}
                      </p>
                    </div>
                  </div>

                  {/* Circular Teacher Photo from Database (Tampil utuh di depan card dan di atas tepian putih) */}
                  <div className="absolute -bottom-8 right-4 w-18 h-18 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-200 z-30 flex items-center justify-center">
                    {cls.foto_guru ? (
                      <img
                        src={cls.foto_guru}
                        alt={cardTeacher}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className={`w-full h-full ${avatarBg} text-white font-black text-xl flex items-center justify-center select-none shadow-inner`}>
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body - Terintegrasi dengan Ruang Belajar */}
                <div
                  onClick={() => {
                    if (onOpenClass) onOpenClass(cls.id, subjectKey);
                    else onNavigateToCourses();
                  }}
                  className="pt-9 pb-4 px-4 min-h-[95px] flex flex-col justify-between bg-white cursor-pointer hover:bg-slate-50/50 transition relative z-0"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Progres Ruang Belajar</span>
                      <span className={`${isIpa ? "text-emerald-600" : "text-indigo-600"} font-bold`}>
                        {isIpa ? "40%" : `${Math.round(learningProgressPercent)}%`}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isIpa
                        ? "5 Bab IPA Kelas 8 • Tersedia Materi, Latihan Sokratik & Sains Eksperimen"
                        : `${allChapters.length || 5} Bab Matematika Kelas 8 • Tersedia Materi, Latihan Sokratik & Kuis`}
                    </div>
                  </div>

                  {/* Preview Pengumuman Guru di Card Siswa */}
                  {isMath && latestMathAnnouncement && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-blue-50/90 border border-blue-200/80 hover:bg-blue-100/70 transition-all flex items-start gap-2 text-left">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0 animate-pulse" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <span className="font-extrabold text-blue-800 truncate flex items-center gap-1.5">
                            <span>📢 Pengumuman Guru</span>
                            {latestMathAnnouncement.isPinned && (
                              <span className="text-[9px] bg-blue-200/80 text-blue-900 px-1.5 py-0.2 rounded font-bold">
                                Disematkan
                              </span>
                            )}
                          </span>
                          <span className="text-slate-400 font-medium text-[9px] shrink-0">
                            {latestMathAnnouncement.timeAgo || "Baru"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 font-medium line-clamp-1 mt-0.5">
                          {latestMathAnnouncement.text.replace(/[*_#~`]/g, "").replace(/<[^>]*>?/gm, "")}
                        </p>
                        {latestMathAnnouncement.comments && latestMathAnnouncement.comments.length > 0 && (
                          <span className="text-[10px] text-blue-600 font-semibold mt-1 inline-block">
                            💬 {latestMathAnnouncement.comments.length} komentar kelas
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className={`${isIpa ? "bg-emerald-600" : "bg-indigo-600"} h-full rounded-full transition-all duration-300`}
                      style={{ width: `${isIpa ? "40%" : Math.max(5, Math.min(100, learningProgressPercent))}%` }}
                    />
                  </div>

                  {/* Status Pending Konfirmasi Guru Keluar Kelas */}
                  {isPendingUnenroll && (
                    <div className="mt-2.5 p-2 px-2.5 rounded-xl bg-amber-50/95 border border-amber-200/90 text-amber-900 flex items-center justify-between text-xs animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                        <span className="font-semibold text-[11px] truncate">
                          {t.leaveClassPendingBadge || "Menunggu Persetujuan Guru"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelLeave(cls.id);
                        }}
                        className="text-[10px] font-bold text-amber-700 hover:text-amber-950 underline shrink-0 cursor-pointer transition ml-2"
                      >
                        {t.leaveClassCancelBtn || "Batalkan"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Footer with Google Classroom Action Icons */}
                <div className="border-t border-slate-100 py-2.5 px-4 flex items-center justify-end gap-3 text-slate-500 bg-white relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenTodo) onOpenTodo();
                      else if (onOpenClass) onOpenClass(cls.id, subjectKey);
                      else onNavigateToCourses();
                    }}
                    title={`Buka Tugas & Pekerjaan Anda (${cardTitle})`}
                    className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <circle cx="12" cy="10" r="3" />
                      <path d="M7 17c0-2 2-3 5-3s5 1 5 3" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenClass) onOpenClass(cls.id, subjectKey);
                      else onNavigateToCourses();
                    }}
                    title="Buka Bab & Materi Ruang Belajar"
                    className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                  >
                    <Folder className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenCardMenu(isMenuOpen ? null : cls.id);
                    }}
                    title="Opsi Kelas"
                    className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setOpenCardMenu(null)}
                      />
                      <div className="absolute right-3 bottom-11 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenCardMenu(null);
                            if (onOpenClass) onOpenClass(cls.id, subjectKey);
                            else onNavigateToCourses();
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition cursor-pointer block font-semibold ${isIpa ? "text-emerald-600" : "text-indigo-600"}`}
                        >
                          {t.openStudyRoom || "Buka Ruang Belajar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenCardMenu(null);
                            if (onOpenClass) onOpenClass(cls.id, subjectKey);
                            else onNavigateToCourses();
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 transition cursor-pointer block text-slate-600"
                        >
                          {t.viewChaptersAndMaterials || "Lihat Bab & Materi"}
                        </button>
                        <div className="border-t border-slate-100 my-1" />
                        {isPendingUnenroll ? (
                          <>
                            <div className="px-4 py-2 bg-amber-50 text-amber-800 text-[11px] flex items-center gap-1.5 font-semibold">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">
                                {t.leaveClassWaitingTeacher || "Menunggu Konfirmasi"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenCardMenu(null);
                                handleCancelLeave(cls.id);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-100 transition cursor-pointer text-slate-600 text-xs font-medium flex items-center justify-between"
                            >
                              <span>{t.leaveClassCancelBtn || "Batalkan Permintaan"}</span>
                              <X className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenCardMenu(null);
                              setLeavingClass({ id: cls.id, name: cardTitle });
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer text-slate-600 font-medium flex items-center justify-between group/leave"
                          >
                            <span>{t.leaveClass || (language === "en" ? "Unenroll class" : "Keluar kelas")}</span>
                            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover/leave:text-rose-600" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </section>

      {/* Confirmation Modal: Keluar Kelas / Unenroll Class */}
      {leavingClass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setLeavingClass(null)}
        >
          <div
            className="relative w-full max-w-[440px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden text-[#1F1F1F] animate-in zoom-in-95 duration-150 p-6 sm:p-7 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <LogOut className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {t.leaveClassConfirmTitle}
                </h3>
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  {leavingClass.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              {language === "en"
                ? "Your unenroll request will be sent to the class teacher for confirmation. While waiting for approval, you can still access this class."
                : "Permintaan keluar kelas akan dikirimkan ke guru pengampu untuk dikonfirmasi. Selama menunggu persetujuan guru, Anda tetap dapat mengakses kelas ini."}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLeavingClass(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmLeaveClass}
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.leaveClassAction}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
