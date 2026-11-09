"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GuruLayout from "@/components/guru/GuruLayout";
import ReviewStyleQuestionCard, {
  ReviewQuestionItem,
} from "@/components/guru/ReviewStyleQuestionCard";
import AiQuestionGeneratorModal from "@/components/guru/AiQuestionGeneratorModal";
import {
  ArrowLeft,
  Plus,
  Save,
  Loader2,
  Clock,
  Award,
  CheckCircle2,
  Key,
  Layers,
  Sparkles,
  AlertCircle,
  BookOpen,
} from "lucide-react";

export default function EditUjianPage({
  params,
}: {
  params: Promise<{ ujianId: string }>;
}) {
  const { ujianId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Exam Meta
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

  // Questions State (Review-Style items)
  const [soalList, setSoalList] = useState<ReviewQuestionItem[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [generatingVariasiId, setGeneratingVariasiId] = useState<string | null>(null);

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

          if (Array.isArray(data.soalList) && data.soalList.length > 0) {
            setSoalList(data.soalList);
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

  // Question manipulation
  const handleAddQuestion = () => {
    const newIdx = soalList.length + 1;
    const defaultType: "pilihan_ganda" | "isian_singkat" | "esai" =
      newIdx <= 10 ? "pilihan_ganda" : newIdx <= 13 ? "isian_singkat" : "esai";

    const newQ: ReviewQuestionItem = {
      id: `temp-${Date.now()}-${newIdx}`,
      pertanyaan: `Tuliskan pertanyaan butir soal #${newIdx} di sini (Mendukung KaTeX $a^2 + b^2 = c^2$)...`,
      tipeSoal: defaultType,
      poin: 10,
      kunciJawaban: defaultType === "pilihan_ganda" ? "Pilihan A" : "",
      pembahasan: "Tuliskan langkah-langkah penyelesaian konsep matematika materi terkait.",
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
  };

  const handleDeleteQuestion = (idx: number) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Soal #${idx + 1}?`)) {
      setSoalList((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleUpdateQuestion = (idx: number, patch: Partial<ReviewQuestionItem>) => {
    setSoalList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const handleMoveQuestion = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= soalList.length) return;
    setSoalList((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy;
    });
  };

  const handleAiVariasi = async (idx: number) => {
    const targetQ = soalList[idx];
    if (!targetQ) return;
    setGeneratingVariasiId(targetQ.id);
    try {
      const res = await fetch("/api/guru/generate-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topik: `${babJudul || "Matematika SMP"} - Variasi Soal: ${targetQ.pertanyaan.substring(0, 100)}`,
          babId,
          mapel,
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

  const handleInsertAiQuestion = (newQ: ReviewQuestionItem) => {
    setSoalList((prev) => [...prev, newQ]);
  };

  const handleInsertMultipleAiQuestions = (newQs: ReviewQuestionItem[]) => {
    setSoalList((prev) => [...prev, ...newQs]);
  };

  const handleSaveExam = async () => {
    if (!judul.trim()) {
      alert("Judul ujian wajib diisi!");
      return;
    }
    if (soalList.length === 0) {
      alert("Harus ada minimal 1 butir soal dalam lembar ujian!");
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
          soalList,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Semua perubahan butir soal dan pengaturan ujian berhasil disimpan!");
        setTimeout(() => {
          router.push("/guru/ujian");
        }, 1200);
      } else {
        setErrorMsg(data.error || "Gagal menyimpan perubahan ujian.");
      }
    } catch (err: any) {
      setErrorMsg("Terjadi kesalahan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const pgCount = soalList.filter((s) => s.tipeSoal === "pilihan_ganda").length;
  const isianCount = soalList.filter((s) => s.tipeSoal === "isian_singkat").length;
  const esaiCount = soalList.filter((s) => s.tipeSoal === "esai").length;

  return (
    <GuruLayout activeView="ujian">
      <div className="max-w-5xl mx-auto space-y-6 pb-24">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/guru/ujian"
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  Mode Edit Ujian & Kuis
                </span>
                {babJudul && (
                  <span className="text-[11px] font-medium text-slate-500">
                    • {babJudul}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Edit Soal & Lembar Ujian Siswa
              </h1>
            </div>
          </div>

          <button
            onClick={handleSaveExam}
            disabled={saving || loading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Memuat lembar ujian & butir soal...</p>
          </div>
        ) : (
          <>
            {/* Metadata Section Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Pengaturan & Informasi Umum Ujian</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Judul Ujian / Ulangan / Kuis</label>
                  <input
                    type="text"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Contoh: Ulangan Bab 1: Bilangan Berpangkat & Bentuk Akar"
                    className="w-full px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Deskripsi Petunjuk Siswa</label>
                  <textarea
                    rows={2}
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Tuliskan petunjuk pengerjaan bagi siswa..."
                    className="w-full px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
                      className="w-full px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
                      className="w-full px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
                      className="w-full px-4 py-2 text-xs font-bold uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Status Ujian</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                  >
                    <option value="dipublikasi">Dibuka / Aktif (Siswa dapat mengerjakan)</option>
                    <option value="ditutup">Ditutup / Nonaktif</option>
                    <option value="draft">Draft (Hanya Guru)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Questions Toolbar & Header */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Lembar Soal Ujian ({soalList.length} Butir Soal)
                  </h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {pgCount} PG • {isianCount} Isian Singkat • {esaiCount} Esai
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tampilan editor bergaya Review Lembar Jawaban. Guru dapat meninjau render KaTeX rumus, menentukan kunci benar, dan mengisi analisis miskonsepsi opsi salah.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Buat Soal dengan AI Sesuai Bab</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Tambah Soal Manual</span>
                </button>
              </div>
            </div>

            {/* Questions List (ReviewStyleQuestionCard) */}
            <div className="space-y-4">
              {soalList.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-700">Belum ada butir soal</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Gunakan Asisten AI untuk membuat soal otomatis sesuai bab kurikulum atau tambahkan soal manual.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Buat Soal dengan AI</span>
                  </button>
                </div>
              ) : (
                soalList.map((q, qIdx) => (
                  <ReviewStyleQuestionCard
                    key={q.id || `q-${qIdx}`}
                    question={q}
                    index={qIdx}
                    total={soalList.length}
                    onUpdate={(patch) => handleUpdateQuestion(qIdx, patch)}
                    onDelete={() => handleDeleteQuestion(qIdx)}
                    onMoveUp={qIdx > 0 ? () => handleMoveQuestion(qIdx, qIdx - 1) : undefined}
                    onMoveDown={
                      qIdx < soalList.length - 1
                        ? () => handleMoveQuestion(qIdx, qIdx + 1)
                        : undefined
                    }
                    onAiVariasi={() => handleAiVariasi(qIdx)}
                    isGeneratingVariasi={generatingVariasiId === q.id}
                  />
                ))
              )}
            </div>

            {/* Bottom Floating Save Bar */}
            <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-md flex items-center justify-between gap-4 sticky bottom-4 z-20">
              <div className="text-xs text-slate-600 font-medium">
                Total: <span className="font-bold text-slate-900">{soalList.length} butir soal</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition border border-indigo-200 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>+ Soal AI</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveExam}
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </button>
              </div>
            </div>
          </>
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
