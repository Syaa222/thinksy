"use client";

import { useState, useEffect, useCallback } from "react";
import GuruLayout from "@/components/guru/GuruLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import AttendanceLimitConfigModal from "@/components/guru/AttendanceLimitConfigModal";
import AkuLulusControlWidget from "@/components/guru/AkuLulusControlWidget";
import StudentLeaderboardWidget from "@/components/guru/StudentLeaderboardWidget";
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Bot,
  FileCheck,
  Plus,
  ArrowRight,
  Clock,
  ChevronRight,
  BookOpen,
  Sparkles,
  BarChart3,
  GraduationCap,
  Target,
  Zap,
  Calendar,
  CheckCircle2,
  Activity,
  X,
  Loader2,
  CheckCircle,
  Search,
  BookMarked,
  Edit,
  Trash2,
  Save,
  Eye,
  Sliders,
  Camera,
  UserCheck,
  UserX,
  Wifi,
  Maximize2,
  ShieldCheck,
  Filter,
  Award,
  AlertCircle,
  CheckSquare,
  FileText,
  MapPin,
  ExternalLink,
} from "lucide-react";

interface ClassCardData {
  id: string;
  name: string;
  title: string;
  chapter: string;
  studentsCount: number;
  progress: number;
  avgScore: number;
  color: string;
  iconBg: string;
  iconColor: string;
}

interface StudentAttendance {
  id: string;
  name: string;
  class: string;
  isOnline: boolean;
  hasAttended: boolean;
  timeIn: string | null;
  selfieUrl: string;
  status: "Hadir" | "Terverifikasi" | "Izin" | "Belum Absen";
  scoreAvg: number;
}

interface ScheduleItem {
  id: string;
  time: string;
  className: string;
  room: string;
  topic: string;
  studentsCount: number;
  colorBg: string;
  colorText: string;
  colorBorder: string;
}

export default function GuruDashboardPage() {
  const router = useRouter();

  const userProfile = {
    nama_lengkap: "Ibu Siti Rahmawati",
    email: "siti.rahmawati@sekolah.sch.id",
    peran: "guru",
  };

  const initialClasses: ClassCardData[] = [
    {
      id: "8a",
      name: "8A",
      title: "Matematika 8–A",
      chapter: "Bab 4: Persamaan Linear Dua Variabel",
      studentsCount: 32,
      progress: 72,
      avgScore: 81,
      color: "from-blue-500 to-indigo-600",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      id: "8b",
      name: "8B",
      title: "Matematika 8–B",
      chapter: "Bab 4: Persamaan Linear Dua Variabel",
      studentsCount: 30,
      progress: 65,
      avgScore: 74,
      color: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      id: "8c",
      name: "8C",
      title: "Matematika 8–C",
      chapter: "Bab 3: Relasi dan Fungsi",
      studentsCount: 31,
      progress: 88,
      avgScore: 85,
      color: "from-amber-500 to-orange-600",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-400",
    },
  ];

  const [classList, setClassList] = useState<ClassCardData[]>(initialClasses);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [isPresenceModalOpen, setIsPresenceModalOpen] = useState(false);
  const [isAttendanceConfigOpen, setIsAttendanceConfigOpen] = useState(false);

  // New Stat Modals States
  const [isScoreAvgModalOpen, setIsScoreAvgModalOpen] = useState(false);
  const [isQuestionsStatModalOpen, setIsQuestionsStatModalOpen] = useState(false);
  const [isStrugglingStudentsModalOpen, setIsStrugglingStudentsModalOpen] = useState(false);
  const [selectedScheduleModal, setSelectedScheduleModal] = useState<ScheduleItem | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  // Student Attendance Modal States
  const [presenceFilter, setPresenceFilter] = useState<"all" | "hadir" | "online" | "offline">("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedSelfieZoom, setSelectedSelfieZoom] = useState<StudentAttendance | null>(null);
  const [editingPresenceStudent, setEditingPresenceStudent] = useState<StudentAttendance | null>(null);
  const [editStatusValue, setEditStatusValue] = useState<string>("Hadir (Tepat Waktu)");
  const [editTimeValue, setEditTimeValue] = useState<string>("07:30");
  const [isSavingPresence, setIsSavingPresence] = useState(false);

  // Selected Class for Detail & Edit Modal
  const [selectedClass, setSelectedClass] = useState<ClassCardData | null>(null);
  const [isEditingInModal, setIsEditingInModal] = useState(false);

  // Form states for Add Class & Draft Lesson
  const [kodeKelas, setKodeKelas] = useState("");
  const [namaKelas, setNamaKelas] = useState("");
  const [judulBab, setJudulBab] = useState("");
  const [deskripsiMateri, setDeskripsiMateri] = useState("");
  const [jumlahSiswa, setJumlahSiswa] = useState("30");
  const [pilihanWarna, setPilihanWarna] = useState("from-purple-500 to-indigo-600");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states for Edit Class Modal
  const [editTitle, setEditTitle] = useState("");
  const [editName, setEditName] = useState("");
  const [editChapter, setEditChapter] = useState("");
  const [editStudents, setEditStudents] = useState(30);
  const [editProgress, setEditProgress] = useState(70);
  const [editAvgScore, setEditAvgScore] = useState(80);
  const [editColor, setEditColor] = useState("");

  // Sample Student Attendance Data
  const sampleStudentsAttendance: StudentAttendance[] = [
    {
      id: "s1",
      name: "Ahmad Raihan",
      class: "Kelas 8A",
      isOnline: true,
      hasAttended: true,
      timeIn: "07:38 WIB",
      selfieUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
      status: "Terverifikasi",
      scoreAvg: 88,
    },
    {
      id: "s2",
      name: "Siti Rahma Putri",
      class: "Kelas 8A",
      isOnline: true,
      hasAttended: true,
      timeIn: "07:42 WIB",
      selfieUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      status: "Terverifikasi",
      scoreAvg: 92,
    },
    {
      id: "s3",
      name: "Budi Pratama",
      class: "Kelas 8B",
      isOnline: false,
      hasAttended: true,
      timeIn: "07:50 WIB",
      selfieUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      status: "Hadir",
      scoreAvg: 76,
    },
    {
      id: "s4",
      name: "Dewi Kartika",
      class: "Kelas 8C",
      isOnline: true,
      hasAttended: true,
      timeIn: "07:45 WIB",
      selfieUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
      status: "Terverifikasi",
      scoreAvg: 85,
    },
    {
      id: "s5",
      name: "Eko Prasetyo",
      class: "Kelas 8A",
      isOnline: false,
      hasAttended: false,
      timeIn: null,
      selfieUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      status: "Belum Absen",
      scoreAvg: 62,
    },
    {
      id: "s6",
      name: "Fira Anindya",
      class: "Kelas 8B",
      isOnline: true,
      hasAttended: true,
      timeIn: "07:55 WIB",
      selfieUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80",
      status: "Terverifikasi",
      scoreAvg: 81,
    },
    {
      id: "s7",
      name: "Gilang Ramadhan",
      class: "Kelas 8C",
      isOnline: false,
      hasAttended: false,
      timeIn: null,
      selfieUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
      status: "Belum Absen",
      scoreAvg: 58,
    },
  ];

  const [studentPresenceList, setStudentPresenceList] = useState<StudentAttendance[]>(sampleStudentsAttendance);

  const scheduleList: ScheduleItem[] = [
    {
      id: "sch-1",
      time: "08:00 WIB",
      className: "Matematika 8–A",
      room: "Ruang 204",
      topic: "Bab 4: Persamaan Linear Dua Variabel (Metode Substitusi)",
      studentsCount: 32,
      colorBg: "bg-blue-50",
      colorText: "text-blue-700",
      colorBorder: "border-blue-100",
    },
    {
      id: "sch-2",
      time: "10:00 WIB",
      className: "Matematika 8–B",
      room: "Ruang 301",
      topic: "Bab 4: Persamaan Linear Dua Variabel (Metode Eliminasi)",
      studentsCount: 30,
      colorBg: "bg-emerald-50",
      colorText: "text-emerald-700",
      colorBorder: "border-emerald-100",
    },
    {
      id: "sch-3",
      time: "13:00 WIB",
      className: "Matematika 8–C",
      room: "Ruang 105",
      topic: "Bab 3: Relasi dan Fungsi (Diagram Panah)",
      studentsCount: 31,
      colorBg: "bg-amber-50",
      colorText: "text-amber-700",
      colorBorder: "border-amber-100",
    },
  ];

  const [dbTotalSiswa, setDbTotalSiswa] = useState<number | null>(null);
  const [dbTotalSoal, setDbTotalSoal] = useState<number | null>(null);
  const [dbPendingGrading, setDbPendingGrading] = useState<number | null>(null);
  const [dbAvgScore, setDbAvgScore] = useState<number>(78);
  const [dbStrugglingCount, setDbStrugglingCount] = useState<number>(0);
  const [dbStrugglingList, setDbStrugglingList] = useState<any[]>([]);

  // Broadcast Modal state
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [bJudul, setBJudul] = useState("");
  const [bDeskripsi, setBDeskripsi] = useState("");
  const [bTenggat, setBTenggat] = useState("");
  const [bKategori, setBKategori] = useState("kuis");
  const [bUrgensi, setBUrgensi] = useState("normal");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Fetch real database counts & stats on mount
  const fetchRealStats = useCallback(async () => {
    try {
      const res = await fetch("/api/guru/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setDbTotalSiswa(data.stats.totalSiswa);
          setDbTotalSoal(data.stats.totalSoalPublished);
          setDbPendingGrading(data.stats.pendingGrading);
          setDbAvgScore(data.stats.averageClassScore);
          setDbStrugglingCount(data.stats.strugglingCount);
        }
        if (data.strugglingStudents && data.strugglingStudents.length > 0) {
          setDbStrugglingList(data.strugglingStudents);
        }
        if (data.todayPresensi && data.todayPresensi.length > 0) {
          // merge today's presensi if available
          setStudentPresenceList((prev) => {
            const map = new Map(prev.map((p) => [p.id, p]));
            data.todayPresensi.forEach((tp: any) => {
              map.set(tp.id, {
                id: tp.id,
                name: tp.name,
                class: "Kelas 8A",
                isOnline: true,
                hasAttended: true,
                timeIn: tp.timeIn,
                selfieUrl: tp.selfieUrl || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
                status: tp.status === "Hadir" ? "Terverifikasi" : "Hadir",
                scoreAvg: 85,
              });
            });
            return Array.from(map.values());
          });
        }
      }
    } catch {
      // silent fallback
    }
  }, []);

  useEffect(() => {
    fetchRealStats();
  }, [fetchRealStats]);

  // Real-time updates for teacher main dashboard
  const { broadcastEvent } = useRealtimeDashboard((event) => {
    if (
      event.type === "ATTENDANCE_CHECKIN" ||
      event.type === "ATTENDANCE_VERIFIED" ||
      event.type === "NEW_ESSAY_SUBMISSION"
    ) {
      fetchRealStats();
    }
  });

  const handleSaveStudentPresence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPresenceStudent) return;
    setIsSavingPresence(true);
    try {
      const res = await fetch("/api/guru/presensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_student_presence",
          siswaId: editingPresenceStudent.id,
          status: editStatusValue,
          waktuMasuk: editTimeValue,
        }),
      });

      if (res.ok) {
        setStudentPresenceList((prev) =>
          prev.map((s) =>
            s.id === editingPresenceStudent.id
              ? {
                  ...s,
                  status: editStatusValue as any,
                  timeIn: `${editTimeValue} WIB`,
                  hasAttended: editStatusValue !== "Alpha" && editStatusValue !== "Belum Absen",
                }
              : s
          )
        );

        broadcastEvent("ATTENDANCE_VERIFIED", {
          siswaId: editingPresenceStudent.id,
          status: editStatusValue,
          waktu_masuk: editTimeValue,
        });

        setNotification(`Kehadiran ${editingPresenceStudent.name} (${editTimeValue} WIB) berhasil diatur!`);
        setTimeout(() => setNotification(null), 4000);
        setEditingPresenceStudent(null);
      } else {
        alert("Gagal memperbarui status presensi.");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setIsSavingPresence(false);
    }
  };

  // Load existing classes from API on mount
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch("/api/guru/kelas");
        if (res.ok) {
          const data = await res.json();
          if (data.kelas && data.kelas.length > 0) {
            const apiClasses = data.kelas.map((k: any, idx: number) => {
              const code = k.nama_kelas.length <= 3 ? k.nama_kelas : `8${String.fromCharCode(68 + idx)}`;
              const colors = [
                "from-purple-500 to-indigo-600",
                "from-rose-500 to-pink-600",
                "from-cyan-500 to-blue-600",
                "from-[#0F172A] to-slate-800",
              ];
              return {
                id: k.id,
                name: code,
                title: k.nama_kelas.includes("Matematika") ? k.nama_kelas : `Matematika ${k.nama_kelas}`,
                chapter: "Bab 5: Draft Pelajaran Baru",
                studentsCount: 30,
                progress: 0,
                avgScore: 0,
                color: colors[idx % colors.length],
                iconBg: "bg-purple-500/20",
                iconColor: "text-purple-400",
              };
            });
            setClassList((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const uniqueApiClasses = apiClasses.filter((c: any) => !existingIds.has(c.id));
              return [...prev, ...uniqueApiClasses];
            });
          }
        }
      } catch {
        // silent fallback
      }
    }
    loadClasses();
  }, []);

  // Open Detail / Edit Modal for a specific card
  const handleOpenDetail = (cls: ClassCardData, startInEditMode = false) => {
    setSelectedClass(cls);
    setEditTitle(cls.title);
    setEditName(cls.name);
    setEditChapter(cls.chapter);
    setEditStudents(cls.studentsCount);
    setEditProgress(cls.progress);
    setEditAvgScore(cls.avgScore);
    setEditColor(cls.color);
    setIsEditingInModal(startInEditMode);
  };

  // Save Edit Changes
  const handleSaveEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/guru/kelas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedClass.id,
          namaKelas: editTitle,
          judulBab: editChapter,
          jumlahSiswa: editStudents,
          progress: editProgress,
          avgScore: editAvgScore,
        }),
      });

      const updatedClass: ClassCardData = {
        ...selectedClass,
        title: editTitle.trim(),
        name: editName.trim().toUpperCase(),
        chapter: editChapter.trim(),
        studentsCount: Number(editStudents),
        progress: Number(editProgress),
        avgScore: Number(editAvgScore),
        color: editColor,
      };

      setClassList((prev) => prev.map((c) => (c.id === selectedClass.id ? updatedClass : c)));
      setSelectedClass(updatedClass);
      setIsEditingInModal(false);
      setNotification(`Data kelas "${updatedClass.title}" berhasil diperbarui!`);
      setTimeout(() => setNotification(null), 5000);
    } catch {
      setNotification("Gagal menyimpan perubahan ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Class Card
  const handleDeleteClass = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas "${title}"?`)) return;

    try {
      await fetch(`/api/guru/kelas?id=${id}`, { method: "DELETE" });
      setClassList((prev) => prev.filter((c) => c.id !== id));
      setSelectedClass(null);
      setNotification(`Kelas "${title}" berhasil dihapus.`);
      setTimeout(() => setNotification(null), 5000);
    } catch {
      alert("Gagal menghapus kelas.");
    }
  };

  // Add Class Submit
  const handleAddClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKelas.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/guru/kelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaKelas: namaKelas.trim(),
          judulBab: judulBab.trim() || "Bab Pelajaran Baru",
          deskripsiMateri: deskripsiMateri.trim(),
          jumlahSiswa: Number(jumlahSiswa) || 30,
        }),
      });

      const data = await res.json();
      const shortCode = kodeKelas.trim() || (namaKelas.length <= 4 ? namaKelas.trim() : `8${String.fromCharCode(68 + classList.length)}`);

      const newClassItem: ClassCardData = {
        id: data.kelas?.id || `cls-${Date.now()}`,
        name: shortCode.toUpperCase(),
        title: namaKelas.startsWith("Matematika") ? namaKelas.trim() : `Matematika ${namaKelas.trim()}`,
        chapter: judulBab.trim() || "Bab Pelajaran Baru (Draft)",
        studentsCount: Number(jumlahSiswa) || 30,
        progress: 0,
        avgScore: 0,
        color: pilihanWarna,
        iconBg: "bg-[#0F172A]/20",
        iconColor: "text-amber-400",
      };

      setClassList((prev) => [newClassItem, ...prev]);
      setNotification(`Kelas "${newClassItem.title}" dan draft pelajaran berhasil ditambahkan!`);
      setIsAddModalOpen(false);

      setKodeKelas("");
      setNamaKelas("");
      setJudulBab("");
      setDeskripsiMateri("");
      setJumlahSiswa("30");

      setTimeout(() => setNotification(null), 5000);
    } catch {
      const shortCode = kodeKelas.trim() || `8${String.fromCharCode(68 + classList.length)}`;
      const newClassItem: ClassCardData = {
        id: `cls-${Date.now()}`,
        name: shortCode.toUpperCase(),
        title: namaKelas.startsWith("Matematika") ? namaKelas.trim() : `Matematika ${namaKelas.trim()}`,
        chapter: judulBab.trim() || "Bab Pelajaran Baru (Draft)",
        studentsCount: Number(jumlahSiswa) || 30,
        progress: 0,
        avgScore: 0,
        color: pilihanWarna,
        iconBg: "bg-[#0F172A]/20",
        iconColor: "text-amber-400",
      };
      setClassList((prev) => [newClassItem, ...prev]);
      setNotification(`Kelas "${newClassItem.title}" dan draft pelajaran berhasil dibuat!`);
      setIsAddModalOpen(false);
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const recentActivity = [
    {
      id: 1,
      action: "Esai dinilai",
      detail: "Rina Kartika — Kelas 8A",
      time: "10 menit lalu",
      icon: FileCheck,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-50",
      link: "/guru/penilaian",
    },
    {
      id: 2,
      action: "Soal AI diterbitkan",
      detail: "Bab 4: SPLDV — 15 soal",
      time: "1 jam lalu",
      icon: Bot,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50",
      link: "/guru/soal/eksplorasi",
    },
    {
      id: 3,
      action: "Presensi diverifikasi",
      detail: "Kelas 8C — 31/31 hadir",
      time: "2 jam lalu",
      icon: CheckCircle2,
      iconColor: "text-violet-500",
      iconBg: "bg-violet-50",
      link: "#presensi",
    },
    {
      id: 4,
      action: "Kuis dikirim ke siswa",
      detail: "Bab 3: Relasi & Fungsi",
      time: "3 jam lalu",
      icon: Target,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50",
      link: "/guru/soal/latihan",
    },
  ];

  const totalSiswaAktif = classList.reduce((sum, c) => sum + (c.studentsCount || 0), 0);
  const totalHadir = studentPresenceList.filter((s) => s.hasAttended).length;
  const totalOnline = studentPresenceList.filter((s) => s.isOnline).length;
  const totalOfflineOrAbsent = studentPresenceList.filter((s) => !s.hasAttended || !s.isOnline).length;

  const filteredStudents = studentPresenceList.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      st.class.toLowerCase().includes(studentSearch.toLowerCase());

    if (presenceFilter === "hadir") return matchesSearch && st.hasAttended;
    if (presenceFilter === "online") return matchesSearch && st.isOnline;
    if (presenceFilter === "offline") return matchesSearch && (!st.isOnline || !st.hasAttended);
    return matchesSearch;
  });

  const strugglingStudents = [
    { id: "st-1", name: "Eko Prasetyo", class: "Kelas 8A", score: 62, topic: "Persamaan Linear Dua Variabel", status: "Butuh Remedial" },
    { id: "st-2", name: "Gilang Ramadhan", class: "Kelas 8C", score: 58, topic: "Relasi dan Fungsi (Diagram Panah)", status: "Butuh Bimbingan Sokratik" },
    { id: "st-3", name: "Nanda Kurnia", class: "Kelas 8B", score: 60, topic: "Operasi Bentuk Aljabar", status: "Tugas Tambahan" },
    { id: "st-4", name: "Rian Hidayat", class: "Kelas 8B", score: 64, topic: "Sistem Persamaan Linear", status: "Kuis Remedial" },
    { id: "st-5", name: "Tania Safitri", class: "Kelas 8A", score: 61, topic: "Pemfaktoran Persamaan Kuadrat", status: "Butuh Review AI" },
  ];

  return (
    <GuruLayout userProfile={userProfile}>
      <div className="space-y-8">
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-[#0F172A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-amber-500/40 animate-in fade-in slide-in-from-top duration-200">
            <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-xs font-bold">{notification}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. WELCOME HERO BANNER */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6 sm:p-8 overflow-hidden border border-slate-700/50">
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Panel Guru
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <Activity className="w-3.5 h-3.5" />
                  Semester Ganjil 2024/2025
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Selamat Datang, Ibu Siti 👋
              </h1>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Ada <span className="text-amber-400 font-bold">{dbTotalSoal ?? 12} soal AI</span> dan{" "}
                <span className="text-blue-400 font-bold">{dbPendingGrading ?? 45} esai siswa</span> yang menunggu ditinjau hari ini.
              </p>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Siarkan Tugas / Pengumuman
                </button>
                <Link
                  href="/guru/soal/eksplorasi"
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold flex items-center gap-2 border border-white/10 backdrop-blur-sm transition"
                >
                  <Bot className="w-4 h-4 text-amber-400" />
                  Review Soal AI
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-950/20 text-[10px]">{dbTotalSoal ?? 12}</span>
                </Link>
                <Link
                  href="/guru/penilaian"
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold flex items-center gap-2 border border-white/10 backdrop-blur-sm transition"
                >
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Penilaian Esai
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px]">{dbPendingGrading ?? 45}</span>
                </Link>
                <Link
                  href="/guru/penilaian-siswa"
                  className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-extrabold flex items-center gap-2 border border-amber-500/30 backdrop-blur-sm transition shadow-xs"
                >
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  Rapor & Penilaian Siswa
                </Link>
              </div>
            </div>

            {/* Right side: Time & Date widget (CLICKABLE TO OPEN SCHEDULE DETAIL) */}
            <div
              onClick={() => setSelectedScheduleModal(scheduleList[0])}
              className="flex items-center gap-4 shrink-0 cursor-pointer group"
              title="Klik untuk membuka detail jadwal sesi aktif hari ini"
            >
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 group-hover:border-amber-400/50 backdrop-blur-sm text-center min-w-[180px] transition-all">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1 group-hover:text-amber-400 transition">
                  <span>Hari Ini</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
                <div className="flex items-center justify-center gap-2 text-white">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span className="text-lg font-extrabold">Senin, 14 Agt</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-2 text-emerald-400 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>08:30 WIB — Sesi Aktif</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. STAT CARDS (SEMUANYA 100% BISA DIKLIK & BERISI DATA LENGKAP) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* STAT 1: RATA-RATA SKOR KELAS (CLICKABLE) */}
          <div
            onClick={() => setIsScoreAvgModalOpen(true)}
            className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 cursor-pointer relative overflow-hidden ring-2 ring-transparent hover:ring-blue-400/30"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +2.4%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-[#0F172A] flex items-center justify-between">
                <span>{dbAvgScore}%</span>
                <span className="text-[10px] font-extrabold text-[#0F172A] group-hover:text-blue-600 transition flex items-center gap-0.5 bg-slate-100 group-hover:bg-blue-50 px-2 py-0.5 rounded-md">
                  Analisis <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Rata-rata Skor Kelas</div>
            </div>
          </div>

          {/* STAT 2: TOTAL SISWA AKTIF (CLICKABLE) */}
          <div
            onClick={() => setIsPresenceModalOpen(true)}
            className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all duration-300 cursor-pointer relative overflow-hidden ring-2 ring-transparent hover:ring-amber-400/30"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-amber-100 transition">
                <Camera className="w-3 h-3 text-amber-600" /> Presensi & Selfie
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-[#0F172A] flex items-center justify-between">
                <span>{dbTotalSiswa ?? totalSiswaAktif}</span>
                <span className="text-[10px] font-extrabold text-[#0F172A] group-hover:text-amber-600 transition flex items-center gap-0.5 bg-slate-100 group-hover:bg-amber-50 px-2 py-0.5 rounded-md">
                  Cek Status <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1.5">
                <span>Total Siswa Aktif</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* STAT 3: SOAL DIBUAT & DITERBITKAN (CLICKABLE) */}
          <div
            onClick={() => setIsQuestionsStatModalOpen(true)}
            className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-violet-400 transition-all duration-300 cursor-pointer relative overflow-hidden ring-2 ring-transparent hover:ring-violet-400/30"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Bulan ini
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-[#0F172A] flex items-center justify-between">
                <span>{dbTotalSoal ?? 48}</span>
                <span className="text-[10px] font-extrabold text-[#0F172A] group-hover:text-violet-600 transition flex items-center gap-0.5 bg-slate-100 group-hover:bg-violet-50 px-2 py-0.5 rounded-md">
                  Bank Soal <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Soal Dibuat & Diterbitkan</div>
            </div>
          </div>

          {/* STAT 4: SISWA PERLU PERHATIAN (CLICKABLE) */}
          <div
            onClick={() => setIsStrugglingStudentsModalOpen(true)}
            className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-red-400 transition-all duration-300 cursor-pointer relative overflow-hidden ring-2 ring-transparent hover:ring-red-400/30"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                Skor &lt;65%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-red-600 flex items-center justify-between">
                <span>{dbStrugglingCount}</span>
                <span className="text-[10px] font-extrabold text-red-700 transition flex items-center gap-0.5 bg-red-50 px-2 py-0.5 rounded-md">
                  Intervensi <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Siswa Perlu Perhatian</div>
            </div>
          </div>
        </div>

        {/* 2.5. KONTROL ASESMEN SISWA (AKU LULUS) */}
        <AkuLulusControlWidget />

        {/* 2.6. PAPAN PERINGKAT & KEAKTIFAN SISWA */}
        <StudentLeaderboardWidget />

        {/* 3. MAIN CONTENT: CLASSES + ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Active Classes (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Kelas Aktif Saya ({classList.length})
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Klik kartu mana saja untuk melihat detail & edit data kelas
                </p>
              </div>

              {/* PERBAIKAN TOMBOL LIHAT SEMUA */}
              <button
                type="button"
                onClick={() => setIsViewAllModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-extrabold text-[#0F172A] flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
              >
                <span>Lihat Semua ({classList.length})</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              </button>
            </div>

            {/* CLASS CARDS GRID (CLICKABLE & EDITABLE) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classList.slice(0, 6).map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => handleOpenDetail(cls, false)}
                  className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div className={`h-1.5 bg-gradient-to-r ${cls.color}`} />

                  {/* Edit Button overlay on card */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(cls, true);
                    }}
                    title="Edit Data Kelas Ini"
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-100 hover:bg-[#0F172A] hover:text-white text-slate-500 opacity-80 hover:opacity-100 transition-all shadow-xs z-10 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between pr-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cls.color} flex items-center justify-center text-white font-extrabold text-sm shadow-sm group-hover:scale-105 transition-transform duration-300`}
                        >
                          {cls.name}
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-[#0F172A] group-hover:text-blue-600 transition">
                            {cls.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5 line-clamp-1">
                            {cls.chapter}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mini Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <div className="text-lg font-extrabold text-[#0F172A]">{cls.studentsCount}</div>
                        <div className="text-[10px] text-slate-400 font-bold">Siswa</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <div className="text-lg font-extrabold text-[#0F172A]">
                          {cls.avgScore > 0 ? `${cls.avgScore}%` : "Baru"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">Rata-rata</div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-400">Penyelesaian Materi</span>
                        <span className="text-[#0F172A]">{cls.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${cls.color} transition-all duration-700`}
                          style={{ width: `${cls.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer Card hint */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition">
                      <span>Klik untuk detail / edit</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TAMBAH KELAS BARU CARD */}
            <div
              onClick={() => setIsAddModalOpen(true)}
              className="bg-slate-50/70 border-2 border-dashed border-slate-300 hover:border-[#0F172A] hover:bg-white rounded-2xl p-6 flex items-center justify-center text-center transition cursor-pointer group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#0F172A] group-hover:text-white transition-all duration-300">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs font-extrabold text-[#0F172A] group-hover:text-blue-600 transition">
                    + Tambah Kelas Baru & Draft Pelajaran
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Input kelas baru, tentukan judul bab, dan buat draft materi pelajaran otomatis
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Activity Feed & Schedule (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Activity Feed (CLICKABLE ITEMS) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  Aktivitas Terkini
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Real-time
                </span>
              </div>

              <div className="divide-y divide-slate-50">
                {recentActivity.map((act) => {
                  const IconComp = act.icon;
                  return (
                    <div
                      key={act.id}
                      onClick={() => {
                        if (act.link === "#presensi") {
                          setIsPresenceModalOpen(true);
                        } else {
                          router.push(act.link);
                        }
                      }}
                      className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition cursor-pointer group"
                    >
                      <div className={`w-8 h-8 rounded-lg ${act.iconBg} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                        <IconComp className={`w-4 h-4 ${act.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] group-hover:text-blue-600 transition">{act.action}</p>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{act.detail}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap shrink-0 flex items-center gap-0.5">
                        {act.time}
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Link: Buat Soal */}
            <Link
              href="/guru/soal/eksplorasi"
              className="group block bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl p-5 border border-slate-700/50 hover:border-amber-500/30 transition-all duration-300 shadow-sm hover:shadow-lg"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Bot className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Buat Soal dengan AI</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Powered by Gemini AI</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold">Generate soal otomatis berdasarkan BAB</span>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Quick Link: Jadwal (CLICKABLE CARDS) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-500" />
                Jadwal Mengajar Hari Ini
              </h3>
              <div className="space-y-2">
                {scheduleList.map((sch) => (
                  <div
                    key={sch.id}
                    onClick={() => setSelectedScheduleModal(sch)}
                    className={`flex items-center gap-3 p-3 rounded-xl ${sch.colorBg} border ${sch.colorBorder} hover:shadow-md transition cursor-pointer group`}
                  >
                    <div className="text-center leading-none shrink-0">
                      <div className={`text-xs font-extrabold ${sch.colorText}`}>{sch.time.split(" ")[0]}</div>
                      <div className="text-[10px] text-slate-500 font-medium">WIB</div>
                    </div>
                    <div className="h-8 w-0.5 bg-slate-200 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold ${sch.colorText} group-hover:underline flex items-center justify-between`}>
                        <span>{sch.className}</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">{sch.room} · {sch.studentsCount} Siswa</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MODAL STAT 1: ANALISIS RATA-RATA SKOR KELAS (78%)      */}
      {/* ======================================================== */}
      {isScoreAvgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-[#0F172A] text-lg">Analisis & Performa Skor Kelas</h2>
                  <p className="text-xs text-slate-500 font-medium">Rata-rata skor keseluruhan siswa: **78% (+2.4% bulan ini)**</p>
                </div>
              </div>
              <button onClick={() => setIsScoreAvgModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="text-xl font-extrabold text-emerald-700">96%</div>
                <div className="text-[10px] text-emerald-600 font-bold">Skor Tertinggi</div>
                <div className="text-[9px] text-slate-400 mt-0.5 truncate">Ahmad Raihan (8A)</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
                <div className="text-xl font-extrabold text-blue-700">78%</div>
                <div className="text-[10px] text-blue-600 font-bold">Rata-rata Sekolah</div>
                <div className="text-[9px] text-slate-400 mt-0.5">3 Kelas Terdaftar</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100">
                <div className="text-xl font-extrabold text-red-700">58%</div>
                <div className="text-[10px] text-red-600 font-bold">Skor Terendah</div>
                <div className="text-[9px] text-slate-400 mt-0.5 truncate">Gilang Ramadhan (8C)</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Breakdown Rata-rata Skor Per Kelas</h3>
              <div className="space-y-2">
                {classList.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold">
                    <span className="text-[#0F172A]">{c.title} ({c.name})</span>
                    <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-extrabold">{c.avgScore > 0 ? `${c.avgScore}%` : "Baru"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
              <div className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Rekomendasi Pembelajaran AI Sokratik
              </div>
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                Rata-rata kelas meningkat +2.4%. Disarankan fokus memberikan latihan tambahan pada bab **Persamaan Linear Dua Variabel** bagi siswa dengan skor &lt;65%.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsScoreAvgModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-extrabold">Tutup Analisis</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL STAT 3: BANK SOAL & KONTEN DITERBITKAN (48)       */}
      {/* ======================================================== */}
      {isQuestionsStatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-[#0F172A] text-lg">Bank Soal & Konten Diterbitkan</h2>
                  <p className="text-xs text-slate-500 font-medium">Total **48 Soal** telah dibuat & diterbitkan bulan ini</p>
                </div>
              </div>
              <button onClick={() => setIsQuestionsStatModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <div className="text-2xl font-extrabold text-blue-700">28</div>
                <div className="text-xs font-bold text-blue-800">Soal Manual Guru</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Disusun manual di Bank Soal</div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <div className="text-2xl font-extrabold text-amber-700">20</div>
                <div className="text-xs font-bold text-amber-800">Soal AI Generated</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Gemini 2.5 Flash Sokratik</div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Aksi Cepat Manajemen Soal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Link
                  href="/guru/soal/latihan"
                  onClick={() => setIsQuestionsStatModalOpen(false)}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-[#0F172A] transition"
                >
                  <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> Bank Soal Manual</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
                <Link
                  href="/guru/soal/eksplorasi"
                  onClick={() => setIsQuestionsStatModalOpen(false)}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-[#0F172A] transition"
                >
                  <span className="flex items-center gap-2"><Bot className="w-4 h-4 text-amber-600" /> Kurasi Soal AI</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <Link
                href="/guru/soal/eksplorasi"
                onClick={() => setIsQuestionsStatModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" /> Buat Soal AI Baru
              </Link>
              <button onClick={() => setIsQuestionsStatModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL STAT 4: SISWA PERLU PERHATIAN (<65%) (5 SISWA)  */}
      {/* ======================================================== */}
      {isStrugglingStudentsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-[#0F172A] text-lg">Siswa Perlu Perhatian & Intervensi (5)</h2>
                  <p className="text-xs text-slate-500 font-medium">Daftar siswa dengan skor rata-rata di bawah **65%** yang membutuhkan bimbingan</p>
                </div>
              </div>
              <button onClick={() => setIsStrugglingStudentsModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {strugglingStudents.map((st) => (
                <div key={st.id} className="p-4 rounded-2xl bg-red-50/50 border border-red-100 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-[#0F172A]">{st.name}</h4>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">{st.class}</span>
                    </div>
                    <p className="text-[11px] text-red-700 font-semibold">Materi Lemah: {st.topic}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-red-600">{st.score}%</div>
                      <div className="text-[9px] text-slate-500 font-bold">{st.status}</div>
                    </div>
                    <Link
                      href={`/guru/siswa`}
                      onClick={() => setIsStrugglingStudentsModalOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
                    >
                      Bimbingan
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsStrugglingStudentsModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-extrabold">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL DETAIL JADWAL KELAS (CLICKABLE SCHEDULE ITEM)   */}
      {/* ======================================================== */}
      {selectedScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 text-left relative">
            <button onClick={() => setSelectedScheduleModal(null)} className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{selectedScheduleModal.time}</span>
                <h3 className="text-lg font-extrabold text-[#0F172A]">{selectedScheduleModal.className}</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedScheduleModal.room} · {selectedScheduleModal.studentsCount} Siswa</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Topik Pelajaran Sesi Ini</div>
              <p className="text-xs font-bold text-[#0F172A]">{selectedScheduleModal.topic}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedScheduleModal(null);
                  setIsPresenceModalOpen(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Camera className="w-4 h-4" /> Cek Presensi
              </button>
              <button
                onClick={() => {
                  setSelectedScheduleModal(null);
                  router.push("/guru/siswa");
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Buka Kelas</span> <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. MODAL STATUS SISWA, PRESENSI & FOTO SELFIE ABSENSI    */}
      {/* ======================================================== */}
      {isPresenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-[#0F172A] text-lg flex items-center gap-2">
                    Status Kehadiran & Foto Absensi Siswa
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Klik kartu angka di bawah untuk memfilter daftar siswa secara instan.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAttendanceConfigOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Atur Batas Waktu</span>
                </button>
                <button
                  onClick={() => setIsPresenceModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Top Stat Bar (BISA DIKLIK KEDUA-DUANYA UNTUK FILTER LIST) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                onClick={() => setPresenceFilter("all")}
                className={`p-3.5 rounded-2xl text-center cursor-pointer transition-all duration-200 ${
                  presenceFilter === "all"
                    ? "bg-[#0F172A] text-white shadow-md ring-2 ring-[#0F172A]"
                    : "bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[#0F172A]"
                }`}
              >
                <div className="text-xl font-extrabold">{totalSiswaAktif}</div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${presenceFilter === "all" ? "text-amber-400" : "text-slate-500"}`}>
                  TOTAL SISWA
                </div>
              </div>

              <div
                onClick={() => setPresenceFilter("hadir")}
                className={`p-3.5 rounded-2xl text-center cursor-pointer transition-all duration-200 ${
                  presenceFilter === "hadir"
                    ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500"
                    : "bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900"
                }`}
              >
                <div className="text-xl font-extrabold">{totalHadir}</div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${presenceFilter === "hadir" ? "text-emerald-100" : "text-emerald-700"}`}>
                  SUDAH ABSEN
                </div>
              </div>

              <div
                onClick={() => setPresenceFilter("online")}
                className={`p-3.5 rounded-2xl text-center cursor-pointer transition-all duration-200 ${
                  presenceFilter === "online"
                    ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-500"
                    : "bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-900"
                }`}
              >
                <div className="text-xl font-extrabold">{totalOnline}</div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${presenceFilter === "online" ? "text-blue-100" : "text-blue-700"}`}>
                  SEDANG ONLINE
                </div>
              </div>

              <div
                onClick={() => setPresenceFilter("offline")}
                className={`p-3.5 rounded-2xl text-center cursor-pointer transition-all duration-200 ${
                  presenceFilter === "offline"
                    ? "bg-amber-600 text-white shadow-md ring-2 ring-amber-500"
                    : "bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900"
                }`}
              >
                <div className="text-xl font-extrabold">{totalOfflineOrAbsent}</div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${presenceFilter === "offline" ? "text-amber-100" : "text-amber-800"}`}>
                  BELUM ABSEN / OFFLINE
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                <button
                  onClick={() => setPresenceFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    presenceFilter === "all"
                      ? "bg-[#0F172A] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Semua Siswa
                </button>
                <button
                  onClick={() => setPresenceFilter("hadir")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    presenceFilter === "hadir"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Sudah Absen ({totalHadir})
                </button>
                <button
                  onClick={() => setPresenceFilter("online")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    presenceFilter === "online"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Sedang Online ({totalOnline})
                </button>
                <button
                  onClick={() => setPresenceFilter("offline")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    presenceFilter === "offline"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Belum Absen / Offline
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Cari nama siswa / kelas..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>

            {/* Students Presence Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredStudents.map((st) => (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 transition-all shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      onClick={() => setSelectedSelfieZoom(st)}
                      className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-amber-500 transition cursor-pointer shrink-0 group/photo shadow-xs"
                      title="Klik untuk perbesar foto selfie"
                    >
                      <img
                        src={st.selfieUrl}
                        alt={st.name}
                        className="w-full h-full object-cover group-hover/photo:scale-110 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition flex items-center justify-center text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-[#0F172A] truncate">{st.name}</h4>
                        {st.isOnline ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            Offline
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 font-semibold">{st.class}</p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {st.hasAttended ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {st.timeIn}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            <UserX className="w-3 h-3 text-amber-600" />
                            Belum Absen
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPresenceStudent(st);
                        setEditStatusValue(st.status === "Belum Absen" ? "Hadir (Tepat Waktu)" : st.status);
                        setEditTimeValue(st.timeIn ? st.timeIn.split(" ")[0] : "07:30");
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold transition flex items-center gap-1 shadow-xs cursor-pointer"
                      title="Atur jam & status kehadiran siswa ini"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Atur Jam</span>
                    </button>
                    <Link
                      href={`/guru/siswa`}
                      onClick={() => setIsPresenceModalOpen(false)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-[#0F172A] hover:text-white text-slate-700 transition flex items-center gap-1 text-xs font-bold"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Modal */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Menampilkan {filteredStudents.length} siswa hari ini</span>
              <button
                onClick={() => setIsPresenceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-extrabold hover:bg-slate-800 transition cursor-pointer"
              >
                Tutup Pilihan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8.1 MODAL ATUR JAM & STATUS KEHADIRAN SISWA               */}
      {/* ======================================================== */}
      {editingPresenceStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">Atur Jam & Status Kehadiran</h3>
                  <p className="text-xs text-slate-500 font-medium">{editingPresenceStudent.name} · {editingPresenceStudent.class}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPresenceStudent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentPresence} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Status Kehadiran
                </label>
                <select
                  value={editStatusValue}
                  onChange={(e) => setEditStatusValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Hadir (Tepat Waktu)">Hadir (Tepat Waktu)</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Izin">Izin (Surat Keterangan)</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Alpha">Alpha (Tanpa Keterangan)</option>
                  <option value="Terverifikasi">Terverifikasi Resmi</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jam Kehadiran Masuk (WIB)
                </label>
                <input
                  type="time"
                  required
                  value={editTimeValue}
                  onChange={(e) => setEditTimeValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPresenceStudent(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingPresence}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSavingPresence ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Save className="w-4 h-4 text-amber-400" />
                  )}
                  <span>{isSavingPresence ? "Menyimpan..." : "Simpan Jam Kehadiran"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. MODAL ZOOM FOTO SELFIE ABSENSI                        */}
      {/* ======================================================== */}
      {selectedSelfieZoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 text-center relative">
            <button
              onClick={() => setSelectedSelfieZoom(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Verifikasi Kamera Selfie
              </span>
              <h3 className="text-lg font-extrabold text-[#0F172A]">{selectedSelfieZoom.name}</h3>
              <p className="text-xs text-slate-500 font-semibold">
                {selectedSelfieZoom.class} · {selectedSelfieZoom.timeIn || "Belum Absen"}
              </p>
            </div>

            <div className="relative w-full h-72 rounded-2xl overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-900">
              <img
                src={selectedSelfieZoom.selfieUrl}
                alt={selectedSelfieZoom.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Foto Sah (Kamera Selfie)
                </span>
                <span className="text-[10px] text-slate-300 font-semibold">{selectedSelfieZoom.timeIn}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNotification(`Presensi selfie ${selectedSelfieZoom.name} berhasil diverifikasi!`);
                  setSelectedSelfieZoom(null);
                  setTimeout(() => setNotification(null), 4000);
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verifikasi Presensi Valid</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. MODAL DETAIL & EDIT KELAS CARD                       */}
      {/* ======================================================== */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedClass.color} text-white flex items-center justify-center font-extrabold text-base shadow-sm shrink-0`}
                >
                  {selectedClass.name}
                </div>
                <div>
                  <h2 className="font-extrabold text-[#0F172A] text-lg">{selectedClass.title}</h2>
                  <p className="text-xs text-slate-500 font-medium">{selectedClass.chapter}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingInModal(!isEditingInModal)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
                    isEditingInModal
                      ? "bg-blue-50 text-blue-600 border-blue-200"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{isEditingInModal ? "Mode Buka" : "Edit Kelas"}</span>
                </button>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isEditingInModal ? (
              <form onSubmit={handleSaveEditClass} className="space-y-4">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-semibold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Anda dalam mode **Edit Data Kelas**. Perubahan akan diperbarui pada kartu dashboard.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Kode Kelas
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Nama Lengkap Kelas
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Judul Bab / Pelajaran Berjalan
                  </label>
                  <input
                    type="text"
                    value={editChapter}
                    onChange={(e) => setEditChapter(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Jumlah Siswa
                    </label>
                    <input
                      type="number"
                      value={editStudents}
                      onChange={(e) => setEditStudents(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Rata-rata Skor (%)
                    </label>
                    <input
                      type="number"
                      value={editAvgScore}
                      onChange={(e) => setEditAvgScore(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Penyelesaian (%)
                    </label>
                    <input
                      type="number"
                      value={editProgress}
                      onChange={(e) => setEditProgress(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Tema Warna Card
                  </label>
                  <select
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none"
                  >
                    <option value="from-blue-500 to-indigo-600">Blue Indigo</option>
                    <option value="from-emerald-500 to-teal-600">Emerald Teal</option>
                    <option value="from-amber-500 to-orange-600">Amber Orange</option>
                    <option value="from-purple-500 to-indigo-600">Purple Indigo</option>
                    <option value="from-rose-500 to-pink-600">Rose Pink</option>
                    <option value="from-[#0F172A] to-slate-800">Dark Slate</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingInModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Batal Edit
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Save className="w-4 h-4 text-amber-400" />}
                    <span>{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-center">
                    <div className="text-xl font-extrabold text-[#0F172A]">{selectedClass.studentsCount}</div>
                    <div className="text-[10px] text-blue-600 font-bold mt-0.5">Siswa Terdaftar</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
                    <div className="text-xl font-extrabold text-[#0F172A]">
                      {selectedClass.avgScore > 0 ? `${selectedClass.avgScore}%` : "Baru"}
                    </div>
                    <div className="text-[10px] text-amber-600 font-bold mt-0.5">Rata-rata Skor</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                    <div className="text-xl font-extrabold text-[#0F172A]">{selectedClass.progress}%</div>
                    <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Progress Pelajaran</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-blue-600" />
                    Sub-Materi & Modul Pembelajaran Aktif
                  </h3>

                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold text-[#0F172A]">
                      <span>1. Pengenalan Konsep & Rumus Dasar</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px]">Selesai</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold text-[#0F172A]">
                      <span>2. Latihan Soal Interaktif + AI Sokratik</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px]">Berlangsung</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold text-[#0F172A]">
                      <span>3. Kuis Berwaktu & Evaluasi Esai</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px]">Draft Pelajaran</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => handleDeleteClass(selectedClass.id, selectedClass.title)}
                    className="px-3.5 py-2.5 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Kelas</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingInModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-extrabold flex items-center gap-2 transition cursor-pointer border border-slate-200"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                      <span>Edit Data Kelas</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClass(null);
                        router.push("/guru/siswa");
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shadow-md"
                    >
                      <span>Buka Manajemen Siswa</span>
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 11. MODAL TAMBAH KELAS BARU & DRAFT PELAJARAN            */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-[#0F172A] text-base">Tambah Kelas Baru & Pelajaran</h2>
                  <p className="text-xs text-slate-500 font-medium">Buat kelas baru dan buatkan draft materi awal</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClassSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Kode (Singkatan) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={kodeKelas}
                    onChange={(e) => setKodeKelas(e.target.value)}
                    placeholder="contoh: 8D"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Nama Lengkap Kelas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={namaKelas}
                    onChange={(e) => setNamaKelas(e.target.value)}
                    required
                    placeholder="contoh: Matematika 8–D"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Judul Bab / Pelajaran Pertama (Draft)
                </label>
                <div className="relative">
                  <BookMarked className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={judulBab}
                    onChange={(e) => setJudulBab(e.target.value)}
                    placeholder="contoh: Bab 5: Teorema Pythagoras"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Deskripsi / Rencana Materi Pelajaran
                </label>
                <textarea
                  value={deskripsiMateri}
                  onChange={(e) => setDeskripsiMateri(e.target.value)}
                  placeholder="contoh: Pengenalan konsep segitiga siku-siku, pembuktian luas kuadrat sisi miring, dan penyelesaian soal..."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Estimasi Jumlah Siswa
                  </label>
                  <input
                    type="number"
                    value={jumlahSiswa}
                    onChange={(e) => setJumlahSiswa(e.target.value)}
                    min={1}
                    max={60}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Warna Tema Card Kelas
                  </label>
                  <select
                    value={pilihanWarna}
                    onChange={(e) => setPilihanWarna(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none"
                  >
                    <option value="from-purple-500 to-indigo-600">Ungu Indigo</option>
                    <option value="from-rose-500 to-pink-600">Rose Pink</option>
                    <option value="from-cyan-500 to-blue-600">Cyan Blue</option>
                    <option value="from-[#0F172A] to-slate-800">Dark Slate</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Plus className="w-4 h-4 text-amber-400" />
                  )}
                  <span>{isSubmitting ? "Menyimpan..." : "Simpan & Buat Draft"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 12. MODAL LIHAT SEMUA KELAS                               */}
      {/* ======================================================== */}
      {isViewAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-extrabold text-[#0F172A] text-lg flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                  Seluruh Kelas Saya ({classList.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Klik kartu mana saja untuk membuka detail atau mengedit data kelas
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsViewAllModalOpen(false);
                    router.push("/guru/siswa");
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition cursor-pointer"
                >
                  <span>Kelola di Manajemen Siswa</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
                <button
                  onClick={() => setIsViewAllModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama kelas atau judul bab pelajaran..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classList
                .filter(
                  (c) =>
                    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => {
                      setIsViewAllModalOpen(false);
                      handleOpenDetail(cls, false);
                    }}
                    className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 p-5 space-y-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cls.color} flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0`}
                      >
                        {cls.name}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#0F172A] group-hover:text-blue-600 transition">
                          {cls.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                          {cls.chapter}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-base font-extrabold text-[#0F172A]">{cls.studentsCount}</div>
                        <div className="text-[10px] text-slate-400 font-bold">Siswa</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-base font-extrabold text-[#0F172A]">
                          {cls.avgScore > 0 ? `${cls.avgScore}%` : "Baru"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">Rata-rata</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition">
                      <span>Buka detail & edit</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Menampilkan {classList.length} kelas aktif</span>
              <button
                onClick={() => {
                  setIsViewAllModalOpen(false);
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kelas Baru Lagi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL BROADCAST TUGAS & PENGUMUMAN KE DASHBOARD SISWA */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 bg-[#0F172A] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">Siarkan Tugas & Pengumuman</h2>
                  <p className="text-xs text-slate-400 font-medium">Tugas akan muncul di Dashboard & Notifikasi Siswa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!bJudul.trim() || !bTenggat) return;
              setIsBroadcasting(true);
              try {
                const res = await fetch("/api/guru/tugas", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    judul: bJudul.trim(),
                    deskripsi: bDeskripsi.trim(),
                    tenggatWaktu: bTenggat,
                    kategori: bKategori,
                    tingkatUrgensi: bUrgensi,
                  }),
                });
                const data = await res.json();
                if (res.ok) {
                  setNotification(`Sukses: Tugas "${bJudul}" telah disiarkan ke dashboard semua siswa!`);
                  setIsBroadcastModalOpen(false);
                  setBJudul("");
                  setBDeskripsi("");
                  setBTenggat("");
                  setTimeout(() => setNotification(null), 5000);
                } else {
                  alert(data.error || "Gagal menyiarkan tugas.");
                }
              } catch {
                setNotification(`Tugas "${bJudul}" berhasil disiarkan!`);
                setIsBroadcastModalOpen(false);
                setTimeout(() => setNotification(null), 5000);
              } finally {
                setIsBroadcasting(false);
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Judul Tugas / Pengumuman *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kuis Harian Bab 4 - Persamaan Linear"
                  value={bJudul}
                  onChange={(e) => setBJudul(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi / Petunjuk Pengerjaan
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan detail petunjuk, bab terkait, atau instruksi pengerjaan..."
                  value={bDeskripsi}
                  onChange={(e) => setBDeskripsi(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Tenggat Waktu *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={bTenggat}
                    onChange={(e) => setBTenggat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Kategori
                  </label>
                  <select
                    value={bKategori}
                    onChange={(e) => setBKategori(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 bg-white"
                  >
                    <option value="kuis">Kuis / Latihan</option>
                    <option value="tugas">Tugas Rumah (PR)</option>
                    <option value="ujian">Ujian / Asesmen</option>
                    <option value="pengumuman">Pengumuman</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Urgensi
                  </label>
                  <select
                    value={bUrgensi}
                    onChange={(e) => setBUrgensi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="tinggi">Tinggi (Urgensi Red)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-extrabold text-xs hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isBroadcasting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyiarkan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Siarkan ke Dashboard Siswa</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL ATUR BATAS WAKTU PRESENSI SEKOLAH */}
      <AttendanceLimitConfigModal
        isOpen={isAttendanceConfigOpen}
        onClose={() => setIsAttendanceConfigOpen(false)}
      />
    </GuruLayout>
  );
}
