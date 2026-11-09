"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Calendar,
  Users,
  FolderKanban,
  ChevronDown,
  ChevronUp,
  Plus,
  UserCheck,
  Layers,
  FileSpreadsheet,
} from "lucide-react";

export type GuruClassroomViewMode =
  | "home"
  | "calendar"
  | "kelola_siswa"
  | "presensi"
  | "ujian"
  | "to_review"
  | "rekapan"
  | "matematika"
  | string;

export interface SidebarClassItem {
  id: string;
  name: string;
  themeColor?: string;
  subjectCode?: string;
}

interface GuruClassroomSidebarProps {
  isOpen?: boolean;
  activeView?: GuruClassroomViewMode;
  onSelectView?: (view: GuruClassroomViewMode) => void;
  pendingReviewCount?: number;
  classes?: SidebarClassItem[];
  archivedCount?: number;
  onCreateClassClick?: () => void;
  className?: string;
  onCloseMobile?: () => void;
}

export default function GuruClassroomSidebar({
  isOpen = true,
  activeView,
  onSelectView,
  pendingReviewCount = 2,
  classes: classesProp,
  onCreateClassClick,
  onCloseMobile,
}: GuruClassroomSidebarProps) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [isTeachingOpen, setIsTeachingOpen] = useState(true);

  // Load and keep classes synced across all pages from localStorage
  const [internalClasses, setInternalClasses] = useState<SidebarClassItem[]>(() => {
    if (classesProp && classesProp.length > 0) return classesProp;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("thinksy_guru_classes");
        const archivedRaw = localStorage.getItem("thinksy_archived_classes");
        const archivedIds: string[] = archivedRaw ? JSON.parse(archivedRaw) : [];
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const active = parsed.filter((c: any) => !archivedIds.includes(c.id));
            if (active.length > 0) return active;
          }
        }
      } catch {}
    }
    return [
      { id: "mat-8", name: "Matematika (Kelas 8)", themeColor: "#1967D2" },
    ];
  });

  useEffect(() => {
    if (classesProp && classesProp.length > 0) {
      setInternalClasses(classesProp);
      return;
    }

    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem("thinksy_guru_classes");
        const archivedRaw = localStorage.getItem("thinksy_archived_classes");
        const archivedIds: string[] = archivedRaw ? JSON.parse(archivedRaw) : [];
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const active = parsed.filter((c: any) => !archivedIds.includes(c.id));
            if (active.length > 0) {
              setInternalClasses(active);
              return;
            }
          }
        }
        setInternalClasses([
          { id: "mat-8", name: "Matematika (Kelas 8)", themeColor: "#1967D2" },
        ]);
      } catch {}
    };

    loadFromStorage();
    window.addEventListener("storage", loadFromStorage);
    window.addEventListener("thinksy_guru_classes_updated", loadFromStorage);

    return () => {
      window.removeEventListener("storage", loadFromStorage);
      window.removeEventListener("thinksy_guru_classes_updated", loadFromStorage);
    };
  }, [classesProp]);

  const displayClasses = classesProp && classesProp.length > 0 ? classesProp : internalClasses;

  // Client-side query parameter inspection
  const [queryState, setQueryState] = useState<{ view: string; classId: string }>({
    view: "",
    classId: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateParams = () => {
        const sp = new URLSearchParams(window.location.search);
        setQueryState({
          view: sp.get("view") || sp.get("tab") || "",
          classId: sp.get("class") || "",
        });
      };
      updateParams();
      window.addEventListener("popstate", updateParams);
      return () => window.removeEventListener("popstate", updateParams);
    }
  }, [pathname]);

  if (!isOpen) return null;

  // Active status determinations
  const isKelolaSiswa =
    activeView === "kelola_siswa" || pathname.startsWith("/guru/siswa");
  const isUjian =
    activeView === "ujian" || pathname.startsWith("/guru/ujian");
  const isPresensi =
    activeView === "presensi" ||
    (pathname === "/guru" && (queryState.view === "presensi" || activeView === "presensi"));
  const isCalendar =
    activeView === "calendar" ||
    (pathname === "/guru" && (queryState.view === "calendar" || activeView === "calendar"));
  const isToReview =
    activeView === "to_review" ||
    (pathname === "/guru" && (queryState.view === "to_review" || activeView === "to_review"));
  const isRekapan =
    activeView === "rekapan" || pathname.startsWith("/guru/rekapan");

  const isClassSelected = (clsId: string) =>
    activeView === clsId ||
    (activeView === "matematika" && clsId === "mat-8") ||
    (pathname === "/guru" && (queryState.classId === clsId || queryState.view === clsId));

  const isAnySpecific =
    isKelolaSiswa ||
    isUjian ||
    isPresensi ||
    isCalendar ||
    isToReview ||
    isRekapan ||
    displayClasses.some((c) => isClassSelected(c.id));

  const isHome =
    activeView === "home" ||
    (!isAnySpecific && (pathname === "/guru" || pathname === "/guru/") && !queryState.view && !queryState.classId);

  const handleNavigate = (view: GuruClassroomViewMode, targetHref: string) => {
    if (onCloseMobile) onCloseMobile();

    // Rute halaman mandiri terpisah (Kelola Siswa, Rekapan, Ujian) - langsung navigasi 1 kali klik!
    const isStandaloneRoute =
      targetHref.startsWith("/guru/siswa") ||
      targetHref.startsWith("/guru/rekapan") ||
      targetHref.startsWith("/guru/ujian");

    if (isStandaloneRoute) {
      router.push(targetHref);
      return;
    }

    // Jika sedang berada di /guru dan ada handler internal onSelectView
    if (pathname === "/guru" && onSelectView) {
      onSelectView(view);
      try {
        window.history.pushState(null, "", targetHref);
      } catch {}
    } else {
      router.push(targetHref);
    }
  };

  return (
    <aside className="fixed top-16 left-0 bottom-0 w-68 sm:w-72 bg-white border-r border-slate-200/80 z-30 flex flex-col py-3 select-none overflow-y-auto">
      <div className="space-y-1">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => handleNavigate("home", "/guru")}
          className={`w-full flex items-center gap-4 px-6 py-3 rounded-r-full mr-3 text-sm font-medium transition cursor-pointer text-left ${
            isHome
              ? "bg-[#D3E3FD] text-[#041E49] font-semibold"
              : "text-[#444746] hover:bg-slate-100/80"
          }`}
        >
          <Home
            className={`w-5 h-5 shrink-0 ${
              isHome ? "text-[#041E49]" : "text-[#444746]"
            }`}
          />
          <span>Home</span>
        </button>

        {/* 2. Calendar */}
        <button
          type="button"
          onClick={() => handleNavigate("calendar", "/guru?view=calendar")}
          className={`w-full flex items-center gap-4 px-6 py-3 rounded-r-full mr-3 text-sm font-medium transition cursor-pointer text-left ${
            isCalendar
              ? "bg-[#D3E3FD] text-[#041E49] font-semibold"
              : "text-[#444746] hover:bg-slate-100/80"
          }`}
        >
          <Calendar
            className={`w-5 h-5 shrink-0 ${
              isCalendar ? "text-[#041E49]" : "text-[#444746]"
            }`}
          />
          <span>Calendar</span>
        </button>

        {/* 3. Kelola Siswa (Realtime Badge) */}
        <button
          type="button"
          onClick={() => handleNavigate("kelola_siswa", "/guru/siswa")}
          className={`w-full flex items-center justify-between px-6 py-3 rounded-r-full mr-3 text-sm font-medium transition cursor-pointer text-left ${
            isKelolaSiswa
              ? "bg-[#D3E3FD] text-[#041E49] font-semibold"
              : "text-[#444746] hover:bg-slate-100/80"
          }`}
        >
          <div className="flex items-center gap-4 min-w-0">
            <Users
              className={`w-5 h-5 shrink-0 ${
                isKelolaSiswa ? "text-[#041E49]" : "text-[#444746]"
              }`}
            />
            <span className="truncate">Kelola Siswa</span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F0FE] text-[#1967D2] shrink-0">
            Realtime
          </span>
        </button>

        {/* 4. Presensi Siswa (Harian Badge) */}
        <button
          type="button"
          onClick={() => handleNavigate("presensi", "/guru?view=presensi")}
          className={`w-full flex items-center justify-between px-6 py-3 rounded-r-full mr-3 text-sm font-medium transition cursor-pointer text-left ${
            isPresensi
              ? "bg-[#D3E3FD] text-[#041E49] font-semibold"
              : "text-[#444746] hover:bg-slate-100/80"
          }`}
        >
          <div className="flex items-center gap-4 min-w-0">
            <UserCheck
              className={`w-5 h-5 shrink-0 ${
                isPresensi ? "text-[#041E49]" : "text-[#444746]"
              }`}
            />
            <span className="truncate">Presensi Siswa</span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] shrink-0">
            Harian
          </span>
        </button>

        {/* 5. Ruang Ujian & CBT (Kelola Badge) */}
        <button
          type="button"
          onClick={() => handleNavigate("ujian", "/guru/ujian")}
          className={`w-full flex items-center justify-between px-6 py-3 rounded-r-full mr-3 text-sm font-medium transition cursor-pointer text-left ${
            isUjian
              ? "bg-[#D3E3FD] text-[#041E49] font-semibold"
              : "text-[#444746] hover:bg-slate-100/80"
          }`}
        >
          <div className="flex items-center gap-4 min-w-0">
            <Layers
              className={`w-5 h-5 shrink-0 ${
                isUjian ? "text-[#041E49]" : "text-[#444746]"
              }`}
            />
            <span className="truncate">Ruang Ujian & CBT</span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FCE8E6] text-[#C5221F] shrink-0">
            Kelola
          </span>
        </button>

        {/* 6. Teaching Section (Accordion) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsTeachingOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-6 py-3 rounded-r-full mr-3 text-sm font-medium text-[#444746] hover:bg-slate-100/80 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-4 min-w-0">
              <Users className="w-5 h-5 text-[#444746] shrink-0" />
              <span className="font-medium text-slate-800">Teaching</span>
            </div>
            {isTeachingOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
            )}
          </button>

          {/* Sub-items when Teaching is expanded */}
          {isTeachingOpen && (
            <div className="space-y-1 pt-0.5">
              {/* To review */}
              <button
                type="button"
                onClick={() => handleNavigate("to_review", "/guru?view=to_review")}
                className={`w-full flex items-center justify-between pl-12 pr-6 py-2.5 rounded-r-full mr-3 text-sm transition cursor-pointer text-left ${
                  isToReview
                    ? "bg-[#D3E3FD] text-[#041E49] font-semibold"
                    : "text-[#444746] hover:bg-slate-100/80 font-medium"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <FolderKanban
                    className={`w-5 h-5 shrink-0 ${
                      isToReview ? "text-[#041E49]" : "text-[#444746]"
                    }`}
                  />
                  <span>To review</span>
                </div>
                {typeof pendingReviewCount === "number" && pendingReviewCount > 0 && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isToReview
                        ? "bg-[#0B57D0] text-white"
                        : "bg-[#D3E3FD] text-[#041E49]"
                    }`}
                  >
                    {pendingReviewCount}
                  </span>
                )}
              </button>

              {/* Class: Matematika (Kelas 8) & Dynamic Classes */}
              {displayClasses.map((cls) => {
                const isSelected = isClassSelected(cls.id);
                const initial = cls.name.charAt(0).toUpperCase() || "M";

                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => handleNavigate(cls.id, `/guru?class=${cls.id}`)}
                    className={`w-full flex items-center gap-3.5 pl-12 pr-6 py-2.5 rounded-r-full mr-3 text-sm transition cursor-pointer text-left ${
                      isSelected
                        ? "bg-[#D3E3FD] text-[#041E49] font-semibold"
                        : "text-[#444746] hover:bg-slate-100/80 font-medium"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-xs"
                      style={{
                        backgroundColor: cls.themeColor || "#1967D2",
                      }}
                    >
                      {initial}
                    </div>
                    <span className="truncate">{cls.name}</span>
                  </button>
                );
              })}

              {/* + Buat Kelas Baru */}
              <button
                type="button"
                onClick={() => {
                  if (onCreateClassClick) {
                    onCreateClassClick();
                  } else {
                    router.push("/guru?action=create_class");
                  }
                }}
                className="w-full flex items-center gap-3 pl-12 pr-6 py-2.5 rounded-r-full mr-3 text-xs font-semibold text-[#0B57D0] hover:bg-blue-50/70 transition cursor-pointer text-left"
              >
                <Plus className="w-4 h-4 shrink-0 text-[#0B57D0]" />
                <span>Buat Kelas Baru</span>
              </button>
            </div>
          )}
        </div>

        {/* 7. Rekapan (Buku Raport & Rekap Nilai Tahunan Siswa Terintegrasi Supabase) */}
        <button
          type="button"
          onClick={() => handleNavigate("rekapan", "/guru/rekapan")}
          className={`w-full flex items-center justify-between px-6 py-3 rounded-r-full mr-3 text-sm font-medium transition cursor-pointer text-left ${
            isRekapan
              ? "bg-[#D3E3FD] text-[#041E49] font-semibold"
              : "text-[#444746] hover:bg-slate-100/80"
          }`}
        >
          <div className="flex items-center gap-4 min-w-0">
            <FileSpreadsheet
              className={`w-5 h-5 shrink-0 ${
                isRekapan ? "text-[#041E49]" : "text-[#444746]"
              }`}
            />
            <span className="truncate">Rekapan</span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
            Nilai & Absen
          </span>
        </button>
      </div>
    </aside>
  );
}
