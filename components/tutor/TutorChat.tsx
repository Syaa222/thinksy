"use client";

import { useState, useRef, useEffect } from "react";
import MarkdownRenderer from "../materi/MarkdownRenderer";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface TutorChatProps {
  sesiId?: string;
  soalId?: string;
  materiJudul?: string;
  materiKonten?: string;
}

export default function TutorChat({
  sesiId,
  soalId,
  materiJudul,
  materiKonten,
}: TutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Halo! Saya **thinksy Socratic AI Tutor** 🤖🦉. Ada konsep atau soal yang ingin kita bedah bersama? Saya akan membantumu menalar dan memahaminya langkah demi langkah secara mendalam!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessageText = input.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessageText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sesiId,
          soalId,
          materiJudul,
          materiKonten,
          message: userMessageText,
          history,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mendapatkan respon dari Tutor AI.");
      }

      if (typeof data.remainingQuota === "number") {
        setRemainingQuota(data.remainingQuota);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header Widget */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#193446] text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#E9C77B]/40 bg-white flex items-center justify-center">
            <img src="/logo.png" alt="thinksy AI" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#E9C77B] flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
              thinksy AI
            </h3>
            <p className="text-[10px] text-slate-300">
              Panduan Step-by-Step Tanpa Kunci Jawaban
            </p>
          </div>
        </div>

        {remainingQuota !== null && (
          <span className="text-[10px] font-semibold bg-white/10 px-2.5 py-1 rounded-full text-slate-200">
            Sisa Kuota: {remainingQuota}/20
          </span>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[480px] bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar Icon */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold overflow-hidden ${
                msg.role === "user"
                  ? "bg-[#193446] text-[#E9C77B]"
                  : "bg-white border border-slate-200"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <img src="/logo.png" alt="AI" className="w-full h-full object-cover" />
              )}
            </div>

            {/* Bubble Container */}
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-xs sm:text-sm ${
                msg.role === "user"
                  ? "bg-[#193446] text-white rounded-tr-none"
                  : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
              }`}
            >
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <MarkdownRenderer content={msg.content} />
              )}
            </div>
          </div>
        ))}

        {/* Loading State Bubble */}
        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#E9C77B] text-[#193446] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-500 flex items-center gap-2 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[#193446]" />
              <span>Tutor AI sedang berpikir & menyusun petunjuk...</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanyakan hal yang belum kamu pahami..."
          disabled={loading}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#193446] focus:border-transparent bg-slate-50/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 rounded-xl bg-[#193446] hover:bg-[#132836] text-[#E9C77B] font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
