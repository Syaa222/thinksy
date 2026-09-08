import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import GuruLayout from "@/components/guru/GuruLayout";
import {
  Plus,
  Clock,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  Eye,
  Radio,
  BookOpen,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default async function GuruDaftarUjianPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profil } = await adminSupabase
    .from("profil")
    .select("id, nama_lengkap, sekolah_id")
    .eq("id", user?.id || "")
    .maybeSingle();

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
      dibuat_pada,
      kelas:kelas_id ( id, nama_kelas )
    `)
    .order("waktu_mulai", { ascending: false });

  if (profil?.sekolah_id) {
    query = query.eq("sekolah_id", profil.sekolah_id);
  }

  const { data: rawExams } = await query;

  // Ambil data sesi untuk statistik
  const examIds = (rawExams || []).map((e) => e.id);
  const { data: allSessions } = await adminSupabase
    .from("sesi_ujian")
    .select("id, ujian_id, status, nilai_akhir")
    .in("ujian_id", examIds);

  const statsMap = new Map<string, { total: number; selesai: number; sedang: number; totalScore: number }>();
  (allSessions || []).forEach((s) => {
    const cur = statsMap.get(s.ujian_id) || { total: 0, selesai: 0, sedang: 0, totalScore: 0 };
    cur.total++;
    if (s.status === "selesai") {
      cur.selesai++;
      cur.totalScore += s.nilai_akhir || 0;
    } else if (s.status === "sedang_mengerjakan") {
      cur.sedang++;
    }
    statsMap.set(s.ujian_id, cur);
  });

  const exams = (rawExams || []).map((e) => {
    const st = statsMap.get(e.id) || { total: 0, selesai: 0, sedang: 0, totalScore: 0 };
    const avgScore = st.selesai > 0 ? Math.round(st.totalScore / st.selesai) : 0;

    return {
      ...e,
      nama_kelas: (e.kelas as any)?.nama_kelas || "Kelas 8 (Semua Rombel)",
      peserta_total: st.total,
      peserta_selesai: st.selesai,
      peserta_sedang: st.sedang,
      rata_rata_nilai: avgScore,
    };
  });

  return (
    <GuruLayout>
      <div className="space-y-6">
        {/* Header Hero */}
        <div className="saas-card rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 inline-block">
              Manajemen Asesmen & Ujian Server-Timed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Ruang Kelola Ujian & Penilaian
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Rancang lembar ujian terstandar, integrasikan soal AI, dan pantau jalannya ujian siswa secara langsung (Real-Time Live Monitor).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/guru/ujian/create"
              className="px-5 py-3 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Buat Ujian Baru</span>
            </Link>
          </div>
        </div>

        {/* Exams Grid */}
        {exams.length === 0 ? (
          <div className="saas-card rounded-3xl p-12 text-center bg-white border border-slate-200 space-y-4">
            <Clock className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Belum Ada Ujian Dibuat</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
              Mulai buat asesmen pertama Anda untuk menguji pemahaman konsep siswa di kelas.
            </p>
            <Link
              href="/guru/ujian/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Ujian Sekarang</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((u) => (
              <div
                key={u.id}
                className="saas-card rounded-3xl p-6 border border-slate-200 bg-white flex flex-col justify-between space-y-5 shadow-xs hover:shadow-md transition duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {u.nama_kelas}
                    </span>

                    {u.peserta_sedang > 0 ? (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 animate-pulse">
                        <Radio className="w-3 h-3 text-emerald-600" />
                        <span>{u.peserta_sedang} Siswa Live</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        {u.status === "dipublikasi" ? "Aktif" : "Ditutup"}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-[#0F172A] line-clamp-2 leading-snug">
                    {u.judul}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 font-medium">
                    {u.deskripsi || "Asesmen kompetensi Matematika Kurikulum Merdeka Fase D."}
                  </p>

                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.durasi_menit} Menit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>KKM: {u.passing_grade}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.peserta_selesai} Selesai</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Rata-rata: {u.rata_rata_nilai}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Link
                    href={`/guru/ujian/${u.id}/live`}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Live Monitor</span>
                  </Link>

                  <Link
                    href={`/guru/penilaian`}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center"
                    title="Rekap Nilai"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GuruLayout>
  );
}
