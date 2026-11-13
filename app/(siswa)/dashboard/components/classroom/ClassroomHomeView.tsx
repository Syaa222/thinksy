"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Folder,
  MoreVertical,
  ClipboardList,
  Sparkles,
  CheckCircle2,
  Trophy,
  BookOpen,
  ArrowRight,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Lock,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { ChapterItem, UjianItem } from "../../types";
import { ClassBannerGraphic } from "@/components/guru/classroom/ClassBannerGraphics";
import { useActiveClassTheme } from "@/lib/classroom-sync";
import {
  useDueSoonItems,
  formatDueSoonDisplay,
  isDueSoonReleased,
  DueSoonItem,
} from "@/lib/due-soon";
import {
  StreamAnnouncement,
  DEFAULT_ANNOUNCEMENTS,
} from "@/lib/announcement-format";

interface ClassroomHomeViewProps {
  studentName: string;
  chapters: ChapterItem[];
  examsData: UjianItem[];
  onOpenClass: (classId: string) => void;
  onOpenTodo: () => void;
}

export default function ClassroomHomeView({
  studentName,
  chapters,
  examsData,
  onOpenClass,
  onOpenTodo,
}: ClassroomHomeViewProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDueDetails, setShowDueDetails] = useState(false);
  const mathTheme = useActiveClassTheme("Matematika");
  const upcomingExams = examsData.filter(
    (e) => e.status === "dipublikasi" && e.sessionStatus !== "selesai"
  );
  const dueSoonItems = useDueSoonItems();

  // Announcements state for Matematika class card
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

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. DUE SOON SECTION (MATCHING SCREENSHOT) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-normal text-slate-800 tracking-tight font-sans">
              Due soon
            </h2>
            {dueSoonItems.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-700">
                {dueSoonItems.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTodo}
              className="text-[#1967D2] hover:underline font-medium text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>View To-do</span>
            </button>
            {upcomingExams.length > 0 && (
              <button
                onClick={() => setShowDueDetails(!showDueDetails)}
                title="Filter / Toggle Tugas Mendatang"
                className="text-slate-500 hover:text-slate-800 p-1 rounded-full hover:bg-slate-200/60 transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Due soon Card (White pill container with subtle border) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-4 sm:p-6 transition-all space-y-3">
          {dueSoonItems.length > 0 ? (
            <div className="space-y-3">
              {dueSoonItems.map((item) => {
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
                        onOpenClass(item.classId || "matematika");
                      } else {
                        onOpenClass(item.classId || "matematika");
                      }
                    }}
                    className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      !isReleased
                        ? "bg-slate-100/80 border-slate-200/90 text-slate-400 select-none cursor-not-allowed shadow-2xs"
                        : "bg-white hover:bg-blue-50/40 border-blue-200/80 hover:border-blue-400 text-slate-800 shadow-xs hover:shadow-md cursor-pointer"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
                          !isReleased
                            ? "bg-slate-200/90 text-slate-400 border border-slate-300/60"
                            : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xs group-hover:scale-105"
                        }`}
                      >
                        {!isReleased ? (
                          <Lock className="w-5 h-5 text-slate-400" />
                        ) : isBab ? (
                          <BookOpen className="w-5 h-5 text-white" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-white" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-extrabold text-sm sm:text-base tracking-tight truncate ${
                              !isReleased ? "text-slate-500" : "text-slate-900 group-hover:text-blue-700"
                            }`}
                          >
                            {item.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              !isReleased
                                ? "bg-slate-200 text-slate-500"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {isBab ? `Bab ${item.babNomor || 1}` : "Mapel Baru"}
                          </span>

                          {/* Badges release status */}
                          {!isReleased ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/90 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-700" />
                              <span>Terkunci • Rilis {dateInfo.remainingText}</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Waktu Rilis Tiba • Siap Belajar</span>
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-xs line-clamp-1 ${
                            !isReleased ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {item.description || item.subtitle}
                        </p>

                        <div
                          className={`flex items-center gap-2 text-[11px] font-medium pt-0.5 ${
                            !isReleased ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Jadwal Rilis: {dateInfo.full}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                      {!isReleased ? (
                        <div className="px-3.5 py-1.5 rounded-xl bg-slate-200/80 text-slate-400 text-xs font-bold border border-slate-300/60 flex items-center gap-1.5 cursor-not-allowed">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Belum Dibuka</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl bg-[#1967D2] group-hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>{isBab ? "Buka Bab" : "Masuk Kelas"}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !showDueDetails ? (
            <div className="flex flex-col items-center justify-center text-center py-2 sm:py-3 space-y-2">
              <p className="text-slate-600 text-xs sm:text-sm font-normal">
                {upcomingExams.length === 0
                  ? "You don't have any work due in the next 7 days"
                  : `Terdapat ${upcomingExams.length} ulangan / asesmen aktif yang terjadwal`}
              </p>
              {upcomingExams.length > 0 && (
                <button
                  onClick={() => setShowDueDetails(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#1967D2] hover:underline font-medium pt-1 cursor-pointer"
                >
                  <span>
                    Lihat {upcomingExams.length} Ulangan & Asesmen Terjadwal
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Daftar Ulangan & Asesmen Terjadwal
                </span>
                <button
                  onClick={() => setShowDueDetails(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                >
                  <span>Tutup Rincian</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Upcoming Exams summary */}
              {upcomingExams.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
                  {upcomingExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition"
                    >
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{exam.judul}</div>
                        <div className="text-[11px] text-slate-500">
                          {exam.mapel} • Durasi {exam.durasi_menit} Menit • Passing Grade {exam.passing_grade}
                        </div>
                      </div>
                      <Link
                        href="/ujian"
                        className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-xl transition shrink-0"
                      >
                        Buka Ujian →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  Tidak ada ulangan atau ujian aktif saat ini.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 2. CLASSES SECTION (TERINTEGRASI 100% DENGAN RUANG BELAJAR MATEMATIKA) */}
      <section className="space-y-3">
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

        {/* Classes Grid - Khusus Matematika Kelas 8 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CARD: Matematika Kelas 8 */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
            {/* Header Banner (Sinkron dengan Tema Kelas Guru) */}
            <div
              style={{ backgroundColor: mathTheme.themeColor || "#1967D2" }}
              className="h-36 sm:h-38 relative select-none overflow-visible z-10"
            >
              {/* Clipped Background Gradient & Graphic */}
              <div className={`absolute inset-0 bg-gradient-to-r ${mathTheme.bgGradient || "from-blue-700 via-indigo-700 to-slate-900"} p-4 flex flex-col justify-between overflow-hidden rounded-t-2xl`}>
                {/* Class Banner Graphic: Custom Photo atau Google Classroom Illustration */}
                <ClassBannerGraphic
                  bannerType={mathTheme.bannerType}
                  bannerIllustration={mathTheme.bannerIllustration}
                  bannerPhotoUrl={mathTheme.bannerPhotoUrl}
                  subjectName="Matematika"
                  isCompact={true}
                />

                {/* Title & Teacher */}
                <div className="relative z-10 space-y-0.5 max-w-[70%] drop-shadow-xs">
                  <button
                    onClick={() => onOpenClass("matematika")}
                    className="text-left font-bold text-lg sm:text-xl text-white group-hover:underline tracking-tight line-clamp-1 block cursor-pointer"
                  >
                    {mathTheme.name || "Matematika"}
                  </button>
                  <p className="text-xs text-white/90 font-medium truncate">
                    {mathTheme.teacherName || "Ibu Siti Rahmawati, M.Pd."}
                  </p>
                  <p className="text-[11px] text-white/80 truncate">
                    {mathTheme.section || "Kelas 8 • Fase D"}
                  </p>
                </div>
              </div>

              {/* Circular Teacher Photo Overlapping Bottom Right (Tampil utuh di depan card) */}
              <div className="absolute -bottom-8 right-4 w-18 h-18 rounded-full border-2 border-white shadow-md overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 z-30 flex items-center justify-center text-white font-bold text-xl select-none">
                {(mathTheme.teacherName || "S").trim().charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Card Body - Ruang Belajar Integration */}
            <div
              onClick={() => onOpenClass("matematika")}
              className="pt-9 pb-4 px-4 min-h-[95px] flex flex-col justify-between cursor-pointer hover:bg-slate-50/50 transition relative z-0"
            >
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-700">
                  Semester Ganjil • Kurikulum Merdeka
                </div>
                <div className="text-[11px] text-slate-500">
                  {chapters.filter((c) => c.mapel?.toLowerCase().includes("matematika")).length || 5} Bab Pembelajaran • Tersedia Materi & Latihan Sokratik
                </div>
              </div>

              {/* Preview Pengumuman Guru di Card Matematika Siswa */}
              {latestMathAnnouncement && (
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

              {/* Subtle Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: "70%" }} />
              </div>
            </div>

            {/* Card Footer with Google Classroom Icons */}
            <div className="border-t border-slate-100 py-2.5 px-4 flex items-center justify-end gap-3 text-slate-500 bg-white">
              <button
                onClick={onOpenTodo}
                title="Buka Tugas & Pekerjaan Anda (To-do)"
                className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
              >
                <ClipboardList className="w-5 h-5" />
              </button>
              <button
                onClick={() => onOpenClass("matematika")}
                title="Buka Folder Materi"
                className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
              >
                <Folder className="w-5 h-5" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  title="Opsi Kelas"
                  className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute right-0 bottom-10 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenClass("matematika");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-indigo-600 font-semibold cursor-pointer block"
                      >
                        Buka Ruang Belajar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenClass("matematika");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-600 cursor-pointer block"
                      >
                        Lihat Bab & Materi
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
