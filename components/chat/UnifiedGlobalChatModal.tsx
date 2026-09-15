"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Search,
  Send,
  X,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Users,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UnifiedGlobalChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

interface ChatUser {
  id: string;
  nama_lengkap: string;
  peran: string;
  email: string;
  foto_url?: string | null;
}

interface ChatRoom {
  id: string;
  nama: string;
  tipe: string;
  otherUser?: ChatUser | null;
  created_at: string;
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    nama_lengkap: string;
    peran: string;
    foto_url?: string | null;
  };
}

export default function UnifiedGlobalChatModal({
  isOpen,
  onClose,
  currentUserId,
}: UnifiedGlobalChatModalProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Search User State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Current user ID fallback
  const [myUserId, setMyUserId] = useState<string>(currentUserId || "");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();

  // 1. Fetch Rooms & current user on mount
  useEffect(() => {
    if (!isOpen) return;

    async function loadRooms() {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const data = await res.json();
          setRooms(data.rooms || []);
          if (data.currentUserId) setMyUserId(data.currentUserId);
          if (data.rooms && data.rooms.length > 0 && !activeRoom) {
            setActiveRoom(data.rooms[0]);
          }
        }
      } catch {}
    }

    loadRooms();
  }, [isOpen]);

  // 2. Fetch Messages when activeRoom changes
  useEffect(() => {
    if (!activeRoom) return;
    const currentRoomId = activeRoom.id;

    async function loadMessages() {
      setIsLoadingMessages(true);
      try {
        const res = await fetch(`/api/chat?action=get_messages&roomId=${currentRoomId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch {} finally {
        setIsLoadingMessages(false);
      }
    }

    loadMessages();

    // 3. Supabase Realtime Subscription for this room
    const channel = supabase
      .channel(`chat-room-${currentRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${currentRoomId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          // Avoid duplicate if we already appended it locally
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoom]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // User Search Handler with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/chat?action=search_users&q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch {} finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Start chat with searched user
  const handleStartChatWithUser = async (u: ChatUser) => {
    setSearchQuery("");
    setSearchResults([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: u.id, content: "Halo!" }),
      });
      if (res.ok) {
        const data = await res.json();
        // Set new active room
        const newRoom: ChatRoom = {
          id: data.roomId,
          nama: u.nama_lengkap,
          tipe: "direct",
          otherUser: u,
          created_at: new Date().toISOString(),
        };
        setRooms((prev) => [newRoom, ...prev.filter((r) => r.id !== data.roomId)]);
        setActiveRoom(newRoom);
      }
    } catch {}
  };

  // Send Message Handler
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeRoom || isSending) return;

    const content = messageInput.trim();
    setMessageInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: activeRoom.id, content }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
      }
    } catch {} finally {
      setIsSending(false);
    }
  };

  const getRoleBadge = (peran?: string) => {
    switch (peran) {
      case "guru":
        return <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">Guru</span>;
      case "admin_sekolah":
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold">Admin Sekolah</span>;
      case "superadmin":
        return <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold">Super Admin</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">Siswa</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col sm:flex-row text-slate-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ============================================================ */}
        {/* LEFT COLUMN: ROOMS LIST & USER SEARCH                         */}
        {/* ============================================================ */}
        <div className="w-full sm:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#0F172A] text-amber-400 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0F172A] leading-tight">
                  Unified Global Chat
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">
                  Siswa • Guru • Admin • Super Admin
                </span>
              </div>
            </div>

            {/* User Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Siswa, Guru, Admin..."
                className="w-full pl-8.5 pr-3 py-2 bg-slate-100 focus:bg-white rounded-xl text-xs font-medium border border-transparent focus:border-blue-500 outline-none transition"
              />
              {isSearching && (
                <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Search Results Overlay or Rooms List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {searchQuery.trim() ? (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block pt-1">
                  Hasil Pencarian ({searchResults.length})
                </span>
                {searchResults.length === 0 && !isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    User tidak ditemukan.
                  </div>
                ) : (
                  searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleStartChatWithUser(u)}
                      className="w-full p-2.5 rounded-2xl hover:bg-white text-left transition flex items-center justify-between gap-2 border border-transparent hover:border-slate-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                          {u.nama_lengkap[0]}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {u.nama_lengkap}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {u.email}
                          </div>
                        </div>
                      </div>
                      {getRoleBadge(u.peran)}
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block pt-1">
                  Percakapan Terbuka
                </span>
                {rooms.map((r) => {
                  const isActive = activeRoom?.id === r.id;
                  const isChannel = r.tipe === "channel";

                  return (
                    <button
                      key={r.id}
                      onClick={() => setActiveRoom(r)}
                      className={`w-full p-2.5 rounded-2xl text-left transition flex items-center justify-between gap-2 cursor-pointer border ${
                        isActive
                          ? "bg-[#0F172A] text-white border-slate-900 shadow-xs"
                          : "bg-transparent hover:bg-white text-slate-800 border-transparent hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                            isActive
                              ? "bg-white/10 text-white"
                              : isChannel
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {isChannel ? <Users className="w-4 h-4" /> : r.nama[0]}
                        </div>
                        <div className="truncate">
                          <div
                            className={`text-xs font-bold truncate ${
                              isActive ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {r.nama}
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              isActive ? "text-slate-300" : "text-slate-400"
                            }`}
                          >
                            {isChannel ? "Saluran Terbuka" : "Obrolan Langsung"}
                          </div>
                        </div>
                      </div>

                      {!isChannel && r.otherUser && getRoleBadge(r.otherUser.peran)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: ACTIVE CHAT MESSAGES & INPUT                    */}
        {/* ============================================================ */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Room Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white/80 backdrop-blur-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-sm text-slate-800">
                {activeRoom?.tipe === "channel" ? (
                  <Users className="w-5 h-5 text-blue-600" />
                ) : (
                  activeRoom?.nama[0] || "💬"
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-[#0F172A]">
                    {activeRoom?.nama || "Pilih Percakapan"}
                  </h4>
                  {activeRoom?.otherUser && getRoleBadge(activeRoom.otherUser.peran)}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Realtime Supabase Terhubung</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Bubble Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#F8FAFC]">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memuat pesan...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium">
                  Belum ada pesan dalam percakapan ini. Awali sapaanmu!
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender_id === myUserId;
                const senderName = m.sender?.nama_lengkap || "User";
                const senderRole = m.sender?.peran || "siswa";
                const timeStr = new Date(m.created_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[11px] font-black text-slate-700">
                          {senderName}
                        </span>
                        {getRoleBadge(senderRole)}
                      </div>
                    )}

                    <div
                      className={`max-w-md px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-2xs ${
                        isMe
                          ? "bg-[#0F172A] text-white rounded-br-xs"
                          : "bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <span
                        className={`text-[9px] block text-right mt-1 ${
                          isMe ? "text-slate-400" : "text-slate-400"
                        }`}
                      >
                        {timeStr}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Form */}
          <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Kirim pesan ke ${activeRoom?.nama || "chat"}...`}
                className="flex-1 px-4 py-3 bg-slate-100 focus:bg-white rounded-2xl text-xs font-medium border border-transparent focus:border-blue-500 outline-none transition"
              />

              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || isSending}
                className="px-5 py-3 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-extrabold transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-amber-300" />
                )}
                <span className="hidden sm:inline">Kirim</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
