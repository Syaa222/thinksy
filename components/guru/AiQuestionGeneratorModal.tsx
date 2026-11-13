"use client";

import { useState } from "react";
import { ReviewQuestionItem } from "./ReviewStyleQuestionCard";
import {
  Sparkles,
  X,
  BookOpen,
  Award,
  HelpCircle,
  Hash,
  FileEdit,
  Loader2,
  AlertCircle,
} from "lucide-react";

export const MATEMATIKA_SMP_BAB_LIST = [
  { id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", nomor: 1, judul: "Bab 1: Bilangan Berpangkat & Bentuk Akar" },
  { id: "b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22", nomor: 2, judul: "Bab 2: Teorema Pythagoras" },
  { id: "b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33", nomor: 3, judul: "Bab 3: Persamaan & Pertidaksamaan Linear Satu Variabel (PLSV & PtLSV)" },
  { id: "b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44", nomor: 4, judul: "Bab 4: Relasi & Fungsi" },
  { id: "b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55", nomor: 5, judul: "Bab 5: Persamaan Garis Lurus (PGL)" },
  { id: "b6eebc99-9c0b-4ef8-bb6d-6bb9bd380a66", nomor: 6, judul: "Bab 6: Statistika" },
  { id: "b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a77", nomor: 7, judul: "Bab 7: Peluang" },
  { id: "b8eebc99-9c0b-4ef8-bb6d-6bb9bd380a88", nomor: 8, judul: "Bab 8: Bangun Ruang Sisi Datar (BRSD)" },
];

interface AiQuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBabJudul?: string;
  defaultBabId?: string;
  onInsertQuestion: (question: ReviewQuestionItem) => void;
  onInsertMultipleQuestions?: (questions: ReviewQuestionItem[]) => void;
}

export default function AiQuestionGeneratorModal({
  isOpen,
  onClose,
  defaultBabJudul,
  defaultBabId,
  onInsertQuestion,
  onInsertMultipleQuestions,
}: AiQuestionGeneratorModalProps) {
  // Tentukan bab awal dari props
  const initialBab = MATEMATIKA_SMP_BAB_LIST.find(
    (b) =>
      b.id === defaultBabId ||
      (defaultBabJudul && b.judul.toLowerCase().includes(defaultBabJudul.toLowerCase()))
  ) || MATEMATIKA_SMP_BAB_LIST[0];

  const [selectedBabId, setSelectedBabId] = useState(initialBab.id);
  const [selectedBabJudul, setSelectedBabJudul] = useState(
    defaultBabJudul || initialBab.judul
  );
  const [isCustomBab, setIsCustomBab] = useState(false);
  const [customBabText, setCustomBabText] = useState("");

  const [tingkatKesulitan, setTingkatKesulitan] = useState<
    "mudah" | "sedang" | "sulit"
  >("sedang");

  const [jumlahSoal, setJumlahSoal] = useState<number>(3);

  const [tipeSoal, setTipeSoal] = useState<
    "pilihan_ganda" | "isian_singkat" | "esai" | "campuran"
  >("pilihan_ganda");

  const [instruksiTambahan, setInstruksiTambahan] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeTopikName = isCustomBab
    ? customBabText.trim() || "Topik Matematika Khusus"
    : selectedBabJudul;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/guru/generate-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topik: activeTopikName,
          babId: isCustomBab ? null : selectedBabId,
          mapel: "Matematika",
          tingkatSoal: tingkatKesulitan,
          tipeSoal: tipeSoal,
          jumlah: jumlahSoal,
          instruksiTambahan: instruksiTambahan.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || (!data.soal && !data.draft)) {
        throw new Error(data.error || "Gagal menghasilkan soal dengan AI.");
      }

      let generatedQuestions: ReviewQuestionItem[] = [];

      if (Array.isArray(data.soal) && data.soal.length > 0) {
        generatedQuestions = data.soal.map((s: any, idx: number) => ({
          id: s.id || `ai-${Date.now()}-${idx + 1}`,
          pertanyaan: s.pertanyaan || "Pertanyaan matematika...",
          tipeSoal: (s.tipeSoal || tipeSoal === "campuran" ? (s.tipeSoal || "pilihan_ganda") : tipeSoal) as
            | "pilihan_ganda"
            | "isian_singkat"
            | "esai",
          kunciJawaban: s.kunciJawaban || "",
          pembahasan: s.pembahasan || "",
          poin: 10,
          opsi: (s.opsi || []).map((o: any, oi: number) => ({
            id: `opt-${idx}-${oi}`,
            teks: o.teks || o.teksOpsi || "",
            benar: Boolean(o.benar),
            alasanSalah:
              o.alasanSalah ||
              o.alasan_salah ||
              (o.benar ? "" : "Konsep dasar materi ini perlu diperiksa kembali."),
          })),
        }));
      } else if (data.draft) {
        const d = data.draft;
        generatedQuestions = [
          {
            id: `ai-${Date.now()}-1`,
            pertanyaan: d.pertanyaan || "Pertanyaan matematika...",
            tipeSoal: (d.tipeSoal || tipeSoal) as
              | "pilihan_ganda"
              | "isian_singkat"
              | "esai",
            kunciJawaban: d.kunciJawaban || "",
            pembahasan: d.pembahasan || "",
            poin: 10,
            opsi: (d.opsiSoal || []).map((o: any, oi: number) => ({
              id: `opt-1-${oi}`,
              teks: o.teksOpsi || o.teks || "",
              benar: Boolean(o.benar),
              alasanSalah:
                o.alasanSalah ||
                o.alasan_salah ||
                (o.benar ? "" : "Konsep dasar materi ini perlu diperiksa kembali."),
            })),
          },
        ];
      }

      if (generatedQuestions.length === 0) {
        throw new Error("AI tidak mengembalikan butir soal yang valid. Silakan coba kembali.");
      }

      // Otomatis tambahkan soal yang dibuat langsung ke lembar ujian
      if (onInsertMultipleQuestions) {
        onInsertMultipleQuestions(generatedQuestions);
      } else {
        generatedQuestions.forEach((q) => onInsertQuestion(q));
      }

      // Tutup modal
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memproses permintaan AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                  Kurikulum Merdeka • SMP
                </span>
                <span className="text-[10px] font-bold text-blue-100">
                  Google Gemini AI
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                Generate Soal dengan AI
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-40"
            title="Tutup Form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleGenerate} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* 1. Form Field: Materi / Bab Kurikulum */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Materi / Bab Kurikulum</span>
                <span className="text-rose-500">*</span>
              </label>

              {!isCustomBab ? (
                <div className="space-y-1.5">
                  <select
                    value={selectedBabId}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (id === "custom") {
                        setIsCustomBab(true);
                      } else {
                        setSelectedBabId(id);
                        const found = MATEMATIKA_SMP_BAB_LIST.find((b) => b.id === id);
                        if (found) setSelectedBabJudul(found.judul);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-2xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition cursor-pointer"
                  >
                    {MATEMATIKA_SMP_BAB_LIST.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.judul}
                      </option>
                    ))}
                    <option value="custom">✍️ Tulis Topik / Materi Khusus Lainnya...</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customBabText}
                      onChange={(e) => setCustomBabText(e.target.value)}
                      placeholder="Masukkan nama bab atau topik matematika khusus..."
                      className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-2xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomBab(false)}
                      className="px-3.5 py-2 text-xs font-bold rounded-2xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Contoh: <i>Penerapan Barisan Geometri dalam Pertumbuhan Bakteri</i>
                  </span>
                </div>
              )}
            </div>

            {/* 2. Form Field: Tingkat Kesulitan (Taksonomi Akademik) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Tingkat Kesulitan Soal</span>
                  <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Standar Taksonomi Bloom
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: "mudah",
                    title: "Mudah (LOTS)",
                    desc: "C1–C2: Ingatan, definisi, dan operasi hitung dasar",
                    color: "border-emerald-300 bg-emerald-50/40 text-emerald-800",
                    activeRing: "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/80",
                  },
                  {
                    id: "sedang",
                    title: "Sedang (MOTS)",
                    desc: "C3: Penerapan rumus & prosedur konsep matematika",
                    color: "border-blue-200 bg-blue-50/40 text-blue-800",
                    activeRing: "ring-2 ring-blue-500 border-blue-500 bg-blue-50/80",
                  },
                  {
                    id: "sulit",
                    title: "Sulit (HOTS)",
                    desc: "C4–C6: Analisis, penalaran & soal cerita kontekstual",
                    color: "border-purple-200 bg-purple-50/40 text-purple-800",
                    activeRing: "ring-2 ring-purple-500 border-purple-500 bg-purple-50/80",
                  },
                ].map((item) => {
                  const isActive = tingkatKesulitan === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTingkatKesulitan(item.id as any)}
                      className={`p-3 rounded-2xl text-left border transition cursor-pointer relative ${
                        isActive
                          ? item.activeRing
                          : "border-slate-200 bg-white hover:bg-slate-50/80 text-slate-700"
                      }`}
                    >
                      <div className="font-bold text-xs sm:text-[13px] text-slate-800">
                        {item.title}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight mt-1">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3 & 4. Baris: Jumlah Soal (Maks 5) & Jenis Soal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Jumlah Soal (Maksimal 5) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <span>Jumlah Soal</span>
                    <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[11px] font-bold text-blue-700">
                    Maks. 5 Soal
                  </span>
                </label>

                <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const isActive = jumlahSoal === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setJumlahSoal(num)}
                        className={`py-2 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
                          isActive
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-400 block px-1">
                  Pilih antara 1 sampai 5 butir soal per generate.
                </span>
              </div>

              {/* Jenis Soal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Jenis / Format Soal</span>
                  <span className="text-rose-500">*</span>
                </label>

                <select
                  value={tipeSoal}
                  onChange={(e) => setTipeSoal(e.target.value as any)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-2xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition cursor-pointer"
                >
                  <option value="pilihan_ganda">Pilihan Ganda (A-D + Analisis Miskonsepsi)</option>
                  <option value="isian_singkat">Isian Singkat (Kunci Kata/Angka Pasti)</option>
                  <option value="esai">Soal Esai & Uraian (Rubrik Bertahap)</option>
                  <option value="campuran">Campuran (Proporsional PG, Isian & Esai)</option>
                </select>
                <span className="text-[10px] text-slate-400 block px-1">
                  Format disesuaikan dengan jenis asesmen ujian.
                </span>
              </div>
            </div>

            {/* 5. Form Field: Instruksi / Catatan Tambahan Guru (Opsional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileEdit className="w-4 h-4 text-blue-600" />
                  <span>Instruksi / Catatan Tambahan</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Opsional
                </span>
              </label>

              <textarea
                rows={3}
                value={instruksiTambahan}
                onChange={(e) => setInstruksiTambahan(e.target.value)}
                placeholder="Contoh: Fokus pada soal cerita kontekstual bertema pasar tradisional, sertakan perbandingan pecahan, gunakan angka bulat yang mudah dihitung siswa..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition resize-none placeholder:text-slate-400"
              />
              <span className="text-[11px] text-slate-500">
                💡 AI secara otomatis memformat semua rumus matematika dengan standar KaTeX ($...$).
              </span>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 border border-slate-200 bg-white transition cursor-pointer disabled:opacity-40"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-sm shadow-blue-500/20 transition active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Menyusun {jumlahSoal} Soal dengan AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Soal Sekarang</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
