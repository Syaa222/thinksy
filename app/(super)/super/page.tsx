"use client";

import { useState, useEffect, useCallback } from "react";
import { logoutAction } from "../../(auth)/actions";
import {
  Building,
  UserCog,
  DollarSign,
  LogOut,
  Bell,
  Search,
  Plus,
  Sparkles,
  LayoutDashboard,
  ArrowRight,
  Server,
  Database,
  Zap,
  Users,
  Loader2,
  Filter,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface TenantBreakdown {
  id: string;
  nama: string;
  npsn: string;
  alamat: string;
  dibuat_pada: string;
  adminCount: number;
  guruCount: number;
  siswaCount: number;
  kelasCount: number;
}

export default function SuperAdminDashboard() {
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSekolah: 0,
    totalAdmin: 0,
    totalGuru: 0,
    totalSiswa: 0,
    totalKelas: 0,
    totalBiayaUSD: 0,
    tenantBreakdown: [] as TenantBreakdown[],
    auditLogs: [] as any[],
  });

  const [searchQuery, setSearchQuery] = useState("");

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/super/metrics", window.location.origin);
      if (selectedTenant && selectedTenant !== "all") {
        url.searchParams.set("sekolah_id", selectedTenant);
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const filteredTenants = metrics.tenantBreakdown.filter(
    (t) =>
      t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.npsn.includes(searchQuery) ||
      t.alamat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white font-sans flex flex-col">
      {/* 1. TOP HEADER BAR */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800/80 shadow-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/super" className="flex items-center space-x-3 group">
              <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition duration-200 bg-white flex items-center justify-center border border-slate-700 p-0.5">
                <img src="/logo.png" alt="THINKSY Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                THINKSY{" "}
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider ml-1 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  Super Admin Multi-Tenant
                </span>
              </span>
            </Link>
          </div>

          {/* Tenant Switcher Selector */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl">
            <Filter className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-400">Filter Tenant:</span>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">
                🌐 Semua Tenant (Global)
              </option>
              {metrics.tenantBreakdown.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  🏫 {t.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            <button className="relative p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer backdrop-blur-sm">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#0F172A] animate-pulse" />
            </button>

            <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 p-1.5 pr-3 rounded-xl backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
                SA
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-extrabold text-white truncate max-w-[120px]">
                  Super Admin
                </div>
                <div className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">
                  super@thinksy.ai
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT */}
      <div className="flex-1 flex mx-auto w-full max-w-7xl">
        {/* LEFT SIDEBAR */}
        <aside className="w-64 border-r border-slate-800/60 bg-[#0F172A]/60 p-5 flex flex-col justify-between hidden md:flex shrink-0 backdrop-blur-sm">
          <nav className="space-y-1.5">
            <Link
              href="/super"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold bg-amber-500 text-slate-950 shadow-md"
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Global Overview</span>
              </div>
            </Link>

            <Link
              href="/super/sekolah"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-slate-400 hover:bg-slate-800/50 hover:text-white transition"
            >
              <Building className="w-4 h-4" />
              <span>Tenant / Sekolah ({metrics.totalSekolah})</span>
            </Link>

            <Link
              href="/super/admin-sekolah"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-slate-400 hover:bg-slate-800/50 hover:text-white transition"
            >
              <UserCog className="w-4 h-4" />
              <span>Admin Sekolah ({metrics.totalAdmin})</span>
            </Link>
          </nav>

          <form action={logoutAction} className="pt-6 border-t border-slate-800/60">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 text-xs font-extrabold text-red-400 bg-red-500/10 hover:bg-red-500/20 py-2.5 px-4 rounded-xl border border-red-500/20 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Akun</span>
            </button>
          </form>
        </aside>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto">
          {/* WELCOME BANNER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Pusat Kontrol Super Admin Multi-Tenant
              </h1>
              <p className="text-sm text-slate-400 font-medium mt-1">
                Kelola seluruh institusi sekolah, alokasikan Admin Sekolah, dan pantau sumber daya platform.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4" />
              <span>Multi-Tenant Controller</span>
            </div>
          </div>

          {/* STAT WIDGETS — REALTIME MULTI-TENANT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="group bg-slate-800/40 rounded-2xl border border-slate-700/50 p-5 hover:border-blue-500/30 transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Building className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
                  Tenant
                </span>
              </div>
              <span className="text-3xl font-extrabold text-white">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : metrics.totalSekolah}
              </span>
              <div className="text-[11px] text-slate-400 font-semibold mt-1">Total Institusi Sekolah</div>
            </div>

            <div className="group bg-slate-800/40 rounded-2xl border border-slate-700/50 p-5 hover:border-amber-500/30 transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UserCog className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              </div>
              <span className="text-3xl font-extrabold text-white">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : metrics.totalAdmin}
              </span>
              <div className="text-[11px] text-slate-400 font-semibold mt-1">Admin Sekolah Teralokasi</div>
            </div>

            <div className="group bg-slate-800/40 rounded-2xl border border-slate-700/50 p-5 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
                  Pengguna
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : metrics.totalGuru + metrics.totalSiswa}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-semibold mt-1">
                {metrics.totalGuru} Guru · {metrics.totalSiswa} Siswa
              </div>
            </div>

            <div className="group bg-slate-800/40 rounded-2xl border border-slate-700/50 p-5 hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
                  Penggunaan AI
                </span>
              </div>
              <span className="text-3xl font-extrabold text-emerald-400">
                ${metrics.totalBiayaUSD.toFixed(4)}
              </span>
              <div className="text-[11px] text-slate-400 font-semibold mt-1">Total Biaya API AI</div>
            </div>
          </div>

          {/* HERO CONTROL CONTAINER */}
          <section className="relative bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 rounded-2xl p-6 sm:p-8 border border-slate-700/50 overflow-hidden backdrop-blur-sm">
            <div className="relative space-y-5">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Manajemen Multi-Tenant
                </div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Infrastruktur Multi-Sekolah Terintegrasi
                </h2>
                <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-xl">
                  Daftarkan tenant sekolah baru, kelola dan alokasikan akun Admin Sekolah, atau pantau data terisolasi untuk tiap-tiap institusi.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/super/sekolah"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Registrasi Tenant Sekolah
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/super/admin-sekolah"
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition flex items-center gap-2 backdrop-blur-sm"
                >
                  <UserCog className="w-4 h-4 text-amber-400" />
                  Kelola Admin Sekolah
                </Link>
              </div>
            </div>
          </section>

          {/* TENANT BREAKDOWN TABLE */}
          <section className="bg-slate-800/20 rounded-2xl border border-slate-700/40 overflow-hidden backdrop-blur-sm space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                Daftar Tenant Sekolah Terdaftar
              </h3>
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari sekolah..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs font-medium text-white focus:outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> Memuat data tenant...
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada tenant sekolah terdaftar. Gunakan tombol &quot;Registrasi Tenant Sekolah&quot; di atas.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-700/50">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 border-b border-slate-700/60 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">NAMA SEKOLAH</th>
                      <th className="px-4 py-3.5">NPSN</th>
                      <th className="px-4 py-3.5">ADMIN SEKOLAH</th>
                      <th className="px-4 py-3.5">GURU</th>
                      <th className="px-4 py-3.5">SISWA</th>
                      <th className="px-4 py-3.5">KELAS</th>
                      <th className="px-4 py-3.5 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredTenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-extrabold text-xs text-blue-400 shrink-0">
                            {t.nama[0]}
                          </div>
                          <div>
                            <div className="font-extrabold text-white">{t.nama}</div>
                            <div className="text-[11px] text-slate-500">{t.alamat}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-400">{t.npsn}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-extrabold text-[10px]">
                            {t.adminCount} Admin
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-300">{t.guruCount} Guru</td>
                        <td className="px-4 py-3.5 font-bold text-slate-300">{t.siswaCount} Siswa</td>
                        <td className="px-4 py-3.5 font-bold text-slate-300">{t.kelasCount} Kelas</td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            href="/super/sekolah"
                            className="text-xs font-extrabold text-amber-400 hover:underline"
                          >
                            Kelola Tenant →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* SYSTEM AUDIT LOG & ACTIVITY FEED */}
          <section className="bg-slate-800/20 rounded-2xl border border-slate-700/40 overflow-hidden backdrop-blur-sm space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Aktivitas & Log Audit Sistem Real-Time
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Feed
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> Memuat log aktivitas...
              </div>
            ) : !metrics.auditLogs || metrics.auditLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Belum ada aktivitas baru tercatat di audit log.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 font-medium">
                {metrics.auditLogs.map((log: any) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold shrink-0 mt-0.5">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white">
                            {log.actor?.nama_lengkap || "Pengguna"}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {log.role}
                          </span>
                        </div>
                        <p className="text-slate-400 mt-0.5">
                          Melakukan aksi <code className="text-emerald-400 font-mono">{log.aksi}</code> pada resource{" "}
                          <span className="text-slate-300 font-semibold">{log.target_resource}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 shrink-0 font-mono">
                      {new Date(log.dibuat_pada).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
