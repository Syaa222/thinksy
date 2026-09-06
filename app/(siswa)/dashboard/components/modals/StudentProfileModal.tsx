"use client";

import { CheckCircle2, X } from "lucide-react";

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentEmail: string;
  learningPoints: number;
  dailyStreak: number;
}

export default function StudentProfileModal({
  isOpen,
  onClose,
  studentName,
  studentEmail,
  learningPoints,
  dailyStreak,
}: StudentProfileModalProps) {
  if (!isOpen) return null;

  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="saas-modal rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-md w-full relative space-y-6 bg-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-20 h-20 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-2xl font-extrabold shadow-md border-4 border-white overflow-hidden">
            {initials}
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-[#0F172A]">
              {studentName}
            </h3>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {studentEmail}
            </div>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Siswa • Terverifikasi</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
              Total Poin
            </div>
            <div className="text-lg font-extrabold text-[#0F172A] mt-0.5">
              {learningPoints.toLocaleString("id-ID")} Poin
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-center">
            <div className="text-[10px] text-orange-700 font-bold uppercase tracking-wider">
              Daily Streak
            </div>
            <div className="text-lg font-extrabold text-[#0F172A] mt-0.5">
              {dailyStreak} Hari
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Tutup Profil
        </button>
      </div>
    </div>
  );
}
