"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import {
  TriangleAlert,
  HelpCircle,
  RefreshCw,
  GraduationCap,
  Globe,
  ExternalLink,
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
  Sparkles,
  X,
} from "lucide-react";
import {
  SekolahData,
  CalendarWeekItem,
  DailyMission,
  ChapterItem,
  PeerStudent,
  AgendaAkademikItem,
  UjianItem,
} from "../../types";

interface TabBelajarProps {
  studentName: string;
  currentUserRank: number;
  namaKelas?: string;
  learningProgressPercent: number;
  learningPoints: number;
  sekolahData?: SekolahData | null;
  calendarWeeks: CalendarWeekItem[];
  dailyMissions: DailyMission[];
  isMissionsLoading: boolean;
  isClaimingMissionId: string | null;
  onClaimMission: (id: string) => void;
  allChapters?: ChapterItem[];
  peerStudents: PeerStudent[];
  agendasData?: AgendaAkademikItem[];
  examsData?: UjianItem[];
  onNavigateToCourses: () => void;
}

export default function TabBelajar({
  studentName,
  currentUserRank,
  namaKelas = "Kelas 8A",
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
  onNavigateToCourses,
}: TabBelajarProps) {
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

  // Selected Subject Detail Modal
  const [selectedSubject, setSelectedSubject] = useState<{
    name: "Matematika" | "Bahasa Inggris" | "Bahasa Indonesia";
    teacher: string;
    iconColor: string;
    accentBg: string;
  } | null>(null);

  // Selected Semester inside Subject Modal
  const [selectedSubjectSemester, setSelectedSubjectSemester] = useState<1 | 2>(1);

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
            ? { ...e, status: event.payload.status }
            : e
        )
      );
    }
  });

  // Separate Exams for Section "AKU LULUS"
  const ulanganList = localExams.filter((e) => e.tipe === "ulangan");
  const ujianList = localExams.filter((e) => e.tipe === "ujian");

  const targetUlangan =
    ulanganList.find((e) => e.status === "dipublikasi") || ulanganList[0] || null;
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

  // Active Subject Detail Data
  const getSubjectChapters = (subjName: string) => {
    if (subjName === "Matematika") return mathChapters;
    if (subjName === "Bahasa Inggris") return englishChapters;
    if (subjName === "Bahasa Indonesia") return indonesianChapters;
    return [];
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-8 pb-16 font-sans">
      {/* 1. SCHOOL BANNER */}
      {!sekolahData ? (
        <section className="relative rounded-3xl overflow-hidden shadow-xl border border-amber-500/30 text-white bg-slate-900 w-full mb-8">
          <div className="absolute inset-0 bg-linear-to-r from-amber-950/40 via-slate-900 to-slate-950 opacity-90" />
          <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 max-w-3xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
                <TriangleAlert className="w-7 h-7 text-amber-400" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Profil Sekolah Belum Ditemukan
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                  Halo, <strong className="text-white">{studentName}</strong>! Akun siswa Anda saat ini belum dihubungkan dengan database sekolah manapun di platform Thinksy.
                </p>
                <div className="mt-3 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-semibold leading-relaxed flex items-start gap-2.5 shadow-xs">
                  <HelpCircle className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Jika akun Anda belum terdaftar di database sekolah, silakan laporkan kepada <strong>Wali Kelas</strong> atau <strong>Admin Sekolah</strong> Anda untuk penautan akun.
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto">
              <button
                onClick={() => window.location.reload()}
                className="py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition duration-200 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-950" />
                <span>Muat Ulang Halaman</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-800 text-white bg-slate-900">
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform hover:scale-105"
            style={{
              backgroundImage: `url('${
                sekolahData.bg_image_url || "/images/smk-muh-pakem.png"
              }')`,
            }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-900/85 to-slate-900/60 backdrop-blur-[1px]" />

          <div className="relative z-10 p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-extrabold uppercase tracking-wider shadow-xs backdrop-blur-md">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>Kurikulum Merdeka • Sekolah Pusat Keunggulan & Pesantren Vokasi</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md leading-tight">
              {sekolahData.nama}
            </h1>

            {sekolahData.motto && (
              <p className="text-amber-400 font-extrabold text-sm sm:text-base tracking-wide drop-shadow-sm max-w-2xl">
                ✨ {sekolahData.motto}
              </p>
            )}

            {sekolahData.deskripsi && (
              <p className="text-slate-200 text-xs sm:text-sm max-w-3xl leading-relaxed font-medium mt-1">
                {sekolahData.deskripsi}
              </p>
            )}

            {sekolahData.links && sekolahData.links.length > 0 && (
              <div className="flex flex-wrap justify-center items-center gap-3 pt-3">
                {sekolahData.links.slice(0, 3).map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/20 hover:border-white/40 transition duration-200 shadow-sm cursor-pointer hover:scale-105"
                  >
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>{link.label}</span>
                    <ExternalLink className="w-3 h-3 text-slate-300 ml-0.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. TOP GRID: WELCOME CARD (NO STREAK) & ACADEMIC CALENDAR */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* WELCOME CARD (Left 2 cols) */}
        <div className="lg:col-span-2 saas-card p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden bg-white flex flex-col gap-3.5 sm:gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                Selamat Datang Kembali, {studentName.split(" ")[0]}!
              </h2>
              <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 tracking-wide">
                Peringkat #{currentUserRank}
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium max-w-xl">
              Pantau jadwal ulangan, modul pembelajaran semester, dan klaim poin dari misi belajarmu hari ini.
            </p>
          </div>

          {/* 3 Metric Cards: Kelas Siswa, Progress Belajar, Poin Belajar (NO DAILY STREAK) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Kelas Siswa */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
                  KELAS SISWA
                </div>
                <div className="text-base font-black text-[#0F172A]">
                  {namaKelas}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Semester Ganjil
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
                  PROGRESS BELAJAR
                </div>
                <div className="text-base font-black text-[#0F172A]">
                  {learningProgressPercent}%
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Modul & Latihan
                </div>
              </div>
            </div>

            {/* 3. Poin Belajar */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <Trophy className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
                  POIN BELAJAR
                </div>
                <div className="text-base font-black text-[#0F172A]">
                  {learningPoints.toLocaleString("id-ID")}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Total Poin Akun
                </div>
              </div>
            </div>
          </div>

          {/* Quick Resume Card - tightly placed under metric cards */}
          {mathChapters.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-linear-to-r from-blue-50/90 via-slate-50 to-indigo-50/50 border border-blue-100 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
                    Lanjutkan Pembelajaran Terakhir
                  </div>
                  <div className="text-sm font-black text-[#0F172A] line-clamp-1">
                    {mathChapters[0].judul}
                  </div>
                </div>
              </div>
              <Link
                href={`/bab/${mathChapters[0].id}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition shadow-xs cursor-pointer hover:scale-105 shrink-0"
              >
                <span>Lanjutkan Belajar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* ACADEMIC CALENDAR (Right 1 col) */}
        <div className="lg:col-span-1 p-5 sm:p-6 rounded-3xl bg-white text-slate-900 shadow-xs border border-slate-200 flex flex-col justify-between space-y-3.5 relative">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-black text-[#0F172A] tracking-tight">
                Agenda Akademik
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              September 2026
            </span>
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
                                        ? "bg-purple-100 text-purple-800 border border-purple-200"
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
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] min-h-[26px]">
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

      {/* 3. SECTION "AKU LULUS" (ULANGAN & UJIAN) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mb-1">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Evaluasi & Asesmen Terstandar</span>
            </div>
            <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">
              AKU LULUS
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Akses Ulangan Harian dan Ujian resmi yang telah diaktifkan oleh Guru.
            </p>
          </div>

          <Link
            href="/ujian"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>Buka Ruang Ujian</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: ULANGAN */}
          <div
            className={`saas-card rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between space-y-4 ${
              targetUlangan && isUlanganActive
                ? "bg-white border-indigo-200 shadow-sm hover:border-indigo-300"
                : "bg-slate-50/80 border-slate-200 text-slate-500"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      targetUlangan && isUlanganActive
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-extrabold text-sm text-[#0F172A]">
                    Ulangan
                  </span>
                </div>

                {targetUlangan ? (
                  isUlanganActive ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                      <span>Aktif & Tersedia</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-600 text-[10px] font-extrabold uppercase flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>Ditutup Guru</span>
                    </span>
                  )
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                    Belum tersedia
                  </span>
                )}
              </div>

              {targetUlangan ? (
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-[#0F172A]">
                    {targetUlangan.judul}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Mata Pelajaran
                      </span>
                      <span className="font-bold text-[#0F172A]">
                        {targetUlangan.mapel}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Durasi
                      </span>
                      <span className="font-bold text-[#0F172A]">
                        {targetUlangan.durasi_menit} Menit
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Status Pengerjaan
                      </span>
                      <span className="font-bold capitalize text-blue-600">
                        {targetUlangan.sessionStatus === "selesai"
                          ? "Selesai"
                          : targetUlangan.sessionStatus === "sedang_mengerjakan"
                          ? "Sedang Dikerjakan"
                          : "Belum Dikerjakan"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Nilai Hasil
                      </span>
                      <span className="font-extrabold text-emerald-700">
                        {targetUlangan.score !== null && targetUlangan.score !== undefined
                          ? `${targetUlangan.score} / 100`
                          : "Belum ada nilai"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 space-y-1">
                  <AlertCircle className="w-7 h-7 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-600">
                    Ulangan Harian Belum Tersedia
                  </p>
                  <p className="text-[11px]">
                    Guru belum mengaktifkan jadwal ulangan untuk kelas Anda.
                  </p>
                </div>
              )}
            </div>

            {targetUlangan ? (
              isUlanganActive ? (
                <Link
                  href={`/ujian/${targetUlangan.id}`}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <PlayCircle className="w-4 h-4 text-amber-300" />
                  <span>
                    {targetUlangan.sessionStatus === "selesai"
                      ? "Lihat Hasil Ulangan"
                      : targetUlangan.sessionStatus === "sedang_mengerjakan"
                      ? "Lanjutkan Ulangan"
                      : "Mulai Kerjakan Ulangan"}
                  </span>
                </Link>
              ) : targetUlangan.sessionStatus === "selesai" ? (
                <Link
                  href={`/ujian/${targetUlangan.id}`}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Lihat Hasil Ulangan (Selesai)</span>
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-extrabold flex items-center justify-center gap-2 cursor-not-allowed select-none"
                  title="Guru sedang menutup akses ulangan ini"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Akses Dinonaktifkan oleh Guru</span>
                </button>
              )
            ) : (
              <button
                disabled
                className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold cursor-not-allowed text-center"
              >
                Belum tersedia
              </button>
            )}
          </div>

          {/* Card 2: UJIAN */}
          <div
            className={`saas-card rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between space-y-4 ${
              targetUjian && isUjianActive
                ? "bg-white border-blue-200 shadow-sm hover:border-blue-300"
                : "bg-slate-50/80 border-slate-200 text-slate-500"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      targetUjian && isUjianActive
                        ? "bg-[#0F172A] text-white shadow-xs"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <Clock className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <span className="font-extrabold text-sm text-[#0F172A]">
                    Ujian
                  </span>
                </div>

                {targetUjian ? (
                  isUjianActive ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      <span>Aktif & Tersedia</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-600 text-[10px] font-extrabold uppercase flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>Ditutup Guru</span>
                    </span>
                  )
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                    Belum tersedia
                  </span>
                )}
              </div>

              {targetUjian ? (
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-[#0F172A]">
                    {targetUjian.judul}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Mata Pelajaran
                      </span>
                      <span className="font-bold text-[#0F172A]">
                        {targetUjian.mapel}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Durasi
                      </span>
                      <span className="font-bold text-[#0F172A]">
                        {targetUjian.durasi_menit} Menit
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Status Pengerjaan
                      </span>
                      <span className="font-bold capitalize text-blue-600">
                        {targetUjian.sessionStatus === "selesai"
                          ? "Selesai"
                          : targetUjian.sessionStatus === "sedang_mengerjakan"
                          ? "Sedang Dikerjakan"
                          : "Belum Dikerjakan"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Nilai Hasil
                      </span>
                      <span className="font-extrabold text-emerald-700">
                        {targetUjian.score !== null && targetUjian.score !== undefined
                          ? `${targetUjian.score} / 100`
                          : "Belum ada nilai"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 space-y-1">
                  <AlertCircle className="w-7 h-7 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-600">
                    Ujian Terjadwal Belum Tersedia
                  </p>
                  <p className="text-[11px]">
                    Guru atau Admin belum membuka sesi ujian untuk saat ini.
                  </p>
                </div>
              )}
            </div>

            {targetUjian ? (
              isUjianActive ? (
                <Link
                  href={`/ujian/${targetUjian.id}`}
                  className="w-full py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <PlayCircle className="w-4 h-4 text-amber-400" />
                  <span>
                    {targetUjian.sessionStatus === "selesai"
                      ? "Lihat Hasil Ujian"
                      : targetUjian.sessionStatus === "sedang_mengerjakan"
                      ? "Lanjutkan Ujian"
                      : "Mulai Kerjakan Ujian"}
                  </span>
                </Link>
              ) : targetUjian.sessionStatus === "selesai" ? (
                <Link
                  href={`/ujian/${targetUjian.id}`}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Lihat Hasil Ujian (Selesai)</span>
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-extrabold flex items-center justify-center gap-2 cursor-not-allowed select-none"
                  title="Guru sedang menutup akses ujian ini"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Akses Dinonaktifkan oleh Guru</span>
                </button>
              )
            ) : (
              <button
                disabled
                className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold cursor-not-allowed text-center"
              >
                Belum tersedia
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 4. SECTION "KELAS AKTIF" (3 CORE SUBJECTS) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#0F172A] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Kelas Aktif</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              3 Mata Pelajaran Utama Kelas 8. Klik kartu untuk melihat rincian guru, bab, dan materi.
            </p>
          </div>
          <Link
            href="/belajar"
            className="px-4 py-2 rounded-xl bg-[#0F172A] text-white hover:bg-slate-800 text-xs font-bold transition cursor-pointer shadow-xs"
          >
            Buka Halaman Belajar
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: MATEMATIKA */}
          <div
            onClick={() =>
              setSelectedSubject({
                name: "Matematika",
                teacher: "Ibu Siti Rahmawati, M.Pd.",
                iconColor: "text-blue-600",
                accentBg: "bg-blue-50 border-blue-200",
              })
            }
            className="saas-card saas-card-hover rounded-3xl p-6 border border-slate-200 flex flex-col justify-between space-y-5 shadow-xs group bg-white cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-blue-50 text-blue-700 uppercase tracking-wider">
                  6 Bab • 2 Semester
                </span>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Mata Pelajaran Wajib
                </div>
                <h3 className="text-lg font-black text-[#0F172A] group-hover:text-blue-600 transition">
                  Matematika
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Guru: <strong>Ibu Siti Rahmawati, M.Pd.</strong>
                </p>
                <div className="mt-2 text-xs text-slate-500 font-medium">
                  Materi Terakhir:{" "}
                  <span className="text-[#0F172A] font-bold">
                    {mathChapters[0]?.judul || "Bab 1: Bilangan Berpangkat"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">
                Ulangan Harian 1 Aktif
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 group-hover:translate-x-0.5 transition">
                <span>Rincian</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Card 2: BAHASA INGGRIS */}
          <div
            onClick={() =>
              setSelectedSubject({
                name: "Bahasa Inggris",
                teacher: "Budi Santoso, S.Pd.",
                iconColor: "text-indigo-600",
                accentBg: "bg-indigo-50 border-indigo-200",
              })
            }
            className="saas-card saas-card-hover rounded-3xl p-6 border border-slate-200 flex flex-col justify-between space-y-5 shadow-xs group bg-white cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                  6 Bab • 2 Semester
                </span>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Mata Pelajaran Wajib
                </div>
                <h3 className="text-lg font-black text-[#0F172A] group-hover:text-indigo-600 transition">
                  Bahasa Inggris
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Guru: <strong>Budi Santoso, S.Pd.</strong>
                </p>
                <div className="mt-2 text-xs text-slate-500 font-medium">
                  Materi Terakhir:{" "}
                  <span className="text-[#0F172A] font-bold">
                    {englishChapters[0]?.judul || "Bab 1: Congratulation and Compliment"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">
                PTS Ganjil Tersedia
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 group-hover:translate-x-0.5 transition">
                <span>Rincian</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Card 3: BAHASA INDONESIA */}
          <div
            onClick={() =>
              setSelectedSubject({
                name: "Bahasa Indonesia",
                teacher: "Dra. Nurul Hidayah",
                iconColor: "text-emerald-600",
                accentBg: "bg-emerald-50 border-emerald-200",
              })
            }
            className="saas-card saas-card-hover rounded-3xl p-6 border border-slate-200 flex flex-col justify-between space-y-5 shadow-xs group bg-white cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 uppercase tracking-wider">
                  6 Bab • 2 Semester
                </span>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Mata Pelajaran Wajib
                </div>
                <h3 className="text-lg font-black text-[#0F172A] group-hover:text-emerald-600 transition">
                  Bahasa Indonesia
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Guru: <strong>Dra. Nurul Hidayah</strong>
                </p>
                <div className="mt-2 text-xs text-slate-500 font-medium">
                  Materi Terakhir:{" "}
                  <span className="text-[#0F172A] font-bold">
                    {indonesianChapters[0]?.judul || "Bab 1: Menulis Teks LHO"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">
                Tugas Proyek LHO
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600 group-hover:translate-x-0.5 transition">
                <span>Rincian</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MISI HARIAN SISWA (WITH REWARDS & AUTO-CLAIM) */}
      <section className="saas-card rounded-3xl p-6 border border-slate-200 shadow-sm bg-white space-y-5">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Misi Harian Siswa
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Selesaikan tantangan harian untuk mengklaim reward poin. Misi otomatis terklaim dalam 24 jam.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Server-Timed Quests</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isMissionsLoading ? (
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-3xl border bg-slate-50/80 border-slate-100 space-y-4 animate-pulse"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-5 bg-amber-100 rounded-xl w-16" />
                </div>
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-9 bg-slate-200 rounded-2xl w-full" />
              </div>
            ))
          ) : dailyMissions.length === 0 ? (
            <div className="col-span-3 text-center py-8 bg-slate-50/60 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-2">
              <Target className="w-8 h-8 text-slate-300" />
              <span>Belum ada misi harian yang aktif hari ini.</span>
            </div>
          ) : (
            dailyMissions.map((misi) => {
              const isCompleted =
                Number((misi as any).progres_saat_ini ?? (misi as any).currentCount) >=
                Number((misi as any).target_max ?? (misi as any).targetCount);
              const isClaimed = Boolean(
                (misi as any).diklaim ?? (misi as any).isClaimed
              );

              return (
                <div
                  key={misi.id}
                  className={`group relative rounded-3xl border p-5 transition-all duration-300 flex flex-col justify-between space-y-4 overflow-hidden ${
                    isClaimed
                      ? "bg-emerald-50/40 border-emerald-200 shadow-xs"
                      : isCompleted
                      ? "bg-amber-50/50 border-amber-300 shadow-md shadow-amber-500/10 ring-1 ring-amber-300"
                      : "bg-white hover:bg-slate-50/60 border-slate-200 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-amber-950 transition-colors leading-snug">
                        {(misi as any).judul || (misi as any).title}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                        +{(misi as any).poin_hadiah || (misi as any).rewardPoints || 20} Poin
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {(misi as any).deskripsi || "Selesaikan target aktivitas belajar ini hari ini."}
                    </p>
                  </div>

                  <div className="pt-2">
                    {isClaimed ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center gap-1.5 cursor-not-allowed border border-emerald-200"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Sudah Diklaim</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onClaimMission(misi.id)}
                        disabled={isClaimingMissionId === misi.id}
                        className={`w-full py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                          isCompleted
                            ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 active:scale-[0.98]"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {isClaimingMissionId === misi.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        <span>{isCompleted ? "Klaim Reward" : "Kerjakan"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 6. MODAL INTERAKTIF: RINCIAN MATA PELAJARAN KELAS AKTIF */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedSubject(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Subject Modal */}
            <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shadow-xs">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#0F172A]">
                  {selectedSubject.name} • Kelas 8
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Guru Pengampu: <strong>{selectedSubject.teacher}</strong>
                </p>
              </div>
            </div>

            {/* Semester Switcher */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => setSelectedSubjectSemester(1)}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  selectedSubjectSemester === 1
                    ? "bg-[#0F172A] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semester 1 (Bab 1 - 3)
              </button>
              <button
                onClick={() => setSelectedSubjectSemester(2)}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  selectedSubjectSemester === 2
                    ? "bg-[#0F172A] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semester 2 (Bab 4 - 6)
              </button>
            </div>

            {/* Bab List for Selected Semester from Supabase */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {getSubjectChapters(selectedSubject.name)
                .filter(
                  (ch) =>
                    (ch.semester || (ch.urutan <= 3 ? 1 : 2)) ===
                    selectedSubjectSemester
                )
                .map((bab, idx) => (
                  <div
                    key={bab.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 transition space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                        Bab {bab.urutan || idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {bab.materi?.length || 3} Modul Pembelajaran
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-[#0F172A]">
                      {bab.judul}
                    </h4>
                    {bab.deskripsi && (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {bab.deskripsi}
                      </p>
                    )}
                  </div>
                ))}
            </div>

            {/* Action Footer: [Lanjutkan Belajar] */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedSubject(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Tutup
              </button>

              {getSubjectChapters(selectedSubject.name)[0] && (
                <Link
                  href={`/bab/${getSubjectChapters(selectedSubject.name)[0].id}`}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-md"
                >
                  <span>Lanjutkan Belajar</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
