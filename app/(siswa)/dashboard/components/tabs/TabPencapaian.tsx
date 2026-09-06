"use client";

import { Gift } from "lucide-react";

interface TabPencapaianProps {
  completedQuizCount: number;
  dailyStreak: number;
  learningPoints: number;
  answeredSoalCount: number;
}

export default function TabPencapaian({
  completedQuizCount,
  dailyStreak,
  learningPoints,
  answeredSoalCount,
}: TabPencapaianProps) {
  const studentBadges = [
    {
      id: "b1",
      title: "Langkah Pertama",
      desc: "Menyelesaikan 1 kuis atau latihan pertama.",
      icon: "🚀",
      bgColor: "bg-blue-100 text-blue-700 border-blue-200",
      isUnlocked: completedQuizCount >= 1,
      progressText: `${completedQuizCount}/1 Kuis`,
      progressPercent: Math.min(100, Math.round((completedQuizCount / 1) * 100)),
    },
    {
      id: "b2",
      title: "Master Kuis",
      desc: "Menyelesaikan minimal 5 kuis/latihan.",
      icon: "🏆",
      bgColor: "bg-amber-100 text-amber-700 border-amber-200",
      isUnlocked: completedQuizCount >= 5,
      progressText: `${completedQuizCount}/5 Kuis`,
      progressPercent: Math.min(100, Math.round((completedQuizCount / 5) * 100)),
    },
    {
      id: "b3",
      title: "Pejuang Streak",
      desc: "Kehadiran harian berturut-turut 7 hari.",
      icon: "🔥",
      bgColor: "bg-orange-100 text-orange-700 border-orange-200",
      isUnlocked: dailyStreak >= 7,
      progressText: `${dailyStreak}/7 Hari`,
      progressPercent: Math.min(100, Math.round((dailyStreak / 7) * 100)),
    },
    {
      id: "b4",
      title: "Pembelajar Hebat",
      desc: "Mengumpulkan minimal 1.000 Poin Belajar.",
      icon: "⭐",
      bgColor: "bg-purple-100 text-purple-700 border-purple-200",
      isUnlocked: learningPoints >= 1000,
      progressText: `${learningPoints.toLocaleString("id-ID")}/1.000 Poin`,
      progressPercent: Math.min(100, Math.round((learningPoints / 1000) * 100)),
    },
    {
      id: "b5",
      title: "Penjelajah Soal",
      desc: "Menjawab minimal 10 soal matematika.",
      icon: "🎯",
      bgColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
      isUnlocked: answeredSoalCount >= 10,
      progressText: `${answeredSoalCount}/10 Soal`,
      progressPercent: Math.min(100, Math.round((answeredSoalCount / 10) * 100)),
    },
    {
      id: "b6",
      title: "Bintang Matematika",
      desc: "Mengumpulkan 1.500+ Poin & 10 Kuis.",
      icon: "👑",
      bgColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
      isUnlocked: learningPoints >= 1500 && completedQuizCount >= 10,
      progressText: `${completedQuizCount}/10 Kuis`,
      progressPercent: Math.min(100, Math.round((completedQuizCount / 10) * 100)),
    },
  ];

  const unlockedCount = studentBadges.filter((b) => b.isUnlocked).length;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <Gift className="w-7 h-7 text-purple-600" />
            <span>Pencapaian & Lencana Siswa</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
            Lencana penghargaan atas konsistensi belajar dan penyelesaian kuis Anda.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold shrink-0">
          <span>
            {unlockedCount} dari {studentBadges.length} Lencana Terbuka
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {studentBadges.map((badge) => (
          <div
            key={badge.id}
            className={`saas-card rounded-3xl p-6 border flex flex-col justify-between space-y-4 transition ${
              badge.isUnlocked
                ? "bg-white border-slate-200 shadow-xs"
                : "bg-slate-50/70 border-slate-200/70 opacity-75"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-2xl shrink-0 border ${
                  badge.isUnlocked
                    ? badge.bgColor
                    : "bg-slate-200 text-slate-400 border-slate-300"
                }`}
              >
                {badge.icon}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-[#0F172A]">
                    {badge.title}
                  </h3>
                  {badge.isUnlocked ? (
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      Terbuka ✓
                    </span>
                  ) : (
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold border border-slate-300">
                      Terkunci 🔒
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {badge.desc}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-400">Progres Lencana</span>
                <span
                  className={
                    badge.isUnlocked
                      ? "text-emerald-700 font-extrabold"
                      : "text-slate-600"
                  }
                >
                  {badge.progressText}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    badge.isUnlocked ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${badge.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
