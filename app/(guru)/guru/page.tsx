"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GuruClassroomTopBar from "@/components/guru/classroom/GuruClassroomTopBar";
import GuruClassroomSidebar, {
  GuruClassroomViewMode,
} from "@/components/guru/classroom/GuruClassroomSidebar";
import ManagementKelasTabScreen from "@/components/guru/ManagementKelasTabScreen";
import GuruClassroomHomeView from "@/components/guru/classroom/GuruClassroomHomeView";
import GuruClassroomToReviewView from "@/components/guru/classroom/GuruClassroomToReviewView";
import GuruClassroomCalendarView from "@/components/guru/classroom/GuruClassroomCalendarView";
import GuruClassroomArchivedView from "@/components/guru/classroom/GuruClassroomArchivedView";
import GuruClassroomPresensiView from "@/components/guru/classroom/GuruClassroomPresensiView";
import CreateClassModal, {
  NewClassData,
} from "@/components/guru/classroom/CreateClassModal";
import { notifyClassUpdated } from "@/lib/classroom-sync";
import {
  Settings,
  Check,
} from "lucide-react";

// Default Kelas Pengampu Guru (Hanya Matematika Kelas 8)
const DEFAULT_GURU_CLASSES = [
  {
    id: "mat-8",
    name: "Matematika (Kelas 8)",
    mapel: "Matematika",
    section: "Fase D • Kurikulum Merdeka",
    room: "Ruang 8-A",
    subjectCode: "mtk8xpk",
    themeColor: "#1967D2",
    bgGradient: "from-blue-700 via-indigo-700 to-slate-900",
    bannerType: "illustration",
    bannerIllustration: "math",
    studentCount: 32,
    description:
      "Bab 1: Bilangan Berpangkat & Teorema Pythagoras. Pembelajaran aktif dengan AI Sokratik.",
  },
];

export default function GuruDashboardPage() {
  // State Kelas yang diampu oleh Guru (tersimpan di localStorage, hanya kelas asli yang diampu)
  const [classes, setClasses] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("thinksy_guru_classes");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Hapus kelas ipa-8 dan bin-8 yang sempat tertambah otomatis
            const filtered = parsed.filter(
              (c: any) => c.id !== "ipa-8" && c.id !== "bin-8"
            );
            if (filtered.length > 0) return filtered;
          }
        }
      } catch {}
    }
    return DEFAULT_GURU_CLASSES;
  });

  // Bersihkan data lama ipa-8 dan bin-8 di localStorage browser
  useEffect(() => {
    try {
      const stored = localStorage.getItem("thinksy_guru_classes");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (c: any) => c.id !== "ipa-8" && c.id !== "bin-8"
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem("thinksy_guru_classes", JSON.stringify(cleaned));
            setClasses(cleaned);
          }
        }
      }
    } catch {}
  }, []);

  const [activeClassId, setActiveClassId] = useState<string>("mat-8");
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // State Kelas yang diarsipkan (tersimpan di localStorage)
  const [archivedClassIds, setArchivedClassIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("thinksy_archived_classes");
        return stored ? JSON.parse(stored) : [];
      } catch {}
    }
    return [];
  });

  const handleArchiveClass = (classId: string) => {
    setArchivedClassIds((prev) => {
      const updated = Array.from(new Set([...prev, classId]));
      try {
        localStorage.setItem("thinksy_archived_classes", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSuccessToast("Kelas berhasil dipindahkan ke Arsip Kelas (Archived classes).");
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleRestoreClass = (classId: string) => {
    setArchivedClassIds((prev) => {
      const updated = prev.filter((id) => id !== classId);
      try {
        localStorage.setItem("thinksy_archived_classes", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSuccessToast("Kelas berhasil dipulihkan ke daftar Teaching aktif.");
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleDeleteClass = (classId: string) => {
    const updatedClasses = classes.filter((c) => c.id !== classId);
    setClasses(updatedClasses);
    try {
      localStorage.setItem("thinksy_guru_classes", JSON.stringify(updatedClasses));
    } catch {}

    setArchivedClassIds((prev) => {
      const updated = prev.filter((id) => id !== classId);
      try {
        localStorage.setItem("thinksy_archived_classes", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setSuccessToast("Kelas berhasil dihapus secara permanen.");
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleUpdateClass = (updatedClass: any) => {
    setClasses((prev) => {
      const next = prev.map((c) => (c.id === updatedClass.id ? { ...c, ...updatedClass } : c));
      try {
        localStorage.setItem("thinksy_guru_classes", JSON.stringify(next));
      } catch {}
      return next;
    });
    notifyClassUpdated();
    setSuccessToast(`Banner kelas "${updatedClass.name}" berhasil diperbarui.`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const router = useRouter();

  const [activeView, setActiveView] = useState<GuruClassroomViewMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const rawTab = params.get("tab") || params.get("view");
        const classParam = params.get("class");
        if (classParam) return classParam;
        if (rawTab) {
          const tab =
            rawTab === "manajemen_siswa"
              ? "presensi"
              : rawTab === "manajemen_kelas"
              ? "home"
              : rawTab === "pengaturan"
              ? "settings"
              : rawTab;
          if (
            [
              "home",
              "calendar",
              "presensi",
              "to_review",
              "matematika",
              "archived",
              "settings",
            ].includes(tab)
          ) {
            return tab as GuruClassroomViewMode;
          }
        }
      } catch {}
    }
    return "home";
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pendingReviewCount, setPendingReviewCount] = useState<number>(2);

  // Sync tab from URL query if present (e.g. ?tab=home or ?view=presensi or ?class=...)
  useEffect(() => {
    const syncTabFromUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const rawTab = params.get("tab") || params.get("view");
        const classParam = params.get("class");
        const actionParam = params.get("action");

        if (actionParam === "create_class") {
          setIsCreateClassModalOpen(true);
        }

        if (classParam) {
          setActiveClassId(classParam === "matematika" ? "mat-8" : classParam);
          setActiveView(classParam);
          return;
        }

        if (rawTab) {
          // Direct navigation if standalone routes are hit via query params
          if (rawTab === "kelola_siswa") {
            router.push("/guru/siswa");
            return;
          }
          if (rawTab === "rekapan") {
            router.push("/guru/rekapan");
            return;
          }
          if (rawTab === "ujian") {
            router.push("/guru/ujian");
            return;
          }

          const tab = (rawTab === "manajemen_siswa"
            ? "presensi"
            : rawTab === "manajemen_kelas"
            ? "home"
            : rawTab === "pengaturan"
            ? "settings"
            : rawTab) as GuruClassroomViewMode;
          setActiveView(tab);
          if (
            tab !== "home" &&
            tab !== "calendar" &&
            tab !== "presensi" &&
            tab !== "to_review" &&
            tab !== "archived" &&
            tab !== "settings"
          ) {
            setActiveClassId(tab === "matematika" ? "mat-8" : tab);
          }
        } else {
          setActiveView("home");
        }
      } catch {}
    };

    syncTabFromUrl();

    const handleHomeNavigate = () => {
      setActiveView("home");
      try {
        window.history.pushState(null, "", "/guru");
      } catch {}
    };

    window.addEventListener("popstate", syncTabFromUrl);
    window.addEventListener("guru-navigate-home", handleHomeNavigate);

    return () => {
      window.removeEventListener("popstate", syncTabFromUrl);
      window.removeEventListener("guru-navigate-home", handleHomeNavigate);
    };
  }, [router]);

  // Simpan kelas ke localStorage saat ada perubahan
  const handleCreateClass = (newClass: NewClassData) => {
    const updated = [newClass, ...classes];
    setClasses(updated);
    setActiveClassId(newClass.id);

    try {
      localStorage.setItem("thinksy_guru_classes", JSON.stringify(updated));
      notifyClassUpdated();

      // Registrasikan token ke shared storage agar siswa langsung bisa bergabung
      const existingTokens = JSON.parse(
        localStorage.getItem("thinksy_registered_class_codes") || "{}"
      );
      existingTokens[newClass.subjectCode.toLowerCase()] = {
        id: newClass.id,
        nama_kelas: newClass.name,
        nama_guru: "Ibu Siti Rahmawati, M.Pd.",
        mata_pelajaran: newClass.mapel,
        ruang: newClass.room,
        kode_kelas: newClass.subjectCode.toLowerCase(),
        banner_color: newClass.themeColor,
        banner_pattern: "matematika",
      };
      localStorage.setItem(
        "thinksy_registered_class_codes",
        JSON.stringify(existingTokens)
      );
    } catch {}

    // Notifikasi sukses
    setSuccessToast(
      `Kelas "${newClass.name}" berhasil dibuat dengan Token: ${newClass.subjectCode.toUpperCase()}!`
    );
    setTimeout(() => setSuccessToast(null), 5000);

    // Langsung arahkan guru ke kelas baru tersebut
    handleSelectView(newClass.id);
  };

  const handleSelectView = (view: GuruClassroomViewMode) => {
    // Rute mandiri terpisah harus selalu diarahkan via router.push langsung!
    if (view === "kelola_siswa") {
      router.push("/guru/siswa");
      return;
    }
    if (view === "rekapan") {
      router.push("/guru/rekapan");
      return;
    }
    if (view === "ujian") {
      router.push("/guru/ujian");
      return;
    }

    setActiveView(view);
    if (
      view !== "home" &&
      view !== "calendar" &&
      view !== "presensi" &&
      view !== "to_review" &&
      view !== "archived" &&
      view !== "settings"
    ) {
      setActiveClassId(view === "matematika" ? "mat-8" : view);
    }
    try {
      const url = new URL(window.location.href);
      if (view === "home") {
        url.search = "";
      } else if (classes.some((c) => c.id === view)) {
        url.search = `?class=${view}`;
      } else {
        url.search = `?view=${view}`;
      }
      window.history.pushState(null, "", url.toString());
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-slate-900 font-sans transition-colors duration-200">
      {/* Toast Notifikasi Berhasil */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#041E49] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-400/30 animate-in slide-in-from-bottom duration-200">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-xs sm:text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* 1. GOOGLE CLASSROOM TOP BAR (Identik dengan Dashboard Siswa) */}
      <GuruClassroomTopBar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        teacherName="Ibu Siti Rahmawati, M.Pd."
        teacherEmail="siti.rahmawati@sekolah.sch.id"
        teacherPhoto="/images/foto-guru.jpg"
        teacherRole="Wali Kelas & Guru Matematika"
        schoolName="SMK Muhammadiyah 1"
        onOpenCreateClass={() => setIsCreateClassModalOpen(true)}
        onOpenCreateTask={() => handleSelectView(activeClassId || "mat-8")}
        onOpenHelp={() => handleSelectView("settings")}
      />

      {/* 2. BODY WITH GOOGLE CLASSROOM SIDEBAR & MAIN CANVAS */}
      <div className="flex pt-16 min-h-screen">
        {/* Left Sidebar (Menampilkan semua kelas yang diampu secara dinamis) */}
        <GuruClassroomSidebar
          isOpen={isSidebarOpen}
          activeView={activeView}
          onSelectView={handleSelectView}
          pendingReviewCount={pendingReviewCount}
          classes={classes.filter((c) => !archivedClassIds.includes(c.id))}
          onCreateClassClick={() => setIsCreateClassModalOpen(true)}
        />

        {/* Desktop Spacer for Fixed Sidebar */}
        {isSidebarOpen && (
          <div
            className="w-68 sm:w-72 shrink-0 hidden md:block pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Mobile Backdrop Overlay when Sidebar is open */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 top-16 bg-black/40 z-20 md:hidden backdrop-blur-xs transition-opacity cursor-pointer"
            aria-hidden="true"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-3 sm:px-6 pt-3.5 pb-20 max-w-7xl mx-auto">
          {activeView === "home" ? (
            <GuruClassroomHomeView
              classes={classes}
              archivedClassIds={archivedClassIds}
              onArchiveClass={handleArchiveClass}
              onViewArchived={() => handleSelectView("archived")}
              onOpenClass={(classId) => {
                setActiveClassId(classId);
                handleSelectView(classId);
              }}
              onOpenGrades={(classId) => {
                if (classId) setActiveClassId(classId);
                handleSelectView(classId || activeClassId);
              }}
              onCreateClassClick={() => setIsCreateClassModalOpen(true)}
              onUpdateClass={handleUpdateClass}
            />
          ) : activeView === "presensi" ? (
            /* Presensi & Manajemen Siswa (Normal Screen Mandiri Terpisah dari Teaching) */
            <GuruClassroomPresensiView
              onBackToTeaching={() => handleSelectView("home")}
            />
          ) : activeView === "to_review" ? (
            <GuruClassroomToReviewView
              onBackToClass={() => handleSelectView(activeClassId || "mat-8")}
              onPendingCountChange={setPendingReviewCount}
            />
          ) : activeView === "calendar" ? (
            <GuruClassroomCalendarView
              onBackToClass={() => handleSelectView(activeClassId || "mat-8")}
            />
          ) : activeView === "archived" ? (
            /* Archived Classes View */
            <GuruClassroomArchivedView
              archivedClasses={classes.filter((c) => archivedClassIds.includes(c.id))}
              onRestoreClass={handleRestoreClass}
              onDeleteClass={handleDeleteClass}
              onBackToTeaching={() => handleSelectView("home")}
            />
          ) : activeView === "settings" ? (
            /* Settings / Teacher Profile View */
            <div className="space-y-6 animate-in fade-in duration-150 max-w-2xl">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200/80">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-[#0B57D0] flex items-center justify-center font-bold">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-normal text-slate-800 font-sans tracking-tight">
                    Settings
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Pengaturan akun dan notifikasi pendidik
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-50 border-2 border-slate-200 shrink-0">
                    <img
                      src="/images/foto-guru.jpg"
                      alt="Ibu Siti Rahmawati"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Ibu Siti Rahmawati, M.Pd.
                    </h3>
                    <p className="text-xs text-slate-500">
                      Wali Kelas & Guru Matematika • SMK Muhammadiyah 1
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">
                      siti.rahmawati@sekolah.sch.id
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Notifikasi Email saat siswa mengumpulkan tugas</span>
                    <span className="font-bold text-emerald-600">Aktif</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Komentar publik di stream kelas</span>
                    <span className="font-bold text-emerald-600">Diizinkan</span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeView === "kelola_siswa" || activeView === "rekapan" || activeView === "ujian" ? (
            /* Loading redirect guard - never show ManagementKelasTabScreen as false overlay */
            <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Mengarahkan ke halaman...</span>
            </div>
          ) : (
            /* Main Classroom View with Stream, Classwork, People, Grades */
            <ManagementKelasTabScreen
              selectedClassId={activeClassId}
              customClasses={classes}
              onNavigateView={(view) => {
                if (view === "pengaturan") handleSelectView("settings");
              }}
              onUpdateClass={handleUpdateClass}
            />
          )}
        </main>
      </div>

      {/* 3. MODAL PEMBUATAN KELAS BARU & TOKEN */}
      <CreateClassModal
        isOpen={isCreateClassModalOpen}
        onClose={() => setIsCreateClassModalOpen(false)}
        onCreateClass={handleCreateClass}
      />
    </div>
  );
}
