"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Users,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  List,
  RemoveFormatting,
  Triangle,
  Play,
  Upload,
  Link2,
  Check,
} from "lucide-react";
import {
  StreamAnnouncement,
  applyFormatToText,
  AnnouncementAttachment,
} from "@/lib/announcement-format";

interface AnnouncementComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (announcementData: {
    text: string;
    subjectTag: string;
    className: string;
    attachments: AnnouncementAttachment[];
    id?: string;
  }) => void;
  editingPost?: StreamAnnouncement | null;
  availableClasses?: { id: string; name: string }[];
  currentClassId?: string;
}

export default function AnnouncementComposerModal({
  isOpen,
  onClose,
  onSubmit,
  editingPost,
  availableClasses = [
    { id: "mat-8", name: "Kelas 8-A (Matematika)" },
    { id: "tech-sd", name: "Level SD - Tech" },
    { id: "indo-8", name: "Kelas 8-A (Bahasa Indonesia)" },
    { id: "ing-8", name: "Kelas 8-A (Bahasa Inggris)" },
  ],
  currentClassId = "mat-8",
}: AnnouncementComposerModalProps) {
  const [text, setText] = useState("");
  const [selectedClass, setSelectedClass] = useState(currentClassId);
  const [targetAudience, setTargetAudience] = useState<"all" | "selected">("all");
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>([]);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isAudienceDropdownOpen, setIsAudienceDropdownOpen] = useState(false);
  const [attachmentModalType, setAttachmentModalType] = useState<"link" | "youtube" | "drive" | null>(null);
  const [attachmentUrlInput, setAttachmentUrlInput] = useState("");
  const [attachmentTitleInput, setAttachmentTitleInput] = useState("");
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or editingPost changes
  useEffect(() => {
    if (editingPost) {
      setText(editingPost.text || "");
      setSelectedClass(editingPost.subjectTag || currentClassId);
      setAttachments(editingPost.attachments || []);
    } else {
      setText("");
      setSelectedClass(currentClassId);
      setAttachments([]);
    }
  }, [editingPost, currentClassId, isOpen]);

  if (!isOpen) return null;

  const currentClassObj =
    availableClasses.find((c) => c.id === selectedClass) || availableClasses[0];

  const handleFormat = (type: "bold" | "italic" | "underline" | "bullet" | "clear") => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;

    const result = applyFormatToText(text, start, end, type);
    setText(result.newText);

    // Restore selection focus
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(result.newStart, result.newEnd);
    }, 10);
  };

  const handleAddAttachment = () => {
    if (!attachmentUrlInput.trim()) return;

    const newAtt: AnnouncementAttachment = {
      type: attachmentModalType === "youtube" ? "youtube" : attachmentModalType === "drive" ? "drive" : "link",
      title: attachmentTitleInput.trim() || attachmentUrlInput.trim(),
      url: attachmentUrlInput.trim().startsWith("http")
        ? attachmentUrlInput.trim()
        : `https://${attachmentUrlInput.trim()}`,
    };

    setAttachments((prev) => [...prev, newAtt]);
    setAttachmentModalType(null);
    setAttachmentUrlInput("");
    setAttachmentTitleInput("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newAtt: AnnouncementAttachment = {
        type: "file",
        title: file.name,
        url: "#",
      };
      setAttachments((prev) => [...prev, newAtt]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSubmit({
      text: text.trim(),
      subjectTag: selectedClass,
      className: currentClassObj?.name || "Kelas 8-A",
      attachments,
      id: editingPost?.id,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* MODAL HEADER (Matches Screenshot 2) */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-xl font-normal text-slate-800 tracking-tight font-sans">
            {editingPost ? "Edit announcement" : "Announcement"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* "FOR" ROW: Class Selector + Students Pill (Matches Screenshot 2) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              For
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {/* Class Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsClassDropdownOpen(!isClassDropdownOpen);
                    setIsAudienceDropdownOpen(false);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  <span className="truncate max-w-[180px]">{currentClassObj?.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isClassDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-20">
                    {availableClasses.map((cls) => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          setSelectedClass(cls.id);
                          setIsClassDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                          selectedClass === cls.id
                            ? "bg-blue-50 text-[#1967D2] font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{cls.name}</span>
                        {selectedClass === cls.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* All Students Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsAudienceDropdownOpen(!isAudienceDropdownOpen);
                    setIsClassDropdownOpen(false);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 text-xs font-bold text-[#1967D2] transition cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-[#1967D2]" />
                  <span>
                    {targetAudience === "all" ? "All students" : "Selected students"}
                  </span>
                </button>

                {isAudienceDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-20">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetAudience("all");
                        setIsAudienceDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-50 flex items-center justify-between text-slate-700"
                    >
                      <span>Semua Siswa</span>
                      {targetAudience === "all" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetAudience("selected");
                        setIsAudienceDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-50 flex items-center justify-between text-slate-700"
                    >
                      <span>Siswa Tertentu</span>
                      {targetAudience === "selected" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TEXT AREA WITH FORMATTING TOOLBAR AT THE BOTTOM (Matches Screenshot 2) */}
          <div className="border border-slate-200 rounded-2xl focus-within:border-[#1a73e8] focus-within:ring-2 focus-within:ring-blue-500/15 overflow-hidden transition bg-white shadow-2xs">
            <textarea
              ref={textareaRef}
              rows={4}
              required
              placeholder="Announce something to your class"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-4 text-xs sm:text-sm text-slate-800 placeholder-blue-600/70 focus:placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
            />

            {/* FORMATTING TOOLBAR: B, I, U, List, Clear (Matches Screenshot 2) */}
            <div className="flex items-center gap-1 px-3 py-2 border-t border-slate-100 bg-slate-50/60">
              {/* Bold */}
              <button
                type="button"
                onClick={() => handleFormat("bold")}
                title="Tebal (Ctrl+B / **bold**)"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
              >
                <Bold className="w-4 h-4 font-black" />
              </button>

              {/* Italic */}
              <button
                type="button"
                onClick={() => handleFormat("italic")}
                title="Miring (Ctrl+I / *italic*)"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
              >
                <Italic className="w-4 h-4" />
              </button>

              {/* Underline */}
              <button
                type="button"
                onClick={() => handleFormat("underline")}
                title="Garis Bawah (Ctrl+U / <u>text</u>)"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
              >
                <Underline className="w-4 h-4" />
              </button>

              {/* Bullet List */}
              <button
                type="button"
                onClick={() => handleFormat("bullet")}
                title="Daftar Butir (• item)"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
              >
                <List className="w-4 h-4" />
              </button>

              {/* Remove Formatting */}
              <button
                type="button"
                onClick={() => handleFormat("clear")}
                title="Hapus Pemformatan"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition cursor-pointer ml-1"
              >
                <RemoveFormatting className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ATTACHMENT CHIPS */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 text-xs font-medium text-blue-900"
                >
                  <span className="truncate max-w-[200px]">{att.title}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setAttachments((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="text-blue-500 hover:text-rose-600 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* POPUP FOR LINK / YOUTUBE / DRIVE ATTACHMENT */}
          {attachmentModalType && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>
                  {attachmentModalType === "youtube"
                    ? "Tambahkan Video YouTube"
                    : attachmentModalType === "drive"
                    ? "Tambahkan Tautan Google Drive"
                    : "Tambahkan Tautan Web"}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachmentModalType(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Judul Lampiran (Opsional)..."
                value={attachmentTitleInput}
                onChange={(e) => setAttachmentTitleInput(e.target.value)}
                className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://..."
                  value={attachmentUrlInput}
                  onChange={(e) => setAttachmentUrlInput(e.target.value)}
                  className="flex-1 text-xs p-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                >
                  Tambah
                </button>
              </div>
            </div>
          )}

          {/* HIDDEN FILE INPUT */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* BOTTOM ACTIONS BAR (Matches Screenshot 2) */}
          <div className="flex items-center justify-between pt-2">
            {/* 4 Circular Attachment Icons: Drive, YouTube, Upload, Link */}
            <div className="flex items-center gap-2">
              {/* Google Drive */}
              <button
                type="button"
                onClick={() => setAttachmentModalType("drive")}
                title="Tambahkan dari Google Drive"
                className="w-9 h-9 rounded-full border border-slate-300 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
              >
                <Triangle className="w-4 h-4 text-amber-600 fill-amber-500/20" />
              </button>

              {/* YouTube */}
              <button
                type="button"
                onClick={() => setAttachmentModalType("youtube")}
                title="Tambahkan video YouTube"
                className="w-9 h-9 rounded-full border border-slate-300 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
              >
                <Play className="w-4 h-4 text-red-600 fill-red-600" />
              </button>

              {/* Upload file */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Unggah file lampiran"
                className="w-9 h-9 rounded-full border border-slate-300 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-600" />
              </button>

              {/* Link */}
              <button
                type="button"
                onClick={() => setAttachmentModalType("link")}
                title="Tambahkan link tautan"
                className="w-9 h-9 rounded-full border border-slate-300 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
              >
                <Link2 className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Cancel & Post buttons (Matches Screenshot 2) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Cancel
              </button>

              {/* Post Button with Dropdown Arrow */}
              <div className="relative inline-flex rounded-full shadow-xs">
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="px-6 py-2 rounded-l-full bg-[#1a73e8] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs sm:text-sm font-bold transition cursor-pointer"
                >
                  {editingPost ? "Save changes" : "Post"}
                </button>
                <button
                  type="button"
                  disabled={!text.trim()}
                  onClick={() => setIsPostMenuOpen(!isPostMenuOpen)}
                  className="px-2.5 py-2 rounded-r-full bg-[#1557b0] hover:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-400 text-white transition cursor-pointer border-l border-white/20"
                  title="Opsi Publikasi"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {isPostMenuOpen && (
                  <div
                    className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="submit"
                      onClick={() => setIsPostMenuOpen(false)}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 text-blue-600 flex items-center justify-between transition cursor-pointer"
                    >
                      <span>Posting Sekarang</span>
                      <span className="text-[10px] text-slate-400 font-normal">Langsung</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        setIsPostMenuOpen(false);
                        handleSubmit(e as any);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 text-slate-700 flex items-center justify-between transition cursor-pointer"
                    >
                      <span>Jadwalkan</span>
                      <span className="text-[10px] text-slate-400 font-normal">Jadwal</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        setIsPostMenuOpen(false);
                        handleSubmit(e as any);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 text-slate-700 flex items-center justify-between transition cursor-pointer"
                    >
                      <span>Simpan Draf</span>
                      <span className="text-[10px] text-slate-400 font-normal">Draf</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
