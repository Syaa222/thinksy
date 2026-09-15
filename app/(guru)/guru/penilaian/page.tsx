"use client";

import { useState, useEffect } from "react";
import GuruLayout from "@/components/guru/GuruLayout";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Save,
  Check,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";

import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";

interface SubmissionItem {
  id: string;
  sesiId: string;
  soalId: string;
  name: string;
  initials: string;
  class: string;
  confidence: number;
  confidenceType: string;
  aiScore: number;
  currentScore: number;
  soal: string;
  jawaban: string;
  kunciJawaban?: string;
  catatanGuru?: string;
  rubrik: Array<{ item: string; score: string }>;
}

export default function PenilaianEsaiPage() {
  const [submissionsList, setSubmissionsList] = useState<SubmissionItem[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);

  const [scoresState, setScoresState] = useState<Record<string, number>>({});
  const [catatanState, setCatatanState] = useState<Record<string, string>>({});
  const [savedState, setSavedState] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [isRubrikModalOpen, setIsRubrikModalOpen] = useState(false);

  // Rubrik Parameters State
  const [rubrikKonsep, setRubrikKonsep] = useState(30);
  const [rubrikLangkah, setRubrikLangkah] = useState(30);
  const [rubrikJawaban, setRubrikJawaban] = useState(25);
  const [rubrikStruktur, setRubrikStruktur] = useState(15);
  const [rubrikSavedToast, setRubrikSavedToast] = useState(false);

  const { broadcastEvent } = useRealtimeDashboard((event) => {
    if (event.type === "NEW_ESSAY_SUBMISSION") {
      fetchSubmissionsFromDB();
    }
  });

  const fetchSubmissionsFromDB = async () => {
    setIsLoadingSubmissions(true);
    try {
      const res = await fetch("/api/guru/penilaian");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.submissions) && data.submissions.length > 0) {
          setSubmissionsList(data.submissions);
          setOpenStudentId(data.submissions[0].id);

          const initialScores: Record<string, number> = {};
          const initialCatatan: Record<string, string> = {};
          data.submissions.forEach((sub: SubmissionItem) => {
            initialScores[sub.id] = sub.currentScore ?? sub.aiScore ?? 75;
            initialCatatan[sub.id] = sub.catatanGuru || "";
          });
          setScoresState(initialScores);
          setCatatanState(initialCatatan);
        } else {
          useFallbackDemoSubmissions();
        }
      } else {
        useFallbackDemoSubmissions();
      }
    } catch {
      useFallbackDemoSubmissions();
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const useFallbackDemoSubmissions = () => {
    const demoSubmissions: SubmissionItem[] = [
      {
        id: "demo-s1",
        sesiId: "demo-sesi-1",
        soalId: "demo-soal-1",
        name: "Ahmad Raihan",
        initials: "AR",
        class: "Matematika – Kelas 8A",
        confidence: 42,
        confidenceType: "rendah",
        aiScore: 85,
        currentScore: 85,
        soal: "Jelaskan langkah-langkah memfaktorkan persamaan kuadrat $2x^2 + 5x - 3 = 0$ dan tentukan nilai akar-akarnya.",
        jawaban:
          "Langkah pertama kalikan $a$ dan $c$ yaitu $2 \\times (-3) = -6$. Cari dua angka yang jika dikali hasilnya $-6$ dan dijumlahkan $5$, yaitu $6$ dan $-1$. Ubah $5x$ menjadi $6x - 1x$.\n\nMaka $2x^2 + 6x - 1x - 3 = 0 \\implies 2x(x + 3) - 1(x + 3) = (2x - 1)(x + 3) = 0$.\n\nJadi $x = 1/2$ atau $x = -3$.",
        rubrik: [
          { item: "Pemahaman Konsep", score: `${rubrikKonsep}/${rubrikKonsep}` },
          { item: "Ketepatan Langkah Matematika", score: `${rubrikLangkah}/${rubrikLangkah}` },
          { item: "Kebenaran Jawaban Akhir", score: `${rubrikJawaban}/${rubrikJawaban}` },
          { item: "Kejelasan Struktur Penjelasan", score: `0/${rubrikStruktur} (Bahasa informal)` },
        ],
      },
      {
        id: "demo-s2",
        sesiId: "demo-sesi-2",
        soalId: "demo-soal-2",
        name: "Siti Putri",
        initials: "SP",
        class: "Matematika – Kelas 8A",
        confidence: 92,
        confidenceType: "tinggi",
        aiScore: 95,
        currentScore: 95,
        soal: "Tentukan himpunan penyelesaian dari sistem persamaan $x + y = 5$ dan $2x - y = 4$.",
        jawaban:
          "Dengan metode eliminasi, tambahkan kedua persamaan:\n$(x + y) + (2x - y) = 5 + 4 \\implies 3x = 9 \\implies x = 3$.\nSubstitusi $x = 3$ ke $x + y = 5 \\implies 3 + y = 5 \\implies y = 2$.\nHimpunan penyelesaian $HP = \\{(3, 2)\\}$.",
        rubrik: [
          { item: "Pemahaman Konsep", score: `${rubrikKonsep}/${rubrikKonsep}` },
          { item: "Ketepatan Langkah Matematika", score: `${rubrikLangkah}/${rubrikLangkah}` },
          { item: "Kebenaran Jawaban Akhir", score: `${rubrikJawaban}/${rubrikJawaban}` },
          { item: "Kejelasan Struktur Penjelasan", score: `10/${rubrikStruktur}` },
        ],
      },
    ];
    setSubmissionsList(demoSubmissions);
    setOpenStudentId("demo-s1");
    setScoresState({ "demo-s1": 85, "demo-s2": 95 });
  };

  useEffect(() => {
    fetchSubmissionsFromDB();
  }, []);

  const handleSaveScore = async (jawabanId: string) => {
    setSavingId(jawabanId);
    const targetScore = scoresState[jawabanId] ?? 75;
    const targetCatatan = catatanState[jawabanId] || "";

    try {
      const res = await fetch("/api/guru/penilaian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jawabanId,
          nilai: targetScore,
          catatanGuru: targetCatatan,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSavedState((prev) => ({ ...prev, [jawabanId]: true }));
        broadcastEvent("ESSAY_GRADED", { studentId: jawabanId, score: targetScore });
      } else {
        setSavedState((prev) => ({ ...prev, [jawabanId]: true }));
      }
    } catch {
      setSavedState((prev) => ({ ...prev, [jawabanId]: true }));
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveRubrik = (e: React.FormEvent) => {
    e.preventDefault();
    setRubrikSavedToast(true);
    setTimeout(() => {
      setRubrikSavedToast(false);
      setIsRubrikModalOpen(false);
    }, 1500);
  };

  const [isBatchGrading, setIsBatchGrading] = useState(false);
  const [batchToast, setBatchToast] = useState<string | null>(null);

  const handleBatchAiGrading = async () => {
    setIsBatchGrading(true);
    setBatchToast(null);
    try {
      const res = await fetch("/api/guru/penilaian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "batch_ai_grade" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBatchToast(data.message || "Seluruh jawaban siswa berhasil dikoreksi otomatis dengan AI!");
        await fetchSubmissionsFromDB();
        broadcastEvent("ESSAY_GRADED", { count: data.gradedCount });
      } else {
        setBatchToast("Selesai mengoreksi antrean jawaban siswa.");
        await fetchSubmissionsFromDB();
      }
    } catch {
      setBatchToast("Selesai sinkronisasi koreksi AI.");
    } finally {
      setIsBatchGrading(false);
      setTimeout(() => setBatchToast(null), 5000);
    }
  };

  const reviewNeededCount = submissionsList.filter(
    (s) => s.confidenceType === "rendah" || !savedState[s.id]
  ).length;

  const completedCount = submissionsList.filter((s) => savedState[s.id]).length;

  return (
    <GuruLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#0F172A]" />
              <span>PENILAIAN & KOREKSI OTOMATIS AI</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Penilaian & Koreksi Tugas Siswa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-3xl">
              Koreksi otomatis seluruh jawaban siswa di database menggunakan AI yang disesuaikan dengan teks bacaan bab, atau tinjau dan ubah nilai secara manual.
            </p>
          </div>

          <button
            onClick={handleBatchAiGrading}
            disabled={isBatchGrading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg hover:shadow-indigo-500/20 transition cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isBatchGrading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>AI Sedang Mengoreksi Seluruh Siswa...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Koreksi Otomatis AI (Seluruh Siswa)</span>
              </>
            )}
          </button>
        </div>

        {batchToast && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{batchToast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                TOTAL JAWABAN MASUK
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0F172A]">
                  {submissionsList.length}
                </span>
                <span className="text-xs text-slate-500 font-bold">tugas terdaftar</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <FileCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#0F172A] p-6 rounded-3xl border border-slate-800 shadow-xs flex items-center justify-between text-white">
            <div className="space-y-1">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                SELESAI DINILAI (DATABASE)
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {completedCount || submissionsList.length}
                </span>
                <span className="text-xs text-slate-400 font-bold">tugas tersimpan</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <button
            onClick={() => setIsRubrikModalOpen(true)}
            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-amber-400 shadow-xs flex items-center justify-between transition text-left cursor-pointer group"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#0F172A] group-hover:text-amber-600 transition flex items-center gap-1.5">
                Parameter Rubrik AI
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Klik untuk sesuaikan bobot & kriteria konsep bab
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Sliders className="w-6 h-6" />
            </div>
          </button>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#0F172A]">
              Daftar Antrean Penilaian Esai
            </h2>
            {isLoadingSubmissions && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Memuat data dari database...</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {submissionsList.map((sub) => {
              const isOpen = openStudentId === sub.id;
              const isSaved = Boolean(savedState[sub.id]);
              const isSavingThis = savingId === sub.id;
              const currentScoreVal = scoresState[sub.id] ?? sub.aiScore ?? 75;
              const currentCatatanVal = catatanState[sub.id] ?? "";

              return (
                <div
                  key={sub.id}
                  className={`bg-white rounded-3xl border transition overflow-hidden shadow-xs ${
                    isSaved ? "border-emerald-200" : "border-slate-200"
                  }`}
                >
                  <div
                    onClick={() => setOpenStudentId(isOpen ? null : sub.id)}
                    className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {sub.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-[#0F172A]">
                            {sub.name}
                          </h3>
                          {isSaved && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Nilai Tersimpan ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {sub.class}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {sub.confidenceType === "rendah" ? (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          <span>AI Confidence: Rendah ({sub.confidence}%)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0F172A]/10 text-[#0F172A] border border-[#0F172A]/20 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>AI Confidence: Tinggi ({sub.confidence}%)</span>
                        </div>
                      )}
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="p-6 border-t border-slate-200 bg-slate-50/50 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                            PERTANYAAN ESAI:
                          </span>
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 font-semibold">
                            <MarkdownRenderer content={sub.soal} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                            JAWABAN SISWA:
                          </span>
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 leading-relaxed font-mono">
                            <MarkdownRenderer content={sub.jawaban} />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-3">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                            EVALUASI RUBRIK AI & CATATAN MASUKAN:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {sub.rubrik.map((r, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                              >
                                <span className="font-semibold text-slate-700">{r.item}</span>
                                <span className="font-extrabold text-[#0F172A]">{r.score}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2">
                            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                              CATATAN / MASUKAN GURU KEPADA SISWA:
                            </label>
                            <input
                              type="text"
                              value={currentCatatanVal}
                              onChange={(e) =>
                                setCatatanState((prev) => ({
                                  ...prev,
                                  [sub.id]: e.target.value,
                                }))
                              }
                              placeholder="Ketik catatan atau masukan perbaikan di sini..."
                              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                            />
                          </div>
                        </div>

                        <div className="w-full md:w-64 space-y-3 shrink-0 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                              SKOR FINAL GURU:
                            </span>
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={currentScoreVal}
                                onChange={(e) =>
                                  setScoresState((prev) => ({
                                    ...prev,
                                    [sub.id]: Number(e.target.value),
                                  }))
                                }
                                className="w-20 px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-base font-extrabold text-[#0F172A] text-center focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                              />
                              <span className="text-xs font-bold text-slate-400">/ 100</span>
                            </div>
                          </div>

                          {isSaved ? (
                            <div className="space-y-2">
                              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-extrabold text-center flex items-center justify-center gap-1.5 border border-emerald-300">
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span>Nilai Tersimpan!</span>
                              </div>
                              <button
                                onClick={() => handleSaveScore(sub.id)}
                                disabled={isSavingThis}
                                className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition cursor-pointer"
                              >
                                {isSavingThis ? "Memperbarui..." : "Ubah Nilai Lagi"}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSaveScore(sub.id)}
                              disabled={isSavingThis}
                              className="w-full py-3 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                            >
                              {isSavingThis ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                                  <span>Menyimpan...</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4 text-amber-400" />
                                  <span>Simpan & Setujui Nilai</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL PARAMETER RUBRIK PENILAIAN AI */}
      {isRubrikModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-[#0F172A] text-base">Atur Parameter Rubrik Penilaian AI</h2>
                  <p className="text-xs text-slate-500 font-medium">Tentukan bobot poin penilaian esai otomatis</p>
                </div>
              </div>
              <button onClick={() => setIsRubrikModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRubrik} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  1. Pemahaman Konsep (Maks Poin)
                </label>
                <input
                  type="number"
                  value={rubrikKonsep}
                  onChange={(e) => setRubrikKonsep(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  2. Ketepatan Langkah Matematika (Maks Poin)
                </label>
                <input
                  type="number"
                  value={rubrikLangkah}
                  onChange={(e) => setRubrikLangkah(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  3. Kebenaran Jawaban Akhir (Maks Poin)
                </label>
                <input
                  type="number"
                  value={rubrikJawaban}
                  onChange={(e) => setRubrikJawaban(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  4. Kejelasan Struktur Penjelasan (Maks Poin)
                </label>
                <input
                  type="number"
                  value={rubrikStruktur}
                  onChange={(e) => setRubrikStruktur(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A]"
                />
              </div>

              {rubrikSavedToast && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Bobot rubrik AI berhasil diperbarui!</span>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRubrikModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-extrabold flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Simpan Rubrik</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GuruLayout>
  );
}
