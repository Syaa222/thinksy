"use client";

import { BrainCircuit, ArrowLeft } from "lucide-react";
import GeneralAiChat from "@/components/tutor/GeneralAiChat";

interface StudentAiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
}

export default function StudentAiAssistantModal({
  isOpen,
  onClose,
  studentName,
}: StudentAiAssistantModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-150">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <BrainCircuit className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2">
              <span>Thinksy AI Assistant</span>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Full Screen Workspace
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Pencarian Informasi & Pendampingan Tugas Sekolah 24/7
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition duration-150 cursor-pointer border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700" />
          <span>Back</span>
        </button>
      </div>

      {/* GeneralAiChat Container */}
      <div className="flex-1 overflow-hidden">
        <GeneralAiChat studentName={studentName} />
      </div>
    </div>
  );
}
