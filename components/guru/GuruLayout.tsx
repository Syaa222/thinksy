"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainCircuit,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Users,
  FileText,
  Bot,
  CheckSquare,
  X,
  Shield,
  HelpCircle,
  ChevronDown,
  Wifi,
  Save,
  CheckCircle2,
  Key,
  Sliders,
  Menu,
  GraduationCap,
  Clock,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import FloatingGuruSpeedDial from "@/components/guru/FloatingGuruSpeedDial";

interface GuruLayoutProps {
  children: React.ReactNode;
  userProfile?: {
    nama_lengkap: string;
    email: string;
    peran: string;
  };
}

export default function GuruLayout({ children, userProfile }: GuruLayoutProps) {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Settings Modal Form State
  const [settingsNama, setSettingsNama] = useState(userProfile?.nama_lengkap || "Ibu Siti Rahmawati, M.Pd.");
  const [settingsEmail, setSettingsEmail] = useState(userProfile?.email || "siti.rahmawati@sekolah.sch.id");
  const [settingsMapel, setSettingsMapel] = useState("Matematika SMP Kelas 8");
  const [settingsNip, setSettingsNip] = useState("198511232010122001");
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"profil" | "ai" | "notif" | "keamanan">("profil");

  useEffect(() => {
    async function fetchLoggedUser() {
      if (!userProfile) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profil } = await supabase
              .from("profil")
              .select("nama_lengkap, email, peran")
              .eq("id", user.id)
              .single();
            if (profil) {
              setSettingsNama(profil.nama_lengkap || user.email?.split("@")[0] || "Pengajar");
              setSettingsEmail(profil.email || user.email || "");
            }
          }
        } catch {
          // ignore
        }
      }
    }
    fetchLoggedUser();
  }, [userProfile]);

  const teacherName = settingsNama;
  const teacherRole = userProfile?.peran === "superadmin" ? "Administrator" : "Guru Matematika";

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Esai Baru Memerlukan Penilaian",
      desc: "5 esai dari Kelas 8A telah dikirim dan menunggu validasi Anda.",
      time: "5 menit yang lalu",
    },
    {
      id: 2,
      title: "Draft Soal AI Siap Ditinjau",
      desc: "Gemini AI telah menghasilkan 12 set soal Eksplorasi Aljabar Baru.",
      time: "25 menit yang lalu",
    },
    {
      id: 3,
      title: "Laporan Kehadiran Kelas 8B",
      desc: "Presensi 30 siswa Kelas 8B telah diverifikasi otomatis.",
      time: "2 jam yang lalu",
    },
  ]);

  // Real-time listener across dashboards
  const { isConnected } = useRealtimeDashboard((event) => {
    if (event.type === "NEW_ESSAY_SUBMISSION") {
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: "Siswa Mengirimkan Jawaban Esai",
          desc: "Jawaban esai baru telah masuk ke antrean penilaian Anda.",
          time: "Baru saja",
        },
        ...prev,
      ]);
    } else if (event.type === "ATTENDANCE_CHECKIN") {
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: "Presensi Selfie Siswa Berhasil",
          desc: `${event.payload?.studentName || "Siswa"} telah mengirimkan presensi selfie pada pukul ${event.payload?.time || "sekarang"}.`,
          time: "Baru saja",
        },
        ...prev,
      ]);
    } else if (event.type === "ATTENDANCE_VERIFIED") {
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: "Absensi Kelas Terverifikasi",
          desc: "Status presensi kehadiran siswa telah diverifikasi resmi.",
          time: "Baru saja",
        },
        ...prev,
      ]);
    } else if (event.type === "NOTIFICATION_RECEIVED") {
      if (event.payload?.judul) {
        setNotifications((prev) => [
          {
            id: Date.now(),
            title: event.payload.judul,
            desc: event.payload.pesan || "Notifikasi sistem baru diterima.",
            time: "Baru saja",
          },
          ...prev,
        ]);
      }
    } else if (event.type === "CLASS_CREATED") {
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: "Kelas Baru Ditambahkan oleh Admin",
          desc: `Kelas ${event.payload?.nama_kelas || "Baru"} telah dialokasikan.`,
          time: "Baru saja",
        },
        ...prev,
      ]);
    }
  });

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profil").update({
          nama_lengkap: settingsNama,
          email: settingsEmail,
        }).eq("id", user.id);
      }
    } catch {
      // ignore
    }
    setSettingsSavedSuccess(true);
    setTimeout(() => {
      setSettingsSavedSuccess(false);
      setIsSettingsModalOpen(false);
    }, 2000);
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/guru",
      icon: LayoutDashboard,
      active: pathname === "/guru",
    },
    {
      label: "Manajemen Kelas",
      href: "/guru/siswa",
      icon: Users,
      active: pathname.startsWith("/guru/siswa"),
    },
    {
      label: "Ujian & Asesmen",
      href: "/guru/ujian",
      icon: Clock,
      active: pathname.startsWith("/guru/ujian"),
    },
    {
      label: "Bank Soal Manual",
      href: "/guru/soal/latihan",
      icon: FileText,
      active: pathname.startsWith("/guru/soal/latihan"),
    },
    {
      label: "Kurasi Soal AI",
      href: "/guru/soal/eksplorasi",
      icon: Bot,
      active: pathname.startsWith("/guru/soal/eksplorasi"),
    },
    {
      label: "Penilaian Esai",
      href: "/guru/penilaian",
      icon: CheckSquare,
      active: pathname.startsWith("/guru/penilaian"),
    },
    {
      label: "Penilaian Siswa",
      href: "/guru/penilaian-siswa",
      icon: GraduationCap,
      active: pathname.startsWith("/guru/penilaian-siswa"),
    },
    {
      label: "Pengaturan",
      href: "#pengaturan",
      onClick: () => {
        setIsSettingsModalOpen(true);
        setIsMobileMenuOpen(false);
      },
      icon: Settings,
      active: isSettingsModalOpen,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* MOBILE BACKDROP DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs transition duration-200"
        />
      )}

      {/* 1. SIDEBAR NAV (THINKSY BRANDING & PALETTE) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white p-5 flex flex-col justify-between shrink-0 shadow-xs transition-transform duration-200 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Logo THINKSY + Panel Guru & Close Mobile Button */}
          <div className="flex items-center justify-between">
            <Link href="/guru" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl overflow-hidden shadow-xs border border-slate-200 group-hover:scale-105 transition duration-200 bg-white flex items-center justify-center p-0.5">
                <img src="/logo.png" alt="THINKSY Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-[#0F172A]">
                  THINKSY
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full w-fit">
                    Panel Guru
                  </div>
                  {isConnected && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                      <Wifi className="w-2.5 h-2.5 text-emerald-600 animate-pulse" /> Live
                    </span>
                  )}
                </div>
              </div>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items (ALL CLICKABLE & WORKING) */}
          <nav className="space-y-1.5 text-xs font-bold text-slate-600">
            {navItems.map((item) => {
              const IconComp = item.icon;
              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-3 transition cursor-pointer text-left ${
                      item.active
                        ? "bg-[#0F172A] text-white shadow-xs"
                        : "hover:bg-slate-100 hover:text-[#0F172A]"
                    }`}
                  >
                    <IconComp className={`w-4 h-4 ${item.active ? "text-amber-400" : "text-slate-500"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-3 transition cursor-pointer ${
                    item.active
                      ? "bg-[#0F172A] text-white shadow-xs"
                      : "hover:bg-slate-100 hover:text-[#0F172A]"
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${item.active ? "text-amber-400" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <form action={logoutAction} className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 text-xs font-extrabold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-2.5 px-4 rounded-xl transition cursor-pointer border border-red-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </form>
      </aside>

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer shrink-0"
            aria-label="Buka Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search Input */}
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari materi, soal, atau siswa..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/80 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F172A] transition"
            />
          </div>

          {/* Right Header Icons & Profile */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                aria-label="Notifikasi"
                className="relative p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-[#0F172A] hover:bg-slate-200 shadow-xs transition cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
              </button>

              {/* Notification Drawer */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-white border border-slate-200 p-4 z-50 shadow-2xl animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <span className="font-extrabold text-xs text-[#0F172A]">
                        Notifikasi Real-Time
                      </span>
                    </div>
                    <button
                      onClick={() => setIsNotificationOpen(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0F172A]">
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">
                          {notif.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2.5 focus:outline-none cursor-pointer group p-1 rounded-xl hover:bg-slate-100 transition"
              >
                <div className="w-8 h-8 rounded-xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-slate-700 group-hover:scale-105 transition duration-200">
                  {teacherName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-extrabold text-[#0F172A] leading-tight">
                    {teacherName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">
                    {teacherRole}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white border border-slate-200 p-3 z-50 shadow-2xl animate-in fade-in duration-150">
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 mb-2">
                    <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Akun Pengajar:
                    </div>
                    <div className="text-xs font-extrabold text-[#0F172A] truncate">
                      {teacherName}
                    </div>
                    <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      <Shield className="w-3 h-3 text-blue-600" />
                      <span>{teacherRole}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsSettingsModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#0F172A] rounded-xl transition cursor-pointer text-left"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Pengaturan Akun</span>
                    </button>

                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Keluar Akun</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-8 space-y-6">
          {children}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL PENGATURAN PROFIL & AKUN GURU (MENU PENGATURAN)     */}
      {/* ======================================================== */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-amber-400 flex items-center justify-center shrink-0">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-[#0F172A] text-lg">Pengaturan Profil & Sistem Guru</h2>
                  <p className="text-xs text-slate-500 font-medium">Kelola informasi akun pengajar, preferensi AI Sokratik, dan notifikasi</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Bar */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setActiveSettingsTab("profil")}
                className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer text-center ${
                  activeSettingsTab === "profil" ? "bg-[#0F172A] text-white shadow-xs" : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Profil Guru
              </button>
              <button
                onClick={() => setActiveSettingsTab("ai")}
                className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer text-center ${
                  activeSettingsTab === "ai" ? "bg-[#0F172A] text-white shadow-xs" : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Preferensi AI
              </button>
              <button
                onClick={() => setActiveSettingsTab("notif")}
                className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer text-center ${
                  activeSettingsTab === "notif" ? "bg-[#0F172A] text-white shadow-xs" : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Notifikasi
              </button>
              <button
                onClick={() => setActiveSettingsTab("keamanan")}
                className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer text-center ${
                  activeSettingsTab === "keamanan" ? "bg-[#0F172A] text-white shadow-xs" : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Keamanan
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSettings} className="space-y-5">
              {activeSettingsTab === "profil" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                        Nama Lengkap & Gelar
                      </label>
                      <input
                        type="text"
                        value={settingsNama}
                        onChange={(e) => setSettingsNama(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                        Email Utama
                      </label>
                      <input
                        type="email"
                        value={settingsEmail}
                        onChange={(e) => setSettingsEmail(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                        Mata Pelajaran & Tingkat
                      </label>
                      <input
                        type="text"
                        value={settingsMapel}
                        onChange={(e) => setSettingsMapel(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                        NIP / NUPTK
                      </label>
                      <input
                        type="text"
                        value={settingsNip}
                        onChange={(e) => setSettingsNip(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === "ai" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="text-xs font-extrabold text-amber-900 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-amber-600" /> Preferensi AI Sokratik Tutor (Gemini AI)
                    </div>
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      AI Sokratik akan memandu siswa berdasarkan gaya pembimbingan yang Anda tentukan di bawah ini.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Gaya Pembimbingan Sokratik
                    </label>
                    <select className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none">
                      <option>Fun, Ramah & Bertahap (Default)</option>
                      <option>Tegas & Berfokus pada Pembuktian</option>
                      <option>Eksploratif & Bebas Tantangan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Target Tingkat Kesulitan Auto-Generate Soal AI
                    </label>
                    <select className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none">
                      <option>Seimbang (Mudah 30%, Sedang 50%, Sulit 20%)</option>
                      <option>Tinggi (HOTS / AKM Matematika)</option>
                      <option>Dasar (Penguatan Konsep Awal)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeSettingsTab === "notif" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-[#0F172A]">Email Notifikasi Esai Baru</div>
                      <div className="text-[11px] text-slate-500">Kirim email saat siswa mengirimkan jawaban esai</div>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0F172A] cursor-pointer" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-[#0F172A]">Laporan Ringkasan Presensi Harian</div>
                      <div className="text-[11px] text-slate-500">Terima ringkasan selfie presensi setiap pukul 08.00 WIB</div>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0F172A] cursor-pointer" />
                  </div>
                </div>
              )}

              {activeSettingsTab === "keamanan" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      placeholder="Masukkan kata sandi baru (min. 8 karakter)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      placeholder="Ulangi kata sandi baru"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {settingsSavedSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center gap-2 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pengaturan akun berhasil disimpan!</span>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Simpan Pengaturan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING SPEED DIAL (+ / X) MENU WIDGET */}
      <FloatingGuruSpeedDial />
    </div>
  );
}
