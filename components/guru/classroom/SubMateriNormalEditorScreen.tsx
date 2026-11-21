"use client";

import { useState, useRef, useMemo } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Eye,
  Clock,
  Sparkles,
  Play,
  ExternalLink,
  Code,
  List,
  ListOrdered,
  Bold,
  Italic,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  HelpCircle,
  Video,
  Lock,
  Unlock,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Monitor,
  Smartphone,
  Wand2,
  Bot,
  Loader2,
  RefreshCw,
  X,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";
import type { BabSubMateri } from "./EditBabNormalScreen";

interface SubMateriNormalEditorScreenProps {
  module: BabSubMateri;
  babNomor: number;
  babJudul: string;
  subjectName?: string;
  classNameTitle?: string;
  onSave: (updated: BabSubMateri) => void;
  onBack: () => void;
}

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown & LaTeX Helper Formatting Functions
// ─────────────────────────────────────────────────────────────────────────────
function getLineRange(text: string, start: number, end: number) {
  const lineStart = text.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  let lineEnd = text.indexOf("\n", end);
  if (lineEnd === -1) lineEnd = text.length;
  return { lineStart, lineEnd };
}

function formatHeading(text: string, start: number, end: number, level: 1 | 2 | 3) {
  const { lineStart, lineEnd } = getLineRange(text, start, end);
  const chunk = text.substring(lineStart, lineEnd);
  const lines = chunk.split("\n");
  const prefix = "#".repeat(level) + " ";

  const newLines = lines.map((line) => {
    const headingMatch = line.match(/^(#{1,6}\s+)/);
    if (headingMatch) {
      if (headingMatch[1] === prefix) {
        return line.substring(headingMatch[1].length);
      } else {
        return prefix + line.substring(headingMatch[1].length);
      }
    }
    return prefix + line;
  });

  const newChunk = newLines.join("\n");
  const newText = text.substring(0, lineStart) + newChunk + text.substring(lineEnd);
  const cursorOffset = newChunk.length - chunk.length;
  return {
    newText,
    newStart: Math.max(lineStart, start + (lineStart === start ? prefix.length : cursorOffset)),
    newEnd: Math.max(lineStart, end + cursorOffset),
  };
}

function formatBold(text: string, start: number, end: number) {
  if (start !== end) {
    const selected = text.substring(start, end);

    // 1. If text immediately outside the selection is already **
    const before2 = text.substring(Math.max(0, start - 2), start);
    const after2 = text.substring(end, end + 2);
    if (before2 === "**" && after2 === "**") {
      // Toggle off / unbold
      return {
        newText: text.substring(0, start - 2) + selected + text.substring(end + 2),
        newStart: start - 2,
        newEnd: end - 2,
      };
    }

    // 2. If selection itself starts & ends with **
    if (selected.startsWith("**") && selected.endsWith("**") && selected.length >= 4) {
      const unbolded = selected.slice(2, -2);
      return {
        newText: text.substring(0, start) + unbolded + text.substring(end),
        newStart: start,
        newEnd: start + unbolded.length,
      };
    }

    // 3. Trim leading & trailing whitespace so asterisks are placed tightly around text
    const leadingMatch = selected.match(/^(\s*)/);
    const trailingMatch = selected.match(/(\s*)$/);
    const leading = leadingMatch ? leadingMatch[1] : "";
    const trailing = trailingMatch ? trailingMatch[1] : "";
    const core = selected.substring(leading.length, selected.length - trailing.length);

    if (!core) {
      return { newText: text, newStart: start, newEnd: end };
    }

    // If core itself was already bold:
    if (core.startsWith("**") && core.endsWith("**") && core.length >= 4) {
      const unbolded = core.slice(2, -2);
      const rep = leading + unbolded + trailing;
      return {
        newText: text.substring(0, start) + rep + text.substring(end),
        newStart: start + leading.length,
        newEnd: start + leading.length + unbolded.length,
      };
    }

    const bolded = `${leading}**${core}**${trailing}`;
    return {
      newText: text.substring(0, start) + bolded + text.substring(end),
      newStart: start + leading.length,
      newEnd: start + leading.length + core.length + 4,
    };
  } else {
    const placeholder = "teks tebal";
    const ins = `**${placeholder}**`;
    return {
      newText: text.substring(0, start) + ins + text.substring(end),
      newStart: start + 2,
      newEnd: start + 2 + placeholder.length,
    };
  }
}

function formatItalic(text: string, start: number, end: number) {
  if (start !== end) {
    const selected = text.substring(start, end);

    const before1 = text.substring(Math.max(0, start - 1), start);
    const after1 = text.substring(end, end + 1);
    const before2 = text.substring(Math.max(0, start - 2), start);
    const after2 = text.substring(end, end + 2);

    if (before1 === "*" && after1 === "*" && before2 !== "**" && after2 !== "**") {
      // Toggle off / unitalic
      return {
        newText: text.substring(0, start - 1) + selected + text.substring(end + 1),
        newStart: start - 1,
        newEnd: end - 1,
      };
    }

    if (selected.startsWith("*") && selected.endsWith("*") && !selected.startsWith("**") && selected.length >= 2) {
      const unitalic = selected.slice(1, -1);
      return {
        newText: text.substring(0, start) + unitalic + text.substring(end),
        newStart: start,
        newEnd: start + unitalic.length,
      };
    }

    const leadingMatch = selected.match(/^(\s*)/);
    const trailingMatch = selected.match(/(\s*)$/);
    const leading = leadingMatch ? leadingMatch[1] : "";
    const trailing = trailingMatch ? trailingMatch[1] : "";
    const core = selected.substring(leading.length, selected.length - trailing.length);

    if (!core) {
      return { newText: text, newStart: start, newEnd: end };
    }

    if (core.startsWith("*") && core.endsWith("*") && !core.startsWith("**") && core.length >= 2) {
      const unitalic = core.slice(1, -1);
      const rep = leading + unitalic + trailing;
      return {
        newText: text.substring(0, start) + rep + text.substring(end),
        newStart: start + leading.length,
        newEnd: start + leading.length + unitalic.length,
      };
    }

    const italic = `${leading}*${core}*${trailing}`;
    return {
      newText: text.substring(0, start) + italic + text.substring(end),
      newStart: start + leading.length,
      newEnd: start + leading.length + core.length + 2,
    };
  } else {
    const placeholder = "teks miring";
    const ins = `*${placeholder}*`;
    return {
      newText: text.substring(0, start) + ins + text.substring(end),
      newStart: start + 1,
      newEnd: start + 1 + placeholder.length,
    };
  }
}

function formatBlockquote(text: string, start: number, end: number) {
  const { lineStart, lineEnd } = getLineRange(text, start, end);
  const chunk = text.substring(lineStart, lineEnd);
  const lines = chunk.split("\n");
  const allQuoted = lines.every((l) => l.startsWith("> "));

  let newLines: string[];
  if (allQuoted) {
    newLines = lines.map((l) => l.replace(/^>\s?/, ""));
  } else {
    newLines = lines.map((l) => (l.trim() ? "> " + l.replace(/^>\s?/, "") : "> "));
  }
  const newChunk = newLines.join("\n");
  return {
    newText: text.substring(0, lineStart) + newChunk + text.substring(lineEnd),
    newStart: lineStart,
    newEnd: lineStart + newChunk.length,
  };
}

function formatCode(text: string, start: number, end: number) {
  if (start !== end) {
    const selected = text.substring(start, end);
    if (selected.includes("\n")) {
      const code = "```\n" + selected + "\n```";
      return {
        newText: text.substring(0, start) + code + text.substring(end),
        newStart: start + 4,
        newEnd: start + 4 + selected.length,
      };
    } else {
      const code = "`" + selected + "`";
      return {
        newText: text.substring(0, start) + code + text.substring(end),
        newStart: start + 1,
        newEnd: start + 1 + selected.length,
      };
    }
  } else {
    const placeholder = "kode atau rumus";
    const code = "```\n" + placeholder + "\n```";
    return {
      newText: text.substring(0, start) + code + text.substring(end),
      newStart: start + 4,
      newEnd: start + 4 + placeholder.length,
    };
  }
}

function formatList(text: string, start: number, end: number, type: "bullet" | "numbered") {
  const { lineStart, lineEnd } = getLineRange(text, start, end);
  const chunk = text.substring(lineStart, lineEnd);
  const lines = chunk.split("\n");

  if (type === "bullet") {
    const allBullet = lines.every((l) => /^(\s*[-*]\s+)/.test(l));
    const newLines = allBullet
      ? lines.map((l) => l.replace(/^(\s*)[-*]\s+/, "$1"))
      : lines.map((l) => (l.trim() ? "- " + l.replace(/^(\s*)[-*]\s+/, "") : "- "));
    const newChunk = newLines.join("\n");
    return {
      newText: text.substring(0, lineStart) + newChunk + text.substring(lineEnd),
      newStart: lineStart,
      newEnd: lineStart + newChunk.length,
    };
  } else {
    const allNumbered = lines.every((l) => /^\s*\d+\.\s+/.test(l));
    const newLines = allNumbered
      ? lines.map((l) => l.replace(/^(\s*)\d+\.\s+/, "$1"))
      : lines.map((l, idx) => (l.trim() ? `${idx + 1}. ` + l.replace(/^(\s*)\d+\.\s+/, "") : `${idx + 1}. `));
    const newChunk = newLines.join("\n");
    return {
      newText: text.substring(0, lineStart) + newChunk + text.substring(lineEnd),
      newStart: lineStart,
      newEnd: lineStart + newChunk.length,
    };
  }
}

function formatMathInline(text: string, start: number, end: number) {
  if (start !== end) {
    const selected = text.substring(start, end);
    if (selected.startsWith("$") && selected.endsWith("$") && selected.length >= 2) {
      const unmath = selected.slice(1, -1);
      return {
        newText: text.substring(0, start) + unmath + text.substring(end),
        newStart: start,
        newEnd: start + unmath.length,
      };
    }
    const math = `$${selected}$`;
    return {
      newText: text.substring(0, start) + math + text.substring(end),
      newStart: start,
      newEnd: start + math.length,
    };
  } else {
    const placeholder = "x^2";
    const math = `$${placeholder}$`;
    return {
      newText: text.substring(0, start) + math + text.substring(end),
      newStart: start + 1,
      newEnd: start + 1 + placeholder.length,
    };
  }
}

function formatMathBlock(text: string, start: number, end: number) {
  if (start !== end) {
    const selected = text.substring(start, end);
    const math = `$$\n${selected}\n$$`;
    return {
      newText: text.substring(0, start) + math + text.substring(end),
      newStart: start + 3,
      newEnd: start + 3 + selected.length,
    };
  } else {
    const placeholder = "a^2 + b^2 = c^2";
    const math = `$$\n${placeholder}\n$$`;
    return {
      newText: text.substring(0, start) + math + text.substring(end),
      newStart: start + 3,
      newEnd: start + 3 + placeholder.length,
    };
  }
}

function formatFraction(text: string, start: number, end: number) {
  if (start !== end) {
    const selected = text.substring(start, end);
    const frac = `\\frac{${selected}}{b}`;
    return {
      newText: text.substring(0, start) + frac + text.substring(end),
      newStart: start + 6 + selected.length + 1,
      newEnd: start + 6 + selected.length + 2,
    };
  } else {
    const frac = `$\\frac{a}{b}$`;
    return {
      newText: text.substring(0, start) + frac + text.substring(end),
      newStart: start + 7,
      newEnd: start + 8,
    };
  }
}

function formatSqrt(text: string, start: number, end: number) {
  if (start !== end) {
    const selected = text.substring(start, end);
    const sqrt = `\\sqrt{${selected}}`;
    return {
      newText: text.substring(0, start) + sqrt + text.substring(end),
      newStart: start,
      newEnd: start + sqrt.length,
    };
  } else {
    const sqrt = `$\\sqrt{x}$`;
    return {
      newText: text.substring(0, start) + sqrt + text.substring(end),
      newStart: start + 7,
      newEnd: start + 8,
    };
  }
}

function formatTimes(text: string, start: number, end: number) {
  const textBefore = text.substring(0, start);
  const dollarCount = (textBefore.match(/\$/g) || []).length;
  const isInsideMath = dollarCount % 2 === 1;

  const ins = isInsideMath ? " \\times " : " $\\times$ ";
  return {
    newText: text.substring(0, start) + ins + text.substring(end),
    newStart: start + ins.length,
    newEnd: start + ins.length,
  };
}

export default function SubMateriNormalEditorScreen({
  module,
  babNomor,
  babJudul,
  subjectName = "Matematika",
  classNameTitle = "Matematika (Kelas 8)",
  onSave,
  onBack,
}: SubMateriNormalEditorScreenProps) {
  // Form State
  const [judul, setJudul] = useState(module.judul || "");
  const [durasiMenit, setDurasiMenit] = useState<number>(
    typeof module.durasiMenit === "number" ? module.durasiMenit : 20
  );
  const [urutan, setUrutan] = useState<number>(module.urutan || 1);
  const [kontenMarkdown, setKontenMarkdown] = useState<string>(
    module.konten_markdown || ""
  );
  const [videoUrl, setVideoUrl] = useState<string>(module.videoUrl || "");
  const [isOpen, setIsOpen] = useState<boolean>(module.isOpen !== false);

  // UI state
  const [activeMobileView, setActiveMobileView] = useState<"editor" | "preview">("editor");
  const [showLatexGuide, setShowLatexGuide] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeCardTab, setActiveCardTab] = useState<"editor" | "preview">("editor");
  const [formatNotice, setFormatNotice] = useState<string | null>(null);

  // ══════════════════════════════════════════════════════════════════════════
  // AI MATERIAL GENERATOR STATE & HANDLERS
  // ══════════════════════════════════════════════════════════════════════════
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopik, setAiTopik] = useState(module.judul || babJudul || "");
  const [aiGayaBelajar, setAiGayaBelajar] = useState<
    "konseptual_sokratik" | "praktis_studi_kasus" | "komprehensif_buku_teks" | "ringkas_latihan"
  >("konseptual_sokratik");
  const [aiDurasi, setAiDurasi] = useState<number>(durasiMenit || 25);
  const [aiElemen, setAiElemen] = useState<string[]>([
    "tujuan",
    "analogi",
    "konsep",
    "contoh_langkah",
    "miskonsepsi",
    "sokratik",
    "rangkuman",
  ]);
  const [aiInstruksi, setAiInstruksi] = useState("");
  const [aiPlacement, setAiPlacement] = useState<"replace" | "append">("replace");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGeneratedPreview, setAiGeneratedPreview] = useState<{
    judul: string;
    durasiMenit: number;
    ringkasan: string;
    kontenMarkdown: string;
  } | null>(null);

  const handleToggleAiElemen = (item: string) => {
    setAiElemen((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleGenerateAi = async () => {
    const finalTopik = aiTopik.trim() || judul.trim() || babJudul || "Materi Pembelajaran";
    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const res = await fetch("/api/guru/generate-materi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topik: finalTopik,
          babJudul,
          mapel: subjectName,
          kelas: 8,
          durasiMenit: aiDurasi,
          gayaBelajar: aiGayaBelajar,
          elemen: aiElemen,
          instruksiKhusus: aiInstruksi.trim(),
          mode: "single_module",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.module) {
        throw new Error(data.error || "Gagal menyusun materi pembelajaran.");
      }

      setAiGeneratedPreview({
        judul: data.module.judul || finalTopik,
        durasiMenit: data.module.durasiMenit || aiDurasi,
        ringkasan: data.module.ringkasan || "",
        kontenMarkdown: data.module.kontenMarkdown || "",
      });
    } catch (err: any) {
      setAiError(err.message || "Terjadi kendala saat menghubungi asisten AI.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApplyAiContent = () => {
    if (!aiGeneratedPreview) return;

    if (aiPlacement === "replace" || !kontenMarkdown.trim()) {
      setKontenMarkdown(aiGeneratedPreview.kontenMarkdown);
    } else {
      setKontenMarkdown((prev) => prev.trim() + "\n\n" + aiGeneratedPreview.kontenMarkdown);
    }

    if (!judul.trim() || judul === "Sub-Materi Baru") {
      setJudul(aiGeneratedPreview.judul);
    }

    if (durasiMenit === 0 || durasiMenit === 20) {
      setDurasiMenit(aiGeneratedPreview.durasiMenit);
    }

    markDirty();
    showFeedback("✨ Materi AI berhasil diterapkan ke editor!");
    setIsAiModalOpen(false);
    setAiGeneratedPreview(null);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showFeedback = (msg: string) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setFormatNotice(msg);
    noticeTimerRef.current = setTimeout(() => {
      setFormatNotice(null);
    }, 3500);
  };

  // Mark changes
  const markDirty = () => {
    if (!hasUnsavedChanges) setHasUnsavedChanges(true);
  };

  // Formatting Engine for Markdown & LaTeX
  type FormatAction =
    | "h1"
    | "h2"
    | "h3"
    | "bold"
    | "italic"
    | "quote"
    | "code"
    | "bullet"
    | "numbered"
    | "math-inline"
    | "math-block"
    | "fraction"
    | "sqrt"
    | "times";

  const applyFormat = (action: FormatAction) => {
    markDirty();
    const el = textareaRef.current;
    if (!el) return;

    el.focus();
    const text = el.value;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;

    let result: { newText: string; newStart: number; newEnd: number };

    switch (action) {
      case "h1":
        result = formatHeading(text, start, end, 1);
        showFeedback("Format Judul H1 diterapkan (#)");
        break;
      case "h2":
        result = formatHeading(text, start, end, 2);
        showFeedback("Format Sub-Judul H2 diterapkan (##)");
        break;
      case "h3":
        result = formatHeading(text, start, end, 3);
        showFeedback("Format Sub-Judul H3 diterapkan (###)");
        break;
      case "bold":
        result = formatBold(text, start, end);
        showFeedback("Teks diformat menjadi tebal (**kata**)");
        break;
      case "italic":
        result = formatItalic(text, start, end);
        showFeedback("Teks diformat menjadi miring (*kata*)");
        break;
      case "quote":
        result = formatBlockquote(text, start, end);
        showFeedback("Blok kutipan diterapkan (>)");
        break;
      case "code":
        result = formatCode(text, start, end);
        showFeedback("Format kode/rumus diterapkan (```)");
        break;
      case "bullet":
        result = formatList(text, start, end, "bullet");
        showFeedback("Daftar poin bullet diterapkan (-)");
        break;
      case "numbered":
        result = formatList(text, start, end, "numbered");
        showFeedback("Daftar angka diterapkan (1., 2.)");
        break;
      case "math-inline":
        result = formatMathInline(text, start, end);
        showFeedback("Formula matematika inline diterapkan ($...$)");
        break;
      case "math-block":
        result = formatMathBlock(text, start, end);
        showFeedback("Formula matematika blok diterapkan ($$...$$)");
        break;
      case "fraction":
        result = formatFraction(text, start, end);
        showFeedback("Rumus pecahan diterapkan (\\frac{a}{b})");
        break;
      case "sqrt":
        result = formatSqrt(text, start, end);
        showFeedback("Rumus akar kuadrat diterapkan (\\sqrt{x})");
        break;
      case "times":
        result = formatTimes(text, start, end);
        showFeedback("Simbol perkalian matematika diterapkan (\\times)");
        break;
      default:
        return;
    }

    setKontenMarkdown(result.newText);

    // Update native value via prototype descriptor to notify React 19 controlled components
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set;

    if (nativeSetter) {
      nativeSetter.call(el, result.newText);
    } else {
      el.value = result.newText;
    }

    el.dispatchEvent(new Event("input", { bubbles: true }));

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(result.newStart, result.newEnd);
      }
    }, 0);
  };

  // Helper for inserting custom template snippets
  const insertSnippet = (before: string, after: string = "", placeholder: string = "") => {
    markDirty();
    const el = textareaRef.current;
    if (!el) {
      setKontenMarkdown((prev) => prev + before + placeholder + after);
      return;
    }

    el.focus();
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const selected = el.value.substring(start, end) || placeholder;
    const replacement = before + selected + after;

    const newValue =
      el.value.substring(0, start) + replacement + el.value.substring(end);
    setKontenMarkdown(newValue);

    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set;
    if (nativeSetter) {
      nativeSetter.call(el, newValue);
    } else {
      el.value = newValue;
    }

    const newPos = start + before.length + selected.length;
    el.dispatchEvent(new Event("input", { bubbles: true }));

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const embedUrl = useMemo(() => getYouTubeEmbedUrl(videoUrl), [videoUrl]);

  // Statistics
  const stats = useMemo(() => {
    const chars = kontenMarkdown.length;
    const words = kontenMarkdown.trim().split(/\s+/).filter(Boolean).length;
    const lines = kontenMarkdown.split("\n").length;
    return { chars, words, lines };
  }, [kontenMarkdown]);

  // Handle Save
  const handleSave = () => {
    if (!judul.trim()) {
      alert("Judul sub-materi wajib diisi!");
      return;
    }

    const updatedModule: BabSubMateri = {
      ...module,
      judul: judul.trim(),
      durasiMenit: typeof durasiMenit === "number" && durasiMenit >= 0 ? durasiMenit : 0,
      urutan: Math.max(1, urutan || 1),
      konten_markdown: kontenMarkdown,
      videoUrl: videoUrl.trim() || undefined,
      isOpen,
    };

    onSave(updatedModule);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/70 text-slate-900 pb-24 font-sans animate-in fade-in duration-150">
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TOP STICKY BAR: BREADCRUMB & AKSI SIMPAN                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Breadcrumb & Sub-Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer shrink-0"
              title="Kembali ke Edit Bab"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 truncate">
                <span>{classNameTitle}</span>
                <span>•</span>
                <span>
                  Bab {babNomor}: {babJudul}
                </span>
                <span>•</span>
                <span className="text-[#1967D2] font-bold">Editor Sub-Materi</span>
              </div>
              <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  {judul || "Sub-Materi Baru"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#1967D2] border border-blue-200">
                  Modul #{urutan}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    isOpen
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {isOpen ? "✓ Terbuka untuk Siswa" : "🔒 Terkunci Sementara"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
            {/* View switcher on Mobile */}
            <div className="flex lg:hidden bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold mr-1">
              <button
                type="button"
                onClick={() => setActiveMobileView("editor")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeMobileView === "editor"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileView("preview")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeMobileView === "preview"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Pratinjau
              </button>
            </div>

            {/* AI Generator Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setAiTopik(judul || babJudul || "");
                setIsAiModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Generate materi pembelajaran terstruktur dengan AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">Susun dengan AI</span>
              <span className="sm:hidden">AI</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#1967D2] hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Sub-Materi</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTAINER: 2-COLUMN SPLIT SCREEN (EDITOR + LIVE PREVIEW)          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* LEFT COLUMN: FORM & MARKDOWN EDITOR (7 COLS)                      */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <div
            className={`lg:col-span-7 space-y-5 ${
              activeMobileView === "preview" ? "hidden lg:block" : "block"
            }`}
          >
            {/* Card 1: Pengaturan Utama Sub-Materi */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1967D2] border border-blue-200/80 flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Identitas & Pengaturan Modul
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tentukan judul, durasi perkiraan belajar, serta nomor urut sub-bab.
                    </p>
                  </div>
                </div>

                {/* Status Akses Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 hidden sm:inline">
                    Status:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(!isOpen);
                      markDirty();
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                      isOpen
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    {isOpen ? (
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span>{isOpen ? "Terbuka" : "Terkunci"}</span>
                  </button>
                </div>
              </div>

              {/* Judul Sub-Materi */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Judul Sub-Materi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={judul}
                  onChange={(e) => {
                    setJudul(e.target.value);
                    markDirty();
                  }}
                  placeholder="Contoh: Pengertian Eksponen, Bentuk Umum & 8 Sifat Operasi Bilangan Berpangkat"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1967D2] focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              {/* Grid: Urutan & Durasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Urutan Sub-Bab
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={urutan}
                    onChange={(e) => {
                      setUrutan(parseInt(e.target.value, 10) || 1);
                      markDirty();
                    }}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1967D2]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Posisi modul dalam urutan daftar bacaan siswa.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Estimasi Durasi Belajar (Menit)
                    </label>
                    {durasiMenit > 0 ? (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {durasiMenit} Menit
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Off (Tanpa Batas Waktu)
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={durasiMenit === 0 ? "" : durasiMenit}
                    placeholder="Off (Tanpa Batas Waktu)"
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "" || raw === "0") {
                        setDurasiMenit(0);
                      } else {
                        setDurasiMenit(Math.max(0, parseInt(raw, 10) || 0));
                      }
                      markDirty();
                    }}
                    className={`w-full text-xs font-bold px-3 py-2 rounded-xl border transition ${
                      durasiMenit === 0
                        ? "border-slate-300 bg-slate-50 text-slate-500 placeholder:text-slate-400 placeholder:font-normal placeholder:italic"
                        : "border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#1967D2]"
                    }`}
                  />
                  {/* Preset Pills including Off */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400">Preset:</span>
                    {/* Tombol Off */}
                    <button
                      type="button"
                      onClick={() => {
                        setDurasiMenit(0);
                        markDirty();
                      }}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                        durasiMenit === 0
                          ? "bg-slate-800 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>Off</span>
                    </button>
                    {[10, 15, 20, 25, 30, 45].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setDurasiMenit(preset);
                          markDirty();
                        }}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                          durasiMenit === preset
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {preset}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Link Video Youtube (Opsional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-red-500" />
                    <span>Link Video Pendukung / YouTube (Opsional)</span>
                  </label>
                  {embedUrl && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Link YouTube Valid
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    markDirty();
                  }}
                  placeholder="Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1967D2] focus:ring-2 focus:ring-blue-100 transition"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Video akan disematkan langsung di modul bacaan siswa sehingga mereka dapat menonton penjelasan guru.
                </p>
              </div>
            </div>

            {/* Card 2: Editor Isi Konten Materi (Markdown & LaTeX) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1967D2]" />
                    <span>Isi Konten Materi Pembelajaran</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mendukung format Markdown lengkap dan rumus matematika LaTeX Kurikulum Merdeka ($...$ dan $$...$$).
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* AI Generate Button inside Card 2 */}
                  <button
                    type="button"
                    onClick={() => {
                      setAiTopik(judul || babJudul || "");
                      setIsAiModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    title="Generate materi ini dengan AI"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>Generate AI</span>
                  </button>

                  {/* Mode Tab Switcher: Editor vs Pratinjau Teks Langsung */}
                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveCardTab("editor")}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        activeCardTab === "editor"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Editor Teks</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCardTab("preview")}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        activeCardTab === "preview"
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Pratinjau Hasil</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 hidden sm:inline">
                    {stats.words} kata • {stats.chars} karakter
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLatexGuide(!showLatexGuide)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showLatexGuide ? "Tutup Panduan" : "Panduan LaTeX"}</span>
                  </button>
                </div>
              </div>

              {/* Feedback Pill saat tombol format ditekan */}
              {formatNotice && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold animate-in fade-in slide-in-from-top-1 duration-150">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
                  <span>{formatNotice}</span>
                  <span className="text-[11px] text-emerald-600/80 font-normal ml-auto">
                    Beralih ke tab &ldquo;Pratinjau Hasil&rdquo; untuk melihat teks tebal/miring.
                  </span>
                </div>
              )}

              {/* Panduan LaTeX Accordion */}
              {showLatexGuide && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-2 animate-in fade-in duration-150">
                  <div className="font-bold flex items-center gap-1.5 text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Panduan Rumus LaTeX Kurikulum Merdeka:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-blue-200/80">
                      <div className="font-mono text-blue-700 font-bold">$x^2$</div>
                      <div className="text-slate-500 text-[10px]">Pangkat / Eksponen</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-blue-200/80">
                      <div className="font-mono text-blue-700 font-bold">\sqrt&#123;x&#125;</div>
                      <div className="text-slate-500 text-[10px]">Akar Kuadrat</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-blue-200/80">
                      <div className="font-mono text-blue-700 font-bold">\frac&#123;a&#125;&#123;b&#125;</div>
                      <div className="text-slate-500 text-[10px]">Pecahan (a/b)</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-blue-200/80">
                      <div className="font-mono text-blue-700 font-bold">\times, \div, \pm</div>
                      <div className="text-slate-500 text-[10px]">Operasi Aritmetika</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-800 pt-1">
                    💡 Gunakan <code>$rumus$</code> untuk rumus sejajar baris, dan <code>$$rumus$$</code> untuk rumus di baris baru.
                  </p>
                </div>
              )}

              {/* Quick Formatting Toolbar (Aktif pada tab Editor) */}
              <div className="space-y-2">
                <div className="p-2 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-1 flex-wrap">
                  {/* Heading group */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat("h1")}
                    title="Heading 1 (# Judul Utama)"
                    className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:text-blue-700 active:scale-95 font-bold text-xs transition cursor-pointer select-none"
                  >
                    <Heading1 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat("h2")}
                    title="Heading 2 (## Sub Judul)"
                    className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:text-blue-700 active:scale-95 font-bold text-xs transition cursor-pointer select-none"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat("h3")}
                    title="Heading 3 (### Topik Bahasan)"
                    className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:text-blue-700 active:scale-95 font-bold text-xs transition cursor-pointer select-none"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-5 bg-slate-300 mx-1" />

                  {/* Text Formatting */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat("bold")}
                    title="Tebal / Bold (**teks**) - Ctrl+B"
                    className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:text-blue-700 active:scale-95 font-bold text-xs transition cursor-pointer select-none"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat("italic")}
                    title="Miring / Italic (*teks*) - Ctrl+I"
                    className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:text-blue-700 active:scale-95 font-bold text-xs transition cursor-pointer select-none"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat("quote")}
                    title="Kutipan / Blockquote (>)"
                    className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:text-blue-700 active:scale-95 font-bold text-xs transition cursor-pointer select-none"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat("code")}
                    title="Blok Kode / Rumus (```)"
                    className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:text-blue-700 active:scale-95 font-bold text-xs transition cursor-pointer select-none"
                  >
                    <Code className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-5 bg-slate-300 mx-1" />

                  {/* Lists */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat("bullet")}
                    title="Daftar Poin / Bullet (-)"
                    className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:text-blue-700 active:scale-95 font-bold text-xs transition cursor-pointer select-none"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat("numbered")}
                    title="Daftar Bernomor (1., 2.)"
                    className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:text-blue-700 active:scale-95 font-bold text-xs transition cursor-pointer select-none"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-5 bg-slate-300 mx-1" />

                  {/* Math Formula Shortcuts */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFormat("math-inline")}
                      title="Formula Matematika Inline ($x$)"
                      className="px-2 py-1 rounded-lg bg-blue-100/70 hover:bg-blue-200 active:scale-95 text-[#1967D2] font-mono font-bold text-xs transition cursor-pointer select-none"
                    >
                      $x$
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFormat("math-block")}
                      title="Formula Blok Baris Baru ($$...$$)"
                      className="px-2 py-1 rounded-lg bg-blue-100/70 hover:bg-blue-200 active:scale-95 text-[#1967D2] font-mono font-bold text-xs transition cursor-pointer select-none"
                    >
                      $$..$$
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFormat("fraction")}
                      title="Pecahan LaTeX (\frac{a}{b})"
                      className="px-2 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 active:scale-95 text-slate-800 font-mono font-bold text-xs transition cursor-pointer select-none"
                    >
                      a/b
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFormat("sqrt")}
                      title="Akar Kuadrat LaTeX (\sqrt{x})"
                      className="px-2 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 active:scale-95 text-slate-800 font-mono font-bold text-xs transition cursor-pointer select-none"
                    >
                      √x
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFormat("times")}
                      title="Simbol Perkalian LaTeX (\times)"
                      className="px-2 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 active:scale-95 text-slate-800 font-mono font-bold text-xs transition cursor-pointer select-none"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Helpful Formatting Hint Banner */}
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-900">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-blue-700">Panduan Format:</span>
                    <span>
                      Drag/blok kata lalu klik <b>B</b> untuk <code>**tebal**</code> atau <i>I</i> untuk <code>*miring*</code>.
                    </span>
                  </div>
                  <div className="hidden md:flex items-center gap-1.5 text-blue-600 text-[10px] font-semibold">
                    <span>Hasil visual ter-render di Pratinjau 👉</span>
                  </div>
                </div>
              </div>

              {/* Editor vs Pratinjau Teks Tab Body */}
              {activeCardTab === "preview" ? (
                <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200 min-h-[480px] space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span>Pratinjau Hasil Teks & Rumus Matematika</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveCardTab("editor")}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs hover:bg-blue-50 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Kembali ke Editor Teks</span>
                    </button>
                  </div>

                  {kontenMarkdown.trim().length === 0 ? (
                    <div className="py-16 text-center text-slate-400 space-y-1">
                      <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-semibold">Belum ada konten materi.</p>
                      <p className="text-[11px] text-slate-400">
                        Ketik materi di tab Editor Teks untuk melihat hasil visualnya di sini.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
                      <MarkdownRenderer content={kontenMarkdown} className="text-xs sm:text-sm leading-relaxed" />
                    </div>
                  )}
                </div>
              ) : (
                /* Textarea Editor */
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    rows={20}
                    required
                    value={kontenMarkdown}
                    onChange={(e) => {
                      setKontenMarkdown(e.target.value);
                      markDirty();
                    }}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                        e.preventDefault();
                        applyFormat("bold");
                      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
                        e.preventDefault();
                        applyFormat("italic");
                      } else if (e.key === "Tab") {
                        e.preventDefault();
                        const el = textareaRef.current;
                        if (!el) return;
                        const start = el.selectionStart ?? 0;
                        const end = el.selectionEnd ?? 0;
                        if (!e.shiftKey) {
                          const text = el.value;
                          const nextVal = text.substring(0, start) + "  " + text.substring(end);
                          setKontenMarkdown(nextVal);
                          el.value = nextVal;
                          el.setSelectionRange(start + 2, start + 2);
                          el.dispatchEvent(new Event("input", { bubbles: true }));
                        }
                      }
                    }}
                    placeholder="# Judul Materi..."
                    className="w-full text-xs sm:text-sm font-mono p-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#1967D2] focus:ring-2 focus:ring-blue-100 transition resize-y leading-relaxed text-slate-900 bg-white min-h-[480px]"
                  />
                </div>
              )}

              {/* Quick Template Buttons */}
              <div className="pt-1 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Sisipkan Template:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet(
                        "\n\n### Contoh Soal:\nSebuah soal kontekstual Kurikulum Merdeka...\n\n**Penyelesaian:**\n1. Langkah pertama...\n2. Langkah kedua...\n\n$$\\text{Jawaban} = ...$$\n"
                      )
                    }
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200/60"
                  >
                    + Template Contoh Soal
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet(
                        "\n\n> 💡 **Tips Penalaran Siswa:**\n> Ingat bahwa sifat perkalian eksponen hanya berlaku jika basis bilangannya sama!\n"
                      )
                    }
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60"
                  >
                    + Callout Tips
                  </button>
                </div>

                <div className="text-[11px] text-slate-400">
                  {stats.lines} baris
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN: LIVE REALTIME STUDENT PREVIEW (5 COLS)               */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <div
            className={`lg:col-span-5 space-y-4 lg:sticky lg:top-24 ${
              activeMobileView === "editor" ? "hidden lg:block" : "block"
            }`}
          >
            {/* Live Preview Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
              {/* Preview Header Bar */}
              <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-wide">
                    Pratinjau Tampilan Siswa (Live)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-300 font-medium">
                  <Monitor className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reader Mode Siswa</span>
                </div>
              </div>

              {/* Reader Mockup Body */}
              <div className="p-5 sm:p-6 max-h-[calc(100vh-180px)] overflow-y-auto space-y-5 bg-white">
                {/* Judul & Meta Pratinjau */}
                <div className="space-y-2 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="px-2 py-0.5 rounded-full font-bold bg-blue-50 text-[#1967D2] border border-blue-200">
                      Modul #{urutan}
                    </span>
                    {durasiMenit > 0 ? (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{durasiMenit} Menit</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Bebas (Tanpa Durasi)</span>
                      </span>
                    )}
                    <span className="text-slate-400">
                      Bab {babNomor} • {subjectName}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                    {judul || "Judul Sub-Materi Belum Diisi"}
                  </h2>
                </div>

                {/* Video Youtube Preview if available */}
                {embedUrl && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-red-600 fill-red-600" />
                      <span>Video Pendukung Materi</span>
                    </div>
                    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-2xs">
                      <iframe
                        src={embedUrl}
                        title="Video Pendukung"
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  </div>
                )}

                {/* Markdown & LaTeX Rendered View */}
                {kontenMarkdown.trim().length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-2xl p-6">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold">
                      Belum ada konten materi.
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Ketikkan materi di panel editor sebelah kiri untuk melihat teks dan rumus matematika ter-render secara langsung.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100">
                    <MarkdownRenderer
                      content={kontenMarkdown}
                      className="text-xs sm:text-sm leading-relaxed"
                    />
                  </div>
                )}

                {/* Bottom Notice */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>
                    Tampilan di atas adalah representasi nyata yang dilihat oleh siswa saat membuka bab ini.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: GENERATE MATERI DENGAN AI (THINKSY AI CURRICULUM ARCHITECT)   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isAiModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => {
            if (!isGeneratingAi) {
              setIsAiModalOpen(false);
              setAiGeneratedPreview(null);
            }
          }}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1967D2] to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Generate Materi Pembelajaran AI</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#1967D2] border border-blue-200">
                      Thinksy AI
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Menyusun modul ajar mendalam, terstruktur, dan siap pakai sesuai standar Kurikulum Merdeka.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isGeneratingAi) {
                    setIsAiModalOpen(false);
                    setAiGeneratedPreview(null);
                  }
                }}
                disabled={isGeneratingAi}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {aiError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* View 1: Konfigurasi Generator (Saat belum ada preview atau ingin edit konfigurasi) */}
              {!aiGeneratedPreview ? (
                <div className="space-y-4.5">
                  {/* Topik Materi Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Topik / Judul Sub-Materi yang Ingin Disusun <span className="text-red-500">*</span></span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Mata Pelajaran: <strong className="text-slate-700">{subjectName}</strong>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={aiTopik}
                      onChange={(e) => setAiTopik(e.target.value)}
                      placeholder="Contoh: Logika Percabangan If-Else dan Operator Perbandingan dalam Python"
                      className="w-full text-xs font-semibold px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#1967D2] focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>

                  {/* Gaya Belajar & Pendekatan Pedagogis */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-2 block">
                      Gaya Pembelajaran & Pendekatan Pedagogis
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          id: "konseptual_sokratik",
                          title: "Konseptual & Sokratik",
                          desc: "Penjelasan logika inti, analogi nyata, dan pemantik berpikir kritis.",
                          icon: "🧠",
                        },
                        {
                          id: "praktis_studi_kasus",
                          title: "Praktis & Studi Kasus",
                          desc: "Banyak contoh terapan nyata, implementasi kode/rumus langkah demi langkah.",
                          icon: "🛠️",
                        },
                        {
                          id: "komprehensif_buku_teks",
                          title: "Buku Teks Lengkap",
                          desc: "Penjabaran formal komprehensif, teori ilmiah, dan pembuktian matematis.",
                          icon: "📖",
                        },
                        {
                          id: "ringkas_latihan",
                          title: "Ringkas & Latihan",
                          desc: "Padat inti, rangkuman rumus kunci, dan tabel analisis praktis.",
                          icon: "⚡",
                        },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAiGayaBelajar(item.id as any)}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                            aiGayaBelajar === item.id
                              ? "border-[#1967D2] bg-blue-50/60 ring-2 ring-blue-500/20"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <span className="text-lg shrink-0">{item.icon}</span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Komponen Wajib */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                      Komponen Pembelajaran yang Disertakan
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: "tujuan", label: "🎯 Capaian & Tujuan" },
                        { id: "analogi", label: "💡 Apersepsi & Analogi" },
                        { id: "konsep", label: "📖 Teori & Konsep Inti" },
                        { id: "contoh_langkah", label: "🔍 Langkah Solusi Rinci" },
                        { id: "miskonsepsi", label: "⚠️ Peringatan Miskonsepsi" },
                        { id: "sokratik", label: "🧠 Refleksi Sokratik" },
                        { id: "rangkuman", label: "📝 Rangkuman Poin Kunci" },
                      ].map((comp) => {
                        const isChecked = aiElemen.includes(comp.id);
                        return (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => handleToggleAiElemen(comp.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-between cursor-pointer ${
                              isChecked
                                ? "bg-blue-50 text-[#1967D2] border-blue-200"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span>{comp.label}</span>
                            <span className="text-xs">{isChecked ? "✓" : "+"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Catatan / Instruksi Khusus Guru (Opsional) */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Catatan / Arahan Khusus Guru (Opsional)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Misal: tambahkan kode Python atau tabel perbandingan</span>
                    </label>
                    <textarea
                      rows={2}
                      value={aiInstruksi}
                      onChange={(e) => setAiInstruksi(e.target.value)}
                      placeholder="Contoh: Buat analogi menggunakan sistem lampu lalu lintas dan sertakan 2 contoh koding sederhana..."
                      className="w-full text-xs font-medium p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#1967D2] focus:ring-2 focus:ring-blue-100 transition resize-none placeholder:text-slate-400"
                    />
                  </div>

                  {/* Pilihan Penempatan Isi */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Metode Penempatan Hasil AI ke Editor:
                    </span>
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="aiPlacement"
                          checked={aiPlacement === "replace"}
                          onChange={() => setAiPlacement("replace")}
                          className="text-[#1967D2] focus:ring-0"
                        />
                        <span>Gantikan seluruh isi editor saat ini</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="aiPlacement"
                          checked={aiPlacement === "append"}
                          onChange={() => setAiPlacement("append")}
                          className="text-[#1967D2] focus:ring-0"
                        />
                        <span>Sisipkan di akhir materi yang sudah ada</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* View 2: Pratinjau Hasil Generate AI */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Materi berhasil disusun oleh AI Thinksy!</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAiGeneratedPreview(null)}
                      className="text-xs font-bold text-[#1967D2] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Ubah Konfigurasi</span>
                    </button>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {aiGeneratedPreview.judul}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {aiGeneratedPreview.ringkasan}
                    </p>
                    <div className="flex items-center gap-3 pt-2 text-[10px] text-slate-400 font-mono">
                      <span>Estimasi Waktu: {aiGeneratedPreview.durasiMenit} Menit</span>
                      <span>•</span>
                      <span>{aiGeneratedPreview.kontenMarkdown.length} Karakter</span>
                    </div>
                  </div>

                  {/* Rendered Markdown Preview Box */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      Pratinjau Isi Konten:
                    </span>
                    <div className="max-h-72 overflow-y-auto p-4 rounded-2xl bg-white border border-slate-200 shadow-inner text-xs sm:text-sm">
                      <MarkdownRenderer
                        content={aiGeneratedPreview.kontenMarkdown}
                        className="text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!isGeneratingAi) {
                    setIsAiModalOpen(false);
                    setAiGeneratedPreview(null);
                  }
                }}
                disabled={isGeneratingAi}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Batal
              </button>

              {!aiGeneratedPreview ? (
                <button
                  type="button"
                  onClick={handleGenerateAi}
                  disabled={isGeneratingAi}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Menyusun Materi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>✨ Mulai Susun Materi dengan AI</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateAi}
                    disabled={isGeneratingAi}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generate Ulang</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyAiContent}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Terapkan ke Editor</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
