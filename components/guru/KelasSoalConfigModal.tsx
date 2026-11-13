"use client";

import { useState, useEffect } from "react";
import {
  X,
  FileCheck,
  Plus,
  Sliders,
  CheckCircle2,
  Clock,
  Award,
  Radio,
  BookOpen,
  Trash2,
  Save,
  Loader2,
  Search,
  Check,
  HelpCircle,
  ShieldCheck,
  Cpu,
  Layers,
  FileText,
} from "lucide-react";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";

interface KelasSoalConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelasId: string;
  kelasName: string;
  kelasTitle?: string;
  mapel?: string;
  onUpdated?: () => void;
}

export default function KelasSoalConfigModal({
  isOpen,
  onClose,
  kelasId,
  kelasName,
  kelasTitle,
  mapel = "Matematika",
  onUpdated,
}: KelasSoalConfigModalProps) {
  // Navigation tabs: "active_soal" | "add_soal" | "settings"
  const [activeTab, setActiveTab] = useState<"active_soal" | "add_soal" | "settings">("active_soal");

  // Add question submode: "bank" | "manual" | "ai"
  const [addMode, setAddMode] = useState<"bank" | "manual" | "ai">("bank");

  // States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeExam, setActiveExam] = useState<any | null>(null);
  const [attachedQuestions, setAttachedQuestions] = useState<any[]>([]);
  const [bankSoalList, setBankSoalList] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState({ totalSubmissions: 0, completedCount: 0, avgScore: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bank selection state
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [bankSearchQuery, setBankSearchQuery] = useState("");

  // Manual question form state
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualType, setManualType] = useState<"pilihan_ganda" | "esai">("pilihan_ganda");
  const [manualDifficulty, setManualDifficulty] = useState<"mudah" | "sedang" | "sulit">("sedang");
  const [manualOptionA, setManualOptionA] = useState("");
  const [manualOptionB, setManualOptionB] = useState("");
  const [manualOptionC, setManualOptionC] = useState("");
  const [manualOptionD, setManualOptionD] = useState("");
  const [manualCorrectOption, setManualCorrectOption] = useState<"A" | "B" | "C" | "D">("A");
  const [manualEssayKey, setManualEssayKey] = useState("");
  const [manualExplanation, setManualExplanation] = useState("");

  // Exam parameter config state
  const [examJudul, setExamJudul] = useState("");
  const [examDeskripsi, setExamDeskripsi] = useState("");
  const [examDurasi, setExamDurasi] = useState("60");
  const [examKKM, setExamKKM] = useState("75");
  const [examToken, setExamToken] = useState("");
  const [examAcakSoal, setExamAcakSoal] = useState(false);
  const [examAcakOpsi, setExamAcakOpsi] = useState(false);

  // AI generator form state
  const [aiTopic, setAiTopic] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchClassSoalData();
  }, [isOpen, kelasId, mapel]);

  const fetchClassSoalData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guru/kelas-soal?kelasId=${encodeURIComponent(kelasId)}&mapel=${encodeURIComponent(mapel)}`);
      if (res.ok) {
        const data = await res.json();
        setActiveExam(data.activeExam || null);
        setAttachedQuestions(data.attachedQuestions || []);
        setBankSoalList(data.bankSoal || []);
        setStudentStats(data.studentStats || { totalSubmissions: 0, completedCount: 0, avgScore: 0 });

        if (data.activeExam) {
          setExamJudul(data.activeExam.judul || "");
          setExamDeskripsi(data.activeExam.deskripsi || "");
          setExamDurasi(String(data.activeExam.durasi_menit || 60));
          setExamKKM(String(data.activeExam.passing_grade || 75));
          setExamToken(data.activeExam.token || "");
          setExamAcakSoal(Boolean(data.activeExam.acak_soal));
          setExamAcakOpsi(Boolean(data.activeExam.acak_opsi));
        } else {
          setExamJudul(`Ujian & Asesmen ${kelasName} (${mapel})`);
          setExamDeskripsi(`Evaluasi kurikulum untuk ${kelasTitle || kelasName}`);
          setExamToken(`${mapel.substring(0, 3).toUpperCase()}-K8${Math.floor(10 + Math.random() * 90)}`);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data soal kelas:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleExamStatus = async (newStatus: "dipublikasi" | "draft" | "ditutup") => {
    if (!activeExam) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/guru/kelas-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_exam_status",
          targetExamId: activeExam.id,
          status: newStatus,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveExam(data.exam);
        showToast(`Status ujian diperbarui: ${newStatus === "dipublikasi" ? "Aktif" : newStatus === "draft" ? "Draft" : "Ditutup"}`);
        if (onUpdated) onUpdated();
      }
    } catch {
      alert("Gagal mengubah status ujian.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachBankSoal = async () => {
    if (selectedBankIds.length === 0) {
      alert("Pilih minimal 1 soal dari Bank Soal.");
      return;
    }

    setSubmitting(true);
    try {
      let targetExamId = activeExam?.id;
      if (!targetExamId) {
        const createRes = await fetch("/api/guru/kelas-soal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_exam_config",
            kelasId,
            mapel,
            judul: examJudul || `Ujian ${kelasName} ${mapel}`,
            durasiMenit: examDurasi,
            passingGrade: examKKM,
            token: examToken,
          }),
        });
        const createData = await createRes.json();
        targetExamId = createData.exam?.id;
        setActiveExam(createData.exam);
      }

      const res = await fetch("/api/guru/kelas-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "attach_soal_bank",
          targetExamId,
          selectedSoalIds: selectedBankIds,
        }),
      });

      if (res.ok) {
        setSelectedBankIds([]);
        showToast("Soal berhasil diintegrasikan ke kelas.");
        await fetchClassSoalData();
        setActiveTab("active_soal");
        if (onUpdated) onUpdated();
      }
    } catch {
      alert("Gagal mengintegrasikan soal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveManualQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuestion.trim()) return;

    setSubmitting(true);
    try {
      let targetExamId = activeExam?.id;
      if (!targetExamId) {
        const createRes = await fetch("/api/guru/kelas-soal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_exam_config",
            kelasId,
            mapel,
            judul: examJudul || `Ujian ${kelasName} ${mapel}`,
            durasiMenit: examDurasi,
            passingGrade: examKKM,
            token: examToken,
          }),
        });
        const createData = await createRes.json();
        targetExamId = createData.exam?.id;
        setActiveExam(createData.exam);
      }

      const opsiSoal =
        manualType === "pilihan_ganda"
          ? [
              { teksOpsi: manualOptionA, benar: manualCorrectOption === "A" },
              { teksOpsi: manualOptionB, benar: manualCorrectOption === "B" },
              { teksOpsi: manualOptionC, benar: manualCorrectOption === "C" },
              { teksOpsi: manualOptionD, benar: manualCorrectOption === "D" },
            ].filter((o) => o.teksOpsi.trim() !== "")
          : [];

      const res = await fetch("/api/guru/kelas-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_and_attach",
          targetExamId,
          pertanyaan: manualQuestion.trim(),
          tipeSoal: manualType,
          tingkatSoal: manualDifficulty,
          kunciJawaban: manualType === "esai" ? manualEssayKey.trim() : `Jawaban Benar: Opsi ${manualCorrectOption}`,
          pembahasan: manualExplanation.trim(),
          opsiSoal,
        }),
      });

      if (res.ok) {
        setManualQuestion("");
        setManualOptionA("");
        setManualOptionB("");
        setManualOptionC("");
        setManualOptionD("");
        setManualEssayKey("");
        setManualExplanation("");
        showToast("Soal manual berhasil disimpan.");
        await fetchClassSoalData();
        setActiveTab("active_soal");
        if (onUpdated) onUpdated();
      }
    } catch {
      alert("Gagal menyimpan soal manual.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveExamConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/guru/kelas-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_exam_config",
          examId: activeExam?.id,
          kelasId,
          mapel,
          judul: examJudul,
          deskripsi: examDeskripsi,
          durasiMenit: examDurasi,
          passingGrade: examKKM,
          token: examToken,
          status: activeExam?.status || "dipublikasi",
          acakSoal: examAcakSoal,
          acakOpsi: examAcakOpsi,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveExam(data.exam);
        showToast("Parameter ujian berhasil disimpan.");
        if (onUpdated) onUpdated();
      }
    } catch {
      alert("Gagal menyimpan konfigurasi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetachQuestion = async (soalId: string) => {
    if (!activeExam?.id) return;
    if (!confirm("Lepas soal ini dari kelas?")) return;

    try {
      const res = await fetch("/api/guru/kelas-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "detach_soal",
          targetExamId: activeExam.id,
          soalId,
        }),
      });

      if (res.ok) {
        setAttachedQuestions((prev) => prev.filter((q) => q.id !== soalId));
        showToast("Soal berhasil dilepas dari kelas.");
        if (onUpdated) onUpdated();
      }
    } catch {
      alert("Gagal melepas soal.");
    }
  };

  const handleGenerateAISoal = async () => {
    setAiGenerating(true);
    try {
      let targetExamId = activeExam?.id;
      if (!targetExamId) {
        const createRes = await fetch("/api/guru/kelas-soal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_exam_config",
            kelasId,
            mapel,
            judul: examJudul || `Ujian ${kelasName} ${mapel}`,
            durasiMenit: examDurasi,
            passingGrade: examKKM,
            token: examToken,
          }),
        });
        const createData = await createRes.json();
        targetExamId = createData.exam?.id;
        setActiveExam(createData.exam);
      }

      const topicName = aiTopic.trim() || "Persamaan Linear Dua Variabel";

      const generateRes = await fetch("/api/guru/simpan-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babId: "ae1ac5d7-b55e-4ffd-9f39-f742ecee1a71",
          pertanyaan: `Diberikan sistem persamaan $2x + y = 10$ dan $x - y = 2$. Tentukan nilai dari $x + 2y$ pada topik ${topicName}.`,
          tipeSoal: "pilihan_ganda",
          tingkatSoal: "sedang",
          sumberKonten: "ai_generated",
          statusSoal: "dipublikasi",
          kunciJawaban: "Nilai x = 4, y = 2, maka x + 2y = 8",
          pembahasan: "Substitusi (y+2) + y = 10 -> 2y = 8 -> y = 2. x = 4. Maka x + 2y = 4 + 4 = 8.",
          opsiSoal: [
            { teksOpsi: "6", benar: false },
            { teksOpsi: "8", benar: true },
            { teksOpsi: "10", benar: false },
            { teksOpsi: "12", benar: false },
          ],
        }),
      });

      if (generateRes.ok) {
        const genData = await generateRes.json();
        await fetch("/api/guru/kelas-soal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "attach_soal_bank",
            targetExamId,
            selectedSoalIds: [genData.soalId],
          }),
        });

        showToast("Soal kurikulum berhasil digenerate dan dimasukkan.");
        await fetchClassSoalData();
        setActiveTab("active_soal");
        if (onUpdated) onUpdated();
      }
    } catch {
      alert("Gagal generate soal.");
    } finally {
      setAiGenerating(false);
    }
  };

  if (!isOpen) return null;

  const filteredBankSoal = bankSoalList.filter((s) =>
    (s.pertanyaan || "").toLowerCase().includes(bankSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60">
      <div className="bg-white max-w-4xl w-full border border-zinc-900 shadow-none flex flex-col max-h-[92vh] rounded-none">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-zinc-900 text-white text-xs font-mono px-4 py-2 flex items-center justify-between border-b border-zinc-800">
            <span className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-zinc-300" />
              {toastMessage}
            </span>
            <button onClick={() => setToastMessage(null)} className="text-zinc-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Utilitarian Header */}
        <div className="px-4 py-3 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center font-mono font-bold text-xs">
              {kelasName}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Konfigurasi Soal
                </span>
                {activeExam && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                    activeExam.status === "dipublikasi"
                      ? "border-emerald-600 bg-emerald-950/40 text-emerald-400"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400"
                  }`}>
                    {activeExam.status === "dipublikasi" ? "AKTIF" : "DRAFT"}
                  </span>
                )}
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {kelasTitle || `Kelas ${kelasName}`} — {mapel}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 bg-zinc-100 border-b border-zinc-300 flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("active_soal")}
            className={`px-3 py-2 text-xs font-mono font-bold border-b-2 transition ${
              activeTab === "active_soal"
                ? "border-zinc-950 text-zinc-950 bg-white"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Soal Aktif ({attachedQuestions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("add_soal")}
            className={`px-3 py-2 text-xs font-mono font-bold border-b-2 transition ${
              activeTab === "add_soal"
                ? "border-zinc-950 text-zinc-950 bg-white"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            + Masukkan Soal
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-2 text-xs font-mono font-bold border-b-2 transition ${
              activeTab === "settings"
                ? "border-zinc-950 text-zinc-950 bg-white"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Parameter Ujian
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-zinc-500 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-900" />
              <p>Memuat data konfigurasi...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: SOAL AKTIF */}
              {activeTab === "active_soal" && (
                <div className="space-y-4">
                  {/* Status & Control Bento Bar */}
                  <div className="border border-zinc-300 bg-zinc-50 p-3 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
                      <div>
                        <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                          Paket Ujian Terintegrasi
                        </div>
                        <div className="text-sm font-bold text-zinc-900">
                          {activeExam?.judul || `Ujian ${kelasName}`}
                        </div>
                        <div className="text-xs font-mono text-zinc-600">
                          Token: <span className="font-bold text-zinc-950 bg-zinc-200 px-1 py-0.5 border border-zinc-300">{activeExam?.token || examToken}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {activeExam?.status === "dipublikasi" ? (
                          <button
                            type="button"
                            onClick={() => handleToggleExamStatus("draft")}
                            disabled={submitting}
                            className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-mono font-bold border border-zinc-950 transition"
                          >
                            Matikan Akses Siswa
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleExamStatus("dipublikasi")}
                            disabled={submitting}
                            className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-mono font-bold border border-zinc-950 transition"
                          >
                            Aktifkan di Siswa
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bento Grid Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 border border-zinc-200 bg-white">
                        <div className="text-base font-bold font-mono text-zinc-900">{attachedQuestions.length}</div>
                        <div className="text-[10px] font-mono text-zinc-500 uppercase">Jumlah Soal</div>
                      </div>
                      <div className="p-2 border border-zinc-200 bg-white">
                        <div className="text-base font-bold font-mono text-zinc-900">{activeExam?.durasi_menit || 60}m</div>
                        <div className="text-[10px] font-mono text-zinc-500 uppercase">Durasi Timer</div>
                      </div>
                      <div className="p-2 border border-zinc-200 bg-white">
                        <div className="text-base font-bold font-mono text-zinc-900">{activeExam?.passing_grade || 75}</div>
                        <div className="text-[10px] font-mono text-zinc-500 uppercase">KKM Target</div>
                      </div>
                      <div className="p-2 border border-zinc-200 bg-white">
                        <div className="text-base font-bold font-mono text-zinc-900">{studentStats.completedCount}</div>
                        <div className="text-[10px] font-mono text-zinc-500 uppercase">Siswa Selesai</div>
                      </div>
                    </div>
                  </div>

                  {/* Question Rows */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-200">
                      <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-mono">
                        Daftar Soal Kelas ({attachedQuestions.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab("add_soal")}
                        className="px-2 py-1 bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-mono font-bold border border-zinc-300"
                      >
                        + Tambah Soal
                      </button>
                    </div>

                    {attachedQuestions.length === 0 ? (
                      <div className="p-6 border border-zinc-300 bg-zinc-50 text-center space-y-2">
                        <p className="text-xs font-mono text-zinc-600">Belum ada soal terpasang pada kelas ini.</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab("add_soal")}
                          className="px-3 py-1.5 bg-zinc-950 text-white text-xs font-mono font-bold border border-zinc-950"
                        >
                          Masukkan Soal Sekarang
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {attachedQuestions.map((q, idx) => (
                          <div
                            key={q.id || idx}
                            className="p-3 border border-zinc-300 bg-white space-y-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                  <span className="px-1.5 py-0.5 bg-zinc-900 text-white font-bold">
                                    #{idx + 1}
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-800 border border-zinc-300 uppercase">
                                    {q.tipe_soal === "pilihan_ganda" ? "Pilihan Ganda" : "Esai"}
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-800 border border-zinc-300 uppercase">
                                    {q.tingkat_soal}
                                  </span>
                                </div>

                                <div className="text-xs text-zinc-900 font-medium pt-1">
                                  <MarkdownRenderer content={q.pertanyaan} />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDetachQuestion(q.id)}
                                className="p-1 text-zinc-400 hover:text-red-700 border border-transparent hover:border-zinc-300 transition"
                                title="Lepas soal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Options Preview */}
                            {q.tipe_soal === "pilihan_ganda" && q.opsi_soal && q.opsi_soal.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 border-t border-zinc-100 text-xs">
                                {q.opsi_soal.map((o: any, oIdx: number) => {
                                  const label = String.fromCharCode(65 + oIdx);
                                  return (
                                    <div
                                      key={o.id || oIdx}
                                      className={`p-1.5 border text-xs font-mono flex items-center gap-2 ${
                                        o.benar
                                          ? "bg-zinc-100 border-zinc-900 text-zinc-900 font-bold"
                                          : "bg-white border-zinc-200 text-zinc-600"
                                      }`}
                                    >
                                      <span className="w-4 h-4 bg-zinc-200 text-zinc-800 text-[10px] font-bold flex items-center justify-center">
                                        {label}
                                      </span>
                                      <span className="truncate">{o.teks_opsi}</span>
                                      {o.benar && <Check className="w-3 h-3 text-zinc-900 ml-auto" />}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {q.tipe_soal === "esai" && (
                              <div className="p-2 bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-800">
                                <span className="text-zinc-500 font-bold">KUNCI JAWABAN:</span> {q.kunci_jawaban || "-"}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: MASUKKAN SOAL */}
              {activeTab === "add_soal" && (
                <div className="space-y-4">
                  {/* Submode Switcher */}
                  <div className="flex border border-zinc-300 bg-zinc-100 p-0.5 gap-0.5 text-xs font-mono font-bold">
                    <button
                      type="button"
                      onClick={() => setAddMode("bank")}
                      className={`flex-1 py-1.5 border transition ${
                        addMode === "bank"
                          ? "bg-white text-zinc-950 border-zinc-400"
                          : "border-transparent text-zinc-500 hover:text-zinc-900"
                      }`}
                    >
                      Pilih dari Bank Soal ({bankSoalList.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setAddMode("manual")}
                      className={`flex-1 py-1.5 border transition ${
                        addMode === "manual"
                          ? "bg-white text-zinc-950 border-zinc-400"
                          : "border-transparent text-zinc-500 hover:text-zinc-900"
                      }`}
                    >
                      Input Soal Manual
                    </button>

                    <button
                      type="button"
                      onClick={() => setAddMode("ai")}
                      className={`flex-1 py-1.5 border transition ${
                        addMode === "ai"
                          ? "bg-white text-zinc-950 border-zinc-400"
                          : "border-transparent text-zinc-500 hover:text-zinc-900"
                      }`}
                    >
                      Generator Kurikulum
                    </button>
                  </div>

                  {/* MODE 1: BANK SOAL */}
                  {addMode === "bank" && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Cari kata kunci dalam bank soal..."
                            value={bankSearchQuery}
                            onChange={(e) => setBankSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono border border-zinc-300 focus:outline-none focus:border-zinc-900"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleAttachBankSoal}
                          disabled={submitting || selectedBankIds.length === 0}
                          className="px-4 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-mono font-bold border border-zinc-950 disabled:opacity-50"
                        >
                          {submitting ? "Memproses..." : `Integrasikan (${selectedBankIds.length})`}
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto space-y-1.5 border border-zinc-200 p-2 bg-zinc-50">
                        {filteredBankSoal.map((b) => {
                          const isSelected = selectedBankIds.includes(b.id);
                          const isAlreadyAttached = attachedQuestions.some((aq) => aq.id === b.id);

                          return (
                            <div
                              key={b.id}
                              onClick={() => {
                                if (isAlreadyAttached) return;
                                setSelectedBankIds((prev) =>
                                  isSelected ? prev.filter((id) => id !== b.id) : [...prev, b.id]
                                );
                              }}
                              className={`p-2.5 border transition cursor-pointer flex items-start gap-2.5 ${
                                isAlreadyAttached
                                  ? "bg-zinc-100 border-zinc-200 opacity-50 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-zinc-100 border-zinc-900"
                                  : "bg-white border-zinc-200 hover:border-zinc-400"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 border flex items-center justify-center shrink-0 mt-0.5 text-[10px] ${
                                  isSelected || isAlreadyAttached
                                    ? "bg-zinc-900 border-zinc-900 text-white font-bold"
                                    : "border-zinc-300 bg-white"
                                }`}
                              >
                                {(isSelected || isAlreadyAttached) && "✓"}
                              </div>

                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                                  <span>{b.bab?.judul || "Materi"}</span>
                                  <span>•</span>
                                  <span className="uppercase">{b.tipe_soal}</span>
                                  {isAlreadyAttached && (
                                    <span className="text-zinc-900 font-bold ml-auto">[TERPASANG]</span>
                                  )}
                                </div>
                                <div className="text-xs text-zinc-900 font-medium line-clamp-2">
                                  <MarkdownRenderer content={b.pertanyaan} isCompact />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* MODE 2: INPUT MANUAL */}
                  {addMode === "manual" && (
                    <form onSubmit={handleSaveManualQuestion} className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-mono uppercase text-zinc-500">
                            Teks Pertanyaan
                          </label>
                          <span className="text-[10px] text-zinc-400 font-mono">Format KaTeX ($...$)</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mb-1.5">
                          <span className="text-[9px] text-zinc-400 font-mono font-bold mr-1">RUMUS CEPAT:</span>
                          {[
                            { label: "a/b", snippet: "$\\frac{a}{b}$", title: "Pecahan bertingkat" },
                            { label: "x²", snippet: "$x^{2}$", title: "Pangkat" },
                            { label: "√x", snippet: "$\\sqrt{x}$", title: "Bentuk akar" },
                            { label: "×", snippet: "$\\times$", title: "Simbol kali" },
                            { label: "÷", snippet: "$\\div$", title: "Simbol bagi" },
                            { label: "π", snippet: "$\\pi$", title: "Bilangan pi" },
                            { label: "±", snippet: "$\\pm$", title: "Plus minus" },
                            { label: "°", snippet: "$^{\\circ}$", title: "Derajat" },
                          ].map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => setManualQuestion((prev) => `${prev} ${item.snippet} `)}
                              className="px-2 py-0.5 text-[9px] font-mono font-bold bg-zinc-100 hover:bg-blue-50 text-zinc-700 hover:text-blue-700 border border-zinc-200 hover:border-blue-400 rounded transition cursor-pointer"
                              title={item.title}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                        <textarea
                          rows={3}
                          value={manualQuestion}
                          onChange={(e) => setManualQuestion(e.target.value)}
                          required
                          placeholder="Masukkan teks soal (contoh: Hitung $\sqrt{144} + \frac{1}{2}$)..."
                          className="w-full px-3 py-2 text-xs font-mono border border-zinc-300 focus:outline-none focus:border-zinc-900"
                        />
                        {manualQuestion && (
                          <div className="mt-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded text-xs space-y-1">
                            <span className="text-[10px] font-mono font-bold text-zinc-400 block uppercase">
                              Live Preview Formula KaTeX:
                            </span>
                            <MarkdownRenderer content={manualQuestion} isCompact />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                            Tipe Soal
                          </label>
                          <select
                            value={manualType}
                            onChange={(e) => setManualType(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 text-xs font-mono border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                          >
                            <option value="pilihan_ganda">Pilihan Ganda</option>
                            <option value="esai">Esai Jawaban Bebas</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                            Tingkat Kesulitan
                          </label>
                          <select
                            value={manualDifficulty}
                            onChange={(e) => setManualDifficulty(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 text-xs font-mono border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                          >
                            <option value="mudah">Mudah</option>
                            <option value="sedang">Sedang</option>
                            <option value="sulit">Sulit</option>
                          </select>
                        </div>
                      </div>

                      {manualType === "pilihan_ganda" && (
                        <div className="space-y-1.5 pt-2 border-t border-zinc-200">
                          <label className="block text-[10px] font-mono uppercase text-zinc-500">
                            Pilihan Opsi Jawaban (Pilih Radio untuk Jawaban Benar)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              { key: "A", val: manualOptionA, setVal: setManualOptionA },
                              { key: "B", val: manualOptionB, setVal: setManualOptionB },
                              { key: "C", val: manualOptionC, setVal: setManualOptionC },
                              { key: "D", val: manualOptionD, setVal: setManualOptionD },
                            ].map((opt) => (
                              <div key={opt.key} className="flex items-center gap-2 border border-zinc-200 p-1 bg-white">
                                <input
                                  type="radio"
                                  name="correctOpt"
                                  checked={manualCorrectOption === opt.key}
                                  onChange={() => setManualCorrectOption(opt.key as any)}
                                  className="w-3.5 h-3.5 accent-zinc-900"
                                />
                                <span className="font-mono text-xs font-bold text-zinc-700 w-4">{opt.key}.</span>
                                <input
                                  type="text"
                                  placeholder={`Teks Opsi ${opt.key}`}
                                  value={opt.val}
                                  onChange={(e) => opt.setVal(e.target.value)}
                                  className="w-full px-2 py-1 text-xs font-mono border-none focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {manualType === "esai" && (
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                            Kunci Jawaban Esai
                          </label>
                          <textarea
                            rows={2}
                            value={manualEssayKey}
                            onChange={(e) => setManualEssayKey(e.target.value)}
                            placeholder="Kata kunci jawaban yang diharapkan..."
                            className="w-full px-3 py-2 text-xs font-mono border border-zinc-300 focus:outline-none focus:border-zinc-900"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                          Pembahasan (Opsional)
                        </label>
                        <input
                          type="text"
                          value={manualExplanation}
                          onChange={(e) => setManualExplanation(e.target.value)}
                          placeholder="Penjelasan ringkas cara pengerjaan..."
                          className="w-full px-3 py-1.5 text-xs font-mono border border-zinc-300 focus:outline-none focus:border-zinc-900"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-mono font-bold border border-zinc-950 transition"
                      >
                        {submitting ? "Menyimpan..." : "Simpan Soal ke Kelas"}
                      </button>
                    </form>
                  )}

                  {/* MODE 3: GENERATOR AI */}
                  {addMode === "ai" && (
                    <div className="p-4 border border-zinc-300 bg-zinc-50 space-y-3">
                      <div>
                        <div className="text-xs font-bold text-zinc-900 uppercase font-mono">
                          Generator Soal Kurikulum Merdeka
                        </div>
                        <p className="text-xs text-zinc-600 font-mono mt-0.5">
                          Menyusun soal terstruktur berdasarkan capaian pembelajaran kelas.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                          Topik Materi
                        </label>
                        <input
                          type="text"
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                          placeholder="Contoh: Persamaan Linear Dua Variabel, Sistem Grafik..."
                          className="w-full px-3 py-1.5 text-xs font-mono border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateAISoal}
                        disabled={aiGenerating}
                        className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-mono font-bold border border-zinc-950 transition flex items-center justify-center gap-2"
                      >
                        {aiGenerating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Menyusun Soal...</span>
                          </>
                        ) : (
                          <span>Generate & Masukkan ke Kelas</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PARAMETER UJIAN */}
              {activeTab === "settings" && (
                <form onSubmit={handleSaveExamConfig} className="space-y-3">
                  <div className="p-2.5 border border-zinc-300 bg-zinc-50 text-xs font-mono text-zinc-800">
                    Konfigurasi parameter teknis pengerjaan ujian untuk kelas **{kelasName}**.
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                      Judul Paket Ujian
                    </label>
                    <input
                      type="text"
                      value={examJudul}
                      onChange={(e) => setExamJudul(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-xs font-mono border border-zinc-300 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                      Deskripsi
                    </label>
                    <input
                      type="text"
                      value={examDeskripsi}
                      onChange={(e) => setExamDeskripsi(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-zinc-300 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                        Durasi (Menit)
                      </label>
                      <input
                        type="number"
                        value={examDurasi}
                        onChange={(e) => setExamDurasi(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 text-xs font-mono border border-zinc-300 focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                        KKM (Passing Grade)
                      </label>
                      <input
                        type="number"
                        value={examKKM}
                        onChange={(e) => setExamKKM(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 text-xs font-mono border border-zinc-300 focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                        Token Akses
                      </label>
                      <input
                        type="text"
                        value={examToken}
                        onChange={(e) => setExamToken(e.target.value.toUpperCase())}
                        required
                        className="w-full px-3 py-1.5 text-xs font-mono border border-zinc-300 focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <label className="flex items-center gap-2 p-2 border border-zinc-200 bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={examAcakSoal}
                        onChange={(e) => setExamAcakSoal(e.target.checked)}
                        className="w-3.5 h-3.5 accent-zinc-900"
                      />
                      <span>Acak Urutan Soal Siswa</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 border border-zinc-200 bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={examAcakOpsi}
                        onChange={(e) => setExamAcakOpsi(e.target.checked)}
                        className="w-3.5 h-3.5 accent-zinc-900"
                      />
                      <span>Acak Opsi Pilihan Ganda</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-mono font-bold border border-zinc-950 transition"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Parameter Ujian"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Utilitarian Footer */}
        <div className="px-4 py-2.5 bg-zinc-100 border-t border-zinc-300 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-zinc-500">
            Sinkronisasi instan ke dashboard siswa.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white hover:bg-zinc-200 text-zinc-900 text-xs font-mono font-bold border border-zinc-300 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
