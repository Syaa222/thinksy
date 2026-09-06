"use client";

import { useState } from "react";
import {
  Globe,
  X,
  Search,
  Send,
  Flag,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { GlobalChatItem, ChatCommentItem } from "../../types";

interface GlobalDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalChats: GlobalChatItem[];
  chatComments: Record<string, ChatCommentItem[]>;
  expandedCommentsChatId: string | null;
  setExpandedCommentsChatId: (id: string | null) => void;
  loadingCommentsId: string | null;
  reportingChatId: string | null;
  setReportingChatId: (id: string | null) => void;
  onSendChat: (content: string) => void;
  onLikeChat: (chatId: string) => void;
  onSendReply: (chatId: string, text: string) => void;
  onToggleComments: (chatId: string) => void;
  onReportContent: (chatId: string, reason: string) => void;
}

export default function GlobalDiscussionModal({
  isOpen,
  onClose,
  globalChats,
  chatComments,
  expandedCommentsChatId,
  setExpandedCommentsChatId,
  loadingCommentsId,
  reportingChatId,
  setReportingChatId,
  onSendChat,
  onLikeChat,
  onSendReply,
  onToggleComments,
  onReportContent,
}: GlobalDiscussionModalProps) {
  const [newChatContent, setNewChatContent] = useState("");
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [chatSearchResults, setChatSearchResults] = useState<{
    students: any[];
    communities: any[];
  }>({ students: [], communities: [] });
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [reportReason, setReportReason] = useState("");

  if (!isOpen) return null;

  const handleSearchStudents = async (query: string) => {
    setChatSearchQuery(query);
    if (!query.trim()) {
      setChatSearchResults({ students: [], communities: [] });
      return;
    }
    try {
      const res = await fetch(
        `/api/siswa/chat?action=search&q=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        setChatSearchResults({
          students: data.students || [],
          communities: data.communities || [],
        });
      }
    } catch {}
  };

  const handleSend = () => {
    if (!newChatContent.trim()) return;
    onSendChat(newChatContent);
    setNewChatContent("");
  };

  const handleReply = (chatId: string) => {
    const text = (replyInputs[chatId] || "").trim();
    if (!text) return;
    onSendReply(chatId, text);
    setReplyInputs((prev) => ({ ...prev, [chatId]: "" }));
  };

  const handleReport = (chatId: string) => {
    if (!reportReason.trim()) return;
    onReportContent(chatId, reportReason);
    setReportReason("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 max-w-2xl w-full relative space-y-5 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#0F172A]">
              GLOBAL SCHOOL CHAT
            </h3>
            <p className="text-xs text-slate-500">
              Komunitas internal sekolah — Temukan teman belajar & kelompok akademis.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="🔍 Cari siswa, kelas, minat, atau komunitas..."
              value={chatSearchQuery}
              onChange={(e) => handleSearchStudents(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium focus:outline-none"
            />
          </div>

          {chatSearchQuery.trim() && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3">
              <div className="text-xs font-bold text-blue-900">
                Hasil Pencarian internal Sekolah:
              </div>
              {chatSearchResults.students.length === 0 &&
              chatSearchResults.communities.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Tidak ditemukan siswa atau komunitas cocok.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {chatSearchResults.students.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 bg-white rounded-xl border border-blue-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#0F172A]">{s.name}</span>
                        <span className="text-slate-500 ml-2">
                          ({s.class}) — Minat: {s.interest}
                        </span>
                      </div>
                      <button className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] cursor-pointer">
                        Hubungi
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Bagikan pertanyaan atau ajakan belajar bersama..."
            value={newChatContent}
            onChange={(e) => setNewChatContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim</span>
          </button>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {globalChats.map((chat) => (
            <div
              key={chat.id}
              className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold">
                    {chat.nama_penulis.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">
                      {chat.nama_penulis}{" "}
                      <span className="text-slate-400 font-normal">
                        ({chat.kelas_penulis})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {chat.dibuat_pada}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setReportingChatId(chat.id)}
                  className="text-slate-400 hover:text-red-500 text-[10px] flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Flag className="w-3 h-3" /> Laporkan
                </button>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {chat.konten}
              </p>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-1 border-t border-slate-200/50">
                <button
                  onClick={() => onLikeChat(chat.id)}
                  className="flex items-center gap-1.5 hover:text-red-500 transition cursor-pointer text-slate-600 font-bold"
                >
                  <span className="text-red-500">❤️</span>
                  <span>{chat.jumlah_suka} Suka</span>
                </button>

                <button
                  onClick={() => onToggleComments(chat.id)}
                  className="flex items-center gap-1.5 hover:text-blue-600 transition cursor-pointer text-slate-600 font-bold"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>{chat.jumlah_komentar} Komentar</span>
                </button>

                <button
                  onClick={() => onToggleComments(chat.id)}
                  className="text-emerald-700 hover:text-emerald-800 text-xs font-extrabold transition cursor-pointer ml-auto"
                >
                  💬 Balas Komentar
                </button>
              </div>

              {expandedCommentsChatId === chat.id && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-3 bg-white p-3.5 rounded-2xl border shadow-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      Thread Balasan & Komentar (
                      {chatComments[chat.id]?.length || 0})
                    </span>
                    <button
                      onClick={() => setExpandedCommentsChatId(null)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Tutup Thread ✖
                    </button>
                  </div>

                  {loadingCommentsId === chat.id ? (
                    <div className="py-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />{" "}
                      Memuat balasan...
                    </div>
                  ) : (chatComments[chat.id] || []).length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-50 text-center text-xs text-slate-500 font-medium border border-slate-100">
                      Belum ada balasan. Tulis komentar pertamamu di bawah ini!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(chatComments[chat.id] || []).map((cm) => (
                        <div
                          key={cm.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-[#0F172A]">
                              {cm.nama_penulis}{" "}
                              <span className="text-slate-400 font-normal text-[10px]">
                                ({cm.kelas_penulis})
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {cm.dibuat_pada}
                            </span>
                          </div>
                          <p className="text-slate-700 text-xs leading-snug">
                            {cm.konten}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Tulis balasan atau komentar..."
                      value={replyInputs[chat.id] || ""}
                      onChange={(e) =>
                        setReplyInputs({
                          ...replyInputs,
                          [chat.id]: e.target.value,
                        })
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleReply(chat.id)
                      }
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => handleReply(chat.id)}
                      className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                      <span>Balas</span>
                    </button>
                  </div>
                </div>
              )}

              {reportingChatId === chat.id && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 mt-2">
                  <div className="text-xs font-bold text-red-900">
                    Alasan Pelaporan Konten:
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: Kata-kata tidak sopan..."
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-red-200 bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReport(chat.id)}
                      className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold text-xs cursor-pointer"
                    >
                      Kirim Laporan
                    </button>
                    <button
                      onClick={() => setReportingChatId(null)}
                      className="px-3 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
