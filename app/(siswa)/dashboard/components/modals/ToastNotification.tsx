"use client";

import { CheckCircle2, TriangleAlert, X } from "lucide-react";
import { ToastNotificationData } from "../../types";

interface ToastNotificationProps {
  notification: ToastNotificationData | null;
  onClose: () => void;
}

export default function ToastNotification({
  notification,
  onClose,
}: ToastNotificationProps) {
  if (!notification?.show) return null;

  const isAlpha = notification.type === "alpha";

  return (
    <div
      className={`fixed top-5 right-5 z-50 max-w-sm w-full bg-[#0F172A] text-white rounded-2xl p-4 border shadow-2xl animate-in slide-in-from-top-5 duration-300 flex items-start space-x-3 ${
        isAlpha
          ? "border-rose-500/70 ring-1 ring-rose-500/40"
          : "border-emerald-500/50 ring-1 ring-emerald-500/30"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
          isAlpha
            ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        }`}
      >
        {isAlpha ? (
          <TriangleAlert className="w-5 h-5 text-rose-400" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        )}
      </div>

      <div className="flex-1 space-y-0.5">
        <div className="flex items-center justify-between">
          <h4
            className={`text-xs font-extrabold ${
              isAlpha ? "text-rose-300" : "text-white"
            }`}
          >
            {notification.title}
          </h4>
          <span
            className={`text-[10px] font-semibold ${
              isAlpha ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {notification.time}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-snug">
          {notification.message}
        </p>
      </div>

      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white transition cursor-pointer"
        aria-label="Tutup Notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
