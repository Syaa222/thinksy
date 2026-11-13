"use client";

import { useState } from "react";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";
import {
  Sparkles,
  Bot,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Save,
  HelpCircle,
  AlertCircle,
  FileCheck,
  FileText,
  Upload,
  BookOpen,
  Copy,
  Check,
  Layers,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

// 8 Bab Kurikulum Matematika SMP Kelas 8 Resmi
const MATEMATIKA_BAB_LIST = [
  { id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", judul: "Bab 1: Pola Bilangan & Barisan Bilangan" },
  { id: "b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22", judul: "Bab 2: Bentuk Aljabar & PLSV/PTLSV" },
  { id: "b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33", judul: "Bab 3: Relasi & Fungsi" },
  { id: "b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44", judul: "Bab 4: Persamaan Garis Lurus (PGL)" },
  { id: "b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55", judul: "Bab 5: Sistem Persamaan Linear Dua Variabel (SPLDV)" },
  { id: "b6eebc99-9c0b-4ef8-bb6d-6bb9bd380a66", judul: "Bab 6: Teorema Pythagoras" },
  { id: "b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a77", judul: "Bab 7: Bangun Ruang Sisi Datar (BRSD)" },
  { id: "b8eebc99-9c0b-4ef8-bb6d-6bb9bd380a88", judul: "Bab 8: Statistika & Peluang" },
];

export default function AIQuestionGeneratorPage() {
  const [mode, setMode] = useState<"materi" | "soal" | "pdf_extract">("soal");
  const [selectedBabId, setSelectedBabId] = useState(MATEMATIKA_BAB_LIST[0].id);
  const [topik, setTopik] = useState(MATEMATIKA_BAB_LIST[0].judul);
  const [tingkatSoal, setTingkatSoal] = useState("sedang");
  const [tipeSoal, setTipeSoal] = useState("paket_15");
  const [kelas, setKelas] = useState("8");
  const [mapel] = useState("Matematika");

  // File upload state for PDF / Images
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);

  // Status state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Result state
  const [draft, setDraft] = useState<any | null>(null);
  const [soalList, setSoalList] = useState<any[]>([]);
  const [materiLengkap, setMateriLengkap] = useState<string | null>(null);

  const handleSelectBabChange = (babId: string) => {
    setSelectedBabId(babId);
    const active = MATEMATIKA_BAB_LIST.find((b) => b.id === babId);
    if (active) {
      setTopik(active.judul);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileMimeType(file.type || "application/pdf");

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setDraft(null);
    setSoalList([]);
    setMateriLengkap(null);

    try {
      const res = await fetch("/api/guru/generate-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babId: selectedBabId,
          topik: mode === "materi" ? `Modul Bacaan Bab Lengkap & Mendalam: ${topik} (Kelas ${kelas} ${mapel})` : topik,
          mapel,
          tingkatSoal,
          tipeSoal,
          jumlah: tipeSoal === "paket_15" ? 15 : 1,
          mode: mode === "materi" ? "materi" : tipeSoal === "paket_15" ? "paket_15" : "soal",
          fileBase64: fileBase64 || undefined,
          fileMimeType: fileMimeType || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyusun materi/soal dari AI.");
      }

      setDraft(data.draft);
      if (Array.isArray(data.soal) && data.soal.length > 0) {
        setSoalList(data.soal);
      }
      if (data.materiLengkap) {
        setMateriLengkap(data.materiLengkap);
      }
      setSuccessMsg("✨ Draft berhasil disusun oleh AI sesuai standar kurikulum!");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat pemanggilan AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMateri = () => {
    if (!materiLengkap) return;
    navigator.clipboard.writeText(materiLengkap);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToBank = async () => {
    if (!draft && soalList.length === 0) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload =
        soalList.length > 0
          ? {
              babId: selectedBabId,
              daftarSoal: soalList,
              statusSoal: "dipublikasi",
              sumberKonten: "ai_generated",
            }
          : draft;

      const res = await fetch("/api/guru/simpan-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan soal.");
      }

      setSuccessMsg(data.message || "Soal berhasil disimpan ke Bank Soal!");
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan soal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
          <Link
            href="/guru"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0F172A] hover:text-blue-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard Guru</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A] bg-amber-100 border border-amber-300 px-3.5 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>AI Curriculum & PDF Generator</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6">
        {/* Title Card */}
        <div className="rounded-3xl bg-[#090D16] border border-slate-800 p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
          <div className="relative space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold border border-blue-400/30">
              <Bot className="w-4 h-4 text-amber-300" />
              <span>Generator Bacaan Bab Panjang & Paket Soal Sokratik</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Susun Bacaan Modul Bab & Bank Soal Otomatis
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Buat modul pembelajaran bab yang panjang dan terstruktur layaknya buku teks PDF resmi, atau ekstrak langsung materi serta soal ujian dari berkas PDF buku sekolah Anda.
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setMode("materi")}
            className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
              mode === "materi"
                ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20"
                : "bg-white/80 border-slate-200 hover:bg-white text-slate-600"
            }`}
          >
            <div className={`p-2.5 rounded-xl shrink-0 ${mode === "materi" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900">Modul Bacaan Bab (PDF)</div>
              <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                Generate teks buku ajar lengkap, apersepsi, teori KaTeX & contoh bertahap
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode("soal")}
            className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
              mode === "soal"
                ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20"
                : "bg-white/80 border-slate-200 hover:bg-white text-slate-600"
            }`}
          >
            <div className={`p-2.5 rounded-xl shrink-0 ${mode === "soal" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900">Paket Soal Kuis (10 Poin)</div>
              <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                Susun soal kuis pilihan ganda / esai dengan rubrik dan penjelasan KaTeX
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode("pdf_extract")}
            className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
              mode === "pdf_extract"
                ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20"
                : "bg-white/80 border-slate-200 hover:bg-white text-slate-600"
            }`}
          >
            <div className={`p-2.5 rounded-xl shrink-0 ${mode === "pdf_extract" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900">Ekstrak PDF Dokumen Buku</div>
              <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                Unggah berkas PDF / foto halaman buku untuk diekstrak persis menjadi materi
              </div>
            </div>
          </button>
        </div>

        {/* Main Grid: Form Left, Preview Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-black text-[#0F172A] border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Pengaturan Generator AI</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                {mode === "materi" ? "Modul Bacaan" : mode === "soal" ? "Paket Soal" : "Ekstrak PDF"}
              </span>
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Mata Pelajaran</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Khusus Fase D</span>
                  </label>
                  <select
                    value={mapel}
                    disabled
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-100 cursor-not-allowed"
                  >
                    <option value="Matematika">📐 Matematika (Fase D SMP Kelas 8)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Pilih Bab Matematika Resmi
                  </label>
                  <select
                    value={selectedBabId}
                    onChange={(e) => handleSelectBabChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50"
                  >
                    {MATEMATIKA_BAB_LIST.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.judul}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Topik & Fokus Pembahasan Bab
                </label>
                <input
                  type="text"
                  value={topik}
                  onChange={(e) => setTopik(e.target.value)}
                  placeholder="Misal: Teorema Pythagoras, Persamaan Linear Dua Variabel..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 font-medium"
                />
              </div>

              {mode === "pdf_extract" && (
                <div className="space-y-2 p-4 rounded-2xl bg-blue-50/50 border-2 border-dashed border-blue-200">
                  <label className="block text-xs font-bold text-blue-900">
                    Lampirkan Berkas Dokumen PDF / Foto Bab Buku
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  {selectedFile && (
                    <p className="text-[11px] font-bold text-blue-700">
                      ✓ Berkas terpilih: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={tingkatSoal}
                    onChange={(e) => setTingkatSoal(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50"
                  >
                    <option value="mudah">Mudah (Konseptual)</option>
                    <option value="sedang">Sedang (Standar Ujian)</option>
                    <option value="sulit">HOTS (Analisis Tinggi)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tipe Evaluasi
                  </label>
                  <select
                    value={tipeSoal}
                    onChange={(e) => setTipeSoal(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 font-medium"
                  >
                    <option value="paket_15">⚡ Paket 15 Soal Standar (10 PG, 3 Singkat, 2 Esai)</option>
                    <option value="pilihan_ganda">Pilihan Ganda (4 Opsi)</option>
                    <option value="isian_singkat">Jawaban Singkat (Isian)</option>
                    <option value="esai">Jawaban Panjang / Esai Bertahap</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>AI Sedang Membaca & Menyusun Materi...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>
                      {mode === "materi"
                        ? "Generate Modul Bacaan Lengkap"
                        : mode === "soal"
                        ? "Generate Paket Soal Kuis"
                        : "Ekstrak & Susun dari PDF"}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Generated Long-Form Reading Material Preview */}
            {materiLengkap && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-blue-700 bg-blue-100 px-3 py-1 rounded-full uppercase">
                      📖 Modul Bacaan Bab Terstruktur
                    </span>
                  </div>

                  <button
                    onClick={handleCopyMateri}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Disalin!" : "Salin Markdown"}</span>
                  </button>
                </div>

                <div className="prose max-w-none text-xs sm:text-sm leading-relaxed text-slate-800 bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
                  <MarkdownRenderer content={materiLengkap} />
                </div>
              </div>
            )}

            {/* Generated 15 Questions Package Preview */}
            {soalList.length > 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-blue-700 bg-blue-100 px-3 py-1 rounded-full uppercase">
                        ⚡ Paket Standar 15 Soal Matematika
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {soalList.length} Butir Soal Terstandar
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900">
                      {topik}
                    </h3>
                  </div>

                  <button
                    onClick={handleSaveToBank}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Simpan 15 Soal ke Bank Soal</span>
                  </button>
                </div>

                {/* Info Komposisi Soal */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    <span className="block text-xs font-black text-blue-700">10 Soal</span>
                    <span className="text-[10px] text-slate-500 font-bold">Pilihan Ganda</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    <span className="block text-xs font-black text-emerald-700">3 Soal</span>
                    <span className="text-[10px] text-slate-500 font-bold">Jawaban Singkat</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    <span className="block text-xs font-black text-purple-700">2 Soal</span>
                    <span className="text-[10px] text-slate-500 font-bold">Jawaban Panjang</span>
                  </div>
                </div>

                {/* List of 15 Questions */}
                <div className="space-y-6">
                  {soalList.map((q, qIdx) => {
                    const isPG = q.tipeSoal === "pilihan_ganda";
                    const isSingkat = q.tipeSoal === "isian_singkat";
                    const isEsai = q.tipeSoal === "esai";

                    return (
                      <div
                        key={q.id || qIdx}
                        className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[#0F172A] text-white flex items-center justify-center text-xs font-black">
                              {qIdx + 1}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                                isPG
                                  ? "bg-blue-100 text-blue-800"
                                  : isSingkat
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {isPG
                                ? "Pilihan Ganda"
                                : isSingkat
                                ? "Jawaban Singkat"
                                : "Jawaban Panjang (Esai)"}
                            </span>
                          </div>
                        </div>

                        {/* Pertanyaan */}
                        <div className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                          <MarkdownRenderer content={q.pertanyaan} />
                        </div>

                        {/* Opsi Pilihan Ganda */}
                        {isPG && Array.isArray(q.opsi) && q.opsi.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.opsi.map((o: any, oIdx: number) => {
                              const letter = String.fromCharCode(65 + oIdx);
                              const isCorrect = Boolean(o.benar);
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                                    isCorrect
                                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold"
                                      : "border-slate-200 bg-white text-slate-700"
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                      isCorrect
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {letter}
                                  </span>
                                  <div className="grow">
                                    <MarkdownRenderer content={o.teks} />
                                  </div>
                                  {isCorrect && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Kunci Jawaban Singkat / Rubrik */}
                        {(isSingkat || isEsai) && q.kunciJawaban && (
                          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                            <span className="font-extrabold block text-[10px] uppercase tracking-wider text-amber-800">
                              {isSingkat ? "Kunci Jawaban Singkat:" : "Kunci & Rubrik Esai:"}
                            </span>
                            <MarkdownRenderer content={q.kunciJawaban} />
                          </div>
                        )}

                        {/* Pembahasan KaTeX */}
                        {q.pembahasan && (
                          <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                            <span className="font-extrabold block text-[10px] uppercase tracking-wider text-slate-400">
                              Solusi KaTeX:
                            </span>
                            <MarkdownRenderer content={q.pembahasan} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handleSaveToBank}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Simpan Semua 15 Soal ke Bank Soal</span>
                  </button>
                </div>
              </div>
            ) : draft ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0F172A] bg-slate-100 px-3 py-1 rounded-full uppercase">
                      {draft.tipeSoal.replace("_", " ")}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 capitalize">
                      Tingkat {draft.tingkatSoal}
                    </span>
                  </div>

                  <button
                    onClick={handleSaveToBank}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Simpan ke Bank Soal</span>
                  </button>
                </div>

                {/* Pertanyaan */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Pertanyaan Latihan:
                  </span>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900">
                    <MarkdownRenderer content={draft.pertanyaan} />
                  </div>
                </div>

                {/* Opsi Pilihan Ganda */}
                {draft.tipeSoal === "pilihan_ganda" && draft.opsiSoal?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Opsi Pilihan Ganda:
                    </span>
                    <div className="space-y-2">
                      {draft.opsiSoal.map((o: any, idx: number) => {
                        const letter = String.fromCharCode(65 + idx);
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${
                              o.benar
                                ? "border-emerald-500 bg-emerald-50/60 font-bold text-emerald-900"
                                : "border-slate-200 bg-white text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                  o.benar
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {letter}
                              </span>
                              <MarkdownRenderer content={o.teksOpsi} />
                            </div>
                            {o.benar && (
                              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Kunci Jawaban
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pembahasan & Rubrik */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Kunci Jawaban:
                    </span>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                      <MarkdownRenderer content={draft.kunciJawaban} isCompact />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Pembahasan & Solusi KaTeX:
                    </span>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
                      <MarkdownRenderer content={draft.pembahasan} />
                    </div>
                  </div>
                </div>
              </div>
            ) : !materiLengkap ? (
              <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">
                  Belum Ada Modul / Soal yang Digenerate
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Pilih bab matematika di formulir sebelah kiri, lalu klik tombol generate untuk menyusun 15 butir soal standar per bab atau modul pembelajaran.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
