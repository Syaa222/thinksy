"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import GuruLayout from "@/components/guru/GuruLayout";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";
import AiQuestionGeneratorModal from "@/components/guru/AiQuestionGeneratorModal";
import { ReviewQuestionItem } from "@/components/guru/ReviewStyleQuestionCard";
import {
  ArrowLeft,
  Plus,
  Save,
  Loader2,
  Clock,
  Award,
  CheckCircle2,
  Key,
  Sparkles,
  AlertCircle,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit3,
  Eye,
  Check,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  FileText,
} from "lucide-react";

export default function EditUjianPage({
  params,
}: {
  params: Promise<{ ujianId: string }>;
}) {
  const { ujianId } = use(params);

  // Mode Tab: 'soal' (2-pane quiz editor) vs 'pengaturan' (metadata ujian)
  const [activeTab, setActiveTab] = useState<"soal" | "pengaturan">("soal");

  // Status & Alerts
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Exam Metadata State
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [mapel, setMapel] = useState("Matematika");
  const [tipe, setTipe] = useState<"ulangan" | "ujian">("ulangan");
  const [durasiMenit, setDurasiMenit] = useState(60);
  const [passingGrade, setPassingGrade] = useState(75);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("dipublikasi");
  const [babId, setBabId] = useState<string | null>(null);
  const [babJudul, setBabJudul] = useState<string>("");
  const [acakSoal, setAcakSoal] = useState(false);
  const [acakOpsi, setAcakOpsi] = useState(false);

  // Questions List & Active Question Navigation
  const [soalList, setSoalList] = useState<ReviewQuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Question Card UI State
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [openPetunjuk, setOpenPetunjuk] = useState<Record<string, boolean>>({});
  const [showMisconceptions, setShowMisconceptions] = useState(false);

  // AI Generator Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Load Exam Data on Mount
  useEffect(() => {
    async function loadExam() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/guru/ujian/${ujianId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          const u = data.ujian;
          setJudul(u.judul || "");
          setDeskripsi(u.deskripsi || "");
          setMapel(u.mapel || "Matematika");
          setTipe(u.tipe || "ulangan");
          setDurasiMenit(u.durasi_menit || 60);
          setPassingGrade(u.passing_grade || 75);
          setToken(u.token || "");
          setStatus(u.status || "dipublikasi");
          setBabId(u.bab_id || null);
          setBabJudul(u.bab?.judul || "");
          setAcakSoal(Boolean(u.acak_soal));
          setAcakOpsi(Boolean(u.acak_opsi));

          if (Array.isArray(data.soalList) && data.soalList.length > 0) {
            setSoalList(data.soalList);
            setCurrentIdx(0);
          } else {
            setSoalList([]);
          }
        } else {
          setErrorMsg(data.error || "Gagal memuat data ujian.");
        }
      } catch (err: any) {
        setErrorMsg("Gangguan koneksi internet: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    if (ujianId) {
      loadExam();
    }
  }, [ujianId]);

  // Current Question Pointer
  const currentQ = soalList[currentIdx] || null;

  // Question Manipulation Handlers
  const handleAddQuestion = () => {
    const newIdx = soalList.length + 1;
    const defaultType: "pilihan_ganda" | "isian_singkat" | "esai" =
      newIdx <= 10 ? "pilihan_ganda" : newIdx <= 13 ? "isian_singkat" : "esai";

    const newQ: ReviewQuestionItem = {
      id: `temp-${Date.now()}-${newIdx}`,
      pertanyaan: `Tuliskan pertanyaan butir soal #${newIdx} di sini (Mendukung rumus KaTeX seperti $a^2 + b^2 = c^2$)...`,
      tipeSoal: defaultType,
      poin: 10,
      kunciJawaban: defaultType === "pilihan_ganda" ? "Pilihan A" : "",
      pembahasan: "Pahami konsep dasar materi ini secara bertahap untuk menyelesaikan persoalan dengan tepat.",
      opsi:
        defaultType === "pilihan_ganda"
          ? [
              { teks: "Pilihan A", benar: true },
              { teks: "Pilihan B", benar: false, alasanSalah: "Konsep dasar pada opsi ini keliru." },
              { teks: "Pilihan C", benar: false, alasanSalah: "Konsep dasar pada opsi ini keliru." },
              { teks: "Pilihan D", benar: false, alasanSalah: "Konsep dasar pada opsi ini keliru." },
            ]
          : [],
    };

    setSoalList((prev) => [...prev, newQ]);
    setCurrentIdx(soalList.length); // Switch directly to new question
    setActiveTab("soal");
  };

  const handleDeleteQuestion = (idx: number) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Soal #${idx + 1}?`)) {
      setSoalList((prev) => {
        const nextList = prev.filter((_, i) => i !== idx);
        if (currentIdx >= nextList.length) {
          setCurrentIdx(Math.max(0, nextList.length - 1));
        }
        return nextList;
      });
    }
  };

  const handleUpdateCurrentQuestion = (patch: Partial<ReviewQuestionItem>) => {
    setSoalList((prev) => {
      const copy = [...prev];
      if (copy[currentIdx]) {
        copy[currentIdx] = { ...copy[currentIdx], ...patch };
      }
      return copy;
    });
  };

  const handleSetCorrectOption = (optIdx: number) => {
    if (!currentQ || !currentQ.opsi) return;
    const updatedOpsi = currentQ.opsi.map((o, i) => ({
      ...o,
      benar: i === optIdx,
    }));
    handleUpdateCurrentQuestion({
      opsi: updatedOpsi,
      kunciJawaban: updatedOpsi[optIdx]?.teks || "",
    });
  };

  const handleUpdateOptionTeks = (optIdx: number, newTeks: string) => {
    if (!currentQ || !currentQ.opsi) return;
    const updatedOpsi = [...currentQ.opsi];
    updatedOpsi[optIdx] = { ...updatedOpsi[optIdx], teks: newTeks };
    handleUpdateCurrentQuestion({
      opsi: updatedOpsi,
      kunciJawaban: updatedOpsi[optIdx]?.benar ? newTeks : currentQ.kunciJawaban,
    });
  };

  const handleUpdateOptionAlasan = (optIdx: number, alasan: string) => {
    if (!currentQ || !currentQ.opsi) return;
    const updatedOpsi = [...currentQ.opsi];
    updatedOpsi[optIdx] = { ...updatedOpsi[optIdx], alasanSalah: alasan };
    handleUpdateCurrentQuestion({ opsi: updatedOpsi });
  };

  const handleMoveQuestion = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= soalList.length) return;
    setSoalList((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy;
    });
    setCurrentIdx(toIdx);
  };

  // AI Modal Question Inserts
  const handleInsertAiQuestion = (newQ: ReviewQuestionItem) => {
    setSoalList((prev) => [...prev, newQ]);
    setCurrentIdx(soalList.length);
  };

  const handleInsertMultipleAiQuestions = (newQs: ReviewQuestionItem[]) => {
    setSoalList((prev) => [...prev, ...newQs]);
  };

  // Save Exam Full
  const handleSaveExam = async () => {
    if (!judul.trim()) {
      alert("Judul ujian wajib diisi!");
      setActiveTab("pengaturan");
      return;
    }
    if (soalList.length === 0) {
      alert("Harus ada minimal 1 butir soal dalam lembar ujian!");
      setActiveTab("soal");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/guru/ujian/${ujianId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul,
          deskripsi,
          mapel,
          tipe,
          durasiMenit,
          passingGrade,
          token,
          status,
          babId,
          acakSoal,
          acakOpsi,
          soalList,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Semua perubahan butir soal dan pengaturan ujian berhasil disimpan!");
        setTimeout(() => {
          setSuccessMsg(null);
        }, 3500);
      } else {
        setErrorMsg(data.error || "Gagal menyimpan perubahan ujian.");
      }
    } catch (err: any) {
      setErrorMsg("Terjadi kesalahan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Statistics
  const pgCount = soalList.filter((s) => s.tipeSoal === "pilihan_ganda").length;
  const isianCount = soalList.filter((s) => s.tipeSoal === "isian_singkat").length;
  const esaiCount = soalList.filter((s) => s.tipeSoal === "esai").length;
  const totalPoints = soalList.reduce((acc, q) => acc + (Number(q.poin) || 10), 0);

  // Option Letter Helper
  const getOptionLetter = (idx: number) => String.fromCharCode(65 + idx);

  // Quick Math Shortcuts List
  const MATH_SHORTCUTS = [
    { label: "a/b", snippet: "$\\frac{a}{b}$", title: "Pecahan bertingkat" },
    { label: "x²", snippet: "$x^{2}$", title: "Pangkat" },
    { label: "√x", snippet: "$\\sqrt{x}$", title: "Bentuk akar" },
    { label: "×", snippet: "$\\times$", title: "Simbol kali" },
    { label: "÷", snippet: "$\\div$", title: "Simbol bagi" },
    { label: "π", snippet: "$\\pi$", title: "Bilangan pi" },
    { label: "±", snippet: "$\\pm$", title: "Plus minus" },
    { label: "°", snippet: "$^{\\circ}$", title: "Derajat sudut" },
    { label: "Δ", snippet: "$\\Delta$", title: "Delta selisih" },
  ];

  return (
    <GuruLayout activeView="ujian">
      <div className="max-w-6xl mx-auto space-y-6 pb-24">
        {/* ========================================================================= */}
        {/* TOP HEADER: NAVIGATION & TITLE                                           */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/guru/ujian"
              className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
              title="Kembali ke Daftar Ujian"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Mode Edit Ujian
                </span>
                {babJudul && (
                  <span className="text-xs font-semibold text-slate-500 truncate max-w-xs">
                    • {babJudul}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {judul || "Lembar Kerja Soal Ujian"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveExam}
              disabled={saving || loading}
              className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </button>
          </div>
        </div>

        {/* Alerts Banner */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2.5 animate-in fade-in shadow-2xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2.5 animate-in fade-in shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB BAR NAVIGATION: SOAL (2 PANE) vs PENGATURAN (GERIGI)                  */}
        {/* ========================================================================= */}
        <div className="flex items-center border-b border-slate-200 pb-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("soal")}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeTab === "soal"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Lembar Soal (Tampilan Siswa)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === "soal" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {soalList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pengaturan")}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeTab === "pengaturan"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Settings className="w-4 h-4 text-blue-400" />
            <span>Pengaturan & Informasi Umum Ujian</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3 shadow-xs">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Memuat butir soal dan data ujian...</p>
          </div>
        ) : activeTab === "pengaturan" ? (
          /* ======================================================================= */
          /* TAB 2: PENGATURAN & INFORMASI UMUM UJIAN                                 */
          /* ======================================================================= */
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Pengaturan & Informasi Umum Ujian
                  </h2>
                  <p className="text-xs text-slate-500">
                    Konfigurasi parameter ujian, token akses siswa, durasi waktu, dan KKM kelulusan.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {soalList.length} Butir Soal Terkait
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Judul Ujian / Ulangan / Kuis</label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Ulangan Bab 1: Bilangan Berpangkat & Bentuk Akar"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Deskripsi Petunjuk Siswa</label>
                <textarea
                  rows={3}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Tuliskan petunjuk pengerjaan bagi siswa..."
                  className="w-full px-4 py-2.5 text-xs sm:text-sm font-normal rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Durasi Pengerjaan (Menit)</label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={durasiMenit}
                    onChange={(e) => setDurasiMenit(Number(e.target.value))}
                    className="w-full px-4 py-2 text-xs sm:text-sm font-medium rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kriteria Ketuntasan Minimal (KKM)</label>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={passingGrade}
                    onChange={(e) => setPassingGrade(Number(e.target.value))}
                    className="w-full px-4 py-2 text-xs sm:text-sm font-medium rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Token Akses Masuk</label>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    placeholder="MTK-ULG75"
                    className="w-full px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-wider rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Status Publikasi Ujian</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 text-xs sm:text-sm font-semibold rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer bg-white"
                >
                  <option value="dipublikasi">Dibuka / Aktif (Siswa dapat mengerjakan)</option>
                  <option value="ditutup">Ditutup / Nonaktif</option>
                  <option value="draft">Draft (Hanya Guru)</option>
                </select>
              </div>

              {/* Opsi Pengacakan */}
              <div className="md:col-span-2 pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={acakSoal}
                    onChange={(e) => setAcakSoal(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Acak Urutan Soal Siswa</span>
                    <span className="text-[11px] text-slate-500">Urutan butir soal berbeda untuk tiap siswa</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={acakOpsi}
                    onChange={(e) => setAcakOpsi(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Acak Opsi Pilihan Ganda</span>
                    <span className="text-[11px] text-slate-500">Urutan opsi A-D diacak otomatis di layar siswa</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab("soal")}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition"
              >
                <span>Lihat Lembar Soal Siswa →</span>
              </button>

              <button
                type="button"
                onClick={handleSaveExam}
                disabled={saving}
                className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================================= */
          /* TAB 1: 2-PANE QUIZ VIEW (70% EDIT SOAL SISWA + 30% PALET NOMOR GRID)    */
          /* ======================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* PANE KIRI (70%): EDITOR SOAL DENGAN GAYA PERSIS SISWA (/quiz)       */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-8 space-y-4">
              {currentQ ? (
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 space-y-6 animate-in fade-in duration-150">
                  {/* 1. Header Toolbar Soal (Nomor, Tipe, Poin di kiri; Toggle & Aksi di kanan) */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-3 w-full">
                    {/* Kiri: Nomor, Info, Jenis Soal, & Poin */}
                    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                      {/* Black rounded badge nomor soal persis gaya siswa */}
                      <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                        {currentIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                        Soal {currentIdx + 1} dari {soalList.length}
                      </span>

                      {/* Pill Jenis Soal */}
                      <select
                        value={currentQ.tipeSoal}
                        onChange={(e) =>
                          handleUpdateCurrentQuestion({
                            tipeSoal: e.target.value as "pilihan_ganda" | "isian_singkat" | "esai",
                            // Inisialisasi opsi default jika beralih ke PG
                            opsi:
                              e.target.value === "pilihan_ganda" && (!currentQ.opsi || currentQ.opsi.length === 0)
                                ? [
                                    { teks: "Opsi Jawaban A", benar: true },
                                    { teks: "Opsi Jawaban B", benar: false, alasanSalah: "Konsep dasar keliru." },
                                    { teks: "Opsi Jawaban C", benar: false, alasanSalah: "Konsep dasar keliru." },
                                    { teks: "Opsi Jawaban D", benar: false, alasanSalah: "Konsep dasar keliru." },
                                  ]
                                : currentQ.opsi,
                          })
                        }
                        className="text-[11px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer hover:bg-slate-200/70 transition"
                      >
                        <option value="pilihan_ganda">Pilihan Ganda</option>
                        <option value="isian_singkat">Isian Singkat</option>
                        <option value="esai">Soal Esai</option>
                      </select>

                      {/* Input Bobot Poin */}
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
                        <span>Poin:</span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={currentQ.poin || 10}
                          onChange={(e) =>
                            handleUpdateCurrentQuestion({ poin: Number(e.target.value) })
                          }
                          className="w-8 sm:w-10 bg-transparent text-center font-extrabold text-blue-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Kanan: Toggle Mode (Icon-Only), Geser Posisi, & Hapus */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Toggle Mode Edit vs Pratinjau Siswa (Segmented Icon-Only) */}
                      <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => setIsPreviewMode(false)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            !isPreviewMode
                              ? "bg-white text-blue-600 shadow-2xs font-bold"
                              : "text-slate-400 hover:text-slate-700"
                          }`}
                          title="Mode Edit Teks Soal"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPreviewMode(true)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            isPreviewMode
                              ? "bg-white text-emerald-600 shadow-2xs font-bold"
                              : "text-slate-400 hover:text-slate-700"
                          }`}
                          title="Pratinjau Tampilan Siswa"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Geser Posisi Soal */}
                      <div className="flex items-center bg-slate-100/70 p-1 rounded-xl border border-slate-200/80">
                        <button
                          type="button"
                          disabled={currentIdx === 0}
                          onClick={() => handleMoveQuestion(currentIdx, currentIdx - 1)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Geser posisi soal ke atas / sebelumnya"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={currentIdx === soalList.length - 1}
                          onClick={() => handleMoveQuestion(currentIdx, currentIdx + 1)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Geser posisi soal ke bawah / berikutnya"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Hapus Soal */}
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(currentIdx)}
                        className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 transition cursor-pointer"
                        title="Hapus butir soal ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 2. Deskripsi / Pertanyaan Soal */}
                  <div className="space-y-2.5">
                    {isPreviewMode ? (
                      <div className="text-sm sm:text-base text-slate-900 leading-relaxed font-normal p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                        <MarkdownRenderer content={currentQ.pertanyaan} />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <span>Teks Pertanyaan Soal:</span>
                            <span className="text-[11px] font-normal text-slate-400">
                              (Mendukung rumus KaTeX $...$)
                            </span>
                          </label>
                        </div>

                        {/* Quick Math Formula Shortcuts */}
                        <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">
                            Rumus Cepat:
                          </span>
                          {MATH_SHORTCUTS.map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() =>
                                handleUpdateCurrentQuestion({
                                  pertanyaan: `${currentQ.pertanyaan} ${item.snippet} `,
                                })
                              }
                              className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-400 rounded-md transition cursor-pointer shadow-2xs"
                              title={item.title}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        <textarea
                          rows={3}
                          value={currentQ.pertanyaan}
                          onChange={(e) => handleUpdateCurrentQuestion({ pertanyaan: e.target.value })}
                          placeholder="Tuliskan butir soal di sini..."
                          className="w-full p-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs sm:text-sm text-slate-900 leading-relaxed transition"
                        />

                        {/* Live KaTeX Render Preview di bawah editor */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs sm:text-sm text-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Pratinjau Render Siswa:
                          </span>
                          <MarkdownRenderer content={currentQ.pertanyaan || "..."} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Opsi Pilihan Ganda / Isian / Esai (Gaya Persis Kartu Siswa) */}
                  <div className="pt-2 space-y-3">
                    {currentQ.tipeSoal === "pilihan_ganda" && currentQ.opsi ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600">
                            Pilihan Jawaban (Klik huruf atau centang untuk memilih Kunci Benar):
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowMisconceptions(!showMisconceptions)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                          >
                            {showMisconceptions
                              ? "Sembunyikan Analisis Miskonsepsi"
                              : "+ Tampilkan Analisis Miskonsepsi AI"}
                          </button>
                        </div>

                        {currentQ.opsi.map((opt, optIdx) => {
                          const letter = getOptionLetter(optIdx);
                          const isCorrect = Boolean(opt.benar);

                          return (
                            <div
                              key={opt.id || `opt-${optIdx}`}
                              className={`w-full rounded-2xl p-4 sm:p-5 transition-all duration-150 border flex flex-col gap-2.5 ${
                                isCorrect
                                  ? "bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/30 shadow-xs"
                                  : "bg-white border-slate-200/90 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3.5 flex-1">
                                  {/* Letter Badge A, B, C, D */}
                                  <button
                                    type="button"
                                    onClick={() => handleSetCorrectOption(optIdx)}
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors cursor-pointer ${
                                      isCorrect
                                        ? "bg-emerald-600 text-white shadow-2xs"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                    }`}
                                    title="Klik untuk jadikan kunci jawaban benar"
                                  >
                                    {letter}
                                  </button>

                                  {/* Teks Opsi (Preview vs Edit) */}
                                  <div className="flex-1 pt-0.5">
                                    {isPreviewMode ? (
                                      <div className="text-xs sm:text-sm text-slate-900 leading-relaxed font-normal">
                                        <MarkdownRenderer content={opt.teks} />
                                      </div>
                                    ) : (
                                      <input
                                        type="text"
                                        value={opt.teks}
                                        onChange={(e) => handleUpdateOptionTeks(optIdx, e.target.value)}
                                        placeholder={`Teks pilihan opsi ${letter}...`}
                                        className={`w-full px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium transition ${
                                          isCorrect
                                            ? "border-emerald-300 bg-white text-emerald-950 font-semibold focus:ring-2 focus:ring-emerald-400"
                                            : "border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
                                        }`}
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* Status Kunci Jawaban Tag */}
                                <div className="shrink-0">
                                  {isCorrect ? (
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-2xs">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Kunci Benar</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSetCorrectOption(optIdx)}
                                      className="px-2 py-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 text-[11px] font-semibold border border-dashed border-slate-300 transition cursor-pointer"
                                    >
                                      Set Kunci Benar
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Analisis Miskonsepsi Opsi Salah */}
                              {showMisconceptions && !isCorrect && (
                                <div className="mt-1 pl-10 pr-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-amber-700 shrink-0">
                                    Miskonsepsi AI:
                                  </span>
                                  <input
                                    type="text"
                                    value={opt.alasanSalah || ""}
                                    onChange={(e) => handleUpdateOptionAlasan(optIdx, e.target.value)}
                                    placeholder="Jelaskan kekeliruan konsep siswa jika memilih opsi ini..."
                                    className="flex-1 px-3 py-1 text-[11px] rounded-lg border border-amber-200 bg-amber-50/50 text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-400"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : currentQ.tipeSoal === "isian_singkat" ? (
                      <div className="space-y-3 p-5 rounded-2xl bg-purple-50/40 border border-purple-200/80">
                        <label className="text-xs font-bold text-purple-950 block">
                          Kunci Jawaban Isian Singkat:
                        </label>
                        <input
                          type="text"
                          value={currentQ.kunciJawaban}
                          onChange={(e) => handleUpdateCurrentQuestion({ kunciJawaban: e.target.value })}
                          placeholder="Masukkan kata kunci atau angka jawaban siswa yang benar..."
                          className="w-full p-3.5 rounded-2xl bg-white border border-purple-200 text-xs sm:text-sm font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <p className="text-[11px] text-purple-700">
                          *Siswa akan mengisi jawaban dalam satu baris teks singkat.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80">
                        <label className="text-xs font-bold text-amber-950 block">
                          Kunci Jawaban Lengkap & Pedoman Penskoran Esai:
                        </label>
                        <textarea
                          rows={4}
                          value={currentQ.kunciJawaban}
                          onChange={(e) => handleUpdateCurrentQuestion({ kunciJawaban: e.target.value })}
                          placeholder="Tuliskan kunci langkah penyelesaian, rumus yang digunakan, atau rubrik penilaian..."
                          className="w-full p-4 rounded-2xl bg-white border border-amber-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 transition resize-y"
                        />
                      </div>
                    )}
                  </div>

                  {/* 4. Petunjuk & Pembahasan Konsep (Collapsible Amber Container Persis Siswa) */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenPetunjuk((prev) => ({
                          ...prev,
                          [currentQ.id]: !prev[currentQ.id],
                        }))
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition cursor-pointer"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>Petunjuk & Pembahasan Konsep</span>
                      {openPetunjuk[currentQ.id] !== false ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    {openPetunjuk[currentQ.id] !== false && (
                      <div className="mt-2.5 p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs sm:text-sm text-amber-950 leading-relaxed animate-in fade-in duration-150 space-y-2">
                        {isPreviewMode ? (
                          <MarkdownRenderer content={currentQ.pembahasan || "Belum ada petunjuk konsep."} />
                        ) : (
                          <div className="space-y-1.5">
                            <textarea
                              rows={2}
                              value={currentQ.pembahasan}
                              onChange={(e) =>
                                handleUpdateCurrentQuestion({ pembahasan: e.target.value })
                              }
                              placeholder="Tuliskan petunjuk sokratik atau pembahasan konsep di sini..."
                              className="w-full p-3 rounded-xl bg-white border border-amber-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            <div className="text-[11px] text-amber-900 font-medium">
                              Pratinjau Petunjuk Siswa:
                              <div className="mt-1 p-2 bg-white/70 rounded-lg border border-amber-200/60">
                                <MarkdownRenderer content={currentQ.pembahasan || "..."} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 5. In-Card Navigation Desktop (Sebelumnya & Berikutnya) */}
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Sebelumnya</span>
                    </button>

                    <span className="text-xs font-extrabold text-slate-500">
                      Soal {currentIdx + 1} dari {soalList.length}
                    </span>

                    {currentIdx < soalList.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentIdx((prev) => Math.min(soalList.length - 1, prev + 1))}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs cursor-pointer active:scale-98"
                      >
                        <span>Berikutnya</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs cursor-pointer active:scale-98"
                      >
                        <Plus className="w-4 h-4 text-amber-400" />
                        <span>Tambah Soal Baru</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Empty Questions State */
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 shadow-xs">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">Lembar Ujian Masih Kosong</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Belum ada butir soal dalam lembar ujian ini. Anda dapat membuat soal secara otomatis menggunakan AI atau menambahkan soal manual.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAiModalOpen(true)}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Buat Soal dengan AI</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-amber-400" />
                      <span>Tambah Manual</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* PANE KANAN (30%): DAFTAR GRID NOMOR SOAL (STICKY, TANPA SCROLL)     */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200 space-y-4 sticky top-6">
                {/* Header Card Palet */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900">Nomor Soal</h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                      Grid
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-bold">
                    {soalList.length > 0 ? `${currentIdx + 1} / ${soalList.length} Terpilih` : "0 Soal"}
                  </span>
                </div>

                {/* Legend Keterangan */}
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold pb-1 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                    <span>PG ({pgCount})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                    <span>Isian ({isianCount})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    <span>Esai ({esaiCount})</span>
                  </span>
                </div>

                {/* Grid Nomor Soal (5 Kolom Persis Gaya Siswa) */}
                <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto p-1">
                  {soalList.map((q, idx) => {
                    const isCurrent = idx === currentIdx;
                    const isPg = q.tipeSoal === "pilihan_ganda";
                    const isIsian = q.tipeSoal === "isian_singkat";

                    let btnStyle =
                      "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80";

                    if (isCurrent) {
                      btnStyle =
                        "bg-slate-900 text-white font-black ring-2 ring-slate-900 ring-offset-2 shadow-sm scale-102";
                    }

                    return (
                      <button
                        key={q.id || `nav-${idx}`}
                        type="button"
                        onClick={() => {
                          setCurrentIdx(idx);
                          setActiveTab("soal");
                        }}
                        className={`h-11 rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer relative ${btnStyle}`}
                        title={`Soal #${idx + 1} (${q.tipeSoal})`}
                      >
                        <span>{idx + 1}</span>

                        {/* Dot indicator jenis soal */}
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                            isCurrent
                              ? "bg-amber-400"
                              : isPg
                              ? "bg-blue-500"
                              : isIsian
                              ? "bg-purple-500"
                              : "bg-amber-500"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Ringkasan Poin & Aksi Tambah Soal */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                    <span>Total Poin Ujian:</span>
                    <span className="text-blue-700 font-black text-sm">{totalPoints} Poin</span>
                  </div>

                  {/* Tombol Kelola Butir Soal */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
                      title="Tambah butir soal baru secara manual"
                    >
                      <Plus className="w-4 h-4 text-amber-400" />
                      <span>+ Tambah Soal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAiModalOpen(true)}
                      className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-98 cursor-pointer"
                      title="Buat butir soal otomatis menggunakan AI"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Buat Soal AI</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Question Generator Modal */}
        <AiQuestionGeneratorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          defaultBabJudul={babJudul}
          defaultBabId={babId || undefined}
          onInsertQuestion={handleInsertAiQuestion}
          onInsertMultipleQuestions={handleInsertMultipleAiQuestions}
        />
      </div>
    </GuruLayout>
  );
}
