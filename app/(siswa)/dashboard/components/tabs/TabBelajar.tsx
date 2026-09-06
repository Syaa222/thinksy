"use client";

import Link from "next/link";
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
  Flame,
  Clock,
  Lock,
  Target,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  SekolahData,
  CalendarWeekItem,
  DailyMission,
  ChapterItem,
  PeerStudent,
} from "../../types";

interface TabBelajarProps {
  studentName: string;
  currentUserRank: number;
  learningProgressPercent: number;
  learningPoints: number;
  dailyStreak: number;
  sekolahData?: SekolahData | null;
  calendarWeeks: CalendarWeekItem[];
  dailyMissions: DailyMission[];
  isMissionsLoading: boolean;
  isClaimingMissionId: string | null;
  onClaimMission: (id: string) => void;
  top3Chapters: ChapterItem[];
  peerStudents: PeerStudent[];
  onNavigateToCourses: () => void;
}

export default function TabBelajar({
  studentName,
  currentUserRank,
  learningProgressPercent,
  learningPoints,
  dailyStreak,
  sekolahData,
  calendarWeeks,
  dailyMissions,
  isMissionsLoading,
  isClaimingMissionId,
  onClaimMission,
  top3Chapters,
  peerStudents,
  onNavigateToCourses,
}: TabBelajarProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-8">
      {!sekolahData ? (
        <section className="relative rounded-3xl overflow-hidden shadow-xl border border-amber-500/30 text-white bg-slate-900 w-full mb-8">
          <div className="absolute inset-0 bg-linear-to-r from-amber-950/40 via-slate-900 to-slate-950 opacity-90" />
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

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
                  Halo, <strong className="text-white">{studentName}</strong>! Akun
                  siswa Anda saat ini belum dihubungkan dengan database sekolah
                  manapun di platform Thinksy.
                </p>

                <div className="mt-3 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-semibold leading-relaxed flex items-start gap-2.5 shadow-xs">
                  <HelpCircle className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Jika akun Anda belum terdaftar di database sekolah, akses fitur
                    pembelajaran akan dibatasi. Silakan laporkan kepada{" "}
                    <strong>Wali Kelas</strong> atau <strong>Admin Sekolah</strong>{" "}
                    Anda untuk penautan akun.
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
                sekolahData.bg_image_url || "/images/smk-muh1-playen.jpg"
              }')`,
            }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-900/85 to-slate-900/60 backdrop-blur-[1px]" />

          <div className="relative z-10 p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-extrabold uppercase tracking-wider shadow-xs backdrop-blur-md">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>Kurikulum Merdeka • Sekolah Pusat Keunggulan</span>
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

      {/* TOP 2-CARD LAYOUT: STUDENT LEARNING HUB */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD KIRI: Student Overview, Quick Action & Linear Metrics */}
        <div className="lg:col-span-2 saas-card p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden bg-white flex flex-col justify-between space-y-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                Selamat Datang Kembali, {studentName.split(" ")[0]}!
              </h2>
              <span className="text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 tracking-wide">
                #{currentUserRank}
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium max-w-xl">
              Selesaikan tugas harianmu dan tingkatkan pemahamanmu bersama Tutor AI Thinksy.
            </p>
          </div>

          {/* Quick Resume Card */}
          {top3Chapters && top3Chapters.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/40 border border-blue-100/80 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
                    Lanjutkan Pembelajaran Terakhir
                  </div>
                  <div className="text-sm font-black text-[#0F172A] line-clamp-1">
                    {top3Chapters[0].judul}
                  </div>
                </div>
              </div>
              <Link
                href={`/bab/${top3Chapters[0].id}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition shadow-xs cursor-pointer hover:scale-105 shrink-0"
              >
                <span>Lanjut Belajar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Linear Metrics Row: Progress Ring, Poin, Streak */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            {/* 1. Ring Progress */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600 transition-all duration-500"
                    strokeDasharray={`${learningProgressPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[11px] font-black text-[#0F172A]">
                  {learningProgressPercent}%
                </span>
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  PROGRES
                </div>
                <div className="text-sm font-black text-slate-800">
                  {learningProgressPercent}% Selesai
                </div>
              </div>
            </div>

            <div className="hidden sm:block h-8 w-px bg-slate-200" />

            {/* 2. Poin Belajar */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  POIN BELAJAR
                </div>
                <div className="text-sm font-black text-slate-900">
                  {learningPoints.toLocaleString("id-ID")}{" "}
                  <span className="text-xs font-semibold text-slate-500">
                    Poin
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden sm:block h-8 w-px bg-slate-200" />

            {/* 3. Daily Streak */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-600 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-400" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  DAILY STREAK
                </div>
                <div className="text-sm font-black text-slate-900">
                  {dailyStreak}{" "}
                  <span className="text-xs font-semibold text-slate-500">
                    Hari
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD KANAN: Custom Calendar View (Clean, Light Theme) */}
        <div className="lg:col-span-1 p-5 sm:p-6 rounded-3xl bg-white text-slate-900 shadow-xs border border-slate-200 flex flex-col justify-between space-y-4 relative">
          <div className="pb-1">
            <h3 className="text-xl font-black text-[#0F172A] tracking-tight">
              September 2026
            </h3>
          </div>

          <div className="grid grid-cols-8 gap-1 text-center text-xs font-bold text-slate-400">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
            <span></span>
          </div>

          <div className="space-y-2">
            {calendarWeeks.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-cols-8 gap-1 items-center">
                {week.days.map((dayObj, dIdx) => (
                  <div
                    key={dIdx}
                    className="relative group/day flex items-center justify-center"
                  >
                    {dayObj.status === "today" ? (
                      <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full border-2 border-blue-600 bg-blue-50/60 text-blue-700 font-black flex items-center justify-center text-xs shadow-xs cursor-pointer ring-2 ring-blue-500/20 hover:scale-105 transition duration-150">
                        {dayObj.day}
                      </div>
                    ) : dayObj.status === "streak" ? (
                      <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-orange-50 border border-orange-300 text-orange-700 font-black flex items-center justify-center text-xs shadow-2xs cursor-pointer hover:scale-105 hover:bg-orange-100 transition duration-150">
                        {dayObj.day}
                      </div>
                    ) : dayObj.status === "scheduled" ? (
                      <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-slate-100 border border-slate-200 text-slate-900 font-bold flex items-center justify-center text-xs shadow-2xs cursor-pointer hover:bg-slate-200 hover:border-slate-400 hover:scale-105 transition duration-150">
                        {dayObj.day}
                      </div>
                    ) : dayObj.status === "past" ? (
                      <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full border border-slate-100 text-slate-400 font-medium flex items-center justify-center text-xs cursor-pointer hover:bg-slate-50 transition duration-150">
                        {dayObj.day}
                      </div>
                    ) : !dayObj.isCurrentMonth ? (
                      <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full flex items-center justify-center text-xs font-semibold text-slate-300 cursor-pointer hover:text-slate-400 transition duration-150">
                        {dayObj.day}
                      </div>
                    ) : (
                      <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full border border-slate-200 text-slate-600 font-medium flex items-center justify-center text-xs cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition duration-150">
                        {dayObj.day}
                      </div>
                    )}

                    {(dayObj.schedule ||
                      dayObj.status === "streak" ||
                      dayObj.status === "today" ||
                      dayObj.status === "past") && (
                      <div
                        className={`absolute ${
                          wIdx <= 1 ? "top-full mt-2" : "bottom-full mb-2"
                        } ${
                          dIdx <= 1
                            ? "left-0"
                            : dIdx >= 5
                            ? "right-0"
                            : "left-1/2 -translate-x-1/2"
                        } w-56 p-3 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 pointer-events-none opacity-0 group-hover/day:opacity-100 transition-all duration-200 z-50 text-left`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                          <span className="text-[11px] font-bold text-slate-500">
                            {dayObj.fullDateStr}
                          </span>
                          {dayObj.status === "today" ? (
                            <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                              Hari Ini
                            </span>
                          ) : dayObj.status === "streak" ? (
                            <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                              Streak
                            </span>
                          ) : dayObj.schedule ? (
                            <span className="text-[10px] font-bold text-slate-500">
                              Terjadwal
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">
                              Selesai
                            </span>
                          )}
                        </div>

                        {dayObj.schedule ? (
                          <div className="space-y-1">
                            <div className="text-xs font-black text-[#0F172A] leading-snug">
                              {dayObj.schedule.bab}
                            </div>
                            <div className="text-[11px] text-blue-600 font-bold flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{dayObj.schedule.jam}</span>
                            </div>
                            {dayObj.schedule.room && (
                              <div className="text-[10px] text-slate-500 font-medium">
                                📍 {dayObj.schedule.room}{" "}
                                {dayObj.schedule.teacher
                                  ? `• ${dayObj.schedule.teacher}`
                                  : ""}
                              </div>
                            )}
                          </div>
                        ) : dayObj.status === "streak" ? (
                          <div className="space-y-0.5">
                            <div className="text-xs font-black text-orange-700">
                              Streak Belajar Aktif 🔥
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              Presensi & aktivitas harian terselesaikan dengan baik.
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500">
                            Tidak ada jadwal kelas pada tanggal ini.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-center">
                  {week.hasStreakBadge && week.streakCount > 0 ? (
                    <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-gradient-to-tr from-orange-600 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30 font-black text-xs">
                      <Flame className="w-4 h-4 fill-white" />
                      <span className="ml-0.5">{week.streakCount}</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-slate-200" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DAILY MISSIONS WIDGET */}
      <div className="relative">
        {!sekolahData && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-[2.5px] rounded-3xl p-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-amber-400 border border-slate-700 flex items-center justify-center shadow-lg mb-1.5">
              <Lock className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider bg-slate-950/80 px-3.5 py-1 rounded-full border border-slate-700 shadow-sm">
              Fitur Dikunci
            </span>
            <p className="text-[11px] text-slate-200 font-semibold mt-1">
              Misi Harian tidak bisa diakses — Akun belum terhubung ke sekolah
            </p>
          </div>
        )}
        <section
          className={`saas-card rounded-3xl p-6 border border-slate-200/90 shadow-sm bg-white space-y-5 ${
            !sekolahData
              ? "filter blur-[2.5px] select-none pointer-events-none opacity-60"
              : ""
          }`}
        >
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Misi Harian Siswa
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Selesaikan tantangan belajar harian untuk mengklaim bonus Poin & tingkatkan peringkatmu!
            </p>
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
                <span>
                  Misi harian tidak tersedia. Pastikan akun Anda terhubung ke sekolah.
                </span>
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
                        ? "bg-emerald-50/40 border-emerald-200/90 shadow-xs"
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
                        {(misi as any).deskripsi ||
                          "Selesaikan target misi ini hari ini."}
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
                          <span>Klaim</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* ACTIVE CLASSES GRID */}
      <div className="relative">
        {!sekolahData && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-[2.5px] rounded-3xl p-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-amber-400 border border-slate-700 flex items-center justify-center shadow-lg mb-1.5">
              <Lock className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white uppercase tracking-wider bg-slate-950/80 px-3.5 py-1 rounded-full border border-slate-700 shadow-sm">
              Fitur Dikunci
            </span>
            <p className="text-[11px] text-slate-200 font-semibold mt-1">
              Kelas Aktif & Modul Materi tidak bisa diakses — Akun belum terhubung ke sekolah
            </p>
          </div>
        )}
        <section
          className={`space-y-4 ${
            !sekolahData
              ? "filter blur-[2.5px] select-none pointer-events-none opacity-60"
              : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Kelas Aktif Saya</span>
            </h2>
            <button
              onClick={onNavigateToCourses}
              className="px-4 py-2 rounded-xl bg-[#0F172A] text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs"
            >
              Lihat Semua
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {top3Chapters.map((cls, idx) => (
              <Link
                key={cls.id}
                href={`/bab/${cls.id}`}
                className="saas-card saas-card-hover rounded-3xl p-6 border border-slate-200 flex flex-col justify-between space-y-5 shadow-xs group bg-white"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                      Bab {cls.urutan || idx + 1}
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Matematika • Kelas 8 (Fase D)
                    </div>
                    <h3 className="text-lg font-extrabold text-[#0F172A] group-hover:text-blue-600 transition">
                      {cls.judul}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {cls.deskripsi ||
                        "Capaian Pembelajaran Kurikulum Merdeka Matematika SMP Kelas 8."}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center -space-x-2 overflow-hidden py-1">
                    {peerStudents.slice(0, 4).map((peer) => (
                      <div
                        key={peer.id}
                        title={peer.name}
                        className="relative group/avatar inline-block"
                      >
                        <div className="w-8 h-8 rounded-full ring-2 ring-white bg-[#0F172A] text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs overflow-hidden transition-transform duration-200 group-hover/avatar:scale-115 group-hover/avatar:z-20 cursor-pointer">
                          {peer.avatarUrl ? (
                            <img
                              src={peer.avatarUrl}
                              alt={peer.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{peer.initials}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {peerStudents.length > 4 && (
                      <div
                        title={`${peerStudents.length - 4} siswa lainnya`}
                        className="w-8 h-8 rounded-full ring-2 ring-white bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black shadow-xs cursor-pointer hover:bg-slate-200"
                      >
                        +{peerStudents.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Mulai</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
