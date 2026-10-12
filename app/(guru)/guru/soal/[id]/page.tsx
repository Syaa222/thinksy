"use client";

import { useState, useEffect, use } from "react";
import GuruLayout from "@/components/guru/GuruLayout";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Eye,
  Plus,
  Trash2,
  ShieldCheck,
  FileCheck,
} from "lucide-react";

interface OpsiItem {
  id?: string;
  label?: string;
  teks_opsi: string;
  benar: boolean;
  alasan_salah?: string;
  urutan: number;
}

interface RubrikItem {
  kriteria: string;
  bobot: number;
  deskriptor?: string;
}

export default function EditorSoalReviewGatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const soalId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pertanyaan, setPertanyaan] = useState("");
  const [tipeSoal, setTipeSoal] = useState("pilihan_ganda");
  const [tingkatSoal, setTingkatSoal] = useState("sedang");
  const [statusSoal, setStatusSoal] = useState("review");
  const [kunciJawaban, setKunciJawaban] = useState("");
  const [pembahasan, setPembahasan] = useState("");
  const [babJudul, setBabJudul] = useState("");
  const [direviewAt, setDireviewAt] = useState<string | null>(null);
  const [opsiList, setOpsiList] = useState<OpsiItem[]>([]);
  const [rubrikList, setRubrikList] = useState<RubrikItem[]>([]);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchDetailSoal();
  }, [soalId]);

  const fetchDetailSoal = async () => {
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data: soalData, error: sErr } = await supabase
        .from("soal")
        .select(`
          id,
          pertanyaan,
          tipe_soal,
          tingkat_soal,
          status_soal,
          kunci_jawaban,
          pembahasan,
          rubrik,
          direview_at,
          sumber_konten,
          bab (
            id,
            judul
          ),
          opsi_soal (
            id,
            label,
            teks_opsi,
            benar,
            alasan_salah,
            urutan
          )
        `)
        .eq("id", soalId)
        .maybeSingle();

      if (sErr || !soalData) {
        setNotification({ type: "error", text: "Soal tidak ditemukan di database." });
        return;
      }

      setPertanyaan(soalData.pertanyaan || "");
      setTipeSoal(soalData.tipe_soal || "pilihan_ganda");
      setTingkatSoal(soalData.tingkat_soal || "sedang");
      setStatusSoal(soalData.status_soal || "review");
      setKunciJawaban(soalData.kunci_jawaban || "");
      setPembahasan(soalData.pembahasan || "");
      setDireviewAt(soalData.direview_at || null);
      setBabJudul((soalData as any)?.bab?.judul || "Matematika Kelas 8");

      if (Array.isArray(soalData.rubrik) && soalData.rubrik.length > 0) {
        setRubrikList(soalData.rubrik);
      } else {
        setRubrikList([
          { kriteria: "Pemahaman Konsep & Rumus", bobot: 40, deskriptor: "Ketepatan identifikasi rumus." },
          { kriteria: "Langkah Perhitungan / Pembuktian", bobot: 40, deskriptor: "Langkah sistematis dan akurat." },
          { kriteria: "Kesimpulan Akhir & Notasi", bobot: 20, deskriptor: "Notasi dan satuan tepat." },
        ]);
      }

      const sortedOpsi = ((soalData as any)?.opsi_soal || []).sort(
        (a: OpsiItem, b: OpsiItem) => a.urutan - b.urutan
      );
      if (sortedOpsi.length > 0) {
        setOpsiList(sortedOpsi);
      } else {
        setOpsiList([
          { teks_opsi: "", benar: true, urutan: 1, label: "A", alasan_salah: "" },
          { teks_opsi: "", benar: false, urutan: 2, label: "B", alasan_salah: "Miskonsepsi perhitungan." },
          { teks_opsi: "", benar: false, urutan: 3, label: "C", alasan_salah: "Miskonsepsi tanda operasi." },
          { teks_opsi: "", benar: false, urutan: 4, label: "D", alasan_salah: "Langkah terbalik." },
        ]);
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Gagal memuat soal." });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publishImmediately: boolean = false) => {
    setSaving(true);
    setNotification(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // 1. Simpan perubahan konten ke DB
      const { error: updateErr } = await supabase
        .from("soal")
        .update({
          pertanyaan,
          tipe_soal: tipeSoal,
          tingkat_soal: tingkatSoal,
          kunci_jawaban: kunciJawaban,
          pembahasan,
          rubrik: tipeSoal === "esai" ? rubrikList : [],
        })
        .eq("id", soalId);

      if (updateErr) throw updateErr;

      // 2. Simpan opsi_soal jika pilihan ganda
      if (tipeSoal === "pilihan_ganda") {
        for (const op of opsiList) {
          if (op.id) {
            await supabase
              .from("opsi_soal")
              .update({
                teks_opsi: op.teks_opsi,
                benar: op.benar,
                alasan_salah: op.benar ? null : (op.alasan_salah || ""),
              })
              .eq("id", op.id);
          }
        }
      }

      // 3. Jika guru memilih "Terbitkan Soal" -> Panggil Review Gate Server
      if (publishImmediately) {
        const res = await fetch("/api/guru/terbitkan-soal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ soalId }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Gagal menerbitkan soal.");
        }

        setStatusSoal("dipublikasi");
        setDireviewAt(data.direviewAt);
        setNotification({
          type: "success",
          text: `🎉 Review Gate Passed: ${data.message}`,
        });

        setTimeout(() => {
          router.push("/guru/soal");
        }, 1200);
      } else {
        setNotification({
          type: "success",
          text: "✅ Perubahan bank soal berhasil disimpan sebagai draft/review.",
        });
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Gagal menyimpan perubahan." });
    } finally {
      setSaving(false);
    }
  };

  const handleSetCorrectOption = (targetIndex: number) => {
    setOpsiList((prev) =>
      prev.map((op, idx) => ({
        ...op,
        benar: idx === targetIndex,
      }))
    );
  };

  const handleUpdateOptionText = (index: number, val: string) => {
    setOpsiList((prev) =>
      prev.map((op, idx) => (idx === index ? { ...op, teks_opsi: val } : op))
    );
  };

  const handleUpdateOptionDistraktor = (index: number, val: string) => {
    setOpsiList((prev) =>
      prev.map((op, idx) => (idx === index ? { ...op, alasan_salah: val } : op))
    );
  };

  return (
    <GuruLayout activeView="pengelolaan">
      <div className="max-w-4xl mx-auto space-y-6 pb-20 font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/guru/soal"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Review Gate & Editor Bank Soal
              </h1>
              <p className="text-xs text-slate-500">{babJudul}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                statusSoal === "dipublikasi" || statusSoal === "terbit"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {statusSoal}
            </span>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 font-medium ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : "bg-rose-50 text-rose-900 border border-rose-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Main Editor Form */}
        {!loading && (
          <div className="space-y-6">
            {/* Metadata Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Tipe Soal
                  </label>
                  <select
                    value={tipeSoal}
                    onChange={(e) => setTipeSoal(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white font-sans focus:ring-2 focus:ring-[#193446]"
                  >
                    <option value="pilihan_ganda">Pilihan Ganda (PG)</option>
                    <option value="isian_singkat">Isian Singkat</option>
                    <option value="esai">Uraian / Esai</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={tingkatSoal}
                    onChange={(e) => setTingkatSoal(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white font-sans focus:ring-2 focus:ring-[#193446]"
                  >
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sulit">Sulit</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Status Review
                  </label>
                  <input
                    type="text"
                    disabled
                    value={statusSoal}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-600 font-bold uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Pertanyaan */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Pertanyaan Soal (Markdown & LaTeX $...$)
              </label>
              <textarea
                rows={4}
                value={pertanyaan}
                onChange={(e) => setPertanyaan(e.target.value)}
                placeholder="Tuliskan stimulus atau pertanyaan di sini..."
                className="w-full text-sm border border-slate-200 rounded-xl p-3 font-sans focus:ring-2 focus:ring-[#193446]"
              />
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="font-bold text-slate-500 block mb-1 text-[10px] uppercase">
                  Pratinjau Rumus:
                </span>
                <MarkdownRenderer content={pertanyaan || "_Pratinjau kosong_"} />
              </div>
            </div>

            {/* Answer Options / Isian / Rubric */}
            {tipeSoal === "pilihan_ganda" && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Opsi Jawaban & Penjelasan Distraktor Miskonsepsi
                  </h3>
                  <span className="text-[11px] text-slate-500">Pilih 1 kunci yang benar</span>
                </div>

                <div className="space-y-3">
                  {opsiList.map((op, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border space-y-2 transition ${
                          op.benar ? "bg-emerald-50/70 border-emerald-300" : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleSetCorrectOption(idx)}
                            className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center transition ${
                              op.benar
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {letter}
                          </button>
                          <input
                            type="text"
                            value={op.teks_opsi}
                            onChange={(e) => handleUpdateOptionText(idx, e.target.value)}
                            placeholder={`Teks pilihan ${letter}...`}
                            className="flex-1 text-xs border border-slate-200 rounded-xl p-2 bg-white"
                          />
                          {op.benar && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900">
                              Kunci Resmi
                            </span>
                          )}
                        </div>

                        {!op.benar && (
                          <div className="pl-10">
                            <input
                              type="text"
                              value={op.alasan_salah || ""}
                              onChange={(e) => handleUpdateOptionDistraktor(idx, e.target.value)}
                              placeholder={`Penjelasan miskonsepsi/kenapa opsi ${letter} salah...`}
                              className="w-full text-[11px] border border-amber-200 rounded-lg p-1.5 bg-amber-50/50 text-amber-950 placeholder:text-amber-800/60"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tipeSoal === "isian_singkat" && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Kunci Jawaban Isian Singkat
                </label>
                <input
                  type="text"
                  value={kunciJawaban}
                  onChange={(e) => setKunciJawaban(e.target.value)}
                  placeholder="Contoh: 45 (atau pisahkan alternatif dengan tanda koma jika ada lebih dari 1 bentuk)"
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#193446]"
                />
              </div>
            )}

            {tipeSoal === "esai" && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Rubrik Penilaian Esai AI
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Total Bobot: {rubrikList.reduce((acc, r) => acc + (Number(r.bobot) || 0), 0)}%
                  </span>
                </div>

                <div className="space-y-2.5">
                  {rubrikList.map((r, rIdx) => (
                    <div
                      key={rIdx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3 text-xs"
                    >
                      <input
                        type="text"
                        value={r.kriteria}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRubrikList((prev) =>
                            prev.map((item, idx) => (idx === rIdx ? { ...item, kriteria: val } : item))
                          );
                        }}
                        placeholder="Nama kriteria..."
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={r.bobot}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setRubrikList((prev) =>
                              prev.map((item, idx) => (idx === rIdx ? { ...item, bobot: val } : item))
                            );
                          }}
                          className="w-16 bg-white border border-slate-200 rounded-lg p-2 text-center"
                        />
                        <span className="text-slate-500 font-bold">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pembahasan WAJIB */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Pembahasan Langkah demi Langkah (WAJIB Terisi Sebelum Terbit)</span>
                </label>
                <span className="text-[10px] text-rose-600 font-bold uppercase">Wajib Diisi</span>
              </div>
              <textarea
                rows={4}
                value={pembahasan}
                onChange={(e) => setPembahasan(e.target.value)}
                placeholder="Langkah 1: Identifikasi nilai awal...&#10;Langkah 2: Terapkan rumus...&#10;Langkah 3: Hitung hasil akhir..."
                className="w-full text-sm border border-slate-200 rounded-xl p-3 font-sans focus:ring-2 focus:ring-[#193446]"
              />
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {direviewAt ? (
                  <span>
                    Terakhir diverifikasi:{" "}
                    <strong>{new Date(direviewAt).toLocaleDateString("id-ID")}</strong>
                  </span>
                ) : (
                  <span>Status saat ini: Belum diverifikasi guru</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Simpan Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terbitkan Soal (Review Gate)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </GuruLayout>
  );
}
