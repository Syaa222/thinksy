"use client";

import { useState, useEffect } from "react";
import { Clock, ShieldCheck, X, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface AttendanceLimitConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function AttendanceLimitConfigModal({
  isOpen,
  onClose,
  onSaved,
}: AttendanceLimitConfigModalProps) {
  const [jamMasuk, setJamMasuk] = useState("07:15");
  const [jamTerlambat, setJamTerlambat] = useState("07:30");
  const [jamTutup, setJamTutup] = useState("08:00");
  const [sekolahNama, setSekolahNama] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadCurrentLimits() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/sekolah/jam-presensi");
        if (res.ok) {
          const data = await res.json();
          if (data.sekolah) {
            setSekolahNama(data.sekolah.nama || "Sekolah");
            if (data.sekolah.jam_masuk) setJamMasuk(data.sekolah.jam_masuk.substring(0, 5));
            if (data.sekolah.jam_terlambat) setJamTerlambat(data.sekolah.jam_terlambat.substring(0, 5));
            if (data.sekolah.jam_tutup) setJamTutup(data.sekolah.jam_tutup.substring(0, 5));
          }
        }
      } catch {} finally {
        setIsLoading(false);
      }
    }

    loadCurrentLimits();
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/sekolah/jam-presensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jam_masuk: jamMasuk,
          jam_terlambat: jamTerlambat,
          jam_tutup: jamTutup,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage("Batas waktu presensi berhasil disimpan & disinkronkan ke seluruh siswa!");
        if (onSaved) onSaved();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatusMessage(data.error || "Gagal menyimpan perubahan");
      }
    } catch {
      setStatusMessage("Terjadi kesalahan koneksi");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 text-slate-900">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0F172A] text-amber-400 flex items-center justify-center font-black shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                KONTROL WAKTU SEKOLAH
              </span>
              <h3 className="text-base font-black text-[#0F172A]">
                Atur Batas Waktu Presensi
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {sekolahNama || "Sinkronisasi Realtime Supabase"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {isLoading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memuat data dari database...</span>
            </div>
          ) : (
            <>
              {statusMessage && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    statusMessage.includes("berhasil")
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  {statusMessage.includes("berhasil") ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{statusMessage}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* 1. Jam Masuk (Tepat Waktu) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                    <span>1. Jam Masuk (Tepat Waktu)</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      +10 Poin Reward
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Siswa presensi sebelum jam ini tercatat Hadir Tepat Waktu.
                  </p>
                  <input
                    type="time"
                    value={jamMasuk}
                    onChange={(e) => setJamMasuk(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 2. Jam Terlambat */}
                <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1">
                  <label className="text-xs font-black text-amber-900 flex items-center justify-between">
                    <span>2. Jam Terlambat</span>
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                      +3 Poin Reward
                    </span>
                  </label>
                  <p className="text-[11px] text-amber-700/80">
                    Siswa presensi antara Jam Masuk dan Jam Tutup tercatat Terlambat.
                  </p>
                  <input
                    type="time"
                    value={jamTerlambat}
                    onChange={(e) => setJamTerlambat(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* 3. Jam Tutup Presensi (Alpha) */}
                <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1">
                  <label className="text-xs font-black text-rose-900 flex items-center justify-between">
                    <span>3. Jam Tutup Presensi</span>
                    <span className="text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full font-bold">
                      Status Alpha (Terkunci)
                    </span>
                  </label>
                  <p className="text-[11px] text-rose-700/80">
                    Setelah jam ini, formulir presensi siswa dikunci otomatis dengan status Alpha.
                  </p>
                  <input
                    type="time"
                    value={jamTutup}
                    onChange={(e) => setJamTutup(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-extrabold transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 text-amber-400" />
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
