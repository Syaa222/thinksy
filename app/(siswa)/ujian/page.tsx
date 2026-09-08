import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Award,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default async function DaftarUjianPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Ambil profil siswa
  const { data: profil } = await adminSupabase
    .from("profil")
    .select("id, nama_lengkap, sekolah_id")
    .eq("id", user?.id || "")
    .maybeSingle();

  // 2. Ambil daftar ujian aktif
  let query = adminSupabase
    .from("ujian")
    .select(`
      id,
      judul,
      deskripsi,
      mapel,
      durasi_menit,
      passing_grade,
      waktu_mulai,
      waktu_berakhir,
      status,
      dibuat_pada
    `)
    .eq("status", "dipublikasi")
    .order("waktu_mulai", { ascending: false });

  if (profil?.sekolah_id) {
    query = query.eq("sekolah_id", profil.sekolah_id);
  }

  const { data: rawExams } = await query;

  // 3. Ambil riwayat sesi_ujian siswa
  let userSessions: Record<string, any> = {};
  if (user) {
    const { data: sesiList } = await adminSupabase
      .from("sesi_ujian")
      .select("id, ujian_id, status, nilai_akhir, server_start_time, server_end_time")
      .eq("siswa_id", user.id);

    if (sesiList) {
      sesiList.forEach((s) => {
        userSessions[s.ujian_id] = s;
      });
    }
  }

  const exams = (rawExams || []).map((u) => {
    const sesi = userSessions[u.id];
    let sessionStatus = "belum_mulai";
    let score = null;

    if (sesi) {
      sessionStatus = sesi.status;
      score = sesi.nilai_akhir;
    }

    return {
      ...u,
      sessionStatus,
      score,
      sesiId: sesi?.id,
    };
  });

  return (
    <main className="min-h-screen bg-mesh-gradient text-slate-900 pb-16">
      {/* Top Header */}
      <header className="sticky top-3 sm:top-5 z-30 w-full px-3 sm:px-6 pointer-events-none transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-lg sm:shadow-xl ring-1 ring-slate-900/5 pointer-events-auto text-slate-900">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0F172A] hover:text-blue-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full transition cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Server-Timed Exam Engine</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6">
        {/* Banner Hero */}
        <div className="saas-card rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-block text-xs font-extrabold text-[#0F172A] bg-blue-100 border border-blue-300 px-3.5 py-1.5 rounded-full">
              Ruang Asesmen & Ujian Berbasis Standar • Kelas 8
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Daftar Ujian & Asesmen Terjadwal
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Kerjakan asesmen formatif, sumatif, dan ulangan harian dengan pengawasan waktu server otomatis dan penilaian langsung.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="saas-card p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-[#0F172A]">
                  {exams.length} Ujian Tersedia
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Tahun Ajaran 2026/2027
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exams Grid */}
        {exams.length === 0 ? (
          <div className="saas-card rounded-3xl p-12 text-center bg-white border border-slate-200 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Belum Ada Ujian Terjadwal</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Saat ini belum ada ujian yang dijadwalkan oleh guru Anda. Silakan lanjutkan belajar mandiri di Ruang Belajar.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-slate-800 transition"
            >
              <span>Buka Ruang Belajar</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((u) => {
              const isCompleted = u.sessionStatus === "selesai" || u.sessionStatus === "habis_waktu";
              const isInProgress = u.sessionStatus === "sedang_mengerjakan";
              const isPassed = u.score !== null && u.score >= u.passing_grade;

              return (
                <div
                  key={u.id}
                  className="saas-card rounded-3xl p-6 border border-slate-200/90 shadow-sm bg-white flex flex-col justify-between space-y-5 hover:shadow-md transition duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {u.mapel || "Matematika"}
                      </span>

                      {isCompleted ? (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isPassed
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Nilai: {u.score ?? 0} ({isPassed ? "Lulus" : "Remedial"})</span>
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                          Sedang Berlangsung
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          Siap Dikerjakan
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-[#0F172A] line-clamp-2 leading-snug">
                      {u.judul}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {u.deskripsi || "Asesmen kompetensi pembelajaran Kurikulum Merdeka Fase D."}
                    </p>

                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{u.durasi_menit} Menit</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span>KKM: {u.passing_grade}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isCompleted ? (
                      <Link
                        href={`/ujian/${u.id}`}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition"
                      >
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>Lihat Ringkasan Nilai</span>
                      </Link>
                    ) : isInProgress ? (
                      <Link
                        href={`/ujian/${u.id}`}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-xs"
                      >
                        <PlayCircle className="w-4 h-4 text-white" />
                        <span>Lanjutkan Ujian</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/ujian/${u.id}`}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-xs"
                      >
                        <PlayCircle className="w-4 h-4 text-amber-400" />
                        <span>Mulai Kerjakan Ujian</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
