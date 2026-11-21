"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  GraduationCap,
  BookOpen,
  Layers,
  MapPin,
  Palette,
  ShieldCheck,
  Search,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  Clock,
  Calendar,
  Lock,
} from "lucide-react";
import {
  ClassBannerGraphic,
  resolveIllustrationType,
} from "./ClassBannerGraphics";
import { PRESET_BANNER_PHOTOS } from "./CustomizeBannerModal";

export interface NewClassData {
  id: string;
  name: string;
  mapel: string;
  section: string;
  room: string;
  subjectCode: string;
  themeColor: string;
  bgGradient: string;
  bannerType?: "illustration" | "photo";
  bannerIllustration?: string;
  bannerPhotoUrl?: string;
  studentCount: number;
  dueSoonDate?: string;
  isScheduled?: boolean;
}

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClass: (newClass: NewClassData) => void;
}

// Preset Mata Pelajaran dengan warna, kode inisial, ikon, kategori dan tags pencarian
const MAPEL_PRESETS = [
  {
    mapel: "Matematika",
    prefix: "mtk",
    color: "#2563EB",
    bgGradient: "from-blue-600 via-indigo-600 to-slate-950",
    illustration: "math",
    defaultRoom: "Ruang 8-A",
    icon: "📐",
    category: "Sains & Logika",
    tags: ["matematika", "mtk", "aljabar", "geometri", "hitung", "math"],
  },
  {
    mapel: "IPA (Ilmu Pengetahuan Alam)",
    prefix: "ipa",
    color: "#059669",
    bgGradient: "from-emerald-600 via-teal-700 to-slate-950",
    illustration: "science",
    defaultRoom: "Lab IPA",
    icon: "🔬",
    category: "Sains & Alam",
    tags: ["ipa", "sains", "fisika", "biologi", "kimia", "alam"],
  },
  {
    mapel: "Bahasa Indonesia",
    prefix: "bin",
    color: "#7C3AED",
    bgGradient: "from-violet-600 via-purple-700 to-indigo-950",
    illustration: "book",
    defaultRoom: "Ruang 8-B",
    icon: "📚",
    category: "Bahasa & Literasi",
    tags: ["bahasa", "indonesia", "sastra", "literasi", "bin"],
  },
  {
    mapel: "Bahasa Inggris",
    prefix: "ing",
    color: "#F43F5E",
    bgGradient: "from-rose-500 via-red-600 to-slate-950",
    illustration: "globe",
    defaultRoom: "Lab Bahasa",
    icon: "🇬🇧",
    category: "Bahasa & Komunikasi",
    tags: ["english", "inggris", "grammar", "vocabulary", "ing"],
  },
  {
    mapel: "Informatika / TIK",
    prefix: "inf",
    color: "#06B6D4",
    bgGradient: "from-cyan-500 via-blue-600 to-slate-950",
    illustration: "tech",
    defaultRoom: "Lab Komputer",
    icon: "💻",
    category: "Teknologi Digital",
    tags: ["informatika", "tik", "komputer", "coding", "teknologi", "inf"],
  },
  {
    mapel: "IPS (Ilmu Pengetahuan Sosial)",
    prefix: "ips",
    color: "#D97706",
    bgGradient: "from-amber-500 via-orange-600 to-stone-950",
    illustration: "social",
    defaultRoom: "Ruang 8-C",
    icon: "🌍",
    category: "Sosial & Humaniora",
    tags: ["ips", "sejarah", "geografi", "sosiologi", "ekonomi"],
  },
  {
    mapel: "Pendidikan Pancasila (PPKn)",
    prefix: "ppk",
    color: "#4F46E5",
    bgGradient: "from-indigo-600 via-blue-700 to-slate-950",
    illustration: "civics",
    defaultRoom: "Ruang 8-A",
    icon: "🏛️",
    category: "Kewarganegaraan",
    tags: ["ppkn", "pancasila", "kewarganegaraan", "hukum", "ppk"],
  },
  {
    mapel: "Seni Budaya",
    prefix: "sbd",
    color: "#DB2777",
    bgGradient: "from-pink-500 via-rose-600 to-purple-950",
    illustration: "art",
    defaultRoom: "Ruang Kesenian",
    icon: "🎨",
    category: "Seni & Estetika",
    tags: ["seni", "budaya", "musik", "rupa", "tari", "kreatif", "sbd"],
  },
  {
    mapel: "Pendidikan Agama Islam (PAI)",
    prefix: "pai",
    color: "#0D9488",
    bgGradient: "from-teal-600 via-emerald-700 to-slate-950",
    illustration: "book",
    defaultRoom: "Ruang Keagamaan",
    icon: "🕌",
    category: "Agama & Budi Pekerti",
    tags: ["agama", "islam", "pai", "budi pekerti", "akhlak"],
  },
  {
    mapel: "PJOK (Pendidikan Jasmani & Olahraga)",
    prefix: "pjk",
    color: "#EA580C",
    bgGradient: "from-orange-500 via-amber-600 to-slate-950",
    illustration: "sport",
    defaultRoom: "Lapangan Olahraga",
    icon: "⚽",
    category: "Olahraga & Kesehatan",
    tags: ["pjok", "olahraga", "jasmani", "kesehatan", "atletik", "pjk"],
  },
];

// Pilihan Warna Tema Modern & Menarik
export const THEME_COLORS = [
  {
    id: "sapphire",
    color: "#2563EB",
    label: "Sapphire Royal",
    accent: "Biru Samudra",
    gradient: "from-blue-600 via-indigo-600 to-slate-950",
    swatchBg: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
  },
  {
    id: "emerald",
    color: "#059669",
    label: "Emerald Aurora",
    accent: "Hijau Zamrud",
    gradient: "from-emerald-600 via-teal-700 to-slate-950",
    swatchBg: "linear-gradient(135deg, #10B981 0%, #047857 100%)",
  },
  {
    id: "violet",
    color: "#7C3AED",
    label: "Electric Violet",
    accent: "Ungu Neon",
    gradient: "from-violet-600 via-purple-700 to-indigo-950",
    swatchBg: "linear-gradient(135deg, #A855F7 0%, #6D28D9 100%)",
  },
  {
    id: "cyan",
    color: "#06B6D4",
    label: "Cyber Arctic",
    accent: "Biru Langit",
    gradient: "from-cyan-500 via-blue-600 to-slate-950",
    swatchBg: "linear-gradient(135deg, #22D3EE 0%, #0284C7 100%)",
  },
  {
    id: "coral",
    color: "#F43F5E",
    label: "Sunset Coral",
    accent: "Merah Crimson",
    gradient: "from-rose-500 via-red-600 to-slate-950",
    swatchBg: "linear-gradient(135deg, #FB7185 0%, #E11D48 100%)",
  },
  {
    id: "amber",
    color: "#D97706",
    label: "Cosmic Amber",
    accent: "Kuning Emas",
    gradient: "from-amber-500 via-orange-600 to-stone-950",
    swatchBg: "linear-gradient(135deg, #FBBF24 0%, #EA580C 100%)",
  },
  {
    id: "fuchsia",
    color: "#DB2777",
    label: "Fuchsia Dream",
    accent: "Pink Magenta",
    gradient: "from-pink-500 via-rose-600 to-purple-950",
    swatchBg: "linear-gradient(135deg, #F472B6 0%, #C026D3 100%)",
  },
  {
    id: "midnight",
    color: "#334155",
    label: "Midnight Obsidian",
    accent: "Hitam Elegan",
    gradient: "from-slate-700 via-slate-800 to-slate-950",
    swatchBg: "linear-gradient(135deg, #64748B 0%, #0F172A 100%)",
  },
];

/**
 * Generate random 7-character class token e.g. "ipa8w7x"
 */
function generateToken(prefix: string = "cls", grade: string = "8"): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let randomPart = "";
  for (let i = 0; i < 3; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const cleanPrefix = (prefix || "cls").toLowerCase().slice(0, 3);
  const cleanGrade = (grade || "8").replace(/[^0-9]/g, "").slice(0, 1) || "8";
  return `${cleanPrefix}${cleanGrade}${randomPart}`;
}

export default function CreateClassModal({
  isOpen,
  onClose,
  onCreateClass,
}: CreateClassModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("Matematika");
  const [className, setClassName] = useState<string>("Matematika (Kelas 8)");
  const [section, setSection] = useState<string>("Kelas 8 • Fase D Kurikulum Merdeka");
  const [room, setRoom] = useState<string>("Ruang 8-A");
  const [subject, setSubject] = useState<string>("Matematika");
  const [classToken, setClassToken] = useState<string>("mtk8xpk");
  const [themeColor, setThemeColor] = useState<string>("#2563EB");
  const [bgGradient, setBgGradient] = useState<string>("from-blue-600 via-indigo-600 to-slate-950");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Banner State (Illustration vs Photo)
  const [bannerType, setBannerType] = useState<"illustration" | "photo">("illustration");
  const [bannerIllustration, setBannerIllustration] = useState<string>("math");
  const [bannerPhotoUrl, setBannerPhotoUrl] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Rekomendasi State
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Due Soon / Jadwal Rilis Kelas State
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [dueSoonDate, setDueSoonDate] = useState<string>(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    defaultDate.setHours(8, 0, 0, 0);
    const year = defaultDate.getFullYear();
    const month = String(defaultDate.getMonth() + 1).padStart(2, "0");
    const day = String(defaultDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T08:00`;
  });

  const currentTheme = useMemo(() => {
    return THEME_COLORS.find((t) => t.color === themeColor) || THEME_COLORS[0];
  }, [themeColor]);

  // Inisialisasi token saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      handleSelectPreset(MAPEL_PRESETS[0]);
      setShowRecommendations(false);
      setIsCopied(false);
      setErrorMsg(null);
      setBannerType("illustration");
      setBannerIllustration("math");
      setBannerPhotoUrl("");
      setUploadError(null);
    }
  }, [isOpen]);

  // Tutup dropdown rekomendasi saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowRecommendations(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter rekomendasi berdasarkan input pencarian guru
  const filteredPresets = useMemo(() => {
    const query = className.toLowerCase().trim();
    if (!query) return MAPEL_PRESETS;
    return MAPEL_PRESETS.filter(
      (p) =>
        p.mapel.toLowerCase().includes(query) ||
        p.prefix.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(query)))
    );
  }, [className]);

  const handleSelectPreset = (preset: typeof MAPEL_PRESETS[0]) => {
    setSelectedPreset(preset.mapel);
    setClassName(`${preset.mapel} (Kelas 8)`);
    setSubject(preset.mapel);
    setRoom(preset.defaultRoom);
    setThemeColor(preset.color);
    setBgGradient(preset.bgGradient);
    setBannerIllustration(preset.illustration || "math");
    const newToken = generateToken(preset.prefix, "8");
    setClassToken(newToken);
  };

  const handleSelectRecommendation = (preset: typeof MAPEL_PRESETS[0]) => {
    handleSelectPreset(preset);
    setSection("Kelas 8 • Fase D Kurikulum Merdeka");
    setShowRecommendations(false);
  };

  const handleRegenerateToken = () => {
    const currentPreset = MAPEL_PRESETS.find((p) => p.mapel === subject);
    const prefix = currentPreset ? currentPreset.prefix : "cls";
    const newToken = generateToken(prefix, section);
    setClassToken(newToken);
    setIsCopied(false);
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(classToken);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Pilih file foto/gambar yang valid (JPG, PNG, atau WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Ukuran file foto maksimal 5MB.");
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBannerPhotoUrl(reader.result);
        setBannerType("photo");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      setErrorMsg("Nama kelas wajib diisi!");
      return;
    }
    if (!classToken.trim()) {
      setErrorMsg("Token kelas wajib diisi!");
      return;
    }

    setIsSubmitting(true);

    const cleanName = className.trim();
    const effectiveSubject = (subject && subject !== "Matematika") ? subject.trim() : cleanName;
    const safeSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const safeId = `class-${safeSlug || "kelas"}-${Date.now().toString().slice(-4)}`;

    const newClass: NewClassData = {
      id: safeId,
      name: cleanName,
      mapel: effectiveSubject,
      section: section.trim() || "Kelas 8 • Fase D",
      room: room.trim() || "Ruang 8-A",
      subjectCode: classToken.trim().toLowerCase(),
      themeColor,
      bgGradient,
      bannerType,
      bannerIllustration,
      bannerPhotoUrl: bannerType === "photo" ? bannerPhotoUrl : "",
      studentCount: 0,
      dueSoonDate: isScheduled ? dueSoonDate : undefined,
      isScheduled,
    };

    setTimeout(() => {
      onCreateClass(newClass);
      setIsSubmitting(false);
      onClose();
    }, 350);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B57D0]/10 text-[#0B57D0] flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Buat Kelas Baru & Token
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Ketik nama mapel untuk melihat rekomendasi, atur ruang, dan bagikan token kelas ke siswa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-red-50 text-red-700 border border-red-200 font-medium">
              {errorMsg}
            </div>
          )}

          {/* CLASS DETAILS INPUTS WITH SEARCH-BASED RECOMMENDATIONS */}
          <div className="space-y-4 pt-1">
            {/* Nama Kelas / Mata Pelajaran dengan Autocomplete Rekomendasi */}
            <div className="relative" ref={searchContainerRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Nama Kelas / Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowRecommendations((prev) => !prev)}
                  className="text-[11px] font-bold text-[#0B57D0] hover:text-blue-800 flex items-center gap-1 cursor-pointer transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{showRecommendations ? "Tutup Rekomendasi" : "Lihat Rekomendasi"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      showRecommendations ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={className}
                  onChange={(e) => {
                    setClassName(e.target.value);
                    setSubject(e.target.value);
                    setShowRecommendations(true);
                  }}
                  onFocus={() => setShowRecommendations(true)}
                  placeholder="Ketik untuk mencari mata pelajaran, misal: Matematika, IPA, Bahasa..."
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] transition shadow-2xs placeholder:font-normal placeholder:text-slate-400"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <BookOpen className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* DROPDOWN REKOMENDASI PENCARIAN (MUNCUL KETIKA GURU SEARCHING / FOCUS) */}
              {showRecommendations && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50/90 to-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1.5 text-[#0B57D0]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Rekomendasi Mata Pelajaran ({filteredPresets.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Pilih salah satu untuk mengisi otomatis
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-1.5">
                    {filteredPresets.length > 0 ? (
                      filteredPresets.map((preset) => (
                        <button
                          key={preset.mapel}
                          type="button"
                          onClick={() => handleSelectRecommendation(preset)}
                          className="w-full px-3 py-2.5 rounded-xl hover:bg-blue-50/80 transition flex items-center justify-between gap-3 text-left group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-white text-base flex items-center justify-center border border-slate-200 shrink-0 shadow-2xs transition">
                              {preset.icon}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-800 group-hover:text-[#0B57D0] transition block truncate">
                                {preset.mapel}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium block truncate">
                                {preset.category} • {preset.defaultRoom}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="w-3 h-3 rounded-full border border-white shadow-2xs"
                              style={{ backgroundColor: preset.color }}
                              title={`Warna tema: ${preset.mapel}`}
                            />
                            <span className="text-[10px] font-bold text-[#0B57D0] bg-blue-100/70 group-hover:bg-[#0B57D0] group-hover:text-white px-2.5 py-1 rounded-md transition shadow-2xs">
                              Pilih
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500 space-y-1">
                        <p className="font-semibold text-slate-700">Tidak ada rekomendasi mata pelajaran yang cocok.</p>
                        <p className="text-[11px] text-slate-400">
                          Anda dapat tetap melanjutkan dengan nama &quot;{className}&quot; untuk kelas kustom.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bagian / Tingkat & Ruangan Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bagian / Kurikulum
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="Misal: Kelas 8 • Fase D"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] transition"
                  />
                  <Layers className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ruangan
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Misal: Ruang 8-A atau Lab"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] transition"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* 3. TOKEN / KODE GABUNG KELAS OTOMATIS */}
          <div className="p-4.5 rounded-3xl bg-blue-50/70 border-2 border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0B57D0] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Token Gabung Kelas Siswa</span>
              </div>
              <span className="text-[11px] text-blue-700 font-medium">
                Otomatis Dibuat
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-blue-200 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
                <input
                  type="text"
                  value={classToken}
                  onChange={(e) => setClassToken(e.target.value.toLowerCase())}
                  placeholder="token-kelas"
                  className="font-mono text-lg sm:text-xl font-black text-[#0B57D0] tracking-wider bg-transparent outline-none w-full"
                />
              </div>

              {/* Refresh / Acak Ulang Button */}
              <button
                type="button"
                onClick={handleRegenerateToken}
                className="p-3 rounded-2xl bg-white border border-blue-200 text-slate-600 hover:text-[#0B57D0] hover:bg-blue-100/50 transition cursor-pointer shadow-2xs active:scale-95"
                title="Acak Ulang Token"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Salin Token Button */}
              <button
                type="button"
                onClick={handleCopyToken}
                className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 ${
                  isCopied
                    ? "bg-emerald-600 text-white"
                    : "bg-[#0B57D0] text-white hover:bg-blue-700"
                }`}
                title="Salin Token ke Clipboard"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-blue-900/80 leading-relaxed font-medium">
              💡 <strong>Cara Kerja:</strong> Berikan token ini kepada siswa. Siswa dapat memasukkan token ini pada tombol <strong>&quot;+&quot; &gt; Gabung ke kelas</strong> di dashboard siswa mereka untuk terdaftar langsung ke kelas ini.
            </p>
          </div>

          {/* 4. WARNA TEMA BANNER KELAS & LIVE BANNER PREVIEW */}
          <div className="space-y-3.5 p-4 rounded-3xl bg-slate-50/80 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-600" />
                <span>Kustomisasi Banner & Tampilan Kelas</span>
              </label>

              <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                Tema: <span className="text-blue-700">{currentTheme.label}</span>
              </span>
            </div>

            {/* LIVE BANNER PREVIEW CARD WITH CLASS BANNER GRAPHIC */}
            <div
              className={`relative rounded-2xl bg-gradient-to-r ${bgGradient} text-white p-4.5 overflow-hidden shadow-sm transition-all duration-300 border border-white/15 min-h-[140px] flex flex-col justify-between`}
              style={{ backgroundColor: themeColor }}
            >
              {/* Graphic Component (Photo or Google Classroom-style SVG Illustration) */}
              <ClassBannerGraphic
                bannerType={bannerType}
                bannerIllustration={bannerIllustration}
                bannerPhotoUrl={bannerPhotoUrl}
                subjectName={subject}
                isCompact={true}
              />

              <div className="relative z-10 flex items-start justify-between gap-3 drop-shadow-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                      Pratinjau Banner
                    </span>
                    <span className="text-[10px] text-white/80 font-medium truncate">
                      {room || "Ruang 8-A"}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-xs truncate max-w-xs sm:max-w-md">
                    {className || "Nama Kelas Baru"}
                  </h4>

                  <p className="text-[11px] text-white/90 font-medium mt-0.5 truncate">
                    {section || "Kelas 8 • Fase D Kurikulum Merdeka"}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <div className="px-2.5 py-1 rounded-xl bg-black/25 backdrop-blur-md border border-white/20 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-white/70 block font-semibold">
                      Kode Token
                    </span>
                    <span className="font-mono text-xs font-black text-white tracking-widest">
                      {classToken || "token"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom tag preview */}
              <div className="relative z-10 text-[10px] text-white/80 font-medium pt-2">
                Mode Tampilan: {bannerType === "photo" ? "📷 Foto Kustom" : "🎨 Ikon Ilustrasi Mapel"}
              </div>
            </div>

            {/* BANNER TYPE SWITCHER: IKON VS FOTO */}
            <div className="flex p-1 bg-white rounded-2xl gap-1 border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setBannerType("illustration")}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  bannerType === "illustration"
                    ? "bg-blue-50 text-[#0B57D0] border border-blue-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Ikon Mapel Otomatis (Default)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBannerType("photo");
                  if (!bannerPhotoUrl) {
                    setBannerPhotoUrl(PRESET_BANNER_PHOTOS[0].url);
                  }
                }}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  bannerType === "photo"
                    ? "bg-blue-50 text-[#0B57D0] border border-blue-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Unggah Foto / Galeri</span>
              </button>
            </div>

            {/* OPSI KETIKA MODE FOTO DIPILIH */}
            {bannerType === "photo" && (
              <div className="space-y-3 p-3 rounded-2xl bg-white border border-slate-200 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0B57D0] flex items-center justify-center shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">
                        Unggah Foto Sendiri
                      </h5>
                      <p className="text-[10px] text-slate-500">
                        JPG, PNG, atau WEBP dari laptop
                      </p>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[#0B57D0] hover:bg-blue-100 font-bold text-xs transition cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    Pilih File Foto
                  </button>
                </div>

                {uploadError && (
                  <p className="text-[11px] font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                    {uploadError}
                  </p>
                )}

                {/* Preset Galeri Foto Sekolah */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    Atau Pilih Foto Sekolah
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {PRESET_BANNER_PHOTOS.slice(0, 4).map((p) => {
                      const isSelected = bannerPhotoUrl === p.url;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setBannerPhotoUrl(p.url)}
                          className={`relative rounded-xl overflow-hidden aspect-video border text-left transition cursor-pointer ${
                            isSelected
                              ? "border-[#0B57D0] ring-2 ring-blue-500/30 scale-102"
                              : "border-slate-200 opacity-75 hover:opacity-100"
                          }`}
                          title={p.title}
                        >
                          <img
                            src={p.url}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                          <span className="absolute bottom-1 left-1.5 right-1.5 text-[8px] font-bold text-white truncate">
                            {p.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* PALET WARNA MODERN GRADIENT SWATCHES */}
            <div className="pt-1">
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                {THEME_COLORS.map((t) => {
                  const isSelected = themeColor === t.color;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setThemeColor(t.color);
                        setBgGradient(t.gradient);
                      }}
                      className={`group relative flex flex-col items-center gap-1 p-1 rounded-2xl transition cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/80 ring-2 ring-blue-500 shadow-2xs"
                          : "hover:bg-slate-100/70"
                      }`}
                      title={`${t.label} (${t.accent})`}
                    >
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shadow-xs border border-white/40 ${
                          isSelected
                            ? "scale-105 shadow-md ring-2 ring-white"
                            : "group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        }`}
                        style={{ background: t.swatchBg }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />}
                      </div>

                      <span
                        className={`text-[9px] font-bold truncate max-w-[60px] text-center ${
                          isSelected ? "text-blue-700" : "text-slate-500 group-hover:text-slate-800"
                        }`}
                      >
                        {t.label.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4.5. JADWAL RILIS KELAS (DUE SOON) */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Jadwalkan Rilis Kelas (Due Soon)
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-700">
                      Opsional
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    Kelas akan tampil di dashboard siswa dalam status abu-abu (terkunci), dan otomatis bisa diakses saat tanggal/jam rilis tiba.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {isScheduled && (
              <div className="pt-2 border-t border-amber-200/60 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-[11px] font-bold text-slate-700 sm:w-28 shrink-0 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Waktu Rilis:
                  </label>
                  <input
                    type="datetime-local"
                    value={dueSoonDate}
                    onChange={(e) => setDueSoonDate(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-amber-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition shadow-2xs"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-slate-500 font-medium">Preset cepat:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      d.setHours(7, 30, 0, 0);
                      const yr = d.getFullYear();
                      const mo = String(d.getMonth() + 1).padStart(2, "0");
                      const dy = String(d.getDate()).padStart(2, "0");
                      setDueSoonDate(`${yr}-${mo}-${dy}T07:30`);
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-amber-100/80 text-amber-900 border border-amber-200 transition cursor-pointer"
                  >
                    Besok 07:30
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 3);
                      d.setHours(8, 0, 0, 0);
                      const yr = d.getFullYear();
                      const mo = String(d.getMonth() + 1).padStart(2, "0");
                      const dy = String(d.getDate()).padStart(2, "0");
                      setDueSoonDate(`${yr}-${mo}-${dy}T08:00`);
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-amber-100/80 text-amber-900 border border-amber-200 transition cursor-pointer"
                  >
                    3 Hari Lagi 08:00
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      d.setHours(7, 30, 0, 0);
                      const yr = d.getFullYear();
                      const mo = String(d.getMonth() + 1).padStart(2, "0");
                      const dy = String(d.getDate()).padStart(2, "0");
                      setDueSoonDate(`${yr}-${mo}-${dy}T07:30`);
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-amber-100/80 text-amber-900 border border-amber-200 transition cursor-pointer"
                  >
                    1 Pekan Lagi
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. ACTION BUTTONS */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#0B57D0] hover:bg-blue-700 transition shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <GraduationCap className="w-4 h-4" />
              <span>{isSubmitting ? "Membuat Kelas..." : "Buat Kelas & Aktifkan Token"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
