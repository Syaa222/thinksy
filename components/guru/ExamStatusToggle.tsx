"use client";

import { useState } from "react";
import { Power, Loader2, CheckCircle2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";

interface ExamStatusToggleProps {
  ujianId: string;
  initialStatus: string;
}

export default function ExamStatusToggle({
  ujianId,
  initialStatus,
}: ExamStatusToggleProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { broadcastEvent } = useRealtimeDashboard();

  const handleToggle = async () => {
    setIsLoading(true);
    const nextStatus = status === "dipublikasi" ? "ditutup" : "dipublikasi";

    try {
      const res = await fetch("/api/guru/ujian", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ujianId, status: nextStatus }),
      });
      if (res.ok) {
        setStatus(nextStatus);
        broadcastEvent("EXAM_STATUS_CHANGED", { ujianId, status: nextStatus });
        router.refresh();
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const isPublished = status === "dipublikasi";

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
        isPublished
          ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
          : "bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200"
      }`}
      title={isPublished ? "Klik untuk Menutup Ujian" : "Klik untuk Membuka Ujian bagi Siswa"}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isPublished ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <Lock className="w-3.5 h-3.5 text-slate-500" />
      )}
      <span>{isPublished ? "Terbuka" : "Ditutup"}</span>
    </button>
  );
}
