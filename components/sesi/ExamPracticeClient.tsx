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

interface ExamQuestion {
  id: string;
  pertanyaan: string;
  tipeSoal: "pilihan_ganda" | "esai";
  opsiSoal?: Array<{ id: string; teksOpsi: string }>;
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

  // Socratic AI Assistant Chat Modal State (Always Available)
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<
    Array<{ sender: "user" | "tutor"; text: string }>
  >([
    {
      sender: "tutor",
      text: `Halo ${namaSiswa}! Saya THINKSY AI Sokratik Tutor (${mapel}). Saya siap memberikan petunjuk konsep & memandu langkah berpikirmu tanpa memberi tahu jawaban langsung. Ada yang ingin kamu tanyakan mengenai soal ini?`,
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSendAiMessage = async (presetPrompt?: string) => {
    const textToSend = (presetPrompt || inputMsg).trim();
    if (!textToSend || isAiLoading || !currentQ) return;

    setInputMsg("");
    setAiMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sesiId,
          soalId: currentQ.id,
          message: textToSend,
          materiJudul: `${judulSesi} - Soal #${currentIdx + 1}`,
          materiKonten: `PERTANYAAN: ${currentQ.pertanyaan}\n\nOPSI JAWABAN: ${currentQ.opsiSoal?.map((o) => o.teksOpsi).join(", ") || "Esai"}\n\nATURAN PENTING: Bimbing siswa dengan prinsip Sokratik (berikan petunjuk, pertanyaan pemantik, analogi, atau langkah awal berpikir). JANGAN PERNAH memberikan jawaban huruf pilihan ganda secara langsung!`,
        }),
      });
      const data = await response.json();
      setAiMessages((prev) => [
        ...prev,
        {
          sender: "tutor",
          text:
            data.reply ||
            "Mari kita analisis konsep dasarnya bersama-sama. Langkah awal apa yang sudah kamu pahami dari soal ini?",
        },
      ]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        {
          sender: "tutor",
          text: "Coba tinjau kembali data atau besaran yang diketahui pada soal ini. Apa rumus atau konsep utama yang bisa kita gunakan?",
        },
      ]);
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
            {/* AI Sokratik Trigger Button (Always Visible) */}
            <button
              onClick={() => setIsAiOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Tutor AI Sokratik</span>
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
                  onClick={() => setIsAiOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Minta Petunjuk Sokratik</span>
                  <span className="sm:hidden">Petunjuk</span>
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
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[550px] animate-in fade-in slide-in-from-bottom-4 duration-200 text-slate-900">
          {/* Header */}
          <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-black">Tutor AI Sokratik ({mapel})</h4>
                <p className="text-[10px] text-slate-300">Membimbing konsep tanpa membocorkan jawaban</p>
              </div>
            </div>

            <button
              onClick={() => setIsAiOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3 max-h-[350px] bg-slate-50 text-xs">
            {aiMessages.map((msg, i) => (
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
              <div className="flex items-center gap-2 text-slate-500 text-xs italic p-2 bg-white rounded-xl border border-slate-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Tutor Sokratik sedang merumuskan petunjuk...</span>
              </div>
            )}
          </div>

          {/* Quick Socratic Prompt Buttons */}
          <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => handleSendAiMessage("Berikan petunjuk konsep awal untuk soal nomor ini tanpa memberikan jawaban langsung.")}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 whitespace-nowrap transition"
            >
              💡 Petunjuk Konsep
            </button>
            <button
              onClick={() => handleSendAiMessage("Apa rumus atau istilah kunci yang perlu saya ingat untuk menyelesaikan soal ini?")}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 whitespace-nowrap transition"
            >
              🔍 Rumus / Istilah Kunci
            </button>
            <button
              onClick={() => handleSendAiMessage("Bagaimana langkah pertama menganalisis soal ini?")}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 whitespace-nowrap transition"
            >
              ❓ Langkah Awal
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
              placeholder="Tanyakan konsep soal ini ke AI Sokratik..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900"
            />
            <button
              type="submit"
              disabled={isAiLoading || !inputMsg.trim()}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
