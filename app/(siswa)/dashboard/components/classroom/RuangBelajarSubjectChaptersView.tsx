"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  FileText,
  PlayCircle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Layers,
  GraduationCap,
  Clock,
  Award,
  Globe,
  Sparkles,
} from "lucide-react";
import { ChapterItem } from "../../types";
import { ClassBannerGraphic } from "@/components/guru/classroom/ClassBannerGraphics";
import { useActiveClassTheme } from "@/lib/classroom-sync";
import ClassAnnouncementCard from "@/components/classroom/ClassAnnouncementCard";
import {
  StreamAnnouncement,
  DEFAULT_ANNOUNCEMENTS,
  AnnouncementComment,
} from "@/lib/announcement-format";
import { useLanguage } from "@/hooks/useLanguage";

interface RuangBelajarSubjectChaptersViewProps {
  selectedSubject?: string;
  chapters: ChapterItem[];
  userProfile?: {
    nama_lengkap?: string;
    nama_kelas?: string;
    tingkat_kelas?: number;
  };
  onBackToHome: () => void;
  onSelectSubject?: (subject: string) => void;
}

const SUBJECT_DETAILS: Record<string, any> = {
  Matematika: {
    name: "Matematika",
    code: "MTK-8",
    color: "blue",
    bgBadge: "bg-blue-600/20 text-blue-300 border-blue-500/30",
    headerBg: "bg-slate-900 border border-slate-800",
    desc: "Aljabar, Teorema Pythagoras, Persamaan Linear, Statistika, Peluang & Penalaran Matematika.",
    icon: BookOpen,
  },
  IPA: {
    name: "IPA (Ilmu Pengetahuan Alam)",
    code: "IPA-8",
    color: "emerald",
    bgBadge: "bg-emerald-600/20 text-emerald-300 border-emerald-500/30",
    headerBg: "bg-slate-900 border border-slate-800",
    desc: "Sistem Organisasi Kehidupan, Gerak dan Gaya, Usaha dan Energi, Struktur Bumi & Tata Surya.",
    icon: Sparkles,
  },
  "Ilmu Pengetahuan Alam": {
    name: "IPA (Ilmu Pengetahuan Alam)",
    code: "IPA-8",
    color: "emerald",
    bgBadge: "bg-emerald-600/20 text-emerald-300 border-emerald-500/30",
    headerBg: "bg-slate-900 border border-slate-800",
    desc: "Sistem Organisasi Kehidupan, Gerak dan Gaya, Usaha dan Energi, Struktur Bumi & Tata Surya.",
    icon: Sparkles,
  },
};

function getSubjectMeta(subject: string) {
  if (SUBJECT_DETAILS[subject]) return SUBJECT_DETAILS[subject];
  const isIpa = subject.toLowerCase().includes("ipa");
  if (isIpa) return SUBJECT_DETAILS["IPA"];
  return {
    name: subject,
    code: subject.slice(0, 3).toUpperCase() + "-8",
    color: "indigo",
    bgBadge: "bg-indigo-600/20 text-indigo-300 border-indigo-500/30",
    headerBg: "bg-slate-900 border border-slate-800",
    desc: `Materi pembelajaran aktif kurikulum merdeka untuk ${subject}.`,
    icon: BookOpen,
  };
}

export default function RuangBelajarSubjectChaptersView({
  selectedSubject = "Matematika",
  chapters,
  userProfile,
  onBackToHome,
  onSelectSubject,
}: RuangBelajarSubjectChaptersViewProps) {
  const { t, language } = useLanguage();
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const classTheme = useActiveClassTheme(selectedSubject);
  const meta = getSubjectMeta(selectedSubject);
  const SubjectIcon = meta.icon;

  // Sync custom babs from localStorage (thinksy_custom_babs)
  const [customBabs, setCustomBabs] = useState<Record<string, any>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("thinksy_custom_babs");
        return stored ? JSON.parse(stored) : {};
      } catch {}
    }
    return {};
  });

  // Track opened/clicked chapters (thinksy_opened_babs)
  const [openedBabIds, setOpenedBabIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("thinksy_opened_babs");
        if (stored) {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr)) {
            return new Set<string>(arr.map(String));
          }
        }
      } catch {}
    }
    return new Set<string>();
  });

  const handleMarkChapterOpened = (chapterId: string | number) => {
    const strId = String(chapterId);
    setOpenedBabIds((prev) => {
      if (prev.has(strId)) return prev;
      const next = new Set(prev);
      next.add(strId);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("thinksy_opened_babs", JSON.stringify(Array.from(next)));
        } catch {}
      }
      return next;
    });
  };

  useEffect(() => {
    const syncOpenedBabs = () => {
      try {
        const stored = localStorage.getItem("thinksy_opened_babs");
        if (stored) {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr)) {
            setOpenedBabIds(new Set<string>(arr.map(String)));
          }
        }
      } catch {}
    };

    window.addEventListener("storage", syncOpenedBabs);
    window.addEventListener("focus", syncOpenedBabs);
    return () => {
      window.removeEventListener("storage", syncOpenedBabs);
      window.removeEventListener("focus", syncOpenedBabs);
    };
  }, []);

  // Bab yang baru saja dibuka dari Due Soon dashboard
  const [highlightedBab, setHighlightedBab] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const active = localStorage.getItem("thinksy_active_bab_id");
        if (active) {
          localStorage.removeItem("thinksy_active_bab_id");
          return parseInt(active, 10);
        }
      } catch {}
    }
    return null;
  });

  // Announcements state for Matematika (synchronized with Guru dashboard)
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

  // Fetch announcements from server on mount and listen to broadcast / storage events
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
      } catch (err) {
        console.warn("[FETCH ANNOUNCEMENTS ERROR]", err);
      }
    }
    loadAnnouncements();

    const handleAnnouncementEvent = (e: any) => {
      try {
        const saved = localStorage.getItem("thinksy_class_announcements");
        if (saved) {
          setAnnouncements(JSON.parse(saved));
        } else if (e.detail?.post) {
          setAnnouncements((prev) => [e.detail.post, ...prev.filter((p) => p.id !== e.detail.post.id)]);
        }
      } catch {}
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "thinksy_class_announcements" && e.newValue) {
        try {
          setAnnouncements(JSON.parse(e.newValue));
        } catch {}
      }
    };

    const handleBabUpdate = () => {
      try {
        const stored = localStorage.getItem("thinksy_custom_babs");
        if (stored) setCustomBabs(JSON.parse(stored));
      } catch {}
    };

    window.addEventListener("thinksy_bab_updated", handleBabUpdate);
    window.addEventListener("thinksy_announcement_event", handleAnnouncementEvent);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("thinksy_bab_updated", handleBabUpdate);
      window.removeEventListener("thinksy_announcement_event", handleAnnouncementEvent);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Filter announcements for Matematika
  const matematikaAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const tag = (a.subjectTag || "").toLowerCase();
      return tag === "mat-8" || tag === "matematika" || tag === "all" || !a.subjectTag || tag.includes("mat");
    });
  }, [announcements]);

  // Handle student comment submission
  const handleStudentAddComment = async (postId: string, commentText: string) => {
    const studentAuthor = userProfile?.nama_lengkap || "Siswa";
    const newComment: AnnouncementComment = {
      id: `cm-${Date.now()}`,
      authorName: studentAuthor,
      authorRole: "Siswa",
      text: commentText,
      timeAgo: "Baru saja",
      avatarText: studentAuthor.charAt(0).toUpperCase(),
      avatarColor: "bg-purple-600",
    };

    const updated = announcements.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...(post.comments || []), newComment],
        };
      }
      return post;
    });

    setAnnouncements(updated);
    try {
      localStorage.setItem("thinksy_class_announcements", JSON.stringify(updated));
    } catch {}

    window.dispatchEvent(
      new CustomEvent("thinksy_announcement_event", {
        detail: { action: "comment", postId, comment: newComment },
      })
    );

    try {
      await fetch("/api/classroom/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          id: postId,
          comment: {
            text: commentText,
            authorName: studentAuthor,
            authorRole: "Siswa",
          },
        }),
      });
    } catch (err) {
      console.warn("[STUDENT COMMENT ERROR]", err);
    }
  };

  // Filter chapters by subject (Matematika & IPA Kelas 8) & sync overrides
  const subjectChapters = useMemo(() => {
    const isIpa = selectedSubject.toLowerCase().includes("ipa");

    if (isIpa) {
      const ipaList = chapters.filter((c) => (c.mapel || "").toLowerCase().includes("ipa"));
      if (ipaList.length > 0) {
        return ipaList;
      }
      // Bab IPA Kurikulum Merdeka Fase D Kelas 8 default terstruktur
      const ipaBabs: ChapterItem[] = [
        {
          id: "ipa-bab-1",
          urutan: 1,
          judul: "Bab 1: Pengenalan Sel & Mikroskop",
          deskripsi: "Struktur sel hewan dan tumbuhan, penggunaan mikroskop cahaya, dan hierarki organisasi kehidupan.",
          semester: 1,
          mapel: "IPA",
          progress: 0,
          materi: [
            { id: "m-2011", judul: "Pengenalan Sel & Teori Sel", urutan: 1 },
            { id: "m-2012", judul: "Struktur Sel Hewan & Tumbuhan", urutan: 2 },
            { id: "m-2013", judul: "Penggunaan Mikroskop Laboratorium", urutan: 3 },
          ],
        },
        {
          id: "ipa-bab-2",
          urutan: 2,
          judul: "Bab 2: Struktur dan Fungsi Tubuh Manusia",
          deskripsi: "Sistem pencernaan, sistem peredaran darah, pernapasan, dan ekskresi pada manusia serta nutrisi seimbang.",
          semester: 1,
          mapel: "IPA",
          progress: 0,
          materi: [
            { id: "m-2021", judul: "Nutrisi dan Sistem Pencernaan", urutan: 1 },
            { id: "m-2022", judul: "Sistem Peredaran Darah Manusia", urutan: 2 },
            { id: "m-2023", judul: "Sistem Pernapasan & Ekskresi", urutan: 3 },
          ],
        },
        {
          id: "ipa-bab-3",
          urutan: 3,
          judul: "Bab 3: Usaha, Energi, dan Pesawat Sederhana",
          deskripsi: "Konsep usaha fisik, transformasi energi mekanik, kinetik, potensial, serta tuas, bidang miring, dan katrol.",
          semester: 1,
          mapel: "IPA",
          progress: 0,
          materi: [
            { id: "m-2031", judul: "Konsep Usaha dan Daya", urutan: 1 },
            { id: "m-2032", judul: "Bentuk & Transformasi Energi", urutan: 2 },
            { id: "m-2033", judul: "Pesawat Sederhana di Sekitar Kita", urutan: 3 },
          ],
        },
        {
          id: "ipa-bab-4",
          urutan: 4,
          judul: "Bab 4: Getaran, Gelombang, dan Cahaya",
          deskripsi: "Konsep frekuensi, periode getaran, perambatan gelombang bunyi, serta sifat-sifat pembiasan dan cermin optik.",
          semester: 2,
          mapel: "IPA",
          progress: 0,
          materi: [
            { id: "m-2041", judul: "Getaran dan Frekuensi Gelombang", urutan: 1 },
            { id: "m-2042", judul: "Gelombang Bunyi dan Resonansi", urutan: 2 },
            { id: "m-2043", judul: "Sifat Cahaya dan Alat Optik", urutan: 3 },
          ],
        },
        {
          id: "ipa-bab-5",
          urutan: 5,
          judul: "Bab 5: Unsur, Senyawa, dan Struktur Bumi",
          deskripsi: "Klasifikasi materi, tabel periodik, pemisahan campuran, serta lapisan litosfer, hidrosfer, dan tata surya.",
          semester: 2,
          mapel: "IPA",
          progress: 0,
          materi: [
            { id: "m-2051", judul: "Unsur, Senyawa, dan Campuran", urutan: 1 },
            { id: "m-2052", judul: "Metode Pemisahan Campuran Fisika & Kimia", urutan: 2 },
            { id: "m-2053", judul: "Struktur Bumi dan Gunung Berapi", urutan: 3 },
          ],
        },
      ];
      return ipaBabs;
    }

    const list = chapters.filter((c) => {
      const mapelLower = (c.mapel || "").toLowerCase();
      return mapelLower.includes("matematika") || mapelLower.includes("math") || !c.mapel;
    });

    const baseList = list.length > 0 ? list : chapters;

    return baseList.map((c) => {
      const key = `mat-bab-${c.urutan}`;
      const override = customBabs[c.id] || customBabs[key];
      if (!override) return c;
      return {
        ...c,
        judul: override.judul || c.judul,
        deskripsi: override.deskripsi || c.deskripsi,
      };
    });
  }, [chapters, customBabs, selectedSubject]);

  // Filter by semester
  const semesterChapters = useMemo(() => {
    const isIpa = selectedSubject.toLowerCase().includes("ipa");
    const semThreshold = isIpa ? 3 : 4;
    const filtered = subjectChapters.filter((c) => {
      const sem = c.semester || (c.urutan <= semThreshold ? 1 : 2);
      return sem === selectedSemester;
    });
    return filtered.length > 0 ? filtered : subjectChapters;
  }, [subjectChapters, selectedSemester, selectedSubject]);

  // Total materials count
  const totalMateriCount = semesterChapters.reduce(
    (acc, curr) => acc + (curr.materi?.length || 3),
    0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Quick Subject Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button
            onClick={onBackToHome}
            className="hover:text-blue-600 transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.home || "Beranda"}</span>
          </button>
          <span>/</span>
          <span>{t.studyRoom || "Ruang Belajar"}</span>
          <span>/</span>
          <span className="text-blue-600 font-bold">{selectedSubject}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Kurikulum Merdeka</span>
        </div>
      </div>

      {/* Header Banner Ruang Belajar (Sinkron 100% dengan Dashboard Guru) */}
      <div
        className={`rounded-3xl bg-gradient-to-r ${classTheme.bgGradient || "from-blue-700 via-indigo-700 to-slate-900"} text-white p-6 sm:p-8 shadow-md relative overflow-hidden`}
        style={{ backgroundColor: classTheme.themeColor || "#1967D2" }}
      >
        {/* Class Banner Graphic: Foto Kustom Guru atau Ilustrasi SVG Google Classroom */}
        <ClassBannerGraphic
          bannerType={classTheme.bannerType}
          bannerIllustration={classTheme.bannerIllustration}
          bannerPhotoUrl={classTheme.bannerPhotoUrl}
          subjectName={selectedSubject}
          isCompact={false}
        />

        <div className="relative z-10 space-y-3 max-w-3xl drop-shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wider text-white border border-white/20 shadow-xs">
              RUANG BELAJAR
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-white/90 border border-white/10">
              {classTheme.subjectCode ? classTheme.subjectCode.toUpperCase() : meta.code} • {classTheme.section || "Kurikulum Merdeka"}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-white/90 border border-white/10">
              Kelas {userProfile?.tingkat_kelas || 8} ({userProfile?.nama_kelas || classTheme.room || "Kelas 8"})
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-sm">
              <SubjectIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                {selectedSubject}
              </h1>
              <p className="text-xs sm:text-sm text-white/90 font-normal mt-0.5">
                {classTheme.description || meta.desc}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-white/90 font-medium border-t border-white/20">
            <div>
              📚 Total: <strong className="text-white">{semesterChapters.length} Bab</strong>
            </div>
            <div>
              📄 Materi: <strong className="text-white">{totalMateriCount} Bahan Pembelajaran</strong>
            </div>
            <div>
              🎯 Pembahasan: <strong className="text-white">Latihan Pemahaman Konsep & Kuis Mandiri</strong>
            </div>
          </div>
        </div>
      </div>

      {/* PENGUMUMAN GURU MATEMATIKA (STREAM CARD GURU MASUK KE RUANG BELAJAR MATEMATIKA SISWA) */}
      {selectedSubject.toLowerCase().includes("mat") && matematikaAnnouncements.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2 font-heading">
                <span>📢 Pengumuman Guru Matematika</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {matematikaAnnouncements.length} Kiriman
                </span>
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Pengajar: {classTheme.teacherName || "Ibu Siti Rahmawati, M.Pd."}
            </span>
          </div>

          <div className="space-y-4">
            {matematikaAnnouncements.map((post) => (
              <ClassAnnouncementCard
                key={post.id}
                post={post}
                currentUserName={userProfile?.nama_lengkap || "Siswa"}
                currentUserRole="Siswa"
                isTeacher={false}
                onAddComment={handleStudentAddComment}
              />
            ))}
          </div>
        </section>
      )}

      {/* Semester Switcher & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">
            {language === "en" ? "Select Semester:" : "Pilih Semester:"}
          </span>
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 text-xs font-bold">
            <button
              onClick={() => setSelectedSemester(1)}
              className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
                selectedSemester === 1
                  ? "bg-white text-blue-600 shadow-xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {language === "en" ? "Semester 1 (Odd)" : "Semester 1 (Ganjil)"}
            </button>
            <button
              onClick={() => setSelectedSemester(2)}
              className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
                selectedSemester === 2
                  ? "bg-white text-blue-600 shadow-xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {language === "en" ? "Semester 2 (Even)" : "Semester 2 (Genap)"}
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {language === "en"
            ? `Showing ${semesterChapters.length} Chapters for Semester ${selectedSemester}`
            : `Menampilkan ${semesterChapters.length} Bab untuk Semester ${selectedSemester}`}
        </div>
      </div>

      {/* Bab (Chapters) List Grid */}
      <div className="space-y-4">
        {semesterChapters.map((chap, idx) => {
          const materiList = chap.materi || [
            { id: `m1-${chap.id}`, judul: "1. Konsep & Definisi Dasar", urutan: 1 },
            { id: `m2-${chap.id}`, judul: "2. Pendalaman Materi & Contoh Soal", urutan: 2 },
            { id: `m3-${chap.id}`, judul: "3. Latihan Penalaran & Pembahasan", urutan: 3 },
          ];

          const progressPercent = typeof (chap as any).progress === "number" ? (chap as any).progress : 0;
          const isBabOpened = openedBabIds.has(String(chap.id)) || progressPercent > 0;
          const chapterStatus: "belum" | "berjalan" | "selesai" =
            progressPercent >= 100 ? "selesai" : isBabOpened ? "berjalan" : "belum";

          const isSelectedFromDueSoon = chap.urutan === highlightedBab;

          return (
            <div
              key={chap.id}
              className={`bg-white rounded-3xl border transition-all duration-200 p-6 space-y-4 group relative ${
                isSelectedFromDueSoon
                  ? "ring-2 ring-blue-500 border-blue-400 shadow-md bg-blue-50/15"
                  : "border-slate-200/90 shadow-xs hover:shadow-md"
              }`}
            >
              {/* Bab Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 group-hover:text-blue-600 transition">
                      {chap.judul}
                    </h3>
                    {isSelectedFromDueSoon && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 shadow-2xs animate-pulse">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>{language === "en" ? "Opened from Due Soon" : "Dibuka dari Due Soon"}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">
                    {chap.deskripsi || "Pemahaman konsep mendalam dan penalaran berbasis kurikulum merdeka."}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {/* Status Bab sesuai Modul MVP: Belum / Berjalan / Selesai */}
                  {chapterStatus === "selesai" ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.done || (language === "en" ? "Completed" : "Selesai")}</span>
                    </span>
                  ) : chapterStatus === "berjalan" ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t.inProgress || (language === "en" ? "In Progress" : "Sedang Berjalan")} ({progressPercent}%)</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/70">
                      {language === "en" ? "Not Started" : "Belum Dimulai"}
                    </span>
                  )}

                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/70">
                    {materiList.length} {language === "en" ? "Learning Materials" : "Bahan Materi"}
                  </span>
                </div>
              </div>

              {/* Grid 3 Kolom Materi Pembelajaran di dalam Bab */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  {language === "en" ? "Learning Materials" : "Materi Pembelajaran"} ({materiList.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {materiList.map((m, mIdx) => (
                    <Link
                      key={m.id}
                      href={`/bab/${chap.id}?materiId=${m.id}`}
                      onClick={() => handleMarkChapterOpened(chap.id)}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-200 transition p-3.5 flex items-center justify-between gap-2 group/m cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 group-hover/m:text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {mIdx + 1}
                        </div>
                        <span className="text-xs font-bold text-slate-800 group-hover/m:text-blue-700 truncate">
                          {m.judul}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/m:text-blue-600 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === "en"
                      ? "Ready for self-paced learning via Thinksy Study Room."
                      : "Siap dipelajari kapan saja melalui Ruang Belajar Thinksy."}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <Link
                    href={`/quiz/${chap.id}`}
                    onClick={() => handleMarkChapterOpened(chap.id)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
                  >
                    {language === "en" ? "Chapter Quiz" : "Kuis Bab"}
                  </Link>
                  <Link
                    href={`/bab/${chap.id}`}
                    onClick={() => handleMarkChapterOpened(chap.id)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <span>{isBabOpened ? (language === "en" ? "Continue" : "Lanjutkan") : (language === "en" ? "Start" : "Mulai")}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
