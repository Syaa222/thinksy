"use client";

import { useState } from "react";
import { FileText, Plus, Search, Trash2, X } from "lucide-react";
import { NoteItem } from "../../types";

interface StudentNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteItem[];
  onCreateNote: (title: string, content: string, subject: string) => void;
  onDeleteNote: (id: string) => void;
}

export default function StudentNotesModal({
  isOpen,
  onClose,
  notes,
  onCreateNote,
  onDeleteNote,
}: StudentNotesModalProps) {
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteSubject, setNoteSubject] = useState("Matematika");
  const [notesSearch, setNotesSearch] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (!noteTitle.trim()) return;
    onCreateNote(noteTitle, noteContent, noteSubject);
    setNoteTitle("");
    setNoteContent("");
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.judul.toLowerCase().includes(notesSearch.toLowerCase()) ||
      n.konten.toLowerCase().includes(notesSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 max-w-2xl w-full relative space-y-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 border border-amber-200 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#0F172A]">
              MY NOTES — Catatan Pribadi Siswa
            </h3>
            <p className="text-xs text-slate-500">
              Private & Terisolasi — Hanya Anda yang dapat melihat catatan ini.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="text-xs font-extrabold text-[#0F172A] flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-amber-500" />
            <span>+ Buat Catatan Baru</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Judul Catatan..."
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="sm:col-span-2 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <select
              value={noteSubject}
              onChange={(e) => setNoteSubject(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="Matematika">Matematika</option>
              <option value="IPA Biologi">IPA Biologi</option>
              <option value="Bahasa Indonesia">Bahasa Indonesia</option>
              <option value="Informatika">Informatika</option>
              <option value="Umum">Umum</option>
            </select>
          </div>
          <textarea
            placeholder="Tuliskan isi catatan atau rangkuman materi..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-sm"
          >
            Simpan Catatan
          </button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari catatan berdasarkan judul atau isi..."
              value={notesSearch}
              onChange={(e) => setNotesSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium focus:outline-none"
            />
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                Tidak ada catatan ditemukan.
              </p>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start justify-between gap-4 hover:border-slate-300 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        {note.mata_pelajaran}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {note.dibuat_pada}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#0F172A]">
                      {note.judul}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {note.konten}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer"
                    title="Hapus Catatan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
