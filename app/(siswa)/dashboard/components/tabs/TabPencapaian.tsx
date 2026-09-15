"use client";

import { useState } from "react";
import {
  Gift,
  RefreshCw,
  Trophy,
  Flame,
  Zap,
  Target,
  Sparkles,
  Lock,
  CheckCircle2,
  ChevronRight,
  Info,
  X,
  ArrowUpRight,
  Award,
  BookOpen,
} from "lucide-react";
import { StudentBadgeDetail } from "@/app/api/siswa/pencapaian/route";

interface TabPencapaianProps {
  completedQuizCount: number;
  dailyStreak: number;
  learningPoints: number;
  answeredSoalCount: number;
  badgesList?: StudentBadgeDetail[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onNavigateTab?: (tab: "Home" | "Belajar" | "Ruang Ujian" | "Peringkat" | "Pencapaian") => void;
}

export default function TabPencapaian({
  completedQuizCount,
  dailyStreak,
  learningPoints,
  answeredSoalCount,
  badgesList,
  isLoading = false,
  onRefresh,
  onNavigateTab,
}: TabPencapaianProps) {
  const [filter, setFilter] = useState<"all" | "unlocked" | "in_progress" | "locked">("all");
  const [selectedBadge, setSelectedBadge] = useState<StudentBadgeDetail | null>(null);

  // Fallback fallback badges if badgesList is not yet loaded
  const defaultBadges: StudentBadgeDetail[] = [
    {
      id: "b1",
      title: "Langkah Pertama",
      desc: "Menyelesaikan 1 kuis atau latihan pertama Anda.",
      tier: "Bronze",
      tierColor: "from-amber-600 to-amber-700 border-amber-300 text-amber-900 bg-amber-50",
      icon: "🚀",
      rewardPoints: 50,
      isUnlocked: completedQuizCount >= 1,
      currentValue: completedQuizCount,
      targetValue: 1,
      unit: "Kuis",
      progressPercent: Math.min(100, Math.round((completedQuizCount / 1) * 100)),
      progressText: `${completedQuizCount}/1 Kuis`,
      remainingText:
        completedQuizCount >= 1
          ? "Telah selesai diraih! 🎉"
          : `Kurang ${1 - completedQuizCount} kuis lagi`,
      tips: "Buka menu Belajar atau Ruang Ujian, lalu selesaikan 1 sesi latihan materi.",
      actionUrl: "#belajar",
      actionLabel: "Buka Belajar",
    },
    {
      id: "b2",
      title: "Master Kuis",
      desc: "Menyelesaikan minimal 5 kuis atau ujian dengan sungguh-sungguh.",
      tier: "Silver",
      tierColor: "from-slate-400 to-slate-600 border-slate-300 text-slate-900 bg-slate-50",
      icon: "🏆",
      rewardPoints: 150,
      isUnlocked: completedQuizCount >= 5,
      currentValue: completedQuizCount,
      targetValue: 5,
      unit: "Kuis",
      progressPercent: Math.min(100, Math.round((completedQuizCount / 5) * 100)),
      progressText: `${completedQuizCount}/5 Kuis`,
      remainingText:
        completedQuizCount >= 5
          ? "Lencana Master Kuis telah dibuka! 🏆"
          : `Kurang ${Math.max(0, 5 - completedQuizCount)} kuis lagi`,
      tips: "Konsisten kerjakan kuis di setiap bab pelajaran matematika.",
      actionUrl: "#ruang-ujian",
      actionLabel: "Lihat Ujian",
    },
    {
      id: "b3",
      title: "Pejuang Streak",
      desc: "Kehadiran presensi sekolah harian berturut-turut selama 7 hari.",
      tier: "Gold",
      tierColor: "from-amber-400 to-orange-500 border-amber-400 text-orange-950 bg-amber-50/80",
      icon: "🔥",
      rewardPoints: 200,
      isUnlocked: dailyStreak >= 7,
      currentValue: dailyStreak,
      targetValue: 7,
      unit: "Hari",
      progressPercent: Math.min(100, Math.round((dailyStreak / 7) * 100)),
      progressText: `${dailyStreak}/7 Hari`,
      remainingText:
        dailyStreak >= 7
          ? "Streak 7 hari tercapai! Pertahankan api belajarmu 🔥"
          : `Kurang ${Math.max(0, 7 - dailyStreak)} hari berturut-turut`,
      tips: "Lakukan presensi selfie setiap pagi sebelum pukul 07.15 WIB.",
      actionUrl: "#presensi",
      actionLabel: "Cek Presensi",
    },
    {
      id: "b4",
      title: "Pembelajar Hebat",
      desc: "Mengumpulkan minimal 1.000 Poin Belajar (XP) dari seluruh aktivitas.",
      tier: "Emerald",
      tierColor: "from-emerald-500 to-teal-600 border-emerald-300 text-emerald-950 bg-emerald-50",
      icon: "⭐",
      rewardPoints: 300,
      isUnlocked: learningPoints >= 1000,
      currentValue: learningPoints,
      targetValue: 1000,
      unit: "Poin",
      progressPercent: Math.min(100, Math.round((learningPoints / 1000) * 100)),
      progressText: `${learningPoints.toLocaleString("id-ID")}/1.000 Poin`,
      remainingText:
        learningPoints >= 1000
          ? "Pencapaian 1.000 Poin tercapai dengan gemilang! ⭐"
          : `Kurang ${(1000 - learningPoints).toLocaleString("id-ID")} poin lagi`,
      tips: "Kumpulkan poin dari presensi tepat waktu (+20), kuis (+50), dan ulangan (+100).",
      actionUrl: "#peringkat",
      actionLabel: "Lihat Papan Skor",
    },
    {
      id: "b5",
      title: "Penjelajah Soal",
      desc: "Menjawab minimal 10 butir soal matematika dan eksplorasi kurikulum.",
      tier: "Indigo",
      tierColor: "from-indigo-500 to-blue-600 border-indigo-300 text-indigo-950 bg-indigo-50",
      icon: "🎯",
      rewardPoints: 100,
      isUnlocked: answeredSoalCount >= 10,
      currentValue: answeredSoalCount,
      targetValue: 10,
      unit: "Soal",
      progressPercent: Math.min(100, Math.round((answeredSoalCount / 10) * 100)),
      progressText: `${answeredSoalCount}/10 Soal`,
      remainingText:
        answeredSoalCount >= 10
          ? "Penjelajah Soal berhasil dikuasai! 🎯"
          : `Kurang ${Math.max(0, 10 - answeredSoalCount)} butir soal lagi`,
      tips: "Buka latihan mandiri pada modul kurikulum bab aljabar atau pythagoras.",
      actionUrl: "#belajar",
      actionLabel: "Mulai Latihan",
    },
    {
      id: "b6",
      title: "Bintang Matematika",
      desc: "Mengumpulkan 1.500+ Poin Belajar dan menyelesaikan minimal 10 sesi kuis/ujian.",
      tier: "Diamond",
      tierColor: "from-purple-500 via-pink-500 to-indigo-600 border-purple-300 text-purple-950 bg-purple-50",
      icon: "👑",
      rewardPoints: 500,
      isUnlocked: learningPoints >= 1500 && completedQuizCount >= 10,
      currentValue: Math.min(learningPoints, 1500),
      targetValue: 1500,
      unit: "XP & Kuis",
      progressPercent: Math.min(
        100,
        Math.round(
          ((Math.min(learningPoints, 1500) / 1500) * 0.7 +
            (Math.min(completedQuizCount, 10) / 10) * 0.3) *
            100
        )
      ),
      progressText: `${completedQuizCount}/10 Kuis • ${learningPoints.toLocaleString("id-ID")}/1.500 XP`,
      remainingText:
        learningPoints >= 1500 && completedQuizCount >= 10
          ? "Lencana Tertinggi Legenda Bintang Matematika Terbuka! 👑"
          : `Butuh ${Math.max(0, 1500 - learningPoints)} poin & ${Math.max(0, 10 - completedQuizCount)} kuis lagi`,
      tips: "Raih nilai tinggi pada PTS dan selesaikan seluruh bab matematika semester ini.",
      actionUrl: "#ruang-ujian",
      actionLabel: "Ke Ruang Ujian",
    },
  ];

  const badges = badgesList && badgesList.length > 0 ? badgesList : defaultBadges;
  const unlockedCount = badges.filter((b) => b.isUnlocked).length;
  const inProgressCount = badges.filter((b) => !b.isUnlocked && b.progressPercent > 0).length;
  const lockedCount = badges.filter((b) => !b.isUnlocked && b.progressPercent === 0).length;

  const totalPointsBonus = badges.reduce((sum, b) => sum + b.rewardPoints, 0);
  const earnedBonus = badges
    .filter((b) => b.isUnlocked)
    .reduce((sum, b) => sum + b.rewardPoints, 0);

  const overallProgressPercent = Math.round(
    (badges.reduce((sum, b) => sum + b.progressPercent, 0) / (badges.length * 100)) * 100
  );

  const filteredBadges = badges.filter((b) => {
    if (filter === "unlocked") return b.isUnlocked;
    if (filter === "in_progress") return !b.isUnlocked && b.progressPercent > 0;
    if (filter === "locked") return !b.isUnlocked && b.progressPercent === 0;
    return true;
  });

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case "Bronze":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "Silver":
        return "bg-slate-100 text-slate-800 border-slate-300";
      case "Gold":
        return "bg-yellow-100 text-yellow-900 border-yellow-300";
      case "Emerald":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "Indigo":
        return "bg-indigo-100 text-indigo-900 border-indigo-300";
      case "Diamond":
        return "bg-purple-100 text-purple-900 border-purple-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const handleActionClick = (badge: StudentBadgeDetail) => {
    if (!onNavigateTab) return;
    if (badge.actionUrl === "#belajar") {
      onNavigateTab("Belajar");
    } else if (badge.actionUrl === "#ruang-ujian") {
      onNavigateTab("Ruang Ujian");
    } else if (badge.actionUrl === "#peringkat") {
      onNavigateTab("Peringkat");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-8 animate-in fade-in duration-200 pb-16">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-black uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Sistem Gamifikasi & Prestasi Real-Time</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <Gift className="w-7 h-7 text-purple-600" />
            <span>Pencapaian & Lencana Siswa</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
            Lencana penghargaan resmi atas konsistensi belajar, pengerjaan kuis, ujian, dan disiplin presensi harian Anda yang terhitung otomatis dari Supabase.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-[#0F172A] text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shrink-0 disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-purple-600" : ""}`} />
            <span>{isLoading ? "Menyinkronkan..." : "Refresh Pencapaian"}</span>
          </button>
        )}
      </div>

      {/* 2. HERO OVERVIEW BANNER */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] p-6 sm:p-8 overflow-hidden border border-purple-950/40 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left Progress Summary */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left w-full lg:w-auto">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/10 border border-white/20 flex flex-col items-center justify-center p-3 shrink-0 shadow-inner backdrop-blur-md">
              <span className="text-3xl sm:text-4xl font-black text-amber-400">
                {overallProgressPercent}%
              </span>
              <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider mt-0.5">
                Pencapaian
              </span>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {unlockedCount} dari {badges.length} Lencana Terbuka
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {unlockedCount === 0
                  ? "Ayo Mulai Petualangan Belajarmu!"
                  : unlockedCount <= 2
                  ? "Awal yang Hebat! Lanjutkan!"
                  : unlockedCount <= 4
                  ? "Pembelajar Tangguh & Berprestasi!"
                  : "Legenda Juara Matematika! 👑"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-lg leading-relaxed">
                Anda telah mengumpulkan total{" "}
                <span className="text-amber-400 font-bold">+{earnedBonus} XP</span> bonus lencana dari total potensi{" "}
                <span className="text-purple-300 font-bold">+{totalPointsBonus} XP</span>.
              </p>
            </div>
          </div>

          {/* Right: 4 Real-time Stat Pills */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold mb-1">
                <Zap className="w-4 h-4" />
                <span>Poin Belajar</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-white">
                {learningPoints.toLocaleString("id-ID")}{" "}
                <span className="text-xs text-slate-400 font-normal">XP</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-orange-400 text-xs font-extrabold mb-1">
                <Flame className="w-4 h-4" />
                <span>Streak Harian</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-white">
                {dailyStreak} <span className="text-xs text-slate-400 font-normal">Hari</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-extrabold mb-1">
                <Trophy className="w-4 h-4" />
                <span>Kuis & Ujian Selesai</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-white">
                {completedQuizCount}{" "}
                <span className="text-xs text-slate-400 font-normal">Sesi</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-extrabold mb-1">
                <Target className="w-4 h-4" />
                <span>Soal Dijawab</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-white">
                {answeredSoalCount}{" "}
                <span className="text-xs text-slate-400 font-normal">Butir</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FILTER TABS */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              filter === "all"
                ? "bg-white text-[#0F172A] shadow-xs"
                : "text-slate-600 hover:text-[#0F172A]"
            }`}
          >
            Semua ({badges.length})
          </button>
          <button
            onClick={() => setFilter("unlocked")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              filter === "unlocked"
                ? "bg-emerald-500 text-white shadow-xs"
                : "text-slate-600 hover:text-[#0F172A]"
            }`}
          >
            <span>Terbuka</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
              {unlockedCount}
            </span>
          </button>
          <button
            onClick={() => setFilter("in_progress")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              filter === "in_progress"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-[#0F172A]"
            }`}
          >
            <span>Sedang Berjalan</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
              {inProgressCount}
            </span>
          </button>
          <button
            onClick={() => setFilter("locked")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              filter === "locked"
                ? "bg-slate-700 text-white shadow-xs"
                : "text-slate-600 hover:text-[#0F172A]"
            }`}
          >
            <span>Terkunci</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
              {lockedCount}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Klik kartu lencana untuk melihat panduan & tips meraihnya</span>
        </div>
      </div>

      {/* 4. BADGE CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBadges.map((badge) => (
          <div
            key={badge.id}
            onClick={() => setSelectedBadge(badge)}
            className={`group rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between space-y-5 cursor-pointer relative overflow-hidden ${
              badge.isUnlocked
                ? "bg-white border-emerald-300 hover:border-emerald-400 shadow-sm hover:shadow-xl ring-2 ring-emerald-400/20"
                : "bg-white border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md"
            }`}
          >
            {/* Top decorative gradient bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
                badge.isUnlocked
                  ? "from-emerald-400 via-teal-400 to-emerald-500"
                  : "from-slate-200 via-slate-300 to-slate-200 group-hover:from-blue-400 group-hover:to-indigo-400"
              }`}
            />

            {/* Header: Icon, Tiers & Status Badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 border shadow-xs transition-transform duration-300 group-hover:scale-105 ${
                    badge.isUnlocked
                      ? "bg-gradient-to-br from-amber-50 to-emerald-50 border-emerald-300"
                      : "bg-slate-100 text-slate-400 border-slate-200"
                  }`}
                >
                  {badge.icon}
                </div>
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border mb-1 ${getTierBadgeStyle(
                      badge.tier
                    )}`}
                  >
                    {badge.tier} Tier
                  </span>
                  <h3 className="text-base font-extrabold text-[#0F172A] group-hover:text-blue-600 transition">
                    {badge.title}
                  </h3>
                </div>
              </div>

              {badge.isUnlocked ? (
                <div className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300 shadow-2xs animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Terbuka ✨</span>
                </div>
              ) : (
                <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-extrabold border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Terkunci</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {badge.desc}
            </p>

            {/* Progress Section */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Progres Lencana</span>
                <span
                  className={`font-black ${
                    badge.isUnlocked ? "text-emerald-700" : "text-slate-800"
                  }`}
                >
                  {badge.progressText} ({badge.progressPercent}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    badge.isUnlocked
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600"
                  }`}
                  style={{ width: `${badge.progressPercent}%` }}
                />
              </div>

              {/* Remaining Info & Reward Chip */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span
                  className={`font-bold truncate max-w-[200px] ${
                    badge.isUnlocked ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {badge.remainingText}
                </span>
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-black text-[10px]">
                  +{badge.rewardPoints} XP
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 5. BADGE DETAIL MODAL */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border ${
                  selectedBadge.isUnlocked
                    ? "bg-gradient-to-br from-amber-50 to-emerald-50 border-emerald-300 shadow-md"
                    : "bg-slate-100 border-slate-300 text-slate-400"
                }`}
              >
                {selectedBadge.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getTierBadgeStyle(
                      selectedBadge.tier
                    )}`}
                  >
                    {selectedBadge.tier} Tier
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black">
                    +{selectedBadge.rewardPoints} XP
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-[#0F172A]">
                  {selectedBadge.title}
                </h3>
              </div>
            </div>

            {/* Status Alert */}
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                selectedBadge.isUnlocked
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <div className="font-extrabold text-sm mb-1 flex items-center gap-1.5">
                {selectedBadge.isUnlocked ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Lencana Ini Telah Berhasil Terbuka!</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Lencana Ini Masih Terkunci</span>
                  </>
                )}
              </div>
              <p className="font-medium text-slate-600">{selectedBadge.desc}</p>
            </div>

            {/* Progress detail */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-[#0F172A]">
                <span>Capaian Saat Ini</span>
                <span>
                  {selectedBadge.progressText} ({selectedBadge.progressPercent}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 border border-slate-200 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    selectedBadge.isUnlocked
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600"
                  }`}
                  style={{ width: `${selectedBadge.progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 font-semibold text-right">
                {selectedBadge.remainingText}
              </p>
            </div>

            {/* Tips Section */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
              <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Tips Membuka Lencana Ini:</span>
              </div>
              <p className="text-xs text-amber-900/90 font-medium leading-relaxed">
                {selectedBadge.tips}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition cursor-pointer"
              >
                Tutup
              </button>
              {selectedBadge.actionLabel && onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    handleActionClick(selectedBadge);
                    setSelectedBadge(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-blue-600 text-white text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <span>{selectedBadge.actionLabel}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
