"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import GuruLayout from "@/components/guru/GuruLayout";
import ReviewStyleQuestionCard, {
  ReviewQuestionItem,
} from "@/components/guru/ReviewStyleQuestionCard";
import AiQuestionGeneratorModal, {
  MATEMATIKA_SMP_BAB_LIST,
} from "@/components/guru/AiQuestionGeneratorModal";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Save,
  Loader2,
  Clock,
  Award,
  BookOpen,
  Key,
  FileText,
  Check,
  Zap,
} from "lucide-react";
import { generateChapterQuestions } from "@/lib/curriculum-quiz-engine";

function GuruBuatUjianContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramTipe = searchParams.get("tipe");
  const initialTipe: "ulangan" | "ujian" = paramTipe === "ujian" ? "ujian" : "ulangan";

  const [tipe, setTipe] = useState<"ulangan" | "ujian">(initialTipe);
  const mapel = "Matematika";
  const [judul, setJudul] = useState("Ulangan Formatif Bab 1: Bilangan Berpangkat & Bentuk Akar");
  const [deskripsi, setDeskripsi] = useState(
    "Kerjakan 15 butir soal latihan dan evaluasi formatif matematika dengan teliti."
  );
  const [durasiMenit, setDurasiMenit] = useState(initialTipe === "ulangan" ? 60 : 90);
  const [passingGrade, setPassingGrade] = useState(75);
  const [token, setToken] = useState(() => {
    const tag = initialTipe === "ulangan" ? "ULG" : "PTS";
    return `MTK-${tag}${Math.floor(10 + Math.random() * 90)}`;
  });

  const [babList, setBabList] = useState(MATEMATIKA_SMP_BAB_LIST);
  const [selectedBabId, setSelectedBabId] = useState(MATEMATIKA_SMP_BAB_LIST[0].id);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [generatingVariasiId, setGeneratingVariasiId] = useState<string | null>(null);

  // Ambil daftar bab dari API jika tersedia, tetap fallback ke 8 bab matematika
  useEffect(() => {
    async function fetchBabDb() {
      try {
        const res = await fetch("/api/guru/bab?mapel=Matematika&kelas=8");
        const data = await res.json();
        if (data?.babs && Array.isArray(data.babs) && data.babs.length > 0) {
          setBabList(data.babs);
          setSelectedBabId(data.babs[0].id);
        }
      } catch (e) {
        // Fallback ke MATEMATIKA_SMP_BAB_LIST
      }
    }
    fetchBabDb();
  }, []);

  // Soal List (Default 15 Soal Standar Bab 1)
  const [soalList, setSoalList] = useState<ReviewQuestionItem[]>(() => {
    const initialQuestions = generateChapterQuestions(
      MATEMATIKA_SMP_BAB_LIST[0].judul,
      "Matematika",
      8
    );
    return initialQuestions.map((q) => ({
      id: q.id,
      pertanyaan: q.pertanyaan,
      tipeSoal: q.tipeSoal,
      kunciJawaban: q.kunciJawaban,
      pembahasan: q.pembahasan,
      poin: 10,
      opsi: (q.opsiSoal || []).map((o) => ({
        teks: o.teksOpsi,
        benar: Boolean(o.benar),
        alasanSalah: o.benar ? "" : "Konsep dasar pada opsi ini perlu diperiksa kembali.",
      })),
    }));
  });

  // Saat bab dipilih berubah, sesuaikan judul dan muat 15 soal spesifik bab tersebut
  const handleSelectBab = (babId: string) => {
    setSelectedBabId(babId);
    const activeBab = babList.find((b) => b.id === babId) || MATEMATIKA_SMP_BAB_LIST[0];
    setJudul(
      tipe === "ujian"
        ? `Ujian Tengah/Akhir Semester (Mencakup ${activeBab.judul})`
        : `Ulangan Formatif ${activeBab.judul}`
    );
    loadQuestionsForBab(activeBab.judul);
  };

  // Muat 15 butir soal matematis spesifik bab
  const loadQuestionsForBab = (babJudul: string) => {
    const generated = generateChapterQuestions(babJudul, "Matematika", 8);
    setSoalList(
      generated.map((q) => ({
        id: q.id,
        pertanyaan: q.pertanyaan,
        tipeSoal: q.tipeSoal,
        kunciJawaban: q.kunciJawaban,
        pembahasan: q.pembahasan,
        poin: 10,
        opsi: (q.opsiSoal || []).map((o) => ({
          teks: o.teksOpsi,
          benar: Boolean(o.benar),
          alasanSalah: o.benar ? "" : "Konsep dasar pada opsi ini perlu diperiksa kembali.",
        })),
      }))
    );
  };

  // Hitung komposisi soal
  const pgCount = soalList.filter((s) => s.tipeSoal === "pilihan_ganda").length;
  const isianCount = soalList.filter((s) => s.tipeSoal === "isian_singkat").length;
  const esaiCount = soalList.filter((s) => s.tipeSoal === "esai").length;
  const isStandar15 =
    soalList.length === 15 && pgCount === 10 && isianCount === 3 && esaiCount === 2;

  // Tombol Muat Paket 15 Soal Standar
  const handleLoadStandard15 = () => {
    const activeBab = babList.find((b) => b.id === selectedBabId) || MATEMATIKA_SMP_BAB_LIST[0];
    loadQuestionsForBab(activeBab.judul);
  };

  // Tambah Soal Manual
  const handleAddQuestion = () => {
    const newIdx = soalList.length + 1;
    const defaultType: "pilihan_ganda" | "isian_singkat" | "esai" =
      newIdx <= 10 ? "pilihan_ganda" : newIdx <= 13 ? "isian_singkat" : "esai";

    setSoalList((prev) => [
      ...prev,
      {
        id: `soal-${Date.now()}-${newIdx}`,
        pertanyaan: `${newIdx}. Tuliskan pertanyaan matematika baru (Mendukung KaTeX $a^2 + b^2 = c^2$)...`,
        tipeSoal: defaultType,
        poin: 10,
        kunciJawaban: defaultType === "pilihan_ganda" ? "Pilihan A" : "",
        pembahasan: "Pembahasan konsep matematika langkah demi langkah...",
        opsi:
          defaultType === "pilihan_ganda"
            ? [
                { teks: "Pilihan A", benar: true },
                { teks: "Pilihan B", benar: false, alasanSalah: "Konsep dasar pada opsi ini keliru." },
                { teks: "Pilihan C", benar: false, alasanSalah: "Konsep dasar pada opsi ini keliru." },
                { teks: "Pilihan D", benar: false, alasanSalah: "Konsep dasar pada opsi ini keliru." },
              ]
            : [],
      },
    ]);
  };

  // Hapus Soal
  const handleRemoveQuestion = (idx: number) => {
    setSoalList((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update Soal
  const handleUpdateQuestion = (idx: number, patch: Partial<ReviewQuestionItem>) => {
    setSoalList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  // Reorder
  const handleMoveQuestion = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= soalList.length) return;
    setSoalList((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy;
    });
  };

  // Variasi AI per Soal
  const handleAiVariasi = async (idx: number) => {
    const targetQ = soalList[idx];
    if (!targetQ) return;
    setGeneratingVariasiId(targetQ.id);
    const activeBab = babList.find((b) => b.id === selectedBabId) || MATEMATIKA_SMP_BAB_LIST[0];

    try {
      const res = await fetch("/api/guru/generate-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topik: `${activeBab.judul} - Variasi Soal Serupa: ${targetQ.pertanyaan.substring(0, 100)}`,
          babId: selectedBabId,
          mapel: "Matematika",
          tipeSoal: targetQ.tipeSoal,
          tingkatSoal: "sedang",
          mode: "soal",
          jumlah: 1,
        }),
      });
      const data = await res.json();
      if (data.soal && data.soal[0]) {
        const newQ = data.soal[0];
        setSoalList((prev) => {
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            pertanyaan: newQ.pertanyaan,
            kunciJawaban: newQ.kunciJawaban,
            pembahasan: newQ.pembahasan,
            opsi: newQ.opsi || copy[idx].opsi,
          };
          return copy;
        });
      }
    } catch (err: any) {
      alert("Gagal membuat variasi AI: " + err.message);
    } finally {
      setGeneratingVariasiId(null);
    }
  };

  // Submit Simpan Ujian
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul) {
      alert("Judul ujian wajib diisi!");
      return;
    }

    if (soalList.length === 0) {
      alert("Daftar soal tidak boleh kosong!");
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch("/api/guru/ujian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul,
          deskripsi,
          mapel: "Matematika",
          tipe,
          token: token.trim().toUpperCase(),
          durasiMenit,
          passingGrade,
          babId: selectedBabId || null,
          soalList,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/guru/ujian");
      } else {
        alert(data.error || "Gagal menyimpan ujian.");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat membuat ujian.");
    } finally {
      setIsSaving(false);
    }
  };

  const activeBab = babList.find((b) => b.id === selectedBabId) || MATEMATIKA_SMP_BAB_LIST[0];

  return (
    <GuruLayout activeView="ujian">
      <form onSubmit={handleSaveExam} className="space-y-8 max-w-5xl mx-auto pb-16">
        {/* Navigation & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/guru/ujian"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Ujian</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menerbitkan Ujian...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>Terbitkan Lembar Ujian Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 1: Exam Metadata (Khusus Matematika) */}
        <div className="saas-card rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block mb-1.5">
                  Kurikulum Merdeka • Matematika SMP Kelas 8
                </span>
                <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
                  {tipe === "ujian" ? "Rancang Ujian Resmi (PTS / PAS)" : "Rancang Lembar Ulangan / Kuis Formatif"}
                </h1>
              </div>

              {/* Tipe Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setTipe("ulangan");
                    setDurasiMenit(60);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                    tipe === "ulangan"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Ulangan / Kuis Bab
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipe("ujian");
                    setDurasiMenit(90);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                    tipe === "ujian"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Ujian Resmi (PTS/PAS)
                </button>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Pilihan Cakupan / Bab */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilih Bab Materi Matematika:</span>
              </label>
              <select
                value={selectedBabId}
                onChange={(e) => handleSelectBab(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {babList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.judul}
                  </option>
                ))}
              </select>
            </div>

            {/* Judul */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Judul Asesmen / Ulangan:</span>
              </label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Ulangan Formatif Bab 1: Bilangan Berpangkat & Bentuk Akar"
              />
            </div>

            {/* Durasi & KKM */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Durasi Pengerjaan (Menit):</span>
              </label>
              <input
                type="number"
                min={10}
                max={240}
                value={durasiMenit}
                onChange={(e) => setDurasiMenit(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Passing Grade / KKM (Skala 100):</span>
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={passingGrade}
                onChange={(e) => setPassingGrade(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-600" />
                <span>Token Akses Masuk Siswa:</span>
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Petunjuk Pengerjaan untuk Siswa:</label>
              <textarea
                rows={2}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Questions Builder (Review-Style Question Cards) */}
        <div className="saas-card rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-[#0F172A]">
                  Daftar Soal Ujian ({soalList.length} Soal)
                </h2>
                {isStandar15 ? (
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Standar Kurikulum Terpenuhi (10 PG • 3 Singkat • 2 Esai)</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    {pgCount} PG • {isianCount} Jawaban Singkat • {esaiCount} Esai
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tampilan editor bergaya Review Lembar Jawaban. Setiap butir soal menampilkan formula KaTeX, opsi distraktor beserta alasan miskonsepsi, dan pembahasan konseptual.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-98"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Buat Soal AI Sesuai Bab</span>
              </button>

              <button
                type="button"
                onClick={handleLoadStandard15}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Paket 15 Standar</span>
              </button>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ Soal Manual</span>
              </button>
            </div>
          </div>

          {/* List Soal dengan ReviewStyleQuestionCard */}
          <div className="space-y-4">
            {soalList.map((s, sIdx) => (
              <ReviewStyleQuestionCard
                key={s.id || `q-${sIdx}`}
                question={s}
                index={sIdx}
                total={soalList.length}
                onUpdate={(patch) => handleUpdateQuestion(sIdx, patch)}
                onDelete={() => handleRemoveQuestion(sIdx)}
                onMoveUp={sIdx > 0 ? () => handleMoveQuestion(sIdx, sIdx - 1) : undefined}
                onMoveDown={
                  sIdx < soalList.length - 1
                    ? () => handleMoveQuestion(sIdx, sIdx + 1)
                    : undefined
                }
                onAiVariasi={() => handleAiVariasi(sIdx)}
                isGeneratingVariasi={generatingVariasiId === s.id}
              />
            ))}
          </div>
        </div>

        {/* Modal AI Generator */}
        <AiQuestionGeneratorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          defaultBabJudul={activeBab.judul}
          defaultBabId={selectedBabId}
          onInsertQuestion={(newQ) => setSoalList((prev) => [...prev, newQ])}
          onInsertMultipleQuestions={(newQs) => setSoalList((prev) => [...prev, ...newQs])}
        />
      </form>
    </GuruLayout>
  );
}

export default function GuruBuatUjianPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B1A2E]" />
        </div>
      }
    >
      <GuruBuatUjianContent />
    </Suspense>
  );
}
