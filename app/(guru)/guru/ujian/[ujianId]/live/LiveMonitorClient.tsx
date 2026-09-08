"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Radio,
  Users,
  CheckCircle2,
  Clock,
  Award,
  Search,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface StudentItem {
  id: string;
  nama_lengkap: string;
  email: string;
}

interface SesiItem {
  id: string;
  siswa_id: string;
  status: string;
  nilai_akhir?: number;
  server_start_time: string;
  server_end_time: string;
  dikumpulkan_pada?: string;
}

interface UjianData {
  id: string;
  judul: string;
  mapel: string;
  durasi_menit: number;
  passing_grade: number;
  status: string;
}

interface LiveMonitorClientProps {
  ujian: UjianData;
  initialStudents: StudentItem[];
  initialSessions: SesiItem[];
}

export default function LiveMonitorClient({
  ujian,
  initialStudents,
  initialSessions,
}: LiveMonitorClientProps) {
  const [sessions, setSessions] = useState<SesiItem[]>(initialSessions);
  const [students, setStudents] = useState<StudentItem[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "sedang" | "selesai" | "belum">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Supabase Realtime WebSocket Subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`live-exam-${ujian.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sesi_ujian",
          filter: `ujian_id=eq.${ujian.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSessions((prev) => [...prev, payload.new as SesiItem]);
          } else if (payload.eventType === "UPDATE") {
            setSessions((prev) =>
              prev.map((s) => (s.id === payload.new.id ? (payload.new as SesiItem) : s))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ujian.id]);

  // 2. Fetch fresh data manually
  const fetchFreshData = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/guru/ujian/${ujian.id}/live`);
      if (res.ok) {
        const data = await res.json();
        if (data.students) {
          // Sync sessions from student rows
        }
      }
    } catch {} finally {
      setIsRefreshing(false);
    }
  };

  // Map students with their session status
  const studentRows = useMemo(() => {
    const sessionMap = new Map(sessions.map((s) => [s.siswa_id, s]));
    const now = new Date();

    return students.map((st) => {
      const sess = sessionMap.get(st.id);
      let status: "belum_mulai" | "sedang_mengerjakan" | "selesai" | "habis_waktu" = "belum_mulai";
      let score = null;
      let elapsedMins = 0;

      if (sess) {
        status = sess.status as any;
        score = sess.nilai_akhir ?? null;

        if (sess.server_start_time) {
          const startTime = new Date(sess.server_start_time);
          elapsedMins = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60)));
        }
      }

      return {
        id: st.id,
        name: st.nama_lengkap || "Siswa",
        email: st.email,
        status,
        score,
        elapsedMins,
        isPassed: score !== null && score >= ujian.passing_grade,
      };
    });
  }, [students, sessions, ujian.passing_grade]);

  // Stats
  const countSelesai = studentRows.filter((r) => r.status === "selesai" || r.status === "habis_waktu").length;
  const countSedang = studentRows.filter((r) => r.status === "sedang_mengerjakan").length;
  const countBelum = studentRows.filter((r) => r.status === "belum_mulai").length;
  const passedCount = studentRows.filter((r) => r.isPassed).length;

  const totalScore = studentRows.reduce((acc, r) => acc + (r.score || 0), 0);
  const avgScore = countSelesai > 0 ? Math.round(totalScore / countSelesai) : 0;

  // Filtered rows
  const filteredRows = studentRows.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === "sedang") return r.status === "sedang_mengerjakan";
    if (filterStatus === "selesai") return r.status === "selesai" || r.status === "habis_waktu";
    if (filterStatus === "belum") return r.status === "belum_mulai";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/guru/ujian"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Ujian</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-black">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-ping" />
            <span>Realtime Live Monitor Aktif</span>
          </div>

          <button
            onClick={fetchFreshData}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Banner Summary */}
      <div className="saas-card rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 inline-block mb-1.5">
              {ujian.mapel} • Durasi: {ujian.durasi_menit} Menit • KKM: {ujian.passing_grade}
            </span>
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">{ujian.judul}</h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Pengawasan Waktu Server Otomatis</span>
          </div>
        </div>

        {/* Real-time Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-800 uppercase">Live Mengerjakan</span>
              <Radio className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950">{countSedang} Siswa</div>
            <div className="text-[10px] text-emerald-700 font-medium">Sedang aktif di lembar ujian</div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-blue-800 uppercase">Selesai Dikumpulkan</span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-950">{countSelesai} Siswa</div>
            <div className="text-[10px] text-blue-700 font-medium">
              {Math.round((countSelesai / (students.length || 1)) * 100)}% dari total kelas
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-600 uppercase">Belum Memulai</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900">{countBelum} Siswa</div>
            <div className="text-[10px] text-slate-500 font-medium">Belum membuka ruang ujian</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-800 uppercase">Rata-Rata Nilai</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-950">{avgScore} Poin</div>
            <div className="text-[10px] text-amber-700 font-medium">
              {passedCount} Siswa memenuhi KKM ({ujian.passing_grade})
            </div>
          </div>
        </div>
      </div>

      {/* Student List Monitor Table */}
      <div className="saas-card rounded-3xl p-6 bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa atau email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterStatus === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
              }`}
            >
              Semua ({studentRows.length})
            </button>
            <button
              onClick={() => setFilterStatus("sedang")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterStatus === "sedang" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600"
              }`}
            >
              Sedang ({countSedang})
            </button>
            <button
              onClick={() => setFilterStatus("selesai")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterStatus === "selesai" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-600"
              }`}
            >
              Selesai ({countSelesai})
            </button>
            <button
              onClick={() => setFilterStatus("belum")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterStatus === "belum" ? "bg-slate-700 text-white shadow-2xs" : "text-slate-600"
              }`}
            >
              Belum ({countBelum})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">Nama Siswa</th>
                <th className="p-3.5">Status Pengerjaan</th>
                <th className="p-3.5">Waktu Berjalan</th>
                <th className="p-3.5">Nilai Akhir</th>
                <th className="p-3.5 pr-5 text-right">Status KKM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    Tidak ada siswa yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 pl-5 font-bold text-slate-900">
                      <div>{st.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{st.email}</div>
                    </td>
                    <td className="p-3.5">
                      {st.status === "sedang_mengerjakan" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] animate-pulse">
                          <Radio className="w-3 h-3 text-emerald-600" />
                          <span>Sedang Mengerjakan</span>
                        </span>
                      ) : st.status === "selesai" || st.status === "habis_waktu" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          <span>Selesai Dikumpulkan</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                          <span>Belum Memulai</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-medium text-slate-600">
                      {st.status === "sedang_mengerjakan" ? (
                        <span className="font-bold text-emerald-700">{st.elapsedMins} Menit</span>
                      ) : st.status === "selesai" ? (
                        <span>Telah Selesai</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {st.score !== null ? (
                        <span className="text-sm font-black text-[#0F172A]">{st.score}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      {st.score !== null ? (
                        st.isPassed ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-[10px]">
                            LULUS
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-black text-[10px]">
                            REMEDIAL
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
