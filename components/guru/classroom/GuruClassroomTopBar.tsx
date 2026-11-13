"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Plus,
  LayoutGrid,
  FileText,
  BookOpen,
  Layers,
  HelpCircle,
  GraduationCap,
  LogOut,
  Mail,
  User,
  CheckCircle2,
  Bell,
  Check,
  X,
  Clock,
  Loader2,
} from "lucide-react";
import LanguageToggle from "@/components/layout/LanguageToggle";
import { logoutAction } from "@/app/(auth)/actions";
import TeacherHelpModal from "@/components/guru/TeacherHelpModal";
import { useLanguage } from "@/hooks/useLanguage";
import type { UnenrollRequest } from "@/lib/unenroll-types";

function formatReqTime(isoDate?: string, lang: string = "id"): string {
  if (!isoDate) return lang === "en" ? "Just now" : "Baru saja";
  try {
    const diff = Date.now() - new Date(isoDate).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return lang === "en" ? "Just now" : "Baru saja";
    if (minutes < 60) return lang === "en" ? `${minutes}m ago` : `${minutes}m lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return lang === "en" ? `${hours}h ago` : `${hours}j lalu`;
    return lang === "en" ? "Yesterday" : "Kemarin";
  } catch {
    return lang === "en" ? "Just now" : "Baru saja";
  }
}

interface GuruClassroomTopBarProps {
  onToggleSidebar: () => void;
  teacherName?: string;
  teacherEmail?: string;
  teacherPhoto?: string | null;
  teacherRole?: string;
  schoolName?: string;
  onOpenCreateClass?: () => void;
  onOpenCreateTask?: () => void;
  onOpenHelp?: () => void;
}

export default function GuruClassroomTopBar({
  onToggleSidebar,
  teacherName = "Ibu Siti Rahmawati, M.Pd.",
  teacherEmail = "siti.rahmawati@sekolah.sch.id",
  teacherPhoto = "/images/foto-guru.jpg",
  teacherRole = "Wali Kelas & Guru Matematika",
  schoolName = "SMK Muhammadiyah 1",
  onOpenCreateClass,
  onOpenCreateTask,
  onOpenHelp,
}: GuruClassroomTopBarProps) {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Unenroll requests state
  const [unenrollRequests, setUnenrollRequests] = useState<UnenrollRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const appsMenuRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Fetch pending unenroll requests
  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/classroom/unenroll-request");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.requests)) {
          setUnenrollRequests(data.requests.filter((r: UnenrollRequest) => r.status === "pending"));
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchRequests();

    const handleReqChange = () => {
      fetchRequests();
    };

    const interval = setInterval(fetchRequests, 5000);
    window.addEventListener("thinksy_unenroll_requested", handleReqChange);
    window.addEventListener("thinksy_unenroll_canceled", handleReqChange);
    window.addEventListener("thinksy_unenroll_approved", handleReqChange);
    window.addEventListener("thinksy_unenroll_rejected", handleReqChange);
    window.addEventListener("storage", handleReqChange);
    window.addEventListener("focus", fetchRequests);

    return () => {
      clearInterval(interval);
      window.removeEventListener("thinksy_unenroll_requested", handleReqChange);
      window.removeEventListener("thinksy_unenroll_canceled", handleReqChange);
      window.removeEventListener("thinksy_unenroll_approved", handleReqChange);
      window.removeEventListener("thinksy_unenroll_rejected", handleReqChange);
      window.removeEventListener("storage", handleReqChange);
      window.removeEventListener("focus", fetchRequests);
    };
  }, []);

  const handleApprove = async (req: UnenrollRequest) => {
    setProcessingId(req.id);
    try {
      const res = await fetch("/api/classroom/unenroll-request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: req.id, action: "approve" }),
      });
      if (res.ok) {
        setUnenrollRequests((prev) => prev.filter((r) => r.id !== req.id));

        try {
          const saved = localStorage.getItem("thinksy_joined_classes") || "[]";
          const list = JSON.parse(saved);
          const filtered = list.filter((c: any) => c.id !== req.classId && c.kode_kelas !== req.classId);
          localStorage.setItem("thinksy_joined_classes", JSON.stringify(filtered));
          localStorage.setItem("thinksy_permanent_classes", JSON.stringify(filtered));

          const pending = JSON.parse(localStorage.getItem("thinksy_pending_unenroll_classes") || "[]");
          const nextPending = pending.filter((id: string) => id !== req.classId);
          localStorage.setItem("thinksy_pending_unenroll_classes", JSON.stringify(nextPending));
        } catch {}

        window.dispatchEvent(
          new CustomEvent("thinksy_unenroll_approved", {
            detail: { requestId: req.id, classId: req.classId, className: req.className },
          })
        );
        window.dispatchEvent(
          new CustomEvent("thinksy_class_left", {
            detail: { classId: req.classId, className: req.className },
          })
        );

        setFeedbackToast(
          language === "en"
            ? `Approved: ${req.studentName} has been unenrolled from ${req.className}.`
            : `Disetujui: ${req.studentName} berhasil dikeluarkan dari kelas ${req.className}.`
        );
        setTimeout(() => setFeedbackToast(null), 4000);
      }
    } catch (err) {
      console.error("Failed to approve unenroll request:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: UnenrollRequest) => {
    setProcessingId(req.id);
    try {
      const res = await fetch("/api/classroom/unenroll-request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: req.id, action: "reject" }),
      });
      if (res.ok) {
        setUnenrollRequests((prev) => prev.filter((r) => r.id !== req.id));

        try {
          const pending = JSON.parse(localStorage.getItem("thinksy_pending_unenroll_classes") || "[]");
          const nextPending = pending.filter((id: string) => id !== req.classId);
          localStorage.setItem("thinksy_pending_unenroll_classes", JSON.stringify(nextPending));

          const joinedStr = localStorage.getItem("thinksy_joined_classes");
          if (joinedStr) {
            const joined = JSON.parse(joinedStr);
            if (Array.isArray(joined)) {
              const filtered = joined.filter(
                (c: any) =>
                  c.id !== req.classId &&
                  c.kode_kelas !== req.classId &&
                  c.nama_kelas !== req.className
              );
              localStorage.setItem("thinksy_joined_classes", JSON.stringify(filtered));
              localStorage.setItem("thinksy_permanent_classes", JSON.stringify(filtered));
            }
          }

          // Broadcast cross-tab event
          localStorage.setItem(
            "thinksy_unenroll_approved_event",
            JSON.stringify({
              requestId: req.id,
              classId: req.classId,
              className: req.className,
              timestamp: Date.now(),
            })
          );
        } catch {}

        window.dispatchEvent(
          new CustomEvent("thinksy_unenroll_rejected", {
            detail: { requestId: req.id, classId: req.classId, className: req.className },
          })
        );

        setFeedbackToast(
          language === "en"
            ? `Rejected: Request for ${req.studentName} was declined.`
            : `Ditolak: Permintaan keluar kelas ${req.studentName} telah ditolak.`
        );
        setTimeout(() => setFeedbackToast(null), 4000);
      }
    } catch (err) {
      console.error("Failed to reject unenroll request:", err);
    } finally {
      setProcessingId(null);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (appsMenuRef.current && !appsMenuRef.current.contains(target)) {
        setIsAppsMenuOpen(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(target)) {
        setIsPlusMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setIsNotifMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const firstLetter = (teacherName || "G").trim().charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full h-16 bg-white border-b border-slate-200/80 px-3 sm:px-5 flex items-center justify-between select-none shadow-2xs">
      {/* LEFT: Hamburger & Classroom Brand Logo */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Hamburger Menu Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Main menu"
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* THINKSY Branding */}
        <Link
          href="/guru"
          className="flex items-center gap-2.5 hover:opacity-90 transition group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 relative shrink-0 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="THINKSY Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <span className="text-[20px] font-black text-[#0F172A] tracking-tight font-sans">
            THINKSY
          </span>
        </Link>
      </div>

      {/* RIGHT: Language Switcher, Plus (+) Dropdown, Apps (9 dots), Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">

        {/* Global Language Switcher (ID | EN) */}
        <LanguageToggle className="mx-1 shrink-0" />

        {/* Plus (+) Button Dropdown */}
        <div className="relative" ref={plusMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsPlusMenuOpen(!isPlusMenuOpen);
              setIsAppsMenuOpen(false);
              setIsProfileMenuOpen(false);
            }}
            aria-label="Create class or announcement"
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </button>

          {isPlusMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* 1. Buat Kelas Baru & Token */}
              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  if (onOpenCreateClass) onOpenCreateClass();
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#0B57D0] hover:bg-blue-50/80 flex items-center gap-3 transition cursor-pointer border-b border-slate-100"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#0B57D0] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold">Buat Kelas Baru & Token</div>
                  <div className="text-[10px] text-slate-400 font-normal">Matematika, IPA, B. Indo, dll.</div>
                </div>
              </button>

              {/* 2. Buat Tugas / Materi Baru */}
              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  if (onOpenCreateTask) {
                    onOpenCreateTask();
                  } else if (onOpenCreateClass) {
                    onOpenCreateClass();
                  }
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Buat Tugas / Materi Baru</span>
              </button>

              {/* 3. Generator Soal AI */}
              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  router.push("/guru/buat-soal");
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Generator Soal AI</span>
              </button>

              {/* 4. Buat Ruang Ujian Baru */}
              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  router.push("/guru/ujian/create");
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition cursor-pointer"
              >
                <Layers className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <div className="font-bold">Buat Ruang Ujian Baru</div>
                  <div className="text-[10px] text-slate-400 font-normal">Ulangan Harian & Ujian CBT</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Google Apps (9-dot Grid) Icon */}
        <div className="relative" ref={appsMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsAppsMenuOpen(!isAppsMenuOpen);
              setIsPlusMenuOpen(false);
              setIsProfileMenuOpen(false);
            }}
            aria-label="Google apps"
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 cursor-pointer"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>

          {isAppsMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
                Aplikasi & Portal Akademik
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAppsMenuOpen(false);
                    if (typeof window !== "undefined" && window.location.pathname === "/guru") {
                      window.dispatchEvent(new CustomEvent("guru-navigate-home"));
                    } else {
                      router.push("/guru");
                    }
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-slate-100 transition text-center cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">Classroom Guru</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAppsMenuOpen(false);
                    router.push("/guru/siswa");
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-slate-100 transition text-center cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">Kelola Siswa</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAppsMenuOpen(false);
                    if (typeof window !== "undefined" && window.location.pathname === "/guru") {
                      window.location.search = "?view=presensi";
                    } else {
                      router.push("/guru?view=presensi");
                    }
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-slate-100 transition text-center cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">Presensi Siswa</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAppsMenuOpen(false);
                    router.push("/guru/ujian");
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-slate-100 transition text-center cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">Ruang Ujian</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAppsMenuOpen(false);
                    setIsHelpModalOpen(true);
                    if (onOpenHelp) onOpenHelp();
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-slate-100 transition text-center cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">Help Center</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAppsMenuOpen(false);
                    if (typeof document !== "undefined") {
                      document.cookie = "user_role=siswa; path=/; max-age=86400";
                    }
                    router.push("/");
                  }}
                  className="col-span-2 mt-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-slate-700"
                >
                  <GraduationCap className="w-4 h-4 text-slate-600" />
                  <span>Buka Dashboard Siswa</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell (Notifikasi Guru: Permintaan Keluar Kelas Siswa) */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotifMenuOpen(!isNotifMenuOpen);
              setIsAppsMenuOpen(false);
              setIsPlusMenuOpen(false);
              setIsProfileMenuOpen(false);
            }}
            aria-label={t.teacherNotifTitle || "Notifikasi Guru"}
            title={t.teacherNotifTitle || "Notifikasi Guru"}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 cursor-pointer relative"
          >
            <Bell className="w-5 h-5" />
            {unenrollRequests.length > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {unenrollRequests.length > 9 ? "9+" : unenrollRequests.length}
              </span>
            )}
          </button>

          {isNotifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 py-3.5 px-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header Notifikasi */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {t.teacherNotifTitle || "Notifikasi Guru"}
                  </h3>
                </div>
                {unenrollRequests.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                    {unenrollRequests.length} {language === "en" ? "Pending" : "Menunggu"}
                  </span>
                )}
              </div>

              {/* Feedback toast message if any */}
              {feedbackToast && (
                <div className="my-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{feedbackToast}</span>
                </div>
              )}

              {/* Subheading: Permintaan Keluar Kelas */}
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-3 mb-2 px-1">
                {t.unenrollRequestsHeading || "Permintaan Keluar Kelas"}
              </div>

              {/* Body: List or Empty */}
              {unenrollRequests.length === 0 ? (
                <div className="py-7 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5 stroke-[2]" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    {t.noUnenrollRequests || "Tidak ada permintaan keluar kelas"}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-[220px]">
                    {language === "en"
                      ? "All student enrollment requests have been handled."
                      : "Semua status kelas siswa saat ini telah terkelola dengan baik."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5 pt-1">
                  {unenrollRequests.map((req) => {
                    const isProcessing = processingId === req.id;
                    const studentInitials = (req.studentName || "S")
                      .trim()
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")
                      .toUpperCase();

                    return (
                      <div
                        key={req.id}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 transition space-y-2.5 text-left"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {studentInitials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {req.studentName}
                              </h4>
                              <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {formatReqTime(req.requestedAt, language)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                              {language === "en" ? "Requests to unenroll from " : "Meminta keluar dari kelas "}
                              <span className="font-semibold text-slate-800">{req.className}</span>
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons: Setujui & Tolak */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleReject(req)}
                            className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{t.reject || "Tolak"}</span>
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleApprove(req)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95 disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            )}
                            <span>{t.approve || "Setujui"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="relative ml-1" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsProfileMenuOpen(!isProfileMenuOpen);
              setIsAppsMenuOpen(false);
              setIsPlusMenuOpen(false);
            }}
            aria-label="Profil Guru"
            className="w-10 h-10 rounded-full bg-white hover:ring-2 hover:ring-blue-400 text-slate-800 flex items-center justify-center font-semibold text-sm shadow-xs transition active:scale-95 cursor-pointer overflow-hidden border border-slate-200"
          >
            {teacherPhoto ? (
              <img
                src={teacherPhoto}
                alt={teacherName}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <span className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {firstLetter}
              </span>
            )}
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-84 bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-5 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-900">
              {/* Header */}
              <div className="flex items-center justify-between pb-3">
                <h3 className="text-base font-bold text-slate-800 font-sans tracking-tight">
                  Profil Pendidik
                </h3>
              </div>

              {/* Baris Identitas */}
              <div className="flex items-start gap-3.5 pt-1">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-50 border-2 border-slate-100 shadow-xs shrink-0 flex items-center justify-center">
                  {teacherPhoto ? (
                    <img
                      src={teacherPhoto}
                      alt={teacherName}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                      {firstLetter}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {teacherName}
                  </div>
                  <div className="text-xs text-slate-500 leading-tight mt-0.5 truncate">
                    {schoolName}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{teacherEmail}</span>
                  </div>
                </div>
              </div>

              {/* Garis Pemisah */}
              <div className="my-4 border-t border-slate-100" />

              {/* Informasi Akademik */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  Peran & Penugasan
                </div>
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <User className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{teacherRole}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Kelas Binaan: Matematika (Kelas 8)</span>
                  </div>
                </div>
              </div>

              {/* Garis Pemisah */}
              <div className="my-4 border-t border-slate-100" />

              {/* Button Keluar */}
              <button
                type="button"
                onClick={async () => {
                  setIsProfileMenuOpen(false);
                  await logoutAction();
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-300 text-rose-500 hover:bg-rose-50 flex items-center justify-center gap-2 text-sm font-semibold transition active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Pusat Bantuan Guru */}
      <TeacherHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </header>
  );
}
