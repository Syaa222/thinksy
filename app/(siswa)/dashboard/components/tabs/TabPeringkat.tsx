"use client";

import { Trophy, RefreshCw, Shield, Loader2, Flame } from "lucide-react";
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
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-500" />
            <span>Peringkat Siswa Per Sekolah</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
            Peringkat diperbarui secara real-time berdasarkan total Poin Belajar siswa di lingkungan sekolah yang sama.
          </p>
        </div>

        <button
          onClick={onRefreshLeaderboard}
          className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-[#0F172A] text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shrink-0"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              isLoadingLeaderboard ? "animate-spin text-amber-500" : ""
            }`}
          />
          <span>Refresh Peringkat</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Daftar Siswa Berprestasi (Khusus Akun Siswa)</span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {leaderboardList.length} Siswa Terdaftar
          </span>
        </div>

        {isLoadingLeaderboard ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            <span>Memuat data peringkat siswa...</span>
          </div>
        ) : leaderboardList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Belum ada data siswa di papan peringkat.
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
                    <td className="py-3.5 px-4">
                      {st.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-extrabold text-xs shadow-xs">
                          👑 1
                        </span>
                      ) : st.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-extrabold text-xs">
                          🥈 2
                        </span>
                      ) : st.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-900 font-extrabold text-xs">
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
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
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
                      <span className="text-amber-600">
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
