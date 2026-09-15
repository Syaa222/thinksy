"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Flame,
  Search,
  RefreshCw,
  Award,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  ChevronRight,
  ShieldCheck,
  Plus,
  Loader2,
  Clock,
} from "lucide-react";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";

interface StudentActivityItem {
  rank: number;
  id: string;
  name: string;
  email: string;
  nis: string;
  class: string;
  points: number;
  streak: number;
  statusKeaktifan: "Sangat Aktif" | "Aktif" | "Perlu Perhatian";
  attendanceToday: string;
  attendanceTime: string | null;
  school: string;
}

export default function StudentLeaderboardWidget() {
  const [students, setStudents] = useState<StudentActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "top5" | "struggling">("all");
  const [rewardingStudentId, setRewardingStudentId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { broadcastEvent } = useRealtimeDashboard((event) => {
    if (
      event.type === "POINTS_UPDATED" ||
      event.type === "ATTENDANCE_CHECKIN" ||
      event.type === "ATTENDANCE_VERIFIED"
    ) {
      loadStudentLeaderboard();
    }
  });

  const loadStudentLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/guru/keaktifan");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.students)) {
          setStudents(data.students);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudentLeaderboard();
  }, []);

  const handleGivePoints = async (st: StudentActivityItem, bonusPoints: number = 10) => {
    setRewardingStudentId(st.id);
    try {
      const res = await fetch("/api/guru/keaktifan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siswaId: st.id,
          points: bonusPoints,
          reason: "Apresiasi Keaktifan Belajar oleh Guru",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Optimistic UI update
        setStudents((prev) =>
          prev
            .map((s) =>
              s.id === st.id ? { ...s, points: data.poinTotal || s.points + bonusPoints } : s
            )
            .sort((a, b) => b.points - a.points)
            .map((s, idx) => ({ ...s, rank: idx + 1 }))
        );

        broadcastEvent("POINTS_UPDATED", {
          siswaId: st.id,
          newPoin: data.poinTotal,
        });

        setToastMessage(
          `✨ Berhasil memberikan +${bonusPoints} Poin Apresiasi kepada ${st.name}!`
        );
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert("Gagal memberikan poin. Silakan coba lagi.");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setRewardingStudentId(null);
    }
  };

  const filteredStudents = useMemo(() => {
    let list = students.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery)
    );

    if (filterType === "top5") {
      list = list.slice(0, 5);
    } else if (filterType === "struggling") {
      list = list.filter((s) => s.statusKeaktifan === "Perlu Perhatian");
    }

    return list;
  }, [students, searchQuery, filterType]);

  const topStudent = students[0] || null;
  const totalStudents = students.length;
  const veryActiveCount = students.filter((s) => s.statusKeaktifan === "Sangat Aktif").length;
  const avgPoints =
    totalStudents > 0
      ? Math.round(students.reduce((acc, s) => acc + s.points, 0) / totalStudents)
      : 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6 relative overflow-hidden">
      {/* Top Gradient Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-600" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-[#0F172A] text-white text-xs font-bold flex items-center justify-between shadow-xl border border-amber-500/40 animate-in fade-in slide-in-from-top duration-200">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-3 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-black uppercase tracking-wider mb-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Papan Peringkat & Keaktifan Real-Time</span>
          </div>
          <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
            Papan Peringkat & Keaktifan Siswa
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5 max-w-2xl">
            Pantau perolehan poin belajar, daily streak, serta tingkat keaktifan siswa yang terintegrasi langsung dengan database Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={loadStudentLeaderboard}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition border border-slate-200 cursor-pointer disabled:opacity-50"
            title="Muat Ulang Data Peringkat dari Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-500" : ""}`} />
            <span>Refresh Peringkat</span>
          </button>

          <Link
            href="/guru/siswa"
            className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <span>Kelola Siswa</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Highlight Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Top Ranked */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[10px] font-black uppercase tracking-wider">Juara 1 Peringkat</span>
            <Trophy className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-base font-black text-[#0F172A] truncate">
            {topStudent ? topStudent.name : "—"}
          </div>
          <div className="text-[11px] font-extrabold text-amber-700">
            {topStudent ? `${topStudent.points.toLocaleString("id-ID")} Poin Belajar` : "0 Poin"}
          </div>
        </div>

        {/* Metric 2: Total Siswa */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Siswa</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-xl font-black text-[#0F172A]">{totalStudents}</div>
          <div className="text-[11px] font-semibold text-slate-500">Siswa Terdaftar di Supabase</div>
        </div>

        {/* Metric 3: Sangat Aktif */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-black uppercase tracking-wider">Sangat Aktif</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-900">{veryActiveCount} Siswa</div>
          <div className="text-[11px] font-semibold text-emerald-700">Poin &gt;= 100 XP</div>
        </div>

        {/* Metric 4: Rata-Rata Poin */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1">
          <div className="flex items-center justify-between text-indigo-800">
            <span className="text-[10px] font-black uppercase tracking-wider">Rata-Rata Poin</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-indigo-950">{avgPoints} Poin</div>
          <div className="text-[11px] font-semibold text-indigo-700">Skor Gamifikasi Kelas</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              filterType === "all"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua Siswa ({totalStudents})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("top5")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              filterType === "top5"
                ? "bg-amber-500 text-slate-950 shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Top 5 Berprestasi 👑
          </button>
          <button
            type="button"
            onClick={() => setFilterType("struggling")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              filterType === "struggling"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Perlu Perhatian (0 Poin)
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau kelas siswa..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            <span>Memuat data peringkat siswa dari Supabase...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            Tidak ada data siswa yang cocok dengan pencarian atau filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Peringkat</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4 text-center">Daily Streak</th>
                  <th className="py-3 px-4 text-right">Poin Belajar</th>
                  <th className="py-3 px-4 text-center">Status Keaktifan</th>
                  <th className="py-3 px-4 text-center">Aksi Guru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.map((st) => (
                  <tr
                    key={st.id}
                    className="hover:bg-slate-50/80 transition group"
                  >
                    {/* Rank Badge */}
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
                        <span className="text-slate-500 pl-2 font-bold">#{st.rank}</span>
                      )}
                    </td>

                    {/* Name + Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-[#0F172A] flex items-center gap-2">
                        <span>{st.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        NIS: {st.nis}
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-[10px] border border-slate-200">
                        {st.class}
                      </span>
                    </td>

                    {/* Daily Streak */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-extrabold text-[10px]">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span>{st.streak} Hari</span>
                      </span>
                    </td>

                    {/* Poin Belajar */}
                    <td className="py-3.5 px-4 text-right font-black">
                      <span className="text-amber-600 text-sm">
                        {st.points.toLocaleString("id-ID")}
                      </span>{" "}
                      <span className="text-slate-400 text-[10px]">XP</span>
                    </td>

                    {/* Keaktifan Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {st.statusKeaktifan === "Sangat Aktif" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Sangat Aktif</span>
                        </span>
                      ) : st.statusKeaktifan === "Aktif" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-semibold">
                          <span>Perlu Dorongan</span>
                        </span>
                      )}
                    </td>

                    {/* Action: Give Reward Points */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleGivePoints(st, 10)}
                        disabled={rewardingStudentId === st.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black transition cursor-pointer shadow-2xs disabled:opacity-50"
                        title="Beri bonus apresiasi 10 poin ke akun siswa ini"
                      >
                        {rewardingStudentId === st.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                        ) : (
                          <Plus className="w-3 h-3 text-amber-600" />
                        )}
                        <span>+10 Poin</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
