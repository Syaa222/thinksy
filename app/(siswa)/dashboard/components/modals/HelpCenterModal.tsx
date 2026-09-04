"use client";

import { HelpCircle, X } from "lucide-react";

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpCenterModal({
  isOpen,
  onClose,
}: HelpCenterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="saas-modal rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-lg w-full relative space-y-5 max-h-[85vh] overflow-y-auto bg-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#0F172A]">
              Pusat Bantuan & Layanan Belajar
            </h3>
            <p className="text-xs text-slate-500">
              Panduan Penggunaan Aplikasi & Dukungan Sekolah
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2">
            <h4 className="font-extrabold text-indigo-900 text-sm flex items-center gap-2">
              <span>🤖 Cara Kerja Tutor AI Sokratik</span>
            </h4>
            <p className="text-indigo-800 leading-relaxed font-medium">
              Tutor AI THINKSY memandu Anda dengan pertanyaan bertahap (*metode Sokratik*). AI tidak memberikan jawaban akhir secara instan agar pemahaman konsep matematika Anda terbentuk secara mandiri.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider">
              Pertanyaan Sering Diajukan (FAQ)
            </h4>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">
                1. Bagaimana cara menambah Poin Belajar?
              </div>
              <div className="text-slate-600 leading-relaxed">
                Poin didapatkan setiap kali Anda mengklaim misi harian, presensi selfie harian, dan menyelesaikan kuis/latihan dengan benar.
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">
                2. Mengapa kuis bertimer otomatis terkumpul?
              </div>
              <div className="text-slate-600 leading-relaxed">
                Sesi Kuis & Asesmen memiliki batas waktu 15 menit. Saat waktu habis (00:00), sistem secara otomatis mengumpulkan seluruh jawaban Anda ke server.
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">
                3. Presensi Kehadiran Harian & Daily Streak
              </div>
              <div className="text-slate-600 leading-relaxed">
                Lakukan verifikasi presensi setiap hari sekolah sebelum pukul 08.00 WIB. Hadir tepat waktu memberi +10 Poin, terlambat memberi +3 Poin, dan jika terlewat akan tercatat Alpha.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-center space-y-1">
            <div className="font-extrabold text-slate-900">
              Butuh Bantuan Kendala Teknis?
            </div>
            <div className="text-slate-500 text-[11px]">
              Hubungi Admin Sekolah atau Wali Kelas Anda untuk masalah akun.
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Tutup Pusat Bantuan
        </button>
      </div>
    </div>
  );
}
