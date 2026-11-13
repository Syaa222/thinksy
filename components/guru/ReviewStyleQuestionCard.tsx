"use client";

import { useState } from "react";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";
import {
  Check,
  Trash2,
  Eye,
  Edit3,
  ArrowUp,
  ArrowDown,
  Sparkles,
  AlertCircle,
  Lightbulb,
} from "lucide-react";

export interface QuestionOptionItem {
  id?: string;
  teks: string;
  benar: boolean;
  alasanSalah?: string;
}

export interface ReviewQuestionItem {
  id: string;
  pertanyaan: string;
  tipeSoal: "pilihan_ganda" | "isian_singkat" | "esai";
  opsi: QuestionOptionItem[];
  kunciJawaban: string;
  pembahasan: string;
  poin: number;
}

interface ReviewStyleQuestionCardProps {
  question: ReviewQuestionItem;
  index: number;
  total: number;
  onUpdate: (updated: Partial<ReviewQuestionItem>) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAiVariasi?: () => void;
  isGeneratingVariasi?: boolean;
}

export default function ReviewStyleQuestionCard({
  question,
  index,
  total,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAiVariasi,
  isGeneratingVariasi = false,
}: ReviewStyleQuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showMisconceptions, setShowMisconceptions] = useState(false);

  const q = question;
  const isPilihanGanda = q.tipeSoal === "pilihan_ganda";

  const handleSetCorrectOption = (optIdx: number) => {
    const updatedOpsi = q.opsi.map((o, i) => ({
      ...o,
      benar: i === optIdx,
    }));
    onUpdate({
      opsi: updatedOpsi,
      kunciJawaban: updatedOpsi[optIdx]?.teks || "",
    });
  };

  const handleUpdateOptionTeks = (optIdx: number, newTeks: string) => {
    const updatedOpsi = [...q.opsi];
    updatedOpsi[optIdx] = { ...updatedOpsi[optIdx], teks: newTeks };
    onUpdate({ opsi: updatedOpsi });
  };

  const handleUpdateOptionAlasan = (optIdx: number, alasan: string) => {
    const updatedOpsi = [...q.opsi];
    updatedOpsi[optIdx] = { ...updatedOpsi[optIdx], alasanSalah: alasan };
    onUpdate({ opsi: updatedOpsi });
  };

  const tipeLabel =
    q.tipeSoal === "pilihan_ganda"
      ? "Pilihan Ganda (A-D)"
      : q.tipeSoal === "isian_singkat"
      ? "Isian Singkat"
      : "Esai & Penalaran";

  const tipeBadgeColor =
    q.tipeSoal === "pilihan_ganda"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : q.tipeSoal === "isian_singkat"
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : "bg-amber-100 text-amber-800 border-amber-200";

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition duration-150 overflow-hidden">
      {/* 1. Header Toolbar (Card Header bergaya Review Lembar Soal) */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
            #{index + 1}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${tipeBadgeColor}`}>
              {tipeLabel}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
              {q.poin || 10} Poin
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {onAiVariasi && (
            <button
              type="button"
              onClick={onAiVariasi}
              disabled={isGeneratingVariasi}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition border border-indigo-200 cursor-pointer disabled:opacity-50"
              title="Buat variasi soal serupa menggunakan AI"
            >
              <Sparkles className={`w-3.5 h-3.5 text-indigo-600 ${isGeneratingVariasi ? "animate-spin" : ""}`} />
              <span>{isGeneratingVariasi ? "Membuat Variasi..." : "Variasikan AI"}</span>
            </button>
          )}

          {onMoveUp && index > 0 && (
            <button
              type="button"
              onClick={onMoveUp}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
              title="Geser ke Atas"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}

          {onMoveDown && index < total - 1 && (
            <button
              type="button"
              onClick={onMoveDown}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
              title="Geser ke Bawah"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              isEditing
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? "Mode Review" : "Edit Teks"}</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
            title="Hapus Soal Ini"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {/* 2. Teks Pertanyaan (Review View vs Edit View) */}
        {isEditing ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Teks Pertanyaan (Mendukung KaTeX Math $...$)</label>
              <select
                value={q.tipeSoal}
                onChange={(e) => onUpdate({ tipeSoal: e.target.value as any })}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white"
              >
                <option value="pilihan_ganda">Pilihan Ganda (A-D)</option>
                <option value="isian_singkat">Isian Singkat</option>
                <option value="esai">Esai & Penalaran</option>
              </select>
            </div>

            {/* Quick Math Formula Shortcuts */}
            <div className="flex flex-wrap items-center gap-1 pt-0.5 pb-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Rumus Cepat:</span>
              {[
                { label: "a/b", snippet: "$\\frac{a}{b}$", title: "Pecahan bertingkat" },
                { label: "x²", snippet: "$x^{2}$", title: "Pangkat" },
                { label: "√x", snippet: "$\\sqrt{x}$", title: "Bentuk akar" },
                { label: "×", snippet: "$\\times$", title: "Simbol kali" },
                { label: "÷", snippet: "$\\div$", title: "Simbol bagi" },
                { label: "π", snippet: "$\\pi$", title: "Bilangan pi" },
                { label: "±", snippet: "$\\pm$", title: "Plus minus" },
                { label: "°", snippet: "$^{\\circ}$", title: "Derajat sudut" },
                { label: "Δ", snippet: "$\\Delta$", title: "Delta selisih" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onUpdate({ pertanyaan: `${q.pertanyaan} ${item.snippet} ` })}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-300 hover:border-blue-400 rounded-md transition cursor-pointer"
                  title={item.title}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={q.pertanyaan}
              onChange={(e) => onUpdate({ pertanyaan: e.target.value })}
              className="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
              placeholder="Ketik soal... Formula gunakan $a^m \times a^n$ atau $$\frac{a}{b}$$"
            />
            {/* Live Render Mini Preview */}
            <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl text-xs text-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Tampilan Render Rumus:
              </span>
              <MarkdownRenderer content={q.pertanyaan || "*(Pertanyaan masih kosong)*"} />
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="text-sm sm:text-base text-slate-900 leading-relaxed font-medium cursor-pointer hover:bg-slate-50/70 p-2.5 rounded-2xl transition border border-transparent hover:border-slate-200 group"
            title="Klik untuk mengedit teks pertanyaan"
          >
            <MarkdownRenderer content={q.pertanyaan || "*(Klik di sini untuk menulis teks pertanyaan)*"} />
            <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition inline-flex items-center gap-1 mt-1">
              <Edit3 className="w-3 h-3" /> Klik untuk edit teks pertanyaan
            </span>
          </div>
        )}

        {/* 3. Pilihan Ganda (A, B, C, D) bergaya Review Card */}
        {isPilihanGanda && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Pilihan Jawaban (Klik bulatan huruf untuk memilih kunci BENAR):
              </span>
              <button
                type="button"
                onClick={() => setShowMisconceptions(!showMisconceptions)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold transition cursor-pointer"
              >
                {showMisconceptions ? "Sembunyikan Miskonsepsi" : "Kelola Analisis Miskonsepsi"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {q.opsi.map((opt, oIdx) => {
                const letter = String.fromCharCode(65 + oIdx);
                const isCorrect = Boolean(opt.benar);

                return (
                  <div
                    key={opt.id || `opt-${oIdx}`}
                    className={`p-3 rounded-2xl border transition flex flex-col justify-between gap-2 ${
                      isCorrect
                        ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/10 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Tombol Huruf Opsi (Klik untuk menjadikan Kunci Benar) */}
                      <button
                        type="button"
                        onClick={() => handleSetCorrectOption(oIdx)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition cursor-pointer ${
                          isCorrect
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "border-2 border-slate-300 text-slate-500 hover:border-emerald-500 hover:text-emerald-700"
                        }`}
                        title={isCorrect ? "Kunci Jawaban Benar" : `Klik untuk jadikan Opsi ${letter} sebagai Kunci Benar`}
                      >
                        {isCorrect ? <Check className="w-4 h-4" /> : letter}
                      </button>

                      {/* Teks Opsi (Editable atau Read-only) */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            type="text"
                            value={opt.teks}
                            onChange={(e) => handleUpdateOptionTeks(oIdx, e.target.value)}
                            placeholder={`Teks opsi ${letter}...`}
                            className="w-full text-xs font-medium bg-transparent border-b border-slate-300 focus:outline-none focus:border-blue-600 py-0.5"
                          />
                        ) : (
                          <div className="text-xs font-semibold text-slate-800 leading-snug">
                            <MarkdownRenderer content={opt.teks || `*(Opsi ${letter} kosong)*`} />
                          </div>
                        )}
                      </div>

                      {isCorrect && (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          Kunci Benar
                        </span>
                      )}
                    </div>

                    {/* Analisis Miskonsepsi jika opsi salah */}
                    {showMisconceptions && !isCorrect && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                          <span>Alasan Miskonsepsi (Jika siswa pilih {letter}):</span>
                        </span>
                        <input
                          type="text"
                          value={opt.alasanSalah || ""}
                          onChange={(e) => handleUpdateOptionAlasan(oIdx, e.target.value)}
                          placeholder="Contoh: Siswa menjumlahkan pangkat pada pembagian..."
                          className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-amber-200 bg-amber-50/40 text-amber-900 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Kunci Jawaban Resmi (Untuk Isian / Esai) */}
        {!isPilihanGanda && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Kunci Jawaban Resmi / Rubrik Penilaian:
            </span>
            {isEditing ? (
              <input
                type="text"
                value={q.kunciJawaban}
                onChange={(e) => onUpdate({ kunciJawaban: e.target.value })}
                placeholder="Ketik kata kunci jawaban yang tepat..."
                className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-600"
              />
            ) : (
              <div className="text-xs font-bold text-blue-700">
                <MarkdownRenderer content={q.kunciJawaban || "*(Kunci jawaban belum ditentukan)*"} />
              </div>
            )}
          </div>
        )}

        {/* 5. Pembahasan Langkah Solusi Matematis */}
        <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200/70 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Pembahasan Konseptual & Langkah Solusi:</span>
            </span>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-[10px] text-blue-700 font-bold hover:underline cursor-pointer"
              >
                Edit Pembahasan
              </button>
            )}
          </div>

          {isEditing ? (
            <textarea
              rows={2}
              value={q.pembahasan}
              onChange={(e) => onUpdate({ pembahasan: e.target.value })}
              placeholder="Tuliskan langkah-langkah penyelesaian agar siswa paham..."
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
            />
          ) : (
            <div className="text-xs text-slate-700 leading-relaxed font-medium">
              <MarkdownRenderer content={q.pembahasan || "*(Pembahasan belum diisi)*"} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
