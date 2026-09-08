"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Highlighter,
  MessageSquarePlus,
  Sparkles,
  List,
  CheckCircle2,
  Trash2,
  X,
  Send,
  Loader2,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Coffee,
  Check,
  Plus,
  HelpCircle,
  Flag,
} from "lucide-react";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";

export interface MateriPage {
  id: string;
  judul: string;
  urutan: number;
  konten_markdown?: string;
}

export interface HighlightItem {
  id: string;
  materi_id: string;
  halaman_nomor: number;
  text_content: string;
  color: "yellow" | "green" | "pink" | "blue";
  dibuat_pada: string;
}

export interface MarginNoteItem {
  id: string;
  materi_id: string;
  halaman_nomor: number;
  judul: string;
  konten: string;
  dibuat_pada: string;
}

interface DigitalJournalReaderProps {
  babId: string;
  judulBab: string;
  deskripsiBab: string;
  urutanBab: number;
  mapel?: string;
  kelas?: number;
  listMateri: MateriPage[];
  initialPageIndex?: number;
}

type ReadingTheme = "light" | "sepia" | "dark";
type FontSize = "normal" | "large" | "xlarge";

export default function DigitalJournalReader({
  babId,
  judulBab,
  deskripsiBab,
  urutanBab,
  mapel = "Matematika",
  kelas = 8,
  listMateri = [],
  initialPageIndex = 0,
}: DigitalJournalReaderProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>("light");
  const [fontSize, setFontSize] = useState<FontSize>("normal");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState(false);

  // Highlighting state
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);

  // Margin notes state
  const [marginNotes, setMarginNotes] = useState<MarginNoteItem[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [isAddingNoteModal, setIsAddingNoteModal] = useState(false);

  // Bookmarks state
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>([]);

  // AI Tutor contextual state
  const [aiQuery, setAiQuery] = useState("");
  const [aiHistory, setAiHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Status feedback toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const currentPage = listMateri[currentPageIndex] || listMateri[0];
  const totalPages = listMateri.length;
  const progressPercent = totalPages > 0 ? Math.round(((currentPageIndex + 1) / totalPages) * 100) : 0;

  // Load highlights, notes, and bookmarks on page change
  useEffect(() => {
    if (!currentPage?.id) return;
    fetchHighlights(currentPage.id);
    fetchMarginNotes(currentPage.id);
    fetchBookmarks(currentPage.id);
  }, [currentPage?.id, currentPageIndex]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchHighlights = async (materiId: string) => {
    try {
      const res = await fetch(`/api/siswa/journal/highlight?materiId=${materiId}`);
      if (res.ok) {
        const data = await res.json();
        setHighlights(data.highlights || []);
      }
    } catch {}
  };

  const fetchMarginNotes = async (materiId: string) => {
    try {
      const res = await fetch(`/api/siswa/journal/catatan?materiId=${materiId}`);
      if (res.ok) {
        const data = await res.json();
        setMarginNotes(data.notes || []);
      }
    } catch {}
  };

  const fetchBookmarks = async (materiId: string) => {
    try {
      const res = await fetch(`/api/siswa/journal/bookmark?materiId=${materiId}`);
      if (res.ok) {
        const data = await res.json();
        const pages = (data.bookmarks || []).map((b: any) => b.halaman_nomor);
        setBookmarkedPages(pages);
      }
    } catch {}
  };

  // Handle text selection for floating Stabilo menu
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionPosition(null);
      setSelectedText("");
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 2) {
      setSelectedText(text);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    } else {
      setSelectionPosition(null);
    }
  };

  // Apply highlight
  const handleApplyHighlight = async (color: "yellow" | "green" | "pink" | "blue") => {
    if (!selectedText || !currentPage?.id) return;

    const tempHighlight: HighlightItem = {
      id: Date.now().toString(),
      materi_id: currentPage.id,
      halaman_nomor: currentPageIndex + 1,
      text_content: selectedText,
      color,
      dibuat_pada: new Date().toISOString(),
    };

    setHighlights((prev) => [...prev, tempHighlight]);
    setSelectionPosition(null);
    showToast(`Teks distabilo (${color}) ✨`);

    try {
      await fetch("/api/siswa/journal/highlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materiId: currentPage.id,
          babId,
          halamanNomor: currentPageIndex + 1,
          textContent: selectedText,
          color,
        }),
      });
      fetchHighlights(currentPage.id);
    } catch {}
  };

  // Delete highlight
  const handleDeleteHighlight = async (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    showToast("Stabilo dihapus");
    try {
      await fetch(`/api/siswa/journal/highlight?id=${id}`, { method: "DELETE" });
    } catch {}
  };

  // Add margin note
  const handleSaveNote = async () => {
    if (!newNoteText.trim() || !currentPage?.id) return;

    const tempNote: MarginNoteItem = {
      id: Date.now().toString(),
      materi_id: currentPage.id,
      halaman_nomor: currentPageIndex + 1,
      judul: newNoteTitle.trim() || "Catatan Halaman " + (currentPageIndex + 1),
      konten: newNoteText.trim(),
      dibuat_pada: new Date().toLocaleDateString("id-ID"),
    };

    setMarginNotes((prev) => [tempNote, ...prev]);
    setNewNoteText("");
    setNewNoteTitle("");
    setIsAddingNoteModal(false);
    showToast("Catatan margin berhasil disimpan 📌");

    try {
      await fetch("/api/siswa/journal/catatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materiId: currentPage.id,
          babId,
          halamanNomor: currentPageIndex + 1,
          judul: tempNote.judul,
          konten: tempNote.konten,
        }),
      });
      fetchMarginNotes(currentPage.id);
    } catch {}
  };

  // Delete note
  const handleDeleteNote = async (id: string) => {
    setMarginNotes((prev) => prev.filter((n) => n.id !== id));
    showToast("Catatan dihapus");
    try {
      await fetch(`/api/siswa/journal/catatan?id=${id}`, { method: "DELETE" });
    } catch {}
  };

  // Toggle bookmark for current page
  const handleToggleBookmark = async () => {
    if (!currentPage?.id) return;
    const pageNum = currentPageIndex + 1;
    const isBookmarked = bookmarkedPages.includes(pageNum);

    if (isBookmarked) {
      setBookmarkedPages((prev) => prev.filter((p) => p !== pageNum));
      showToast("Penanda buku dilepas");
    } else {
      setBookmarkedPages((prev) => [...prev, pageNum]);
      showToast("Halaman ditandai sebagai bookmark 🔖");
    }

    try {
      if (isBookmarked) {
        await fetch(`/api/siswa/journal/bookmark?materiId=${currentPage.id}`, { method: "DELETE" });
      } else {
        await fetch("/api/siswa/journal/bookmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materiId: currentPage.id,
            babId,
            halamanNomor: pageNum,
            judulHalaman: currentPage.judul,
          }),
        });
      }
    } catch {}
  };

  // Ask AI Assistant with context
  const handleAskAiContext = (presetPrompt?: string) => {
    const prompt = presetPrompt || selectedText || "Jelaskan konsep ini dengan bahasa sederhana.";
    setAiQuery(prompt);
    setIsAiDrawerOpen(true);
    setSelectionPosition(null);
  };

  const handleSendAiMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiQuery.trim() || isAiLoading) return;

    const userMsg = aiQuery.trim();
    setAiQuery("");
    setAiHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materiJudul: `${judulBab} - ${currentPage?.judul}`,
          materiKonten: currentPage?.konten_markdown?.substring(0, 1500) || "",
          message: userMsg,
          history: aiHistory,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setAiHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setAiHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Maaf, terjadi kendala saat memproses jawaban." },
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

  // Theme styling definitions
  const themeClasses = {
    light: "bg-[#F8FAFC] text-slate-900",
    sepia: "bg-[#FBF0D9] text-[#2C2416]",
    dark: "bg-[#0F172A] text-slate-100",
  };

  const paperClasses = {
    light: "bg-white border-slate-200 shadow-sm",
    sepia: "bg-[#FFFBF0] border-[#EADFC7] shadow-sm text-[#2C2416]",
    dark: "bg-[#1E293B] border-slate-800 shadow-md text-slate-100",
  };

  const fontSizeClass = {
    normal: "text-sm sm:text-base leading-relaxed",
    large: "text-base sm:text-lg leading-relaxed",
    xlarge: "text-lg sm:text-xl leading-relaxed",
  }[fontSize];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${themeClasses[readingTheme]}`}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F172A] text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. TOP JOURNAL NAVIGATION BAR */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          readingTheme === "dark"
            ? "bg-slate-900/90 border-slate-800 text-white"
            : readingTheme === "sepia"
            ? "bg-[#F4E8CE]/90 border-[#E5D7B7] text-[#2C2416]"
            : "bg-white/95 border-slate-200 text-slate-900"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          {/* Left: Back & Journal Info */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
                readingTheme === "dark"
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>

            <div className="border-l border-slate-300/50 pl-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {mapel} • Kelas {kelas}
                </span>
                <span className="text-xs font-extrabold truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  {judulBab}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Controls & Preferences */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Table of Contents Button */}
            <button
              onClick={() => setIsTocOpen(!isTocOpen)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                isTocOpen
                  ? "bg-[#0F172A] text-white border-slate-900"
                  : readingTheme === "dark"
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
              title="Daftar Isi Bab (TOC)"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">Daftar Isi</span>
            </button>

            {/* Bookmark Current Page */}
            <button
              onClick={handleToggleBookmark}
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                bookmarkedPages.includes(currentPageIndex + 1)
                  ? "bg-amber-500 text-white border-amber-600"
                  : readingTheme === "dark"
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
              title="Tandai Halaman Ini (Bookmark)"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            {/* Notes Drawer Toggle */}
            <button
              onClick={() => setIsNotesDrawerOpen(!isNotesDrawerOpen)}
              className={`relative p-2 rounded-xl border text-xs font-bold transition ${
                isNotesDrawerOpen
                  ? "bg-[#0F172A] text-white"
                  : readingTheme === "dark"
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
              title="Catatan Margin Halaman Ini"
            >
              <MessageSquarePlus className="w-4 h-4" />
              {marginNotes.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">
                  {marginNotes.length}
                </span>
              )}
            </button>

            {/* Reading Theme Selector */}
            <div
              className={`flex items-center p-0.5 rounded-xl border ${
                readingTheme === "dark"
                  ? "bg-slate-800 border-slate-700"
                  : "bg-slate-100 border-slate-200"
              }`}
            >
              <button
                onClick={() => setReadingTheme("light")}
                className={`p-1.5 rounded-lg transition ${
                  readingTheme === "light" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Mode Terang (Kertas Putih)"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setReadingTheme("sepia")}
                className={`p-1.5 rounded-lg transition ${
                  readingTheme === "sepia" ? "bg-[#F4E8CE] text-[#2C2416] shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Mode Sepia (Kertas Buku Hangat)"
              >
                <Coffee className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setReadingTheme("dark")}
                className={`p-1.5 rounded-lg transition ${
                  readingTheme === "dark" ? "bg-slate-700 text-white shadow-2xs" : "text-slate-500 hover:text-slate-200"
                }`}
                title="Mode Malam (Membaca Gelap)"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Font Size Toggle */}
            <button
              onClick={() => {
                if (fontSize === "normal") setFontSize("large");
                else if (fontSize === "large") setFontSize("xlarge");
                else setFontSize("normal");
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-extrabold transition ${
                readingTheme === "dark"
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
              title="Ubah Ukuran Tulisan"
            >
              A{fontSize === "large" ? "+" : fontSize === "xlarge" ? "++" : ""}
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN JOURNAL CONTAINER (2 Columns: TOC / Margin Drawer & Book Page) */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================= */}
          {/* LEFT SIDEBAR: Table of Contents / Outline */}
          {/* ========================================================= */}
          <div
            className={`lg:col-span-3 ${
              isTocOpen ? "block" : "hidden lg:block"
            } transition-all space-y-4 sticky top-20`}
          >
            <div className={`p-4 sm:p-5 rounded-3xl border ${paperClasses[readingTheme]}`}>
              <div className="flex items-center justify-between pb-3 border-b border-black/5 mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider">
                    Daftar Isi Jurnal
                  </h2>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {totalPages} Halaman
                </span>
              </div>

              <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 custom-scrollbar">
                {listMateri.map((m, idx) => {
                  const isActive = idx === currentPageIndex;
                  const isBookmarked = bookmarkedPages.includes(idx + 1);

                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setCurrentPageIndex(idx);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-full text-left p-2.5 rounded-2xl transition flex items-center justify-between text-xs font-bold cursor-pointer border ${
                        isActive
                          ? "bg-[#0F172A] text-white border-slate-900 shadow-xs"
                          : readingTheme === "dark"
                          ? "hover:bg-slate-800 text-slate-300 border-transparent"
                          : "hover:bg-slate-100 text-slate-700 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                            isActive
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate">{m.judul}</span>
                      </div>

                      {isBookmarked && (
                        <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Final Step Button: Evaluasi / Kuis Bab */}
              <div className="pt-4 border-t border-black/5 mt-4">
                <Link
                  href={`/quiz/sesi-demo?mode=inclass&babId=${babId}`}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Uji Pemahaman (Kuis Bab)</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* CENTER: THE DIGITAL LEARNING JOURNAL READING SURFACE */}
          {/* ========================================================= */}
          <div className="lg:col-span-9 space-y-6">
            {/* Book-like Page Surface */}
            <div
              ref={contentRef}
              onMouseUp={handleMouseUp}
              className={`rounded-3xl border p-6 sm:p-10 md:p-12 relative transition-all ${paperClasses[readingTheme]}`}
            >
              {/* Top Page Header (Journal Meta) */}
              <div className="flex items-center justify-between border-b border-black/10 pb-5 mb-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-blue-600 uppercase tracking-wide">
                    Halaman {currentPageIndex + 1} dari {totalPages}
                  </span>
                  <span>•</span>
                  <span>{progressPercent}% Membaca Selesai</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAskAiContext()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border border-blue-200 transition text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tanya Asisten AI</span>
                  </button>
                </div>
              </div>

              {/* Page Title */}
              <div className="mb-6 space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  {mapel} • Bab {urutanBab}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {currentPage?.judul || "Materi Pembelajaran"}
                </h1>
              </div>

              {/* Markdown Content Surface */}
              <div className={`prose max-w-none ${fontSizeClass}`}>
                <MarkdownRenderer
                  content={
                    currentPage?.konten_markdown ||
                    "### Halaman Materi Sedang Dimuat\n\nSilakan pilih halaman dari daftar isi."
                  }
                />
              </div>

              {/* Highlighted text list on current page */}
              {highlights.length > 0 && (
                <div className="mt-8 pt-6 border-t border-black/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-slate-500">
                      <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                      <span>Teks Yang Telah Distabilo di Halaman Ini ({highlights.length})</span>
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {highlights.map((h) => {
                      const colorBadge = {
                        yellow: "bg-yellow-100/90 text-yellow-900 border-yellow-300",
                        green: "bg-emerald-100/90 text-emerald-900 border-emerald-300",
                        pink: "bg-pink-100/90 text-pink-900 border-pink-300",
                        blue: "bg-sky-100/90 text-sky-900 border-sky-300",
                      }[h.color];

                      return (
                        <div
                          key={h.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs leading-relaxed ${colorBadge}`}
                        >
                          <div className="font-medium italic truncate">
                            &ldquo;{h.text_content}&rdquo;
                          </div>
                          <button
                            onClick={() => handleDeleteHighlight(h.id)}
                            className="p-1.5 hover:bg-black/10 rounded-lg text-slate-600 transition shrink-0"
                            title="Hapus Stabilo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bottom Pagination Bar */}
              <div className="mt-10 pt-6 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={() => {
                    if (currentPageIndex > 0) {
                      setCurrentPageIndex((prev) => prev - 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  disabled={currentPageIndex === 0}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1.5 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Halaman Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {listMateri.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentPageIndex(idx);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        idx === currentPageIndex ? "w-6 bg-blue-600" : "bg-slate-300 hover:bg-slate-400"
                      }`}
                      title={`Ke Halaman ${idx + 1}`}
                    />
                  ))}
                </div>

                {currentPageIndex < totalPages - 1 ? (
                  <button
                    onClick={() => {
                      setCurrentPageIndex((prev) => prev + 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <span>Halaman Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <Link
                    href={`/quiz/sesi-demo?mode=inclass&babId=${babId}`}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow-md"
                  >
                    <span>Selesai Membaca — Lanjut Kuis Bab →</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* FLOATING STABILO SELECTION POPUP */}
      {/* ========================================================= */}
      {selectionPosition && (
        <div
          style={{
            position: "fixed",
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y - 45}px`,
            transform: "translateX(-50%)",
          }}
          className="z-50 bg-[#0F172A] text-white p-1.5 rounded-2xl shadow-2xl flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150 border border-slate-700"
        >
          {/* Stabilo Yellow */}
          <button
            onClick={() => handleApplyHighlight("yellow")}
            className="w-6 h-6 rounded-lg bg-yellow-400 hover:scale-110 transition shadow-2xs cursor-pointer"
            title="Stabilo Kuning"
          />
          {/* Stabilo Green */}
          <button
            onClick={() => handleApplyHighlight("green")}
            className="w-6 h-6 rounded-lg bg-emerald-400 hover:scale-110 transition shadow-2xs cursor-pointer"
            title="Stabilo Hijau"
          />
          {/* Stabilo Pink */}
          <button
            onClick={() => handleApplyHighlight("pink")}
            className="w-6 h-6 rounded-lg bg-pink-400 hover:scale-110 transition shadow-2xs cursor-pointer"
            title="Stabilo Pink"
          />
          {/* Stabilo Blue */}
          <button
            onClick={() => handleApplyHighlight("blue")}
            className="w-6 h-6 rounded-lg bg-sky-400 hover:scale-110 transition shadow-2xs cursor-pointer"
            title="Stabilo Biru"
          />

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* Add Margin Note button */}
          <button
            onClick={() => {
              setNewNoteText(`📌 Teks rujukan: "${selectedText}"\n\nCatatan: `);
              setIsAddingNoteModal(true);
              setSelectionPosition(null);
            }}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 text-slate-200 hover:text-white transition cursor-pointer"
            title="Tambah Catatan Margin"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Catat</span>
          </button>

          {/* Ask AI about this text */}
          <button
            onClick={() => handleAskAiContext(`Tolong jelaskan bagian ini dengan bahasa sederhana: "${selectedText}"`)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 text-blue-400 hover:text-blue-300 transition cursor-pointer"
            title="Tanya AI tentang teks ini"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tanya AI</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* FLOATING ACTION HUB (+) - QUICK LEARNING ACTIONS */}
      {/* ========================================================= */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Floating Menu Popover */}
        {isFloatingMenuOpen && (
          <div className="absolute bottom-16 right-0 w-64 bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-3 space-y-1.5 animate-in fade-in slide-in-from-bottom-3 duration-200 text-slate-900">
            <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Aksi Pembelajaran Cepat
            </div>

            <button
              onClick={() => {
                setIsAddingNoteModal(true);
                setIsFloatingMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-[#0F172A] transition"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <MessageSquarePlus className="w-4 h-4" />
              </div>
              <span>Tambah Catatan Margin</span>
            </button>

            <button
              onClick={() => {
                handleToggleBookmark();
                setIsFloatingMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-[#0F172A] transition"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
              <span>
                {bookmarkedPages.includes(currentPageIndex + 1) ? "Hapus Penanda Halaman" : "Tandai Halaman Ini"}
              </span>
            </button>

            <button
              onClick={() => {
                handleAskAiContext();
                setIsFloatingMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-[#0F172A] transition"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Tanya Tutor AI Kontekstual</span>
            </button>

            <button
              onClick={() => {
                showToast("Laporan topik sulit dikirimkan ke guru pembimbing 🙏");
                setIsFloatingMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-rose-600 transition"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Flag className="w-4 h-4" />
              </div>
              <span>Tandai Topik Sulit</span>
            </button>
          </div>
        )}

        {/* Floating Trigger Button */}
        <button
          onClick={() => setIsFloatingMenuOpen(!isFloatingMenuOpen)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition duration-200 cursor-pointer ${
            isFloatingMenuOpen ? "bg-slate-900 text-white rotate-45" : "bg-[#0F172A] hover:bg-slate-800 text-white"
          }`}
          title="Quick Learning Actions"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* ========================================================= */}
      {/* MARGIN NOTES DRAWER */}
      {/* ========================================================= */}
      {isNotesDrawerOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl p-5 overflow-y-auto flex flex-col justify-between text-slate-900 animate-in slide-in-from-right duration-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-[#0F172A]">
                  Catatan Halaman {currentPageIndex + 1}
                </h3>
              </div>
              <button
                onClick={() => setIsNotesDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setIsAddingNoteModal(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-blue-200 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Catatan Baru</span>
            </button>

            <div className="space-y-3">
              {marginNotes.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Belum ada catatan margin pada halaman ini.
                </div>
              ) : (
                marginNotes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#0F172A]">
                        {n.judul}
                      </span>
                      <button
                        onClick={() => handleDeleteNote(n.id)}
                        className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {n.konten}
                    </p>
                    <div className="text-[10px] text-slate-400 font-semibold">
                      {n.dibuat_pada}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONTEXTUAL AI TUTOR DRAWER */}
      {/* ========================================================= */}
      {isAiDrawerOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between text-slate-900 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-[#0F172A]">
                  Tutor AI Sokratik ({mapel})
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  Mendampingi materi: {currentPage?.judul}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAiDrawerOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat History Messages */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3.5 custom-scrollbar text-xs">
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-900 leading-relaxed">
              Halo! Saya adalah <strong>Socratic AI Tutor</strong> pendamping belajarmu di materi <strong>{currentPage?.judul}</strong>. Saya siap membimbingmu memahami konsep ini secara bertahap melalui pertanyaan reflektif dan pembedahan logika! 🦉✨
            </div>

            {aiHistory.map((msg, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl leading-relaxed text-xs ${
                  msg.role === "user"
                    ? "bg-[#0F172A] text-white ml-6"
                    : "bg-slate-100 text-slate-800 mr-6 border border-slate-200/80"
                }`}
              >
                <div className="font-extrabold text-[10px] opacity-70 mb-1">
                  {msg.role === "user" ? "Kamu" : "Tutor AI"}
                </div>
                <div className="prose prose-xs max-w-none text-inherit">
                  <MarkdownRenderer content={msg.content} />
                </div>
              </div>
            ))}

            {isAiLoading && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Tutor AI sedang menyusun penjelasan...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendAiMessage} className="p-3 border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              placeholder="Tanyakan konsep materi ini..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <button
              type="submit"
              disabled={isAiLoading || !aiQuery.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD MARGIN NOTE MODAL */}
      {/* ========================================================= */}
      {isAddingNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-slate-900 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-blue-600" />
                <span>Tambah Catatan Margin (Halaman {currentPageIndex + 1})</span>
              </h3>
              <button
                onClick={() => setIsAddingNoteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Judul Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Rumus Gradien Garis Tegak Lurus"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Isi Catatan Pribadi
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan pemahamanmu atau bagian yang perlu ditanyakan ke guru..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsAddingNoteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!newNoteText.trim()}
                className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition shadow-xs"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
