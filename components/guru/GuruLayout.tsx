"use client";

import { useState } from "react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

        {/* Desktop Spacer untuk Fixed Sidebar */}
        {isSidebarOpen && (
          <div
            className="w-68 sm:w-72 shrink-0 hidden md:block pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Mobile Backdrop Overlay */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 top-16 bg-black/40 z-20 md:hidden backdrop-blur-xs transition-opacity cursor-pointer"
            aria-hidden="true"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 pb-24 max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {/* Floating Guru Speed Dial */}
      <FloatingGuruSpeedDial />
    </div>
  );
}
