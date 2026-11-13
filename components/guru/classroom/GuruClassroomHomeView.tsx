"use client";

import { useState, useEffect } from "react";
import {
  MoreVertical,
  Plus,
  Copy,
  Check,
  FolderKanban,
  TrendingUp,
  Archive,
  ArrowUpDown,
  EyeOff,
  UserMinus,
  Flag,
  X,
  Palette,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { ClassBannerGraphic } from "./ClassBannerGraphics";
import CustomizeBannerModal from "./CustomizeBannerModal";

export interface ClassroomHomeClass {
  id: string;
  name: string;
  section: string;
  room: string;
  subjectCode: string;
  themeColor: string;
  bgGradient: string;
  studentCount: number;
  description?: string;
  pendingReviews?: number;
  bannerType?: "illustration" | "photo";
  bannerIllustration?: string;
  bannerPhotoUrl?: string;
  mapel?: string;
}

interface GuruClassroomHomeViewProps {
  classes: ClassroomHomeClass[];
  archivedClassIds?: string[];
  onArchiveClass?: (classId: string) => void;
  onDeleteClass?: (classId: string) => void;
  onViewArchived?: () => void;
  onOpenClass: (classId: string) => void;
  onOpenGrades?: (classId: string) => void;
  onCreateClassClick?: () => void;
  onUpdateClass?: (cls: ClassroomHomeClass) => void;
}

export default function GuruClassroomHomeView({
  classes,
  archivedClassIds = [],
  onArchiveClass,
  onDeleteClass,
  onViewArchived,
  onOpenClass,
  onOpenGrades,
  onCreateClassClick,
  onUpdateClass,
}: GuruClassroomHomeViewProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [openMenuClassId, setOpenMenuClassId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hidden classes fallback
  const [hiddenClassIds, setHiddenClassIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("thinksy_archived_classes");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Modal states for 3-dots actions
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [selectedClassForMove, setSelectedClassForMove] = useState<ClassroomHomeClass | null>(null);

  const [isUnenrollModalOpen, setIsUnenrollModalOpen] = useState(false);
  const [selectedClassForUnenroll, setSelectedClassForUnenroll] = useState<ClassroomHomeClass | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedClassForReport, setSelectedClassForReport] = useState<ClassroomHomeClass | null>(null);
  const [reportReason, setReportReason] = useState("Spam atau konten tidak pantas");
  const [reportDetail, setReportDetail] = useState("");

  // Banner customize modal state
  const [customizingClass, setCustomizingClass] = useState<ClassroomHomeClass | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close 3-dots dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuClassId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleCopy = (e: React.MouseEvent, token: string) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(token);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
      showToast("Token kelas disalin ke clipboard!");
    } catch {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 3-DOTS CARD ACTIONS (MOVE, HIDE, UNENROLL, REPORT ABUSE)
  // ════════════════════════════════════════════════════════════════════════════
  const handleOpenMoveModal = (cls: ClassroomHomeClass) => {
    setSelectedClassForMove(cls);
    setIsMoveModalOpen(true);
    setOpenMenuClassId(null);
  };

  const handleHideClass = (classId: string) => {
    if (onArchiveClass) {
      onArchiveClass(classId);
    } else {
      const updated = Array.from(new Set([...hiddenClassIds, classId]));
      setHiddenClassIds(updated);
      try {
        localStorage.setItem("thinksy_archived_classes", JSON.stringify(updated));
      } catch {}
    }
    setOpenMenuClassId(null);
    showToast("Kelas berhasil dipindahkan ke Arsip Kelas (Archived classes).");
  };

  const handleOpenUnenrollModal = (cls: ClassroomHomeClass) => {
    setSelectedClassForUnenroll(cls);
    setIsUnenrollModalOpen(true);
    setOpenMenuClassId(null);
  };

  const handleOpenReportModal = (cls: ClassroomHomeClass) => {
    setSelectedClassForReport(cls);
    setIsReportModalOpen(true);
    setOpenMenuClassId(null);
  };

  // Filter visible classes (exclude archived / hidden classes)
  const effectiveArchived =
    archivedClassIds && archivedClassIds.length > 0 ? archivedClassIds : hiddenClassIds;
  const visibleClasses = classes.filter((c) => !effectiveArchived.includes(c.id));

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#041E49] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-400/30 animate-in slide-in-from-bottom duration-150">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* HEADER: TEACHING (MURNI KHUSUS KELAS YANG DIAMPU GURU)                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-normal text-slate-800 font-sans tracking-tight">
            Teaching
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Kelas aktif yang Anda ampu sebagai pendidik ({visibleClasses.length} kelas)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {effectiveArchived.length > 0 && (
            <button
              type="button"
              onClick={onViewArchived}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer border border-slate-200 active:scale-95"
              title="Buka halaman Arsip Kelas"
            >
              <Archive className="w-3.5 h-3.5 text-slate-600" />
              <span>Lihat Kelas di Arsip ({effectiveArchived.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCreateClassClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B57D0] hover:bg-blue-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Kelas Baru & Token</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* GRID KARTU KELAS TEACHING DENGAN MENU TITIK 3                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {visibleClasses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
            <Archive className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              Semua kelas aktif sedang diarsipkan
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Seluruh kelas aktif telah dipindahkan ke arsip. Anda dapat memulihkannya kapan saja dari menu Arsip.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            {onViewArchived && (
              <button
                type="button"
                onClick={onViewArchived}
                className="px-5 py-2.5 rounded-full bg-[#0B57D0] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Lihat Kelas di Arsip
              </button>
            )}
            <button
              type="button"
              onClick={onCreateClassClick}
              className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer border border-slate-200"
            >
              Buat Kelas Baru
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleClasses.map((cls) => {
            const isThisCopied = copiedToken === cls.subjectCode;
            const isMenuOpen = openMenuClassId === cls.id;

            return (
              <div
                key={cls.id}
                onClick={() => onOpenClass(cls.id)}
                className={`group bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between relative ${
                  isMenuOpen ? "overflow-visible z-40" : "overflow-hidden z-0 hover:z-10"
                }`}
              >
                {/* Top Banner with Custom Photo or Google Classroom SVG Illustration */}
                <div
                  className="rounded-t-3xl p-5 text-white relative"
                  style={{ backgroundColor: cls.themeColor || "#1967D2" }}
                >
                  {/* Background Gradient & Illustration (clipped safely to rounded-t-3xl) */}
                  <div
                    className={`absolute inset-0 rounded-t-3xl overflow-hidden bg-gradient-to-r ${cls.bgGradient || "from-blue-700 via-indigo-700 to-slate-900"} pointer-events-none`}
                  >
                    <ClassBannerGraphic
                      bannerType={cls.bannerType || (cls.bannerPhotoUrl ? "photo" : "illustration")}
                      bannerIllustration={cls.bannerIllustration}
                      bannerPhotoUrl={cls.bannerPhotoUrl}
                      subjectName={cls.mapel || cls.name}
                      isCompact={true}
                    />
                  </div>

                  <div className={`flex items-start justify-between relative ${isMenuOpen ? "z-50" : "z-20"}`}>
                    <div className="space-y-1 min-w-0 pr-4 drop-shadow-xs">
                      <h3 className="text-lg font-bold truncate group-hover:underline font-sans">
                        {cls.name}
                      </h3>
                      <p className="text-xs text-blue-100 font-medium truncate">
                        {cls.section}
                      </p>
                      <p className="text-[11px] text-blue-200">
                        {cls.room}
                      </p>
                    </div>

                    {/* 3 DOTS MENU */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuClassId(isMenuOpen ? null : cls.id);
                        }}
                        className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Menu Opsi Kelas"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {/* POPUP DROPDOWN: Customize Banner, Move, Hide, Unenroll, Report abuse */}
                      {isMenuOpen && (
                        <div
                          className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-800 text-sm animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* 0. Customize Banner & Foto */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuClassId(null);
                              setCustomizingClass(cls);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-blue-50 flex items-center gap-3 transition cursor-pointer text-xs font-bold text-[#0B57D0]"
                          >
                            <Palette className="w-4 h-4 text-[#0B57D0]" />
                            <span>Sesuaikan Banner & Foto</span>
                          </button>

                          <div className="my-1 border-t border-slate-100" />

                          {/* 1. Move */}
                          <button
                            type="button"
                            onClick={() => handleOpenMoveModal(cls)}
                            className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 transition cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900"
                          >
                            <ArrowUpDown className="w-4 h-4 text-slate-500" />
                            <span>Move</span>
                          </button>

                          {/* 2. Hide */}
                          <button
                            type="button"
                            onClick={() => handleHideClass(cls.id)}
                            className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 transition cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900"
                          >
                            <EyeOff className="w-4 h-4 text-slate-500" />
                            <span>Hide</span>
                          </button>

                          <div className="my-1 border-t border-slate-100" />

                          {/* 3. Unenroll */}
                          <button
                            type="button"
                            onClick={() => handleOpenUnenrollModal(cls)}
                            className="w-full px-4 py-2.5 text-left hover:bg-rose-50 flex items-center gap-3 transition cursor-pointer text-xs font-semibold text-rose-600 hover:text-rose-700"
                          >
                            <UserMinus className="w-4 h-4 text-rose-500" />
                            <span>Unenroll</span>
                          </button>

                          {/* 4. Report abuse */}
                          <button
                            type="button"
                            onClick={() => handleOpenReportModal(cls)}
                            className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 transition cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900"
                          >
                            <Flag className="w-4 h-4 text-slate-400" />
                            <span>Report abuse</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Teacher Avatar & Details */}
                  <div className="mt-6 flex items-center justify-between text-xs relative z-10">
                    <span className="font-medium text-white/90 drop-shadow-xs">
                      {cls.studentCount || 32} Siswa Terdaftar
                    </span>

                    {/* Class Token Badge */}
                    <button
                      type="button"
                      onClick={(e) => handleCopy(e, cls.subjectCode)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-mono font-bold transition cursor-pointer shadow-xs active:scale-95 border border-white/20"
                      title="Klik untuk menyalin token kelas ke siswa"
                    >
                      <span>Token: {cls.subjectCode.toUpperCase()}</span>
                      {isThisCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-white/80" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {cls.description || "Kelas pembelajaran aktif berbasis AI Sokratik, materi terstruktur, dan ruang latihan mandiri."}
                  </p>

                  {/* Card Bottom Quick Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium">
                      <FolderKanban className="w-4 h-4 text-slate-400" />
                      <span>{cls.pendingReviews || 2} Tugas Ditinjau</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenGrades) onOpenGrades(cls.id);
                        else onOpenClass(cls.id);
                      }}
                      className="inline-flex items-center gap-1 font-bold text-[#0B57D0] hover:underline cursor-pointer"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Buka Kelas</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODALS UNTUK MENU TITIK 3 (MOVE, UNENROLL, REPORT ABUSE)              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* MOVE MODAL */}
      {isMoveModalOpen && selectedClassForMove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsMoveModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <ArrowUpDown className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Move Class</h3>
              </div>
              <button onClick={() => setIsMoveModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Atur posisi tampilan kartu kelas <strong>{selectedClassForMove.name}</strong> di dashboard pengampu Anda:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  showToast(`Kelas ${selectedClassForMove.name} dipindahkan ke posisi paling atas.`);
                  setIsMoveModalOpen(false);
                }}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left text-xs font-bold text-slate-800 transition cursor-pointer flex items-center justify-between"
              >
                <span>Pindahkan ke Posisi Paling Atas / Pertama</span>
                <span className="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Utama</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  showToast(`Posisi kelas ${selectedClassForMove.name} diperbarui.`);
                  setIsMoveModalOpen(false);
                }}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left text-xs font-bold text-slate-800 transition cursor-pointer flex items-center justify-between"
              >
                <span>Pindahkan ke Posisi Terakhir</span>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Bawah</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsMoveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNENROLL MODAL */}
      {isUnenrollModalOpen && selectedClassForUnenroll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsUnenrollModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <UserMinus className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">Unenroll dari Kelas</h3>
              </div>
              <button onClick={() => setIsUnenrollModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pindahkan Kelas ke Arsip (Archived classes)</span>
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Apakah Anda yakin ingin membatalkan pengampuan (unenroll) kelas <strong>{selectedClassForUnenroll.name}</strong>?
              </p>
              <ul className="text-[11px] text-amber-900 list-disc list-inside space-y-1 pt-1">
                <li>Kelas akan dipindahkan ke menu <strong>Arsip Kelas</strong>.</li>
                <li><strong>Di dashboard siswa, kelas ini seketika tidak akan ada lagi</strong>.</li>
                <li>Untuk menghapus permanen, Anda dapat membukanya nanti di menu Arsip Kelas.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUnenrollModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleHideClass(selectedClassForUnenroll.id);
                  setIsUnenrollModalOpen(false);
                  showToast(`Kelas ${selectedClassForUnenroll.name} berhasil di-unenroll dan dipindahkan ke Arsip.`);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#0B57D0] hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <UserMinus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Konfirmasi Unenroll (Masuk ke Arsip)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT ABUSE MODAL */}
      {isReportModalOpen && selectedClassForReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsReportModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Flag className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">Report Abuse</h3>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Laporkan masalah, penyalahgunaan token kelas, atau kendala konten pada kelas <strong>{selectedClassForReport.name}</strong> ke Administrator:
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Kategori Laporan *</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 bg-slate-50"
                >
                  <option value="Spam atau konten tidak pantas">Spam atau konten tidak pantas</option>
                  <option value="Pelanggaran privasi data siswa">Pelanggaran privasi data siswa</option>
                  <option value="Kendala sinkronisasi token kelas">Kendala sinkronisasi token kelas</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Detail Keterangan *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan kendala atau pelanggaran yang terjadi..."
                  value={reportDetail}
                  onChange={(e) => setReportDetail(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast("Terima kasih, laporan penyalahgunaan berhasil dikirim ke Administrator.");
                  setIsReportModalOpen(false);
                  setReportDetail("");
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              >
                Kirim Laporan
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 5. MODAL SESUAIKAN BANNER & FOTO KELAS */}
      {customizingClass && (
        <CustomizeBannerModal
          isOpen={true}
          onClose={() => setCustomizingClass(null)}
          classNameTitle={customizingClass.name}
          sectionTitle={customizingClass.section}
          roomTitle={customizingClass.room}
          tokenCode={customizingClass.subjectCode}
          initialType={customizingClass.bannerType || (customizingClass.bannerPhotoUrl ? "photo" : "illustration")}
          initialIllustration={customizingClass.bannerIllustration}
          initialPhotoUrl={customizingClass.bannerPhotoUrl}
          initialThemeColor={customizingClass.themeColor}
          initialBgGradient={customizingClass.bgGradient}
          onSave={(bannerData) => {
            const updated: ClassroomHomeClass = {
              ...customizingClass,
              bannerType: bannerData.bannerType,
              bannerIllustration: bannerData.bannerIllustration,
              bannerPhotoUrl: bannerData.bannerPhotoUrl,
              themeColor: bannerData.themeColor,
              bgGradient: bannerData.bgGradient,
            };
            if (onUpdateClass) {
              onUpdateClass(updated);
            }
            showToast(`Banner kelas "${customizingClass.name}" berhasil diperbarui!`);
            setCustomizingClass(null);
          }}
        />
      )}
    </div>
  );
}
