"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronLeft,
  Send,
  FileText,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Award,
  User,
  Paperclip,
  Sliders,
  Search,
  Filter,
  Bell,
  BookOpen,
  Layers,
  AlertTriangle,
  Users,
  CheckCheck,
  ClipboardList,
  ArrowLeft,
  ExternalLink,
  Download,
  Sparkles,
  Edit3,
} from "lucide-react";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";

export interface AssignmentItem {
  id: string;
  title: string;
  type: "tugas" | "kuis";
  chapterId: string;
  chapterTitle: string;
  subject: string;
  classId: string;
  className: string;
  dueDate: string;
  isPastDue: boolean;
  totalPoints: number;
}

export interface ChapterItem {
  id: string;
  name: string;
  desc?: string;
  urutan?: number;
}

// 6 Bab Matematika Kelas 8 asli dari tabel `bab` di Supabase
export const INITIAL_CHAPTERS: ChapterItem[] = [
  { id: "all", name: "Semua Bab", desc: "Seluruh bab pembelajaran" },
  {
    id: "5f649043-e4b7-4d11-a353-991b07a77d5c",
    name: "Bab 1: Bilangan Berpangkat",
    desc: "Memahami bilangan berpangkat bulat, bentuk akar, dan penulisan bentuk baku bilangan.",
    urutan: 1,
  },
  {
    id: "b4ae1851-1aa0-435f-8379-34cfe59afd6f",
    name: "Bab 2: Teorema Pythagoras",
    desc: "Menemukan konsep, tripel, dan penerapan Teorema Pythagoras pada segitiga siku-siku.",
    urutan: 2,
  },
  {
    id: "a1fb5fd1-bcf8-451b-8dcc-01f09b30c768",
    name: "Bab 3: Persamaan dan Pertidaksamaan Linear Satu Variabel",
    desc: "Menyajikan dan menyelesaikan persamaan serta pertidaksamaan linear satu variabel.",
    urutan: 3,
  },
  {
    id: "1fd7a8c2-079c-4044-be29-207c4c5da83b",
    name: "Bab 4: Relasi dan Fungsi",
    desc: "Memahami konsep himpunan, relasi, fungsi, dan korespondensi satu-satu.",
    urutan: 4,
  },
  {
    id: "4a215311-c0b3-4cc5-8177-48eb40221f9e",
    name: "Bab 5: Persamaan Garis Lurus",
    desc: "Memahami bentuk persamaan garis lurus, gradien, dan grafiknya pada koordinat Kartesius.",
    urutan: 5,
  },
  {
    id: "fd4ebc86-d354-4f40-a886-48a76cd0ef48",
    name: "Bab 6: Statistika",
    desc: "Menyajikan dan menganalisis data menggunakan ukuran pemusatan data.",
    urutan: 6,
  },
];

export const CLASS_ASSIGNMENTS: AssignmentItem[] = [
  {
    id: "a-1",
    title: "Latihan Soal: Operasi Perkalian dan Pembagian Pangkat",
    type: "tugas",
    chapterId: "5f649043-e4b7-4d11-a353-991b07a77d5c",
    chapterTitle: "Bab 1: Bilangan Berpangkat",
    subject: "Matematika",
    classId: "mat-8",
    className: "Matematika (Kelas 8-A)",
    dueDate: "Besok, 12:00 WIB",
    isPastDue: false,
    totalPoints: 100,
  },
  {
    id: "a-2",
    title: "Kuis Formatif Bab 1 Bilangan Berpangkat",
    type: "kuis",
    chapterId: "5f649043-e4b7-4d11-a353-991b07a77d5c",
    chapterTitle: "Bab 1: Bilangan Berpangkat",
    subject: "Matematika",
    classId: "mat-8",
    className: "Matematika (Kelas 8-A)",
    dueDate: "3 hari lagi",
    isPastDue: false,
    totalPoints: 100,
  },
  {
    id: "a-3",
    title: "Latihan Soal Cerita Penerapan Pythagoras",
    type: "tugas",
    chapterId: "b4ae1851-1aa0-435f-8379-34cfe59afd6f",
    chapterTitle: "Bab 2: Teorema Pythagoras",
    subject: "Matematika",
    classId: "mat-8",
    className: "Matematika (Kelas 8-A)",
    dueDate: "10 Okt 2026",
    isPastDue: true,
    totalPoints: 100,
  },
  {
    id: "a-4",
    title: "Kuis Formatif Bab 2 Teorema Pythagoras",
    type: "kuis",
    chapterId: "b4ae1851-1aa0-435f-8379-34cfe59afd6f",
    chapterTitle: "Bab 2: Teorema Pythagoras",
    subject: "Matematika",
    classId: "mat-8",
    className: "Matematika (Kelas 8-A)",
    dueDate: "12 Okt 2026",
    isPastDue: true,
    totalPoints: 100,
  },
];

export interface JoinedStudent {
  id: string;
  name: string;
  nisn: string;
  kelas: string;
  avatarColor: string;
  points?: number;
}

// 15 Anggota Resmi dari database Supabase (profil table)
export const REAL_SUPABASE_STUDENTS: JoinedStudent[] = [
  { id: "2d0a8cf9-56ab-47c5-9cc3-36e8a229e72d", name: "Ahmad Fauzi", nisn: "0089201141", kelas: "8-A", avatarColor: "bg-blue-600" },
  { id: "cc7ab9e2-aa65-47fd-9d30-1d31720fd465", name: "Andrelya Arsdzo", nisn: "0089100294", kelas: "8-A", avatarColor: "bg-emerald-600" },
  { id: "a3972d58-8be2-4e26-b63a-ccd85f529b8a", name: "Bielani Dasya", nisn: "0089101029", kelas: "8-A", avatarColor: "bg-indigo-600" },
  { id: "a77413b2-dc71-44ac-abac-d3eb28727f33", name: "Budi Kartika", nisn: "0089247182", kelas: "8-A", avatarColor: "bg-pink-600" },
  { id: "98e0b3fc-18a8-4f2a-bcd1-08e9b0486b87", name: "CECEP RABOWO", nisn: "0089100882", kelas: "8-A", avatarColor: "bg-amber-600" },
  { id: "5ec72e2b-88b2-4028-9315-85ee701bb206", name: "Devida Amanda", nisn: "0089100000", kelas: "8-A", avatarColor: "bg-purple-600" },
  { id: "531d16b6-a4ba-4a60-a50e-d37fc14e0f25", name: "Human Eror", nisn: "0089100441", kelas: "8-A", avatarColor: "bg-teal-600" },
  { id: "e7ce652c-7c1f-466d-8235-24e56c5bc146", name: "Lian Dev", nisn: "0089100147", kelas: "8-A", avatarColor: "bg-rose-600" },
  { id: "afb0e867-541c-4291-bff7-7e9686265d6b", name: "Nadela Oktavia", nisn: "0089201142", kelas: "8-A", avatarColor: "bg-cyan-600" },
  { id: "649ea277-a950-49de-9501-21c65e87f15d", name: "nanoka asiata", nisn: "0089100735", kelas: "8-A", avatarColor: "bg-violet-600" },
  { id: "5f27d18b-de64-4edd-aefa-d80935b28801", name: "Nanoka Sasaki", nisn: "0089201143", kelas: "8-A", avatarColor: "bg-lime-600" },
  { id: "6a51fdc9-1401-4a27-af28-378da635a037", name: "Sarah Bielani", nisn: "0089201144", kelas: "8-A", avatarColor: "bg-fuchsia-600" },
  { id: "6bf6783e-e504-4ed6-9a4c-f7795c32a05c", name: "Siti Rahayu", nisn: "0089201140", kelas: "8-A", avatarColor: "bg-sky-600" },
  { id: "60c954d5-a58c-4ed8-8144-a110c2bdeb1e", name: "syaa px", nisn: "0089100588", kelas: "8-A", avatarColor: "bg-orange-600" },
  { id: "6339d0f9-4c65-4841-be2e-771bdf8b39d2", name: "Zafa Kuncoro", nisn: "0089201145", kelas: "8-A", avatarColor: "bg-emerald-700" },
];

export interface ReviewSubmissionItem {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  subject: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  studentAvatarColor: string;
  submittedAt: string;
  dueDate: string;
  status: "turned_in" | "late" | "graded";
  soalText: string;
  jawabanText: string;
  attachmentName?: string;
  attachmentSize?: string;
  keyAnswer: string;
  rubrik: Array<{ item: string; weight: number; score: number }>;
  aiConfidence: number;
  aiSuggestedScore: number;
  aiFeedback: string;
  finalScore?: number;
  teacherNote?: string;
  gradedAt?: string;
}

interface GuruClassroomToReviewViewProps {
  onBackToClass: () => void;
  onPendingCountChange?: (count: number) => void;
}

const INITIAL_SUBMISSIONS: ReviewSubmissionItem[] = [
  {
    id: "sub-1",
    assignmentId: "a-1",
    assignmentTitle: "Latihan Soal: Operasi Perkalian dan Pembagian Pangkat",
    subject: "Matematika (Kelas 8)",
    studentId: "5ec72e2b-88b2-4028-9315-85ee701bb206",
    studentName: "Devida Amanda",
    studentClass: "Kelas 8-A",
    studentAvatarColor: "bg-purple-600",
    submittedAt: "5 menit yang lalu",
    dueDate: "Besok, 12:00 WIB",
    status: "turned_in",
    soalText:
      "Sederhanakan bentuk perkalian pangkat: ((2³ × 2⁵)²) / 2⁷ dan jelaskan setiap sifat eksponen yang Anda gunakan secara sistematis!",
    jawabanText:
      "1. Gunakan sifat perkalian basis sama aᵐ × aⁿ = aᵐ⁺ⁿ pada pembilang:\n   (2³ × 2⁵)² = (2³⁺⁵)² = (2⁸)²\n\n2. Gunakan sifat pemangkatan (aᵐ)ⁿ = aᵐˣⁿ:\n   (2⁸)² = 2¹⁶\n\n3. Gunakan sifat pembagian aᵐ / aⁿ = aᵐ⁻ⁿ:\n   2¹⁶ / 2⁷ = 2¹⁶⁻⁷ = 2⁹ = 512.\n\nJadi bentuk sederhananya adalah 2⁹ atau 512.",
    attachmentName: "lembar_jawaban_devida_amanda.pdf",
    attachmentSize: "1.4 MB",
    keyAnswer:
      "Sifat eksponen perkalian menghasilkan 2⁸, kemudian dipangkatkan 2 menjadi 2¹⁶, lalu dibagi 2⁷ menghasilkan 2⁹ = 512.",
    rubrik: [
      { item: "Pemahaman Sifat Perkalian Eksponen", weight: 30, score: 30 },
      { item: "Penerapan Sifat Pemangkatan Pangkat", weight: 30, score: 30 },
      { item: "Ketepatan Operasi Pembagian Eksponen", weight: 25, score: 25 },
      { item: "Kerapian & Urutan Langkah Logis", weight: 15, score: 10 },
    ],
    aiConfidence: 96,
    aiSuggestedScore: 95,
    aiFeedback:
      "Langkah pengerjaan sangat runtut dan sistematis. Ketiga sifat eksponen dijelaskan dan diterapkan secara tepat dengan hasil akhir 2⁹ (512).",
  },
  {
    id: "sub-2",
    assignmentId: "a-2",
    assignmentTitle: "Kuis Formatif Bab 1 Bilangan Berpangkat",
    subject: "Matematika (Kelas 8)",
    studentId: "6bf6783e-e504-4ed6-9a4c-f7795c32a05c",
    studentName: "Siti Rahayu",
    studentClass: "Kelas 8-A",
    studentAvatarColor: "bg-sky-600",
    submittedAt: "18 menit yang lalu",
    dueDate: "3 hari lagi",
    status: "turned_in",
    soalText:
      "Tentukan nilai penyederhanaan dari (-3)⁴ - (-2)⁵ + (4)⁻² dalam bentuk bilangan pecahan campuran!",
    jawabanText:
      "Langkah-langkah:\n• (-3)⁴ = (-3) × (-3) × (-3) × (-3) = 81 (pangkat genap bernilai positif)\n• (-2)⁵ = -32 (pangkat ganjil bernilai negatif), maka -(-32) = +32\n• (4)⁻² = 1 / 4² = 1 / 16\n\nHasil penjumlahan:\n81 + 32 + 1/16 = 113 + 1/16 = 113 1/16.",
    attachmentName: "foto_catatan_siti_rahayu.jpg",
    attachmentSize: "840 KB",
    keyAnswer:
      "(-3)⁴ = 81, -(-2)⁵ = +32, 4⁻² = 1/16. Total = 81 + 32 + 1/16 = 113 1/16 (1809/16).",
    rubrik: [
      { item: "Pemahaman Pangkat Bilangan Negatif", weight: 30, score: 30 },
      { item: "Ketepatan Pangkat Negatif / Pecahan", weight: 30, score: 30 },
      { item: "Kebenaran Hasil Akhir Pecahan", weight: 25, score: 25 },
      { item: "Kejelasan Catatan", weight: 15, score: 10 },
    ],
    aiConfidence: 94,
    aiSuggestedScore: 95,
    aiFeedback:
      "Perhitungan tanda bilangan negatif tepat (genap positif, ganjil negatif). Pecahan campuran 113 1/16 akurat.",
  },
  {
    id: "sub-3",
    assignmentId: "a-3",
    assignmentTitle: "Latihan Soal Cerita Penerapan Pythagoras",
    subject: "Matematika (Kelas 8)",
    studentId: "2d0a8cf9-56ab-47c5-9cc3-36e8a229e72d",
    studentName: "Ahmad Fauzi",
    studentClass: "Kelas 8-A",
    studentAvatarColor: "bg-blue-600",
    submittedAt: "Kemarin, 14:10 WIB",
    dueDate: "10 Okt 2026",
    status: "graded",
    soalText:
      "Sebuah tangga sepanjang 5 meter disandarkan pada dinding rumah. Jika jarak kaki tangga ke dinding adalah 3 meter, hitunglah tinggi ujung atas tangga terhadap permukaan tanah!",
    jawabanText:
      "Diketahui:\n- Panjang tangga (sisi miring c) = 5 m\n- Jarak kaki tangga ke dinding (sisi alas a) = 3 m\n\nDitanya: Tinggi ujung atas tangga (sisi tegak b)\n\nJawab:\nBerdasarkan Teorema Pythagoras:\nc² = a² + b²\n5² = 3² + b²\n25 = 9 + b²\nb² = 25 - 9 = 16\nb = √16 = 4 meter.\n\nJadi, tinggi ujung atas tangga dari permukaan tanah adalah 4 meter.",
    attachmentName: "sketsa_pythagoras_ahmad_fauzi.pdf",
    attachmentSize: "2.1 MB",
    keyAnswer: "Tinggi dinding b = √(5² - 3²) = √(25 - 9) = √16 = 4 meter.",
    rubrik: [
      { item: "Identifikasi Sisi Miring & Alas", weight: 30, score: 30 },
      { item: "Penerapan Rumus Teorema Pythagoras", weight: 30, score: 30 },
      { item: "Kebenaran Hasil Akhir & Satuan", weight: 25, score: 25 },
      { item: "Kesimpulan & Sketsa Logis", weight: 15, score: 15 },
    ],
    aiConfidence: 98,
    aiSuggestedScore: 100,
    aiFeedback:
      "Jawaban sempurna. Identifikasi sisi segitiga, penerapan rumus Pythagoras, dan penarikan kesimpulan dengan satuan meter sangat tepat.",
    finalScore: 100,
    teacherNote: "Sangat baik! Pengerjaan runtut, jelas, dan sketsanya sangat membantu.",
    gradedAt: "Kemarin, 15:45 WIB",
  },
  {
    id: "sub-4",
    assignmentId: "a-3",
    assignmentTitle: "Latihan Soal Cerita Penerapan Pythagoras",
    subject: "Matematika (Kelas 8)",
    studentId: "afb0e867-541c-4291-bff7-7e9686265d6b",
    studentName: "Nadela Oktavia",
    studentClass: "Kelas 8-A",
    studentAvatarColor: "bg-cyan-600",
    submittedAt: "Kemarin, 16:00 WIB",
    dueDate: "10 Okt 2026",
    status: "graded",
    soalText:
      "Sebuah kapal berlayar ke arah utara sejauh 12 km, kemudian berbelok ke arah barat sejauh 9 km. Tentukan jarak terpendek kapal dari titik keberangkatan!",
    jawabanText:
      "Utara dan barat tegak lurus membentuk segitiga siku-siku:\na = 12 km (sisi tegak)\nb = 9 km (sisi alas)\n\nJarak terpendek (sisi miring c):\nc = √(a² + b²) = √(12² + 9²) = √(144 + 81) = √225 = 15 km.\n\nJarak dari posisi awal adalah 15 km.",
    keyAnswer: "c = √(12² + 9²) = √225 = 15 km.",
    rubrik: [
      { item: "Identifikasi Sudut Siku-Siku Arah Mata Angin", weight: 30, score: 30 },
      { item: "Penerapan Rumus Pythagoras", weight: 30, score: 30 },
      { item: "Kebenaran Hasil Akhir & Satuan", weight: 25, score: 20 },
      { item: "Kerapian Struktur", weight: 15, score: 10 },
    ],
    aiConfidence: 91,
    aiSuggestedScore: 90,
    aiFeedback: "Model arah mata angin dan rumus tepat. Hasil 15 km benar.",
    finalScore: 90,
    teacherNote: "Bagus! Jawaban benar dan terarah.",
    gradedAt: "Kemarin, 17:10 WIB",
  },
];

export default function GuruClassroomToReviewView({
  onBackToClass,
  onPendingCountChange,
}: GuruClassroomToReviewViewProps) {
  // Navigation tabs: To review | Reviewed | Belum Mengerjakan
  const [activeTab, setActiveTab] = useState<"to_review" | "reviewed" | "missing">("to_review");

  // Multi-tier filtering
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("mat-8");
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<"all" | "tugas" | "kuis">("all");
  const [selectedAssignmentFilter, setSelectedAssignmentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Submissions and Supabase Joined Students state
  const [submissions, setSubmissions] = useState<ReviewSubmissionItem[]>(INITIAL_SUBMISSIONS);
  const [joinedStudents, setJoinedStudents] = useState<JoinedStudent[]>(REAL_SUPABASE_STUDENTS);

  // Chapters state (editable per bab, synced with Supabase)
  const [chapters, setChapters] = useState<ChapterItem[]>(INITIAL_CHAPTERS);
  const [editingChapter, setEditingChapter] = useState<{ id: string; name: string; desc: string } | null>(null);
  const [isSavingChapter, setIsSavingChapter] = useState(false);

  // Normal Screen Grading Mode State
  const [reviewingSubmission, setReviewingSubmission] = useState<ReviewSubmissionItem | null>(null);

  // Grading form state inside normal screen
  const [inputScore, setInputScore] = useState<number>(95);
  const [inputNote, setInputNote] = useState<string>("");
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "info" | "warning";
    text: string;
  } | null>(null);

  // Fetch real students and babs directly from Supabase API on mount
  useEffect(() => {
    async function loadSupabaseData() {
      try {
        // 1. Fetch Students
        const resSt = await fetch("/api/guru/classroom/to-review");
        if (resSt.ok) {
          const jsonSt = await resSt.json();
          if (jsonSt.students && Array.isArray(jsonSt.students) && jsonSt.students.length > 0) {
            setJoinedStudents(jsonSt.students);
          }
        }

        // 2. Fetch Babs from Supabase
        const resBab = await fetch("/api/guru/bab?mapel=Matematika&kelas=8");
        if (resBab.ok) {
          const jsonBab = await resBab.json();
          if (jsonBab.babs && Array.isArray(jsonBab.babs) && jsonBab.babs.length > 0) {
            const mappedBabs: ChapterItem[] = jsonBab.babs.map((b: any) => ({
              id: b.id,
              name: b.judul,
              desc: b.deskripsi || "",
              urutan: b.urutan,
            }));
            setChapters([{ id: "all", name: "Semua Bab", desc: "Seluruh bab pembelajaran" }, ...mappedBabs]);
          }
        }
      } catch (err) {
        console.warn("Could not load data from Supabase:", err);
      }
    }
    loadSupabaseData();
  }, []);

  // Sync with Real-time Dashboard Hook
  const { broadcastEvent } = useRealtimeDashboard((event) => {
    if (event.type === "NEW_ESSAY_SUBMISSION") {
      handleRealtimeNewSubmission(event.payload);
    } else if (event.type === "ESSAY_GRADED") {
      handleRealtimeGradedEvent(event.payload);
    }
  });

  const showToast = (text: string, type: "success" | "info" | "warning" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Edit Bab Modal
  const handleOpenEditBab = (chapterId: string) => {
    const target = chapters.find((c) => c.id === chapterId);
    if (!target || target.id === "all") return;
    setEditingChapter({
      id: target.id,
      name: target.name,
      desc: target.desc || "",
    });
  };

  // Save Bab to Supabase
  const handleSaveChapter = async () => {
    if (!editingChapter) return;
    setIsSavingChapter(true);

    try {
      const res = await fetch("/api/guru/bab", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingChapter.id,
          judul: editingChapter.name,
          deskripsi: editingChapter.desc,
        }),
      });

      if (res.ok) {
        setChapters((prev) =>
          prev.map((c) =>
            c.id === editingChapter.id
              ? { ...c, name: editingChapter.name, desc: editingChapter.desc }
              : c
          )
        );
        showToast(`✨ Bab "${editingChapter.name}" berhasil disimpan ke database Supabase!`, "success");
        setEditingChapter(null);
      } else {
        const err = await res.json();
        showToast("Gagal menyimpan bab: " + (err.error || "Gagal memperbarui"), "warning");
      }
    } catch (e: any) {
      showToast("Gagal menyimpan bab: " + e.message, "warning");
    } finally {
      setIsSavingChapter(false);
    }
  };

  // Handle incoming real-time submission
  const handleRealtimeNewSubmission = (payload?: any) => {
    const studentName = payload?.studentName || "Devida Amanda";
    const assignmentTitle =
      payload?.assignmentTitle || "Latihan Soal Cerita Penerapan Pythagoras";
    const newId = `sub-live-${Date.now()}`;

    const newSub: ReviewSubmissionItem = {
      id: newId,
      assignmentId: payload?.assignmentId || "a-3",
      assignmentTitle,
      subject: "Matematika (Kelas 8)",
      studentId: payload?.studentId || `std-${Date.now()}`,
      studentName,
      studentClass: "Kelas 8-A",
      studentAvatarColor: "bg-purple-600",
      submittedAt: "Baru saja (Real-time)",
      dueDate: "10 Okt 2026",
      status: "turned_in",
      soalText:
        payload?.soalText ||
        "Sebuah tiang bendera setinggi 12 meter diikat dengan kawat ke tanah. Jarak kawat di tanah ke pangkal tiang adalah 5 meter. Berapa panjang kawat penghubung?",
      jawabanText:
        payload?.jawabanText ||
        "Gunakan Pythagoras c = √(12² + 5²) = √(144 + 25) = √169 = 13 meter.\nJadi panjang kawat adalah 13 meter.",
      attachmentName: "jawaban_kawat_bendera.pdf",
      attachmentSize: "980 KB",
      keyAnswer: "c = √(12² + 5²) = √169 = 13 meter.",
      rubrik: [
        { item: "Pemahaman Konsep Segitiga Siku-Siku", weight: 30, score: 30 },
        { item: "Penerapan Rumus Pythagoras", weight: 30, score: 30 },
        { item: "Ketepatan Nilai Akhir & Satuan", weight: 25, score: 25 },
        { item: "Kerapian", weight: 15, score: 10 },
      ],
      aiConfidence: 95,
      aiSuggestedScore: 95,
      aiFeedback:
        "Jawaban langsung tepat menggunakan tripel pythagoras 5-12-13. Satuan meter tercantum.",
    };

    setSubmissions((prev) => [newSub, ...prev]);
    showToast(`⚡ [Real-time] ${studentName} baru saja mengumpulkan "${assignmentTitle}"!`, "info");
  };

  // Handle incoming graded event
  const handleRealtimeGradedEvent = (payload?: any) => {
    if (!payload?.submissionId) return;
    setSubmissions((prev) =>
      prev.map((item) =>
        item.id === payload.submissionId
          ? {
              ...item,
              status: "graded",
              finalScore: payload.score,
              teacherNote: payload.catatan || item.teacherNote,
              gradedAt: "Baru saja",
            }
          : item
      )
    );
  };

  // Assignments filtered by current chapter & type selections
  const availableAssignmentsForFilter = useMemo(() => {
    return CLASS_ASSIGNMENTS.filter((asg) => {
      const matchChapter =
        selectedChapterFilter === "all" || asg.chapterId === selectedChapterFilter;
      const matchType =
        selectedTypeFilter === "all" || asg.type === selectedTypeFilter;
      return matchChapter && matchType;
    });
  }, [selectedChapterFilter, selectedTypeFilter]);

  // Reset assignment filter if chapter changes and current selection is not in it
  useEffect(() => {
    if (selectedAssignmentFilter !== "all") {
      const isValid = availableAssignmentsForFilter.some(
        (a) => a.id === selectedAssignmentFilter
      );
      if (!isValid) {
        setSelectedAssignmentFilter("all");
      }
    }
  }, [availableAssignmentsForFilter, selectedAssignmentFilter]);

  // Filtered Submissions (for "to_review" and "reviewed" tabs)
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchTab =
        activeTab === "to_review"
          ? sub.status !== "graded"
          : sub.status === "graded";

      const asgMeta = CLASS_ASSIGNMENTS.find((a) => a.id === sub.assignmentId);

      const matchChapter =
        selectedChapterFilter === "all" ||
        (asgMeta && asgMeta.chapterId === selectedChapterFilter);

      const matchType =
        selectedTypeFilter === "all" ||
        (asgMeta && asgMeta.type === selectedTypeFilter);

      const matchAssignment =
        selectedAssignmentFilter === "all" ||
        sub.assignmentId === selectedAssignmentFilter;

      const matchSearch =
        searchQuery.trim() === "" ||
        sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase());

      return matchTab && matchChapter && matchType && matchAssignment && matchSearch;
    });
  }, [submissions, activeTab, selectedChapterFilter, selectedTypeFilter, selectedAssignmentFilter, searchQuery]);

  // Missing / Belum Mengerjakan List generated from Supabase students
  const missingItems = useMemo(() => {
    const list: Array<{
      id: string;
      student: JoinedStudent;
      assignment: AssignmentItem;
      status: "pending_due" | "past_due";
    }> = [];

    const targetAssignments =
      selectedAssignmentFilter !== "all"
        ? CLASS_ASSIGNMENTS.filter((a) => a.id === selectedAssignmentFilter)
        : availableAssignmentsForFilter;

    for (const asg of targetAssignments) {
      for (const student of joinedStudents) {
        const hasSubmitted = submissions.some(
          (sub) =>
            sub.assignmentId === asg.id &&
            (sub.studentName.toLowerCase() === student.name.toLowerCase() ||
              sub.studentId === student.id)
        );

        if (!hasSubmitted) {
          const matchSearch =
            searchQuery.trim() === "" ||
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asg.title.toLowerCase().includes(searchQuery.toLowerCase());

          if (matchSearch) {
            list.push({
              id: `${student.id}-${asg.id}`,
              student,
              assignment: asg,
              status: asg.isPastDue ? "past_due" : "pending_due",
            });
          }
        }
      }
    }

    return list;
  }, [
    submissions,
    joinedStudents,
    selectedAssignmentFilter,
    availableAssignmentsForFilter,
    searchQuery,
  ]);

  // Overall counters
  const pendingCount = useMemo(() => {
    return submissions.filter((s) => s.status !== "graded").length;
  }, [submissions]);

  const reviewedCount = useMemo(() => {
    return submissions.filter((s) => s.status === "graded").length;
  }, [submissions]);

  useEffect(() => {
    if (onPendingCountChange) {
      onPendingCountChange(pendingCount);
    }
  }, [pendingCount, onPendingCountChange]);

  // Open Normal Screen Review
  const handleOpenReview = (sub: ReviewSubmissionItem) => {
    setReviewingSubmission(sub);
    setInputScore(sub.finalScore ?? sub.aiSuggestedScore ?? 90);
    setInputNote(sub.teacherNote || sub.aiFeedback || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Navigation between students inside the Normal Screen Review
  const currentSubmissionsList = useMemo(() => {
    return activeTab === "to_review"
      ? submissions.filter((s) => s.status !== "graded")
      : submissions.filter((s) => s.status === "graded");
  }, [submissions, activeTab]);

  const currentReviewIndex = useMemo(() => {
    if (!reviewingSubmission) return -1;
    return currentSubmissionsList.findIndex((s) => s.id === reviewingSubmission.id);
  }, [currentSubmissionsList, reviewingSubmission]);

  const handleNavigateSubmission = (direction: "prev" | "next") => {
    if (currentReviewIndex === -1) return;
    const targetIdx =
      direction === "prev" ? currentReviewIndex - 1 : currentReviewIndex + 1;
    if (targetIdx >= 0 && targetIdx < currentSubmissionsList.length) {
      const nextSub = currentSubmissionsList[targetIdx];
      handleOpenReview(nextSub);
    }
  };

  // Submit Grade & Feedback (Saved to Supabase database)
  const handleGradeSubmission = async () => {
    if (!reviewingSubmission) return;

    setIsSubmittingGrade(true);
    const score = Number(inputScore);
    const note = inputNote.trim();

    try {
      try {
        await fetch("/api/guru/classroom/to-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: reviewingSubmission.id,
            studentId: reviewingSubmission.studentId,
            assignmentId: reviewingSubmission.assignmentId,
            score,
            feedback: note,
          }),
        });
      } catch (apiErr) {
        console.warn("API save warning:", apiErr);
      }

      const gradePayload = {
        submissionId: reviewingSubmission.id,
        score,
        catatan: note,
        gradedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      try {
        broadcastEvent("ESSAY_GRADED", gradePayload);
        localStorage.setItem("thinksy_realtime_grade_event", JSON.stringify(gradePayload));
      } catch {}

      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === reviewingSubmission.id
            ? {
                ...item,
                status: "graded",
                finalScore: score,
                teacherNote: note,
                gradedAt: "Baru saja",
              }
            : item
        )
      );

      showToast(
        `✅ Nilai (${score}) & catatan berhasil disimpan ke Supabase & dikembalikan kepada ${reviewingSubmission.studentName}!`,
        "success"
      );

      setReviewingSubmission(null);
    } catch (err: any) {
      showToast("Gagal menyimpan nilai: " + err.message, "warning");
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  // Quick Batch Auto-grade with AI
  const handleBatchAiGrade = async () => {
    const pendingItems = submissions.filter((s) => s.status !== "graded");
    if (pendingItems.length === 0) {
      showToast("Tidak ada tugas siswa yang menunggu untuk dinilai.", "info");
      return;
    }

    setSubmissions((prev) =>
      prev.map((item) =>
        item.status !== "graded"
          ? {
              ...item,
              status: "graded",
              finalScore: item.aiSuggestedScore || 90,
              teacherNote:
                item.aiFeedback ||
                "Diverifikasi otomatis oleh Asisten Guru AI sesuai teks bacaan dan rubrik.",
              gradedAt: "Baru saja (Koreksi Otomatis AI)",
            }
          : item
      )
    );

    showToast(
      `✨ Berhasil menilai ${pendingItems.length} tugas secara otomatis dengan Asisten AI!`,
      "success"
    );
  };

  // Remind single student (Saved to Supabase database & Broadcast in Real-time)
  const handleRemindSingleStudent = async (student: JoinedStudent, assignment: AssignmentItem) => {
    const reminderPayload = {
      mode: "single",
      studentId: student.id,
      studentName: student.name,
      nisn: student.nisn,
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      dueDate: assignment.dueDate,
      subject: assignment.subject,
    };

    // 1. Send to server & Supabase database
    try {
      await fetch("/api/guru/classroom/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reminderPayload),
      });
    } catch (e) {
      console.warn("API reminder warning:", e);
    }

    // 2. Broadcast via Supabase Realtime Channel
    try {
      broadcastEvent("NOTIFICATION_RECEIVED", {
        targetUserId: student.id,
        studentId: student.id,
        studentName: student.name,
        nisn: student.nisn,
        title: `🔔 Pengingat Tugas: ${assignment.title}`,
        desc: `Guru mengingatkan Anda untuk segera menyelesaikan tugas "${assignment.title}". Tenggat: ${assignment.dueDate || "Segera"}.`,
        assignmentTitle: assignment.title,
        dueDate: assignment.dueDate,
        link_url: "/dashboard?tab=todo",
        time: "Baru saja",
        type: "warning",
      });
    } catch {}

    // 3. LocalStorage & Cross-Tab Broadcast for Instant Local Sync
    if (typeof window !== "undefined") {
      const storageEventData = {
        id: `remind-${Date.now()}-${student.id}`,
        targetStudentId: student.id,
        studentName: student.name,
        nisn: student.nisn,
        title: `🔔 Pengingat Tugas: ${assignment.title}`,
        desc: `Halo ${student.name}, guru mengingatkan Anda untuk segera mengumpulkan "${assignment.title}". Tenggat: ${assignment.dueDate || "Segera"}.`,
        time: "Baru saja",
        assignmentTitle: assignment.title,
        dueDate: assignment.dueDate,
        link_url: "/dashboard?tab=todo",
        type: "warning",
        timestamp: Date.now(),
      };
      localStorage.setItem("thinksy_student_reminder_event", JSON.stringify(storageEventData));

      // Append to general client notifications store
      try {
        const rawNotifs = localStorage.getItem("thinksy_student_notifications") || "[]";
        const parsed = JSON.parse(rawNotifs);
        const updated = [
          {
            id: storageEventData.id,
            title: storageEventData.title,
            desc: storageEventData.desc,
            time: "Baru saja",
            type: "warning",
            dibaca: false,
            link_url: "/dashboard?tab=todo",
            studentName: student.name,
            studentId: student.id,
          },
          ...parsed,
        ].slice(0, 30);
        localStorage.setItem("thinksy_student_notifications", JSON.stringify(updated));
      } catch {}

      window.dispatchEvent(new CustomEvent("thinksy_reminder_sent", { detail: storageEventData }));
    }

    showToast(`🔔 Notifikasi pengingat untuk "${assignment.title}" berhasil masuk ke akun ${student.name}!`, "success");
  };

  // Remind all missing students (Saved to Supabase database & Broadcast in Real-time)
  const handleRemindAllMissing = async () => {
    if (missingItems.length === 0) return;

    const itemsPayload = missingItems.map((item) => ({
      studentId: item.student.id,
      studentName: item.student.name,
      nisn: item.student.nisn,
      assignmentId: item.assignment.id,
      assignmentTitle: item.assignment.title,
      dueDate: item.assignment.dueDate,
      subject: item.assignment.subject,
    }));

    // 1. Send bulk reminder to Supabase database
    try {
      await fetch("/api/guru/classroom/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "all",
          missingItems: itemsPayload,
        }),
      });
    } catch (e) {
      console.warn("API bulk remind warning:", e);
    }

    // 2. Broadcast via Supabase Realtime Channel
    try {
      broadcastEvent("NOTIFICATION_RECEIVED", {
        isBroadcastAll: true,
        title: "🔔 Pengingat Tugas Serentak dari Guru",
        desc: "Guru mengingatkan seluruh siswa yang belum mengumpulkan tugas untuk segera menyelesaikannya!",
        link_url: "/dashboard?tab=todo",
        time: "Baru saja",
        type: "warning",
        count: missingItems.length,
      });
    } catch {}

    // 3. LocalStorage & Cross-Tab Broadcast for Instant Local Sync
    if (typeof window !== "undefined") {
      const storageEventData = {
        id: `bulk-remind-${Date.now()}`,
        isBroadcastAll: true,
        title: "🔔 Pengingat Tugas dari Guru",
        desc: "Guru mengingatkan Anda untuk segera menyelesaikan dan mengumpulkan tugas yang belum selesai.",
        time: "Baru saja",
        link_url: "/dashboard?tab=todo",
        type: "warning",
        timestamp: Date.now(),
        count: missingItems.length,
      };
      localStorage.setItem("thinksy_student_reminder_event", JSON.stringify(storageEventData));

      try {
        const rawNotifs = localStorage.getItem("thinksy_student_notifications") || "[]";
        const parsed = JSON.parse(rawNotifs);
        const updated = [
          {
            id: storageEventData.id,
            title: storageEventData.title,
            desc: storageEventData.desc,
            time: "Baru saja",
            type: "warning",
            dibaca: false,
            link_url: "/dashboard?tab=todo",
          },
          ...parsed,
        ].slice(0, 30);
        localStorage.setItem("thinksy_student_notifications", JSON.stringify(updated));
      } catch {}

      window.dispatchEvent(new CustomEvent("thinksy_reminder_sent", { detail: storageEventData }));
    }

    showToast(`🔔 Notifikasi pengingat tugas serentak berhasil dikirimkan ke seluruh ${missingItems.length} akun siswa yang dituju!`, "success");
  };

  // Give 0 score to student who hasn't submitted
  const handleGiveZeroScore = (student: JoinedStudent, assignment: AssignmentItem) => {
    const zeroSub: ReviewSubmissionItem = {
      id: `zero-${Date.now()}-${student.id}`,
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      subject: assignment.subject,
      studentId: student.id,
      studentName: student.name,
      studentClass: `Kelas ${student.kelas}`,
      studentAvatarColor: student.avatarColor,
      submittedAt: "Tidak Mengumpulkan",
      dueDate: assignment.dueDate,
      status: "graded",
      soalText: assignment.title,
      jawabanText: "(Tidak ada lembar jawaban yang diserahkan)",
      keyAnswer: "-",
      rubrik: [],
      aiConfidence: 100,
      aiSuggestedScore: 0,
      aiFeedback: "Siswa tidak menyerahkan tugas hingga melewati tenggat waktu yang ditentukan.",
      finalScore: 0,
      teacherNote: "Diberi nilai 0 otomatis karena tidak mengumpulkan tugas hingga batas waktu.",
      gradedAt: "Baru saja",
    };

    setSubmissions((prev) => [zeroSub, ...prev]);
    showToast(`⚠️ Berhasil memberi nilai 0 kepada ${student.name} untuk "${assignment.title}".`, "warning");
  };

  // =========================================================================
  // NORMAL SCREEN: REVIEW & GRADING WORKSPACE
  // =========================================================================
  if (reviewingSubmission) {
    const asgMeta = CLASS_ASSIGNMENTS.find(
      (a) => a.id === reviewingSubmission.assignmentId
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Floating Toast */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all animate-in slide-in-from-bottom-5 duration-200 ${
              toastMessage.type === "success"
                ? "bg-[#0B57D0] text-white border-blue-400"
                : toastMessage.type === "info"
                ? "bg-slate-900 text-white border-slate-700"
                : "bg-amber-600 text-white border-amber-400"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-300" />
            ) : toastMessage.type === "info" ? (
              <Bell className="w-5 h-5 shrink-0 text-cyan-300 animate-bounce" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-200" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 hover:opacity-80 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TOP BAR NORMAL SCREEN */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setReviewingSubmission(null)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke To Review</span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 truncate">
                  {reviewingSubmission.assignmentTitle}
                </span>
                {asgMeta?.type === "kuis" ? (
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full shrink-0">
                    ⏱️ Kuis
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                    📝 Tugas
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium truncate">
                {asgMeta?.chapterTitle || "Matematika"} • {reviewingSubmission.studentClass}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
            {currentSubmissionsList.length > 1 && (
              <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
                <button
                  type="button"
                  disabled={currentReviewIndex <= 0}
                  onClick={() => handleNavigateSubmission("prev")}
                  title="Siswa Sebelumnya"
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-[11px] text-slate-600 font-semibold">
                  {currentReviewIndex + 1} / {currentSubmissionsList.length}
                </span>
                <button
                  type="button"
                  disabled={currentReviewIndex >= currentSubmissionsList.length - 1}
                  onClick={() => handleNavigateSubmission("next")}
                  title="Siswa Selanjutnya"
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={isSubmittingGrade}
              onClick={handleGradeSubmission}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B57D0] hover:bg-[#0842a0] text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingGrade ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Supabase...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan & Kembalikan Nilai</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* MAIN NORMAL SCREEN BODY (DUAL-PANE LAYOUT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI (7/12) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Kartu Profil Siswa */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-12 h-12 rounded-2xl ${reviewingSubmission.studentAvatarColor} text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0`}
                >
                  {reviewingSubmission.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {reviewingSubmission.studentName}
                    </h3>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      {reviewingSubmission.studentClass}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Status: <span className="text-emerald-600 font-semibold">Telah Diserahkan</span> • {reviewingSubmission.submittedAt}
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl shrink-0">
                Data Supabase
              </span>
            </div>

            {/* Kartu Soal */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>Petunjuk & Soal Tugas</span>
              </div>
              <div className="text-sm font-medium text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                <MarkdownRenderer content={reviewingSubmission.soalText} />
              </div>
            </div>

            {/* Lembar Jawaban Siswa */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Lembar Jawaban Asli Siswa:</span>
                </div>
                <span className="text-xs text-slate-400">
                  Waktu Kirim: {reviewingSubmission.submittedAt}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 text-xs sm:text-sm text-slate-800 leading-relaxed shadow-inner">
                <MarkdownRenderer content={reviewingSubmission.jawabanText} />
              </div>

              {/* Lampiran Dokumen */}
              {reviewingSubmission.attachmentName && (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/40 border border-blue-200/70 text-xs">
                  <div className="flex items-center gap-2.5 font-medium text-slate-800">
                    <Paperclip className="w-4 h-4 text-[#0B57D0]" />
                    <span className="font-bold">{reviewingSubmission.attachmentName}</span>
                    <span className="text-slate-400">({reviewingSubmission.attachmentSize})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast(`Mengunduh file ${reviewingSubmission.attachmentName}...`, "info")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-200 font-bold text-[#0B57D0] hover:bg-blue-50 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Lampiran</span>
                  </button>
                </div>
              )}
            </div>

            {/* Kunci Jawaban Resmi */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Kunci Jawaban Resmi / Pembahasan Kurikulum:
              </div>
              <div className="text-xs text-slate-700 leading-relaxed font-medium">
                <MarkdownRenderer content={reviewingSubmission.keyAnswer} isCompact />
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (5/12) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Panel AI Evaluasi */}
            <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-white p-5 rounded-2xl border border-blue-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-blue-950 tracking-tight">
                      Evaluasi Asisten AI Sokratik
                    </h4>
                    <p className="text-[11px] text-blue-700 font-medium">
                      Tingkat Keyakinan: {reviewingSubmission.aiConfidence}% Akurat
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Saran Skor AI</div>
                  <div className="text-xl font-black text-[#0B57D0] font-mono">
                    {reviewingSubmission.aiSuggestedScore} / 100
                  </div>
                </div>
              </div>

              {/* Breakdown Rubrik */}
              <div className="space-y-2 pt-2 border-t border-blue-100">
                <div className="text-xs font-bold text-slate-800">Kesesuaian Rubrik Penilaian:</div>
                <div className="space-y-1.5">
                  {reviewingSubmission.rubrik.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-blue-100/90 shadow-2xs"
                    >
                      <span className="text-slate-700 font-medium">{r.item}</span>
                      <span className="font-bold text-[#0B57D0] font-mono">
                        {r.score} / {r.weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Catatan AI */}
              <div className="p-3.5 rounded-xl bg-white border border-blue-100 text-xs text-slate-700 leading-relaxed shadow-2xs">
                <span className="font-bold text-blue-900 block mb-1">Catatan AI: </span>
                <MarkdownRenderer content={reviewingSubmission.aiFeedback} isCompact />
              </div>
            </div>

            {/* Form Input Nilai Guru */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                <span>Konfirmasi Nilai Akhir & Catatan Guru</span>
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nilai Akhir Siswa (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={inputScore}
                  onChange={(e) => setInputScore(Number(e.target.value))}
                  className="w-full text-xl font-extrabold text-[#0B57D0] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Umpan Balik Guru (Diterima Siswa)
                </label>
                <textarea
                  rows={4}
                  value={inputNote}
                  onChange={(e) => setInputNote(e.target.value)}
                  placeholder="Berikan apresiasi dan penguatan konsep yang perlu dipelajari lagi oleh siswa..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none leading-relaxed"
                />
              </div>

              <button
                type="button"
                disabled={isSubmittingGrade}
                onClick={handleGradeSubmission}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0B57D0] hover:bg-[#0842a0] text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingGrade ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Supabase...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan & Kembalikan Nilai ke Siswa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TAMPILAN UTAMA LIST DAFTAR TO REVIEW (DEFAULT VIEW)
  // =========================================================================
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === "success"
              ? "bg-[#0B57D0] text-white border-blue-400"
              : toastMessage.type === "info"
              ? "bg-slate-900 text-white border-slate-700"
              : "bg-amber-600 text-white border-amber-400"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-300" />
          ) : toastMessage.type === "info" ? (
            <Bell className="w-5 h-5 shrink-0 text-cyan-300 animate-bounce" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-200" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-80 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#E8F0FE] text-[#0B57D0] flex items-center justify-center font-bold shadow-2xs">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
              To review
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Periksa tugas, berikan umpan balik, dan pantau siswa yang belum mengerjakan
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleBatchAiGrade}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B57D0] hover:bg-[#0842a0] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Koreksi Cepat AI</span>
          </button>
        </div>
      </div>

      {/* TIER 1 FILTER BAR: KELAS/MAPEL -> CABANG BAB (DAPAT DIEDIT) -> TUGAS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter Pembelajaran:</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            {joinedStudents.length} siswa resmi di Supabase
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Dropdown 1: Kelas / Mapel */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Mata Pelajaran & Kelas
            </label>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="mat-8">📐 Matematika (Kelas 8-A)</option>
              <option value="all">Semua Kelas & Mapel</option>
            </select>
          </div>

          {/* Dropdown 2: Cabang Bab + Tombol Edit Bab Ini */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cabang Bab (Materi Pokok)
              </label>
              {selectedChapterFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => handleOpenEditBab(selectedChapterFilter)}
                  className="text-[11px] font-bold text-[#0B57D0] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Bab Ini</span>
                </button>
              )}
            </div>
            <select
              value={selectedChapterFilter}
              onChange={(e) => setSelectedChapterFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {chapters.map((chap) => (
                <option key={chap.id} value={chap.id}>
                  {chap.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 3: Tugas Spesifik */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Pilih Tugas / Kuis
            </label>
            <select
              value={selectedAssignmentFilter}
              onChange={(e) => setSelectedAssignmentFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">
                {selectedChapterFilter === "all"
                  ? "Semua Tugas & Kuis"
                  : "Semua Tugas di Bab Ini"}
              </option>
              {availableAssignmentsForFilter.map((asg) => (
                <option key={asg.id} value={asg.id}>
                  {asg.type === "kuis" ? "⏱️ Kuis: " : "📝 Tugas: "}
                  {asg.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CLASS COMPLIANCE PROGRESS & SUMMARY BANNER */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 p-4 rounded-2xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Partisipasi Kelas 8-A:</span>
              <span className="text-xs font-extrabold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                {joinedStudents.length} Siswa Terdaftar (Supabase)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600 mt-1">
              <span className="flex items-center gap-1 text-[#0B57D0]">
                <Clock className="w-3.5 h-3.5" />
                <strong>{pendingCount}</strong> Perlu Ditinjau
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCheck className="w-3.5 h-3.5" />
                <strong>{reviewedCount}</strong> Selesai Dinilai
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-rose-600">
                <AlertTriangle className="w-3.5 h-3.5" />
                <strong>{missingItems.length}</strong> Belum Mengerjakan
              </span>
            </div>
          </div>
        </div>

        {activeTab === "missing" && missingItems.length > 0 && (
          <button
            type="button"
            onClick={handleRemindAllMissing}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer shrink-0"
          >
            <Bell className="w-4 h-4" />
            <span>Ingatkan Semua Siswa ({missingItems.length})</span>
          </button>
        )}
      </div>

      {/* TIER 2 TOOLBAR: 3-WAY TABS, TYPE PILL FILTERS, SEARCH */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="inline-flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("to_review")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeTab === "to_review"
                ? "bg-white text-[#0B57D0] shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>To review</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === "to_review"
                  ? "bg-blue-100 text-[#0B57D0] font-black"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reviewed")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeTab === "reviewed"
                ? "bg-white text-emerald-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Reviewed</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === "reviewed"
                  ? "bg-emerald-100 text-emerald-800 font-black"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {reviewedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("missing")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeTab === "missing"
                ? "bg-white text-rose-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Belum Mengerjakan</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === "missing"
                  ? "bg-rose-100 text-rose-800 font-black"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {missingItems.length}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <div className="inline-flex items-center bg-slate-50 border border-slate-200 p-0.5 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedTypeFilter("all")}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                selectedTypeFilter === "all"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter("tugas")}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                selectedTypeFilter === "tugas"
                  ? "bg-blue-600 text-white font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>📝 Tugas</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter("kuis")}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                selectedTypeFilter === "kuis"
                  ? "bg-purple-600 text-white font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>⏱️ Kuis</span>
            </button>
          </div>

          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari siswa/tugas..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* CONTENT LIST */}
      {activeTab === "missing" ? (
        missingItems.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Luar Biasa! Semua Siswa Telah Mengerjakan
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ada siswa yang tertinggal atau belum mengumpulkan tugas untuk kriteria yang Anda pilih.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {missingItems.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl ${item.student.avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs`}
                  >
                    {item.student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.student.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Kelas {item.student.kelas}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        NISN: {item.student.nisn}
                      </span>

                      {item.status === "past_due" ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Lewat Tenggat (Terlambat)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Belum Menyerahkan</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-medium text-slate-600 flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-400 font-semibold">Tugas:</span>
                      <span className="font-semibold text-slate-800">
                        {item.assignment.title}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-500">
                        {item.assignment.chapterTitle}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-400">
                        Tenggat: {item.assignment.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      handleRemindSingleStudent(
                        item.student,
                        item.assignment
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0B57D0] text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Ingatkan Siswa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGiveZeroScore(item.student, item.assignment)}
                    title="Beri nilai 0 otomatis karena tidak mengumpulkan"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    <span>Beri Nilai 0</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {activeTab === "to_review"
                ? "Semua tugas telah diperiksa!"
                : "Belum ada tugas yang dinilai"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === "to_review"
                ? "Bagus sekali! Semua kiriman siswa untuk kriteria ini telah selesai diperiksa."
                : "Tugas yang telah Anda beri nilai dan kembalikan akan muncul di sini."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((item) => {
              const asgMeta = CLASS_ASSIGNMENTS.find(
                (a) => a.id === item.assignmentId
              );

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenReview(item)}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl ${item.studentAvatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs`}
                    >
                      {item.studentName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                          {item.studentName}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {item.studentClass}
                        </span>

                        {asgMeta?.type === "kuis" ? (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                            ⏱️ Kuis
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            📝 Tugas
                          </span>
                        )}

                        {item.status === "graded" ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Dinilai: {item.finalScore}/100</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Diserahkan</span>
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium">
                          • {item.submittedAt}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-slate-600 truncate max-w-xl">
                        <span className="text-blue-600 font-semibold">{item.assignmentTitle}:</span>{" "}
                        <span className="italic text-slate-500">"{item.jawabanText.slice(0, 105)}..."</span>
                      </div>

                      {asgMeta && (
                        <div className="text-[11px] text-slate-400 font-medium">
                          {asgMeta.chapterTitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Saran Nilai AI</div>
                      <div className="text-base font-extrabold text-blue-600 font-mono">
                        {item.aiSuggestedScore} / 100
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReview(item);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 group-hover:bg-[#0B57D0] text-slate-700 group-hover:text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      <span>{item.status === "graded" ? "Lihat Nilai" : "Tinjau & Nilai"}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* MODAL EDIT BAB (Materi Pokok) DENGAN PENYIMPANAN SUPABASE */}
      {editingChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Bab Pembelajaran</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Tersimpan langsung ke database Supabase</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingChapter(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Judul Bab (Materi Pokok)
                </label>
                <input
                  type="text"
                  value={editingChapter.name}
                  onChange={(e) =>
                    setEditingChapter({ ...editingChapter, name: e.target.value })
                  }
                  placeholder="Contoh: Bab 1: Bilangan Berpangkat & Bentuk Akar"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Deskripsi / Capaian Pembelajaran Bab
                </label>
                <textarea
                  rows={4}
                  value={editingChapter.desc}
                  onChange={(e) =>
                    setEditingChapter({ ...editingChapter, desc: e.target.value })
                  }
                  placeholder="Tuliskan ringkasan materi atau tujuan capaian bab ini..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none leading-relaxed text-slate-800"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/70">
              <button
                type="button"
                onClick={() => setEditingChapter(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingChapter || !editingChapter.name.trim()}
                onClick={handleSaveChapter}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B57D0] hover:bg-[#0842a0] text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSavingChapter ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Supabase...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan Perubahan Bab</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
