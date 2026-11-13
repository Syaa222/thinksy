"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Bot,
  ChevronUp,
  ChevronDown,
  X,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";
import {
  getStoredAiSettings,
  getQuizTokensRemaining,
  decrementQuizToken,
} from "@/lib/ai-config";

export interface CleanQuizQuestion {
  id: string;
  pertanyaan: string;
  tipeSoal: "pilihan_ganda" | "isian_singkat" | "esai";
  opsiSoal?: Array<{ id: string; teksOpsi: string; benar?: boolean; alasanSalah?: string }>;
  hintSokratik?: string;
  kunciJawaban?: string;
  pembahasan?: string;
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

function normalizeMathComparison(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/[\$\\]/g, "")
    .replace(/frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1/$2")
    .replace(/\s+/g, "")
    .trim();
}

function checkIsOptionCorrect(
  opt: { id: string; teksOpsi: string; benar?: boolean },
  optIdx: number,
  kunciJawaban?: string
): boolean {
  if (Boolean(opt.benar)) return true;
  if (!kunciJawaban) return false;
  const cleanKey = kunciJawaban.trim().toLowerCase();
  const letter = String.fromCharCode(65 + optIdx).toLowerCase(); // 'a', 'b', 'c', 'd'
  const letterNumber = String(optIdx + 1); // '1', '2', '3', '4'

  if (
    cleanKey === letter ||
    cleanKey === `opsi ${letter}` ||
    cleanKey === `pilihan ${letter}` ||
    cleanKey.startsWith(`opsi ${letter}`) ||
    cleanKey.startsWith(`pilihan ${letter}`)
  ) {
    return true;
  }
  if (cleanKey === letterNumber) {
    return true;
  }
  if (cleanKey === opt.id.toLowerCase()) {
    return true;
  }
  const cleanTeks = opt.teksOpsi.trim().toLowerCase();
  if (cleanTeks === cleanKey || (cleanKey.length > 5 && cleanTeks.includes(cleanKey))) {
    return true;
  }
  // Perbandingan normalisasi matematis (mendukung pecahan KaTeX vs string)
  if (normalizeMathComparison(opt.teksOpsi) === normalizeMathComparison(kunciJawaban)) {
    return true;
  }
  return false;
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

  // ─── CUSTOM BAB CONFIGURATION (SINKRON GURU) ───
  const [customBabConfig, setCustomBabConfig] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("thinksy_custom_babs");
      if (raw && babId) {
        const parsed = JSON.parse(raw);
        const match =
          parsed[babId] ||
          Object.values(parsed).find(
            (b: any) => b.id === babId || b.supabaseId === babId
          );
        if (match) {
          setCustomBabConfig(match);
        }
      }
    } catch {}
  }, [babId]);

  // Derive Effective Questions (Gunakan bank soal kustom guru jika dikonfigurasi)
  const activeQuestions: CleanQuizQuestion[] = useMemo(() => {
    if (
      customBabConfig?.quiz?.questions &&
      Array.isArray(customBabConfig.quiz.questions) &&
      customBabConfig.quiz.questions.length > 0
    ) {
      return customBabConfig.quiz.questions.map((q: any, idx: number) => ({
        id: q.id || `custom-q-${idx + 1}`,
        pertanyaan: q.pertanyaan,
        tipeSoal: q.tipeSoal || "pilihan_ganda",
        opsiSoal: Array.isArray(q.opsiSoal)
          ? q.opsiSoal.map((o: any, oIdx: number) => ({
              id: o.id || `opt-${idx + 1}-${oIdx + 1}`,
              teksOpsi: o.teksOpsi,
              benar: o.benar,
              alasanSalah: o.alasanSalah,
            }))
          : undefined,
        hintSokratik: q.hintSokratik,
        kunciJawaban: q.kunciJawaban,
        pembahasan: q.pembahasan,
      }));
    }
    return soalList;
  }, [customBabConfig, soalList]);

  const isQuizEnabled = customBabConfig?.quiz?.isEnabled !== false;
  const aiQuizMode: "disabled" | "hint_only" | "full" =
    customBabConfig?.quiz?.aiQuizMode || "hint_only";

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
  const [openPetunjuk, setOpenPetunjuk] = useState<Record<string, boolean>>({});
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
        const filteredAnswers: Record<string, string> = {};
        activeQuestions.forEach((q) => {
          if (answers[q.id] !== undefined && answers[q.id] !== null) {
            filteredAnswers[q.id] = answers[q.id];
          }
        });

        const res = await fetch("/api/sesi/selesai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sesiId,
            babId,
            answers: filteredAnswers,
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

  // Waktu tidak diperlukan sesuai instruksi pengguna, kuis berjalan tanpa batasan timer.
  const formatTime = (secs: number) => "";

  // 4. ANSWER SELECTION & PERSISTENCE
  const saveAnswerToDb = async (soalId: string, val: string) => {
    try {
      const q = activeQuestions.find((item) => item.id === soalId);
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
    const q = activeQuestions[currentIdx];
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
    const q = activeQuestions[currentIdx];
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

  // ─── 5. SOCRATIC AI TUTOR STATE (Scoped per Question) ───
  const [isAiOpen, setIsAiOpen] = useState(true);
  const [isAiMinimized, setIsAiMinimized] = useState(false);
  const [aiMessagesByQuestion, setAiMessagesByQuestion] = useState<
    Record<string, Array<{ sender: "user" | "tutor"; text: string }>>
  >({});
  const [inputMsg, setInputMsg] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  const [maxQuizTokens, setMaxQuizTokens] = useState<number>(() => {
    if (aiQuizMode === "disabled") return 0;
    if (aiQuizMode === "hint_only") return 3;
    if (typeof window !== "undefined") {
      return getStoredAiSettings().kuis?.tokensPerQuiz || 5;
    }
    return 5;
  });
  const [quizTokensLeft, setQuizTokensLeft] = useState<number>(() => {
    if (aiQuizMode === "disabled") return 0;
    if (aiQuizMode === "hint_only") return 3;
    if (typeof window !== "undefined") {
      const max = getStoredAiSettings().kuis?.tokensPerQuiz || 5;
      return getQuizTokensRemaining(sesiId, max);
    }
    return 5;
  });

  useEffect(() => {
    if (aiQuizMode === "disabled") {
      setMaxQuizTokens(0);
      setQuizTokensLeft(0);
      return;
    }
    if (aiQuizMode === "hint_only") {
      setMaxQuizTokens(3);
      setQuizTokensLeft(3);
      return;
    }
    const handleSettingsChange = (e: any) => {
      const s = e.detail || getStoredAiSettings();
      if (s?.kuis?.tokensPerQuiz) {
        setMaxQuizTokens(s.kuis.tokensPerQuiz);
        setQuizTokensLeft(getQuizTokensRemaining(sesiId, s.kuis.tokensPerQuiz));
      }
    };
    window.addEventListener("thinksy_ai_settings_change", handleSettingsChange);
    return () => window.removeEventListener("thinksy_ai_settings_change", handleSettingsChange);
  }, [sesiId, aiQuizMode]);

  const currentQ = activeQuestions[currentIdx];
  const answeredCount = useMemo(() => {
    const activeIds = new Set(activeQuestions.map((q) => q.id));
    let count = 0;
    activeIds.forEach((id) => {
      const val = answers[id];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        count++;
      }
    });
    return Math.min(count, activeQuestions.length);
  }, [activeQuestions, answers]);
  const isAllAnswered = answeredCount >= activeQuestions.length && activeQuestions.length > 0;

  // Analisis opsi benar dan status jawaban siswa pada soal aktif
  const correctIdx = useMemo(() => {
    if (!currentQ?.opsiSoal || currentQ.opsiSoal.length === 0) return 0;
    const foundIdx = currentQ.opsiSoal.findIndex((o, idx) =>
      checkIsOptionCorrect(o, idx, currentQ.kunciJawaban)
    );
    return foundIdx >= 0 ? foundIdx : 0;
  }, [currentQ]);

  const correctOpt = currentQ?.opsiSoal?.[correctIdx];
  const correctLetter = String.fromCharCode(65 + Math.max(0, correctIdx));
  const isAnswered = currentQ ? Boolean(answers[currentQ.id]) : false;

  const userSelectedIdx = useMemo(() => {
    if (!currentQ?.opsiSoal || !answers[currentQ.id]) return -1;
    const ans = (answers[currentQ.id] || "").trim().toLowerCase();
    return currentQ.opsiSoal.findIndex((o, idx) => {
      const letter = String.fromCharCode(65 + idx).toLowerCase();
      return (
        ans === o.id.toLowerCase() ||
        ans === o.teksOpsi.trim().toLowerCase() ||
        ans === letter
      );
    });
  }, [currentQ, answers]);

  const userSelectedOpt = userSelectedIdx >= 0 && currentQ?.opsiSoal ? currentQ.opsiSoal[userSelectedIdx] : undefined;
  const isUserWrong = isAnswered && userSelectedIdx !== -1 && userSelectedIdx !== correctIdx;

  const currentQuestionMessages = currentQ
    ? aiMessagesByQuestion[currentQ.id] || [
        {
          sender: "tutor",
          text: `Halo ${namaSiswa || "kamu"}! 🦉 Aku **Tutor Sokratik AI**. Aku siap membimbingmu memahami soal nomor ${currentIdx + 1} ini langkah demi langkah tanpa membocorkan kunci jawaban secara langsung.\n\nBagian konsep atau langkah mana yang ingin kita diskusikan?`,
        },
      ]
    : [];

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    if (isAiOpen && !isAiMinimized) {
      const timer = setTimeout(() => scrollToBottom("smooth"), 50);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionMessages.length, isAiLoading, isAiOpen, isAiMinimized, currentIdx]);

  const handleSendAiMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMsg).trim();
    if (!textToSend || isAiLoading || !currentQ) return;
    if (quizTokensLeft <= 0) return;

    decrementQuizToken(sesiId, maxQuizTokens);
    setQuizTokensLeft((prev) => Math.max(0, prev - 1));

    setInputMsg("");
    const prevList = currentQuestionMessages;
    const updatedWithUser = [
      ...prevList,
      { sender: "user" as const, text: textToSend },
    ];

    setAiMessagesByQuestion((prev) => ({
      ...prev,
      [currentQ.id]: updatedWithUser,
    }));
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sesiId,
          soalId: currentQ.id,
          soalNomor: currentIdx + 1,
          totalSoal: activeQuestions.length,
          pertanyaan: currentQ.pertanyaan,
          opsiJawaban: currentQ.opsiSoal,
          jawabanSiswa: answers[currentQ.id] || undefined,
          hintSokratik: currentQ.hintSokratik,
          kunciJawaban: currentQ.kunciJawaban,
          pembahasan: currentQ.pembahasan,
          babJudul: judulSesi,
          mapel,
          message: textToSend,
          history: prevList.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      const data = await response.json();
      const replyText =
        data.reply ||
        (data.error
          ? `⚠️ ${data.error}`
          : `💡 **Petunjuk Sokratik:** Coba perhatikan informasi utama pada soal ini. Rumus atau konsep apa yang menghubungkan pertanyaan dengan pilihan jawaban yang ada?`);

      setAiMessagesByQuestion((prev) => ({
        ...prev,
        [currentQ.id]: [
          ...(prev[currentQ.id] || updatedWithUser),
          { sender: "tutor", text: replyText },
        ],
      }));
    } catch {
      setAiMessagesByQuestion((prev) => ({
        ...prev,
        [currentQ.id]: [
          ...(prev[currentQ.id] || updatedWithUser),
          {
            sender: "tutor",
            text: `💡 **Bimbingan Penalaran:** Bayangkan prinsip materi ${mapel} yang terkait dengan soal ini. Langkah awal apa yang menurutmu masuk akal untuk dikerjakan terlebih dahulu?`,
          },
        ],
      }));
    } finally {
      setIsAiLoading(false);
    }
  };

  // Tampilan Terkunci Jika Kuis Dinonaktifkan oleh Guru
  if (!isQuizEnabled) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl font-black">
            🔒
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Kuis Bab Sedang Ditutup
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Guru pengampu telah menonaktifkan sementara akses pengerjaan kuis untuk bab ini. Silakan hubungi guru atau pelajari kembali materi bab Anda.
            </p>
          </div>
          {babId && (
            <Link
              href={`/bab/${babId}`}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali ke Modul Bab</span>
            </Link>
          )}
        </div>
      </div>
    );
  }

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

          {/* Header Action: Kumpulkan Kuis */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center gap-2 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-xs transition active:scale-98 cursor-pointer"
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
                      {currentQ.tipeSoal === "esai" ? "Soal Esai" : currentQ.tipeSoal === "isian_singkat" ? "Isian Singkat" : "Pilihan Ganda"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
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
                </div>

                {/* Question Statement */}
                <div className="text-sm sm:text-base text-slate-900 leading-relaxed font-normal">
                  <MarkdownRenderer content={currentQ.pertanyaan} />
                </div>

                {/* Options / Essay Input Area */}
                <div className="pt-2 space-y-3">
                  {currentQ.tipeSoal === "pilihan_ganda" && currentQ.opsiSoal ? (
                    <>
                      <div className="space-y-3">
                        {currentQ.opsiSoal.map((opt, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isSelected =
                            answers[currentQ.id] === opt.id ||
                            answers[currentQ.id] === opt.teksOpsi ||
                            (answers[currentQ.id] || "").trim().toLowerCase() === letter.toLowerCase();
                          const isThisCorrect = optIdx === correctIdx;
                          const isSelectedAndWrong = isAnswered && isSelected && !isThisCorrect;

                          let cardStyle =
                            "bg-white hover:bg-slate-50/80 text-slate-700 border border-slate-200/80 hover:border-slate-300 shadow-2xs";

                          if (isAnswered) {
                            if (isThisCorrect) {
                              cardStyle =
                                "bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-500 shadow-xs border-emerald-300";
                            } else if (isSelectedAndWrong) {
                              cardStyle =
                                "bg-rose-50 text-rose-950 font-semibold ring-2 ring-rose-500 shadow-xs border-rose-300";
                            } else {
                              cardStyle =
                                "bg-slate-50/60 text-slate-500 border border-slate-200/70 opacity-75";
                            }
                          } else if (isSelected) {
                            cardStyle =
                              "bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-500 shadow-xs";
                          }

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectAnswer(opt.id)}
                              className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-150 flex items-start justify-between gap-3.5 group cursor-pointer ${cardStyle}`}
                            >
                              <div className="flex items-start gap-3.5 flex-1">
                                <div
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                                    isAnswered
                                      ? isThisCorrect
                                        ? "bg-emerald-600 text-white"
                                        : isSelectedAndWrong
                                        ? "bg-rose-600 text-white"
                                        : "bg-slate-100 text-slate-500"
                                      : isSelected
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                                  }`}
                                >
                                  {letter}
                                </div>
                                <div className="text-xs sm:text-sm pt-0.5 leading-relaxed flex-1">
                                  <MarkdownRenderer content={opt.teksOpsi} />
                                </div>

                                {/* Tag (Jawaban Anda) */}
                                {isAnswered && isSelected && (
                                  <span className="text-[11px] font-semibold text-slate-500 shrink-0 ml-1">
                                    (Jawaban Anda)
                                  </span>
                                )}
                              </div>

                              {/* Pill Badges */}
                              {isAnswered && isThisCorrect && (
                                <div className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{isSelected ? "Jawaban Anda Benar" : "Jawaban yang benar"}</span>
                                </div>
                              )}

                              {isAnswered && isSelectedAndWrong && (
                                <div className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 shrink-0">
                                  <X className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Jawaban Anda Salah</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* FEEDBACK & PENJELASAN SAAT TERDETEKSI SALAH / BENAR */}
                      {isAnswered && (
                        <div className="pt-2">
                          {isUserWrong ? (
                            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/90 border border-rose-300 text-slate-900 space-y-3.5 animate-in fade-in duration-200 shadow-xs">
                              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-rose-200">
                                <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm sm:text-base">
                                  <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                                    <X className="w-3.5 h-3.5" />
                                  </div>
                                  <span>Jawaban Terdeteksi Salah</span>
                                </div>
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-200/80 text-rose-900">
                                  Perlu Perbaikan
                                </span>
                              </div>

                              {/* Kunci Jawaban yang Benar */}
                              <div className="p-3.5 rounded-xl bg-white border border-rose-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-500">Jawaban yang Benar:</span>
                                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-1 border border-emerald-300 shadow-2xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Opsi {correctLetter}</span>
                                  </span>
                                </div>
                                <div className="text-xs sm:text-sm font-extrabold text-emerald-950 sm:text-right">
                                  {correctOpt?.teksOpsi || currentQ.kunciJawaban || "Opsi Benar"}
                                </div>
                              </div>

                              {/* Alasan Singkat & Konsep Materi */}
                              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 space-y-1.5 shadow-2xs">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                                  <BookOpen className="w-4 h-4 text-amber-700" />
                                  <span>Alasan Singkat & Pembahasan:</span>
                                </div>
                                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal bg-white/70 p-2.5 rounded-lg border border-amber-100">
                                  <MarkdownRenderer
                                    content={
                                      currentQ.pembahasan ||
                                      correctOpt?.alasanSalah ||
                                      `Kunci jawaban yang tepat adalah opsi ${correctLetter} ("${correctOpt?.teksOpsi}"). Pilihan ini merupakan prinsip fundamental pada materi pembelajaran ini untuk memahami konsep dan menyelesaikan persoalan secara kontekstual.`
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-slate-900 space-y-3 animate-in fade-in duration-200 shadow-xs">
                              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-emerald-200">
                                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm sm:text-base">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                  <span>Jawaban Anda Benar! (Tepat Sekali)</span>
                                </div>
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-200/80 text-emerald-900">
                                  +Poin Penuh
                                </span>
                              </div>

                              <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-1 shadow-2xs">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                                  <BookOpen className="w-4 h-4 text-emerald-700" />
                                  <span>Pembahasan Konsep:</span>
                                </div>
                                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                                  <MarkdownRenderer
                                    content={
                                      currentQ.pembahasan ||
                                      `Pilihan Anda pada opsi ${correctLetter} ("${correctOpt?.teksOpsi}") sangat tepat sesuai kaidah konsep capaian pembelajaran materi ini.`
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
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

                {/* 1. Petunjuk di bawah Pilihan Ganda (Collapsible) */}
                {currentQ.hintSokratik && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenPetunjuk((prev) => ({
                          ...prev,
                          [currentQ.id]: !prev[currentQ.id],
                        }))
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>Petunjuk</span>
                      {openPetunjuk[currentQ.id] ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    {openPetunjuk[currentQ.id] && (
                      <div className="mt-2.5 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs sm:text-sm text-amber-950 leading-relaxed animate-in fade-in duration-150">
                        <MarkdownRenderer content={currentQ.hintSokratik} isCompact />
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Pembahasan Lengkap Langsung Setelah Menjawab */}
                {/* Pembahasan terpadu langsung di atas */}

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
                    Terjawab: <strong className="text-slate-700">{answeredCount}</strong> / {activeQuestions.length}
                  </div>

                  {currentIdx < activeQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIdx((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
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
                  {answeredCount}/{activeQuestions.length} Selesai
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
                {activeQuestions.map((q, idx) => {
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

            {/* ─── THINKY AI CARD (QUIZ MODE) ─── */}
            <div id="ai-tutor-box" className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200/90 animate-in fade-in duration-200">
              {/* Header (#193446) */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#193446] text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/10 p-1 flex items-center justify-center border border-[#E9C77B]/30 shrink-0">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs text-[#E9C77B] flex items-center gap-1 leading-none">
                      <span>✨ thinksy AI</span>
                    </h3>
                    <p className="text-[10px] text-[#E9C77B]/80 font-medium leading-tight mt-0.5">
                      {aiQuizMode === "disabled"
                        ? "Bantuan Dinonaktifkan Guru"
                        : aiQuizMode === "hint_only"
                        ? `Petunjuk Konsep • Soal #${currentIdx + 1}`
                        : `Asisten Belajar • Soal #${currentIdx + 1}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {aiQuizMode === "disabled" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-300/30 bg-rose-400/20 text-rose-200">
                      Ujian Murni (AI Nonaktif)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300/30 bg-amber-400/10 text-amber-200">
                      Kuota Kuis: {quizTokensLeft}/{maxQuizTokens}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAiMinimized((prev) => !prev)}
                    className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title={isAiMinimized ? "Perluas obrolan" : "Kecilkan obrolan"}
                  >
                    {isAiMinimized ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {!isAiMinimized && (
                <div className="p-4 space-y-3.5">
                  {aiQuizMode === "disabled" ? (
                    <div className="p-6 text-center space-y-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                        <ShieldAlert className="w-5 h-5 text-amber-700" />
                      </div>
                      <div className="text-xs font-bold text-slate-900">Mode Ujian Murni (Tanpa AI)</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                        Guru telah menonaktifkan bantuan AI Tutor pada kuis ini untuk menguji pemahaman mandiri siswa. Selesaikan seluruh butir soal tanpa bantuan AI.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Warning Banner When Quiz Tokens are Exhausted */}
                      {quizTokensLeft <= 0 && (
                        <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Kuota bantuan AI kuis ini telah habis ({maxQuizTokens}/{maxQuizTokens}). Silakan selesaikan sisa soal secara mandiri!</span>
                        </div>
                      )}

                      {/* Quick Prompt Suggestions */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          disabled={isAiLoading || quizTokensLeft <= 0}
                          onClick={() => handleSendAiMessage("Beri petunjuk langkah awal untuk menyelesaikan soal ini")}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-200/80 transition cursor-pointer"
                        >
                          💡 Langkah Awal
                        </button>
                        <button
                          type="button"
                          disabled={isAiLoading || quizTokensLeft <= 0}
                          onClick={() => handleSendAiMessage("Konsep atau rumus apa yang dipakai di soal ini?")}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-200/80 transition cursor-pointer"
                        >
                          🔍 Konsep Rumus
                        </button>
                        <button
                          type="button"
                          disabled={isAiLoading || quizTokensLeft <= 0}
                          onClick={() => handleSendAiMessage("Saya masih bingung memahami maksud pertanyaannya")}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-200/80 transition cursor-pointer"
                        >
                          ❓ Paham Soal
                        </button>
                      </div>

                      {/* Messages Scroll Area */}
                      <div
                        ref={chatScrollContainerRef}
                        className="h-64 overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs scroll-smooth"
                      >
                        {currentQuestionMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-2xl leading-relaxed ${
                              msg.sender === "user"
                                ? "bg-[#193446] text-white [&_*]:!text-white ml-5 rounded-tr-xs shadow-xs"
                                : "bg-white text-slate-800 mr-5 border border-slate-200/80 shadow-2xs rounded-tl-xs"
                            }`}
                          >
                            <MarkdownRenderer content={msg.text} isCompact />
                          </div>
                        ))}

                        {isAiLoading && (
                          <div className="flex items-center gap-2 p-2.5 bg-white text-slate-600 rounded-xl border border-slate-200/80 shadow-2xs text-[11px] font-medium animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#193446]" />
                            <span>thinksy AI sedang menalar petunjuk...</span>
                          </div>
                        )}
                      </div>

                      {/* Input Box */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendAiMessage();
                        }}
                        className="space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={inputMsg}
                            maxLength={200}
                            onChange={(e) => setInputMsg(e.target.value)}
                            placeholder={
                              quizTokensLeft <= 0
                                ? "Kuota bantuan AI kuis sudah habis..."
                                : "Ketik pertanyaan untuk thinksy AI..."
                            }
                            disabled={isAiLoading || quizTokensLeft <= 0}
                            className="flex-1 px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-2xl text-xs font-medium border border-slate-200 focus:border-[#193446] outline-none transition disabled:opacity-50"
                          />
                          <button
                            type="submit"
                            disabled={!inputMsg.trim() || isAiLoading || quizTokensLeft <= 0}
                            className="p-2.5 rounded-2xl bg-[#193446] hover:bg-[#132836] disabled:opacity-40 disabled:cursor-not-allowed text-white transition cursor-pointer shrink-0 shadow-xs"
                            title="Kirim pesan"
                          >
                            <Send className="w-4 h-4 text-[#E9C77B]" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-center justify-between px-1">
                          <span>*Bimbingan Sokratik tanpa bocoran jawaban</span>
                          <span>{inputMsg.length}/200</span>
                        </p>
                      </form>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ─── MOBILE THUMB ACTION BAR (Sticky at bottom for screens < 640px) ─── */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-3 sm:hidden z-30 shadow-lg flex items-center justify-between gap-2">
        <button
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          className="flex-1 py-3 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs disabled:opacity-40"
        >
          Sebelumnya
        </button>

        <button
          onClick={() => {
            setIsAiOpen(true);
            setIsAiMinimized(false);
            const el = document.getElementById("ai-tutor-box");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="py-3 px-3.5 rounded-xl bg-[#193446] hover:bg-[#132836] text-[#E9C77B] font-black text-xs flex items-center justify-center gap-1.5 shadow-xs"
          title="Tanya thinksy AI"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>thinksy AI ({quizTokensLeft})</span>
        </button>

        <button
          onClick={handleToggleFlag}
          className={`px-3 py-3 rounded-xl text-xs font-bold ${
            flagged[currentQ?.id || ""] ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
          }`}
        >
          <Flag className="w-4 h-4" />
        </button>

        {currentIdx < soalList.length - 1 ? (
          <button
            onClick={() => setCurrentIdx((prev) => Math.min(soalList.length - 1, prev + 1))}
            className="flex-1 py-3 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
          >
            Berikutnya
          </button>
        ) : (
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex-1 py-3 px-3 rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-xs"
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
                <strong className="text-slate-800">{activeQuestions.length}</strong> butir soal.
                {!isAllAnswered && (
                  <span className="block text-amber-600 font-bold mt-1">
                    ⚠️ Terdapat {Math.max(0, activeQuestions.length - answeredCount)} soal yang belum dijawab.
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
