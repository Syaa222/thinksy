"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  ChevronRight,
  FileText,
  Sparkles,
  HelpCircle,
  PlayCircle,
  Check,
  List,
  Printer,
  Sun,
  Moon,
  Coffee,
  Bookmark,
  MessageSquarePlus,
  Send,
  Loader2,
  Share2,
  GraduationCap,
  Layers,
  Eye,
  Highlighter,
  Trash2,
  X,
  Copy,
  Plus,
  Lightbulb,
  User,
  Underline,
} from "lucide-react";
import Link from "next/link";
import DigitalJournalReader from "@/components/journal/DigitalJournalReader";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";
import SubBabCreativeQuiz from "@/components/materi/SubBabCreativeQuiz";

export interface MateriItem {
  id: string;
  judul: string;
  urutan: number;
  konten?: string;
  konten_markdown?: string;
  durasiMenit?: number;
}

export interface DaftarMateriClientProps {
  babId: string;
  judulBab: string;
  deskripsiBab: string;
  urutanBab: number;
  mapel?: string;
  kelas?: number;
  namaKelas?: string;
  studentName?: string;
  studentPhoto?: string | null;
  listMateri: MateriItem[];
  initialMateriId?: string;
  initialViewMode?: "pdf" | "journal" | "modules";
  chapterProgressPercent?: number;
  answeredCount?: number;
  totalSoalCount?: number;
}

type ReadingTheme = "light" | "sepia" | "dark";
type FontSize = "normal" | "large" | "xlarge";

export interface TextHighlight {
  id: string;
  text: string;
  color: "yellow" | "green" | "pink" | "blue";
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: RESTORE TERSIMPAN KE ELEMEN TEKS DI DOM SECARA AMAN
// ─────────────────────────────────────────────────────────────────────────────
function applyStoredUnderlines(
  container: HTMLElement,
  savedSnippets: string[],
  onRemove: (snippet: string) => void
) {
  if (!container || !savedSnippets || savedSnippets.length === 0) return;

  const uniqueSnippets = Array.from(new Set(savedSnippets.filter(Boolean))).sort(
    (a, b) => b.length - a.length
  );

  uniqueSnippets.forEach((snippet) => {
    const cleanSnippet = snippet.trim();
    if (!cleanSnippet) return;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent || !node.textContent.includes(cleanSnippet)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.parentElement?.closest("[data-thinksy-underline='true']")) {
          return NodeFilter.FILTER_REJECT;
        }
        if (["SCRIPT", "STYLE", "BUTTON", "INPUT", "TEXTAREA"].includes(node.parentElement?.tagName || "")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodesToWrap: { node: Text; index: number }[] = [];
    let currentNode = walker.nextNode() as Text | null;
    while (currentNode) {
      const idx = currentNode.textContent?.indexOf(cleanSnippet) ?? -1;
      if (idx !== -1) {
        nodesToWrap.push({ node: currentNode, index: idx });
      }
      currentNode = walker.nextNode() as Text | null;
    }

    nodesToWrap.forEach(({ node, index }) => {
      try {
        const text = node.textContent || "";
        const before = text.substring(0, index);
        const match = text.substring(index, index + cleanSnippet.length);
        const after = text.substring(index + cleanSnippet.length);

        const span = document.createElement("span");
        span.className =
          "underline decoration-blue-600 decoration-2 underline-offset-4 bg-blue-50/70 dark:bg-blue-900/40 text-blue-950 dark:text-blue-100 rounded-xs px-0.5 font-medium transition cursor-pointer hover:opacity-80";
        span.setAttribute("data-thinksy-underline", "true");
        span.setAttribute("title", "Klik untuk menghapus garis bawah");
        span.textContent = match;

        span.onclick = (e) => {
          e.stopPropagation();
          const parent = span.parentNode;
          if (parent) {
            while (span.firstChild) {
              parent.insertBefore(span.firstChild, span);
            }
            parent.removeChild(span);
            onRemove(cleanSnippet);
          }
        };

        const parent = node.parentNode;
        if (parent) {
          if (before) parent.insertBefore(document.createTextNode(before), node);
          parent.insertBefore(span, node);
          if (after) parent.insertBefore(document.createTextNode(after), node);
          parent.removeChild(node);
        }
      } catch (err) {
        console.warn("Underline restore note:", err);
      }
    });
  });
}

export default function DaftarMateriClient({
  babId,
  judulBab,
  deskripsiBab,
  urutanBab,
  mapel = "Matematika",
  kelas = 8,
  namaKelas,
  studentName = "Siswa",
  studentPhoto = null,
  listMateri = [],
  initialMateriId,
  initialViewMode = "pdf",
  chapterProgressPercent = 0,
  answeredCount = 0,
  totalSoalCount = 0,
}: DaftarMateriClientProps) {
  const displayKelas = namaKelas || (typeof kelas === "string" ? kelas : `Kelas ${kelas}`);

  // ─── CUSTOM BAB CONFIGURATION (SINKRON GURU) ───
  const [customBabConfig, setCustomBabConfig] = useState<any>(null);

  useEffect(() => {
    const loadCustomConfig = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem("thinksy_custom_babs");
        if (raw) {
          const parsed = JSON.parse(raw);
          const match =
            parsed[babId] ||
            parsed[`mat-bab-${urutanBab}`] ||
            Object.values(parsed).find(
              (b: any) =>
                b.id === babId ||
                b.supabaseId === babId ||
                b.urutan === urutanBab ||
                (b.judul && judulBab && b.judul.toLowerCase() === judulBab.toLowerCase())
            );
          if (match) {
            setCustomBabConfig(match);
          }
        }
      } catch (err) {
        console.error("Gagal memuat kustomisasi bab guru:", err);
      }
    };

    loadCustomConfig();
    window.addEventListener("thinksy_bab_updated", loadCustomConfig);
    window.addEventListener("thinksy_due_soon_updated", loadCustomConfig);
    return () => {
      window.removeEventListener("thinksy_bab_updated", loadCustomConfig);
      window.removeEventListener("thinksy_due_soon_updated", loadCustomConfig);
    };
  }, [babId, urutanBab, judulBab]);

  // Mark this bab as opened in thinksy_opened_babs
  useEffect(() => {
    if (typeof window === "undefined" || !babId) return;
    try {
      const raw = localStorage.getItem("thinksy_opened_babs");
      const list: string[] = raw ? JSON.parse(raw) : [];
      const babKey = String(babId);
      if (!list.includes(babKey)) {
        list.push(babKey);
        localStorage.setItem("thinksy_opened_babs", JSON.stringify(list));
      }
    } catch {}
  }, [babId]);

  // Derive Effective Content & Meta
  const effectiveJudulBab = customBabConfig?.judul || judulBab;
  const effectiveDeskripsiBab = customBabConfig?.deskripsi || deskripsiBab;

  // Derive Effective Modules (Memastikan setiap bab terstruktur tepat 3 Sub-Bab)
  const effectiveListMateri: MateriItem[] = useMemo(() => {
    let source: MateriItem[] = [];
    if (
      customBabConfig?.modules &&
      Array.isArray(customBabConfig.modules) &&
      customBabConfig.modules.length > 0
    ) {
      source = customBabConfig.modules.map((m: any, idx: number) => ({
        id: m.id || `materi-custom-${idx + 1}`,
        judul: m.judul,
        urutan: m.urutan || idx + 1,
        konten: m.kontenMarkdown,
        konten_markdown: m.kontenMarkdown,
        durasiMenit: typeof m.durasiMenit === "number" ? m.durasiMenit : undefined,
      }));
    } else if (listMateri && listMateri.length > 0) {
      source = listMateri;
    }

    if (source.length >= 3) {
      return source.slice(0, 3);
    }

    const result = [...source];
    const defaultSubBabTitles = [
      `Konsep Dasar & Definisi Fundamental`,
      `Eksplorasi Sifat, Pola & Analisis Kasus`,
      `Penerapan Kontekstual & Penalaran Tingkat Lanjut`,
    ];
    while (result.length < 3) {
      const nextIdx = result.length + 1;
      result.push({
        id: `subbab-default-${babId}-${nextIdx}`,
        judul: defaultSubBabTitles[nextIdx - 1] || `Sub-Bab ${nextIdx}`,
        urutan: nextIdx,
        konten_markdown: `### Sub-Bab ${nextIdx}\n\nPelajari materi dan ikuti kuis kreatif terpandu di bawah untuk menuntaskan pemahaman konsep ini secara bertahap.`,
      });
    }
    return result;
  }, [customBabConfig, listMateri, babId]);

  // Feature Flags dari Pengaturan Bab Guru
  const isAiEnabled = customBabConfig?.features?.aiEnabled !== false;
  const aiGuidanceStyle: "socratic" | "adaptive" | "direct" =
    customBabConfig?.features?.aiGuidanceStyle || "socratic";
  const aiTokenLimit: number =
    typeof customBabConfig?.features?.aiTokenLimit === "number"
      ? customBabConfig.features.aiTokenLimit
      : 20;
  const aiCustomDirective: string = customBabConfig?.features?.aiCustomDirective || "";
  const isNotesEnabled = customBabConfig?.features?.notesEnabled !== false;

  // Save last learning activity for Quick Resume & To-do integration
  useEffect(() => {
    if (typeof window !== "undefined" && babId && effectiveJudulBab) {
      const activity = {
        type: "bab",
        id: babId,
        judul: effectiveJudulBab,
        mapel: mapel || "Matematika",
        link: `/bab/${babId}`,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem("thinksy_last_activity", JSON.stringify(activity));
        window.dispatchEvent(new CustomEvent("thinksy_activity_update", { detail: activity }));
      } catch {}
    }
  }, [babId, effectiveJudulBab, mapel]);

  // View Modes:
  // "pdf" -> Long-form continuous textbook / PDF reading document
  // "journal" -> Page-by-page interactive digital journal with highlights & margin notes
  // "modules" -> Syllabus overview of modules
  const [viewMode, setViewMode] = useState<"pdf" | "journal" | "modules">(
    initialMateriId ? "journal" : initialViewMode
  );

  const [selectedMateriId, setSelectedMateriId] = useState<string | null>(
    initialMateriId || effectiveListMateri[0]?.id || null
  );

  useEffect(() => {
    if (!selectedMateriId && effectiveListMateri.length > 0) {
      setSelectedMateriId(effectiveListMateri[0].id);
    }
  }, [effectiveListMateri, selectedMateriId]);

  // PDF Reader Customization Settings
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>("light");
  const [fontSize, setFontSize] = useState<FontSize>("normal");
  const [activeSubSection, setActiveSubSection] = useState<number>(0);

  // Study Notes State
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const [notesList, setNotesList] = useState<Array<{ id: string; title: string; content: string; createdAt: string }>>([
    {
      id: "sample-note-1",
      title: `Intisari Bab ${urutanBab}: ${effectiveJudulBab}`,
      content: `Poin kunci: Pahami definisi fundamental, formulasi matematis/ilmiah, serta telaah contoh soal langkah demi langkah sebelum memulai asesmen kuis akhir bab.`,
      createdAt: "Otomatis",
    },
  ]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Underline Feature State (Menggantikan tema, Aa, dan catatan)
  const [isUnderlineMode, setIsUnderlineMode] = useState(false);
  const [underlinesCount, setUnderlinesCount] = useState(0);
  const savedRangeRef = useRef<Range | null>(null);

  const removeSnippetFromStorage = (snippetText: string) => {
    try {
      const raw = localStorage.getItem(`thinksy_underlines_${babId}`);
      if (raw) {
        const list: string[] = JSON.parse(raw);
        const filtered = list.filter((s) => s.trim() !== snippetText.trim());
        localStorage.setItem(`thinksy_underlines_${babId}`, JSON.stringify(filtered));
        setUnderlinesCount(filtered.length);
      }
    } catch {}
  };

  // Load & restore saved underlines on mount and view changes
  useEffect(() => {
    const restoreUnderlines = () => {
      try {
        const saved = localStorage.getItem(`thinksy_underlines_${babId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUnderlinesCount(parsed.length);
            const container = document.querySelector("#materi-reader-content") as HTMLElement | null;
            if (container) {
              applyStoredUnderlines(container, parsed, (snippet) => {
                removeSnippetFromStorage(snippet);
                saveCurrentUnderlines();
                showToast("Garis bawah dihapus.");
              });
            }
          } else {
            setUnderlinesCount(0);
          }
        } else {
          setUnderlinesCount(0);
        }
      } catch {}
    };

    const t1 = setTimeout(restoreUnderlines, 100);
    const t2 = setTimeout(restoreUnderlines, 400);
    const t3 = setTimeout(restoreUnderlines, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [babId, effectiveListMateri, viewMode]);

  const saveCurrentUnderlines = () => {
    try {
      const container = document.querySelector("#materi-reader-content");
      if (!container) return;
      const elements = container.querySelectorAll("[data-thinksy-underline='true']");
      setUnderlinesCount(elements.length);
      const texts = Array.from(elements)
        .map((el) => (el.textContent || "").trim())
        .filter(Boolean);
      const uniqueTexts = Array.from(new Set(texts));
      localStorage.setItem(`thinksy_underlines_${babId}`, JSON.stringify(uniqueTexts));
    } catch {}
  };

  const handleApplyUnderline = () => {
    const selection = window.getSelection();
    let range: Range | null = null;

    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else if (savedRangeRef.current) {
      range = savedRangeRef.current;
    }

    const selectedContent = (range ? range.toString() : selectedText).trim();

    if (!range || !selectedContent) {
      setIsUnderlineMode((prev) => {
        const next = !prev;
        showToast(
          next
            ? "✏️ Mode Garis Bawahi AKTIF: Sorot teks materi untuk langsung menggarisbawahi!"
            : "Mode Garis Bawahi dinonaktifkan."
        );
        return next;
      });
      return;
    }

    // Persist directly to localStorage
    try {
      const prevSaved = JSON.parse(localStorage.getItem(`thinksy_underlines_${babId}`) || "[]");
      const updatedSaved = Array.from(new Set([...prevSaved, selectedContent]));
      localStorage.setItem(`thinksy_underlines_${babId}`, JSON.stringify(updatedSaved));
      setUnderlinesCount(updatedSaved.length);
    } catch {}

    let applied = false;
    try {
      const span = document.createElement("span");
      span.className =
        "underline decoration-blue-600 decoration-2 underline-offset-4 bg-blue-50/70 dark:bg-blue-900/40 text-blue-950 dark:text-blue-100 rounded-xs px-0.5 font-medium transition cursor-pointer hover:opacity-80";
      span.setAttribute("data-thinksy-underline", "true");
      span.setAttribute("title", "Klik untuk menghapus garis bawah");
      span.onclick = (e) => {
        e.stopPropagation();
        const parent = span.parentNode;
        if (parent) {
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
          removeSnippetFromStorage(selectedContent);
          saveCurrentUnderlines();
          showToast("Garis bawah dihapus.");
        }
      };

      span.appendChild(range.extractContents());
      range.insertNode(span);
      applied = true;
    } catch (err) {
      console.warn("Direct extractContents note, attempting TreeWalker wrapping:", err);
    }

    // Fallback if direct DOM extractContents did not succeed
    if (!applied) {
      const container = document.querySelector("#materi-reader-content") as HTMLElement | null;
      if (container) {
        applyStoredUnderlines(container, [selectedContent], (snip) => {
          removeSnippetFromStorage(snip || selectedContent);
          saveCurrentUnderlines();
          showToast("Garis bawah dihapus.");
        });
      }
    }

    if (selection) selection.removeAllRanges();
    savedRangeRef.current = null;
    setSelectedText("");
    setSelectionPosition(null);

    saveCurrentUnderlines();
    showToast("✍️ Teks berhasil digarisbawahi & disimpan!");
  };

  // Text Highlighting State
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Supabase Reading Progress State
  const [readMateriIds, setReadMateriIds] = useState<Set<string>>(new Set());
  const [markingMateriId, setMarkingMateriId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await fetch(`/api/siswa/materi/progress?babId=${babId}`);
        if (res.ok) {
          const data = await res.json();
          const set = new Set<string>((data.progress || []).map((p: any) => p.materi_id));
          setReadMateriIds(set);
        }
      } catch {}
    }
    loadProgress();
  }, [babId]);

  const handleMarkComplete = async (materiId: string) => {
    setMarkingMateriId(materiId);
    try {
      const res = await fetch("/api/siswa/materi/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ babId, materiId, status: "selesai" }),
      });
      if (res.ok) {
        const data = await res.json();
        setReadMateriIds((prev) => new Set([...prev, materiId]));
        showToast("Sub-bab berhasil diselesaikan! 🎯");
      }
    } catch {
      showToast("Gagal menyimpan progres");
    } finally {
      setMarkingMateriId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setSelectionPosition(null);
      setSelectedText("");
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 0) {
      setSelectedText(text);
      try {
        const range = selection.getRangeAt(0);
        savedRangeRef.current = range.cloneRange();
        if (isUnderlineMode) {
          handleApplyUnderline();
          return;
        }
        const rect = range.getBoundingClientRect();
        setSelectionPosition({
          x: Math.max(160, Math.min(window.innerWidth - 160, rect.left + rect.width / 2)),
          y: Math.max(70, rect.top - 12),
        });
      } catch {
        setSelectionPosition(null);
      }
    } else {
      setSelectionPosition(null);
    }
  };

  const handleApplyHighlight = (color: "yellow" | "green" | "pink" | "blue") => {
    const selection = window.getSelection();
    let range: Range | null = null;
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else if (savedRangeRef.current) {
      range = savedRangeRef.current;
    }

    const selectedContent = (range ? range.toString() : selectedText).trim();
    if (!selectedContent) {
      setSelectionPosition(null);
      return;
    }

    const colorClasses = {
      yellow: "bg-yellow-200/90 dark:bg-yellow-400/30 text-yellow-950 dark:text-yellow-100",
      green: "bg-emerald-200/90 dark:bg-emerald-400/30 text-emerald-950 dark:text-emerald-100",
      pink: "bg-pink-200/90 dark:bg-pink-400/30 text-pink-950 dark:text-pink-100",
      blue: "bg-sky-200/90 dark:bg-sky-400/30 text-sky-950 dark:text-sky-100",
    }[color];

    try {
      if (range) {
        const mark = document.createElement("mark");
        mark.className = `${colorClasses} rounded-xs px-0.5 py-0.5 transition cursor-pointer hover:opacity-85 font-medium`;
        mark.setAttribute("data-thinksy-highlight", color);
        mark.setAttribute("title", `Stabilo (${color}) - Klik untuk menghapus`);
        mark.onclick = (e) => {
          e.stopPropagation();
          const parent = mark.parentNode;
          if (parent) {
            while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
            parent.removeChild(mark);
            setHighlights((prev) => prev.filter((h) => h.text !== selectedContent));
            showToast("Stabilo dihapus.");
          }
        };
        mark.appendChild(range.extractContents());
        range.insertNode(mark);
      }
    } catch (err) {
      console.warn("Direct extractContents note for highlight:", err);
    }

    const newHl: TextHighlight = {
      id: `hl-${Date.now()}`,
      text: selectedContent,
      color,
      createdAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setHighlights((prev) => {
      const updated = [newHl, ...prev];
      try {
        localStorage.setItem(`thinksy_highlights_${babId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (selection) selection.removeAllRanges();
    savedRangeRef.current = null;
    setSelectedText("");
    setSelectionPosition(null);
    showToast(`✨ Teks berhasil ditandai dengan stabilo ${color}!`);
  };

  const handleAskThinksySelectedText = () => {
    const textToExplain = selectedText.trim();
    if (!textToExplain) {
      setSelectionPosition(null);
      return;
    }

    setSelectionPosition(null);
    if (typeof window !== "undefined") {
      window.getSelection()?.removeAllRanges();
    }
    savedRangeRef.current = null;

    showToast("✨ Thinksy AI sedang menyiapkan penjelasan...");

    const question = `Tolong jelaskan maksud konsep atau bacaan ini dengan bahasa yang ringkas, runtut, dan mudah dipahami siswa: "${textToExplain}"`;
    handleAskAi(question);
  };

  const handleMakeNoteFromHighlight = () => {
    if (!selectedText) return;
    setNewNoteTitle(`Kutipan Materi (Stabilo)`);
    setNewNoteContent(selectedText);
    setIsNotesDrawerOpen(true);
    setSelectionPosition(null);
    showToast("📝 Teks disalin ke draft catatan belajar!");
  };

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim() || `Catatan #${notesList.length + 1}`,
      content: newNoteContent.trim(),
      createdAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };
    setNotesList((prev) => [newNote, ...prev]);
    setNewNoteTitle("");
    setNewNoteContent("");
    showToast("💾 Catatan baru berhasil disimpan!");
  };

  const handleDeleteNote = (noteId: string) => {
    setNotesList((prev) => prev.filter((n) => n.id !== noteId));
    showToast("🗑️ Catatan telah dihapus.");
  };

  const handleDeleteHighlight = (hlId: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== hlId));
    showToast("Highlight dihapus.");
  };

  // AI Assistant Quick Chat
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiHistory, setAiHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Print PDF Trigger
  const handlePrint = () => {
    window.print();
  };

  const handleAskAi = async (customQuestion?: string) => {
    if (!isAiEnabled) {
      showToast("Tutor AI dinonaktifkan oleh guru untuk bab ini.");
      return;
    }
    const q = customQuestion || aiPrompt.trim();
    if (!q || isAiLoading) return;

    const currentQuestionsAsked = aiHistory.filter((m) => m.role === "user").length;
    if (aiTokenLimit !== 999 && currentQuestionsAsked >= aiTokenLimit) {
      showToast(`Batas kuota pertanyaan AI (${aiTokenLimit}) untuk bab ini telah tercapai.`);
      return;
    }

    setAiPrompt("");
    setAiHistory((prev) => [...prev, { role: "user", content: q }]);
    setIsAiLoading(true);
    setIsAiOpen(true);

    try {
      const allText = effectiveListMateri.map((m) => m.konten_markdown || "").join("\n\n").substring(0, 2000);
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materiJudul: `${mapel} - ${effectiveJudulBab}`,
          materiKonten: allText,
          message: q,
          history: aiHistory,
          guidanceStyle: aiGuidanceStyle,
          customDirective: aiCustomDirective,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setAiHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setAiHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Maaf, belum dapat merespon saat ini. Silakan coba kembali." },
        ]);
      }
    } catch {
      setAiHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Koneksi terputus. Silakan coba kirim ulang pertanyaan." },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Theme styles
  const themeClasses = {
    light: "bg-[#F8FAFC] text-slate-900",
    sepia: "bg-[#FBF0D9] text-[#2C2416]",
    dark: "bg-[#0F172A] text-slate-100",
  }[readingTheme];

  const paperClasses = {
    light: "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-slate-900",
    sepia: "bg-[#FFFBF0] shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-[#2C2416]",
    dark: "bg-[#1E293B] shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-slate-100",
  }[readingTheme];

  const fontSizeClass = {
    normal: "text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 font-normal",
    large: "text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 font-normal",
    xlarge: "text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-200 font-normal",
  }[fontSize];

  return (
    <main className={`min-h-screen transition-colors duration-200 ${themeClasses} pb-24`}>
      {/* ===================================================================== */}
      {/* 1. TOP STICKY APP HEADER & READING TOOLBAR (PRINT HIDDEN)             */}
      {/* ===================================================================== */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors print:hidden ${
          readingTheme === "dark"
            ? "bg-slate-900/95 border-slate-800 text-white"
            : readingTheme === "sepia"
            ? "bg-[#F4E8CE]/95 border-[#E5D7B7] text-[#2C2416]"
            : "bg-white/95 border-slate-100 text-slate-900 shadow-2xs"
        }`}
      >
        <div className="w-full flex items-center justify-between px-3 sm:px-6 md:px-8 lg:px-10 py-2.5 gap-2.5 sm:gap-4 transition-all">
          {/* Left: Back Link + Mode Switcher Tabs (Sejajar dengan Card Pembelajaran) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/dashboard"
              className={`h-9 px-3 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0 ${
                readingTheme === "dark"
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs"
              }`}
              title="Kembali ke Dashboard Siswa"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kembali</span>
            </Link>

            {/* Mode Switcher Tabs */}
            <nav
              aria-label="Mode Pembelajaran"
              className="flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold shrink-0"
            >
              <button
                type="button"
                onClick={() => setViewMode("pdf")}
                className={`h-8 px-3 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs font-semibold ${
                  viewMode === "pdf"
                    ? "bg-blue-600 text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-blue-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                }`}
                title="Tampilkan Modul Digital Lengkap"
              >
                <FileText className={`w-3.5 h-3.5 ${viewMode === "pdf" ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
                <span className="hidden sm:inline">Modul Digital</span>
                <span className="sm:hidden">Modul</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("journal")}
                className={`h-8 px-3 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs font-semibold ${
                  viewMode === "journal"
                    ? "bg-blue-600 text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-blue-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                }`}
                title="Tampilkan Jurnal Halaman per Halaman"
              >
                <BookOpen className={`w-3.5 h-3.5 ${viewMode === "journal" ? "text-white" : "text-amber-500"}`} />
                <span className="hidden sm:inline">Jurnal Belajar</span>
                <span className="sm:hidden">Jurnal</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("modules")}
                className={`h-8 px-3 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs font-semibold ${
                  viewMode === "modules"
                    ? "bg-blue-600 text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-blue-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                }`}
                title="Tampilkan Ringkasan Silabus Bab"
              >
                <List className={`w-3.5 h-3.5 ${viewMode === "modules" ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
                <span className="hidden sm:inline">Silabus Bab</span>
                <span className="sm:hidden">Silabus</span>
              </button>
            </nav>
          </div>

          {/* Right: Quick Controls (Theme, Font, Notes, Print, AI, Profile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* FITUR TUNGGAL: GARIS BAWAHI TEKS (Menggantikan Theme Selector, Aa Font, dan Catatan) */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={handleApplyUnderline}
              className={`h-9 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                isUnderlineMode
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-500/20"
                  : readingTheme === "dark"
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs"
              }`}
              title={
                isUnderlineMode
                  ? "Mode Garis Bawahi Aktif (Klik untuk matikan mode, atau klik teks bergaris bawah untuk menghapusnya)"
                  : "Garis Bawahi Teks (Sorot teks materi lalu klik untuk menggarisbawahi)"
              }
            >
              <Underline className={`w-4 h-4 shrink-0 ${isUnderlineMode ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
              <span>Garis Bawahi</span>
              {underlinesCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isUnderlineMode
                      ? "bg-white text-blue-700"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200"
                  }`}
                >
                  {underlinesCount}
                </span>
              )}
            </button>

            {/* Print / Save PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className={`h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                readingTheme === "dark"
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs"
              }`}
              title="Cetak Modul / Simpan Dokumen PDF"
            >
              <Printer className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              <span className="hidden xl:inline">Cetak</span>
            </button>

            {/* Tanya Tutor AI Sokratik CTA (Hanya jika diaktifkan guru) */}
            {isAiEnabled && (
              <button
                type="button"
                onClick={() => setIsAiOpen(!isAiOpen)}
                className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition whitespace-nowrap shrink-0 cursor-pointer"
                title="Buka Asisten Tutor AI Sokratik"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                <span className="hidden sm:inline">Tanya Tutor</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. VIEW SELECTION RENDERING                                          */}
      {/* ===================================================================== */}
      <div className="w-full px-3 sm:px-6 md:px-8 lg:px-10 pt-6 transition-all">
        {/* ------------------------------------------------------------------- */}
        {/* VIEW A: MODE DOKUMEN PDF LENGKAP (CONTINUOUS TEXTBOOK READING VIEW) */}
        {/* ------------------------------------------------------------------- */}
        {viewMode === "pdf" && (
          <div id="materi-reader-content" className="w-full space-y-8" onMouseUp={handleMouseUp}>
              {/* E-Book Document Cover Header */}
              <div
                className={`p-5 sm:p-6 rounded-xl relative overflow-hidden transition-all ${paperClasses}`}
              >
                {/* Visual Top Architectural Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600/80" />

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-900/40 dark:text-blue-200">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      <span>Kurikulum Merdeka • Fase D</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {mapel} • {displayKelas}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                      Bab {urutanBab}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight leading-snug text-slate-900 dark:text-white font-heading">
                    {effectiveJudulBab}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {effectiveDeskripsiBab ||
                      "Buku teks modul ajar komprehensif memuat apersepsi kontekstual, konsep materi terperinci, formulasi ilmiah/matematis, contoh soal bertahap, dan rangkuman intisari."}
                  </p>
                </div>
              </div>

              {/* Continuous Long-Form Modules */}
              <div className="space-y-8">
                {effectiveListMateri.map((mod, idx) => (
                  <article
                    key={mod.id}
                    id={`subbab-${idx + 1}`}
                    className={`p-5 sm:p-6 rounded-xl relative transition-all scroll-mt-24 ${paperClasses}`}
                  >
                    {/* Section Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            Sub-Bab {idx + 1} dari {effectiveListMateri.length}
                          </div>
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                            {mod.judul}
                          </h2>
                        </div>
                      </div>

                      {isAiEnabled && (
                        <button
                          onClick={() => handleAskAi(`Tolong bantu jelaskan materi ini dengan bahasa sederhana: ${mod.judul}`)}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 transition cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
                          title="Tanya Tutor AI tentang materi ini"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          <span>Tanya Tutor AI</span>
                        </button>
                      )}
                    </div>

                    {/* Markdown Body with LaTeX & Custom Styling */}
                    <div className={`prose max-w-none ${fontSizeClass} dark:prose-invert`}>
                      <MarkdownRenderer
                        content={
                          mod.konten_markdown ||
                          `### ${mod.judul}\n\nMateri sedang disiapkan untuk ditampilkan.`
                        }
                      />
                    </div>

                    {/* Kuis Kreatif Terpandu Sub-Bab (Siswa Dipandu Mengerjakan Soal Langkah demi Langkah) */}
                    <SubBabCreativeQuiz
                      babId={babId}
                      babUrutan={urutanBab}
                      babJudul={effectiveJudulBab}
                      subBabId={mod.id}
                      subBabUrutan={idx + 1}
                      subBabJudul={mod.judul}
                      isCompleted={readMateriIds.has(mod.id)}
                      onComplete={() => handleMarkComplete(mod.id)}
                      onAskAiHint={(prompt) => {
                        setAiPrompt(prompt);
                        setIsAiOpen(true);
                      }}
                    />

                    {/* Section Footer */}
                    <div className="mt-6 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-500">Sub-Bab {idx + 1} dari {effectiveListMateri.length}</span>
                        {readMateriIds.has(mod.id) ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold text-xs border border-emerald-200/60">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Sub-Bab Selesai Dipahami</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMarkComplete(mod.id)}
                            disabled={markingMateriId === mod.id}
                            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-2xs cursor-pointer disabled:opacity-50"
                          >
                            {markingMateriId === mod.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Tandai Sub-Bab Selesai</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="hover:text-blue-600 transition flex items-center gap-1 font-medium text-slate-500 cursor-pointer"
                      >
                        <span>Kembali ke Atas ↑</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Bottom Call to Action Card: Kuis Keseluruhan Bab (Mencakup 3 Sub-Bab) */}
              <div className="p-5 sm:p-6 rounded-2xl border border-blue-200/80 bg-linear-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all">
                <div className="space-y-2 text-left max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Ulangan Bab {urutanBab}</span>
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300/60 dark:bg-blue-950 dark:text-blue-200">
                      15 Soal Terpadu
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300">
                      Mencakup 3 Sub-Bab
                    </span>
                    {effectiveListMateri.every((m) => readMateriIds.has(m.id)) ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>3 Sub-Bab Lengkap</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                        {effectiveListMateri.filter((m) => readMateriIds.has(m.id)).length}/3 Sub-Bab Dipelajari
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Ulangan Harian Bab {urutanBab}: {effectiveJudulBab.replace(/^Bab\s*\d+\s*:\s*/i, "").trim() || effectiveJudulBab}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
                    Evaluasi terstandar Kurikulum Merdeka untuk Bab {urutanBab} memadukan pemahaman konsep, penalaran singkat, dan pemecahan masalah mendalam.
                  </p>

                  {/* Komposisi Soal Sesuai Rencana: 10 Pilihan Ganda, 3 Isian Singkat, 2 Esai */}
                  <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>10 Pilihan Ganda</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>3 Isian Singkat</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>2 Esai & Penalaran</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px]">
                      <span>KKM 75 • 30 Menit</span>
                    </span>
                  </div>
                </div>

                {/* HANYA 1 BUTTON SESUAI PERINTAH */}
                <div className="shrink-0 w-full md:w-auto">
                  <Link
                    href={`/quiz/${babId}?mode=inclass&babId=${babId}`}
                    className="w-full md:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition active:scale-98 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Mulai Ulangan Bab (15 Soal) →</span>
                  </Link>
                </div>
              </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW B: MODE JURNAL INTERAKTIF (PAGE-BY-PAGE WITH HIGHLIGHTS)       */}
        {/* ------------------------------------------------------------------- */}
        {viewMode === "journal" && (
          <div className="space-y-6">
            <DigitalJournalReader
              babId={babId}
              judulBab={effectiveJudulBab}
              deskripsiBab={effectiveDeskripsiBab}
              urutanBab={urutanBab}
              mapel={mapel}
              kelas={kelas}
              namaKelas={displayKelas}
              studentName={studentName}
              listMateri={effectiveListMateri.map((m) => ({
                id: m.id,
                judul: m.judul,
                urutan: m.urutan,
                konten_markdown: m.konten_markdown,
              }))}
              initialPageIndex={Math.max(
                0,
                effectiveListMateri.findIndex((m) => m.id === selectedMateriId)
              )}
            />
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW C: MODE DAFTAR MODUL (SYLLABUS CARDS OVERVIEW)                 */}
        {/* ------------------------------------------------------------------- */}
        {viewMode === "modules" && (
          <div className="space-y-6">
            {/* Header Hero Card */}
            <div className="bg-white rounded-xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <span className="inline-block text-[11px] font-semibold text-[#0F172A] bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-3 py-1 rounded-full">
                  Kurikulum Merdeka • Fase D • {mapel} • {displayKelas} • Bab {urutanBab}
                </span>
                <h1 className="text-xl sm:text-2xl font-semibold text-[#0F172A] tracking-tight font-heading">
                  {effectiveJudulBab}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {effectiveDeskripsiBab ||
                    "Modul ajar terstruktur mencakup konsep inti, contoh soal, dan latihan terbimbing."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  onClick={() => setViewMode("pdf")}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span>Buka Bacaan PDF Lengkap</span>
                </button>

                <button
                  onClick={() => setViewMode("journal")}
                  className="px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-amber-300" />
                  <span>Buka Jurnal Digital</span>
                </button>
              </div>
            </div>

            {/* List of Modules */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <List className="w-4 h-4 text-indigo-500" />
                  <span>Modul Pembelajaran Bab Ini</span>
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {effectiveListMateri.length} Modul Ajar Tersedia
                </span>
              </div>

              <div className="space-y-3">
                {effectiveListMateri.map((mod, idx) => (
                  <div
                    key={mod.id}
                    className="bg-white rounded-xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900">
                            {mod.judul}
                          </h3>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Sub-Bab {idx + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {typeof mod.durasiMenit === "number"
                              ? mod.durasiMenit > 0
                                ? `${mod.durasiMenit} Menit`
                                : "Bebas (Tanpa Durasi)"
                              : `${15 + idx * 5} Menit`}
                          </span>
                          <span>• Teks Penjelasan Lengkap, Contoh Soal & Socratic AI</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedMateriId(mod.id);
                          setViewMode("pdf");
                          setTimeout(() => {
                            const el = document.getElementById(`subbab-${idx + 1}`);
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                          }, 100);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5 text-white" />
                        <span>Baca Sub-Bab {idx + 1}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. FLOATING SELECTION: STABILO, GARIS BAWAH & TANYA THINKSY AI        */}
      {/* ===================================================================== */}
      {selectionPosition && (
        <div
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full bg-[#0F172A] text-white px-2.5 py-1.5 rounded-2xl shadow-2xl flex items-center gap-1.5 sm:gap-2 border border-slate-700 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none"
          style={{
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y}px`,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Stabilo Colors */}
          <div className="flex items-center gap-1.5 pr-1.5 sm:pr-2 border-r border-slate-700/80">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider hidden md:inline mr-0.5">
              Stabilo:
            </span>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleApplyHighlight("yellow");
              }}
              className="w-5 h-5 rounded-md bg-yellow-400 hover:scale-120 active:scale-95 transition shadow-xs cursor-pointer border border-yellow-300/40"
              title="Stabilo Kuning"
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleApplyHighlight("green");
              }}
              className="w-5 h-5 rounded-md bg-emerald-400 hover:scale-120 active:scale-95 transition shadow-xs cursor-pointer border border-emerald-300/40"
              title="Stabilo Hijau"
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleApplyHighlight("pink");
              }}
              className="w-5 h-5 rounded-md bg-pink-400 hover:scale-120 active:scale-95 transition shadow-xs cursor-pointer border border-pink-300/40"
              title="Stabilo Pink"
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleApplyHighlight("blue");
              }}
              className="w-5 h-5 rounded-md bg-sky-400 hover:scale-120 active:scale-95 transition shadow-xs cursor-pointer border border-sky-300/40"
              title="Stabilo Biru"
            />
          </div>

          {/* Garis Bawahi */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleApplyUnderline();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
            title="Garis bawahi tulisan yang sedang diblok dan simpan otomatis"
          >
            <Underline className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Garis Bawah</span>
          </button>

          {/* Tanya Thinksy AI */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAskThinksySelectedText();
            }}
            className="px-3 py-1.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-lg transition cursor-pointer active:scale-95"
            title="Tanya Thinksy AI untuk menjelaskan bagian ini secara otomatis"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
            <span>Tanya Thinksy</span>
          </button>

          {/* Batal */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={() => setSelectionPosition(null)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer"
            title="Batal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. STUDY NOTES DRAWER / MODAL                                        */}
      {/* ===================================================================== */}
      {isNotesDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Drawer Header */}
            <div className="p-5 bg-[#090D16] border-b border-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
                  <MessageSquarePlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">Buku Catatan Belajar Siswa</h3>
                  <p className="text-[10px] text-slate-300">
                    Bab {urutanBab}: {judulBab} ({notesList.length} Catatan)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsNotesDrawerOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Form Tambah Catatan */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-amber-600" /> Tulis Catatan Baru
                  </span>
                  <span className="text-[10px] text-slate-500">Tersimpan lokal & otomatis</span>
                </div>

                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Judul Catatan / Topik (Opsional)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />

                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Tulis ringkasan rumus, poin penting, atau konsep yang ingin diingat sebelum quiz..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                />

                <button
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim()}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Catatan Belajar</span>
                </button>
              </div>

              {/* Daftar Catatan Tersimpan */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Daftar Catatan Rangkuman
                  </h4>
                  <span className="text-xs font-bold text-amber-600">{notesList.length} Tersimpan</span>
                </div>

                {notesList.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs space-y-1">
                    <p className="font-bold">Belum ada catatan yang ditulis.</p>
                    <p className="text-[10px]">Tulis intisari bacaan di formulir atas atau tandai teks bacaan.</p>
                  </div>
                ) : (
                  notesList.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-2xs space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-black text-xs text-slate-900 dark:text-white">{note.title}</h5>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{note.createdAt}</span>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Daftar Teks yang Distabilo */}
              {highlights.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Highlighter className="w-3.5 h-3.5 text-amber-500" /> Kutipan Distabilo
                    </h4>
                    <span className="text-xs font-bold text-blue-600">{highlights.length} Klip</span>
                  </div>

                  <div className="space-y-2">
                    {highlights.map((hl) => {
                      const colorBg =
                        hl.color === "yellow"
                          ? "bg-amber-50 border-amber-200 text-amber-950"
                          : hl.color === "green"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                          : hl.color === "pink"
                          ? "bg-pink-50 border-pink-200 text-pink-950"
                          : "bg-sky-50 border-sky-200 text-sky-950";

                      return (
                        <div
                          key={hl.id}
                          className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start justify-between gap-3 ${colorBg}`}
                        >
                          <p className="font-medium italic">"{hl.text}"</p>
                          <button
                            onClick={() => handleDeleteHighlight(hl.id)}
                            className="text-slate-400 hover:text-red-500 shrink-0 p-1"
                            title="Hapus highlight"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Action */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsNotesDrawerOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Tutup
              </button>

              <Link
                href={`/quiz/${babId}?mode=inclass&babId=${babId}`}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Mulai Ulangan Bab (15 Soal)</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. FLOATING TOAST NOTIFICATION                                       */}
      {/* ===================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. FLOATING SOCRATIC AI CHAT DRAWER                                   */}
      {/* ===================================================================== */}
      {isAiEnabled && isAiOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[550px] animate-in fade-in slide-in-from-bottom-4 duration-200 text-slate-900">
          {/* Header */}
          <div className="bg-[#193446] text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 p-1 flex items-center justify-center shrink-0 border border-white/15 shadow-inner">
                <img src="/logo.png" alt="thinksy AI" className="w-full h-full object-contain drop-shadow-xs" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#E9C77B] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#E9C77B] animate-spin" style={{ animationDuration: "3s" }} />
                  thinksy AI
                </h4>
                <p className="text-[10px] text-slate-300 font-medium">
                  {aiGuidanceStyle === "socratic"
                    ? "Panduan Sokratik Bertahap Tanpa Bocoran"
                    : aiGuidanceStyle === "adaptive"
                    ? "Tutor Adaptif Cepat Tanggap"
                    : "Penjelasan Konsep Menyeluruh"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold bg-white/10 px-2.5 py-1 rounded-full text-slate-200 border border-white/10">
                {aiTokenLimit === 999
                  ? "Sisa Kuota: Bebas"
                  : `Sisa Kuota: ${Math.max(
                      0,
                      aiTokenLimit - aiHistory.filter((m) => m.role === "user").length
                    )}/${aiTokenLimit}`}
              </span>
              <button
                onClick={() => setIsAiOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer text-xs"
                title="Tutup Obrolan"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3.5 max-h-[350px] bg-slate-50/60 custom-scrollbar text-xs">
            {aiHistory.length === 0 ? (
              <div className="text-center py-6 text-slate-400 space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-[#193446] opacity-60" />
                <p className="font-semibold text-slate-600">Ada konsep atau rumus yang ingin kita bedah bersama?</p>
                <div className="flex flex-col gap-1.5 pt-2">
                  <button
                    onClick={() => handleAskAi(`Jelaskan konsep dasar dari ${effectiveJudulBab} dengan contoh sehari-hari`)}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#193446]/40 text-left text-slate-700 text-[11px] transition shadow-2xs font-medium cursor-pointer"
                  >
                    💡 Jelaskan konsep ini dengan contoh sehari-hari
                  </button>
                  <button
                    onClick={() => handleAskAi(`Berikan 1 contoh soal dan langkah penalaran untuk ${effectiveJudulBab}`)}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#193446]/40 text-left text-slate-700 text-[11px] transition shadow-2xs font-medium cursor-pointer"
                  >
                    ✏️ Berikan contoh soal & langkah penalarannya
                  </button>
                </div>
              </div>
            ) : (
              aiHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold overflow-hidden shadow-xs ${
                      msg.role === "user"
                        ? "bg-[#193446] text-[#E9C77B]"
                        : "bg-white border border-slate-200 p-0.5"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <img src="/logo.png" alt="AI" className="w-full h-full object-contain" />
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-2xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#193446] text-white rounded-tr-xs font-medium [&_*]:!text-white"
                        : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-2xs"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap text-white font-medium text-xs leading-relaxed">
                        {msg.content}
                      </p>
                    ) : (
                      <MarkdownRenderer content={msg.content} isCompact />
                    )}
                  </div>
                </div>
              ))
            )}

            {isAiLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                  <img src="/logo.png" alt="AI" className="w-full h-full object-contain" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#193446]" />
                  <span>thinksy AI sedang menyusun petunjuk penalaran...</span>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskAi();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={
                aiTokenLimit !== 999 && aiHistory.filter((m) => m.role === "user").length >= aiTokenLimit
                  ? "Batas kuota pertanyaan AI bab ini telah habis..."
                  : "Tanyakan hal yang belum kamu pahami..."
              }
              disabled={
                isAiLoading ||
                (aiTokenLimit !== 999 && aiHistory.filter((m) => m.role === "user").length >= aiTokenLimit)
              }
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#193446] focus:border-transparent bg-slate-50/50"
            />
            <button
              type="submit"
              disabled={
                isAiLoading ||
                !aiPrompt.trim() ||
                (aiTokenLimit !== 999 && aiHistory.filter((m) => m.role === "user").length >= aiTokenLimit)
              }
              className="p-2.5 rounded-xl bg-[#193446] hover:bg-[#132836] text-[#E9C77B] font-bold shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              title="Kirim pertanyaan"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
