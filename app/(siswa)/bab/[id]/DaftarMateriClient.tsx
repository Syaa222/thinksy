"use client";

import { useState } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  BookOpen,
  CheckCircle2,
  Clock,
  ChevronRight,
  FileText,
  Sparkles,
  HelpCircle,
  Award,
  PlayCircle,
  Check,
  List,
} from "lucide-react";
import Link from "next/link";
import DigitalJournalReader from "@/components/journal/DigitalJournalReader";

interface MateriItem {
  id: string;
  judul: string;
  urutan: number;
  konten?: string;
  konten_markdown?: string;
}

interface DaftarMateriClientProps {
  babId: string;
  judulBab: string;
  deskripsiBab: string;
  urutanBab: number;
  listMateri: MateriItem[];
  initialMateriId?: string;
  chapterProgressPercent?: number;
  answeredCount?: number;
  totalSoalCount?: number;
}

export default function DaftarMateriClient({
  babId,
  judulBab,
  deskripsiBab,
  urutanBab,
  listMateri,
  initialMateriId,
  chapterProgressPercent = 0,
  answeredCount = 0,
  totalSoalCount = 0,
}: DaftarMateriClientProps) {
  // If a specific materiId is selected, show Detail Materi Reading view (image_71b8f5.png)
  const [selectedMateriId, setSelectedMateriId] = useState<string | null>(
    initialMateriId || null
  );

  const selectedMateri = listMateri.find((m) => m.id === selectedMateriId);

  const displayModules =
    listMateri.length > 0
      ? listMateri.map((m, idx) => ({
          id: m.id,
          judul: m.judul,
          duration: `${15 + idx * 5} Menit`,
          status: idx === 0 ? "Selesai" : "Belum Selesai",
          isCompleted: idx === 0,
          konten_markdown:
            m.konten_markdown ||
            `### ${m.judul}\n\nMemahami materi pembelajaran Matematika Kelas 8 (Fase D).`,
        }))
      : [];

  return (
    <main className="min-h-screen bg-mesh-gradient text-slate-900 pb-16">
      {/* Top Header Navigation */}
      <header className="sticky top-3 sm:top-5 z-30 w-full px-3 sm:px-6 pointer-events-none transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-lg sm:shadow-xl ring-1 ring-slate-900/5 pointer-events-auto text-slate-900">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0F172A] hover:text-blue-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full transition cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Progress Bab: {chapterProgressPercent}% Selesai</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6">
        {/* ========================================================= */}
        {/* VIEW 1: DAFTAR MATERI BAB (image_71bbc4.png Style) */}
        {/* ========================================================= */}
        {!selectedMateriId ? (
          <div className="space-y-6">
            {/* Header Hero Card */}
            <div className="saas-card rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white">
              <div className="space-y-2 max-w-2xl">
                <span className="inline-block text-xs font-extrabold text-[#0F172A] bg-emerald-100 border border-emerald-300 px-3.5 py-1.5 rounded-full">
                  Kurikulum Merdeka • Fase D (Matematika Kelas 8) • Bab {urutanBab || 1}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  {judulBab || "Bab 1: Pola Bilangan & Barisan Bilangan"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {deskripsiBab ||
                    "Menggeneralisasi pola susunan benda dan barisan bilangan aritmetika & geometri."}
                </p>
              </div>

              {/* Progress Gauge Real Database Ratio */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={() => setSelectedMateriId(listMateri[0]?.id || "materi-1")}
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-amber-300" />
                  <span>Buka Jurnal Digital (Buku Penuh)</span>
                </button>

                <div className="saas-card p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 shrink-0 bg-slate-50">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#0F172A]"
                        strokeDasharray={`${chapterProgressPercent}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-xs font-extrabold text-[#0F172A]">
                      {chapterProgressPercent}%
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[#0F172A]">
                      {chapterProgressPercent}% Selesai
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {answeredCount} dari {totalSoalCount > 0 ? totalSoalCount : displayModules.length} Soal
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical Module Step-by-Step List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
                  <List className="w-5 h-5 text-indigo-500" />
                  <span>Modul Pembelajaran Bab Ini</span>
                </h2>
                <span className="text-xs text-slate-500 font-semibold">
                  {displayModules.length} Halaman / Modul Terjadwal
                </span>
              </div>

              <div className="space-y-3">
                {displayModules.map((mod, idx) => (
                  <div
                    key={mod.id}
                    className="glass-card glass-card-hover rounded-2xl p-5 border border-white/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs ${
                          mod.isCompleted
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-[#0F172A] text-white"
                        }`}
                      >
                        {mod.isCompleted ? (
                          <Check className="w-5 h-5 stroke-[3]" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-[#0F172A]">
                            {mod.judul}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              mod.isCompleted
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {mod.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {mod.duration}
                          </span>
                          <span>• Jurnal Interaktif, Stabilo, Catatan & Socratic AI</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedMateriId(mod.id)}
                      className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-xs shrink-0"
                    >
                      <PlayCircle className="w-4 h-4 text-amber-400" />
                      <span>Buka Halaman {idx + 1}</span>
                    </button>
                  </div>
                ))}

                {/* Final Step: In-Class Topic Quiz (Evaluasi Bab: 10 Soal, Tanpa Waktu) */}
                <div className="glass-card rounded-2xl p-5 border-2 border-amber-200 bg-amber-50/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-[#0F172A]">
                          Evaluasi Akhir / Asesmen Bab
                        </h3>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          Kuis In-Class
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="font-bold text-amber-700">
                          10 Soal • Tanpa Waktu (Bebas Stres)
                        </span>
                        <span>• Bonus +100 Poin</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/quiz/sesi-demo?mode=inclass&babId=${babId}`}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-md shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Mulai Asesmen Bab</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 2: DIGITAL LEARNING JOURNAL INTERACTIVE READER       */
          /* ========================================================= */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedMateriId(null)}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#0F172A] hover:text-blue-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Daftar Modul Bab</span>
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-400">Modul:</span>
                <span className="font-bold text-slate-800">{selectedMateri?.judul || "Materi Pembelajaran"}</span>
              </div>
            </div>

            <DigitalJournalReader
              babId={babId}
              judulBab={judulBab}
              deskripsiBab={deskripsiBab}
              urutanBab={urutanBab}
              listMateri={listMateri}
              initialPageIndex={Math.max(0, listMateri.findIndex((m) => m.id === selectedMateriId))}
            />
          </div>
        )}
      </div>
    </main>
  );
}
