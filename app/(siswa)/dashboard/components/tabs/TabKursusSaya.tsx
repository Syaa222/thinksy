"use client";

import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { ChapterItem, PeerStudent } from "../../types";

interface TabKursusSayaProps {
  chapters: ChapterItem[];
  peerStudents: PeerStudent[];
}

export default function TabKursusSaya({
  chapters,
  peerStudents,
}: TabKursusSayaProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6 animate-in fade-in duration-200">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2.5">
          <BookOpen className="w-7 h-7 text-blue-600" />
          <span>Kursus & Bab Pembelajaran</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
          Pilih bab pembelajaran untuk mulai mempelajari materi dan mengerjakan kuis.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {chapters.map((cls, idx) => (
          <Link
            key={cls.id}
            href={`/bab/${cls.id}`}
            className="saas-card saas-card-hover rounded-3xl p-6 border border-slate-200 flex flex-col justify-between space-y-5 shadow-xs group bg-white"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                  Bab {cls.urutan || idx + 1}
                </span>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Matematika • Kelas 8 (Fase D)
                </div>
                <h3 className="text-xl font-extrabold text-[#0F172A] group-hover:text-blue-600 transition">
                  {cls.judul}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {cls.deskripsi ||
                    "Capaian Pembelajaran Kurikulum Merdeka Matematika SMP Kelas 8."}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center -space-x-2 overflow-hidden py-1">
                {peerStudents.slice(0, 4).map((peer) => (
                  <div
                    key={peer.id}
                    title={peer.name}
                    className="relative group/avatar inline-block"
                  >
                    <div className="w-8 h-8 rounded-full ring-2 ring-white bg-[#0F172A] text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs overflow-hidden transition-transform duration-200 group-hover/avatar:scale-115 group-hover/avatar:z-20 cursor-pointer">
                      {peer.avatarUrl ? (
                        <img
                          src={peer.avatarUrl}
                          alt={peer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{peer.initials}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                <span>Pelajari Bab</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
