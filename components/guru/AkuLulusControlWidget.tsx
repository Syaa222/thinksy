"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  Clock,
  FileText,
  Radio,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Eye,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";

interface ExamControlItem {
  id: string;
  judul: string;
  tipe: "ulangan" | "ujian";
  mapel: string;
  durasi_menit: number;
  passing_grade: number;
  status: "dipublikasi" | "ditutup" | string;
}

const DEFAULT_ULANGAN_ID = "e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const DEFAULT_UJIAN_ID = "e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

export default function AkuLulusControlWidget() {
  const [exams, setExams] = useState<ExamControlItem[]>([
    {
      id: DEFAULT_ULANGAN_ID,
      judul: "Ulangan Harian 1: Bilangan Berpangkat & Aljabar",
      tipe: "ulangan",
      mapel: "Matematika",
      durasi_menit: 60,
      passing_grade: 75,
      status: "dipublikasi",
    },
    {
      id: DEFAULT_UJIAN_ID,
      judul: "Penilaian Tengah Semester (PTS) Ganjil",
      tipe: "ujian",
      mapel: "Bahasa Inggris",
      durasi_menit: 90,
      passing_grade: 75,
      status: "dipublikasi",
    },
  ]);

  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { broadcastEvent } = useRealtimeDashboard((event) => {
    if (event.type === "EXAM_STATUS_CHANGED" && event.payload) {
      const { ujianId, status } = event.payload;
      setExams((prev) =>
        prev.map((e) => (e.id === ujianId ? { ...e, status } : e))
      );
    }
  });

  // Fetch initial exam statuses from DB
  const loadExams = async () => {
    try {
      const res = await fetch("/api/guru/ujian");
      if (res.ok) {
        const data = await res.json();
        if (data.exams && data.exams.length > 0) {
          setExams((prev) => {
            const apiExams = data.exams as any[];
            const ulanganFromApi = apiExams.find(
              (e) => e.tipe === "ulangan" || e.id === DEFAULT_ULANGAN_ID
            );
            const ujianFromApi = apiExams.find(
              (e) => e.tipe === "ujian" || e.id === DEFAULT_UJIAN_ID
            );

            return [
              ulanganFromApi
                ? {
                    id: ulanganFromApi.id,
                    judul: ulanganFromApi.judul,
                    tipe: "ulangan",
                    mapel: ulanganFromApi.mapel || "Matematika",
                    durasi_menit: ulanganFromApi.durasi_menit || 60,
                    passing_grade: ulanganFromApi.passing_grade || 75,
                    status: ulanganFromApi.status || "dipublikasi",
                  }
                : prev[0],
              ujianFromApi
                ? {
                    id: ujianFromApi.id,
                    judul: ujianFromApi.judul,
                    tipe: "ujian",
                    mapel: ujianFromApi.mapel || "Bahasa Inggris",
                    durasi_menit: ujianFromApi.durasi_menit || 90,
                    passing_grade: ujianFromApi.passing_grade || 75,
                    status: ujianFromApi.status || "dipublikasi",
                  }
                : prev[1],
            ];
          });
        }
      }
    } catch {
      // Fallback to initial local state
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleToggle = async (item: ExamControlItem) => {
    const isCurrentlyOpen = item.status === "dipublikasi";
    const nextStatus = isCurrentlyOpen ? "ditutup" : "dipublikasi";

    setLoadingIds((prev) => ({ ...prev, [item.id]: true }));

    // Optimistic UI update
    setExams((prev) =>
      prev.map((e) => (e.id === item.id ? { ...e, status: nextStatus } : e))
    );

    try {
      const res = await fetch("/api/guru/ujian", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ujianId: item.id, status: nextStatus }),
      });

      if (res.ok) {
        // Broadcast to student dashboard and other teacher tabs
        broadcastEvent("EXAM_STATUS_CHANGED", {
          ujianId: item.id,
          status: nextStatus,
        });

        const label = item.tipe === "ulangan" ? "Ulangan Harian" : "Ujian PTS";
        setToastMessage(
          nextStatus === "dipublikasi"
            ? `✅ Akses ${label} berhasil DIBUKA (ON)! Tombol di dashboard siswa kini aktif.`
            : `🔒 Akses ${label} berhasil DITUTUP (OFF)! Tombol di dashboard siswa dinonaktifkan.`
        );
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        // Revert on failure
        setExams((prev) =>
          prev.map((e) => (e.id === item.id ? { ...e, status: item.status } : e))
        );
        alert("Gagal mengubah status ujian. Silakan coba lagi.");
      }
    } catch (err: any) {
      setExams((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, status: item.status } : e))
      );
      alert("Terjadi kesalahan jaringan: " + err.message);
    } finally {
      setLoadingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const ulanganItem = exams.find((e) => e.tipe === "ulangan") || exams[0];
  const ujianItem = exams.find((e) => e.tipe === "ujian") || exams[1];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6 relative overflow-hidden">
      {/* Subtle top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-amber-500" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center justify-between shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top duration-200">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-3 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-black uppercase tracking-wider mb-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Kontrol Real-Time Asesmen</span>
          </div>
          <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
            Kontrol Asesmen Siswa (AKU LULUS)
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5 max-w-2xl">
            Nyalakan (<strong className="text-emerald-600">ON</strong>) atau matikan (<strong className="text-slate-700">OFF</strong>) tombol pengerjaan Ulangan Harian dan Ujian resmi di Dashboard Siswa secara langsung.
          </p>
        </div>

        <Link
          href="/guru/ujian"
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#0F172A] text-xs font-extrabold flex items-center gap-1.5 transition self-start sm:self-center shrink-0 border border-slate-200 cursor-pointer"
        >
          <span>Kelola Semua Ujian</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </Link>
      </div>

      {/* 2 Assessment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CARD 1: ULANGAN HARIAN */}
        <div
          className={`rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between space-y-4 ${
            ulanganItem.status === "dipublikasi"
              ? "bg-indigo-50/40 border-indigo-200 shadow-xs"
              : "bg-slate-50/70 border-slate-200"
          }`}
        >
          <div className="space-y-3.5">
            {/* Top Bar: Icon + Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                    ulanganItem.status === "dipublikasi"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-[#0F172A] uppercase tracking-wide block">
                    Ulangan Harian
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Mata Pelajaran: {ulanganItem.mapel}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              {ulanganItem.status === "dipublikasi" ? (
                <span className="px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Akses Terbuka (ON)</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-slate-200 border border-slate-300 text-slate-700 text-[10px] font-extrabold uppercase flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Akses Ditutup (OFF)</span>
                </span>
              )}
            </div>

            {/* Exam Title */}
            <div>
              <h3 className="text-sm font-extrabold text-[#0F172A] leading-snug">
                {ulanganItem.judul}
              </h3>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 font-semibold">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ulanganItem.durasi_menit} Menit</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span>KKM: {ulanganItem.passing_grade}</span>
                </div>
                <span>•</span>
                <span className="text-indigo-700 font-bold">10 Soal Terstandar</span>
              </div>
            </div>

            {/* Explanatory Message Box */}
            <div
              className={`p-3 rounded-xl text-xs leading-relaxed font-medium border ${
                ulanganItem.status === "dipublikasi"
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  : "bg-slate-100 border-slate-200 text-slate-600"
              }`}
            >
              {ulanganItem.status === "dipublikasi" ? (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Tombol Siswa Aktif:</strong> Siswa dapat menekan tombol <strong>[Mulai Kerjakan Ulangan]</strong> dan langsung masuk mengerjakan soal.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Tombol Siswa Terkunci:</strong> Akses ulangan dinonaktifkan. Siswa melihat status &quot;Akses Dinonaktifkan oleh Guru&quot;.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Toggle Switch Row */}
          <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleToggle(ulanganItem)}
              disabled={loadingIds[ulanganItem.id]}
              className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 ${
                ulanganItem.status === "dipublikasi"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-800 hover:bg-slate-900 text-white"
              }`}
            >
              {loadingIds[ulanganItem.id] ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : ulanganItem.status === "dipublikasi" ? (
                <Unlock className="w-4 h-4 text-emerald-200" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {loadingIds[ulanganItem.id]
                  ? "Menyimpan..."
                  : ulanganItem.status === "dipublikasi"
                  ? "Akses Siswa: ON (Klik untuk Tutup)"
                  : "Akses Siswa: OFF (Klik untuk Buka)"}
              </span>
            </button>

            <Link
              href={`/guru/ujian/${ulanganItem.id}/live`}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 transition"
              title="Pantau Siswa Sedang Mengerjakan Secara Real-Time"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Monitor</span>
            </Link>
          </div>
        </div>

        {/* CARD 2: UJIAN RESMI (PTS) */}
        <div
          className={`rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between space-y-4 ${
            ujianItem.status === "dipublikasi"
              ? "bg-blue-50/40 border-blue-200 shadow-xs"
              : "bg-slate-50/70 border-slate-200"
          }`}
        >
          <div className="space-y-3.5">
            {/* Top Bar: Icon + Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                    ujianItem.status === "dipublikasi"
                      ? "bg-[#0F172A] text-white shadow-xs"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  <Clock className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div>
                  <span className="text-xs font-black text-[#0F172A] uppercase tracking-wide block">
                    Ujian Resmi (PTS)
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Mata Pelajaran: {ujianItem.mapel}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              {ujianItem.status === "dipublikasi" ? (
                <span className="px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Akses Terbuka (ON)</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-slate-200 border border-slate-300 text-slate-700 text-[10px] font-extrabold uppercase flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Akses Ditutup (OFF)</span>
                </span>
              )}
            </div>

            {/* Exam Title */}
            <div>
              <h3 className="text-sm font-extrabold text-[#0F172A] leading-snug">
                {ujianItem.judul}
              </h3>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 font-semibold">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ujianItem.durasi_menit} Menit</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span>KKM: {ujianItem.passing_grade}</span>
                </div>
                <span>•</span>
                <span className="text-blue-700 font-bold">10 Soal Terstandar</span>
              </div>
            </div>

            {/* Explanatory Message Box */}
            <div
              className={`p-3 rounded-xl text-xs leading-relaxed font-medium border ${
                ujianItem.status === "dipublikasi"
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  : "bg-slate-100 border-slate-200 text-slate-600"
              }`}
            >
              {ujianItem.status === "dipublikasi" ? (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Tombol Siswa Aktif:</strong> Siswa dapat menekan tombol <strong>[Mulai Kerjakan Ujian]</strong> dan langsung masuk mengerjakan soal PTS.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Tombol Siswa Terkunci:</strong> Akses PTS dinonaktifkan. Siswa melihat status &quot;Akses Dinonaktifkan oleh Guru&quot;.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Toggle Switch Row */}
          <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleToggle(ujianItem)}
              disabled={loadingIds[ujianItem.id]}
              className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 ${
                ujianItem.status === "dipublikasi"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-800 hover:bg-slate-900 text-white"
              }`}
            >
              {loadingIds[ujianItem.id] ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : ujianItem.status === "dipublikasi" ? (
                <Unlock className="w-4 h-4 text-emerald-200" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {loadingIds[ujianItem.id]
                  ? "Menyimpan..."
                  : ujianItem.status === "dipublikasi"
                  ? "Akses Siswa: ON (Klik untuk Tutup)"
                  : "Akses Siswa: OFF (Klik untuk Buka)"}
              </span>
            </button>

            <Link
              href={`/guru/ujian/${ujianItem.id}/live`}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 transition"
              title="Pantau Siswa Sedang Mengerjakan Secara Real-Time"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Monitor</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
