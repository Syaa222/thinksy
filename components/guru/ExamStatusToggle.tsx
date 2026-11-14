"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Lock, EyeOff } from "lucide-react";
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
  const [status, setStatus] = useState(initialStatus || "dipublikasi");
  const [prevInitial, setPrevInitial] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { broadcastEvent } = useRealtimeDashboard();

  if (initialStatus !== prevInitial) {
    setPrevInitial(initialStatus);
    setStatus(initialStatus);
  }

  const handleUpdateStatus = async (newStatus: "dipublikasi" | "ditutup" | "draft") => {
    if (newStatus === status || isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/guru/ujian", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ujianId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus(newStatus);
        broadcastEvent("EXAM_STATUS_CHANGED", { ujianId, status: newStatus });
        router.refresh();
      } else {
        console.error("[ExamStatusToggle] Gagal update status:", data?.error);
      }
    } catch (err) {
      console.error("[ExamStatusToggle] Network error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
      {isLoading ? (
        <div className="px-3 py-1 flex items-center gap-1.5 text-slate-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Memproses...</span>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => handleUpdateStatus("dipublikasi")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              status === "dipublikasi"
                ? "bg-emerald-600 text-white shadow-2xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="Aktif: Siswa dapat mengakses dan mengerjakan ujian"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Aktif</span>
          </button>

          <button
            type="button"
            onClick={() => handleUpdateStatus("ditutup")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              status === "ditutup"
                ? "bg-slate-600 text-white shadow-2xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="Nonaktif: Muncul abu-abu di siswa & tidak bisa diakses"
          >
            <Lock className="w-3 h-3" />
            <span>Nonaktif</span>
          </button>

          <button
            type="button"
            onClick={() => handleUpdateStatus("draft")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              status === "draft"
                ? "bg-amber-600 text-white shadow-2xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="Draf: Disembunyikan dari siswa agar guru bisa mengedit soal, KKM & waktu"
          >
            <EyeOff className="w-3 h-3" />
            <span>Draf</span>
          </button>
        </>
      )}
    </div>
  );
}
