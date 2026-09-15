"use client";

import { Trophy, RefreshCw, Shield, Loader2, Flame, Award, Sparkles, Crown } from "lucide-react";
import { LeaderboardStudent } from "../../types";

interface TabPeringkatProps {
  leaderboardList: LeaderboardStudent[];
  isLoadingLeaderboard: boolean;
  onRefreshLeaderboard: () => void;
}

export default function TabPeringkat({
  leaderboardList,
  isLoadingLeaderboard,
  onRefreshLeaderboard,
}: TabPeringkatProps) {
  const top1 = leaderboardList[0] || null;
  const top2 = leaderboardList[1] || null;
  const top3 = leaderboardList[2] || null;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-8 animate-in fade-in duration-200 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-black uppercase tracking-wider mb-1">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Papan Peringkat Real-Time</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <span>Peringkat Siswa Per Sekolah</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
            Peringkat diperbarui secara real-time berdasarkan akumulasi total Poin Belajar siswa yang tercatat di database Supabase.
          </p>
        </div>

        <button
          onClick={onRefreshLeaderboard}
          disabled={isLoadingLeaderboard}
          className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-[#0F172A] text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              isLoadingLeaderboard ? "animate-spin text-amber-500" : ""
            }`}
          />
          <span>Refresh Peringkat</span>
        </button>
      </div>

      {/* TOP 3 PODIUM CARDS (If at least 3 students exist) */}
      {!isLoadingLeaderboard && leaderboardList.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
          {/* Rank 2 (Silver) */}
          {top2 && (
            <div
              className={`rounded-3xl p-5 border transition-all relative flex flex-col items-center text-center space-y-3 order-2 md:order-1 ${
                top2.isCurrentUser
                  ? "bg-slate-50 border-slate-300 ring-2 ring-blue-500/20"
                  : "bg-white border-slate-200 shadow-2xs"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-black text-xl shadow-xs">
                🥈
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Peringkat 2
                </span>
                <h3 className="text-sm font-extrabold text-[#0F172A] flex items-center justify-center gap-1.5 mt-0.5">
                  <span>{top2.name}</span>
                  {top2.isCurrentUser && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[9px] font-black">
                      Anda
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">{top2.school}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 w-full flex items-center justify-between text-xs px-2">
                <span className="inline-flex items-center gap-1 text-orange-600 font-extrabold text-[11px]">
                  <Flame className="w-3.5 h-3.5" /> {top2.streak} Hari
                </span>
                <span className="font-black text-slate-800">
                  {top2.points.toLocaleString("id-ID")} XP
                </span>
              </div>
            </div>
          )}

          {/* Rank 1 (Gold - Center & Highlighted) */}
          {top1 && (
            <div
              className={`rounded-3xl p-6 border-2 transition-all relative flex flex-col items-center text-center space-y-3 order-1 md:order-2 shadow-md ${
                top1.isCurrentUser
                  ? "bg-amber-50/80 border-amber-400 ring-4 ring-amber-400/20"
                  : "bg-gradient-to-b from-amber-50/40 via-white to-amber-50/30 border-amber-300"
              }`}
            >
              <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Crown className="w-3 h-3 text-amber-950" />
                <span>Puncak Prestasi</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-3xl shadow-md border-2 border-amber-300">
                👑
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-amber-700 tracking-wider">
                  Juara 1 Sekolah
                </span>
                <h3 className="text-base font-black text-[#0F172A] flex items-center justify-center gap-1.5 mt-0.5">
                  <span>{top1.name}</span>
                  {top1.isCurrentUser && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      Akun Anda
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">{top1.school}</p>
              </div>
              <div className="pt-2 border-t border-amber-200/60 w-full flex items-center justify-between text-xs px-3">
                <span className="inline-flex items-center gap-1 text-orange-600 font-black text-xs">
                  <Flame className="w-4 h-4 text-orange-500" /> {top1.streak} Hari
                </span>
                <span className="font-black text-amber-600 text-sm">
                  {top1.points.toLocaleString("id-ID")} Poin
                </span>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3 && (
            <div
              className={`rounded-3xl p-5 border transition-all relative flex flex-col items-center text-center space-y-3 order-3 ${
                top3.isCurrentUser
                  ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20"
                  : "bg-white border-slate-200 shadow-2xs"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100/70 border border-amber-300 text-amber-900 flex items-center justify-center font-black text-xl shadow-xs">
                🥉
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  Peringkat 3
                </span>
                <h3 className="text-sm font-extrabold text-[#0F172A] flex items-center justify-center gap-1.5 mt-0.5">
                  <span>{top3.name}</span>
                  {top3.isCurrentUser && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[9px] font-black">
                      Anda
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">{top3.school}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 w-full flex items-center justify-between text-xs px-2">
                <span className="inline-flex items-center gap-1 text-orange-600 font-extrabold text-[11px]">
                  <Flame className="w-3.5 h-3.5" /> {top3.streak} Hari
                </span>
                <span className="font-black text-slate-800">
                  {top3.points.toLocaleString("id-ID")} XP
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FULL LEADERBOARD CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Daftar Siswa Berprestasi (Berdasarkan Poin Belajar)</span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {leaderboardList.length} Siswa Terdaftar
          </span>
        </div>

        {isLoadingLeaderboard ? (
          <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            <span>Memuat data peringkat siswa secara real-time...</span>
          </div>
        ) : leaderboardList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 space-y-3">
            <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600">Belum ada data siswa di papan peringkat.</p>
            <button
              onClick={onRefreshLeaderboard}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Segarkan Data
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Peringkat</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Sekolah</th>
                  <th className="py-3 px-4 text-center">Daily Streak</th>
                  <th className="py-3 px-4 text-right">Total Poin Belajar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {leaderboardList.map((st) => (
                  <tr
                    key={st.id}
                    className={`transition hover:bg-slate-50/80 ${
                      st.isCurrentUser
                        ? "bg-amber-50/80 font-bold border-l-4 border-l-amber-500"
                        : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-black">
                      {st.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-xs">
                          👑 1
                        </span>
                      ) : st.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black text-xs">
                          🥈 2
                        </span>
                      ) : st.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-900 font-black text-xs">
                          🥉 3
                        </span>
                      ) : (
                        <span className="text-slate-500 font-bold pl-2">
                          #{st.rank}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                      <div className="flex items-center gap-2">
                        <span>{st.name}</span>
                        {st.isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black">
                            Akun Anda
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{st.school}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 font-extrabold text-[10px]">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span>{st.streak} Hari</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-[#0F172A]">
                      <span className="text-amber-600 text-sm">
                        {st.points.toLocaleString("id-ID")}
                      </span>{" "}
                      Poin
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
