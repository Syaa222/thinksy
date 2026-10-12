"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bot,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  BookOpen,
  Award,
} from "lucide-react";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";
import TutorStreamPanel from "./TutorStreamPanel";

export interface QuestionItem {
  id: string;
  pertanyaan: string;
  tipeSoal: "pilihan_ganda" | "isian_singkat" | "esai";
  poin?: number;
  opsiSoal?: Array<{ id: string; label: string; teksOpsi: string }>;
}

interface LatihanSatuSoalClientProps {
  sesiId: string;
  judulBab: string;
  soalList: QuestionItem[];
}

interface FeedbackState {
  isBenar: boolean;
  pembahasan: string;
  alasanSalah?: string | null;
  kunciJawaban?: string | null;
}

export default function LatihanSatuSoalClient({
  sesiId,
  judulBab,
  soalList,
}: LatihanSatuSoalClientProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOpsiId, setSelectedOpsiId] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [checking, setChecking] = useState(false);
  const [isTutorOpen, setIsTutorOpen] = useState(false);

  // Status per soal: { [soalId]: FeedbackState }
  const [feedbacks, setFeedbacks] = useState<Record<string, FeedbackState>>({});
  // Counter berapa kali salah per soal untuk aturan 3x salah Sokratik
  const [salahCounters, setSalahCounters] = useState<Record<string, number>>({});

  const currentQ = soalList[currentIndex];
  const currentFeedback = currentQ ? feedbacks[currentQ.id] : null;
  const currentSalahCount = currentQ ? (salahCounters[currentQ.id] || 0) : 0;

  const handlePilihOpsi = (opsiId: string) => {
    if (currentFeedback?.isBenar) return; // Kunci jika sudah benar
    setSelectedOpsiId(opsiId);
  };

  const handleCekJawaban = async () => {
    if (!currentQ || checking) return;

    if (currentQ.tipeSoal === "pilihan_ganda" && !selectedOpsiId) {
      alert("Silakan pilih salah satu opsi terlebih dahulu!");
      return;
    }
    if ((currentQ.tipeSoal === "isian_singkat" || currentQ.tipeSoal === "esai") && !inputText.trim()) {
      alert("Silakan ketikkan jawaban kamu terlebih dahulu!");
      return;
    }

    setChecking(true);
    try {
      const res = await fetch("/api/sesi/jawab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sesiId,
          soalId: currentQ.id,
          opsiId: currentQ.tipeSoal === "pilihan_ganda" ? selectedOpsiId : undefined,
          jawabanTeks: currentQ.tipeSoal !== "pilihan_ganda" ? inputText : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memeriksa jawaban.");

      setFeedbacks((prev) => ({
        ...prev,
        [currentQ.id]: {
          isBenar: Boolean(data.isBenar),
          pembahasan: data.pembahasan || "",
          alasanSalah: data.alasanSalah,
          kunciJawaban: data.kunciJawaban,
        },
      }));

      if (!data.isBenar) {
        setSalahCounters((prev) => ({
          ...prev,
          [currentQ.id]: (prev[currentQ.id] || 0) + 1,
        }));
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat memeriksa jawaban.");
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < soalList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOpsiId("");
      setInputText("");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedOpsiId("");
      setInputText("");
    }
  };

  const handleResetCobaLagi = () => {
    if (!currentQ) return;
    setFeedbacks((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
    setSelectedOpsiId("");
    setInputText("");
  };

  const totalBenar = Object.values(feedbacks).filter((f) => f.isBenar).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/bab"
            className="flex items-center gap-2 text-slate-600 hover:text-[#193446] font-medium text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali ke Daftar Bab</span>
          </Link>

          <div className="text-center">
            <span className="text-xs uppercase tracking-wider font-bold text-[#E9C77B] bg-[#193446] px-2.5 py-0.5 rounded-full">
              Latihan Mandiri
            </span>
            <h1 className="text-sm font-bold text-slate-800 line-clamp-1 max-w-[200px] sm:max-w-md">
              {judulBab}
            </h1>
          </div>

          <button
            onClick={() => setIsTutorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E9C77B]/20 border border-[#E9C77B]/60 text-[#193446] hover:bg-[#E9C77B]/30 font-bold text-xs transition shadow-sm"
          >
            <Bot className="w-4 h-4 text-[#193446]" />
            <span>Tutor AI</span>
            {currentSalahCount >= 3 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Number Navigation Bar */}
        <div className="max-w-4xl mx-auto mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1">
          {soalList.map((q, idx) => {
            const fb = feedbacks[q.id];
            const isActive = idx === currentIndex;
            let badgeClass = "bg-white text-slate-700 border-slate-200";

            if (fb?.isBenar) {
              badgeClass = "bg-emerald-500 text-white border-emerald-600 font-bold";
            } else if (fb && !fb.isBenar) {
              badgeClass = "bg-rose-500 text-white border-rose-600 font-bold";
            } else if (isActive) {
              badgeClass = "bg-[#193446] text-white border-[#193446] font-bold";
            }

            return (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setSelectedOpsiId("");
                  setInputText("");
                }}
                className={`min-w-8 h-8 rounded-lg text-xs border flex items-center justify-center transition shadow-xs ${badgeClass} ${
                  isActive ? "ring-2 ring-[#E9C77B]" : ""
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Single Question Screen */}
      <main className="max-w-3xl w-full mx-auto px-4 py-6 flex-1 flex flex-col justify-center">
        {currentQ ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-8 shadow-md space-y-6">
            {/* Meta Question Info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <span className="font-bold text-[#193446] bg-slate-100 px-3 py-1 rounded-full">
                Soal #{currentIndex + 1} dari {soalList.length} &bull;{" "}
                {currentQ.tipeSoal === "pilihan_ganda"
                  ? "Pilihan Ganda"
                  : currentQ.tipeSoal === "isian_singkat"
                  ? "Isian Singkat"
                  : "Esai"}
              </span>
              <span className="text-slate-500 font-medium">
                Nilai Bobot: {currentQ.poin || 10} Poin
              </span>
            </div>

            {/* Question Text with KaTeX */}
            <div className="text-base sm:text-lg text-slate-800 font-medium leading-relaxed">
              <MarkdownRenderer content={currentQ.pertanyaan} />
            </div>

            {/* Answer Input Area based on Type */}
            <div className="space-y-3 pt-2">
              {currentQ.tipeSoal === "pilihan_ganda" && currentQ.opsiSoal && (
                <div className="space-y-2.5">
                  {currentQ.opsiSoal.map((opt) => {
                    const isSelected = selectedOpsiId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handlePilihOpsi(opt.id)}
                        disabled={Boolean(currentFeedback?.isBenar)}
                        className={`w-full p-4 rounded-2xl border text-left text-sm flex items-center gap-3.5 transition ${
                          isSelected
                            ? "bg-[#193446] text-white border-[#193446] shadow-sm font-medium"
                            : "bg-white text-slate-800 border-slate-200 hover:border-[#193446]/40 hover:bg-slate-50/80"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? "bg-[#E9C77B] text-[#193446]"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {opt.label}
                        </span>
                        <span className="flex-1">
                          <MarkdownRenderer content={opt.teksOpsi} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.tipeSoal === "isian_singkat" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Ketik Jawaban Singkat Kamu:
                  </label>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={Boolean(currentFeedback?.isBenar)}
                    placeholder="Contoh: 45 atau 2x + 3"
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-white text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-[#193446]"
                  />
                </div>
              )}

              {currentQ.tipeSoal === "esai" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Tuliskan Langkah Penyelesaian & Alasanmu:
                  </label>
                  <textarea
                    rows={5}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={Boolean(currentFeedback?.isBenar)}
                    placeholder="Tuliskan langkah-langkah logika atau rumus matematika yang kamu gunakan..."
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#193446]"
                  />
                </div>
              )}
            </div>

            {/* INSTANT FEEDBACK CARD */}
            {currentFeedback && (
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  currentFeedback.isBenar
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : "bg-rose-50 border-rose-200 text-rose-950"
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-black/5">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {currentFeedback.isBenar ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-emerald-700">Luar Biasa, Jawabanmu Benar!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-600" />
                        <span className="text-rose-700">Belum Tepat. Jangan Menyerah!</span>
                      </>
                    )}
                  </div>
                  {!currentFeedback.isBenar && (
                    <button
                      onClick={handleResetCobaLagi}
                      className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-lg transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Coba Lagi
                    </button>
                  )}
                </div>

                {/* Penjelasan Miskonsepsi jika salah */}
                {!currentFeedback.isBenar && currentFeedback.alasanSalah && (
                  <div className="mt-3 text-xs bg-white/70 p-3 rounded-xl border border-rose-200/60 space-y-1">
                    <span className="font-bold text-rose-800">Catatan Analisis Miskonsepsi:</span>
                    <p className="text-rose-900">{currentFeedback.alasanSalah}</p>
                  </div>
                )}

                {/* Pembahasan Langkah demi Langkah */}
                <div className="mt-3 text-xs space-y-1.5">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#193446]" />
                    Pembahasan Langkah demi Langkah:
                  </span>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-slate-800 leading-relaxed">
                    <MarkdownRenderer content={currentFeedback.pembahasan} />
                  </div>
                </div>

                {/* Notice 3x salah */}
                {!currentFeedback.isBenar && currentSalahCount >= 3 && (
                  <div className="mt-3 p-3 rounded-xl bg-[#E9C77B]/20 border border-[#E9C77B]/60 text-[#193446] text-xs flex items-center justify-between">
                    <span>💡 Kamu sudah mencoba 3 kali pada soal ini. Tanya Tutor AI untuk bimbingan konsep!</span>
                    <button
                      onClick={() => setIsTutorOpen(true)}
                      className="ml-2 px-2.5 py-1 rounded-lg bg-[#193446] text-[#E9C77B] font-bold shrink-0 hover:bg-[#152a38]"
                    >
                      Buka Tutor AI
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-12 bg-white rounded-3xl border border-slate-200">
            <Award className="w-12 h-12 text-[#E9C77B] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Semua Soal Latihan Telah Selesai!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Kamu berhasil menyelesaikan soal dengan {totalBenar} jawaban benar.
            </p>
            <Link
              href="/bab"
              className="mt-5 inline-block px-5 py-2.5 rounded-xl bg-[#193446] text-white text-xs font-bold hover:bg-[#152a38]"
            >
              Kembali ke Menu Bab
            </Link>
          </div>
        )}
      </main>

      {/* Sticky Bottom Thumb-Friendly Action Bar */}
      <footer className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-30 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 disabled:opacity-30 transition flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          {!currentFeedback ? (
            <button
              onClick={handleCekJawaban}
              disabled={checking}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-[#193446] text-[#E9C77B] hover:bg-[#152a38] font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              {checking ? (
                <span>Memeriksa Jawaban...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Cek Jawaban</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={currentIndex >= soalList.length - 1}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <span>Lanjut ke Soal Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={currentIndex >= soalList.length - 1}
            className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 disabled:opacity-30 transition flex items-center gap-1"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Streaming AI Tutor Panel */}
      {currentQ && (
        <TutorStreamPanel
          soalId={currentQ.id}
          sesiId={sesiId}
          pertanyaanText={currentQ.pertanyaan}
          jawabanSiswaSaatIni={
            currentQ.tipeSoal === "pilihan_ganda"
              ? currentQ.opsiSoal?.find((o) => o.id === selectedOpsiId)?.teksOpsi
              : inputText
          }
          jumlahSalahLangkah={currentSalahCount}
          isOpen={isTutorOpen}
          onClose={() => setIsTutorOpen(false)}
        />
      )}
    </div>
  );
}
