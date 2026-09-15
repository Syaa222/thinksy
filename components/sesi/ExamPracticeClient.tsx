"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Flag,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  AlertTriangle,
  X,
  Send,
  Loader2,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  List,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";

export interface ExamQuestion {
  id: string;
  pertanyaan: string;
  tipeSoal: "pilihan_ganda" | "esai";
  opsiSoal?: Array<{ id: string; teksOpsi: string }>;
  kunciJawaban?: string;
  pembahasan?: string;
  hintSokratik?: string;
}

interface ExamPracticeClientProps {
  sesiId: string;
  babId?: string;
  mode?: "latihan" | "inclass" | "kuis" | "assessment" | "eksplorasi";
  judulSesi?: string;
  mapel?: string;
  soalList: ExamQuestion[];
  namaSiswa?: string;
}

export default function ExamPracticeClient({
  sesiId,
  babId,
  mode = "inclass",
  judulSesi = "EVALUASI BAB - ASESMEN TOPIK IN-CLASS",
  mapel = "Matematika",
  soalList = [],
  namaSiswa = "Siswa",
}: ExamPracticeClientProps) {
  const router = useRouter();
  const activeQuestions = soalList;
  const isInClassMode = mode === "inclass" || mode === "assessment";

  // Active State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Live 15-Minute Countdown Timer for Quiz & Exam Assessment
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60);

  useEffect(() => {
    if (submitting) return;

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submitting]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const currentQ = activeQuestions[currentIdx];

  const handleSelectAnswer = (optionIdOrText: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionIdOrText }));
  };

  const handleToggleFlag = () => {
    if (!currentQ) return;
    setFlagged((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  // Socratic AI Assistant Chat Modal State (Scoped per Question)
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessagesByQuestion, setAiMessagesByQuestion] = useState<
    Record<string, Array<{ sender: "user" | "tutor"; text: string }>>
  >({});
  const [inputMsg, setInputMsg] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Active Socratic messages for currently viewed question (Peer Persona)
  const currentQuestionMessages = currentQ
    ? aiMessagesByQuestion[currentQ.id] || [
        {
          sender: "tutor",
          text: `Hai ${namaSiswa || "kamu"}! 👋 Aku teman belajarmu di sini buat nemenin kamu ngerjain **Soal #${currentIdx + 1}**.\n\nTenang aja, kita bedah bareng konsep soalnya pelan-pelan tanpa bocorin jawaban langsung ya, biar kamu makin paham! Kira-kira bagian mana nih yang bikin kamu ragu atau penasaran?`,
        },
      ]
    : [];

  const handleRequestQuestionHint = () => {
    setIsAiOpen(true);
    if (!currentQ) return;
    const existing = aiMessagesByQuestion[currentQ.id];
    if (!existing || existing.length === 0) {
      handleSendAiMessage(
        `Yuk bantu aku pahami konsep dasar dan tips awal buat ngerjain Soal #${currentIdx + 1} ini!`
      );
    }
  };

  const handleSendAiMessage = async (presetPrompt?: string) => {
    const textToSend = (presetPrompt || inputMsg).trim();
    if (!textToSend || isAiLoading || !currentQ) return;

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
          kunciJawaban: currentQ.kunciJawaban,
          pembahasan: currentQ.pembahasan,
          hintSokratik: currentQ.hintSokratik,
          babJudul: judulSesi,
          materiJudul: `${judulSesi} - Soal #${currentIdx + 1}`,
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
        `💡 **Bimbingan Sokratik Soal #${currentIdx + 1}:**\n\nCoba telaah kembali kata kunci utama pada pertanyaan ini. Apakah kamu bisa mengidentifikasi konsep yang menghubungkan pertanyaan dengan pilihan jawaban yang ada?`;

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
            text: `💡 **Petunjuk Sokratik Soal #${currentIdx + 1}:**\n\nPerhatikan informasi penting yang ada pada soal. Konsep dasar apa yang menurutmu paling tepat untuk membedakan opsi yang benar dan yang salah?`,
          },
        ],
      }));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFinishExam = async () => {
    setIsSubmitModalOpen(false);
    setSubmitting(true);
    try {
      const payloadAnswers = activeQuestions.map((q) => {
        const userAns = answers[q.id];
        return {
          soalId: q.id,
          opsiDipilihId: q.tipeSoal === "pilihan_ganda" ? userAns : undefined,
          jawabanTeks: q.tipeSoal === "esai" ? userAns : undefined,
        };
      });

      const res = await fetch("/api/quiz/grade-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sesiId,
          babId,
          jawabanList: payloadAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirimkan kuis.");
      }

      router.push(`/hasil/${data.sesiId || sesiId}`);
    } catch (err: any) {
      alert(err.message || "Gagal mengirimkan kuis.");
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;

  if (submitting) {
    return (
      <div className="min-h-screen bg-mesh-gradient flex flex-col items-center justify-center p-6 text-center">
        <div className="saas-card rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl bg-white space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
          <h2 className="text-xl font-extrabold text-[#0F172A]">Menilai Jawaban Kuis...</h2>
          <p className="text-xs text-slate-500">
            Sistem sedang menghitung skor, menambahkan poin belajar, dan mengirimkan hasil jawaban ke dashboard guru secara realtime.
          </p>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-mesh-gradient flex flex-col items-center justify-center p-6 text-center">
        <div className="saas-card rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl bg-white space-y-4">
          <BrainCircuit className="w-10 h-10 text-[#0F172A] mx-auto" />
          <h2 className="text-xl font-extrabold text-[#0F172A]">Kuis Tidak Memuat Soal</h2>
          <p className="text-xs text-slate-500">
            Tidak ada soal yang tersedia untuk sesi kuis ini. Silakan kembali ke beranda.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-[#0F172A] text-white text-xs font-bold"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* 1. EXAM HEADER BAR */}
      <header className="sticky top-0 z-40 saas-nav border-b border-slate-200 shadow-xs bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-white flex items-center justify-center p-0.5">
              <img src="/logo.png" alt="THINKSY Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-[#0F172A] block text-base tracking-tight truncate max-w-[200px] sm:max-w-md md:max-w-lg">
                {judulSesi}
              </span>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                {isInClassMode ? "Evaluasi Bab (Tanpa Waktu)" : "Kuis / Ujian Mandiri"}
              </span>
            </div>
          </div>

          {/* Right Header: Socratic AI Button & Timer */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Teman Belajar AI Trigger Button (Always Visible) */}
            <button
              onClick={() => setIsAiOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Teman Belajar AI</span>
            </button>

            {!isInClassMode ? (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 text-white shadow-md border border-amber-400 font-mono font-extrabold text-xs sm:text-sm">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tanpa Waktu (Bebas Stres)</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN EXAM INTERFACE */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Question & Multiple-Choice Radio Options (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/90 shadow-xl space-y-6 bg-white">
            {/* Question Header & Controls */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#0F172A] bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl">
                  Soal #{currentIdx + 1} dari {activeQuestions.length}
                </span>

                {/* Socratic Helper Button in Question Card */}
                <button
                  onClick={handleRequestQuestionHint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Tanya Teman Belajar</span>
                  <span className="sm:hidden">Teman AI</span>
                </button>
              </div>

              {/* Tandai Ragu Button */}
              <button
                onClick={handleToggleFlag}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  flagged[currentQ.id]
                    ? "bg-amber-400 text-[#0F172A] border-amber-500 shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>
                  {flagged[currentQ.id] ? "Ragu-ragu (Aktif)" : "Tandai Ragu"}
                </span>
              </button>
            </div>

            {/* Question Content (KaTeX Math Render) */}
            <div className="text-slate-800 text-sm sm:text-base leading-relaxed font-medium">
              <MarkdownRenderer content={currentQ.pertanyaan} />
            </div>

            {/* Options List */}
            {currentQ.tipeSoal === "pilihan_ganda" && currentQ.opsiSoal && (
              <div className="space-y-3 pt-2">
                {currentQ.opsiSoal.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isSelected = answers[currentQ.id] === opt.id;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectAnswer(opt.id)}
                      className={`w-full p-4 rounded-2xl border text-left transition flex items-start gap-4 cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 border-blue-500 ring-2 ring-blue-400 shadow-sm"
                          : "bg-slate-50/70 hover:bg-white border-slate-200/90 text-slate-800"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 transition ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-white border border-slate-300 text-slate-700"
                        }`}
                      >
                        {letter}
                      </div>
                      <div className="text-xs sm:text-sm font-semibold flex-1 pt-1.5">
                        <MarkdownRenderer content={opt.teksOpsi} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Essay Input Box */}
            {currentQ.tipeSoal === "esai" && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Ketikkan Jawaban Analisis / Penjelasan Anda:
                </label>
                <textarea
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleSelectAnswer(e.target.value)}
                  rows={6}
                  placeholder="Tuliskan langkah pengerjaan atau uraian penjelasan Anda secara rinci..."
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm text-slate-900"
                />
              </div>
            )}

            {/* Navigation Bottom Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
              <button
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Soal Sebelumnya</span>
              </button>

              <div className="flex items-center gap-2">
                {currentIdx < activeQuestions.length - 1 ? (
                  <button
                    onClick={() =>
                      setCurrentIdx((prev) =>
                        Math.min(activeQuestions.length - 1, prev + 1)
                      )
                    }
                    className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <span>Soal Selanjutnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <span>Kumpulkan Kuis</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/90 shadow-xl space-y-5 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                  Navigasi Soal (Palette)
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {answeredCount}/{activeQuestions.length} Terjawab
              </span>
            </div>

            {/* Grid of Question Number Badges */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
              {activeQuestions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isCurrent = currentIdx === idx;
                const isFlag = Boolean(flagged[q.id]);

                let bgClasses = "bg-slate-100 text-slate-700 border-slate-200";
                if (isCurrent) {
                  bgClasses = "ring-2 ring-blue-600 border-blue-600 font-black text-blue-600 bg-blue-50";
                } else if (isFlag) {
                  bgClasses = "bg-amber-400 text-slate-900 border-amber-500 font-bold";
                } else if (isAnswered) {
                  bgClasses = "bg-[#0F172A] text-white border-slate-900 font-bold";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded-2xl border flex items-center justify-center text-xs transition cursor-pointer ${bgClasses}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Palette Legend */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#0F172A]" />
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-400" />
                <span>Ragu-ragu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-200" />
                <span>Belum Dijawab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-blue-50 border-2 border-blue-600" />
                <span>Soal Aktif</span>
              </div>
            </div>

            {/* Big Finish Button */}
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Kumpulkan Ujian</span>
            </button>
          </div>
        </div>
      </main>

      {/* 3. CONFIRMATION SUBMIT MODAL */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="saas-modal rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl bg-white space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-[#0F172A]">
                Konfirmasi Kumpulkan Kuis?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kamu telah menjawab <b>{answeredCount}</b> dari total <b>{activeQuestions.length}</b> soal. Jawaban akan dinilai otomatis dan poin belajar akan langsung ditambahkan ke akunmu.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cek Ulang
              </button>
              <button
                onClick={handleFinishExam}
                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition shadow-md cursor-pointer"
              >
                Ya, Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SOCRATIC AI ASSISTANT MODAL / DRAWER */}
      {isAiOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[580px] animate-in fade-in slide-in-from-bottom-4 duration-200 text-slate-900">
          {/* Header */}
          <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight">Teman Belajar AI ({mapel})</h4>
                <p className="text-[10px] text-slate-300">Teman diskusi asik buat bedah soal tanpa bocorin jawaban</p>
              </div>
            </div>

            <button
              onClick={() => setIsAiOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-bold p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Question Focus Banner with Quick Switcher */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100/90 px-3.5 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="shrink-0 font-extrabold px-2 py-0.5 rounded-lg bg-blue-600 text-white text-[10px] tracking-wide">
                Soal #{currentIdx + 1}
              </span>
              <span className="truncate text-slate-700 font-medium text-[11px]" title={currentQ?.pertanyaan}>
                {currentQ?.pertanyaan.replace(/^\d+\.\s*/, "").slice(0, 60)}...
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-slate-700 text-[10px] font-bold cursor-pointer"
                title="Pindah ke Soal Sebelumnya"
              >
                ◀
              </button>
              <button
                type="button"
                disabled={currentIdx === activeQuestions.length - 1}
                onClick={() => setCurrentIdx((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-slate-700 text-[10px] font-bold cursor-pointer"
                title="Pindah ke Soal Selanjutnya"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Messages (Scoped to Current Active Question) */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3 max-h-[330px] bg-slate-50 text-xs">
            {currentQuestionMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white ml-6 rounded-tr-xs"
                    : "bg-white text-slate-800 mr-6 border border-slate-200 shadow-2xs rounded-tl-xs"
                }`}
              >
                <MarkdownRenderer content={msg.text} />
              </div>
            ))}

            {isAiLoading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs italic p-2.5 bg-white rounded-xl border border-slate-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Teman AI lagi nyiapin tips asik buat Soal #{currentIdx + 1}...</span>
              </div>
            )}
          </div>

          {/* Quick Socratic Prompt Buttons (Targeted to Active Question - Peer Tone) */}
          <div className="px-3 py-2 bg-slate-100/90 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              type="button"
              onClick={() =>
                handleSendAiMessage(
                  `Yuk kasih tips konsep awal buat Soal #${currentIdx + 1} ini tanpa bocorin jawabannya ya!`
                )
              }
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 whitespace-nowrap transition cursor-pointer font-medium shadow-2xs"
            >
              💡 Tips Soal #{currentIdx + 1}
            </button>
            <button
              type="button"
              onClick={() =>
                handleSendAiMessage(
                  `Apa kata kunci penting yang diuji di Soal #${currentIdx + 1} ini?`
                )
              }
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 whitespace-nowrap transition cursor-pointer font-medium shadow-2xs"
            >
              🔍 Kata Kunci
            </button>
            <button
              type="button"
              onClick={() =>
                handleSendAiMessage(
                  `Gimana cara menganalisis dan mengeliminasi pilihan jawaban di Soal #${currentIdx + 1} ini?`
                )
              }
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 whitespace-nowrap transition cursor-pointer font-medium shadow-2xs"
            >
              🪜 Cara Eliminasi Opsi
            </button>
            <button
              type="button"
              onClick={() =>
                handleSendAiMessage(
                  `Ada jebakan atau hal yang perlu diwaspadai nggak di soal ini?`
                )
              }
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 whitespace-nowrap transition cursor-pointer font-medium shadow-2xs"
            >
              ⚠️ Ada Jebakan Nggak?
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendAiMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder={`Tanya atau diskusikan Soal #${currentIdx + 1} ke teman AI...`}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900"
            />
            <button
              type="submit"
              disabled={isAiLoading || !inputMsg.trim()}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
