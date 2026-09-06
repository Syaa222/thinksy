"use client";

import { useState } from "react";
import { FileText, BrainCircuit, Globe } from "lucide-react";

interface FloatingActionHubProps {
  onOpenNotes: () => void;
  onOpenAiAssistant: () => void;
  onOpenGlobalChat: () => void;
}

export default function FloatingActionHub({
  onOpenNotes,
  onOpenAiAssistant,
  onOpenGlobalChat,
}: FloatingActionHubProps) {
  const [isFabOpen, setIsFabOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isFabOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col items-end gap-3 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <button
            onClick={() => {
              onOpenNotes();
              setIsFabOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-extrabold shadow-xl border border-slate-200 group transition transform hover:scale-105 cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-700">My Notes 📝</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </button>

          <button
            onClick={() => {
              onOpenAiAssistant();
              setIsFabOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-extrabold shadow-xl border border-slate-200 group transition transform hover:scale-105 cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-700">AI Assistant 🤖</span>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <BrainCircuit className="w-4.5 h-4.5" />
            </div>
          </button>

          <button
            onClick={() => {
              onOpenGlobalChat();
              setIsFabOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-extrabold shadow-xl border border-slate-200 group transition transform hover:scale-105 cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-700">Global Chat 💬</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Globe className="w-4.5 h-4.5" />
            </div>
          </button>
        </div>
      )}

      <button
        onClick={() => setIsFabOpen(!isFabOpen)}
        aria-label="Action Menu"
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white font-extrabold text-2xl transition duration-300 cursor-pointer transform hover:scale-105 ${
          isFabOpen
            ? "bg-slate-900 rotate-45 border-2 border-slate-700"
            : "bg-linear-to-br from-[#0F172A] via-[#1E293B] to-amber-500 border-2 border-amber-400/50 shadow-amber-500/20"
        }`}
      >
        +
      </button>
    </div>
  );
}
