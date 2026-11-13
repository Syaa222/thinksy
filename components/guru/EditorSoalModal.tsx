"use client";

import { useState, useEffect } from "react";
import { X, Eye, Save, HelpCircle, CheckCircle2, Loader2 } from "lucide-react";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";

interface EditorSoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (newQuestion: any) => void;
}

// 8 Bab Resmi Matematika SMP Kelas 8 Fase D
const DEFAULT_MATEMATIKA_BABS = [
  { id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", judul: "Bab 1: Pola Bilangan & Barisan Bilangan" },
  { id: "b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22", judul: "Bab 2: Bentuk Aljabar & PLSV/PTLSV" },
  { id: "b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33", judul: "Bab 3: Relasi & Fungsi" },
  { id: "b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44", judul: "Bab 4: Persamaan Garis Lurus (PGL)" },
  { id: "b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55", judul: "Bab 5: Sistem Persamaan Linear Dua Variabel (SPLDV)" },
  { id: "b6eebc99-9c0b-4ef8-bb6d-6bb9bd380a66", judul: "Bab 6: Teorema Pythagoras" },
  { id: "b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a77", judul: "Bab 7: Bangun Ruang Sisi Datar (BRSD)" },
  { id: "b8eebc99-9c0b-4ef8-bb6d-6bb9bd380a88", judul: "Bab 8: Statistika & Peluang" },
];

export default function EditorSoalModal({ isOpen, onClose, onSave }: EditorSoalModalProps) {
  const [babList, setBabList] = useState<{ id: string; judul: string }[]>(DEFAULT_MATEMATIKA_BABS);
  const [bab, setBab] = useState(DEFAULT_MATEMATIKA_BABS[0].id);
  const [kesulitan, setKesulitan] = useState("mudah");
  const [tipeSoal, setTipeSoal] = useState<"pilihan_ganda" | "isian" | "esai">("pilihan_ganda");
  const [pertanyaan, setPertanyaan] = useState("Tuliskan pertanyaan di sini... Gunakan $ untuk inline math atau $$ untuk block math.");
  const [opsiA, setOpsiA] = useState("Opsi A...");
  const [opsiB, setOpsiB] = useState("Opsi B...");
  const [opsiC, setOpsiC] = useState("Opsi C...");
  const [opsiD, setOpsiD] = useState("Opsi D...");
  const [jawabanBenar, setJawabanBenar] = useState<"A" | "B" | "C" | "D">("A");
  const [kunciJawabanSingkat, setKunciJawabanSingkat] = useState("");
  const [pembahasan, setPembahasan] = useState("Tuliskan pembahasan langkah-demi-langkah di sini...");
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { broadcastEvent } = useRealtimeDashboard();

  useEffect(() => {
    async function loadBabs() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase.from("bab").select("id, judul, mapel").order("urutan", { ascending: true });
        if (data && data.length > 0) {
          const mathBabs = data.filter((b: any) => !b.mapel || b.mapel.toLowerCase().includes("matematika") || b.mapel.toLowerCase().includes("mtk"));
          if (mathBabs.length > 0) {
            setBabList(mathBabs);
            setBab(mathBabs[0].id);
            return;
          }
        }
        setBabList(DEFAULT_MATEMATIKA_BABS);
      } catch {
        setBabList(DEFAULT_MATEMATIKA_BABS);
      }
    }
    loadBabs();
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const selectedBab = babList.find((b) => b.id === bab) || babList[0];
      const targetBabId = selectedBab?.id || "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

      const res = await fetch("/api/guru/simpan-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babId: targetBabId,
          pertanyaan,
          tipeSoal: tipeSoal === "isian" ? "isian_singkat" : tipeSoal,
          tingkatSoal: kesulitan,
          statusSoal: "dipublikasi",
          sumberKonten: "manual",
          kunciJawaban: tipeSoal === "pilihan_ganda" ? jawabanBenar : tipeSoal === "isian" ? kunciJawabanSingkat : "",
          pembahasan,
          opsiSoal:
            tipeSoal === "pilihan_ganda"
              ? [
                  { teksOpsi: opsiA, benar: jawabanBenar === "A" },
                  { teksOpsi: opsiB, benar: jawabanBenar === "B" },
                  { teksOpsi: opsiC, benar: jawabanBenar === "C" },
                  { teksOpsi: opsiD, benar: jawabanBenar === "D" },
                ]
              : [],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        broadcastEvent("SOAL_PUBLISHED", {
          soalId: data.soalId,
          babId: targetBabId,
          babJudul: selectedBab?.judul || "Materi Matematika",
        });

        if (onSave) {
          onSave({
            id: data.soalId ? `#Q-${data.soalId.substring(0, 6)}` : `#Q-${Math.floor(1000 + Math.random() * 9000)}`,
            bab: selectedBab?.judul || "Matematika",
            kesulitan,
            tipeSoal,
            pertanyaan,
            opsi: [opsiA, opsiB, opsiC, opsiD],
            jawabanBenar,
            pembahasan,
          });
        }
        onClose();
      } else {
        alert(data.error || "Gagal menyimpan soal ke database.");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 animate-in fade-in duration-100 font-mono">
      <div className="w-full max-w-xl bg-white h-full shadow-none flex flex-col justify-between border-l border-zinc-950 animate-in slide-in-from-right duration-200">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div>
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">Editor Soal Baru</h2>
            <p className="text-[11px] text-zinc-500">
              Buat soal langsung ke Bank Soal & Dashboard Siswa.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Bab & Kesulitan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                Bab & Materi *
              </label>
              <select
                value={bab}
                onChange={(e) => setBab(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 text-xs font-bold text-zinc-900 focus:outline-none focus:border-zinc-950 bg-white"
              >
                {babList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.judul}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                Tingkat Kesulitan *
              </label>
              <select
                value={kesulitan}
                onChange={(e) => setKesulitan(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 text-xs font-bold text-zinc-900 focus:outline-none focus:border-zinc-950 bg-white"
              >
                <option value="mudah">Mudah</option>
                <option value="sedang">Sedang</option>
                <option value="sulit">Sulit</option>
              </select>
            </div>
          </div>

          {/* Tipe Soal Tabs */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
              Tipe Soal *
            </label>
            <div className="grid grid-cols-3 gap-1 bg-zinc-100 p-1 border border-zinc-300">
              {[
                { id: "pilihan_ganda", label: "Pilihan Ganda" },
                { id: "isian", label: "Jawaban Singkat" },
                { id: "esai", label: "Jawaban Panjang" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTipeSoal(t.id as any)}
                  className={`py-1.5 text-xs font-bold transition cursor-pointer border ${
                    tipeSoal === t.id
                      ? "bg-zinc-950 text-white border-zinc-950"
                      : "bg-white text-zinc-700 border-transparent hover:bg-zinc-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Pertanyaan */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                Pertanyaan *
              </label>
              <span className="text-[10px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-300 px-1.5 py-0.2">
                Markdown & LaTeX
              </span>
            </div>
            {/* Quick Math Formula Shortcuts */}
            <div className="flex flex-wrap items-center gap-1 pt-0.5 pb-1">
              <span className="text-[10px] text-zinc-400 font-bold uppercase mr-1">Rumus Cepat:</span>
              {[
                { label: "a/b", snippet: "$\\frac{a}{b}$", title: "Pecahan bertingkat" },
                { label: "x²", snippet: "$x^{2}$", title: "Pangkat" },
                { label: "√x", snippet: "$\\sqrt{x}$", title: "Bentuk akar" },
                { label: "×", snippet: "$\\times$", title: "Simbol kali" },
                { label: "÷", snippet: "$\\div$", title: "Simbol bagi" },
                { label: "π", snippet: "$\\pi$", title: "Bilangan pi" },
                { label: "±", snippet: "$\\pm$", title: "Plus minus" },
                { label: "°", snippet: "$^{\\circ}$", title: "Derajat sudut/suhu" },
                { label: "Δ", snippet: "$\\Delta$", title: "Delta selisih" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setPertanyaan((prev) => `${prev} ${item.snippet} `)}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold bg-zinc-100 hover:bg-blue-50 text-zinc-700 hover:text-blue-700 border border-zinc-300 hover:border-blue-400 rounded transition cursor-pointer"
                  title={item.title}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <textarea
              rows={4}
              value={pertanyaan}
              onChange={(e) => setPertanyaan(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 bg-white font-mono"
            />
          </div>

          {/* Options for Pilihan Ganda */}
          {tipeSoal === "pilihan_ganda" && (
            <div className="space-y-2 pt-2 border-t border-zinc-200">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                  Opsi Jawaban
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Pilih radio button jawaban benar
                </span>
              </div>

              {[
                { label: "A", val: opsiA, set: setOpsiA },
                { label: "B", val: opsiB, set: setOpsiB },
                { label: "C", val: opsiC, set: setOpsiC },
                { label: "D", val: opsiD, set: setOpsiD },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="jawabanBenar"
                    checked={jawabanBenar === item.label}
                    onChange={() => setJawabanBenar(item.label as any)}
                    className="w-4 h-4 accent-zinc-950 cursor-pointer"
                  />
                  <span className="w-5 text-xs font-bold text-zinc-700">
                    {item.label}
                  </span>
                  <input
                    type="text"
                    value={item.val}
                    onChange={(e) => item.set(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 bg-white"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Input Kunci Jawaban Singkat */}
          {tipeSoal === "isian" && (
            <div className="space-y-1.5 pt-2 border-t border-zinc-200">
              <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                Kunci Jawaban Singkat (Kata / Angka Presisi) *
              </label>
              <input
                type="text"
                value={kunciJawabanSingkat}
                onChange={(e) => setKunciJawabanSingkat(e.target.value)}
                placeholder="Contoh: 35 atau Fotosintesis"
                className="w-full px-2.5 py-1.5 border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 bg-white"
              />
            </div>
          )}

          {/* Pembahasan */}
          <div className="space-y-1 pt-2 border-t border-zinc-200">
            <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
              Pembahasan Langkah-demi-Langkah
            </label>
            <textarea
              rows={3}
              value={pembahasan}
              onChange={(e) => setPembahasan(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 bg-white font-mono"
            />
          </div>

          {/* Live Preview Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className="text-xs font-bold text-zinc-950 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-600" />
              <span>{isPreview ? "Sembunyikan Preview" : "Tampilkan Preview Rumus"}</span>
            </button>

            {isPreview && (
              <div className="mt-2 p-3 bg-zinc-50 border border-zinc-300 text-xs space-y-1">
                <div className="font-bold text-zinc-600 uppercase text-[10px]">Preview KaTeX / Markdown:</div>
                <MarkdownRenderer content={pertanyaan} />
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-2 font-mono">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-3 py-1.5 border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 font-bold text-xs transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSubmit}
            className="px-4 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? "Menyimpan..." : "Simpan Soal"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
