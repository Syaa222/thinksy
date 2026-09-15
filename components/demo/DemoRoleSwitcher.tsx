"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  ShieldAlert, 
  Crown, 
  School, 
  GraduationCap, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  RefreshCw,
  Eye
} from "lucide-react";

interface RoleOption {
  role: "super_admin" | "admin_sekolah" | "guru" | "siswa";
  label: string;
  badge: string;
  desc: string;
  icon: any;
  color: string;
  path: string;
}

const ROLES: RoleOption[] = [
  {
    role: "super_admin",
    label: "Super Admin",
    badge: "👑 Sistem",
    desc: "Multi-tenant, lisensi & analitik biaya AI",
    icon: Crown,
    color: "from-amber-500 to-orange-600 border-amber-400 text-amber-500",
    path: "/super",
  },
  {
    role: "admin_sekolah",
    label: "Admin Sekolah",
    badge: "🏫 Sekolah",
    desc: "Kelola Guru, Siswa, Kelas & Profil",
    icon: School,
    color: "from-blue-600 to-indigo-600 border-blue-400 text-blue-500",
    path: "/admin",
  },
  {
    role: "guru",
    label: "Guru Matematika",
    badge: "👨‍🏫 Guru",
    desc: "Buat soal, pantau kelas & koreksi esai",
    icon: UserCheck,
    color: "from-emerald-500 to-teal-600 border-emerald-400 text-emerald-500",
    path: "/guru",
  },
  {
    role: "siswa",
    label: "Siswa (Budi)",
    badge: "🎓 Siswa",
    desc: "Materi, Tutor AI, Kuis & Jurnal Belajar",
    icon: GraduationCap,
    color: "from-violet-500 to-purple-600 border-violet-400 text-purple-500",
    path: "/",
  },
];

export default function DemoRoleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [activeRole, setActiveRole] = useState<string>("siswa");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine current active role from pathname
  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/super")) {
      setActiveRole("super_admin");
    } else if (pathname.startsWith("/admin")) {
      setActiveRole("admin_sekolah");
    } else if (pathname.startsWith("/guru")) {
      setActiveRole("guru");
    } else {
      setActiveRole("siswa");
    }
  }, [pathname]);

  if (!mounted) {
    return null;
  }

  const handleRoleSwitch = async (role: RoleOption) => {
    if (isSwitching || activeRole === role.role) {
      if (pathname !== role.path) {
        router.push(role.path);
      }
      return;
    }

    setIsSwitching(true);
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: role.role }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveRole(role.role);
        setIsOpen(false);
        router.push(data.redirectUrl || role.path);
        router.refresh();
      } else {
        router.push(role.path);
      }
    } catch (e) {
      console.error("[ROLE SWITCH ERROR]", e);
      router.push(role.path);
    } finally {
      setIsSwitching(false);
    }
  };

  const currentRoleObj = ROLES.find((r) => r.role === activeRole) || ROLES[3];

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      {/* Expanded Menu */}
      {isOpen && (
        <div className="mb-2 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-3.5 space-y-2 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between px-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-500">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">
                  Demo Mode Switcher
                </h4>
                <p className="text-[10px] text-slate-400">Pilih peran presentasi 1-klik</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isActive = activeRole === role.role;

              return (
                <button
                  key={role.role}
                  onClick={() => handleRoleSwitch(role)}
                  disabled={isSwitching}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-3 border ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-300 shadow-md"
                      : "bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? "bg-white/20 text-white" : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">{role.label}</span>
                      {isActive && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] truncate ${isActive ? "text-slate-300 dark:text-slate-400" : "text-slate-400"}`}>
                      {role.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Sinkronisasi Realtime Aktif</span>
            <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl border border-slate-700 transition transform active:scale-95 group cursor-pointer"
        title="Klik untuk ganti peran presentasi (Super Admin, Admin Sekolah, Guru, Siswa)"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="text-xs font-black tracking-wide text-amber-400">
          {currentRoleObj.badge}
        </span>
        <span className="text-xs font-bold text-slate-200 border-l border-slate-700 pl-2 hidden sm:inline">
          {currentRoleObj.label}
        </span>
        {isSwitching ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-300" />
        ) : isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        )}
      </button>
    </div>
  );
}
