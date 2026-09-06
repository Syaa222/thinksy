"use client";

import { Timer } from "lucide-react";

interface UatDevMenuProps {
  mockTime: string | null;
  setMockTime: (time: string | null) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function UatDevMenu({
  mockTime,
  setMockTime,
  isOpen,
  setIsOpen,
}: UatDevMenuProps) {
  const currentRealTime = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-[#0F172A]/95 text-white backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 flex items-center gap-2.5 text-xs transition-all">
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="Buka / Tutup Dev Menu Simulasi Waktu"
          className="flex items-center gap-1.5 font-bold text-slate-300 hover:text-white transition cursor-pointer"
        >
          <Timer className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span className="hidden sm:inline">UAT Jam:</span>
        </button>

        <select
          value={mockTime || ""}
          onChange={(e) => setMockTime(e.target.value || null)}
          className="bg-slate-800 text-white font-semibold text-xs rounded-xl px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
        >
          <option value="">Waktu Nyata ({currentRealTime} WIB)</option>
          <option value="06:30">06:30 WIB (Tepat Waktu • +10 Poin)</option>
          <option value="07:15">07:15 WIB (Batas Tepat Waktu • +10 Poin)</option>
          <option value="07:45">07:45 WIB (Terlambat • +3 Poin)</option>
          <option value="08:15">08:15 WIB (Lewat Batas • Alpha)</option>
        </select>

        {mockTime && (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold shrink-0">
            SIMULASI: {mockTime}
          </span>
        )}
      </div>
    </div>
  );
}
