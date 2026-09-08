"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  Shuffle,
  Search,
  ChevronRight,
  Calculator,
  Laptop,
  FlaskConical,
  Compass,
  ShieldCheck,
  Languages,
  Activity,
  Music,
  BookOpenCheck,
  FileText,
  Layers,
  ArrowRight,
  CheckCircle2,
  X,
  GraduationCap,
} from "lucide-react";
import { ChapterItem, PeerStudent } from "../../types";

interface TabKursusSayaProps {
  chapters: ChapterItem[];
  peerStudents: PeerStudent[];
  userGrade?: number;
  userClassName?: string;
}

export interface MapelTheme {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  // Sidebar styling
  sidebarIconBg: string;
  sidebarIconColor: string;
  sidebarBadge: string;
  sidebarHoverBorder: string;
  // Card styling tokens (Clean flat & solid, non-gradient, non-AI)
  cardBorderAccent: string;
  cardHoverBorder: string;
  badgeMapelBg: string;
  badgeMapelText: string;
  badgeMapelBorder: string;
  solidBadgeBg: string;
  tintCardBg: string;
  tintCardBorder: string;
  titleHoverColor: string;
  accentIconBoxBg: string;
  accentIconBoxColor: string;
  accentTopBar: string;
  actionButtonSolid: string;
  actionButtonLight: string;
  actionTextColor: string;
}

import { ALLOWED_MAPEL_NAMES, AllowedMapelName, normalizeMapel } from "@/lib/mapel";

// =============================================================================
// CLEAN, SOLID COLOR PALETTES FOR 9 ALLOWED MATA PELAJARAN (NON-GRADIENT)
// 1. Matematika (Red)
// 2. Bahasa Indonesia (Indigo)
// 3. Bahasa Inggris (Violet)
// 4. IPA (Emerald)
// 5. IPS (Amber)
// 6. PPKN (Rose)
// 7. PJOK (Orange)
// 8. SENI (Fuchsia)
// 9. AGAMA (Teal)
// =============================================================================

const MAPEL_THEMES: Record<string, MapelTheme> = {
  // 1. MATEMATIKA: Signature Color = MERAH (Clean Solid Red / Crimson)
  Matematika: {
    name: "Matematika",
    icon: Calculator,
    sidebarIconBg: "bg-red-50",
    sidebarIconColor: "text-red-600",
    sidebarBadge: "bg-red-50 text-red-700 border border-red-200",
    sidebarHoverBorder: "hover:border-red-300",
    cardBorderAccent: "border-red-200",
    cardHoverBorder: "hover:border-red-400",
    badgeMapelBg: "bg-red-50",
    badgeMapelText: "text-red-700",
    badgeMapelBorder: "border-red-200",
    solidBadgeBg: "bg-red-600 text-white",
    tintCardBg: "bg-red-50/40",
    tintCardBorder: "border-red-200/80",
    titleHoverColor: "group-hover:text-red-600",
    accentIconBoxBg: "bg-red-50",
    accentIconBoxColor: "text-red-600",
    accentTopBar: "bg-red-600",
    actionButtonSolid: "bg-red-600 text-white hover:bg-red-700",
    actionButtonLight: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white",
    actionTextColor: "text-red-600",
  },

  // 2. BAHASA INDONESIA: Signature Color = INDIGO / BIRU
  "Bahasa Indonesia": {
    name: "Bahasa Indonesia",
    icon: FileText,
    sidebarIconBg: "bg-indigo-50",
    sidebarIconColor: "text-indigo-600",
    sidebarBadge: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    sidebarHoverBorder: "hover:border-indigo-300",
    cardBorderAccent: "border-indigo-200",
    cardHoverBorder: "hover:border-indigo-400",
    badgeMapelBg: "bg-indigo-50",
    badgeMapelText: "text-indigo-700",
    badgeMapelBorder: "border-indigo-200",
    solidBadgeBg: "bg-indigo-600 text-white",
    tintCardBg: "bg-indigo-50/40",
    tintCardBorder: "border-indigo-200/80",
    titleHoverColor: "group-hover:text-indigo-600",
    accentIconBoxBg: "bg-indigo-50",
    accentIconBoxColor: "text-indigo-600",
    accentTopBar: "bg-indigo-600",
    actionButtonSolid: "bg-indigo-600 text-white hover:bg-indigo-700",
    actionButtonLight: "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white",
    actionTextColor: "text-indigo-600",
  },

  // 3. BAHASA INGGRIS: Signature Color = VIOLET / UNGU
  "Bahasa Inggris": {
    name: "Bahasa Inggris",
    icon: Languages,
    sidebarIconBg: "bg-violet-50",
    sidebarIconColor: "text-violet-600",
    sidebarBadge: "bg-violet-50 text-violet-700 border border-violet-200",
    sidebarHoverBorder: "hover:border-violet-300",
    cardBorderAccent: "border-violet-200",
    cardHoverBorder: "hover:border-violet-400",
    badgeMapelBg: "bg-violet-50",
    badgeMapelText: "text-violet-700",
    badgeMapelBorder: "border-violet-200",
    solidBadgeBg: "bg-violet-600 text-white",
    tintCardBg: "bg-violet-50/40",
    tintCardBorder: "border-violet-200/80",
    titleHoverColor: "group-hover:text-violet-600",
    accentIconBoxBg: "bg-violet-50",
    accentIconBoxColor: "text-violet-600",
    accentTopBar: "bg-violet-600",
    actionButtonSolid: "bg-violet-600 text-white hover:bg-violet-700",
    actionButtonLight: "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-600 hover:text-white",
    actionTextColor: "text-violet-600",
  },

  // 4. IPA: Signature Color = EMERALD / HIJAU
  IPA: {
    name: "IPA",
    icon: FlaskConical,
    sidebarIconBg: "bg-emerald-50",
    sidebarIconColor: "text-emerald-600",
    sidebarBadge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    sidebarHoverBorder: "hover:border-emerald-300",
    cardBorderAccent: "border-emerald-200",
    cardHoverBorder: "hover:border-emerald-400",
    badgeMapelBg: "bg-emerald-50",
    badgeMapelText: "text-emerald-700",
    badgeMapelBorder: "border-emerald-200",
    solidBadgeBg: "bg-emerald-600 text-white",
    tintCardBg: "bg-emerald-50/40",
    tintCardBorder: "border-emerald-200/80",
    titleHoverColor: "group-hover:text-emerald-600",
    accentIconBoxBg: "bg-emerald-50",
    accentIconBoxColor: "text-emerald-600",
    accentTopBar: "bg-emerald-600",
    actionButtonSolid: "bg-emerald-600 text-white hover:bg-emerald-700",
    actionButtonLight: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white",
    actionTextColor: "text-emerald-600",
  },

  // 5. IPS: Signature Color = AMBER / WARM GOLD
  IPS: {
    name: "IPS",
    icon: Compass,
    sidebarIconBg: "bg-amber-50",
    sidebarIconColor: "text-amber-600",
    sidebarBadge: "bg-amber-50 text-amber-700 border border-amber-200",
    sidebarHoverBorder: "hover:border-amber-300",
    cardBorderAccent: "border-amber-200",
    cardHoverBorder: "hover:border-amber-400",
    badgeMapelBg: "bg-amber-50",
    badgeMapelText: "text-amber-700",
    badgeMapelBorder: "border-amber-200",
    solidBadgeBg: "bg-amber-600 text-white",
    tintCardBg: "bg-amber-50/40",
    tintCardBorder: "border-amber-200/80",
    titleHoverColor: "group-hover:text-amber-600",
    accentIconBoxBg: "bg-amber-50",
    accentIconBoxColor: "text-amber-600",
    accentTopBar: "bg-amber-600",
    actionButtonSolid: "bg-amber-600 text-white hover:bg-amber-700",
    actionButtonLight: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-600 hover:text-white",
    actionTextColor: "text-amber-600",
  },

  // 6. PPKN: Signature Color = RUBY / ROSE
  PPKN: {
    name: "PPKN",
    icon: ShieldCheck,
    sidebarIconBg: "bg-rose-50",
    sidebarIconColor: "text-rose-600",
    sidebarBadge: "bg-rose-50 text-rose-700 border border-rose-200",
    sidebarHoverBorder: "hover:border-rose-300",
    cardBorderAccent: "border-rose-200",
    cardHoverBorder: "hover:border-rose-400",
    badgeMapelBg: "bg-rose-50",
    badgeMapelText: "text-rose-700",
    badgeMapelBorder: "border-rose-200",
    solidBadgeBg: "bg-rose-600 text-white",
    tintCardBg: "bg-rose-50/40",
    tintCardBorder: "border-rose-200/80",
    titleHoverColor: "group-hover:text-rose-600",
    accentIconBoxBg: "bg-rose-50",
    accentIconBoxColor: "text-rose-600",
    accentTopBar: "bg-rose-600",
    actionButtonSolid: "bg-rose-600 text-white hover:bg-rose-700",
    actionButtonLight: "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white",
    actionTextColor: "text-rose-600",
  },

  // 7. PJOK: Signature Color = ORANGE / CORAL
  PJOK: {
    name: "PJOK",
    icon: Activity,
    sidebarIconBg: "bg-orange-50",
    sidebarIconColor: "text-orange-600",
    sidebarBadge: "bg-orange-50 text-orange-700 border border-orange-200",
    sidebarHoverBorder: "hover:border-orange-300",
    cardBorderAccent: "border-orange-200",
    cardHoverBorder: "hover:border-orange-400",
    badgeMapelBg: "bg-orange-50",
    badgeMapelText: "text-orange-700",
    badgeMapelBorder: "border-orange-200",
    solidBadgeBg: "bg-orange-600 text-white",
    tintCardBg: "bg-orange-50/40",
    tintCardBorder: "border-orange-200/80",
    titleHoverColor: "group-hover:text-orange-600",
    accentIconBoxBg: "bg-orange-50",
    accentIconBoxColor: "text-orange-600",
    accentTopBar: "bg-orange-600",
    actionButtonSolid: "bg-orange-600 text-white hover:bg-orange-700",
    actionButtonLight: "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-600 hover:text-white",
    actionTextColor: "text-orange-600",
  },

  // 8. SENI: Signature Color = FUCHSIA / PINK
  SENI: {
    name: "SENI",
    icon: Music,
    sidebarIconBg: "bg-fuchsia-50",
    sidebarIconColor: "text-fuchsia-600",
    sidebarBadge: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200",
    sidebarHoverBorder: "hover:border-fuchsia-300",
    cardBorderAccent: "border-fuchsia-200",
    cardHoverBorder: "hover:border-fuchsia-400",
    badgeMapelBg: "bg-fuchsia-50",
    badgeMapelText: "text-fuchsia-700",
    badgeMapelBorder: "border-fuchsia-200",
    solidBadgeBg: "bg-fuchsia-600 text-white",
    tintCardBg: "bg-fuchsia-50/40",
    tintCardBorder: "border-fuchsia-200/80",
    titleHoverColor: "group-hover:text-fuchsia-600",
    accentIconBoxBg: "bg-fuchsia-50",
    accentIconBoxColor: "text-fuchsia-600",
    accentTopBar: "bg-fuchsia-600",
    actionButtonSolid: "bg-fuchsia-600 text-white hover:bg-fuchsia-700",
    actionButtonLight: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 hover:bg-fuchsia-600 hover:text-white",
    actionTextColor: "text-fuchsia-600",
  },

  // 9. AGAMA: Signature Color = TEAL / HIJAU LAUT
  AGAMA: {
    name: "AGAMA",
    icon: BookOpenCheck,
    sidebarIconBg: "bg-teal-50",
    sidebarIconColor: "text-teal-600",
    sidebarBadge: "bg-teal-50 text-teal-700 border border-teal-200",
    sidebarHoverBorder: "hover:border-teal-300",
    cardBorderAccent: "border-teal-200",
    cardHoverBorder: "hover:border-teal-400",
    badgeMapelBg: "bg-teal-50",
    badgeMapelText: "text-teal-700",
    badgeMapelBorder: "border-teal-200",
    solidBadgeBg: "bg-teal-600 text-white",
    tintCardBg: "bg-teal-50/40",
    tintCardBorder: "border-teal-200/80",
    titleHoverColor: "group-hover:text-teal-600",
    accentIconBoxBg: "bg-teal-50",
    accentIconBoxColor: "text-teal-600",
    accentTopBar: "bg-teal-600",
    actionButtonSolid: "bg-teal-600 text-white hover:bg-teal-700",
    actionButtonLight: "bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-600 hover:text-white",
    actionTextColor: "text-teal-600",
  },
};

// Fallback Default Theme
const DEFAULT_THEME: MapelTheme = MAPEL_THEMES["Matematika"];

function getMapelTheme(mapelName?: string | null): MapelTheme {
  if (!mapelName) return DEFAULT_THEME;
  const canonical = normalizeMapel(mapelName);
  return MAPEL_THEMES[canonical] || DEFAULT_THEME;
}

export default function TabKursusSaya({
  chapters = [],
  peerStudents = [],
  userGrade = 8,
  userClassName = "Kelas 8",
}: TabKursusSayaProps) {
  // State: Selected Mapel (null = Belum mengklik Mapel / Mode Acak)
  const [selectedMapel, setSelectedMapel] = useState<string | null>(null);
  const [searchMapelQuery, setSearchMapelQuery] = useState("");
  const [searchBabQuery, setSearchBabQuery] = useState("");
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);

  // Chapters are strictly locked to the student's grade level (e.g. Kelas 8) and 9 allowed subjects
  const studentGradeChapters = useMemo(() => {
    return chapters
      .filter((ch) => ch.kelas === userGrade)
      .map((ch) => ({
        ...ch,
        mapel: normalizeMapel(ch.mapel),
      }));
  }, [chapters, userGrade]);

  // Group chapters by mapel for the student's grade strictly across the 9 allowed subjects
  const mapelList = useMemo(() => {
    const counts: Record<string, number> = {};
    ALLOWED_MAPEL_NAMES.forEach((name) => {
      counts[name] = 0;
    });

    studentGradeChapters.forEach((ch) => {
      const mapelName = normalizeMapel(ch.mapel);
      counts[mapelName] = (counts[mapelName] || 0) + 1;
    });

    return ALLOWED_MAPEL_NAMES.map((name) => ({
      name,
      count: counts[name] || 0,
      theme: getMapelTheme(name),
    }));
  }, [studentGradeChapters]);

  // Filtered mapel list in sidebar search
  const filteredMapelList = useMemo(() => {
    if (!searchMapelQuery.trim()) return mapelList;
    const q = searchMapelQuery.toLowerCase();
    return mapelList.filter((m) => m.name.toLowerCase().includes(q));
  }, [mapelList, searchMapelQuery]);

  // Generate random chapter sample specifically for current grade level
  const randomChapters = useMemo(() => {
    if (studentGradeChapters.length === 0) return [];
    
    const copy = [...studentGradeChapters];
    let seed = shuffleSeed + 12345;
    for (let i = copy.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const rnd = seed / 233280;
      const j = Math.floor(rnd * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, 24);
  }, [studentGradeChapters, shuffleSeed]);

  // Trigger shuffle animation
  const handleShuffle = () => {
    setIsShuffling(true);
    setShuffleSeed((prev) => prev + 1);
    setTimeout(() => setIsShuffling(false), 350);
  };

  // Determine current displayed chapters
  const displayedChapters = useMemo(() => {
    let list: ChapterItem[] = [];

    if (!selectedMapel) {
      list = randomChapters;
    } else {
      list = studentGradeChapters.filter(
        (ch) => (ch.mapel || "Matematika") === selectedMapel
      );
    }

    if (searchBabQuery.trim()) {
      const q = searchBabQuery.toLowerCase();
      list = list.filter(
        (ch) =>
          ch.judul.toLowerCase().includes(q) ||
          (ch.deskripsi && ch.deskripsi.toLowerCase().includes(q)) ||
          (ch.mapel && ch.mapel.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedMapel, studentGradeChapters, randomChapters, searchBabQuery]);

  const currentGradeTotalChapters = studentGradeChapters.length;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-16 space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>{userClassName}</span>
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Kurikulum Merdeka • Kelas {userGrade}</span>
            </span>

            <span className="text-xs text-slate-400 font-bold">•</span>
            <span className="text-xs text-slate-500 font-semibold">
              {currentGradeTotalChapters} Bab Pembelajaran
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-blue-600" />
            <span>Ruang Belajar • {userClassName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-3xl">
            Daftar mata pelajaran dan bab pembelajaran disesuaikan dengan tingkatan{" "}
            <strong className="text-slate-800">{userClassName}</strong> Anda.
            Pilih mata pelajaran di sisi kiri atau lihat bab di sisi kanan.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {!selectedMapel && (
            <button
              onClick={handleShuffle}
              disabled={isShuffling}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0F172A] text-xs font-bold shadow-2xs transition cursor-pointer active:scale-95"
              title="Acak ulang susunan bab yang ditampilkan"
            >
              <Shuffle
                className={`w-3.5 h-3.5 text-blue-600 transition-transform ${
                  isShuffling ? "rotate-180 duration-300" : ""
                }`}
              />
              <span>Acak Ulang Bab</span>
            </button>
          )}

          {selectedMapel && (
            <button
              onClick={() => {
                setSelectedMapel(null);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset ke Semua Bab</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Split: Sisi Kiri (Mata Pelajaran) & Sisi Kanan (Masonry Bab) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* SISI KIRI: Sidebar Mata Pelajaran (Clean, Minimalist, Solid) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 sticky top-20">
            {/* Header Sidebar Sisi Kiri */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-[#0F172A]">
                    Mata Pelajaran
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Tingkat {userClassName}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {mapelList.length} Mapel
              </span>
            </div>

            {/* Mapel Search Input */}
            <div className="relative mb-3.5">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari mata pelajaran..."
                value={searchMapelQuery}
                onChange={(e) => setSearchMapelQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
              />
              {searchMapelQuery && (
                <button
                  onClick={() => setSearchMapelQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* List of Mapel Options */}
            <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 custom-scrollbar">
              {/* Special Option: Semua Bab / Eksplorasi Acak */}
              <button
                onClick={() => {
                  setSelectedMapel(null);
                }}
                className={`w-full text-left p-3 rounded-2xl transition flex items-center justify-between group cursor-pointer border ${
                  selectedMapel === null
                    ? "bg-[#0F172A] text-white border-slate-800 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100/80 text-slate-700 border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
                      selectedMapel === null
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-white text-blue-600 border border-slate-200 shadow-2xs"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div
                      className={`text-xs font-extrabold truncate ${
                        selectedMapel === null ? "text-white" : "text-[#0F172A]"
                      }`}
                    >
                      🎲 Semua Bab ({userClassName})
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        selectedMapel === null ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      Eksplorasi seluruh bab
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      selectedMapel === null
                        ? "bg-white/20 text-white"
                        : "bg-slate-200/80 text-slate-600"
                    }`}
                  >
                    {currentGradeTotalChapters}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                      selectedMapel === null
                        ? "text-slate-300"
                        : "text-slate-400 group-hover:text-slate-700"
                    }`}
                  />
                </div>
              </button>

              {/* Mapel List from Database for the active class */}
              {filteredMapelList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Tidak ada mata pelajaran yang ditemukan.
                </div>
              ) : (
                filteredMapelList.map((m) => {
                  const isSelected = selectedMapel === m.name;
                  const IconComp = m.theme.icon;

                  return (
                    <button
                      key={m.name}
                      onClick={() => {
                        setSelectedMapel(m.name);
                      }}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-2xl transition flex items-center justify-between group cursor-pointer border relative overflow-hidden ${
                        isSelected
                          ? "bg-[#0F172A] text-white border-slate-800 shadow-xs"
                          : `bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 ${m.theme.sidebarHoverBorder}`
                      }`}
                    >
                      {/* Clean solid indicator on left when active */}
                      {isSelected && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-500" />
                      )}

                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? "bg-white/10 text-white shadow-2xs"
                              : `${m.theme.sidebarIconBg} ${m.theme.sidebarIconColor} shadow-2xs`
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div
                            className={`text-xs font-bold truncate ${
                              isSelected
                                ? "text-white"
                                : "text-[#0F172A] group-hover:text-slate-900 transition"
                            }`}
                          >
                            {m.name}
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? "text-slate-300" : "text-slate-400"
                            }`}
                          >
                            {m.count} Bab Pembelajaran
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : m.theme.sidebarBadge
                          }`}
                        >
                          {m.count} Bab
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                            isSelected
                              ? "text-slate-300"
                              : "text-slate-400 group-hover:text-slate-700"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SISI KANAN: Container Masonry Bab Grid (Clean, Flat, Non-AI) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {/* Header Controls Sisi Kanan */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedMapel ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                    Mata Pelajaran: {selectedMapel}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>Semua Bab</span>
                  </span>
                )}

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                  {userClassName}
                </span>

                <span className="text-xs text-slate-400 font-bold">•</span>
                <span className="text-xs text-slate-500 font-semibold">
                  {displayedChapters.length} Bab Ditemukan
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                <span>
                  {selectedMapel
                    ? `${selectedMapel}`
                    : `Daftar Bab ${userClassName}`}
                </span>
              </h2>
            </div>

            {/* Bab Search Input */}
            <div className="relative min-w-[200px] sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul bab..."
                value={searchBabQuery}
                onChange={(e) => setSearchBabQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
              />
              {searchBabQuery && (
                <button
                  onClick={() => setSearchBabQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Empty State */}
          {displayedChapters.length === 0 && (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-[#0F172A]">
                Tidak ada bab yang sesuai pencarian
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Coba ubah kata kunci pencarian atau pilih mata pelajaran lainnya.
              </p>
              <button
                onClick={() => {
                  setSearchBabQuery("");
                  setSelectedMapel(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Reset Pencarian
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* MASONRY GRID: CLEAN, FLAT & CRISP SOLID THEMED CARDS */}
          {/* ================================================================= */}
          {displayedChapters.length > 0 && (
            <div className="columns-1 sm:columns-2 lg:columns-2 xl:columns-3 gap-4 space-y-4">
              {displayedChapters.map((ch, idx) => {
                const mapelTheme = getMapelTheme(ch.mapel);
                const IconComp = mapelTheme.icon;
                
                // 4 distinct clean visual layout variants per subject (clean, solid, non-gradient)
                const variant = ((ch.urutan || 1) + idx) % 4;

                // -------------------------------------------------------------
                // Variant 0: Clean White Card with Subject Badges & Feature Box
                // -------------------------------------------------------------
                if (variant === 0) {
                  return (
                    <Link
                      key={ch.id}
                      href={`/bab/${ch.id}`}
                      className={`group break-inside-avoid block bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 ${mapelTheme.cardHoverBorder} p-5 sm:p-6 shadow-2xs hover:shadow-xs transition duration-150 space-y-4`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${mapelTheme.badgeMapelBg} ${mapelTheme.badgeMapelText} border ${mapelTheme.badgeMapelBorder} flex items-center gap-1`}
                          >
                            <IconComp className="w-3 h-3" />
                            <span>{ch.mapel || "Matematika"}</span>
                          </span>
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            Kelas {ch.kelas || userGrade}
                          </span>
                        </div>

                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#0F172A] text-white">
                          Bab {ch.urutan}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3
                          className={`text-base sm:text-lg font-extrabold text-[#0F172A] ${mapelTheme.titleHoverColor} transition leading-snug`}
                        >
                          {ch.judul}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          {ch.deskripsi ||
                            "Memahami konsep dasar, capaian pembelajaran, dan pemecahan masalah kontekstual."}
                        </p>
                      </div>

                      {/* Mini Feature Box */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] text-slate-700 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Materi & Latihan Soal</span>
                        </span>
                        <span className="font-bold text-slate-900">
                          {ch.materi && ch.materi.length > 0
                            ? `${ch.materi.length} Materi`
                            : "Interaktif"}
                        </span>
                      </div>

                      {/* Footer Action */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition">
                          Pelajari Sekarang
                        </span>
                        <div
                          className={`w-8 h-8 rounded-xl ${mapelTheme.actionButtonSolid} flex items-center justify-center font-bold shadow-2xs transition`}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  );
                }

                // -------------------------------------------------------------
                // Variant 1: Flat Soft-Tinted Solid Card (Light Pastel Background)
                // -------------------------------------------------------------
                if (variant === 1) {
                  return (
                    <Link
                      key={ch.id}
                      href={`/bab/${ch.id}`}
                      className={`group break-inside-avoid block ${mapelTheme.tintCardBg} rounded-2xl sm:rounded-3xl border ${mapelTheme.tintCardBorder} ${mapelTheme.cardHoverBorder} p-5 sm:p-6 shadow-2xs hover:shadow-xs transition duration-150 space-y-4`}
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={`w-10 h-10 rounded-xl bg-white border ${mapelTheme.badgeMapelBorder} flex items-center justify-center ${mapelTheme.badgeMapelText} shadow-2xs`}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${mapelTheme.solidBadgeBg} uppercase tracking-wider block`}
                          >
                            Bab {ch.urutan}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            Kelas {ch.kelas || userGrade}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className={`text-[10px] font-extrabold uppercase tracking-wider ${mapelTheme.badgeMapelText}`}>
                          {ch.mapel || "Matematika"}
                        </div>
                        <h3
                          className={`text-base sm:text-lg font-extrabold text-[#0F172A] ${mapelTheme.titleHoverColor} transition leading-snug mt-0.5`}
                        >
                          {ch.judul}
                        </h3>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                          {ch.deskripsi ||
                            "Menganalisis materi secara komprehensif dengan bantuan penjelasan interaktif."}
                        </p>
                      </div>

                      {/* Topic Highlights */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Fokus Pembahasan:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                            Konsep Inti
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                            Soal Latihan
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                            Kuis Interaktif
                          </span>
                        </div>
                      </div>

                      {/* Footer Action */}
                      <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                          {peerStudents.slice(0, 3).map((peer) => (
                            <div
                              key={peer.id}
                              className="w-6 h-6 rounded-full ring-2 ring-white bg-[#0F172A] text-white flex items-center justify-center text-[9px] font-extrabold"
                            >
                              {peer.initials}
                            </div>
                          ))}
                        </div>

                        <span
                          className={`text-xs font-bold ${mapelTheme.actionTextColor} flex items-center gap-1 group-hover:translate-x-0.5 transition`}
                        >
                          <span>Buka Bab</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  );
                }

                // -------------------------------------------------------------
                // Variant 2: Clean Card with Solid Subject Top Accent Bar
                // -------------------------------------------------------------
                if (variant === 2) {
                  return (
                    <Link
                      key={ch.id}
                      href={`/bab/${ch.id}`}
                      className={`group break-inside-avoid block bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 ${mapelTheme.cardHoverBorder} p-5 sm:p-6 shadow-2xs hover:shadow-xs transition duration-150 space-y-3 relative overflow-hidden`}
                    >
                      {/* Solid Subject Top Accent Stripe */}
                      <div className={`h-1.5 ${mapelTheme.accentTopBar} absolute top-0 left-0 right-0`} />

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${mapelTheme.solidBadgeBg}`}
                        >
                          {ch.mapel || "Matematika"}
                        </span>

                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          Kelas {ch.kelas || userGrade} • Bab {ch.urutan}
                        </span>
                      </div>

                      <div>
                        <h3
                          className={`text-base font-extrabold text-[#0F172A] ${mapelTheme.titleHoverColor} transition leading-snug`}
                        >
                          {ch.judul}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {ch.deskripsi ||
                            "Materi unggulan lengkap dengan pembahasan mendalam dan simulasi kuis."}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500 group-hover:text-slate-800 transition">
                          Eksplorasi Modul
                        </span>
                        <div
                          className={`w-7 h-7 rounded-lg ${mapelTheme.actionButtonLight} flex items-center justify-center transition`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  );
                }

                // -------------------------------------------------------------
                // Variant 3: Clean Outlined Bento Card (Crisp Minimalist Frame)
                // -------------------------------------------------------------
                return (
                  <Link
                    key={ch.id}
                    href={`/bab/${ch.id}`}
                    className={`group break-inside-avoid block bg-white rounded-2xl sm:rounded-3xl border ${mapelTheme.cardBorderAccent} ${mapelTheme.cardHoverBorder} p-5 shadow-2xs hover:shadow-xs transition duration-150 space-y-3`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${mapelTheme.badgeMapelBg} ${mapelTheme.badgeMapelText} border ${mapelTheme.badgeMapelBorder}`}
                      >
                        {ch.mapel || "Matematika"}
                      </span>

                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Kelas {ch.kelas || userGrade} • Bab {ch.urutan}
                      </span>
                    </div>

                    <div>
                      <h3
                        className={`text-base font-extrabold text-[#0F172A] ${mapelTheme.titleHoverColor} transition leading-tight`}
                      >
                        {ch.judul}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {ch.deskripsi ||
                          "Pelajari modul dan eksplorasi latihan soal berbasis kurikulum merdeka."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400 group-hover:text-slate-600 transition">
                        Modul Pembelajaran
                      </span>
                      <span
                        className={`flex items-center gap-1 group-hover:translate-x-0.5 transition ${mapelTheme.actionTextColor}`}
                      >
                        <span>Mulai</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
