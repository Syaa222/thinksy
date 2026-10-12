"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  AlertCircle,
  Flag,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";

export interface CleanQuizQuestion {
  id: string;
  pertanyaan: string;
  tipeSoal: "pilihan_ganda" | "isian_singkat" | "esai";
  opsiSoal?: Array<{ id: string; teksOpsi: string }>;
}

interface QuizAssessmentClientProps {
  sesiId: string;
  babId?: string;
  judulSesi?: string;
  mapel?: string;
  batasMenit?: number;
  mulaiPada?: string;
  soalList: CleanQuizQuestion[];
  namaSiswa?: string;
  initialAnswers?: Record<string, string>;
}

export default function QuizAssessmentClient({
  sesiId,
  babId,
  judulSesi = "Evaluasi Kuis Pembelajaran",
  mapel = "Matematika",
  batasMenit = 30,
  mulaiPada,
  soalList = [],
  namaSiswa = "Siswa",
  initialAnswers = {},
}: QuizAssessmentClientProps) {
  const router = useRouter();

  // 1. STATE PERSISTENCE (LocalStorage + Server Initial Answers)
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`thinksy_quiz_answers_${sesiId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          return { ...initialAnswers, ...parsed };
        }
      } catch {}
    }
    return initialAnswers;
  });

  const [flagged, setFlagged] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`thinksy_quiz_flagged_${sesiId}`);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return {};
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 2. REAL-TIME TIMER DARI DB `batas_menit`
  const totalSeconds = (batasMenit || 30) * 60;
  const startTimeRef = useRef<number>(
    mulaiPada ? new Date(mulaiPada).getTime() : Date.now()
  );

  const calculateRemainingSeconds = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    return Math.max(0, totalSeconds - elapsed);
  }, [totalSeconds]);

  const [secondsLeft, setSecondsLeft] = useState<number>(() => calculateRemainingSeconds());
  const autoSubmittedRef = useRef(false);

  // 3. AUTO-SUBMIT HANDLER
  const submitQuiz = useCallback(
    async (isAuto = false) => {
      if (isSubmitting || autoSubmittedRef.current) return;
      if (isAuto) autoSubmittedRef.current = true;

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const res = await fetch("/api/sesi/selesai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sesiId,
            answers,
            autoSubmitted: isAuto,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // Clear cached local answers upon successful submission
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem(`thinksy_quiz_answers_${sesiId}`);
              localStorage.removeItem(`thinksy_quiz_flagged_${sesiId}`);
              if (babId) {
                const activity = {
                  type: "bab",
                  id: babId,
                  judul: judulSesi?.replace("Evaluasi Kuis: ", "") || "Bab Pembelajaran",
                  mapel: mapel || "Matematika",
                  link: `/bab/${babId}`,
                  updatedAt: new Date().toISOString(),
                };
                localStorage.setItem("thinksy_last_activity", JSON.stringify(activity));
                window.dispatchEvent(new CustomEvent("thinksy_activity_update", { detail: activity }));
              }
            } catch {}
          }
          router.replace(data.redirectUrl || `/hasil/${sesiId}`);
        } else {
          setSubmitError(data.error || "Gagal mengumpulkan jawaban.");
          setIsSubmitting(false);
        }
      } catch (err: any) {
        setSubmitError("Gangguan koneksi internet: " + err.message);
        setIsSubmitting(false);
      }
    },
    [isSubmitting, sesiId, answers, router, babId, judulSesi, mapel]
  );

  // Save quiz activity to last activity for Quick Resume & To-do integration
  useEffect(() => {
    if (typeof window !== "undefined" && sesiId) {
      const activity = {
        type: "quiz",
        id: sesiId,
        judul: judulSesi || "Kuis Pembelajaran",
        mapel: mapel || "Matematika",
        link: `/quiz/${sesiId}?mode=inclass&babId=${babId || ""}`,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem("thinksy_last_activity", JSON.stringify(activity));
        window.dispatchEvent(new CustomEvent("thinksy_activity_update", { detail: activity }));
      } catch {}
    }
  }, [sesiId, judulSesi, mapel, babId]);

  // Timer Tick & Auto-Submit trigger on 00:00
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setSecondsLeft(remaining);

      if (remaining <= 0 && !autoSubmittedRef.current) {
        clearInterval(interval);
        submitQuiz(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateRemainingSeconds, submitQuiz]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isTimeCritical = secondsLeft <= 300; // Under 5 minutes
  const isTimeUrgent = secondsLeft <= 60; // Under 1 minute

  // 4. ANSWER SELECTION & PERSISTENCE
  const saveAnswerToDb = async (soalId: string, val: string) => {
    try {
      const q = soalList.find((item) => item.id === soalId);
      await fetch("/api/sesi/jawab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sesiId,
          soalId,
          opsiId: q?.tipeSoal === "pilihan_ganda" ? val : undefined,
          jawabanTeks: q?.tipeSoal !== "pilihan_ganda" ? val : undefined,
        }),
      });
    } catch {
      // Background retry silently
    }
  };

  const handleSelectAnswer = (optionIdOrText: string) => {
    const q = soalList[currentIdx];
    if (!q) return;

    setAnswers((prev) => {
      const updated = { ...prev, [q.id]: optionIdOrText };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`thinksy_quiz_answers_${sesiId}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    // Sync to DB
    saveAnswerToDb(q.id, optionIdOrText);
  };

  const handleToggleFlag = () => {
    const q = soalList[currentIdx];
    if (!q) return;

    setFlagged((prev) => {
      const updated = { ...prev, [q.id]: !prev[q.id] };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`thinksy_quiz_flagged_${sesiId}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const currentQ = soalList[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const isAllAnswered = answeredCount >= soalList.length && soalList.length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28 sm:pb-20 font-sans selection:bg-emerald-100">
      {/* ─── TOP HEADER BAR (Modern Soft Educational) ─── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate font-heading tracking-tight">
                {judulSesi}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span className="text-emerald-700 font-bold">{mapel}</span>
                <span>•</span>
                <span>{soalList.length} Butir Soal</span>
              </div>
            </div>
          </div>

          {/* TIMER AKTIF REAL-TIME DARI DB */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-black transition-all ${
                isTimeUrgent
                  ? "bg-rose-50 text-rose-700 animate-pulse ring-2 ring-rose-300"
                  : isTimeCritical
                  ? "bg-amber-50 text-amber-800 ring-1 ring-amber-300"
                  : "bg-slate-50 text-slate-700 border border-slate-100"
              }`}
            >
              <Clock className={`w-4 h-4 ${isTimeUrgent ? "text-rose-600" : isTimeCritical ? "text-amber-600" : "text-slate-500"}`} />
              <span className="tabular-nums tracking-wide">{formatTime(secondsLeft)}</span>
            </div>

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-xs transition active:scale-98 cursor-pointer"
            >
              <span>Kumpulkan</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── MAIN QUIZ AREA (Spacious & Clean) ─── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: QUESTION CARD (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {currentQ ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 space-y-6 animate-in fade-in duration-200">
                {/* Number Badge & Flag Button */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center">
                      {currentIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Soal {currentIdx + 1} dari {soalList.length}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-600">
                      {currentQ.tipeSoal === "esai" ? "Soal Esai" : "Pilihan Ganda"}
                    </span>
                  </div>

                  <button
                    onClick={handleToggleFlag}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      flagged[currentQ.id]
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${flagged[currentQ.id] ? "fill-amber-600 text-amber-600" : ""}`} />
                    <span>{flagged[currentQ.id] ? "Ditandai Ragu" : "Ragu-ragu"}</span>
                  </button>
                </div>

                {/* Question Statement */}
                <div className="text-sm sm:text-base text-slate-900 leading-relaxed font-normal">
                  <MarkdownRenderer content={currentQ.pertanyaan} />
                </div>

                {/* Options / Essay Input Area */}
                <div className="pt-2 space-y-3">
                  {currentQ.tipeSoal === "pilihan_ganda" && currentQ.opsiSoal ? (
                    currentQ.opsiSoal.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isSelected =
                        answers[currentQ.id] === opt.id ||
                        answers[currentQ.id] === opt.teksOpsi;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectAnswer(opt.id)}
                          className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-150 flex items-start gap-3.5 group cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-500 shadow-xs"
                              : "bg-white hover:bg-slate-50/80 text-slate-700 border border-slate-200/80 hover:border-slate-300 shadow-2xs"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              isSelected
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                            }`}
                          >
                            {letter}
                          </div>
                          <div className="text-xs sm:text-sm pt-0.5 leading-relaxed flex-1">
                            <MarkdownRenderer content={opt.teksOpsi} />
                          </div>
                        </button>
                      );
                    })
                  ) : currentQ.tipeSoal === "isian_singkat" ? (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 block">
                        Ketikkan Jawaban Singkat Anda:
                      </label>
                      <input
                        type="text"
                        value={answers[currentQ.id] || ""}
                        onChange={(e) => handleSelectAnswer(e.target.value)}
                        placeholder="Contoh: 120 atau 3x + 5"
                        className="w-full p-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 transition"
                      />
                      <p className="text-[11px] text-slate-400">
                        *Jawaban otomatis tersimpan setiap kali Anda mengetik.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 block">
                        Tuliskan Uraian Jawaban Anda:
                      </label>
                      <textarea
                        rows={5}
                        value={answers[currentQ.id] || ""}
                        onChange={(e) => handleSelectAnswer(e.target.value)}
                        placeholder="Ketik langkah penyelesaian, rumus, atau alasan secara lengkap di sini..."
                        className="w-full p-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm text-slate-900 transition resize-y"
                      />
                      <p className="text-[11px] text-slate-400">
                        *Jawaban esai otomatis tersimpan setiap kali Anda mengetik.
                      </p>
                    </div>
                  )}
                </div>

                {/* In-Card Navigation Desktop */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  <div className="text-xs text-slate-400 font-medium">
                    Terjawab: <strong className="text-slate-700">{answeredCount}</strong> / {soalList.length}
                  </div>

                  {currentIdx < soalList.length - 1 ? (
                    <button
                      onClick={() => setCurrentIdx((prev) => Math.min(soalList.length - 1, prev + 1))}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs cursor-pointer active:scale-98"
                    >
                      <span>Berikutnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow-xs cursor-pointer active:scale-98"
                    >
                      <span>Selesai & Kumpulkan</span>
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-xs">
                Tidak ada butir soal yang dimuat.
              </div>
            )}
          </div>

          {/* RIGHT: QUESTION PALETTE GRID (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 font-heading">
                  Nomor Soal
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {answeredCount}/{soalList.length} Selesai
                </span>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium pb-1">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-md bg-emerald-600 inline-block" />
                  <span>Dijawab</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-md bg-amber-400 inline-block" />
                  <span>Ragu</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-md bg-slate-100 inline-block" />
                  <span>Belum</span>
                </span>
              </div>

              {/* Number Buttons Grid */}
              <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-0.5">
                {soalList.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id]);
                  const isFlag = Boolean(flagged[q.id]);
                  const isCurrent = idx === currentIdx;

                  let btnStyle = "bg-slate-50 text-slate-700 hover:bg-slate-100";
                  if (isAnswered) btnStyle = "bg-emerald-600 text-white font-bold shadow-xs";
                  if (isFlag) btnStyle = "bg-amber-400 text-amber-950 font-bold ring-2 ring-amber-200";

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-10 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer relative ${btnStyle} ${
                        isCurrent ? "ring-2 ring-slate-900 ring-offset-1" : ""
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isFlag && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Submit Button in Sidebar */}
              <div className="pt-2">
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="w-full py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Kumpulkan Ujian Sekarang</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Anti-AI Security Notice */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pengerjaan Terproteksi & Mandiri</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Sesi kuis ini diawasi dengan integritas penilaian standar sekolah. Pembahasan lengkap akan terbuka setelah sesi disubmit.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ─── MOBILE THUMB ACTION BAR (Sticky at bottom for screens < 640px) ─── */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-3 sm:hidden z-30 shadow-lg flex items-center justify-between gap-2">
        <button
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs disabled:opacity-40"
        >
          Sebelumnya
        </button>

        <button
          onClick={handleToggleFlag}
          className={`px-4 py-3 rounded-xl text-xs font-bold ${
            flagged[currentQ?.id || ""] ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
          }`}
        >
          <Flag className="w-4 h-4" />
        </button>

        {currentIdx < soalList.length - 1 ? (
          <button
            onClick={() => setCurrentIdx((prev) => Math.min(soalList.length - 1, prev + 1))}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
          >
            Berikutnya
          </button>
        ) : (
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-xs"
          >
            Kumpulkan
          </button>
        )}
      </div>

      {/* ─── CONFIRMATION SUBMIT MODAL ─── */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
              <Send className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 font-heading">
                Kumpulkan Lembar Jawaban?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Anda telah menjawab <strong className="text-slate-800">{answeredCount}</strong> dari total{" "}
                <strong className="text-slate-800">{soalList.length}</strong> butir soal.
                {!isAllAnswered && (
                  <span className="block text-amber-600 font-bold mt-1">
                    ⚠️ Terdapat {soalList.length - answeredCount} soal yang belum dijawab.
                  </span>
                )}
              </p>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 text-left">
                {submitError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => setIsSubmitModalOpen(false)}
                className="flex-1 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer"
              >
                Cek Ulang
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => submitQuiz(false)}
                className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengunci...</span>
                  </>
                ) : (
                  <span>Ya, Kumpulkan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
