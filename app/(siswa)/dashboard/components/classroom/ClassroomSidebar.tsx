"use client";

import { useState } from "react";
import {
  Calendar,
  GraduationCap,
  ClipboardCheck,
  Settings,
  ChevronDown,
  ChevronUp,
  BookOpen,
  UserCircle,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export type ClassroomViewMode =
  | "home"
  | "calendar"
  | "todo"
  | "archived"
  | "matematika"
  | "profil";

interface ClassroomSidebarProps {
  isOpen: boolean;
  activeView: ClassroomViewMode;
  onSelectView: (view: ClassroomViewMode) => void;
  onOpenSettings: () => void;
  onOpenProfile?: () => void;
  todoCount?: number;
  studentName?: string;
  studentClass?: string;
  schoolName?: string;
  studentPhoto?: string | null;
  isActive?: boolean;
  enrolledClasses?: any[];
  selectedSubject?: string;
  onSelectSubjectClass?: (classId: string, subjectName: string) => void;
}

export default function ClassroomSidebar({
  isOpen,
  activeView,
  onSelectView,
  onOpenSettings,
  onOpenProfile,
  todoCount,
  studentName = "Siswa",
  studentClass = "Kelas 8",
  schoolName = "SMK Muhammadiyah 1",
  studentPhoto,
  isActive = true,
  enrolledClasses = [],
  selectedSubject = "Matematika",
  onSelectSubjectClass,
}: ClassroomSidebarProps) {
  const [isStudyRoomOpen, setIsStudyRoomOpen] = useState(true);
  const [isStudentActive, setIsStudentActive] = useState<boolean>(isActive);
  const { t } = useLanguage();

  if (!isOpen) return null;

  const rawName = studentName && studentName.trim() !== "" ? studentName.trim() : "Siswa Thinksy";
  const displayStudentName = rawName
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  const initials = displayStudentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <aside className="fixed top-16 left-0 bottom-0 z-30 w-68 sm:w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between select-none shadow-lg md:shadow-none animate-in fade-in slide-in-from-left-4 duration-200">
      {/* 1. SCROLLABLE NAVIGATION ITEMS */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-5">
        {/* =================================================================== */}
        {/* SECTION 1: BERANDA                                                  */}
        {/* =================================================================== */}
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t.berandaSection || "BERANDA"}
          </div>
          {/* Tab sedikit menjorok (Level 1 Indent) */}
          <div className="space-y-1 pl-2.5">
            {/* Dashboard Siswa (Home) */}
            <button
              onClick={() => onSelectView("home")}
              className={`w-full py-2 px-3 flex items-center gap-3 text-xs rounded-xl transition-all cursor-pointer ${
                activeView === "home"
                  ? "bg-[#4C75F2] text-white shadow-xs font-semibold"
                  : "text-slate-600 hover:bg-slate-100 font-medium"
              }`}
            >
              <GraduationCap
                className={`w-4 h-4 shrink-0 ${
                  activeView === "home" ? "text-white" : "text-blue-600"
                }`}
              />
              <span className="truncate">{t.studentDashboard || "Dashboard Siswa"}</span>
            </button>

            {/* Agenda Akademik */}
            <button
              onClick={() => onSelectView("calendar")}
              className={`w-full py-2 px-3 flex items-center gap-3 text-xs rounded-xl transition-all cursor-pointer ${
                activeView === "calendar"
                  ? "bg-[#4C75F2] text-white shadow-xs font-semibold"
                  : "text-slate-600 hover:bg-slate-100 font-medium"
              }`}
            >
              <Calendar
                className={`w-4 h-4 shrink-0 ${
                  activeView === "calendar" ? "text-white" : "text-slate-500"
                }`}
              />
              <span className="truncate">{t.calendar}</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SECTION 2: RUANG BELAJAR / STUDY ROOM                               */}
        {/* =================================================================== */}
        <div>
          <button
            type="button"
            onClick={() => setIsStudyRoomOpen(!isStudyRoomOpen)}
            className="w-full px-3 pb-1.5 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition cursor-pointer"
          >
            <span>{t.studyRoom || "RUANG BELAJAR"}</span>
            {isStudyRoomOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {isStudyRoomOpen && (
            /* Tab LEBIH menjorok (Level 2 Indent dengan border pemandu hierarki) */
            <div className="border-l-2 border-slate-100 dark:border-slate-800 ml-4 pl-2 space-y-1">
              {/* Assignments & Tasks (Tugas & Ujian) */}
              <button
                onClick={() => onSelectView("todo")}
                className={`w-full py-2 px-3 flex items-center justify-between text-xs rounded-xl transition-all cursor-pointer ${
                  activeView === "todo"
                    ? "bg-[#4C75F2] text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ClipboardCheck
                    className={`w-4 h-4 shrink-0 ${
                      activeView === "todo" ? "text-white" : "text-slate-500"
                    }`}
                  />
                  <span className="truncate">{t.todo}</span>
                </div>
                {typeof todoCount === "number" && todoCount > 0 ? (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                      activeView === "todo"
                        ? "bg-white text-[#4C75F2]"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {todoCount}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-100 text-sky-700">
                    Baru
                  </span>
                )}
              </button>

              {/* Dynamic Enrolled Classes List (Matematika, IPA, dll.) */}
              {(() => {
                const displayList = Array.isArray(enrolledClasses) ? enrolledClasses : [];
                if (displayList.length === 0) {
                  return (
                    <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                      Belum ada kelas aktif
                    </div>
                  );
                }

                return displayList.map((cls: any, idx: number) => {
                  const isIpa =
                    (cls.nama_kelas || "").toLowerCase().includes("ipa") ||
                    (cls.mata_pelajaran || "").toLowerCase().includes("ipa");
                  const subjectKey = isIpa ? "IPA" : "Matematika";
                  const isSelected =
                    activeView === "matematika" &&
                    (isIpa ? selectedSubject === "IPA" : selectedSubject !== "IPA");

                  const badgeLetter = isIpa ? "I" : "M";
                  const badgeBg = isIpa
                    ? isSelected
                      ? "bg-white text-emerald-600"
                      : "bg-emerald-600 text-white"
                    : isSelected
                    ? "bg-white text-[#4C75F2]"
                    : "bg-blue-600 text-white";

                  const tagBg = isIpa
                    ? isSelected
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-700"
                    : isSelected
                    ? "bg-white/20 text-white"
                    : "bg-blue-100 text-blue-700";

                  const title = cls.nama_kelas || (isIpa ? "IPA (Ilmu Pengetahuan Alam)" : t.mathGrade8);

                  return (
                    <button
                      key={cls.id || idx}
                      onClick={() => {
                        if (onSelectSubjectClass) {
                          onSelectSubjectClass(cls.id, subjectKey);
                        } else {
                          onSelectView("matematika");
                        }
                      }}
                      className={`w-full py-2 px-3 flex items-center justify-between text-xs rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? isIpa
                            ? "bg-emerald-600 text-white shadow-xs font-semibold"
                            : "bg-[#4C75F2] text-white shadow-xs font-semibold"
                          : "text-slate-600 hover:bg-slate-100 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${badgeBg}`}
                        >
                          {badgeLetter}
                        </div>
                        <span className="truncate text-xs">
                          {title}
                        </span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${tagBg}`}
                      >
                        {isIpa ? "Lab Sains" : "Fase D"}
                      </span>
                    </button>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* SECTION 3: PROFIL SISWA (PENGATURAN DETAIL SEMENTARA DIHILANGKAN)   */}
        {/* =================================================================== */}
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t.myProfile || "PROFIL SISWA"}
          </div>
          {/* Tab sedikit menjorok (Level 1 Indent) */}
          <div className="space-y-1 pl-2.5">
            {/* Profil Saya */}
            <button
              onClick={() => {
                onSelectView("profil");
              }}
              className={`w-full py-2.5 px-3 flex items-center gap-3 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeView === "profil"
                  ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <UserCircle
                className={`w-4 h-4 shrink-0 ${
                  activeView === "profil" ? "text-white" : "text-slate-500"
                }`}
              />
              <span className="truncate">{t.myProfile || "Profil Saya"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SECTION 4: PROFILE SISWA + KELAS + KONDISI AKTIF (PALING BAWAH)     */}
      {/* =================================================================== */}
      <div className="p-3 border-t border-slate-200/90 bg-slate-50/70">
        <div
          onClick={() => {
            onSelectView("profil");
          }}
          className={`p-2 rounded-xl flex items-center gap-3 border transition-all cursor-pointer group ${
            activeView === "profil"
              ? "bg-white border-blue-300 shadow-xs ring-1 ring-blue-500/20"
              : "border-transparent hover:bg-white hover:border-slate-200/80"
          }`}
          title="Buka Halaman Profil Saya"
        >
          {/* Avatar Siswa */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 border-2 border-white shadow-2xs flex items-center justify-center">
              {studentPhoto ? (
                <img
                  src={studentPhoto}
                  alt={displayStudentName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-bold text-xs text-blue-700">
                  {initials}
                </span>
              )}
            </div>
            {/* Pin Indikator Status Aktif */}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                isStudentActive ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
          </div>

          {/* Info Siswa & Status Keaktifan */}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {displayStudentName}
            </div>
            <div className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
              {studentClass} • {schoolName}
            </div>

            {/* Badge Kondisi Aktif / Tidak */}
            <div className="flex items-center gap-1.5 mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsStudentActive(!isStudentActive);
                }}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                  isStudentActive
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
                title="Klik untuk mengubah kondisi status keaktifan"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isStudentActive
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-slate-400"
                  }`}
                />
                <span>
                  {isStudentActive
                    ? t.statusActive || "Aktif"
                    : t.statusInactive || "Tidak Aktif"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
