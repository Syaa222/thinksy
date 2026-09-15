"use client";

import { useState, useEffect } from "react";
import MarkdownRenderer from "../materi/MarkdownRenderer";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  ArrowLeft,
  Sparkles,
  FileDown,
} from "lucide-react";
import Link from "next/link";
import TutorChat from "../tutor/TutorChat";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";

interface Question {
  id: string;
  pertanyaan: string;
  tipeSoal: "pilihan_ganda" | "esai";
  opsiSoal?: { id: string; teksOpsi: string }[];
}

interface SessionQuizClientProps {
  sesiId: string;
  jenisSesi: string;
  judulBab: string;
  soalList: Question[];
  namaSiswa?: string;
}

export default function SessionQuizClient({
  sesiId,
  jenisSesi,
  judulBab,
  soalList,
  namaSiswa,
}: SessionQuizClientProps) {
  const hasAI = jenisSesi.toLowerCase() === "latihan" || jenisSesi.toLowerCase() === "eksplorasi";
  const { broadcastEvent } = useRealtimeDashboard();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jawabanState, setJawabanState] = useState<{
    [soalId: string]: { opsiDipilihId?: string; jawabanTeks?: string };
  }>({});
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [resultData, setResultData] = useState<{
    skorAkhir: number;
    detailEvaluasi: any[];
  } | null>(null);

  const handleDownloadPDF = () => {
    if (!resultData) return;
    setDownloadingPdf(true);

    try {
      const tanggal = new Date().toLocaleDateString("id-ID", {
        day: "2-digit", month: "long", year: "numeric",
      });

      const soalRows = soalList
        .map((q, idx) => {
          const evalItem = resultData.detailEvaluasi.find((e: any) => e.soalId === q.id);
          const isBenar = evalItem?.isBenar;
          const nilai = evalItem?.nilai ?? 0;
          const umpanBalik = evalItem?.umpanBalik ?? "";
          const jawabanSiswa = jawabanState[q.id]?.jawabanTeks
            || (q.opsiSoal?.find((o) => o.id === jawabanState[q.id]?.opsiDipilihId)?.teksOpsi)
            || "-";

          return `
            <div class="soal-item ${isBenar ? "benar" : "salah"}">
              <div class="soal-header">
                <span class="soal-badge">Soal #${idx + 1} &bull; ${q.tipeSoal === "pilihan_ganda" ? "Pilihan Ganda" : "Esai"}</span>
                <span class="nilai-badge ${isBenar ? "benar" : "salah"}">
                  ${isBenar ? "✓ Benar" : "✗ Perlu Perbaikan"} &mdash; Nilai: ${nilai}
                </span>
              </div>
              <p class="pertanyaan">${q.pertanyaan.replace(/\*\*/g, "").replace(/\$/g, "")}</p>
              <p class="jawaban-siswa"><strong>Jawaban:</strong> ${jawabanSiswa}</p>
              ${umpanBalik ? `<div class="umpan-balik"><strong>Umpan Balik AI:</strong><br>${umpanBalik}</div>` : ""}
            </div>`;
        })
        .join("");

      const skorColor =
        resultData.skorAkhir >= 70 ? "#16a34a"
        : resultData.skorAkhir >= 50 ? "#d97706"
        : "#dc2626";

      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Laporan Hasil ${jenisSesi} - thinksy</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #1e293b; background: #fff; padding: 32px; }
    .header { text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; margin-bottom: 24px; }
    .brand { font-size: 13px; font-weight: 700; color: #193446; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
    .title { font-size: 22px; font-weight: 800; color: #193446; }
    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
    .skor-box { display: inline-block; margin-top: 16px; padding: 12px 32px; border: 2px solid #e2e8f0; border-radius: 12px; }
    .skor-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .skor-value { font-size: 36px; font-weight: 800; color: ${skorColor}; }
    .tanggal { font-size: 11px; color: #94a3b8; margin-top: 8px; }
    .section-title { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .soal-item { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 14px; page-break-inside: avoid; }
    .soal-item.benar { border-left: 4px solid #16a34a; }
    .soal-item.salah { border-left: 4px solid #dc2626; }
    .soal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .soal-badge { font-size: 10px; font-weight: 700; color: #193446; background: #e2e8f0; padding: 3px 8px; border-radius: 6px; }
    .nilai-badge { font-size: 10px; font-weight: 700; }
    .nilai-badge.benar { color: #16a34a; }
    .nilai-badge.salah { color: #dc2626; }
    .pertanyaan { font-size: 13px; color: #334155; margin-bottom: 8px; line-height: 1.6; }
    .jawaban-siswa { font-size: 12px; color: #475569; margin-bottom: 8px; }
    .umpan-balik { font-size: 11px; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; line-height: 1.6; }
    .footer { text-align: center; margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    .meta-table tr { border-bottom: 1px solid #f1f5f9; }
    .meta-label { padding: 7px 12px 7px 0; color: #64748b; font-weight: 600; width: 130px; }
    .meta-value { padding: 7px 0; color: #1e293b; font-weight: 600; }
    @media print {
      body { padding: 20px; }
      @page { margin: 15mm; size: A4 portrait; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">thinksy &mdash; Platform Belajar Matematika</div>
    <div class="title">Laporan Hasil ${jenisSesi.toUpperCase()}</div>
    <div class="subtitle">${judulBab}</div>
    <div class="skor-box">
      <div class="skor-label">Skor Akhir</div>
      <div class="skor-value">${resultData.skorAkhir} / 100</div>
    </div>
  </div>

  <table class="meta-table">
    <tr>
      <td class="meta-label">Nama Siswa</td>
      <td class="meta-value">${namaSiswa || "—"}</td>
    </tr>
    <tr>
      <td class="meta-label">Jenis Sesi</td>
      <td class="meta-value">${jenisSesi}</td>
    </tr>
    <tr>
      <td class="meta-label">Bab</td>
      <td class="meta-value">${judulBab}</td>
    </tr>
    <tr>
      <td class="meta-label">Tanggal</td>
      <td class="meta-value">${tanggal}</td>
    </tr>
    <tr>
      <td class="meta-label">Skor Akhir</td>
      <td class="meta-value" style="font-weight:800;color:${skorColor}">${resultData.skorAkhir} / 100</td>
    </tr>
  </table>

  <div class="section-title">Ulasan &amp; Penilaian Otomatis</div>
  ${soalRows}

  <div class="footer">
    Dokumen ini digenerate otomatis oleh thinksy &bull; Laporan Hasil Belajar Siswa
  </div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };<\/script>
</body>
</html>`;

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Popup diblokir browser. Izinkan popup untuk halaman ini lalu coba lagi.");
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Gagal membuat laporan PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const isTimedSession =
    jenisSesi.toLowerCase() === "kuis" ||
    jenisSesi.toLowerCase() === "assessment" ||
    jenisSesi.toLowerCase() === "asesmen";

  const DURATION_SECONDS = 15 * 60;
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(DURATION_SECONDS);

  // Timer effect
  useEffect(() => {
    if (resultData || submitting) return;

    if (isTimedSession) {
      const interval = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      const interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resultData, submitting, isTimedSession]);

  const currentQuestion = soalList[currentIndex];

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (opsiId: string) => {
    if (!currentQuestion) return;
    setJawabanState((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        opsiDipilihId: opsiId,
      },
    }));
  };

  const handleTextChange = (text: string) => {
    if (!currentQuestion) return;
    setJawabanState((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        jawabanTeks: text,
      },
    }));
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const payloadAnswers = soalList.map((q) => ({
        soalId: q.id,
        opsiDipilihId: jawabanState[q.id]?.opsiDipilihId,
        jawabanTeks: jawabanState[q.id]?.jawabanTeks,
      }));

      const res = await fetch("/api/quiz/grade-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sesiId,
          jawabanList: payloadAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirimkan kuis.");
      }

      setResultData({
        skorAkhir: data.skorAkhir,
        detailEvaluasi: data.detailEvaluasi || [],
      });

      // Broadcast event ke antrean Dashboard Guru secara real-time
      try {
        await broadcastEvent("NEW_ESSAY_SUBMISSION", {
          sesiId,
          skorAkhir: data.skorAkhir,
        });
      } catch (broadcastErr) {
        console.warn("[BROADCAST ERROR]", broadcastErr);
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat mengumpulkan kuis.");
    } finally {
      setSubmitting(false);
    }
  };

  // Summary View
  if (resultData) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex items-center justify-center">
        <div id="laporan-hasil-pdf" className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-8">
          {/* Header Result */}
          <div className="text-center space-y-3 border-b border-slate-100 pb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#E9C77B]/20 border border-[#E9C77B]/40 text-[#193446]">
              <Award className="w-8 h-8 text-[#193446]" />
            </div>
            <h1 className="text-2xl font-bold text-[#193446]">
              Laporan Hasil {jenisSesi.toUpperCase()}
            </h1>
            <p className="text-xs text-slate-500">{judulBab}</p>

            <div className="mt-4 inline-block bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase">
                Skor Akhir Siswa
              </div>
              <div
                className={`text-4xl font-extrabold mt-1 ${
                  resultData.skorAkhir >= 70
                    ? "text-emerald-600"
                    : resultData.skorAkhir >= 50
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {resultData.skorAkhir} / 100
              </div>
            </div>
          </div>

          {/* Breakdown Items */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Ulasan & Penilaian Otomatis:
            </h2>

            <div className="space-y-4">
              {soalList.map((q, idx) => {
                const evalItem = resultData.detailEvaluasi.find(
                  (e: any) => e.soalId === q.id
                );
                const isBenar = evalItem?.isBenar;

                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#193446] bg-slate-200 px-2.5 py-1 rounded-md">
                        Soal #{idx + 1} ({q.tipeSoal.toUpperCase()})
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        {isBenar ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Benar (Nilai: {evalItem?.nilai})
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Perlu Perbaikan (Nilai: {evalItem?.nilai || 0})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-slate-800 font-medium">
                      <MarkdownRenderer content={q.pertanyaan} />
                    </div>

                    {/* AI Feedback */}
                    {evalItem?.umpanBalik && (
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                        <div className="font-bold text-[#193446] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#E9C77B]" />
                          Umpan Balik AI:
                        </div>
                        <p>{evalItem.umpanBalik}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition disabled:opacity-60 cursor-pointer"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Download Laporan PDF</span>
                </>
              )}
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#193446] text-[#E9C77B] font-bold text-sm shadow-md hover:bg-[#132836] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3.5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#193446] bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </Link>

          <div className="flex items-center gap-4">
            {isTimedSession ? (
              <div className="flex items-center gap-1.5 bg-amber-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-mono font-extrabold shadow-sm border border-amber-400">
                <Clock className="w-4 h-4 text-white animate-pulse" />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-[#193446] border border-slate-200">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>{formatTimer(secondsElapsed)}</span>
              </div>
            )}

            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-[#193446] hover:bg-[#132836] text-[#E9C77B] px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menilai...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Kumpulkan Jawaban</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className={`mx-auto px-4 sm:px-6 pt-6 ${hasAI ? "max-w-7xl" : "max-w-3xl"}`}>
        <div className={hasAI ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" : "space-y-6"}>
          {/* Main Question Column */}
          <div className={hasAI ? "lg:col-span-7 space-y-6" : "space-y-6"}>
            {/* Navigation Indicator Dots */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-3">
                Daftar Soal ({soalList.length}):
              </span>
              <div className="flex items-center gap-2">
                {soalList.map((q, idx) => {
                  const isAnswered =
                    Boolean(jawabanState[q.id]?.opsiDipilihId) ||
                    Boolean(jawabanState[q.id]?.jawabanTeks?.trim());
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        isCurrent
                          ? "bg-[#193446] text-[#E9C77B] ring-2 ring-[#193446]/30 shadow-sm"
                          : isAnswered
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Card */}
            {currentQuestion ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-[#193446] bg-[#193446]/10 px-3 py-1 rounded-full">
                    Soal #{currentIndex + 1} dari {soalList.length} (
                    {currentQuestion.tipeSoal === "pilihan_ganda"
                      ? "Pilihan Ganda"
                      : "Esai"}
                    )
                  </span>
                </div>

                <div className="text-slate-900 font-medium">
                  <MarkdownRenderer content={currentQuestion.pertanyaan} />
                </div>

                {/* Answer Input depending on Type */}
                {currentQuestion.tipeSoal === "pilihan_ganda" ? (
                  <div className="space-y-3 pt-2">
                    {currentQuestion.opsiSoal?.map((opsi, oIdx) => {
                      const isSelected =
                        jawabanState[currentQuestion.id]?.opsiDipilihId === opsi.id;
                      const labelOption = String.fromCharCode(65 + oIdx);

                      return (
                        <button
                          key={opsi.id}
                          onClick={() => handleSelectOption(opsi.id)}
                          className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer ${
                            isSelected
                              ? "border-[#193446] bg-[#193446]/5 text-[#193446] font-bold shadow-sm"
                              : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected
                                ? "bg-[#193446] text-[#E9C77B]"
                                : "bg-white border border-slate-200 text-slate-600"
                            }`}
                          >
                            {labelOption}
                          </div>
                          <div className="flex-1">
                            <MarkdownRenderer content={opsi.teksOpsi} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Tuliskan Jawaban & Langkah Penyelesaian Esai:
                    </label>
                    <textarea
                      rows={6}
                      value={jawabanState[currentQuestion.id]?.jawabanTeks || ""}
                      onChange={(e) => handleTextChange(e.target.value)}
                      placeholder="Ketik uraian jawaban esai di sini..."
                      className="w-full p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#193446] bg-slate-50/50"
                    />
                  </div>
                )}

                {/* Bottom Question Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  <button
                    onClick={() =>
                      setCurrentIndex((prev) =>
                        Math.min(soalList.length - 1, prev + 1)
                      )
                    }
                    disabled={currentIndex === soalList.length - 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#193446] text-white text-xs font-bold hover:bg-[#132836] disabled:opacity-40 cursor-pointer"
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                Tidak ada soal untuk sesi ini.
              </div>
            )}
          </div>

          {/* AI Column */}
          {hasAI && (
            <div className="lg:col-span-5 sticky top-20">
              <TutorChat
                key={currentQuestion?.id}
                sesiId={sesiId}
                soalId={currentQuestion?.id}
                materiJudul={`Soal #${currentIndex + 1} (${currentQuestion?.tipeSoal === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Esai'})`}
                materiKonten={currentQuestion?.pertanyaan}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
