"use client";

import { Settings, X, Sun, Moon } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  tutorGuidanceLevel: string;
  setTutorGuidanceLevel: (val: string) => void;
  onSave: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  isDarkMode,
  setIsDarkMode,
  tutorGuidanceLevel,
  setTutorGuidanceLevel,
  onSave,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="saas-modal rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-md w-full relative space-y-5 bg-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center">
            <Settings className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#0F172A]">
              Pengaturan Akun & Tampilan
            </h3>
            <p className="text-xs text-slate-500">
              Preferensi Mode & Bimbingan AI
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">
                Mode Gelap / Terang (Theme Toggle)
              </div>
              <div className="text-[10px] text-slate-500">
                {isDarkMode ? "Mode Gelap Aktif" : "Mode Terang Aktif"}
              </div>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-[#0F172A] text-amber-400 hover:bg-slate-800 transition cursor-pointer"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              Tingkat Bimbingan Tutor AI
            </label>
            <select
              value={tutorGuidanceLevel}
              onChange={(e) => setTutorGuidanceLevel(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="sedang">
                Sedang (Bimbingan Sokratik Bertahap)
              </option>
              <option value="tinggi">
                Detail (Bimbingan Lengkap dengan Contoh)
              </option>
              <option value="ringkas">Ringkas (Petunjuk Singkat)</option>
            </select>
          </div>
        </div>

        <button
          onClick={onSave}
          className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Simpan Pengaturan
        </button>
      </div>
    </div>
  );
}
