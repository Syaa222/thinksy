"use client";

import { useState, useEffect } from "react";
import GuruClassroomTopBar from "@/components/guru/classroom/GuruClassroomTopBar";
import GuruClassroomSidebar, {
  GuruClassroomViewMode,
  SidebarClassItem,
} from "@/components/guru/classroom/GuruClassroomSidebar";
import FloatingGuruSpeedDial from "@/components/guru/FloatingGuruSpeedDial";

export type GuruNavView =
  | "beranda"
  | "home"
  | "calendar"
  | "kelola_siswa"
  | "presensi"
  | "ujian"
  | "to_review"
  | "rekapan"
  | "matematika"
  | "manajemen_siswa"
  | "manajemen_kelas"
  | "pengelolaan"
  | "pengaturan"
  | string;

interface GuruLayoutProps {
  children: React.ReactNode;
  userProfile?: {
    nama_lengkap: string;
    email: string;
    peran: string;
  };
  activeView?: GuruNavView;
  onViewChange?: (view: GuruNavView) => void;
  classes?: SidebarClassItem[];
}

export default function GuruLayout({
  children,
  userProfile,
  activeView,
  classes,
}: GuruLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Di layar desktop/laptop (>= 1024px), buka sidebar secara default
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* 1. Header Konsisten Identik dengan Dashboard Guru */}
      <GuruClassroomTopBar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        teacherName={userProfile?.nama_lengkap || "Ibu Siti Rahmawati, M.Pd."}
        teacherEmail={userProfile?.email || "siti.rahmawati@sekolah.sch.id"}
      />

      {/* 2. Container dengan Navbar Kiri Konsisten Sesuai Gambar */}
      <div className="flex pt-16 min-h-screen">
        <GuruClassroomSidebar
          isOpen={isSidebarOpen}
          activeView={activeView as GuruClassroomViewMode}
          classes={classes}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Desktop Spacer untuk Fixed Sidebar (Laptop & PC >= 1024px) */}
        {isSidebarOpen && (
          <div
            className="w-68 sm:w-72 shrink-0 hidden lg:block pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Mobile & Tablet Backdrop Overlay (< 1024px: HP & iPad portrait) */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 top-16 bg-black/40 z-20 lg:hidden backdrop-blur-xs transition-opacity cursor-pointer"
            aria-hidden="true"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 pb-24 max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {/* Floating Guru Speed Dial */}
      <FloatingGuruSpeedDial />
    </div>
  );
}
