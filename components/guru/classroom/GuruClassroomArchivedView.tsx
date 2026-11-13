"use client";

import { useState, useEffect } from "react";
import {
  Archive,
  ArrowLeft,
  RotateCcw,
  Trash2,
  MoreVertical,
  Folder,
  Award,
  Users,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { ClassroomHomeClass } from "./GuruClassroomHomeView";

interface GuruClassroomArchivedViewProps {
  archivedClasses: ClassroomHomeClass[];
  onRestoreClass: (classId: string) => void;
  onDeleteClass: (classId: string) => void;
  onBackToTeaching: () => void;
}

export default function GuruClassroomArchivedView({
  archivedClasses,
  onRestoreClass,
  onDeleteClass,
  onBackToTeaching,
}: GuruClassroomArchivedViewProps) {
  const [openMenuClassId, setOpenMenuClassId] = useState<string | null>(null);
  const [confirmDeleteClass, setConfirmDeleteClass] = useState<ClassroomHomeClass | null>(null);

  // Close 3-dots on click outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuClassId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToTeaching}
            className="p-2 rounded-full hover:bg-slate-200/70 text-slate-600 transition cursor-pointer"
            title="Kembali ke halaman Teaching"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-normal text-slate-800 font-sans tracking-tight flex items-center gap-2.5">
              <span>Archived classes</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                {archivedClasses.length}
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Kelas yang diarsipkan tidak dapat diakses atau diubah oleh siswa hingga Anda memulihkannya kembali.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToTeaching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer border border-slate-200 shrink-0 self-start sm:self-auto"
        >
          <span>Kembali ke Kelas Aktif</span>
        </button>
      </div>

      {/* Content */}
      {archivedClasses.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
            <Archive className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              Tidak ada kelas yang diarsipkan
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Untuk mengarsipkan kelas, klik menu titik 3 pada kartu kelas di halaman Teaching, lalu pilih <strong>Hide</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToTeaching}
            className="mt-2 px-5 py-2.5 rounded-full bg-[#0B57D0] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            Buka Kelas Aktif (Teaching)
          </button>
        </div>
      ) : (
        /* Grid of Archived Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archivedClasses.map((cls) => {
            const isMenuOpen = openMenuClassId === cls.id;

            return (
              <div
                key={cls.id}
                className={`bg-white rounded-3xl border border-slate-300/90 shadow-2xs flex flex-col justify-between relative opacity-95 hover:opacity-100 transition-opacity ${
                  isMenuOpen ? "overflow-visible z-40" : "overflow-hidden z-0 hover:z-10"
                }`}
              >
                {/* Top Banner (Diagonal stripes + muted gradient for authentic archive look) */}
                <div
                  className="p-5 text-white relative rounded-t-3xl"
                  style={{
                    backgroundColor: "#475569",
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 10px, transparent 10px, transparent 20deg)",
                  }}
                >
                  <div className={`flex items-start justify-between relative ${isMenuOpen ? "z-50" : "z-20"}`}>
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold truncate font-sans text-white">
                          {cls.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-200 font-medium truncate">
                        {cls.section}
                      </p>
                      <p className="text-[11px] text-slate-300">
                        {cls.room}
                      </p>
                    </div>

                    {/* 3-dots menu on archived class */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuClassId(isMenuOpen ? null : cls.id);
                        }}
                        className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Opsi Kelas Arsip"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {isMenuOpen && (
                        <div
                          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-800 text-sm animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onRestoreClass(cls.id);
                              setOpenMenuClassId(null);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-blue-50 flex items-center gap-2.5 transition cursor-pointer text-xs font-semibold text-[#0B57D0]"
                          >
                            <RotateCcw className="w-4 h-4 text-[#0B57D0]" />
                            <span>Restore (Pulihkan)</span>
                          </button>

                          <div className="my-1 border-t border-slate-100" />

                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteClass(cls);
                              setOpenMenuClassId(null);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-rose-50 flex items-center gap-2.5 transition cursor-pointer text-xs font-semibold text-rose-600"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                            <span>Delete (Hapus)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Archived Pill */}
                  <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs text-slate-200">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/30 border border-white/20 text-[11px] font-bold">
                      <Archive className="w-3.5 h-3.5" />
                      <span>Diarsipkan</span>
                    </span>
                    <span className="font-mono text-slate-300">
                      Token: {cls.subjectCode}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{cls.studentCount ?? 32} Siswa Terdaftar</span>
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        Akses Siswa Ditutup
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {cls.description ||
                        "Kelas ini diarsipkan. Seluruh materi, tugas, dan rekap nilai tetap tersimpan aman."}
                    </p>
                  </div>

                  {/* Card Actions: Restore Button */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onRestoreClass(cls.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0B57D0] font-bold text-xs transition cursor-pointer border border-blue-200"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Pulihkan ke Teaching</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteClass(cls)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Hapus Kelas Permanen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteClass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setConfirmDeleteClass(null)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">Hapus Kelas Permanen?</h3>
              </div>
              <button onClick={() => setConfirmDeleteClass(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus kelas <strong>{confirmDeleteClass.name}</strong> secara permanen? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteClass(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteClass(confirmDeleteClass.id);
                  setConfirmDeleteClass(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
