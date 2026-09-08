"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Camera,
  Loader2,
  Bell,
  X,
  Shield,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Gamepad2,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { NotificationItem, SekolahData } from "../../types";
import MathMiniGameModal from "@/components/game/MathMiniGameModal";

interface StudentNavbarProps {
  isDarkMode: boolean;
  sekolahData?: SekolahData | null;
  activeTab: "Belajar" | "Ruang Belajar" | "Peringkat" | "Pencapaian";
  setActiveTab: (tab: "Belajar" | "Ruang Belajar" | "Peringkat" | "Pencapaian") => void;
  isCheckedIn: boolean;
  checkInStatus: string | null;
  checkInTime: string | null;
  isPresensiClosed: () => boolean;
  onStartAttendance: () => void;
  isSubmittingAttendance?: boolean;
  notifications: NotificationItem[];
  onMarkAllNotificationsAsRead: () => void;
  studentName: string;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenProfile: () => void;
}

export default function StudentNavbar({
  isDarkMode,
  sekolahData,
  activeTab,
  setActiveTab,
  isCheckedIn,
  checkInStatus,
  checkInTime,
  isPresensiClosed,
  onStartAttendance,
  isSubmittingAttendance = false,
  notifications,
  onMarkAllNotificationsAsRead,
  studentName,
  onOpenSettings,
  onOpenHelp,
  onOpenProfile,
}: StudentNavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMathGameOpen, setIsMathGameOpen] = useState(false);

  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const closed = isPresensiClosed();

  return (
    <>
      <header className="sticky top-3 sm:top-5 z-40 w-full px-3 sm:px-6 pointer-events-none transition-all duration-300">
        <div
          className={`mx-auto max-w-7xl flex items-center justify-between px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full border backdrop-blur-xl shadow-lg sm:shadow-xl pointer-events-auto transition-all duration-300 ${
            isDarkMode
              ? "bg-slate-900/95 border-slate-700/80 text-white shadow-slate-950/40"
              : "bg-white/95 border-slate-200/90 text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)] hover:shadow-[0_16px_36px_rgba(15,23,42,0.12)] hover:border-slate-300 ring-1 ring-slate-900/5"
          }`}
        >
          {/* Left: Brand Vector Logo & Nav Tabs */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group shrink-0">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden shadow-xs border border-slate-200 group-hover:scale-105 transition-transform duration-200 bg-white flex items-center justify-center p-1 shrink-0">
                <img
                  src="/logo.png"
                  alt="THINKSY Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-black text-base sm:text-lg tracking-tight font-sans text-[#0F172A] hidden md:inline">
                THINKSY
              </span>
            </Link>

            {/* Navigation Tabs */}
            <nav className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
              {(
                ["Belajar", "Ruang Belajar", "Peringkat", "Pencapaian"] as const
              ).map((tab) => {
                const isDisabled = !sekolahData && tab !== "Belajar";
                return (
                  <button
                    key={tab}
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) {
                        setActiveTab(tab);
                      }
                    }}
                    title={
                      isDisabled
                        ? "Fitur dibatasi - Akun belum terhubung ke sekolah"
                        : undefined
                    }
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1 ${
                      isDisabled
                        ? "opacity-40 cursor-not-allowed text-slate-400 bg-slate-100/50"
                        : activeTab === tab
                        ? "bg-[#0F172A] text-white shadow-xs font-extrabold cursor-pointer scale-100"
                        : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-100/80 cursor-pointer"
                    }`}
                  >
                    <span>{tab}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Math Quick Game Trigger Button */}
            <button
              onClick={() => setIsMathGameOpen(true)}
              title="Mini Game Matematika: Math Blitz (Asah Otak Cepat)"
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full border border-amber-300/80 bg-linear-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 text-xs font-bold shadow-2xs transition-all duration-200 cursor-pointer group active:scale-95"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-amber-600 group-hover:rotate-12 transition-transform shrink-0" />
              <span className="hidden sm:inline font-extrabold">Math Game</span>
            </button>

            {/* Presensi Button in Navbar */}
            <div className="relative">
              {isCheckedIn ? (
                <div
                  title={`Presensi hari ini telah dicatat (${
                    checkInStatus || "Hadir"
                  }) pada pukul ${checkInTime || "08.00"} WIB`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-2xs border ${
                    checkInStatus?.includes("Terlambat")
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      checkInStatus?.includes("Terlambat")
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {checkInStatus?.includes("Terlambat") ? "Terlambat" : "Hadir"}{" "}
                    ({checkInTime || "08.00"})
                  </span>
                  <span className="sm:hidden">
                    {checkInStatus?.includes("Terlambat") ? "Terlambat" : "Hadir"}
                  </span>
                </div>
              ) : (
                <button
                  onClick={onStartAttendance}
                  disabled={isSubmittingAttendance}
                  title={
                    closed
                      ? "Batas waktu presensi (>08.00 WIB) telah berakhir"
                      : "Verifikasi presensi kehadiran hari ini dengan AI Liveness"
                  }
                  className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full border text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 ${
                    closed
                      ? "bg-rose-50/70 border-rose-200 text-rose-700 hover:bg-rose-100/80"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-[#0F172A]"
                  }`}
                >
                  {isSubmittingAttendance ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : closed ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span className="hidden sm:inline">
                    {closed ? "Presensi (Ditutup)" : "Presensi"}
                  </span>
                  <span className="sm:hidden">Presensi</span>
                </button>
              )}
            </div>

            {/* Real-Time Notification Bell Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsDropdownOpen(false);
                }}
                aria-label="Notifikasi"
                className="relative p-2 sm:p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-[#0F172A] shadow-2xs transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notifications.some((n) => !n.dibaca) && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-extrabold ring-2 ring-white animate-pulse">
                    {notifications.filter((n) => !n.dibaca).length}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popup */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl saas-modal border border-slate-200 p-4 z-50 shadow-2xl animate-in fade-in duration-150 bg-white text-slate-900">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <span className="font-extrabold text-sm text-[#0F172A]">
                        Log Notifikasi User
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {notifications.some((n) => !n.dibaca) && (
                        <button
                          onClick={onMarkAllNotificationsAsRead}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                        >
                          Tandai Dibaca
                        </button>
                      )}
                      <button
                        onClick={() => setIsNotificationOpen(false)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Belum ada notifikasi.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-xl border space-y-1 transition ${
                            notif.dibaca
                              ? "bg-slate-50/70 border-slate-200/60 opacity-80"
                              : "bg-blue-50/50 border-blue-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                              {!notif.dibaca && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                              )}
                              <span>{notif.title}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-snug">
                            {notif.desc}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsNotificationOpen(false);
                }}
                className="flex items-center space-x-2 focus:outline-none cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-slate-200 group-hover:scale-105 transition-transform duration-200 overflow-hidden">
                  {initials}
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl saas-modal border border-slate-200 p-3 z-50 shadow-2xl animate-in fade-in duration-150 bg-white text-slate-900">
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 mb-2">
                    <div className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                      Nama Akun:
                    </div>
                    <div className="text-sm font-extrabold text-[#0F172A] truncate">
                      {studentName}
                    </div>
                    <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <Shield className="w-3 h-3 text-emerald-600" />
                      <span>Siswa</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        onOpenSettings();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 hover:text-[#0F172A] rounded-xl transition cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-slate-700" />
                      <span>Pengaturan Akun</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenHelp();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 hover:text-[#0F172A] rounded-xl transition cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-700" />
                      <span>Pusat Bantuan</span>
                    </button>

                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Log Out</span>
                      </button>
                    </form>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => {
                        onOpenProfile();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>View Profile Card</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Lightweight Math Mini Game Modal */}
      <MathMiniGameModal
        isOpen={isMathGameOpen}
        onClose={() => setIsMathGameOpen(false)}
      />
    </>
  );
}
