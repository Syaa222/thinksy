"use client";

import { useState } from "react";
import {
  CheckCircle2,
  X,
  GraduationCap,
  ShieldCheck,
  QrCode,
  Printer,
  Copy,
  Check,
  Wifi,
  Sparkles,
  Flame,
  Zap,
  Award,
  Calendar,
  Layers,
  FileText,
  RotateCw,
  Share2,
} from "lucide-react";
import { SekolahData } from "../../types";

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentEmail: string;
  learningPoints: number;
  dailyStreak: number;
  nisn?: string | null;
  nis?: string | null;
  namaKelas?: string | null;
  jurusan?: string | null;
  tahunAjaran?: string | null;
  fotoUrl?: string | null;
  sekolahData?: SekolahData | null;
}

export default function StudentProfileModal({
  isOpen,
  onClose,
  studentName,
  studentEmail,
  learningPoints,
  dailyStreak,
  nisn,
  nis,
  namaKelas,
  jurusan,
  tahunAjaran,
  fotoUrl,
  sekolahData,
}: StudentProfileModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [cardSide, setCardSide] = useState<"front" | "back">("front");

  if (!isOpen) return null;

  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const schoolName = sekolahData?.nama || "SMK Muhammadiyah Pakem";
  const schoolAddress =
    sekolahData?.alamat || "Jl. Pakem - Turi No. 1, Pakem, Sleman, D.I. Yogyakarta";
  const authId = `${nis || "260481"}-THINKSY-${(namaKelas || "8A").replace(/\s+/g, "")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-50 rounded-3xl shadow-2xl border border-slate-300/80 overflow-hidden text-slate-900 transition-all flex flex-col max-h-[92vh]">
        {/* MODAL CONTROL HEADER (Non-print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              Kartu Pelajar & Ujian Digital
            </span>
          </div>

          {/* Toggle Front / Back of Card */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setCardSide("front")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                cardSide === "front"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Kartu Depan</span>
            </button>
            <button
              onClick={() => setCardSide("back")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                cardSide === "back"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Ketentuan (Belakang)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE CARD CONTAINER */}
        <div className="p-4 sm:p-6 overflow-y-auto print:p-0 print:overflow-visible">
          {/* ══════════════════════════════════════════════════════════
              CARD FRONT SIDE (Kartu Identitas Depan)
             ══════════════════════════════════════════════════════════ */}
          {cardSide === "front" ? (
            <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden print:shadow-none print:border-2">
              {/* Background Watermark Pattern */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(#0F172A 1.5px, transparent 1.5px), radial-gradient(#0F172A 1.5px, #ffffff 1.5px)",
                  backgroundSize: "24px 24px",
                  backgroundPosition: "0 0, 12px 12px",
                }}
              />

              {/* CARD TOP HEADER: School Brand with Gold Foil Trim */}
              <div className="relative bg-gradient-to-r from-[#0B1329] via-[#1E293B] to-[#0F172A] text-white px-5 sm:px-7 pt-5 pb-4 border-b-2 border-amber-400 shadow-md">
                {/* Ambient Glow */}
                <div className="absolute top-0 right-0 w-64 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-40 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {/* School Emblem / Crest */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/25 to-amber-500/10 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
                      <GraduationCap className="w-7 h-7" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400 inline" />
                          <span>KARTU IDENTITAS RESMI SISWA & UJIAN</span>
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                        {schoolName}
                      </h3>
                      <p className="text-[11px] text-slate-300 font-medium line-clamp-1">
                        {schoolAddress}
                      </p>
                    </div>
                  </div>

                  {/* Smart Card Chip & Contactless Symbol */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-2">
                      {/* Contactless RFID / NFC Wave Icon */}
                      <Wifi className="w-4 h-4 text-amber-300/80 rotate-90" />

                      {/* Realistic EMV Smart Chip */}
                      <div className="w-9 h-7 rounded-lg bg-gradient-to-br from-amber-300 via-amber-200 to-amber-400 border border-amber-400 shadow-xs flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-amber-600/40" />
                        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-amber-600/40" />
                        <div className="w-4 h-3 rounded-xs border border-amber-600/30 bg-amber-100/50" />
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-black tracking-wider uppercase mt-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Aktif • Terverifikasi</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD MAIN BODY */}
              <div className="p-5 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                  {/* Photo & Biometric Column */}
                  <div className="flex flex-col items-center gap-2.5 flex-shrink-0">
                    <div className="relative group">
                      {/* Photo Outer Frame with Gold Trim */}
                      <div className="w-32 h-40 rounded-2xl bg-gradient-to-b from-slate-100 via-white to-slate-100 border-2 border-slate-300 overflow-hidden shadow-lg flex items-center justify-center relative ring-4 ring-amber-400/20">
                        {fotoUrl ? (
                          <img
                            src={fotoUrl}
                            alt={studentName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-[#0F172A] p-2">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg border border-white/30 mb-1">
                              {initials}
                            </div>
                            <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                              PASFOTO
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              THINKSY ID
                            </span>
                          </div>
                        )}

                        {/* Top corner security seal */}
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/50 text-[8px] font-mono text-amber-300 backdrop-blur-xs font-bold">
                          KTS-2026
                        </div>
                      </div>

                      {/* Verified Star Badge */}
                      <div
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-lg font-black text-sm border-2 border-white"
                        title="Akun Terverifikasi Resmi"
                      >
                        ★
                      </div>
                    </div>

                    {/* Biometric & Live Stats Strip */}
                    <div className="text-center space-y-1 w-full">
                      <span className="inline-flex items-center justify-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full w-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Biometrik Valid</span>
                      </span>

                      <div className="flex items-center justify-center gap-2 text-[10px] font-extrabold text-slate-600 pt-0.5">
                        <span className="inline-flex items-center gap-0.5 text-amber-700">
                          <Zap className="w-3 h-3" /> {learningPoints} XP
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5 text-orange-600">
                          <Flame className="w-3 h-3" /> {dailyStreak} Hari
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Student Credentials Information Grid */}
                  <div className="flex-1 w-full space-y-3.5">
                    {/* Full Name & Email */}
                    <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <span>NAMA LENGKAP SISWA</span>
                          <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[9px] font-bold">
                            Reguler
                          </span>
                        </div>
                        <h4 className="text-xl font-black text-[#0F172A] tracking-tight mt-0.5 flex items-center gap-1.5">
                          <span>{studentName}</span>
                          <CheckCircle2 className="w-4 h-4 text-blue-600 inline shrink-0" />
                        </h4>
                        <div className="text-xs text-slate-500 font-medium">
                          {studentEmail}
                        </div>
                      </div>
                    </div>

                    {/* 2x2 Information Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* NISN with Copy Button */}
                      <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-blue-300 transition group relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                            NISN
                          </span>
                          <button
                            onClick={() => handleCopy(nisn || "0089247182", "nisn")}
                            className="text-slate-400 hover:text-blue-600 transition p-0.5"
                            title="Salin NISN"
                          >
                            {copiedField === "nisn" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-sm font-mono font-black text-[#0F172A] mt-0.5 tracking-wider">
                          {nisn || "0089247182"}
                        </div>
                      </div>

                      {/* NIS / ID Pelajar with Copy Button */}
                      <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-blue-300 transition group relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                            NIS (ID PELAJAR)
                          </span>
                          <button
                            onClick={() => handleCopy(nis || "260481", "nis")}
                            className="text-slate-400 hover:text-blue-600 transition p-0.5"
                            title="Salin NIS"
                          >
                            {copiedField === "nis" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-sm font-mono font-black text-[#0F172A] mt-0.5 tracking-wider">
                          {nis || "260481"}
                        </div>
                      </div>

                      {/* Kelas Terdaftar */}
                      <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                          KELAS TERDAFTAR
                        </span>
                        <div className="text-sm font-black text-[#0F172A] mt-0.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>{namaKelas || "Kelas 8A"}</span>
                        </div>
                      </div>

                      {/* Tahun Ajaran */}
                      <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                          TAHUN AJARAN
                        </span>
                        <div className="text-sm font-black text-[#0F172A] mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tahunAjaran || "2026/2027"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Kompetensi Keahlian / Jurusan */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-orange-50/60 border border-amber-200/90 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 block">
                          KOMPETENSI KEAHLIAN / JURUSAN
                        </span>
                        <div className="text-xs font-black text-amber-950 mt-0.5">
                          {jurusan || "Teknik Komputer & Jaringan (TKJ)"}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-amber-200/60 border border-amber-300 text-amber-900 text-[10px] font-black">
                        SMK Vokasi
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECURITY STRIP: QR Code & Auth Token */}
                <div className="pt-4 border-t border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    {/* High-tech QR Code Box */}
                    <div className="w-12 h-12 rounded-xl bg-[#0F172A] border-2 border-amber-400 p-1 flex items-center justify-center shrink-0 shadow-sm relative group">
                      <QrCode className="w-full h-full text-amber-300" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-black tracking-wider text-[#0F172A]">
                          AUTH-ID: {authId}
                        </span>
                        <button
                          onClick={() => handleCopy(authId, "auth")}
                          className="text-slate-400 hover:text-blue-600 transition"
                          title="Salin Auth ID"
                        >
                          {copiedField === "auth" ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-500 font-medium">
                        Sah digunakan untuk presensi, verifikasi Ulangan Harian & Ujian Semester.
                      </p>
                    </div>
                  </div>

                  {/* Barcode & Signature Mark */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <div className="text-right hidden sm:block">
                      <div className="text-[8px] font-mono tracking-widest text-slate-400">
                        HASH VALID: 9F2A-881C-KTS
                      </div>
                      <div className="text-[9px] font-bold text-slate-600">
                        KEMENDIKBUDRISTEK RI
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════
               CARD BACK SIDE (Ketentuan & Tata Tertib Ujian)
               ══════════════════════════════════════════════════════════ */
            <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden print:shadow-none print:border-2 space-y-4">
              {/* Magnetic Stripe Simulation */}
              <div className="w-full h-12 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 mt-4 border-y border-slate-700 relative flex items-center px-6">
                <span className="text-[9px] font-mono text-slate-400 tracking-widest">
                  THINKSY ELECTRONIC CARD • SECURE RFID EMV ENCRYPTED
                </span>
              </div>

              {/* Back Content */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-black uppercase text-[#0F172A] tracking-wider border-b border-slate-100 pb-2">
                    KETENTUAN & TATA TERTIB PESERTA ASESMEN
                  </h4>
                  <ul className="text-xs text-slate-600 font-medium space-y-2 leading-relaxed list-decimal pl-4">
                    <li>
                      Kartu Identitas Siswa ini wajib dibawa atau ditunjukkan secara digital dalam setiap pelaksanaan Ulangan Harian, Asesmen Tengah Semester, dan Ujian Akhir.
                    </li>
                    <li>
                      QR Code dan Auth ID digunakan oleh guru pengawas untuk melakukan check-in dan validasi kehadiran di lembar Live Monitor.
                    </li>
                    <li>
                      Dilarang keras memindahtangankan akun atau memalsukan identitas peserta ujian. Pelanggaran dikenakan sanksi diskualifikasi nilai asesmen.
                    </li>
                    <li>
                      Apabila kartu fisik/digital hilang atau data mengalami ketidaksesuaian, segera lapor ke bagian Tata Usaha sekolah atau Guru Wali Kelas.
                    </li>
                  </ul>
                </div>

                {/* Signature & Digital Stamping Section */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono tracking-widest text-slate-400">
                      STATUS VALIDASI DIGITAL
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 space-y-0.5">
                      <div>Sistem: <span className="font-bold">THINKSY Cloud AI</span></div>
                      <div>Waktu Cetak: <span className="font-bold">2026/2027</span></div>
                      <div>NPSN Sekolah: <span className="font-bold">20401124</span></div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Mengetahui, Kepala Sekolah
                    </span>
                    {/* Simulated School Stamp */}
                    <div className="w-24 h-12 rounded-lg border border-dashed border-blue-400/50 bg-blue-50/50 flex items-center justify-center text-[10px] font-black text-blue-700 -rotate-2">
                      TERVERIFIKASI
                    </div>
                    <span className="text-[11px] font-black text-[#0F172A]">
                      Drs. H. Suwardi, M.Pd.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print:hidden">
          <button
            onClick={() => setCardSide(cardSide === "front" ? "back" : "front")}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>
              {cardSide === "front"
                ? "Balik ke Ketentuan (Belakang)"
                : "Kembali ke Kartu Depan"}
            </span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Kartu</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-black transition cursor-pointer shadow-md"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
