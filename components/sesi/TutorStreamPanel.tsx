"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, AlertCircle, X, ChevronRight, HelpCircle } from "lucide-react";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface TutorStreamPanelProps {
  soalId: string;
  sesiId: string;
  pertanyaanText: string;
  jawabanSiswaSaatIni?: string;
  jumlahSalahLangkah?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorStreamPanel({
  soalId,
  sesiId,
  pertanyaanText,
  jawabanSiswaSaatIni,
  jumlahSalahLangkah = 0,
  isOpen,
  onClose,
}: TutorStreamPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hai! Aku **Tutor Sokratik AI** 🦉. Aku tidak akan memberi kunci jawaban langsung, tapi aku siap membimbingmu memahami langkah demi langkah. Bagian mana yang ingin kita diskusikan?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remainingQuota, setRemainingQuota] = useState<string>("20");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput("");
    setLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soalId,
          sesiId,
          message: textToSend,
          history,
          jawabanSiswaSaatIni,
          jumlahSalahLangkah,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Gagal menghubungi Tutor AI.");
      }

      const quotaHeader = res.headers.get("X-Remaining-Quota");
      if (quotaHeader) setRemainingQuota(quotaHeader);

      if (!res.body) throw new Error("Respons stream tidak tersedia.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamedContent += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: streamedContent } : m
          )
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: `⚠️ ${err.message || "Terjadi gangguan saat menghubungkan ke tutor."}` }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-[#193446] text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E9C77B] text-[#193446] flex items-center justify-center font-bold shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
              Tutor Sokratik AI
              <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-mono">
                Gemini 3.1
              </span>
            </h3>
            <p className="text-[11px] text-slate-300">
              Sisa Kuota: <span className="font-semibold text-[#E9C77B]">{remainingQuota}/20</span> pesan hari ini
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
          aria-label="Tutup Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs">
        <button
          onClick={() => handleSend("Bisa beri petunjuk langkah pertama tanpa memberi jawaban?")}
          disabled={loading}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#193446] hover:text-[#193446] transition font-medium"
        >
          💡 Petunjuk Awal
        </button>
        <button
          onClick={() => handleSend("Jelaskan konsep matematika di balik soal ini dengan contoh sederhana.")}
          disabled={loading}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#193446] hover:text-[#193446] transition font-medium"
        >
          📖 Konsep Dasar
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 text-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[88%] p-3 rounded-2xl ${
                m.role === "user"
                  ? "bg-[#193446] text-white rounded-br-none shadow-sm"
                  : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm"
              }`}
            >
              <MarkdownRenderer content={m.content} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 p-2.5 rounded-xl w-fit">
            <Sparkles className="w-4 h-4 text-[#E9C77B] animate-spin" />
            <span>Tutor AI sedang menalar petunjuk...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan langkah atau konsep..."
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#193446] text-slate-800"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-[#193446] text-[#E9C77B] hover:bg-[#152a38] disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
