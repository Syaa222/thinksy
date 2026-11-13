"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Award,
  User,
  Plus,
  Lock,
  Unlock,
  Calendar,
  Clock,
  Key,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sliders,
  Check,
  X,
  CreditCard,
  QrCode,
  Building2,
  Printer,
  ChevronRight,
  ChevronDown,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Search,
  Send,
  MoreVertical,
  ExternalLink,
  FolderKanban,
  Settings,
  Maximize2,
  Minimize2,
  Copy,
  Edit3,
  Trash2,
  Paperclip,
  MessageSquare,
  Menu,
  Users,
  GraduationCap,
  HelpCircle,
  Laptop,
  Flame,
  CheckSquare,
  UserPlus,
  LayoutDashboard,
  Link2,
} from "lucide-react";
import { ClassBannerGraphic } from "./classroom/ClassBannerGraphics";
import CustomizeBannerModal from "./classroom/CustomizeBannerModal";
import EditBabNormalScreen, { EditingBabData } from "./classroom/EditBabNormalScreen";
import ClassAnnouncementCard from "@/components/classroom/ClassAnnouncementCard";
import AnnouncementComposerModal from "@/components/classroom/AnnouncementComposerModal";
import {
  StreamAnnouncement,
  DEFAULT_ANNOUNCEMENTS,
  AnnouncementAttachment,
  AnnouncementComment,
} from "@/lib/announcement-format";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import { Repeat as RepeatIcon } from "lucide-react";
import { notifyClassUpdated } from "@/lib/classroom-sync";
import {
  StudentCardProfile,
  DEFAULT_PROFILE,
  DEFAULT_STUDENT_PHOTO,
  getStoredStudentProfile,
  saveStoredStudentProfile,
  isStoredProfileLocked,
  saveStoredProfileLocked,
  resolveStudentPhoto,
} from "@/lib/student-settings";

// ════════════════════════════════════════════════════════════════════════════════
// DATA STRUKTUR MATA PELAJARAN (MATEMATIKA KELAS 8 KURIKULUM MERDEKA FASE D)
// ════════════════════════════════════════════════════════════════════════════════
export interface ClassroomSubject {
  id: string;
  name: string;
  section: string;
  room: string;
  subjectCode: string;
  themeColor: string;
  bgGradient: string;
  bannerType?: "illustration" | "photo";
  bannerIllustration: string;
  bannerPhotoUrl?: string;
  teacher: {
    name: string;
    avatarText: string;
    avatarColor: string;
    role: string;
  };
  babs: {
    id: string;
    nomor: number;
    judul: string;
    deskripsi: string;
    materiCount: number;
    kuisCount: number;
    tugasCount: number;
    isOpen: boolean;
    materials: {
      id: string;
      title: string;
      type: "material" | "assignment" | "quiz";
      postedDate: string;
      dueDate?: string;
      points?: number;
    }[];
  }[];
}

const CLASSROOM_SUBJECTS: ClassroomSubject[] = [
  {
    id: "mat-8",
    name: "Matematika (Kelas 8)",
    section: "Fase D • Kurikulum Merdeka",
    room: "Ruang 8-A",
    subjectCode: "mtk8xpk",
    themeColor: "#1967D2",
    bgGradient: "from-blue-900 via-indigo-950 to-slate-900",
    bannerType: "illustration",
    bannerIllustration: "math",
    teacher: {
      name: "Ibu Siti Rahmawati, M.Pd.",
      avatarText: "S",
      avatarColor: "bg-blue-600",
      role: "Wali Kelas & Guru Matematika",
    },
    babs: [
      {
        id: "mat-bab-1",
        nomor: 1,
        judul: "Bab 1: Bilangan Berpangkat & Bentuk Akar",
        deskripsi: "Sifat-sifat eksponen, perkalian pembagian pangkat bulat, dan menyederhanakan bentuk akar.",
        materiCount: 4,
        kuisCount: 2,
        tugasCount: 2,
        isOpen: true,
        materials: [
          { id: "m-m1", title: "Rangkuman Konsep: Sifat Dasar Bilangan Berpangkat", type: "material", postedDate: "Kemarin" },
          { id: "m-m2", title: "Latihan Soal: Operasi Perkalian dan Pembagian Pangkat", type: "assignment", postedDate: "Kemarin", dueDate: "Besok, 12:00", points: 100 },
          { id: "m-m3", title: "Kuis Formatif Bab 1 Bilangan Berpangkat", type: "quiz", postedDate: "Kemarin", points: 100 },
        ],
      },
      {
        id: "mat-bab-2",
        nomor: 2,
        judul: "Bab 2: Teorema Pythagoras",
        deskripsi: "Pembuktian rumus Pythagoras pada segitiga siku-siku, tripel Pythagoras, dan aplikasinya.",
        materiCount: 3,
        kuisCount: 1,
        tugasCount: 1,
        isOpen: true,
        materials: [
          { id: "m-m4", title: "Modul Pembelajaran Teorema Pythagoras & Tripel", type: "material", postedDate: "6 Okt" },
          { id: "m-m5", title: "Latihan Soal Cerita Penerapan Pythagoras", type: "assignment", postedDate: "6 Okt", dueDate: "10 Okt", points: 100 },
        ],
      },
      {
        id: "mat-bab-3",
        nomor: 3,
        judul: "Bab 3: Persamaan & Pertidaksamaan Linear Satu Variabel",
        deskripsi: "Pemodelan matematika sistem linear satu variabel dan penyelesaian nilai x.",
        materiCount: 3,
        kuisCount: 1,
        tugasCount: 1,
        isOpen: true,
        materials: [
          { id: "m-m6", title: "Lembar Kerja Siswa: PLSV & Garis Bilangan", type: "assignment", postedDate: "2 Okt", points: 100 },
        ],
      },
      {
        id: "mat-bab-4",
        nomor: 4,
        judul: "Bab 4: Relasi dan Fungsi",
        deskripsi: "Memahami domain, kodomain, range, rumus fungsi f(x), dan grafik fungsi.",
        materiCount: 3,
        kuisCount: 1,
        tugasCount: 1,
        isOpen: true,
        materials: [
          { id: "m-m7", title: "Konsep Relasi & Diagram Panah", type: "material", postedDate: "28 Sep" },
        ],
      },
      {
        id: "mat-bab-5",
        nomor: 5,
        judul: "Bab 5: Persamaan Garis Lurus (Gradien)",
        deskripsi: "Kemiringan garis (gradien m), persamaan y = mx + c, dan garis sejajar/tegak lurus.",
        materiCount: 3,
        kuisCount: 1,
        tugasCount: 1,
        isOpen: true,
        materials: [
          { id: "m-m8", title: "Modul: Menentukan Gradien Garis Lurus Melalui Dua Titik", type: "material", postedDate: "20 Sep" },
          { id: "m-m9", title: "Latihan: Menggambar Grafik Persamaan Garis y = mx + c", type: "assignment", postedDate: "20 Sep", dueDate: "26 Sep", points: 100 },
          { id: "m-m10", title: "Kuis Formatif: Gradien Garis Sejajar & Tegak Lurus", type: "quiz", postedDate: "22 Sep", points: 100 },
        ],
      },
      {
        id: "mat-bab-6",
        nomor: 6,
        judul: "Bab 6: Statistika & Ukuran Pemusatan Data",
        deskripsi: "Mean, median, modus, jangkauan data tunggal serta penyajian diagram batang dan lingkaran.",
        materiCount: 3,
        kuisCount: 1,
        tugasCount: 1,
        isOpen: true,
        materials: [
          { id: "m-m11", title: "Rangkuman Konsep: Mean, Median, Modus Data Tunggal", type: "material", postedDate: "15 Sep" },
          { id: "m-m12", title: "Proyek Survei Mini: Pengolahan Data Nilai Harian", type: "assignment", postedDate: "15 Sep", dueDate: "22 Sep", points: 100 },
          { id: "m-m13", title: "Kuis Cepat: Ukuran Pemusatan & Penyebaran Data", type: "quiz", postedDate: "17 Sep", points: 100 },
        ],
      },
    ],
  },
];

const IPA_BABS = [
  {
    id: "ipa-bab-1",
    nomor: 1,
    judul: "Bab 1: Pengenalan Sel & Mikroskop",
    deskripsi: "Struktur sel hewan dan tumbuhan, penggunaan mikroskop cahaya, dan hierarki organisasi kehidupan.",
    materiCount: 3,
    kuisCount: 1,
    tugasCount: 1,
    isOpen: true,
    materials: [
      { id: "m-ipa-1", title: "Modul: Struktur & Organel Sel Hewan vs Tumbuhan", type: "material" as const, postedDate: "Kemarin" },
      { id: "m-ipa-2", title: "Praktikum Virtual Penggunaan Mikroskop Cahaya", type: "assignment" as const, postedDate: "Kemarin", dueDate: "Besok, 12:00", points: 100 },
      { id: "m-ipa-3", title: "Kuis Formatif Bab 1 Organisasi Kehidupan", type: "quiz" as const, postedDate: "Kemarin", points: 100 },
    ],
  },
  {
    id: "ipa-bab-2",
    nomor: 2,
    judul: "Bab 2: Struktur dan Fungsi Tubuh Manusia",
    deskripsi: "Sistem pencernaan, peredaran darah, pernapasan, dan ekskresi pada manusia serta nutrisi seimbang.",
    materiCount: 3,
    kuisCount: 1,
    tugasCount: 1,
    isOpen: true,
    materials: [
      { id: "m-ipa-4", title: "Rangkuman Sistem Pencernaan & Enzim", type: "material" as const, postedDate: "6 Okt" },
      { id: "m-ipa-5", title: "Latihan Analisis Golongan Darah & Sistem Sirkulasi", type: "assignment" as const, postedDate: "6 Okt", dueDate: "10 Okt", points: 100 },
    ],
  },
  {
    id: "ipa-bab-3",
    nomor: 3,
    judul: "Bab 3: Usaha, Energi, dan Pesawat Sederhana",
    deskripsi: "Konsep usaha fisik, transformasi energi mekanik, kinetik, potensial, serta tuas dan katrol.",
    materiCount: 3,
    kuisCount: 1,
    tugasCount: 1,
    isOpen: true,
    materials: [
      { id: "m-ipa-6", title: "Lembar Kerja Siswa: Perhitungan Usaha & Tuas", type: "assignment" as const, postedDate: "2 Okt", points: 100 },
    ],
  },
  {
    id: "ipa-bab-4",
    nomor: 4,
    judul: "Bab 4: Getaran, Gelombang, dan Cahaya",
    deskripsi: "Konsep frekuensi, periode getaran, perambatan gelombang bunyi, serta sifat-sifat pembiasan cahaya.",
    materiCount: 3,
    kuisCount: 1,
    tugasCount: 1,
    isOpen: true,
    materials: [
      { id: "m-ipa-7", title: "Konsep Resonansi Bunyi dan Cermin Optik", type: "material" as const, postedDate: "28 Sep" },
    ],
  },
  {
    id: "ipa-bab-5",
    nomor: 5,
    judul: "Bab 5: Unsur, Senyawa, dan Struktur Bumi",
    deskripsi: "Klasifikasi materi, tabel periodik, pemisahan campuran, serta lapisan litosfer dan tata surya.",
    materiCount: 3,
    kuisCount: 1,
    tugasCount: 1,
    isOpen: true,
    materials: [
      { id: "m-ipa-8", title: "Modul Pemisahan Campuran Filtrasi & Kristalisasi", type: "material" as const, postedDate: "20 Sep" },
    ],
  },
];

// Supabase UUID Mapping untuk 6 Bab Matematika Kelas 8
export const SUPABASE_BAB_MAP: Record<string, string> = {
  "mat-bab-1": "5f649043-e4b7-4d11-a353-991b07a77d5c",
  "mat-bab-2": "b4ae1851-1aa0-435f-8379-34cfe59afd6f",
  "mat-bab-3": "a1fb5fd1-bcf8-451b-8dcc-01f09b30c768",
  "mat-bab-4": "1fd7a8c2-079c-4044-be29-207c4c5da83b",
  "mat-bab-5": "4a215311-c0b3-4cc5-8177-48eb40221f9e",
  "mat-bab-6": "fd4ebc86-d354-4f40-a886-48a76cd0ef48",
  "5f649043-e4b7-4d11-a353-991b07a77d5c": "5f649043-e4b7-4d11-a353-991b07a77d5c",
  "b4ae1851-1aa0-435f-8379-34cfe59afd6f": "b4ae1851-1aa0-435f-8379-34cfe59afd6f",
  "a1fb5fd1-bcf8-451b-8dcc-01f09b30c768": "a1fb5fd1-bcf8-451b-8dcc-01f09b30c768",
  "1fd7a8c2-079c-4044-be29-207c4c5da83b": "1fd7a8c2-079c-4044-be29-207c4c5da83b",
  "4a215311-c0b3-4cc5-8177-48eb40221f9e": "4a215311-c0b3-4cc5-8177-48eb40221f9e",
  "fd4ebc86-d354-4f40-a886-48a76cd0ef48": "fd4ebc86-d354-4f40-a886-48a76cd0ef48",
};

interface ManagementKelasTabScreenProps {
  onNavigateView?: (view: string) => void;
  selectedClassId?: string;
  customClasses?: any[];
  onUpdateClass?: (cls: any) => void;
}

export default function ManagementKelasTabScreen({
  onNavigateView,
  selectedClassId,
  customClasses,
  onUpdateClass,
}: ManagementKelasTabScreenProps) {
  // ════════════════════════════════════════════════════════════════════════════
  // 1. STATE MANAGEMENT KELAS & GOOGLE CLASSROOM INTERFACE
  // ════════════════════════════════════════════════════════════════════════════
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => selectedClassId || "mat-8");

  // Sync selectedSubjectId when prop changes
  useEffect(() => {
    if (selectedClassId) {
      setSelectedSubjectId(selectedClassId);
    }
  }, [selectedClassId]);

  // Merge default subjects with custom created classes
  const allSubjects = useMemo(() => {
    if (!customClasses || customClasses.length === 0) return CLASSROOM_SUBJECTS;
    const mapped: ClassroomSubject[] = customClasses.map((c) => {
      const isIpa = (c.name || "").toLowerCase().includes("ipa") || (c.mapel || "").toLowerCase().includes("ipa");
      return {
        id: c.id,
        name: c.name,
        section: c.section || (isIpa ? "Kelas 8 • Laboratorium Sains" : "Kelas 8 • Fase D Kurikulum Merdeka"),
        room: c.room || (isIpa ? "Lab IPA" : "Ruang 8-A"),
        subjectCode: c.subjectCode,
        themeColor: c.themeColor || (isIpa ? "#0F9D58" : "#1967D2"),
        bgGradient: c.bgGradient || (isIpa ? "from-emerald-600 via-teal-700 to-slate-950" : "from-blue-700 via-indigo-700 to-slate-900"),
        bannerType: c.bannerType || (c.bannerPhotoUrl ? "photo" : "illustration"),
        bannerIllustration: c.bannerIllustration || (isIpa ? "science" : "math"),
        bannerPhotoUrl: c.bannerPhotoUrl,
        teacher: {
          name: "Ibu Siti Rahmawati, M.Pd.",
          avatarText: c.name.charAt(0).toUpperCase() || (isIpa ? "I" : "S"),
          avatarColor: isIpa ? "bg-emerald-600" : "bg-blue-600",
          role: "Guru Pengampu",
        },
        babs: isIpa ? IPA_BABS : (CLASSROOM_SUBJECTS[0]?.babs || []),
      };
    });
    const map = new Map<string, ClassroomSubject>();
    CLASSROOM_SUBJECTS.forEach((s) => map.set(s.id, s));
    mapped.forEach((s) => map.set(s.id, s));
    return Array.from(map.values());
  }, [customClasses]);

  const [activeTab, setActiveTab] = useState<"stream" | "classwork" | "people" | "grades">("stream");
  const [isClassCodeModalOpen, setIsClassCodeModalOpen] = useState(false);
  const [isCustomizeBannerModalOpen, setIsCustomizeBannerModalOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<"assignment" | "quiz" | "material" | "topic">("material");
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>("all");
  const [streamFilterMapel, setStreamFilterMapel] = useState<string>("all");
  const [classworkViewMode, setClassworkViewMode] = useState<"topics" | "empty_sample">("topics");
  const [peopleViewMode, setPeopleViewMode] = useState<"students_list" | "empty_sample">("students_list");
  const [gradesViewMode, setGradesViewMode] = useState<"matrix" | "empty_sample">("matrix");

  // Bab Customization & Edit State (Synchronized with Supabase and localStorage)
  const [babOverrides, setBabOverrides] = useState<
    Record<string, { judul: string; deskripsi: string; isOpen?: boolean; dueSoonDate?: string; isScheduled?: boolean }>
  >({});
  const [isEditBabNormalScreenOpen, setIsEditBabNormalScreenOpen] = useState(false);
  const [editingBab, setEditingBab] = useState<EditingBabData | null>(null);

  // Realtime hook for broadcasting announcements to student dashboard
  const { broadcastEvent } = useRealtimeDashboard();

  // Announcement State (Synchronized with localStorage & DEFAULT_ANNOUNCEMENTS)
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
  const [isComposerModalOpen, setIsComposerModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<StreamAnnouncement | null>(null);

  // Class Code dropdown & edit state
  const [classCodeMenuOpen, setClassCodeMenuOpen] = useState(false);
  const [isEditingClassCode, setIsEditingClassCode] = useState(false);
  const [customClassCodeInput, setCustomClassCodeInput] = useState("");
  const classCodeMenuRef = useRef<HTMLDivElement>(null);

  // Upcoming Task State (Directed to settingan upcoming tugas dalam card matematika)
  const [isUpcomingModalOpen, setIsUpcomingModalOpen] = useState(false);
  const [upcomingTask, setUpcomingTask] = useState<{
    title: string;
    babNomor: number;
    babJudul: string;
    dueDate: string;
    dueTime: string;
  } | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("thinksy_upcoming_task_mat");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      title: "Latihan Mandiri Bab 1 & 2",
      babNomor: 1,
      babJudul: "Bilangan Berpangkat & Teorema Pythagoras",
      dueDate: "Besok",
      dueTime: "23:59",
    };
  });

  // Active Subject Object
  const currentSubject =
    allSubjects.find((s) => s.id === selectedSubjectId) || allSubjects[0];

  // Close class code menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (classCodeMenuRef.current && !classCodeMenuRef.current.contains(e.target as Node)) {
        setClassCodeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };


  // Close create dropdown on click outside
  const createDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (createDropdownRef.current && !createDropdownRef.current.contains(e.target as Node)) {
        setIsCreateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real students state from Supabase / Mock database
  const [studentsList, setStudentsList] = useState<any[]>(() => [
    { id: "st-1", name: "Ahmad Raihan", nisn: "0081234567", kelas: "8A", points: 620, hadir: true, online: true, foto: resolveStudentPhoto({ name: "Ahmad Raihan", nisn: "0081234567", foto: "/images/pasfoto-siswa-1.jpg" }) },
    { id: "st-2", name: "Aisyah Putri Azzahra", nisn: "0081234568", kelas: "8A", points: 580, hadir: true, online: true, foto: resolveStudentPhoto({ name: "Aisyah Putri Azzahra", nisn: "0081234568", foto: "/images/pasfoto-siswa-2.jpg" }) },
    { id: "st-3", name: "Budi Santoso", nisn: "0081234569", kelas: "8B", points: 540, hadir: true, online: false, foto: resolveStudentPhoto({ name: "Budi Santoso", nisn: "0081234569", foto: "/images/pasfoto-siswa-1.jpg" }) },
    { id: "st-4", name: "Citra Dewi Lestari", nisn: "0081234570", kelas: "8A", points: 510, hadir: true, online: true, foto: resolveStudentPhoto({ name: "Citra Dewi Lestari", nisn: "0081234570", foto: "/images/pasfoto-siswa-2.jpg" }) },
    { id: "st-5", name: "Dika Pratama", nisn: "0081234571", kelas: "8C", points: 490, hadir: true, online: false, foto: resolveStudentPhoto({ name: "Dika Pratama", nisn: "0081234571", foto: "/images/pasfoto-siswa-1.jpg" }) },
    { id: "st-6", name: "Fathir Muhammad", nisn: "0081234572", kelas: "8B", points: 475, hadir: true, online: true, foto: resolveStudentPhoto({ name: "Fathir Muhammad", nisn: "0081234572", foto: "/images/pasfoto-siswa-1.jpg" }) },
    { id: "st-7", name: "Khadijah Nurul", nisn: "0081234573", kelas: "8A", points: 460, hadir: true, online: false, foto: resolveStudentPhoto({ name: "Khadijah Nurul", nisn: "0081234573", foto: "/images/pasfoto-siswa-2.jpg" }) },
    { id: "st-8", name: "Rizky Ramadhan", nisn: "0081234574", kelas: "8C", points: 430, hadir: false, online: false, foto: resolveStudentPhoto({ name: "Rizky Ramadhan", nisn: "0081234574", foto: "/images/pasfoto-siswa-1.jpg" }) },
  ]);

  // Fetch real students from Supabase on mount & sync joined students + shared notes
  useEffect(() => {
    async function loadRealData() {
      try {
        const res = await fetch("/api/guru/manajemen-kelas");
        if (res.ok) {
          const json = await res.json();
          const rawList = json.siswa || json.hasil_keseluruhan_siswa || json.kelas_utama?.siswa;
          if (rawList && Array.isArray(rawList) && rawList.length > 0) {
            const apiStudents = rawList.map((st: any, idx: number) => ({
              id: st.id || `st-db-${idx}`,
              name: st.nama_lengkap || "Siswa",
              nisn: st.nisn || `00812345${idx}`,
              kelas: st.kelas || "8A",
              points: st.total_poin || 450,
              hadir: true,
              online: idx % 2 === 0,
              foto: resolveStudentPhoto({
                id: st.id,
                name: st.nama_lengkap,
                nisn: st.nisn,
                foto: st.foto || (idx % 2 === 0 ? "/images/pasfoto-siswa-1.jpg" : "/images/pasfoto-siswa-2.jpg"),
              }),
            }));

            // Merge with local joined students
            try {
              const stored = localStorage.getItem("thinksy_joined_students");
              if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const resolvedJoined = parsed.map((s: any) => ({
                    ...s,
                    foto: resolveStudentPhoto(s),
                  }));
                  const existingNames = new Set(apiStudents.map((s: any) => s.name));
                  const toAdd = resolvedJoined.filter((s: any) => !existingNames.has(s.name));
                  setStudentsList([...toAdd, ...apiStudents]);
                  return;
                }
              }
            } catch {}

            setStudentsList(apiStudents);
          }
        }
      } catch (err) {
        console.warn("Using default classroom student data:", err);
      }
    }
    loadRealData();

    // Check localStorage for joined students
    try {
      const storedJoined = localStorage.getItem("thinksy_joined_students");
      if (storedJoined) {
        const parsed = JSON.parse(storedJoined);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStudentsList((prev) => {
            const existingNames = new Set(prev.map((s) => s.name));
            const toAdd = parsed.filter((s: any) => !existingNames.has(s.name));
            return [...toAdd, ...prev];
          });
        }
      }
    } catch {}

    // Check localStorage for shared notes
    try {
      const storedNotes = localStorage.getItem("thinksy_shared_notes");
      if (storedNotes) {
        const parsedNotes = JSON.parse(storedNotes);
        if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
          setAnnouncements((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const toAdd = parsedNotes.filter((p: any) => !existingIds.has(p.id));
            return [...toAdd, ...prev];
          });
        }
      }
    } catch {}

    // Listen to real-time events from student actions
    const handleClassJoined = (e: any) => {
      const newStudent = e.detail?.student;
      if (!newStudent) return;
      setStudentsList((prev) => {
        const exists = prev.some((s) => s.name === newStudent.name || s.id === newStudent.id);
        if (exists) return prev;
        return [
          {
            id: newStudent.id || `st-${Date.now()}`,
            name: newStudent.name,
            nisn: newStudent.nisn || "0089247182",
            kelas: newStudent.kelas || "8A",
            points: newStudent.points || 450,
            hadir: true,
            online: true,
            foto: newStudent.foto || "/images/pasfoto-siswa-1.jpg",
          },
          ...prev,
        ];
      });
      showToast(`Siswa baru bergabung: ${newStudent.name} (${newStudent.kelas || "Kelas 8"})!`);
    };

    const handleNoteShared = (e: any) => {
      const notePost = e.detail;
      if (!notePost) return;
      setAnnouncements((prev) => {
        const exists = prev.some((p) => p.id === notePost.id);
        if (exists) return prev;
        return [notePost, ...prev];
      });
      showToast(`Catatan baru dibagikan oleh siswa: ${notePost.authorName}!`);
    };

    const handleStudentPhotoSync = () => {
      setStudentsList((prev) =>
        prev.map((st) => ({
          ...st,
          foto: resolveStudentPhoto(st),
        }))
      );
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "thinksy_student_photo" ||
        e.key === "thinksy_student_profile" ||
        e.key === "thinksy_student_photos_map"
      ) {
        handleStudentPhotoSync();
      }
      if (e.key === "thinksy_joined_students" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setStudentsList((prev) => {
              const existingMap = new Map(prev.map((s) => [s.name, s]));
              parsed.forEach((p: any) => {
                const existing = existingMap.get(p.name);
                if (existing) {
                  existingMap.set(p.name, { ...existing, foto: resolveStudentPhoto(p) });
                } else {
                  existingMap.set(p.name, { ...p, foto: resolveStudentPhoto(p) });
                }
              });
              return Array.from(existingMap.values()).map((st) => ({ ...st, foto: resolveStudentPhoto(st) }));
            });
          }
        } catch {}
      }
      if (e.key === "thinksy_shared_notes" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setAnnouncements((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const toAdd = parsed.filter((p: any) => !existingIds.has(p.id));
              return [...toAdd, ...prev];
            });
          }
        } catch {}
      }
    };

    window.addEventListener("thinksy_class_joined", handleClassJoined);
    window.addEventListener("thinksy_note_shared", handleNoteShared);
    window.addEventListener("thinksy_photo_change", handleStudentPhotoSync);
    window.addEventListener("thinksy_profile_change", handleStudentPhotoSync);
    window.addEventListener("thinksy_joined_students_updated", handleStudentPhotoSync);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("thinksy_class_joined", handleClassJoined);
      window.removeEventListener("thinksy_note_shared", handleNoteShared);
      window.removeEventListener("thinksy_photo_change", handleStudentPhotoSync);
      window.removeEventListener("thinksy_profile_change", handleStudentPhotoSync);
      window.removeEventListener("thinksy_joined_students_updated", handleStudentPhotoSync);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Fetch babs from Supabase & localStorage on mount
  useEffect(() => {
    async function loadBabs() {
      // 1. Load from localStorage first for immediate local changes
      try {
        const stored = localStorage.getItem("thinksy_custom_babs");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            setBabOverrides((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch {}

      // 2. Fetch official data from Supabase API
      try {
        const res = await fetch("/api/guru/bab?mapel=Matematika&kelas=8");
        if (res.ok) {
          const json = await res.json();
          if (json.babs && Array.isArray(json.babs)) {
            const remoteOverrides: Record<string, { judul: string; deskripsi: string; isOpen?: boolean }> = {};
            json.babs.forEach((b: any) => {
              remoteOverrides[b.id] = {
                judul: b.judul,
                deskripsi: b.deskripsi || "",
              };
              const localKey = `mat-bab-${b.urutan}`;
              remoteOverrides[localKey] = {
                judul: b.judul,
                deskripsi: b.deskripsi || "",
              };
            });

            setBabOverrides((prev) => {
              const merged = { ...prev };
              Object.entries(remoteOverrides).forEach(([k, v]) => {
                merged[k] = {
                  ...v,
                  isOpen: prev[k]?.isOpen !== undefined ? prev[k].isOpen : true,
                };
              });
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn("Could not fetch babs from Supabase:", err);
      }
    }

    loadBabs();

    const handleBabUpdated = (e: any) => {
      const detail = e.detail;
      if (detail?.id) {
        setBabOverrides((prev) => ({
          ...prev,
          [detail.id]: {
            judul: detail.judul,
            deskripsi: detail.deskripsi || "",
            isOpen: detail.isOpen !== undefined ? detail.isOpen : prev[detail.id]?.isOpen ?? true,
          },
          ...(detail.supabaseId
            ? {
                [detail.supabaseId]: {
                  judul: detail.judul,
                  deskripsi: detail.deskripsi || "",
                  isOpen: detail.isOpen !== undefined ? detail.isOpen : prev[detail.supabaseId]?.isOpen ?? true,
                },
              }
            : {}),
        }));
      }
    };

    window.addEventListener("thinksy_bab_updated", handleBabUpdated);
    return () => window.removeEventListener("thinksy_bab_updated", handleBabUpdated);
  }, []);

  // Helper get active Bab data with overrides applied
  const getBabData = (bab: ClassroomSubject["babs"][number]): ClassroomSubject["babs"][number] => {
    const supabaseId = SUPABASE_BAB_MAP[bab.id];
    const override = babOverrides[bab.id] || (supabaseId ? babOverrides[supabaseId] : undefined);
    return {
      ...bab,
      judul: override?.judul ?? bab.judul,
      deskripsi: override?.deskripsi ?? bab.deskripsi,
      isOpen: override?.isOpen !== undefined ? override.isOpen : bab.isOpen,
    };
  };

  // Open Edit Bab Normal Screen
  const handleOpenEditBab = (rawBab: ClassroomSubject["babs"][number]) => {
    const data = getBabData(rawBab);
    const supabaseId = SUPABASE_BAB_MAP[rawBab.id] || (rawBab.id.length > 20 ? rawBab.id : undefined);
    const override = (babOverrides[rawBab.id] || (supabaseId ? babOverrides[supabaseId] : undefined)) as any;
    setEditingBab({
      id: rawBab.id,
      nomor: rawBab.nomor,
      judul: data.judul,
      deskripsi: data.deskripsi || "",
      isOpen: data.isOpen !== false,
      supabaseId,
      dueSoonDate: override?.dueSoonDate,
      isScheduled: override?.isScheduled,
      modules: override?.modules,
      features: override?.features,
      quiz: override?.quiz,
    });
    setIsEditBabNormalScreenOpen(true);
  };

  // Toggle Bab Status (Terbuka / Terkunci)
  const handleToggleBabStatus = (rawBab: ClassroomSubject["babs"][number]) => {
    const data = getBabData(rawBab);
    const nextStatus = !data.isOpen;
    const supabaseId = SUPABASE_BAB_MAP[rawBab.id];

    const updated = {
      ...babOverrides,
      [rawBab.id]: {
        ...babOverrides[rawBab.id],
        judul: data.judul,
        deskripsi: data.deskripsi,
        isOpen: nextStatus,
      },
      ...(supabaseId
        ? {
            [supabaseId]: {
              ...babOverrides[supabaseId],
              judul: data.judul,
              deskripsi: data.deskripsi,
              isOpen: nextStatus,
            },
          }
        : {}),
    };

    setBabOverrides(updated);
    try {
      localStorage.setItem("thinksy_custom_babs", JSON.stringify(updated));
    } catch {}

    showToast(
      `Status bab "${data.judul}" diubah menjadi: ${
        nextStatus ? "Terbuka (Dapat Diakses Siswa)" : "Terkunci"
      }.`
    );
  };

  // Save Edit Bab to Supabase & localStorage


  // ─── ANNOUNCEMENT HANDLERS (STREAM FEED) ───
  const handleOpenCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setIsComposerModalOpen(true);
  };

  const handleOpenEditAnnouncement = (post: StreamAnnouncement) => {
    setEditingAnnouncement(post);
    setIsComposerModalOpen(true);
  };

  const handlePostOrUpdateAnnouncement = async (data: {
    text: string;
    subjectTag: string;
    className: string;
    attachments: AnnouncementAttachment[];
    id?: string;
  }) => {
    if (editingAnnouncement) {
      // Edit existing post
      const updatedList = announcements.map((p) =>
        p.id === editingAnnouncement.id
          ? {
              ...p,
              text: data.text,
              subjectTag: data.subjectTag,
              className: data.className,
              attachments: data.attachments,
            }
          : p
      );
      setAnnouncements(updatedList);
      try {
        localStorage.setItem("thinksy_class_announcements", JSON.stringify(updatedList));
      } catch {}

      fetch("/api/classroom/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          id: editingAnnouncement.id,
          text: data.text,
          attachments: data.attachments,
          subjectTag: data.subjectTag,
          className: data.className,
        }),
      }).catch(console.warn);

      broadcastEvent("ANNOUNCEMENT_UPDATED", {
        id: editingAnnouncement.id,
        text: data.text,
      });

      showToast("Pengumuman berhasil diperbarui!");
      setIsComposerModalOpen(false);
      setEditingAnnouncement(null);
      return;
    }

    // Create new post
    const newId = `post-${Date.now()}`;
    const newPost: StreamAnnouncement = {
      id: newId,
      authorName: currentSubject.teacher.name,
      authorAvatarText: currentSubject.teacher.avatarText,
      authorAvatarColor: currentSubject.teacher.avatarColor,
      timeAgo: "Baru saja",
      text: data.text,
      subjectTag: data.subjectTag || currentSubject.id,
      className: data.className || currentSubject.name,
      isPinned: false,
      attachments: data.attachments || [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    const updatedList = [newPost, ...announcements];
    setAnnouncements(updatedList);
    try {
      localStorage.setItem("thinksy_class_announcements", JSON.stringify(updatedList));
    } catch {}

    // Call API: creates post & immediately inserts notification into Supabase for all students
    try {
      await fetch("/api/classroom/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          id: newId,
          text: data.text,
          authorName: currentSubject.teacher.name,
          authorAvatarText: currentSubject.teacher.avatarText,
          authorAvatarColor: currentSubject.teacher.avatarColor,
          subjectTag: data.subjectTag || currentSubject.id,
          className: data.className || currentSubject.name,
          attachments: data.attachments || [],
        }),
      });
    } catch (err) {
      console.warn("[POST ANNOUNCEMENT API ERROR]", err);
    }

    // Realtime broadcast to student dashboard
    broadcastEvent("ANNOUNCEMENT_POSTED", {
      id: newId,
      authorName: currentSubject.teacher.name,
      text: data.text,
      timeAgo: "Baru saja",
      subjectTag: data.subjectTag || currentSubject.id,
    });

    window.dispatchEvent(
      new CustomEvent("thinksy_announcement_event", {
        detail: { action: "create", post: newPost },
      })
    );

    showToast("📢 Pengumuman berhasil disiarkan & masuk ke notifikasi dashboard siswa!");
    setIsComposerModalOpen(false);
  };

  const handleMoveToTop = (postId: string) => {
    const postIndex = announcements.findIndex((p) => p.id === postId);
    if (postIndex <= 0) {
      showToast("Pengumuman sudah berada di paling atas.");
      return;
    }
    const targetPost = announcements[postIndex];
    const rest = announcements.filter((p) => p.id !== postId);
    const updatedList = [targetPost, ...rest];
    setAnnouncements(updatedList);
    try {
      localStorage.setItem("thinksy_class_announcements", JSON.stringify(updatedList));
    } catch {}

    fetch("/api/classroom/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move_to_top", id: postId }),
    }).catch(console.warn);

    showToast("Pengumuman berhasil dipindahkan ke posisi teratas!");
  };

  const handlePinAnnouncement = (postId: string) => {
    const post = announcements.find((p) => p.id === postId);
    if (!post) return;
    const nextPinned = !post.isPinned;
    const updatedList = announcements.map((p) =>
      p.id === postId ? { ...p, isPinned: nextPinned } : p
    );
    updatedList.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    setAnnouncements(updatedList);
    try {
      localStorage.setItem("thinksy_class_announcements", JSON.stringify(updatedList));
    } catch {}

    fetch("/api/classroom/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pin", id: postId }),
    }).catch(console.warn);

    showToast(
      nextPinned
        ? "Pengumuman disematkan di paling atas."
        : "Sematkan pengumuman dibatalkan."
    );
  };

  const handleDeleteAnnouncement = (postId: string) => {
    const updatedList = announcements.filter((p) => p.id !== postId);
    setAnnouncements(updatedList);
    try {
      localStorage.setItem("thinksy_class_announcements", JSON.stringify(updatedList));
    } catch {}

    fetch("/api/classroom/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: postId }),
    }).catch(console.warn);

    showToast("Pengumuman berhasil dihapus.");
  };

  const handleAddComment = (postId: string, text: string) => {
    if (!text.trim()) return;
    const newComment: AnnouncementComment = {
      id: `c-${Date.now()}`,
      authorName: currentSubject.teacher.name,
      authorRole: "Guru",
      text: text.trim(),
      timeAgo: "Baru saja",
      avatarText: currentSubject.teacher.avatarText,
      avatarColor: currentSubject.teacher.avatarColor,
    };

    const updatedList = announcements.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment],
        };
      }
      return p;
    });

    setAnnouncements(updatedList);
    try {
      localStorage.setItem("thinksy_class_announcements", JSON.stringify(updatedList));
    } catch {}

    fetch("/api/classroom/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "comment",
        id: postId,
        comment: newComment,
      }),
    }).catch(console.warn);

    showToast("Komentar berhasil dikirim.");
  };

  // ─── CLASS CODE HANDLERS ───
  const handleSaveCustomClassCode = (newCode: string) => {
    const clean = newCode.trim().toUpperCase() || "7X9Q2K";
    currentSubject.subjectCode = clean;
    setCustomClassCodeInput(clean);
    setIsEditingClassCode(false);
    setClassCodeMenuOpen(false);

    try {
      const saved = localStorage.getItem("thinksy_guru_classes");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((c: any) =>
            c.id === currentSubject.id ? { ...c, subjectCode: clean } : c
          );
          localStorage.setItem("thinksy_guru_classes", JSON.stringify(updated));
        }
      }
    } catch {}

    notifyClassUpdated();
    showToast(`✓ Kode kelas berhasil diubah menjadi: ${clean}`);
  };

  const handleResetClassCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomCode = "";
    for (let i = 0; i < 7; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleSaveCustomClassCode(randomCode);
  };

  // ─── UPCOMING TASK HANDLERS (MATEMATIKA) ───
  const handleSaveUpcomingTask = (taskData: {
    title: string;
    babNomor: number;
    babJudul: string;
    dueDate: string;
    dueTime: string;
  }) => {
    setUpcomingTask(taskData);
    try {
      localStorage.setItem("thinksy_upcoming_task_mat", JSON.stringify(taskData));
    } catch {}

    broadcastEvent("UPCOMING_TASK_UPDATED", taskData);
    window.dispatchEvent(
      new CustomEvent("thinksy_upcoming_task_event", { detail: taskData })
    );

    setIsUpcomingModalOpen(false);
    showToast(`✓ Tugas mendatang Matematika berhasil diatur: ${taskData.title}`);
  };

  const handleDeleteUpcomingTask = () => {
    setUpcomingTask(null);
    try {
      localStorage.removeItem("thinksy_upcoming_task_mat");
    } catch {}
    broadcastEvent("UPCOMING_TASK_DELETED", {});
    showToast("Tugas mendatang dihapus.");
  };


  // Copy Class Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Kode kelas "${code}" disalin ke clipboard!`);
  };

  // Dynamic Banner Artwork by Illustration
  const renderBannerGraphic = (type: string) => {
    if (type === "tech") {
      return (
        <div className="absolute right-0 top-0 bottom-0 w-2/3 pointer-events-none opacity-90 overflow-hidden flex items-center justify-end pr-6">
          <svg viewBox="0 0 600 240" className="h-full max-h-[220px] w-auto">
            {/* Tablet Mockup */}
            <rect x="180" y="20" width="170" height="130" rx="12" fill="#1E293B" stroke="#60A5FA" strokeWidth="4" />
            <rect x="195" y="35" width="140" height="100" rx="6" fill="#38BDF8" opacity="0.85" />
            <line x1="210" y1="55" x2="280" y2="55" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
            <line x1="210" y1="70" x2="310" y2="70" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            <line x1="210" y1="85" x2="260" y2="85" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />

            {/* Laptop Mockup */}
            <rect x="330" y="40" width="230" height="150" rx="10" fill="#0F172A" stroke="#93C5FD" strokeWidth="5" />
            <rect x="345" y="55" width="200" height="110" rx="6" fill="#3B82F6" opacity="0.9" />
            {/* Keyboard base */}
            <path d="M300 195 L590 195 L570 215 L320 215 Z" fill="#CBD5E1" />
            {/* Laptop screen code bars */}
            <rect x="360" y="70" width="170" height="14" rx="3" fill="#1D4ED8" />
            <rect x="360" y="92" width="130" height="10" rx="2" fill="#93C5FD" />
            <rect x="360" y="108" width="150" height="10" rx="2" fill="#93C5FD" />
            <rect x="360" y="124" width="100" height="10" rx="2" fill="#93C5FD" />

            {/* Smartphone Mockup */}
            <rect x="250" y="110" width="85" height="120" rx="10" fill="#0F172A" stroke="#38BDF8" strokeWidth="3" />
            <rect x="260" y="122" width="65" height="95" rx="4" fill="#0284C7" />
          </svg>
        </div>
      );
    }

    if (type === "math") {
      return (
        <div className="absolute right-0 top-0 bottom-0 w-2/3 pointer-events-none opacity-85 overflow-hidden flex items-center justify-end pr-8">
          <svg viewBox="0 0 500 240" className="h-full max-h-[220px] w-auto">
            <circle cx="380" cy="110" r="85" fill="#2563EB" opacity="0.3" />
            <polygon points="260,180 430,180 430,50" fill="none" stroke="#60A5FA" strokeWidth="5" />
            <text x="320" y="210" fill="#93C5FD" fontSize="24" fontWeight="bold">a² + b² = c²</text>
            <text x="445" y="120" fill="#FBBF24" fontSize="26" fontWeight="bold">f(x)</text>
            <text x="230" y="80" fill="#34D399" fontSize="28" fontWeight="bold">√x</text>
            {/* Compass / Ruler */}
            <line x1="280" y1="30" x2="350" y2="180" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
            <line x1="420" y1="30" x2="350" y2="180" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
      );
    }

    if (type === "literature") {
      return (
        <div className="absolute right-0 top-0 bottom-0 w-2/3 pointer-events-none opacity-85 overflow-hidden flex items-center justify-end pr-8">
          <svg viewBox="0 0 500 240" className="h-full max-h-[220px] w-auto">
            {/* Open Book */}
            <path d="M220 180 Q290 160 360 180 L360 80 Q290 60 220 80 Z" fill="#047857" stroke="#34D399" strokeWidth="4" />
            <path d="M360 180 Q430 160 500 180 L500 80 Q430 60 360 80 Z" fill="#065F46" stroke="#34D399" strokeWidth="4" />
            {/* Quill / Pen */}
            <path d="M240 60 Q270 20 310 10 Q300 40 270 80 Z" fill="#FBBF24" />
            <line x1="270" y1="80" x2="250" y2="110" stroke="#F59E0B" strokeWidth="3" />
            <text x="250" y="220" fill="#A7F3D0" fontSize="20" fontWeight="bold">Teks LHO & Puisi</text>
          </svg>
        </div>
      );
    }

    // Default English
    return (
      <div className="absolute right-0 top-0 bottom-0 w-2/3 pointer-events-none opacity-85 overflow-hidden flex items-center justify-end pr-8">
        <svg viewBox="0 0 500 240" className="h-full max-h-[220px] w-auto">
          {/* Globe & Speech Bubbles */}
          <circle cx="390" cy="120" r="75" fill="#B45309" opacity="0.35" stroke="#FBBF24" strokeWidth="4" />
          <path d="M260 60 Q290 40 330 60 Q370 80 340 100 L320 120 L315 100 Q260 100 260 60 Z" fill="#F59E0B" />
          <text x="280" y="80" fill="#1E293B" fontSize="16" fontWeight="bold">Hello!</text>
          <path d="M370 140 Q400 120 440 140 Q470 160 440 180 L430 200 L420 180 Q370 180 370 140 Z" fill="#60A5FA" />
          <text x="390" y="160" fill="#FFFFFF" fontSize="16" fontWeight="bold">Great!</text>
        </svg>
      </div>
    );
  };

  // JIKA SEDANG EDIT BAB: TAMPILKAN NORMAL SCREEN (Layar Mandiri, Luas, Profesional)
  if (isEditBabNormalScreenOpen && editingBab) {
    return (
      <EditBabNormalScreen
        bab={editingBab}
        subjectName={currentSubject.name}
        classNameTitle={`${currentSubject.name} (${currentSubject.section})`}
        onBack={() => setIsEditBabNormalScreenOpen(false)}
        onSaveSuccess={(updatedBab) => {
          setIsEditBabNormalScreenOpen(false);
          const supabaseId = updatedBab.supabaseId || SUPABASE_BAB_MAP[updatedBab.id];
          const updated = {
            ...babOverrides,
            [updatedBab.id]: {
              judul: updatedBab.judul,
              deskripsi: updatedBab.deskripsi,
              isOpen: updatedBab.isOpen,
              dueSoonDate: updatedBab.dueSoonDate,
              isScheduled: updatedBab.isScheduled,
              modules: updatedBab.modules,
              features: updatedBab.features,
              quiz: updatedBab.quiz,
            },
            ...(supabaseId
              ? {
                  [supabaseId]: {
                    judul: updatedBab.judul,
                    deskripsi: updatedBab.deskripsi,
                    isOpen: updatedBab.isOpen,
                    dueSoonDate: updatedBab.dueSoonDate,
                    isScheduled: updatedBab.isScheduled,
                    modules: updatedBab.modules,
                    features: updatedBab.features,
                    quiz: updatedBab.quiz,
                  },
                }
              : {}),
          };
          setBabOverrides(updated);
          showToast(`Bab "${updatedBab.judul}" berhasil diperbarui & disimpan!`);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">
      {/* ════════════════════════════════════════════════════════════════════════════
          1. CLASSROOM MAIN TAB NAVIGATION (DI ATAS HEADER MATEMATIKA)
          Sesuai permintaan: Diletakkan di atas header matematika agar profesional
         ════════════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Tab-tab Navigasi Kelas (Stream, Classwork, People, Grades) */}
        <nav className="inline-flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto max-w-full">
          {[
            { id: "stream", label: "Stream", icon: Layers },
            { id: "classwork", label: "Classwork", icon: BookOpen },
            { id: "people", label: "People", icon: Users },
            { id: "grades", label: "Grades", icon: Award },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer select-none ${
                  isActive
                    ? "bg-white text-[#1967D2] shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#1967D2]" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status Indikator Kelas Aktif */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Kelas Aktif • Semester Ganjil</span>
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════════
          2. HEADER IDENTITAS MATA PELAJARAN (MATEMATIKA KELAS 8)
          Membentang penuh di bawah Tab Navigasi agar leluasa & terstruktur
         ════════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Identitas Mata Pelajaran & Pilihan Dropdown */}
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
            {currentSubject.name.charAt(0)}
          </div>

          <div className="flex flex-col">
            {/* Subject Dropdown Selector & Title */}
            <div className="flex items-center gap-2">
              <div className="relative inline-block">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    const chosen = allSubjects.find((s) => s.id === e.target.value);
                    if (chosen) showToast(`Beralih ke kelas ${chosen.name}`);
                  }}
                  className="text-lg sm:text-xl font-extrabold text-slate-900 bg-transparent pr-7 pl-1 py-0.5 rounded-lg border-b-2 border-transparent hover:border-blue-400 focus:outline-none focus:border-[#1967D2] cursor-pointer appearance-none transition"
                  title="Pilih Mata Pelajaran"
                >
                  {allSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id} className="text-sm font-semibold">
                      {sub.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-1 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Subtitle / Section, Room, Teacher & Switch Account / Settings Redirect */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap mt-0.5">
              <span>{currentSubject.section}</span>
              <span className="text-slate-300">•</span>
              <span>{currentSubject.room}</span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                Pengajar: {currentSubject.teacher.name}
              </span>
              {onNavigateView && (
                <button
                  type="button"
                  onClick={() => onNavigateView("pengaturan")}
                  className="text-[11px] font-bold text-[#1967D2] hover:text-blue-700 hover:underline transition cursor-pointer flex items-center gap-1 ml-1"
                  title="Ke Pengaturan Guru untuk ganti akun atau profil"
                >
                  <User className="w-3 h-3" />
                  <span>Pengaturan Guru / Switch Akun</span>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          2. TAB 1: STREAM (SESUAI DENGAN SCREENSHOT 1 DARI PENGGUNA)
          Hero Banner + Class Code & Upcoming + Announcement Stream Feed + Bab-bab
         ════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "stream" && (
        <div className="space-y-6 w-full">
          {/* A. HERO BANNER PERSIS DENGAN GAMBAR 1 */}
          <div
            className={`relative rounded-3xl bg-gradient-to-r ${currentSubject.bgGradient} text-white p-6 sm:p-8 overflow-hidden shadow-sm min-h-[170px] sm:min-h-[210px] flex flex-col justify-between`}
            style={{ backgroundColor: currentSubject.themeColor }}
          >
            {/* Banner Background Graphic (Photo or Classroom-style SVG Illustration) */}
            <ClassBannerGraphic
              bannerType={currentSubject.bannerType || (currentSubject.bannerPhotoUrl ? "photo" : "illustration")}
              bannerIllustration={currentSubject.bannerIllustration}
              bannerPhotoUrl={currentSubject.bannerPhotoUrl}
              subjectName={currentSubject.name}
              isCompact={false}
            />

            {/* Top row: Subject Title & Customize Button */}
            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="space-y-1 max-w-md sm:max-w-xl">
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  {currentSubject.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-200 font-medium opacity-90">
                  {currentSubject.section} • {currentSubject.room}
                </p>
              </div>

              {/* Customize Button (Matches Screenshot 1) */}
              <button
                type="button"
                onClick={() => setIsCustomizeBannerModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 shadow-sm transition cursor-pointer shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Customize</span>
              </button>
            </div>

            {/* Bottom info icon */}
            <div className="flex items-center justify-between pt-4 relative z-10">
              <div className="flex items-center gap-2 text-[11px] text-slate-200">
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs font-semibold">
                  Pengajar: {currentSubject.teacher.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => showToast(`Info Kelas: ${currentSubject.name} - ${currentSubject.section}`)}
                className="w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition cursor-pointer"
                title="Informasi Kelas"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* B. DUA KOLOM: KIRI (Class code & Upcoming) + KANAN (Stream Feed & Bab) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* KOLOM KIRI (3/12): Class Code & Upcoming */}
            <div className="lg:col-span-4 space-y-4">
              {/* Card 1: Class code (Matches Screenshot 1 & 3) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Class code</span>
                  <div className="relative" ref={classCodeMenuRef}>
                    <button
                      type="button"
                      onClick={() => setClassCodeMenuOpen(!classCodeMenuOpen)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Opsi kode kelas"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Kebab Dropdown Menu (Matches Screenshot 3) */}
                    {classCodeMenuOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs font-medium text-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            handleCopyCode(currentSubject.subjectCode);
                            setClassCodeMenuOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition text-slate-800"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy class code</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const inviteUrl = `${window.location.origin}/dashboard?joinCode=${currentSubject.subjectCode}`;
                            navigator.clipboard.writeText(inviteUrl);
                            showToast("Link undangan kelas berhasil disalin!");
                            setClassCodeMenuOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition text-slate-800"
                        >
                          <Link2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy invite link</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCustomClassCodeInput(currentSubject.subjectCode);
                            setIsEditingClassCode(true);
                            setClassCodeMenuOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition text-blue-600 font-bold"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit class code</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleResetClassCode();
                            setClassCodeMenuOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition text-amber-600"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                          <span>Reset code</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Class Code Display or Inline Edit */}
                {!isEditingClassCode ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-[#1967D2] tracking-wider select-all font-mono">
                      {currentSubject.subjectCode}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(currentSubject.subjectCode)}
                        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                        title="Salin kode kelas"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsClassCodeModalOpen(true)}
                        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer"
                        title="Perbesar kode kelas ke layar penuh"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    <input
                      type="text"
                      maxLength={10}
                      value={customClassCodeInput}
                      onChange={(e) => setCustomClassCodeInput(e.target.value.toUpperCase())}
                      placeholder="Contoh: MAT8A"
                      className="w-full text-sm font-mono font-bold px-3 py-1.5 rounded-xl border border-blue-400 bg-blue-50/50 text-blue-900 focus:outline-none uppercase"
                    />
                    <div className="flex items-center justify-end gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsEditingClassCode(false)}
                        className="px-2.5 py-1 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveCustomClassCode(customClassCodeInput)}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Upcoming with "+" Button (Matches Screenshot 1 & User Request) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700">Upcoming</div>
                  <button
                    type="button"
                    onClick={() => setIsUpcomingModalOpen(true)}
                    className="w-6 h-6 rounded-full hover:bg-blue-50 text-slate-500 hover:text-[#1967D2] flex items-center justify-center transition cursor-pointer border border-transparent hover:border-blue-200"
                    title="Atur / Tambah Tugas Mendatang Matematika"
                  >
                    <Plus className="w-4 h-4 font-bold" />
                  </button>
                </div>

                {upcomingTask ? (
                  <div className="space-y-2 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="text-xs font-bold text-blue-950 leading-tight">
                        {upcomingTask.title}
                      </h4>
                      <button
                        type="button"
                        onClick={handleDeleteUpcomingTask}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                        title="Hapus tugas mendatang"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-700 font-semibold">
                      <span className="px-1.5 py-0.5 rounded-md bg-white border border-blue-200">
                        Bab {upcomingTask.babNomor}
                      </span>
                      <span>Due {upcomingTask.dueDate}, {upcomingTask.dueTime}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">
                    No work due soon
                  </p>
                )}

                <div className="pt-1 text-right flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsUpcomingModalOpen(true)}
                    className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 cursor-pointer"
                  >
                    + Atur tugas
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("classwork")}
                    className="text-xs font-bold text-[#1967D2] hover:underline cursor-pointer"
                  >
                    View all
                  </button>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN (8/12): Announcement Buttons + Post Stream Feed + Bab Bab */}
            <div className="lg:col-span-8 space-y-5">
              {/* Quick Announcement Row (Matches Screenshot 1) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleOpenCreateAnnouncement}
                  className="flex-1 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-blue-50/80 hover:bg-blue-100 text-[#1967D2] text-xs font-bold transition cursor-pointer text-left border border-blue-200/60"
                >
                  <Edit3 className="w-4 h-4 text-[#1967D2]" />
                  <span>New announcement</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (announcements.length > 0) {
                      handleOpenEditAnnouncement(announcements[0]);
                    } else {
                      handleOpenCreateAnnouncement();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  <RepeatIcon className="w-4 h-4 text-slate-500" />
                  <span>Repost</span>
                </button>
              </div>

              {/* STREAM POSTS FEED */}
              <div className="space-y-4">
                {/* Real Class Announcement Cards with 3-Dots (Move to top, Pin, Edit, Delete, Copy link) */}
                {announcements
                  .filter((a) => a.subjectTag === currentSubject.id || !a.subjectTag || a.subjectTag === "all")
                  .map((post) => (
                    <ClassAnnouncementCard
                      key={post.id}
                      post={post}
                      currentUserName={currentSubject.teacher.name}
                      currentUserRole="Guru"
                      isTeacher={true}
                      onMoveToTop={handleMoveToTop}
                      onPin={handlePinAnnouncement}
                      onEdit={handleOpenEditAnnouncement}
                      onDelete={handleDeleteAnnouncement}
                      onAddComment={handleAddComment}
                      onShowToast={showToast}
                    />
                  ))}

                {/* 2. DAFTAR ISI BAB-BAB MATEMATIKA, BAHASA INDONESIA, BAHASA INGGRIS DI STREAM */}
                {/* Sesuai instruksi: "dan isinya pada tab stream itu ada heronya dan isi dari bab bab matematika, bahasa indonesia dan juga bahasa inggris yang ada di dashboard guru." */}
                <div className="pt-4 space-y-4">
                  {/* Subject Filter Bar in Stream */}
                  <div className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-2xl space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#1967D2]" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Bab Pembelajaran di Stream
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Pilih mapel atau tampilkan seluruh kurikulum guru
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setStreamFilterMapel("all")}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                          streamFilterMapel === "all"
                            ? "bg-[#1967D2] text-white shadow-xs"
                            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        Semua Mapel (Matematika, B. Indo, B. Inggris)
                      </button>

                      {allSubjects.map((sub) => {
                        const isSelected = streamFilterMapel === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setStreamFilterMapel(sub.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-[#1967D2] text-white shadow-xs"
                                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                            }`}
                          >
                            <span>{sub.name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {sub.babs.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subject Sections */}
                  <div className="space-y-6">
                    {(streamFilterMapel === "all"
                      ? allSubjects
                      : allSubjects.filter((s) => s.id === streamFilterMapel)
                    ).map((subjectItem) => {
                      const isHeroActive = selectedSubjectId === subjectItem.id;
                      return (
                        <div
                          key={subjectItem.id}
                          className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4"
                        >
                          {/* Subject Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-2xs ${
                                  subjectItem.id === "mat-8"
                                    ? "bg-blue-600"
                                    : subjectItem.id === "indo-8"
                                    ? "bg-emerald-600"
                                    : subjectItem.id === "ingg-8"
                                    ? "bg-amber-600"
                                    : "bg-slate-800"
                                }`}
                              >
                                {subjectItem.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                                    {subjectItem.name}
                                  </h4>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                                    {subjectItem.babs.length} Bab
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  {subjectItem.section} • Pengajar: {subjectItem.teacher.name}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isHeroActive ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1967D2] text-xs font-bold border border-blue-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Hero Banner Aktif</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSubjectId(subjectItem.id);
                                    showToast(`Banner hero diubah ke ${subjectItem.name}`);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-[#1967D2] text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
                                  title="Ganti Hero Banner ke mata pelajaran ini"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Terapkan ke Banner Hero</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSubjectId(subjectItem.id);
                                  setActiveTab("classwork");
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                              >
                                <span>Buka Classwork</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Bab Cards Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {subjectItem.babs.map((rawBab) => {
                              const bab = getBabData(rawBab);
                              return (
                                <div
                                  key={bab.id}
                                  className="bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200 p-4 transition hover:shadow-xs hover:border-blue-300 space-y-3 flex flex-col justify-between"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                            subjectItem.id === "mat-8"
                                              ? "bg-blue-100 text-blue-700"
                                              : subjectItem.id === "indo-8"
                                              ? "bg-emerald-100 text-emerald-700"
                                              : subjectItem.id === "ingg-8"
                                              ? "bg-amber-100 text-amber-700"
                                              : "bg-slate-200 text-slate-800"
                                          }`}
                                        >
                                          {bab.nomor}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleBabStatus(rawBab)}
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer flex items-center gap-1 ${
                                            bab.isOpen
                                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                              : "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300"
                                          }`}
                                          title="Klik untuk membuka/mengunci akses siswa ke bab ini"
                                        >
                                          {bab.isOpen ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                                          <span>{bab.isOpen ? "Akses Terbuka" : "Terkunci"}</span>
                                        </button>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-semibold text-slate-400 mr-1">
                                          {bab.materials.length} Item
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditBab(rawBab)}
                                          className="p-1.5 text-slate-400 hover:text-[#1967D2] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                          title="Edit Bab Ini"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                                      {bab.judul}
                                    </h5>

                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                                      {bab.deskripsi}
                                    </p>
                                  </div>

                                {/* Materials Preview */}
                                {bab.materials.length > 0 && (
                                  <div className="pt-2 border-t border-slate-200/80 space-y-1">
                                    {bab.materials.slice(0, 2).map((mat) => (
                                      <div
                                        key={mat.id}
                                        onClick={() => {
                                          setSelectedSubjectId(subjectItem.id);
                                          setActiveTab("classwork");
                                        }}
                                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-blue-50 transition cursor-pointer text-[11px]"
                                      >
                                        <div className="flex items-center gap-2 truncate pr-2">
                                          {mat.type === "quiz" ? (
                                            <CheckSquare className="w-3 h-3 text-amber-600 shrink-0" />
                                          ) : mat.type === "assignment" ? (
                                            <FileText className="w-3 h-3 text-blue-600 shrink-0" />
                                          ) : (
                                            <BookOpen className="w-3 h-3 text-emerald-600 shrink-0" />
                                          )}
                                          <span className="font-semibold text-slate-700 truncate">
                                            {mat.title}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                          {mat.dueDate ? `Due: ${mat.dueDate}` : mat.postedDate}
                                        </span>
                                      </div>
                                    ))}
                                    {bab.materials.length > 2 && (
                                      <div className="text-right pt-0.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedSubjectId(subjectItem.id);
                                            setActiveTab("classwork");
                                          }}
                                          className="text-[10px] font-bold text-[#1967D2] hover:underline cursor-pointer"
                                        >
                                          +{bab.materials.length - 2} materi lainnya di Classwork
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          3. TAB 2: CLASSWORK (SESUAI DENGAN SCREENSHOT 2 DARI PENGGUNA)
          Tombol "+ Create" + Dropdown (Assignment, Quiz, Question, Material, Topic)
         ════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "classwork" && (
        <div className="space-y-6 w-full">
          {/* Top Classwork Bar: + Create Button (Matches Screenshot 2) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            {/* + Create Button with Dropdown */}
            <div className="relative" ref={createDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1967D2] hover:bg-blue-600 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Create</span>
                <ChevronDown className="w-3.5 h-3.5 text-blue-100 ml-1" />
              </button>

              {/* Dropdown Menu (Matches Screenshot 2 exact 6 options) */}
              {isCreateDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-40 animate-in fade-in zoom-in-95 duration-100">
                  {[
                    { type: "assignment", label: "Assignment", icon: FileText, desc: "Tugas pekerjaan rumah/proyek" },
                    { type: "quiz", label: "Quiz assignment", icon: CheckSquare, desc: "Kuis evaluasi pilihan ganda" },
                    { type: "question", label: "Question", icon: HelpCircle, desc: "Pertanyaan diskusi kelas" },
                    { type: "material", label: "Material", icon: BookOpen, desc: "Modul bacaan & rangkuman materi" },
                    { type: "reuse", label: "Reuse post", icon: RepeatIcon, desc: "Gunakan kembali postingan tugas" },
                    { type: "topic", label: "Topic", icon: Layers, desc: "Buat Bab / Topik baru" },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => {
                          if (opt.type === "reuse") {
                            showToast("Pilih tugas sebelumnya untuk digunakan kembali.");
                          } else {
                            setCreateModalType((opt.type === "question" ? "assignment" : opt.type) as any);
                            setIsCreateModalOpen(true);
                          }
                          setIsCreateDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-3 transition cursor-pointer"
                      >
                        <Icon className="w-4 h-4 text-[#1967D2]" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium hidden md:inline">
                Mata Pelajaran: <strong className="text-slate-800">{currentSubject.name}</strong>
              </span>
            </div>
          </div>

          {currentSubject.babs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-2xs">
              <ClassworkEmptyGraphic />
            </div>
          ) : (
            /* Bab-bab & Material List organized by Topic */
            <div className="space-y-6">
            {currentSubject.babs.map((rawBab) => {
              const bab = getBabData(rawBab);
              return (
                <div key={bab.id} className="space-y-3">
                  {/* Topic Header Bar */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {bab.nomor}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <span>{bab.judul}</span>
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleBabStatus(rawBab)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                          bab.isOpen
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Klik untuk membuka/mengunci akses bab ini bagi siswa"
                      >
                        {bab.isOpen ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{bab.isOpen ? "Terbuka" : "Terkunci"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditBab(rawBab)}
                        className="px-3 py-1 rounded-full text-xs font-bold border border-blue-200 bg-blue-50 text-[#1967D2] hover:bg-blue-100 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        title="Edit Judul dan Deskripsi Bab ini"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Bab</span>
                      </button>
                      <button className="p-1 text-slate-400 hover:text-slate-700">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                {/* Items in this Topic */}
                {bab.materials.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Belum ada materi atau tugas yang ditambahkan ke topik ini. Klik <strong>+ Create</strong> untuk menambahkan.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bab.materials.map((mat) => (
                      <div
                        key={mat.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-xs transition flex items-center justify-between gap-4 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                              mat.type === "quiz"
                                ? "bg-amber-50 text-amber-600 border border-amber-200"
                                : mat.type === "assignment"
                                ? "bg-blue-50 text-blue-600 border border-blue-200"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            }`}
                          >
                            {mat.type === "quiz" ? (
                              <CheckSquare className="w-5 h-5" />
                            ) : mat.type === "assignment" ? (
                              <FileText className="w-5 h-5" />
                            ) : (
                              <BookOpen className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#1967D2] transition">
                              {mat.title}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {mat.dueDate ? `Batas waktu: ${mat.dueDate}` : `Diposting: ${mat.postedDate}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {mat.points && (
                            <span className="text-xs font-bold text-slate-600 px-2.5 py-1 bg-slate-100 rounded-lg">
                              {mat.points} Poin
                            </span>
                          )}
                          <button className="p-1 text-slate-400 hover:text-slate-700">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* ════════════════════════════════════════════════════════════════════════════
          4. TAB 3: PEOPLE (SESUAI DENGAN SCREENSHOT 3 DARI PENGGUNA)
          Teachers section + Students section (data Supabase)
         ════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "people" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-8 shadow-2xs w-full">
          {/* TEACHERS SECTION (Matches Screenshot 3) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1967D2]">
              <h2 className="text-2xl font-normal text-[#1967D2] font-sans">
                Teachers
              </h2>
              <button
                type="button"
                onClick={() => showToast("Buka dialog undang guru kolaborator.")}
                className="p-2 text-[#1967D2] hover:bg-blue-50 rounded-full transition cursor-pointer"
                title="Invite teacher"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Teacher 1: syaa px (from screenshot 3) */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-sm">
                    S
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    syaa px
                  </span>
                </div>
                <button className="p-1 text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Teacher 2: Guru Utama */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    S
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      Ibu Siti Rahmawati, M.Pd.
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Wali Kelas & Guru Pengampu
                    </span>
                  </div>
                </div>
                <button className="p-1 text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* STUDENTS SECTION (Matches Screenshot 3 + Real Data Supabase) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1967D2]">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-normal text-[#1967D2] font-sans">
                  Students
                </h2>
                <span className="text-xs text-slate-400 font-bold">
                  {studentsList.length} students
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => showToast("Dialog undang siswa via email/kode kelas.")}
                  className="p-2 text-[#1967D2] hover:bg-blue-50 rounded-full transition cursor-pointer"
                  title="Invite students"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {studentsList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-2xs">
                <PeopleEmptyGraphic onInvite={() => showToast("Dialog undang siswa via email atau kode kelas dibuka.")} />
              </div>
            ) : (
              /* Student List */
              <div className="divide-y divide-slate-100">
                {studentsList.map((st) => (
                  <div key={st.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition">
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                        <Image
                          src={resolveStudentPhoto(st)}
                          alt={st.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 block">
                          {st.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          NISN {st.nisn} • Rombel {st.kelas}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        {st.points} Poin
                      </span>
                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          5. TAB 4: GRADES (SESUAI DENGAN SCREENSHOT 4 DARI PENGGUNA)
          Buku Nilai Gradebook Siswa
         ════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "grades" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-2xs w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Buku Nilai & Rekap Hasil Belajar</h2>
              <p className="text-xs text-slate-500 font-medium">
                Rekap perolehan nilai siswa untuk {currentSubject.name}.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-[#1967D2] border border-blue-200">
                Passing Grade (KKM): 75
              </span>
            </div>
          </div>

          {studentsList.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-2xs">
              <GradesEmptyGraphic onInvite={() => showToast("Dialog undang siswa via email atau kode kelas dibuka.")} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-3 text-center">Bab 1 Quiz</th>
                    <th className="py-3 px-3 text-center">Bab 2 Tugas</th>
                    <th className="py-3 px-3 text-center">Kuis Sokratik</th>
                    <th className="py-3 px-3 text-center">PTS Asesmen</th>
                    <th className="py-3 px-4 text-center">Rata-rata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {studentsList.map((st, sIdx) => {
                    const score1 = 80 + ((sIdx * 3) % 20);
                    const score2 = 75 + ((sIdx * 4) % 22);
                    const score3 = 85 + ((sIdx * 2) % 15);
                    const score4 = 78 + ((sIdx * 5) % 20);
                    const avg = Math.round((score1 + score2 + score3 + score4) / 4);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{st.name}</div>
                          <div className="text-[10px] text-slate-400">NISN {st.nisn}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">{score1}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">{score2}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">{score3}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">{score4}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-black text-xs px-2.5 py-1 rounded-full ${
                              avg >= 75 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {avg}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          MODAL 1: FULLSCREEN CLASS CODE DISPLAY (Ketika icon [ ] diklik di banner)
         ════════════════════════════════════════════════════════════════════════════ */}
      {isClassCodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsClassCodeModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Kode Gabung Kelas Siswa
              </span>
              <h3 className="text-lg font-black text-slate-900">{currentSubject.name}</h3>
            </div>

            <div className="p-8 bg-blue-50/70 rounded-3xl border-2 border-blue-200">
              <span className="text-5xl sm:text-6xl font-black text-[#1967D2] tracking-widest font-mono select-all">
                {currentSubject.subjectCode}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  handleCopyCode(currentSubject.subjectCode);
                  setIsClassCodeModalOpen(false);
                }}
                className="px-6 py-2.5 rounded-full bg-[#1967D2] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Copy className="w-4 h-4" />
                <span>Salin Kode Kelas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          MODAL 2: CUSTOMIZE BANNER TEMA KELAS
         ════════════════════════════════════════════════════════════════════════════ */}
      {isCustomizeBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Customize Class Theme</h3>
              <button onClick={() => setIsCustomizeBannerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">Pilih Ilustrasi Tema Banner</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "tech", label: "Technology & Code", color: "bg-slate-800" },
                  { id: "math", label: "Mathematics & Geometri", color: "bg-blue-800" },
                  { id: "literature", label: "Bahasa & Sastra", color: "bg-emerald-800" },
                  { id: "english", label: "English & World", color: "bg-amber-800" },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      showToast(`Tema banner ${th.label} diterapkan.`);
                      setIsCustomizeBannerModalOpen(false);
                    }}
                    className={`p-3 rounded-2xl text-left border transition cursor-pointer ${
                      currentSubject.bannerIllustration === th.id
                        ? "border-[#1967D2] ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-full h-12 rounded-xl ${th.color} mb-2`} />
                    <span className="text-xs font-bold text-slate-800 block">{th.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          MODAL 3: CREATE ASSIGNMENT / MATERIAL MODAL
         ════════════════════════════════════════════════════════════════════════════ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {createModalType === "assignment"
                  ? "Buat Tugas Baru"
                  : createModalType === "quiz"
                  ? "Buat Kuis Evaluasi"
                  : createModalType === "topic"
                  ? "Tambah Topik / Bab Baru"
                  : "Tambah Modul Materi"}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast("Berhasil diterbitkan ke daftar tugas kelas!");
                setIsCreateModalOpen(false);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Judul *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bab 4: Latihan Mandiri SPLDV"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1967D2]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Deskripsi / Petunjuk</label>
                <textarea
                  rows={3}
                  placeholder="Petunjuk pengerjaan tugas atau rangkuman materi..."
                  className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1967D2]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1967D2] text-white text-xs font-bold hover:bg-blue-600 cursor-pointer"
                >
                  Terbitkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: CLASS CODE FULLSCREEN / PROJECTOR POPUP                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isClassCodeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsClassCodeModalOpen(false)}
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden text-slate-900 animate-in zoom-in-95 duration-150 flex flex-col p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Title and Close Button */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans tracking-tight">
                  {currentSubject.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {currentSubject.section} • {currentSubject.room}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClassCodeModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Huge Class Code Display */}
            <div className="py-8 sm:py-10 px-6 rounded-2xl bg-blue-50/60 border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-center space-y-2 select-all">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">
                Kode Kelas Resmi
              </span>
              <span className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-[#1967D2]">
                {currentSubject.subjectCode}
              </span>
              <p className="text-xs text-slate-500 font-medium pt-1">
                Berikan kode ini kepada siswa untuk bergabung ke kelas melalui menu (+) di atas dashboard siswa.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyCode(currentSubject.subjectCode)}
                  className="px-4 py-2.5 rounded-xl bg-[#1967D2] text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Salin Kode Kelas</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/dashboard?join=${currentSubject.subjectCode}`
                      );
                    }
                    showToast("Link undangan kelas disalin ke clipboard!");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer flex items-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  <span>Salin Link Undangan</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsClassCodeModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}



      {/* MODAL SESUAIKAN BANNER & FOTO KELAS */}
      <CustomizeBannerModal
        isOpen={isCustomizeBannerModalOpen}
        onClose={() => setIsCustomizeBannerModalOpen(false)}
        classNameTitle={currentSubject.name}
        sectionTitle={currentSubject.section}
        roomTitle={currentSubject.room}
        tokenCode={currentSubject.subjectCode}
        initialType={currentSubject.bannerType || (currentSubject.bannerPhotoUrl ? "photo" : "illustration")}
        initialIllustration={currentSubject.bannerIllustration}
        initialPhotoUrl={currentSubject.bannerPhotoUrl}
        initialThemeColor={currentSubject.themeColor}
        initialBgGradient={currentSubject.bgGradient}
        onSave={(data) => {
          const updatedSubject = {
            ...currentSubject,
            bannerType: data.bannerType,
            bannerIllustration: data.bannerIllustration,
            bannerPhotoUrl: data.bannerPhotoUrl,
            themeColor: data.themeColor,
            bgGradient: data.bgGradient,
          };
          if (onUpdateClass) {
            onUpdateClass(updatedSubject);
          }
          try {
            const stored = localStorage.getItem("thinksy_guru_classes");
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                const updatedList = parsed.map((c: any) =>
                  c.id === currentSubject.id ? { ...c, ...data } : c
                );
                localStorage.setItem("thinksy_guru_classes", JSON.stringify(updatedList));
              }
            } else {
              localStorage.setItem("thinksy_guru_classes", JSON.stringify([updatedSubject]));
            }
          } catch {}
          notifyClassUpdated();
          showToast("Tampilan banner dan foto kelas berhasil diperbarui!");
          setIsCustomizeBannerModalOpen(false);
        }}
      />

      {/* MODAL COMPOSER ANNOUNCEMENT (SESUAI SCREENSHOT 2 DENGAN TOOLBAR FORMAT B, I, U, LIST & ATTACHMENT) */}
      <AnnouncementComposerModal
        isOpen={isComposerModalOpen}
        onClose={() => {
          setIsComposerModalOpen(false);
          setEditingAnnouncement(null);
        }}
        onSubmit={handlePostOrUpdateAnnouncement}
        editingPost={editingAnnouncement}
        availableClasses={allSubjects.map((s) => ({ id: s.id, name: s.name }))}
        currentClassId={currentSubject.id}
      />

      {/* MODAL SETTING TUGAS UPCOMING MATEMATIKA (SESUAI REQUEST USER) */}
      {isUpcomingModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsUpcomingModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Atur Tugas Mendatang (Upcoming) - {currentSubject.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Tugas ini akan muncul di card Upcoming Guru dan disiarkan ke dashboard seluruh siswa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUpcomingModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const title = (form.elements.namedItem("taskTitle") as HTMLInputElement).value;
                const babIndex = Number((form.elements.namedItem("taskBab") as HTMLSelectElement).value);
                const dueDate = (form.elements.namedItem("taskDueDate") as HTMLInputElement).value;
                const dueTime = (form.elements.namedItem("taskDueTime") as HTMLInputElement).value;
                const selectedBab = currentSubject.babs[babIndex] || currentSubject.babs[0];

                handleSaveUpcomingTask({
                  title,
                  babNomor: selectedBab ? selectedBab.nomor : 1,
                  babJudul: selectedBab ? selectedBab.judul : "Materi Matematika",
                  dueDate: dueDate || "Besok",
                  dueTime: dueTime || "23:59",
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Judul Tugas / Instruksi Singkat
                </label>
                <input
                  type="text"
                  name="taskTitle"
                  required
                  defaultValue={upcomingTask?.title || "Latihan Mandiri Bab 1 & 2"}
                  placeholder="Contoh: Latihan Mandiri Bab 1: Bilangan Berpangkat"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1967D2]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Pilih Bab Pembelajaran Matematika
                </label>
                <select
                  name="taskBab"
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1967D2] bg-white cursor-pointer"
                >
                  {currentSubject.babs.map((b, idx) => (
                    <option key={b.id || idx} value={idx}>
                      Bab {b.nomor}: {b.judul}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Batas Waktu (Tanggal / Hari)
                  </label>
                  <input
                    type="text"
                    name="taskDueDate"
                    defaultValue={upcomingTask?.dueDate || "Besok"}
                    placeholder="Contoh: Besok, 24 Okt, dst."
                    className="w-full text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1967D2]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Jam Batas Pengumpulan
                  </label>
                  <input
                    type="text"
                    name="taskDueTime"
                    defaultValue={upcomingTask?.dueTime || "23:59"}
                    placeholder="Contoh: 23:59"
                    className="w-full text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1967D2]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {upcomingTask ? (
                  <button
                    type="button"
                    onClick={handleDeleteUpcomingTask}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Hapus Tugas Ini
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUpcomingModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1967D2] hover:bg-blue-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Simpan Tugas
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



// Authentic Google Classroom empty state graphics matching Screenshots 2, 3, 4
function ClassworkEmptyGraphic() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center select-none animate-in fade-in duration-150">
      <svg width="220" height="150" viewBox="0 0 220 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-full">
        {/* Books stack */}
        <rect x="50" y="115" width="100" height="14" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        <rect x="42" y="129" width="120" height="15" rx="2" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
        {/* Laptop */}
        <rect x="52" y="65" width="85" height="52" rx="4" fill="#FFFFFF" stroke="#64748B" strokeWidth="2.5" />
        <line x1="50" y1="117" x2="139" y2="117" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
        {/* Cute dog/animal character looking at screen */}
        <path d="M142 80 C140 68 152 58 162 64 C167 56 179 60 178 70 C186 72 189 82 184 89 C190 95 186 108 175 110 C165 112 142 110 142 98 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2.5" />
        {/* Ears */}
        <polygon points="144,65 150,50 156,62" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
        <polygon points="168,62 176,52 179,66" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
        {/* Eyes & nose */}
        <circle cx="156" cy="74" r="2" fill="#475569" />
        <circle cx="168" cy="74" r="2" fill="#475569" />
        <ellipse cx="162" cy="80" rx="3" ry="2" fill="#475569" />
        {/* Coffee mug */}
        <rect x="130" y="96" width="12" height="16" rx="2" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1.5" />
        {/* Tail */}
        <path d="M182 98 Q196 95 198 106 Q194 112 184 108" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
      </svg>
      <h3 className="mt-4 text-base font-bold text-slate-800">This is where you&apos;ll assign work</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">
        You can add assignments and other work for the class, then organize it into topics
      </p>
    </div>
  );
}

function PeopleEmptyGraphic({ onInvite }: { onInvite?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center select-none animate-in fade-in duration-150">
      <svg width="220" height="150" viewBox="0 0 220 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-full">
        {/* Notebook pages */}
        <path d="M50 110 L140 85 L160 115 L70 140 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        <path d="M52 118 L142 93 L162 123 L72 148 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
        {/* Sleeping Cat / mouse */}
        <path d="M78 95 C68 85 75 68 90 68 C100 68 105 74 110 74 C116 74 122 68 132 72 C140 76 142 88 138 98 C132 108 100 110 88 106 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2.5" />
        {/* Ears */}
        <polygon points="80,72 85,60 92,70" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        <polygon points="122,70 128,58 134,70" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        {/* Closed Eyes */}
        <path d="M88 80 Q92 84 96 80" stroke="#64748B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M118 80 Q122 84 126 80" stroke="#64748B" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Whiskers */}
        <line x1="80" y1="83" x2="72" y2="82" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="80" y1="86" x2="73" y2="88" stroke="#94A3B8" strokeWidth="1.5" />
        {/* Tail */}
        <path d="M136 94 Q152 92 150 104 Q142 108 134 102" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
        {/* Pencil in front */}
        <rect x="75" y="125" width="55" height="7" rx="2" transform="rotate(-15 75 125)" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
        <polygon points="68,131 75,127 75,133" fill="#64748B" />
        {/* Leaf sprig */}
        <path d="M45 110 Q40 85 45 70" stroke="#CBD5E1" strokeWidth="2" fill="none" />
        <ellipse cx="40" cy="78" rx="6" ry="3" transform="rotate(-30 40 78)" fill="#E2E8F0" stroke="#CBD5E1" />
        <ellipse cx="46" cy="90" rx="6" ry="3" transform="rotate(30 46 90)" fill="#E2E8F0" stroke="#CBD5E1" />
      </svg>
      <h3 className="mt-4 text-base font-bold text-slate-800">Add students to this class</h3>
      <button
        type="button"
        onClick={onInvite}
        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-[#1967D2] hover:bg-blue-50 transition border border-transparent hover:border-blue-200 cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        <span>Invite students</span>
      </button>
    </div>
  );
}

function GradesEmptyGraphic({ onInvite }: { onInvite?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center select-none animate-in fade-in duration-150">
      <svg width="220" height="170" viewBox="0 0 220 170" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-full">
        {/* Fishbowl Glass */}
        <path d="M70 45 C50 70 50 115 80 135 C95 145 125 145 140 135 C170 115 170 70 150 45 Z" fill="#F8FAFC" stroke="#64748B" strokeWidth="2.5" />
        <ellipse cx="110" cy="45" rx="40" ry="10" fill="#FFFFFF" stroke="#64748B" strokeWidth="2.5" />
        {/* Water Level */}
        <path d="M60 90 Q85 85 110 90 Q135 95 160 90 C165 105 160 125 140 135 C125 145 95 145 80 135 C65 125 58 105 60 90 Z" fill="#E2E8F0" opacity="0.6" />
        {/* Calculator inside bowl */}
        <rect x="78" y="70" width="34" height="48" rx="4" fill="#FFFFFF" stroke="#475569" strokeWidth="2" />
        <rect x="83" y="75" width="24" height="10" rx="1.5" fill="#CBD5E1" stroke="#475569" strokeWidth="1" />
        {/* Calculator keypad dots */}
        <circle cx="87" cy="92" r="2" fill="#64748B" />
        <circle cx="95" cy="92" r="2" fill="#64748B" />
        <circle cx="103" cy="92" r="2" fill="#64748B" />
        <circle cx="87" cy="100" r="2" fill="#64748B" />
        <circle cx="95" cy="100" r="2" fill="#64748B" />
        <circle cx="103" cy="100" r="2" fill="#64748B" />
        <circle cx="87" cy="108" r="2" fill="#64748B" />
        <circle cx="95" cy="108" r="2" fill="#64748B" />
        <circle cx="103" cy="108" r="2" fill="#64748B" />
        {/* Cute Fish */}
        <path d="M125 96 C135 92 142 96 145 99 L152 94 L150 102 L152 110 L145 105 C142 108 135 112 125 108 C120 104 120 100 125 96 Z" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
        <circle cx="130" cy="100" r="1" fill="#1E293B" />
        {/* Seaweed / Plant */}
        <path d="M148 135 Q145 115 150 100 Q155 85 152 75" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M150 100 Q158 95 162 98" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M148 115 Q140 110 138 114" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Bubbles */}
        <circle cx="118" cy="80" r="2.5" fill="none" stroke="#94A3B8" strokeWidth="1.2" />
        <circle cx="123" cy="70" r="3.5" fill="none" stroke="#94A3B8" strokeWidth="1.2" />
        <circle cx="120" cy="60" r="2" fill="none" stroke="#94A3B8" strokeWidth="1.2" />
      </svg>
      <h3 className="mt-4 text-base font-bold text-slate-800">This is where you&apos;ll view and manage grades</h3>
      <button
        type="button"
        onClick={onInvite}
        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-[#1967D2] hover:bg-blue-50 transition border border-transparent hover:border-blue-200 cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        <span>Invite students</span>
      </button>
    </div>
  );
}
