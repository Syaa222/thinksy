"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  Layers,
  FileText,
  Info,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Bot,
  Bookmark,
  Award,
  Lightbulb,
  Shuffle,
  X,
  ExternalLink,
  Code,
  List,
} from "lucide-react";
import {
  formatDueSoonDisplay,
  saveBabDueSoonSettings,
} from "@/lib/due-soon";
import { generateTextbookModules } from "@/lib/curriculum-textbook-engine";
import SubMateriNormalEditorScreen from "./SubMateriNormalEditorScreen";
import QuestionNormalEditorScreen from "./QuestionNormalEditorScreen";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";

export interface BabSubMateri {
  id: string;
  urutan: number;
  judul: string;
  durasiMenit: number;
  konten_markdown: string;
  videoUrl?: string;
  dokumenUrl?: string;
  isOpen: boolean;
}

export interface BabFeatureSettings {
  aiEnabled: boolean;
  aiMode: "sokratik" | "adaptif" | "penjelasan";
  aiTokenLimit: number;
  aiCustomPrompt: string;
  notesEnabled: boolean;
  discussionEnabled: boolean;
}

export interface BabQuizQuestion {
  id: string;
  tipe: "pilihan_ganda" | "esai";
  pertanyaan: string;
  opsi?: string[];
  kunciJawaban: string;
  bobot: number;
  pembahasan?: string;
}

export interface BabQuizSettings {
  isOpen: boolean;
  isScheduledWithBab: boolean;
  passingGrade: number;
  durationMinutes: number;
  shuffleQuestions: boolean;
  aiQuizMode: "disabled" | "hint_only" | "unlimited";
  aiQuizTokenLimit: number;
  questions: BabQuizQuestion[];
}

export interface EditingBabData {
  id: string;
  nomor: number;
  judul: string;
  deskripsi: string;
  isOpen: boolean;
  supabaseId?: string;
  dueSoonDate?: string;
  isScheduled?: boolean;
  modules?: BabSubMateri[];
  features?: BabFeatureSettings;
  quiz?: BabQuizSettings;
}

interface EditBabNormalScreenProps {
  bab: EditingBabData;
  subjectName?: string;
  classNameTitle?: string;
  onBack: () => void;
  onSaveSuccess: (updatedBab: EditingBabData) => void;
}

export default function EditBabNormalScreen({
  bab,
  subjectName = "Matematika",
  classNameTitle = "Matematika (Kelas 8)",
  onBack,
  onSaveSuccess,
}: EditBabNormalScreenProps) {
  // Navigation Tab State: 'info' | 'materi' | 'features' | 'quiz'
  const [activeTab, setActiveTab] = useState<"info" | "materi" | "features" | "quiz">("info");

  // 1. INFO & DUE SOON STATE
  const [judul, setJudul] = useState(bab.judul || "");
  const [deskripsi, setDeskripsi] = useState(bab.deskripsi || "");
  const [nomor, setNomor] = useState(bab.nomor || 1);

  const initialMode = useMemo(() => {
    if (bab.isScheduled && bab.dueSoonDate) return "scheduled";
    if (bab.isOpen === false) return "locked";
    return "open";
  }, [bab.isScheduled, bab.dueSoonDate, bab.isOpen]);

  const [accessMode, setAccessMode] = useState<"open" | "scheduled" | "locked">(initialMode);

  const [dueSoonDate, setDueSoonDate] = useState<string>(() => {
    if (bab.dueSoonDate) return bab.dueSoonDate;
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    defaultDate.setHours(8, 0, 0, 0);
    const year = defaultDate.getFullYear();
    const month = String(defaultDate.getMonth() + 1).padStart(2, "0");
    const day = String(defaultDate.getDate()).padStart(2, "0");
    const hours = String(defaultDate.getHours()).padStart(2, "0");
    const minutes = String(defaultDate.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });

  const [previewSimulation, setPreviewSimulation] = useState<"locked" | "open">(
    accessMode === "scheduled" ? "locked" : "open"
  );

  const datePart = useMemo(() => {
    if (!dueSoonDate) return "";
    return dueSoonDate.split("T")[0] || "";
  }, [dueSoonDate]);

  const timePart = useMemo(() => {
    if (!dueSoonDate) return "08:00";
    return dueSoonDate.split("T")[1]?.slice(0, 5) || "08:00";
  }, [dueSoonDate]);

  const handleDateChange = (newDate: string) => {
    setDueSoonDate(`${newDate}T${timePart || "08:00"}`);
  };

  const handleTimeChange = (newTime: string) => {
    setDueSoonDate(`${datePart || "2026-10-27"}T${newTime}`);
  };

  const applyPreset = (daysAhead: number, hour: number = 8, minute: number = 0) => {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    target.setHours(hour, minute, 0, 0);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, "0");
    const day = String(target.getDate()).padStart(2, "0");
    const hours = String(hour).padStart(2, "0");
    const minutes = String(minute).padStart(2, "0");
    setDueSoonDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    setAccessMode("scheduled");
    setPreviewSimulation("locked");
  };

  const dueInfo = useMemo(() => {
    return formatDueSoonDisplay(dueSoonDate);
  }, [dueSoonDate]);

  // 2. SUB-MATERI STATE
  const [modules, setModules] = useState<BabSubMateri[]>(() => {
    if (bab.modules && bab.modules.length > 0) return bab.modules;
    try {
      const generated = generateTextbookModules(bab.judul, subjectName, 8, bab.deskripsi);
      if (generated && generated.length > 0) {
        return generated.map((g, idx) => ({
          id: `${bab.id}-mod-${idx + 1}`,
          urutan: g.urutan || idx + 1,
          judul: g.judul,
          durasiMenit: g.durasiMenit || 20,
          konten_markdown: g.konten_markdown || "",
          isOpen: true,
        }));
      }
    } catch {}
    return [
      {
        id: `${bab.id}-mod-1`,
        urutan: 1,
        judul: "1. Konsep & Definisi Dasar",
        durasiMenit: 20,
        konten_markdown: `# Konsep & Definisi Dasar\n\nPenjelasan materi awal mengenai konsep dasar, definisi penting, dan contoh sederhana dalam kehidupan sehari-hari.`,
        isOpen: true,
      },
      {
        id: `${bab.id}-mod-2`,
        urutan: 2,
        judul: "2. Pendalaman Materi & Sifat Operasi",
        durasiMenit: 25,
        konten_markdown: `# Pendalaman Materi & Sifat Operasi\n\nPenjabaran rumus, sifat-sifat operasi perhitungan, serta langkah-langkah penyelesaian bertahap.`,
        isOpen: true,
      },
      {
        id: `${bab.id}-mod-3`,
        urutan: 3,
        judul: "3. Latihan Penalaran & Pembahasan Soal",
        durasiMenit: 30,
        konten_markdown: `# Latihan Penalaran & Pembahasan Soal\n\nKumpulan studi kasus kontekstual dan pemecahan masalah Kurikulum Merdeka.`,
        isOpen: true,
      },
    ];
  });

  // Sub-Screen Modes: 'none' | 'edit_module' | 'edit_question' (Normal Screens)
  const [subScreenMode, setSubScreenMode] = useState<"none" | "edit_module" | "edit_question">("none");
  const [editingModule, setEditingModule] = useState<BabSubMateri | null>(null);

  // 3. FITUR BAB & AI TUTOR STATE
  const [features, setFeatures] = useState<BabFeatureSettings>(() => {
    if (bab.features) return bab.features;
    return {
      aiEnabled: true,
      aiMode: "sokratik",
      aiTokenLimit: 20,
      aiCustomPrompt: "",
      notesEnabled: true,
      discussionEnabled: true,
    };
  });

  // 4. KONTROL KUIS BAB STATE
  const [quizSettings, setQuizSettings] = useState<BabQuizSettings>(() => {
    if (bab.quiz) return bab.quiz;
    return {
      isOpen: bab.isOpen !== false,
      isScheduledWithBab: true,
      passingGrade: 75,
      durationMinutes: 30,
      shuffleQuestions: true,
      aiQuizMode: "hint_only",
      aiQuizTokenLimit: 2,
      questions: [
        {
          id: `q-${bab.id}-1`,
          tipe: "pilihan_ganda",
          pertanyaan: "Berapakah hasil perhitungan dari $2^4 \\times 2^3$?",
          opsi: [
            "A. $2^7 = 128$",
            "B. $2^{12} = 4096$",
            "C. $4^7 = 16384$",
            "D. $2^1 = 2$",
          ],
          kunciJawaban: "A",
          bobot: 20,
          pembahasan:
            "Berdasarkan sifat perkalian bilangan berpangkat dengan basis yang sama: $a^m \\times a^n = a^{m+n}$, maka $2^4 \\times 2^3 = 2^{4+3} = 2^7 = 128$.",
        },
        {
          id: `q-${bab.id}-2`,
          tipe: "pilihan_ganda",
          pertanyaan: "Bentuk sederhana dari bentuk akar $\\sqrt{72}$ adalah...",
          opsi: [
            "A. $6\\sqrt{2}$",
            "B. $3\\sqrt{8}$",
            "C. $2\\sqrt{6}$",
            "D. $9\\sqrt{2}$",
          ],
          kunciJawaban: "A",
          bobot: 20,
          pembahasan:
            "$\\sqrt{72} = \\sqrt{36 \\times 2} = \\sqrt{36} \\times \\sqrt{2} = 6\\sqrt{2}$.",
        },
        {
          id: `q-${bab.id}-3`,
          tipe: "pilihan_ganda",
          pertanyaan: "Hasil dari operasi $(-3)^3 + (-3)^2$ adalah...",
          opsi: ["A. -18", "B. 18", "C. -36", "D. 0"],
          kunciJawaban: "A",
          bobot: 20,
          pembahasan:
            "$(-3)^3 = -27$ dan $(-3)^2 = 9$. Maka $-27 + 9 = -18$.",
        },
        {
          id: `q-${bab.id}-4`,
          tipe: "pilihan_ganda",
          pertanyaan: "Rasionalkan penyebut dari pecahan $\\frac{6}{\\sqrt{3}}$!",
          opsi: [
            "A. $2\\sqrt{3}$",
            "B. $3\\sqrt{3}$",
            "C. $6\\sqrt{3}$",
            "D. $\\frac{1}{2}\\sqrt{3}$",
          ],
          kunciJawaban: "A",
          bobot: 20,
          pembahasan:
            "$\\frac{6}{\\sqrt{3}} \\times \\frac{\\sqrt{3}}{\\sqrt{3}} = \\frac{6\\sqrt{3}}{3} = 2\\sqrt{3}$.",
        },
        {
          id: `q-${bab.id}-5`,
          tipe: "esai",
          pertanyaan:
            "Sebuah partikel memiliki massa $0,0000456\\text{ kg}$. Tuliskan massa partikel tersebut ke dalam bentuk notasi ilmiah baku beserta langkah penyederhanaannya!",
          kunciJawaban:
            "$4,56 \\times 10^{-5}\\text{ kg}$. Tanda koma digeser ke kanan sebanyak 5 kali agar berada di antara 1 dan 10.",
          bobot: 20,
          pembahasan:
            "Bentuk baku notasi ilmiah adalah $a \\times 10^n$ dengan $1 \\le a < 10$. Menggeser tanda koma 5 tempat ke kanan menghasilkan $4,56 \\times 10^{-5}$.",
        },
      ],
    };
  });

  const [editingQuestion, setEditingQuestion] = useState<BabQuizQuestion | null>(null);

  // Global Save State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // Handle Save All Bab Changes
  const handleSaveAll = async () => {
    if (!judul.trim()) {
      alert("Judul bab wajib diisi!");
      return;
    }

    setIsSaving(true);

    const isScheduled = accessMode === "scheduled";
    const isOpen = accessMode === "open";

    const updatedData: EditingBabData = {
      ...bab,
      nomor,
      judul: judul.trim(),
      deskripsi: deskripsi.trim(),
      isOpen,
      isScheduled,
      dueSoonDate: isScheduled ? dueSoonDate : undefined,
      modules,
      features,
      quiz: quizSettings,
    };

    try {
      // 1. Simpan ke database Supabase (PUT /api/guru/bab) jika ada id
      if (bab.supabaseId || (bab.id && bab.id.length > 20)) {
        try {
          await fetch("/api/guru/bab", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: bab.supabaseId || bab.id,
              judul: judul.trim(),
              deskripsi: deskripsi.trim(),
              urutan: nomor,
            }),
          });
        } catch (supabaseErr) {
          console.warn("[Save Bab Supabase Error]:", supabaseErr);
        }
      }

      // 2. Simpan ke localStorage dengan format lengkap
      saveBabDueSoonSettings(bab.id, {
        judul: judul.trim(),
        deskripsi: deskripsi.trim(),
        nomor,
        dueSoonDate,
        isScheduled,
        isOpen,
        supabaseId: bab.supabaseId,
        modules,
        features,
        quiz: quizSettings,
      });

      // 3. Beri feedback dan panggil onSaveSuccess
      setSaveSuccessToast(true);
      setTimeout(() => {
        setSaveSuccessToast(false);
        onSaveSuccess(updatedData);
      }, 1000);
    } catch (err) {
      console.error("[Save Bab Error]:", err);
      alert("Gagal menyimpan bab, silakan periksa koneksi.");
    } finally {
      setIsSaving(false);
    }
  };

  // Sub-Materi Actions
  const handleOpenAddModule = () => {
    const nextUrutan = modules.length + 1;
    setEditingModule({
      id: `${bab.id}-mod-${Date.now()}`,
      urutan: nextUrutan,
      judul: `Materi ${nextUrutan}: `,
      durasiMenit: 20,
      konten_markdown: `# Materi ${nextUrutan}\n\nTuliskan penjelasan materi lengkap di sini...`,
      isOpen: true,
    });
    setSubScreenMode("edit_module");
  };

  const handleSaveModule = (mod: BabSubMateri) => {
    setModules((prev) => {
      const exists = prev.some((m) => m.id === mod.id);
      if (exists) {
        return prev.map((m) => (m.id === mod.id ? mod : m));
      }
      return [...prev, mod];
    });
    setSubScreenMode("none");
    setEditingModule(null);
  };

  const handleDeleteModule = (modId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus materi ini dari bab?")) {
      setModules((prev) => prev.filter((m) => m.id !== modId));
    }
  };

  const handleToggleModuleStatus = (modId: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === modId ? { ...m, isOpen: !m.isOpen } : m))
    );
  };

  // Butir Soal Kuis Actions
  const handleOpenAddQuestion = () => {
    const nextNum = quizSettings.questions.length + 1;
    setEditingQuestion({
      id: `q-${bab.id}-${Date.now()}`,
      tipe: "pilihan_ganda",
      pertanyaan: `Pertanyaan Soal ${nextNum}: `,
      opsi: ["A. ", "B. ", "C. ", "D. "],
      kunciJawaban: "A",
      bobot: 20,
      pembahasan: "",
    });
    setSubScreenMode("edit_question");
  };

  const handleSaveQuestion = (q: BabQuizQuestion) => {
    setQuizSettings((prev) => {
      const exists = prev.questions.some((item) => item.id === q.id);
      let updatedQuestions: BabQuizQuestion[];
      if (exists) {
        updatedQuestions = prev.questions.map((item) => (item.id === q.id ? q : item));
      } else {
        updatedQuestions = [...prev.questions, q];
      }
      return {
        ...prev,
        questions: updatedQuestions,
      };
    });
    setSubScreenMode("none");
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (confirm("Hapus butir soal kuis ini?")) {
      setQuizSettings((prev) => ({
        ...prev,
        questions: prev.questions.filter((item) => item.id !== qId),
      }));
    }
  };

  // ─── SUB-SCREEN 1: EDITOR SUB-MATERI (NORMAL SCREEN) ───────────────────────
  if (subScreenMode === "edit_module" && editingModule) {
    return (
      <SubMateriNormalEditorScreen
        module={editingModule}
        babNomor={nomor}
        babJudul={judul}
        subjectName={subjectName}
        classNameTitle={classNameTitle}
        onSave={handleSaveModule}
        onBack={() => {
          setSubScreenMode("none");
          setEditingModule(null);
        }}
      />
    );
  }

  // ─── SUB-SCREEN 2: EDITOR BUTIR SOAL KUIS (NORMAL SCREEN) ──────────────────
  if (subScreenMode === "edit_question" && editingQuestion) {
    const qIndex = quizSettings.questions.findIndex((item) => item.id === editingQuestion.id);
    return (
      <QuestionNormalEditorScreen
        question={editingQuestion}
        questionNumber={qIndex >= 0 ? qIndex + 1 : quizSettings.questions.length + 1}
        babNomor={nomor}
        babJudul={judul}
        subjectName={subjectName}
        classNameTitle={classNameTitle}
        onSave={handleSaveQuestion}
        onBack={() => {
          setSubScreenMode("none");
          setEditingQuestion(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150 pb-20">
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 1. TOP HEADER & BREADCRUMBS                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button
            type="button"
            onClick={onBack}
            className="text-slate-600 hover:text-[#1967D2] transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Kelas</span>
          </button>
          <span>/</span>
          <span className="text-slate-600 truncate max-w-[200px]">
            {classNameTitle}
          </span>
          <span>/</span>
          <span className="text-[#1967D2] font-bold">
            Edit Bab Pembelajaran (Normal Screen)
          </span>
        </div>

        {/* Title Bar & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#1967D2] flex items-center justify-center font-black text-lg shadow-xs shrink-0">
              {nomor}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Edit Bab: {judul || `Bab ${nomor}`}
                </h1>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    accessMode === "open"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : accessMode === "scheduled"
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }`}
                >
                  {accessMode === "open"
                    ? "✓ Terbuka Langsung"
                    : accessMode === "scheduled"
                    ? "⏱️ Terjadwal Due Soon"
                    : "🔒 Terkunci Manual"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Kelola materi pokok, jadwal rilis Due Soon, kontrol AI Tutor, serta bank soal kuis bab.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onBack}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#1967D2] hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan Seluruh Perubahan...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan Bab</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB NAVIGATION BAR (4 TABS LENGKAP & FOKUS)                           */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          {[
            {
              id: "info",
              label: "1. Info & Jadwal Due Soon",
              icon: Clock,
              badge: accessMode === "scheduled" ? "Terjadwal" : undefined,
            },
            {
              id: "materi",
              label: "2. Isi Materi Bab",
              icon: BookOpen,
              count: modules.length,
            },
            {
              id: "features",
              label: "3. Kontrol Fitur & AI Bab",
              icon: Bot,
              badge: features.aiEnabled ? "AI Aktif" : "AI Nonaktif",
            },
            {
              id: "quiz",
              label: "4. Kontrol Kuis Bab",
              icon: Award,
              count: quizSettings.questions.length,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[#1967D2] text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive ? "bg-white/20 text-white" : "bg-white text-slate-700 border border-slate-200"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-amber-100 text-amber-900 border border-amber-200"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast Feedback Sukses */}
      {saveSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#041E49] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-400/30 animate-in slide-in-from-bottom duration-200">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div>
            <div className="text-xs font-bold">Perubahan Bab Berhasil Disimpan!</div>
            <div className="text-[11px] text-slate-300">
              Seluruh materi, jadwal Due Soon, fitur AI, dan kuis telah disinkronkan ke siswa.
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: INFORMASI POKOK & JADWAL DUE SOON                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Form Informasi Bab & Scheduler (7 Kolom) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card: Informasi Utama Bab */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <BookOpen className="w-5 h-5 text-[#1967D2]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Informasi & Identitas Bab
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Urutan Bab *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={nomor}
                    onChange={(e) => setNomor(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1967D2] focus:ring-2 focus:ring-blue-100 text-center"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Judul Bab Pembelajaran *
                  </label>
                  <input
                    type="text"
                    required
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Contoh: Bab 1: Bilangan Berpangkat & Bentuk Akar"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1967D2] focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Deskripsi / Capaian Pembelajaran (CP) Fase D
                </label>
                <textarea
                  rows={4}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Ringkasan kompetensi, capaian pembelajaran, atau tujuan materi pokok bab ini..."
                  className="w-full text-xs font-medium p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1967D2] focus:ring-2 focus:ring-blue-100 transition resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Card: Pengaturan Status Akses & Due Soon */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Pengaturan Status Akses & Due Soon Siswa
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tentukan kapan bab ini dapat diakses oleh siswa di dashboard mereka.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Mode Akses */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Buka Sekarang */}
                <button
                  type="button"
                  onClick={() => {
                    setAccessMode("open");
                    setPreviewSimulation("open");
                  }}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    accessMode === "open"
                      ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-300 shadow-2xs"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        accessMode === "open"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Unlock className="w-4 h-4" />
                    </div>
                    {accessMode === "open" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">Buka Sekarang</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Siswa langsung bisa membuka dan membaca bab ini
                    </div>
                  </div>
                </button>

                {/* 2. Jadwalkan Due Soon */}
                <button
                  type="button"
                  onClick={() => {
                    setAccessMode("scheduled");
                    setPreviewSimulation("locked");
                  }}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    accessMode === "scheduled"
                      ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-300 shadow-2xs"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        accessMode === "scheduled"
                          ? "bg-amber-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-200 text-amber-900">
                      Due Soon
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      Jadwalkan Due Soon
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Terkunci abu-abu di siswa sampai tanggal rilis tiba
                    </div>
                  </div>
                </button>

                {/* 3. Terkunci Manual */}
                <button
                  type="button"
                  onClick={() => {
                    setAccessMode("locked");
                    setPreviewSimulation("locked");
                  }}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    accessMode === "locked"
                      ? "bg-slate-100 border-slate-400 ring-2 ring-slate-300 shadow-2xs"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        accessMode === "locked"
                          ? "bg-slate-800 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                    </div>
                    {accessMode === "locked" && (
                      <CheckCircle2 className="w-4 h-4 text-slate-700" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">Terkunci Manual</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Akses ditutup sampai guru membuka secara manual
                    </div>
                  </div>
                </button>
              </div>

              {/* Jika Mode Scheduled: Tampilkan Form Pemilih Tanggal & Waktu Lengkap */}
              {accessMode === "scheduled" && (
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <Calendar className="w-4 h-4 text-amber-700" />
                    <span>Konfigurasi Waktu Rilis Otomatis (Hari, Tanggal, Jam WIB):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                        Tanggal Rilis (Hari, Tanggal, Bulan, Tahun)
                      </label>
                      <input
                        type="date"
                        value={datePart}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                        Jam Rilis (WIB)
                      </label>
                      <input
                        type="time"
                        value={timePart}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Preset Waktu Cepat */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                      Pilihan Preset Waktu Cepat:
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => applyPreset(1, 7, 30)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 transition cursor-pointer"
                      >
                        Besok Pagi (07:30 WIB)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset(3, 8, 0)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 transition cursor-pointer"
                      >
                        3 Hari Lagi (08:00 WIB)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset(7, 7, 30)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 transition cursor-pointer"
                      >
                        1 Pekan Lagi (07:30 WIB)
                      </button>
                    </div>
                  </div>

                  {/* Rangkuman Jadwal Rilis Terpilih */}
                  <div className="p-3 bg-white/90 rounded-xl border border-amber-300/80 text-xs text-amber-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Jadwal Terpilih: <strong>{dueInfo.full}</strong>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                      {dueInfo.remainingText}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Pratinjau Interaktif Dashboard Siswa (5 Kolom) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Eye className="w-4 h-4 text-[#1967D2]" />
                  <span>Pratinjau Nyata di Dashboard Siswa</span>
                </div>
              </div>

              {/* Simulasi Toggle Preview */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 text-xs">
                <span className="font-semibold text-slate-600 pl-1">
                  Simulasikan Tampilan Siswa:
                </span>
                <div className="inline-flex rounded-lg bg-white p-0.5 border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setPreviewSimulation("locked")}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      previewSimulation === "locked"
                        ? "bg-slate-800 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Saat Belum Rilis (Abu-abu)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewSimulation("open")}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      previewSimulation === "open"
                        ? "bg-[#1967D2] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Saat Waktu Tiba (Aktif)
                  </button>
                </div>
              </div>

              {/* Tampilan Visual Kartu Siswa */}
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tampilan di Bagian &quot;Due Soon&quot; Siswa:
                </div>

                {previewSimulation === "locked" ? (
                  // Kartu Saat Terkunci Abu-Abu (Unclickable)
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 select-none cursor-not-allowed shadow-2xs space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-600 truncate">
                            {judul || `Bab ${nomor}`}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-500">
                            Bab {nomor}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {subjectName} (Kelas 8) • Bab {nomor}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Rilis: {accessMode === "scheduled" ? dueInfo.dayDate : "Menunggu Guru"}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-500">
                        🔒 Belum Dibuka
                      </span>
                    </div>
                  </div>
                ) : (
                  // Kartu Saat Aktif / Terbuka
                  <div className="p-4 rounded-2xl bg-white border border-blue-200 text-slate-800 shadow-sm hover:border-blue-400 transition cursor-pointer space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1967D2] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {judul || `Bab ${nomor}`}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                            ✨ Tersedia
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {subjectName} (Kelas 8) • Bab {nomor}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Akses Dibuka: {dueInfo.dayDate}</span>
                      </div>
                      <span className="text-[#1967D2] font-bold">Siap Dipelajari</span>
                    </div>

                    <button
                      type="button"
                      className="w-full py-2 rounded-xl bg-[#1967D2] hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>Masuk ke Kelas & Pelajari Bab Ini</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Notifikasi Realtime Supabase */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Integrasi Realtime Thinksy</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Saat disimpan, konfigurasi ini otomatis disinkronkan ke tabel <strong>bab</strong> Supabase
                  dan dashboard seluruh siswa tanpa perlu refresh halaman.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: ISI & MATERI PEMBELAJARAN (SUB-BAB)                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "materi" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#1967D2]" />
                  <span>Daftar Sub-Materi & Modul Bacaan ({modules.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola modul bacaan siswa, rumus matematika, durasi belajar, serta status akses per sub-materi.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddModule}
                className="px-4 py-2.5 rounded-xl bg-[#1967D2] hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Sub-Materi Baru</span>
              </button>
            </div>

            {/* List Materi */}
            {modules.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <p className="text-xs font-medium">Belum ada modul materi dalam bab ini.</p>
                <button
                  type="button"
                  onClick={handleOpenAddModule}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 transition cursor-pointer"
                >
                  + Tambah Materi Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((m, idx) => (
                  <div
                    key={m.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs group"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1967D2] border border-blue-200/80 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs group-hover:scale-105 transition">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-700 transition">
                            {m.judul}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {typeof m.durasiMenit === "number" && m.durasiMenit > 0
                              ? `⏱️ ${m.durasiMenit} Menit`
                              : "⏱️ Bebas (Off)"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              m.isOpen
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {m.isOpen ? "✓ Terbuka" : "🔒 Terkunci"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 font-mono">
                          {m.konten_markdown.slice(0, 140)}...
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleModuleStatus(m.id)}
                        title={m.isOpen ? "Kunci materi ini sementara" : "Buka materi ini untuk siswa"}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                          m.isOpen
                            ? "bg-slate-100 hover:bg-amber-50 text-slate-700 border-slate-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {m.isOpen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span>{m.isOpen ? "Kunci" : "Buka"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingModule(m);
                          setSubScreenMode("edit_module");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Isi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteModule(m.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition cursor-pointer"
                        title="Hapus Materi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: KONTROL FITUR BAB & AI TUTOR SISWA                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "features" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Panel Utama: Kontrol AI Tutor Sokratik di Bab Ini (8 Kolom) */}
            <div className="md:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Kontrol AI Tutor Sokratik Bab Ini</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        Thinksy AI
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Atur apakah siswa dapat bertanya ke asisten AI Tutor saat mempelajari materi bab ini.
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={features.aiEnabled}
                    onChange={(e) => setFeatures({ ...features, aiEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {features.aiEnabled ? (
                <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                  {/* Gaya Bimbingan AI */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                      Gaya Bimbingan AI di Bab Ini
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: "sokratik",
                          title: "Sokratik Murni (Rekomendasi)",
                          desc: "Menuntun dengan pertanyaan pemantik, tidak langsung memberi jawaban akhir.",
                        },
                        {
                          id: "adaptif",
                          title: "Tutor Adaptif",
                          desc: "Menyesuaikan penjelasan bertahap sesuai tingkat kesulitan siswa.",
                        },
                        {
                          id: "penjelasan",
                          title: "Penjelasan Lengkap",
                          desc: "Menjelaskan konsep secara menyeluruh beserta contoh soal langkah demi langkah.",
                        },
                      ].map((mode) => {
                        const isSelected = features.aiMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setFeatures({ ...features, aiMode: mode.id as any })}
                            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? "bg-purple-50/80 border-purple-400 ring-2 ring-purple-200"
                                : "bg-white border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <div className="font-bold text-xs text-slate-900 mb-1">{mode.title}</div>
                            <div className="text-[11px] text-slate-500 leading-relaxed">{mode.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Batasan Kuota Token / Pertanyaan Siswa di Bab Ini */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                      Batasan Pertanyaan / Token AI Siswa di Bab Ini
                    </label>
                    <select
                      value={features.aiTokenLimit}
                      onChange={(e) =>
                        setFeatures({ ...features, aiTokenLimit: parseInt(e.target.value, 10) })
                      }
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 bg-white"
                    >
                      <option value={0}>Bebas (Tanpa Batasan Pertanyaan)</option>
                      <option value={20}>Standar (Maksimal 20 Pertanyaan per Siswa) - Rekomendasi</option>
                      <option value={10}>Sedang (Maksimal 10 Pertanyaan per Siswa)</option>
                      <option value={5}>Ketat (Maksimal 5 Pertanyaan per Siswa)</option>
                    </select>
                  </div>

                  {/* Instruksi Khusus Guru untuk AI di Bab Ini */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                      Instruksi Tambahan Guru untuk AI (System Directive Bab Ini)
                    </label>
                    <textarea
                      rows={3}
                      value={features.aiCustomPrompt}
                      onChange={(e) => setFeatures({ ...features, aiCustomPrompt: e.target.value })}
                      placeholder='Contoh: "Bimbing siswa fokus pada sifat eksponen perkalian dan pembagian. Jika siswa bertanya soal bentuk akar, ajak mereka memfaktorkan bilangan kuadrat terlebih dahulu."'
                      className="w-full text-xs font-medium p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                  AI Tutor dinonaktifkan khusus untuk bab ini. Siswa akan belajar murni secara mandiri melalui teks materi yang tersedia.
                </div>
              )}
            </div>

            {/* Panel Kanan: Fitur Jurnal & Diskusi Siswa (4 Kolom) */}
            <div className="md:col-span-4 space-y-4">
              {/* Catatan & Stabilo Digital Siswa */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold text-slate-900">Catatan & Stabilo Siswa</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={features.notesEnabled}
                      onChange={(e) =>
                        setFeatures({ ...features, notesEnabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Izinkan siswa menyeleksi bacaan, menandai stabilo aneka warna, dan menyalin kutipan ke buku catatan digital mereka.
                </p>
              </div>

              {/* Forum Diskusi Materi */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900">Diskusi Materi Bab</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={features.discussionEnabled}
                      onChange={(e) =>
                        setFeatures({ ...features, discussionEnabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Buka forum tanya-jawab dan diskusi antarteman sekelas khusus materi bab ini di bawah pantauan guru.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: KONTROL KUIS BAB & BANK BUTIR SOAL                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "quiz" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Panel Parameter Kuis Bab */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pengaturan Utama Kuis Bab
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Konfigurasi kuis pemahaman materi, KKM, durasi waktu, serta batasan token AI saat kuis.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Status Kuis Bab
                </label>
                <select
                  value={quizSettings.isOpen ? "open" : "locked"}
                  onChange={(e) =>
                    setQuizSettings({ ...quizSettings, isOpen: e.target.value === "open" })
                  }
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="open">✓ Buka Langsung untuk Siswa</option>
                  <option value="locked">🔒 Terkunci Sementara</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  KKM / Passing Grade
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={quizSettings.passingGrade}
                  onChange={(e) =>
                    setQuizSettings({
                      ...quizSettings,
                      passingGrade: parseInt(e.target.value, 10) || 75,
                    })
                  }
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 text-center"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Durasi Pengerjaan
                </label>
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={quizSettings.durationMinutes}
                  onChange={(e) =>
                    setQuizSettings({
                      ...quizSettings,
                      durationMinutes: parseInt(e.target.value, 10) || 30,
                    })
                  }
                  placeholder="30 Menit"
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 text-center"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Acak Urutan Soal
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setQuizSettings({
                      ...quizSettings,
                      shuffleQuestions: !quizSettings.shuffleQuestions,
                    })
                  }
                  className={`w-full py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${
                    quizSettings.shuffleQuestions
                      ? "bg-blue-50 text-blue-700 border-blue-300"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>{quizSettings.shuffleQuestions ? "Ya (Acak Soal)" : "Tidak"}</span>
                </button>
              </div>
            </div>

            {/* Aturan Khusus AI Tutor saat Kuis Berlangsung (Fitur Utama yang diminta) */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Bot className="w-4 h-4 text-amber-700" />
                <span>Pengaturan Khusus AI Tutor Saat Kuis Berlangsung:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "disabled",
                    title: "Tanpa AI Tutor (Ujian Murni)",
                    desc: "Siswa sama sekali tidak dapat memanggil AI saat kuis berlangsung.",
                  },
                  {
                    id: "hint_only",
                    title: "AI Dibatasi (Rekomendasi)",
                    desc: "AI hanya memberi 1-2 hint logika, dilarang keras membocorkan jawaban.",
                  },
                  {
                    id: "unlimited",
                    title: "AI Bebas (Latihan Terbuka)",
                    desc: "AI Tutor bebas mendampingi selama pengerjaan kuis latihan.",
                  },
                ].map((opt) => {
                  const isSelected = quizSettings.aiQuizMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setQuizSettings({ ...quizSettings, aiQuizMode: opt.id as any })
                      }
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? "bg-amber-100/90 border-amber-400 ring-2 ring-amber-300 font-bold"
                          : "bg-white border-amber-200 hover:bg-amber-50"
                      }`}
                    >
                      <div className="text-xs text-amber-950 font-bold mb-0.5">{opt.title}</div>
                      <div className="text-[11px] text-amber-900/80 leading-relaxed">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>

              {quizSettings.aiQuizMode === "hint_only" && (
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <span className="font-bold text-amber-900">Batas Token / Pertanyaan Kuis:</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={quizSettings.aiQuizTokenLimit}
                    onChange={(e) =>
                      setQuizSettings({
                        ...quizSettings,
                        aiQuizTokenLimit: parseInt(e.target.value, 10) || 2,
                      })
                    }
                    className="w-16 px-2 py-1 text-xs font-bold text-center rounded-lg bg-white border border-amber-300"
                  />
                  <span className="text-[11px] text-amber-800">kali kesempatan bertanya per kuis</span>
                </div>
              )}
            </div>
          </div>

          {/* Panel Daftar Butir Soal Kuis Bab */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  <span>Daftar Butir Soal Kuis ({quizSettings.questions.length} Butir Soal)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total skor kumulatif:{" "}
                  <strong>
                    {quizSettings.questions.reduce((sum, q) => sum + (q.bobot || 20), 0)} Poin
                  </strong>
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddQuestion}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Butir Soal Baru</span>
              </button>
            </div>

            {quizSettings.questions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <p className="text-xs font-medium">Belum ada butir soal dalam kuis bab ini.</p>
                <button
                  type="button"
                  onClick={handleOpenAddQuestion}
                  className="px-4 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold border border-amber-200 transition cursor-pointer"
                >
                  + Buat Soal Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {quizSettings.questions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 transition-all space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xs">
                          {qIdx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {q.tipe === "pilihan_ganda" ? "Pilihan Ganda" : "Esai"}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Bobot: {q.bobot} Poin
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestion(q);
                            setSubScreenMode("edit_question");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                          title="Hapus Soal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Pertanyaan */}
                    <div className="text-xs font-semibold text-slate-800 leading-relaxed font-sans">
                      <MarkdownRenderer content={q.pertanyaan} isCompact />
                    </div>

                    {/* Opsi Jawaban Jika Pilihan Ganda */}
                    {q.tipe === "pilihan_ganda" && q.opsi && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.opsi.map((op, opIdx) => {
                          const optionLetter = ["A", "B", "C", "D"][opIdx] || "A";
                          const isKey = q.kunciJawaban.toUpperCase().includes(optionLetter);
                          return (
                            <div
                              key={opIdx}
                              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                                isKey
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                                  : "bg-slate-50/80 border-slate-200 text-slate-700 font-medium"
                              }`}
                            >
                              {isKey ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {optionLetter}
                                </span>
                              )}
                              <div className="flex-1 min-w-0">
                                <MarkdownRenderer content={op} isCompact />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Kunci Jawaban Esai */}
                    {q.tipe === "esai" && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <strong className="text-emerald-700 block mb-1">Kunci Pedoman: </strong>
                        <MarkdownRenderer content={q.kunciJawaban} isCompact />
                      </div>
                    )}

                    {/* Pembahasan */}
                    {q.pembahasan && (
                      <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-[11px] text-blue-900">
                        <strong className="block mb-1">💡 Pembahasan Soal: </strong>
                        <MarkdownRenderer content={q.pembahasan} isCompact />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-screens (Editor Sub-Materi & Editor Soal Kuis) are rendered as full normal screens at the top */}
    </div>
  );
}
