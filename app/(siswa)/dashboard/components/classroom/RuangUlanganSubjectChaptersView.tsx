"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  FileText,
  CheckCircle2,
  ArrowLeft,
  GraduationCap,
  Clock,
  Award,
  Globe,
  HelpCircle,
} from "lucide-react";
import { ChapterItem } from "../../types";

interface RuangUlanganSubjectChaptersViewProps {
  chapters: ChapterItem[];
  examsData?: any[];
  userProfile?: {
    nama_lengkap?: string;
    nama_kelas?: string;
    tingkat_kelas?: number;
  };
  onBackToHome: () => void;
  onSelectExamTab?: (tab: "ulangan" | "ujian") => void;
}

const SUBJECT_LIST = [
  {
    key: "Matematika",
    name: "Matematika",
    code: "MTK-8",
    icon: BookOpen,
    desc: "Evaluasi formatif bab: Bilangan Berpangkat, Teorema Pythagoras, SPLDV, Relasi & Fungsi.",
  },
] as const;

export default function RuangUlanganSubjectChaptersView({
  chapters,
  examsData = [],
  userProfile,
  onBackToHome,
  onSelectExamTab,
}: RuangUlanganSubjectChaptersViewProps) {
  const [selectedSubject, setSelectedSubject] = useState<"Matematika">("Matematika");
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  const activeSubjectMeta =
    SUBJECT_LIST.find((s) => s.key === selectedSubject) || SUBJECT_LIST[0];
  const SubjectIcon = activeSubjectMeta.icon;

  // Filter chapters by subject from database
  const subjectChapters = useMemo(() => {
    const key = selectedSubject.toLowerCase();
    let list = chapters.filter((c) => {
      const mapelLower = (c.mapel || "").toLowerCase();
      if (key.includes("matematika")) return mapelLower.includes("matematika") || mapelLower.includes("math");
      if (key.includes("indonesia")) return mapelLower.includes("indonesia");
      if (key.includes("inggris")) return mapelLower.includes("inggris") || mapelLower.includes("english");
      return mapelLower.includes(key);
    });

    if (list.length === 0) {
      list = chapters.slice(0, 5);
    }
    return list;
  }, [chapters, selectedSubject]);

  // Filter by semester
  const semesterChapters = useMemo(() => {
    const filtered = subjectChapters.filter((c) => {
      const sem = c.semester || (c.urutan <= 4 ? 1 : 2);
      return sem === selectedSemester;
    });
    return filtered.length > 0 ? filtered : subjectChapters;
  }, [subjectChapters, selectedSemester]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 font-sans">
      {/* 1. Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button
            onClick={onBackToHome}
            className="hover:text-blue-600 transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <span>/</span>
          <span>Ruang Ujian</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">Ulangan Harian</span>
          <span>/</span>
          <span className="text-blue-600 font-bold">{selectedSubject}</span>
        </div>

        {onSelectExamTab && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Pindah ke:</span>
            <button
              onClick={() => onSelectExamTab("ujian")}
              className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Ujian Resmi (PTS/PAS) →
            </button>
          </div>
        )}
      </div>

      {/* 2. Professional Header Card (Clean Solid Educational Styling - No AI Gradients) */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold">
              ULANGAN HARIAN FORMATIF
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium">
              {activeSubjectMeta.code} • Kurikulum Merdeka
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium">
              Kelas {userProfile?.tingkat_kelas || 8} ({userProfile?.nama_kelas || "Kelas 8"})
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <SubjectIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Ulangan Harian: {selectedSubject}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-normal mt-0.5">
                {activeSubjectMeta.desc}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>Total: <strong className="text-white">{semesterChapters.length} Bab Ulangan</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Standar Kelulusan: <strong className="text-white">KKM 75</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Waktu Pengerjaan: <strong className="text-white">45–60 Menit / Bab</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Subject Selector Tabs (Matematika, Bahasa Indonesia, Bahasa Inggris) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-700 mr-2 shrink-0">Pilih Mapel:</span>
          {SUBJECT_LIST.map((subj) => {
            const isSelected = selectedSubject === subj.key;
            const Icon = subj.icon;
            return (
              <button
                key={subj.key}
                onClick={() => setSelectedSubject(subj.key as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 border ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-blue-400" : "text-slate-500"}`} />
                <span>{subj.name}</span>
              </button>
            );
          })}
        </div>

        {/* Semester Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500">Semester:</span>
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 text-xs font-bold border border-slate-200/80">
            <button
              onClick={() => setSelectedSemester(1)}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedSemester === 1
                  ? "bg-white text-blue-600 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semester 1
            </button>
            <button
              onClick={() => setSelectedSemester(2)}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedSemester === 2
                  ? "bg-white text-blue-600 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semester 2
            </button>
          </div>
        </div>
      </div>

      {/* 4. List of Chapters (Bab) from Database for Ulangan */}
      <div className="space-y-4">
        {semesterChapters.map((chap, idx) => {
          // Find if there is an official exam for this bab in examsData
          const relatedExam = examsData.find(
            (e) => (e.bab_id && e.bab_id === chap.id) || (e.judul && e.judul.toLowerCase().includes(chap.judul.toLowerCase()))
          );

          const progressPercent = typeof chap.progress === "number" ? chap.progress : 0;
          const chapterStatus: "belum" | "berjalan" | "selesai" =
            progressPercent >= 100 ? "selesai" : progressPercent > 0 ? "berjalan" : "belum";

          return (
            <div
              key={chap.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all duration-150 p-6 space-y-4"
            >
              {/* Header Bab */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    {chap.judul}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5 line-clamp-2">
                    {chap.deskripsi || "Evaluasi formatif soal penalaran dan konsep materi kurikulum merdeka."}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  {/* Status Bab sesuai Modul MVP: Belum / Berjalan / Selesai */}
                  {chapterStatus === "selesai" ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Selesai</span>
                    </span>
                  ) : chapterStatus === "berjalan" ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Sedang Berjalan ({progressPercent}%)</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/70">
                      Belum Dimulai
                    </span>
                  )}
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    KKM 75
                  </span>
                </div>
              </div>

              {/* Grid 3 Kolom Komponen Soal & Evaluasi Bab */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Komponen Asesmen & Soal Bab (3 Bagian)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  <Link
                    href={`/quiz/${chap.id}`}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-200 transition flex items-center justify-between gap-2 group/m cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        1
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 group-hover/m:text-blue-700 truncate block">
                          Pilihan Ganda Konsep
                        </span>
                        <span className="text-[10px] text-slate-500 block">15 Soal Standar KKM</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/m:text-blue-600 shrink-0" />
                  </Link>

                  <Link
                    href={`/quiz/${chap.id}`}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-200 transition flex items-center justify-between gap-2 group/m cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        2
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 group-hover/m:text-blue-700 truncate block">
                          Penalaran & Analisis
                        </span>
                        <span className="text-[10px] text-slate-500 block">Studi Kasus & Eksplorasi</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/m:text-blue-600 shrink-0" />
                  </Link>

                  <Link
                    href={`/bab/${chap.id}`}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-200 transition flex items-center justify-between gap-2 group/m cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        3
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 group-hover/m:text-blue-700 truncate block">
                          Bahan Pendalaman Bab
                        </span>
                        <span className="text-[10px] text-slate-500 block">Rangkuman Materi & Teori</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/m:text-blue-600 shrink-0" />
                  </Link>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Nilai ulangan tersimpan langsung di rekapitulasi penilaian guru.</span>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <Link
                    href={`/bab/${chap.id}`}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
                  >
                    Materi Bab
                  </Link>
                  <Link
                    href={`/quiz/${chap.id}`}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <span>
                      {chapterStatus === "berjalan"
                        ? "Lanjutkan Ulangan Bab"
                        : chapterStatus === "selesai"
                        ? "Ulas Ulangan Bab"
                        : "Mulai Ulangan Bab"}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
