"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Award,
  BookOpen,
  Sparkles,
  HelpCircle,
  Save,
  Check,
  RotateCcw,
  PlayCircle,
} from "lucide-react";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";

interface OpsiItem {
  id: string;
  teks_opsi: string;
  urutan: number;
}

interface QuestionItem {
  id: string;
  urutan: number;
  pertanyaan: string;
  tipe_soal: string;
  poin_bobot: number;
  opsi: OpsiItem[];
}

interface UjianData {
  id: string;
  judul: string;
  deskripsi?: string;
  mapel: string;
  durasi_menit: number;
  passing_grade: number;
  status: string;
}

interface SesiData {
  id: string;
  ujian_id: string;
  siswa_id: string;
  server_start_time: string;
  server_end_time: string;
  status: string;
  nilai_akhir?: number;
  skor_objektif?: number;
  dikumpulkan_pada?: string;
}

interface ExamRoomClientProps {
  ujian: UjianData;
  initialQuestions: QuestionItem[];
  initialSession: SesiData | null;
  initialSavedAnswers?: Record<string, { opsiId?: string; jawabanEsai?: string }>;
  initialRemainingSeconds?: number;
}

export default function ExamRoomClient({
  ujian,
  initialQuestions,
  initialSession,
  initialSavedAnswers = {},
  initialRemainingSeconds,
}: ExamRoomClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Session state
  const [session, setSession] = useState<SesiData | null>(initialSession);
  const [isExamStarted, setIsExamStarted] = useState(
    initialSession?.status === "sedang_mengerjakan" || initialSession?.status === "selesai"
  );
  const [isCompleted, setIsCompleted] = useState(
    initialSession?.status === "selesai" || initialSession?.status === "habis_waktu"
  );
  const [finalResult, setFinalResult] = useState<{
    nilaiAkhir: number;
    isPassed: boolean;
    passingGrade: number;
    totalQuestions: number;
    correctCount: number;
    bonusPoin: number;
  } | null>(
    initialSession?.status === "selesai"
      ? {
          nilaiAkhir: initialSession.nilai_akhir ?? 0,
          isPassed: (initialSession.nilai_akhir ?? 0) >= ujian.passing_grade,
          passingGrade: ujian.passing_grade,
          totalQuestions: initialQuestions.length,
          correctCount: Math.round(((initialSession.nilai_akhir ?? 0) / 100) * initialQuestions.length),
          bonusPoin: 50,
        }
      : null
  );

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    initialRemainingSeconds ?? ujian.durasi_menit * 60
  );
  const [isTimerWarning, setIsTimerWarning] = useState(false);

  // Question navigation state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { opsiId?: string; jawabanEsai?: string }>
  >(initialSavedAnswers);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isStartingExam, setIsStartingExam] = useState(false);

  const currentQuestion = initialQuestions[currentIndex];

  // 1. Timer Countdown Effect
  useEffect(() => {
    if (!isExamStarted || isCompleted) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitOnTimeout();
          return 0;
        }
        if (prev <= 300) {
          setIsTimerWarning(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamStarted, isCompleted]);

  // 2. Periodic Auto-Save Effect (Every 25 seconds)
  useEffect(() => {
    if (!isExamStarted || isCompleted || !session?.id) return;

    const saveInterval = setInterval(() => {
      saveDraftAnswers();
    }, 25000);

    return () => clearInterval(saveInterval);
  }, [isExamStarted, isCompleted, session?.id, answers]);

  // Start Exam Action
  const handleStartExam = async () => {
    try {
      setIsStartingExam(true);
      const res = await fetch("/api/siswa/ujian/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ujianId: ujian.id }),
      });

      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        setRemainingSeconds(data.remaining_seconds);
        setIsExamStarted(true);
        if (data.status === "selesai" || data.status === "habis_waktu") {
          setIsCompleted(true);
        }
      }
    } catch (err) {
      console.error("Failed to start exam:", err);
    } finally {
      setIsStartingExam(false);
    }
  };

  // Save Draft Action
  const saveDraftAnswers = async () => {
    if (!session?.id || isCompleted) return;

    try {
      setIsAutoSaving(true);
      const answersPayload = Object.entries(answers).map(([soalId, val]) => ({
        soalId,
        opsiId: val.opsiId,
        jawabanEsai: val.jawabanEsai,
      }));

      const res = await fetch("/api/siswa/ujian/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sesiId: session.id,
          ujianId: ujian.id,
          answers: answersPayload,
        }),
      });

      const data = await res.json();
      if (data.isExpired) {
        setIsCompleted(true);
        alert("Waktu ujian telah habis. Jawaban Anda telah otomatis tersimpan.");
      } else if (data.success) {
        const now = new Date();
        setLastSavedTime(
          now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
      }
    } catch (err) {
      console.error("Failed to save draft:", err);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Select Option
  const handleSelectOption = (soalId: string, opsiId: string) => {
    if (isCompleted) return;
    setAnswers((prev) => ({
      ...prev,
      [soalId]: {
        ...prev[soalId],
        opsiId,
      },
    }));
  };

  // Essay Input
  const handleEssayChange = (soalId: string, jawabanEsai: string) => {
    if (isCompleted) return;
    setAnswers((prev) => ({
      ...prev,
      [soalId]: {
        ...prev[soalId],
        jawabanEsai,
      },
    }));
  };

  // Toggle Flag
  const toggleFlagQuestion = (soalId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(soalId)) {
        next.delete(soalId);
      } else {
        next.add(soalId);
      }
      return next;
    });
  };

  // Submit Final Exam
  const handleSubmitExam = async () => {
    if (!session?.id || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const answersPayload = Object.entries(answers).map(([soalId, val]) => ({
        soalId,
        opsiId: val.opsiId,
        jawabanEsai: val.jawabanEsai,
      }));

      const res = await fetch("/api/siswa/ujian/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sesiId: session.id,
          ujianId: ujian.id,
          answers: answersPayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFinalResult({
          nilaiAkhir: data.nilaiAkhir,
          isPassed: data.isPassed,
          passingGrade: data.passingGrade,
          totalQuestions: data.totalQuestions,
          correctCount: data.correctCount,
          bonusPoin: data.bonusPoin,
        });
        setIsCompleted(true);
        setIsConfirmModalOpen(false);
      } else {
        alert(data.error || "Gagal mengumpulkan ujian.");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat mengumpulkan ujian.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto Submit on Timeout
  const handleAutoSubmitOnTimeout = async () => {
    if (!session?.id || isCompleted) return;
    await handleSubmitExam();
  };

  // Format Timer mm:ss
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Count answered questions
  const answeredCount = Object.keys(answers).filter((k) => {
    const ans = answers[k];
    return Boolean(ans?.opsiId || (ans?.jawabanEsai && ans.jawabanEsai.trim().length > 0));
  }).length;

  // ==========================================
  // VIEW 1: LOBBY / PRE-EXAM BRIEFING
  // ==========================================
  if (!isExamStarted) {
    return (
      <main className="min-h-screen bg-mesh-gradient text-slate-900 pb-16 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full saas-card rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-xl space-y-6">
          <Link
            href="/ujian"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Ujian</span>
          </Link>

          <div className="space-y-2 border-b border-slate-100 pb-5">
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 inline-block">
              {ujian.mapel} • Kelas 8
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              {ujian.judul}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {ujian.deskripsi || "Asesmen kompetensi pembelajaran Kurikulum Merdeka Fase D."}
            </p>
          </div>

          {/* Exam Rules Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Petunjuk & Peraturan Ujian</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 leading-relaxed list-disc list-inside">
              <li>
                Durasi waktu pengerjaan: <strong>{ujian.durasi_menit} Menit</strong> (Dihitung oleh server).
              </li>
              <li>
                Jumlah Soal: <strong>{initialQuestions.length} Soal</strong>.
              </li>
              <li>
                Kriteria Ketuntasan Minimal (KKM): <strong>{ujian.passing_grade} Poin</strong>.
              </li>
              <li>
                Jawaban Anda akan <strong>otomatis tersimpan</strong> secara berkala.
              </li>
              <li>
                Bila waktu habis, ujian akan <strong>otomatis dikumpulkan</strong> oleh sistem.
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Waktu mulai dihitung saat tombol ditekan.</span>
            </div>

            <button
              onClick={handleStartExam}
              disabled={isStartingExam}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs flex items-center justify-center gap-2.5 transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {isStartingExam ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Mempersiapkan Lembar Ujian...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 text-amber-400" />
                  <span>Mulai Kerjakan Ujian Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 2: EXAM COMPLETED / RESULT SUMMARY
  // ==========================================
  if (isCompleted && finalResult) {
    return (
      <main className="min-h-screen bg-mesh-gradient text-slate-900 pb-16 flex items-center justify-center p-4">
        <div className="max-w-xl w-full saas-card rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-2xl space-y-6 text-center">
          <div
            className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg ${
              finalResult.isPassed
                ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300"
                : "bg-amber-100 text-amber-700 border-2 border-amber-300"
            }`}
          >
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                finalResult.isPassed
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {finalResult.isPassed ? "Tuntas / Memenuhi KKM" : "Perlu Pengayaan / Remedial"}
            </span>
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight pt-2">
              Ujian Berhasil Dikumpulkan
            </h1>
            <p className="text-xs text-slate-500 font-medium">{ujian.judul}</p>
          </div>

          {/* Score Display Card */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nilai Akhir Anda</div>
            <div className="text-5xl font-black text-[#0F172A] tracking-tight">{finalResult.nilaiAkhir}</div>
            <div className="text-xs text-slate-500 font-medium">
              KKM: <strong className="text-slate-800">{finalResult.passingGrade}</strong> • Benar:{" "}
              <strong className="text-slate-800">{finalResult.correctCount}</strong> dari{" "}
              <strong className="text-slate-800">{finalResult.totalQuestions} Soal</strong>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-center gap-2 text-xs font-bold text-amber-700">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>+{finalResult.bonusPoin} Poin Belajar Ditambahkan ke Profil!</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/ujian"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Daftar Ujian</span>
            </Link>

            <Link
              href="/dashboard"
              className="flex-1 py-3 px-4 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 3: LIVE ACTIVE EXAM ROOM
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Sticky Exam Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F172A] text-white flex items-center justify-center font-black text-xs shrink-0">
              {ujian.mapel?.substring(0, 3).toUpperCase() || "EXAM"}
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-extrabold text-[#0F172A] line-clamp-1">
                {ujian.judul}
              </h1>
              <div className="text-[10px] text-slate-500 font-medium">
                Soal {currentIndex + 1} dari {initialQuestions.length}
              </div>
            </div>
          </div>

          {/* Server Countdown Timer & Actions */}
          <div className="flex items-center gap-3">
            {/* Auto save indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              {isAutoSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Menyimpan...</span>
                </>
              ) : lastSavedTime ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Draft tersimpan {lastSavedTime}</span>
                </>
              ) : null}
            </div>

            {/* Countdown Badge */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-black tracking-wider shadow-xs transition duration-300 ${
                isTimerWarning
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-slate-900 text-amber-400"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>

            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kumpulkan Ujian</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Exam Content Grid */}
      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER: Question & Answer Workspace (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {currentQuestion ? (
            <div className="saas-card rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-sm space-y-6">
              {/* Question Header & Flag Toggle */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-3 py-1 rounded-lg bg-[#0F172A] text-white">
                    Nomor {currentIndex + 1}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    Bobot: {currentQuestion.poin_bobot} Poin
                  </span>
                </div>

                <button
                  onClick={() => toggleFlagQuestion(currentQuestion.id)}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    flaggedQuestions.has(currentQuestion.id)
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>
                    {flaggedQuestions.has(currentQuestion.id) ? "Ditandai Ragu" : "Tandai Ragu"}
                  </span>
                </button>
              </div>

              {/* Question Text & Markdown/KaTeX */}
              <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed">
                <MarkdownRenderer content={currentQuestion.pertanyaan} />
              </div>

              {/* Options Selector / Essay Field */}
              {currentQuestion.tipe_soal === "pilihan_ganda" ? (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Pilihan Jawaban:
                  </div>

                  <div className="space-y-2.5">
                    {currentQuestion.opsi?.map((opsi, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isSelected = answers[currentQuestion.id]?.opsiId === opsi.id;

                      return (
                        <button
                          key={opsi.id}
                          onClick={() => handleSelectOption(currentQuestion.id, opsi.id)}
                          className={`w-full text-left p-4 rounded-2xl border transition duration-150 flex items-start gap-3.5 cursor-pointer ${
                            isSelected
                              ? "bg-blue-50/80 border-blue-500 shadow-xs"
                              : "bg-slate-50/50 hover:bg-slate-100/80 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-slate-300 text-slate-700"
                            }`}
                          >
                            {letter}
                          </div>
                          <div className="text-xs sm:text-sm font-medium pt-0.5 text-slate-800 leading-snug">
                            {opsi.teks_opsi}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Jawaban Esai Anda:
                  </label>
                  <textarea
                    rows={6}
                    value={answers[currentQuestion.id]?.jawabanEsai || ""}
                    onChange={(e) => handleEssayChange(currentQuestion.id, e.target.value)}
                    placeholder="Tuliskan jawaban lengkap dan langkah penyelesaian Anda di sini..."
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              )}

              {/* Navigation Bar (Prev / Next) */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Soal Sebelumnya</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={saveDraftAnswers}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-500" />
                    <span>Simpan Draft</span>
                  </button>

                  {currentIndex < initialQuestions.length - 1 ? (
                    <button
                      onClick={() =>
                        setCurrentIndex((prev) => Math.min(initialQuestions.length - 1, prev + 1))
                      }
                      className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <span>Soal Berikutnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsConfirmModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <span>Selesai & Kumpulkan</span>
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="saas-card rounded-3xl p-12 text-center bg-white border border-slate-200">
              <p className="text-xs text-slate-500">Soal tidak ditemukan.</p>
            </div>
          )}
        </div>

        {/* RIGHT: Question Palette Navigation (4 Cols) */}
        <div className="lg:col-span-4 space-y-6 sticky top-20">
          <div className="saas-card rounded-3xl p-5 sm:p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                Navigasi Nomor Soal
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                {answeredCount}/{initialQuestions.length} Terjawab
              </span>
            </div>

            {/* Color Legend */}
            <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-blue-600" />
                <span>Dijawab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-400" />
                <span>Ragu-ragu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-200" />
                <span>Belum</span>
              </div>
            </div>

            {/* Grid Palette */}
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 pt-2">
              {initialQuestions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const ans = answers[q.id];
                const isAnswered = Boolean(
                  ans?.opsiId || (ans?.jawabanEsai && ans.jawabanEsai.trim().length > 0)
                );
                const isFlagged = flaggedQuestions.has(q.id);

                let bgStyle = "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";
                if (isFlagged) {
                  bgStyle = "bg-amber-400 text-slate-950 font-black border-amber-500 shadow-xs";
                } else if (isAnswered) {
                  bgStyle = "bg-blue-600 text-white font-black border-blue-700 shadow-xs";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center relative transition border cursor-pointer ${bgStyle} ${
                      isCurrent ? "ring-2 ring-slate-900 ring-offset-2 scale-105" : ""
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Summary Progress Bar */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>Kelengkapan Jawaban</span>
                <span>
                  {Math.round((answeredCount / (initialQuestions.length || 1)) * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${(answeredCount / (initialQuestions.length || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Submission Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="max-w-md w-full saas-card rounded-3xl p-6 sm:p-7 bg-white border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Kumpulkan Lembar Ujian?</h3>
                <p className="text-xs text-slate-500">Pastikan Anda telah memeriksa semua jawaban.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Total Soal:</span>
                <strong>{initialQuestions.length} Soal</strong>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Sudah Dijawab:</span>
                <strong>{answeredCount} Soal</strong>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>Belum Dijawab:</span>
                <strong>{initialQuestions.length - answeredCount} Soal</strong>
              </div>
              {flaggedQuestions.size > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Ditandai Ragu-ragu:</span>
                  <strong>{flaggedQuestions.size} Soal</strong>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Periksa Kembali
              </button>

              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menilai...</span>
                  </>
                ) : (
                  <span>Ya, Kumpulkan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
