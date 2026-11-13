import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import fs from "fs";
import path from "path";
import GuruLayout from "@/components/guru/GuruLayout";
import ExamStatusToggle from "@/components/guru/ExamStatusToggle";
import DeleteExamButton from "@/components/guru/DeleteExamButton";
import { getExamPackage } from "@/lib/exam-questions-store";
import {
  Plus,
  Clock,
  Award,
  Users,
  Sparkles,
  TrendingUp,
  Edit3,
} from "lucide-react";

function getDeletedUjianIds(): string[] {
  try {
    const filePath = path.join(process.cwd(), "data", "deleted_ujian.json");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch {}
  return [];
}

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
      tipe,
      bab_id,
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

  const CANONICAL_GURU_EXAMS = [
    {
      id: "u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      judul: "Ulangan Matematika Semester 1",
      deskripsi:
        "Evaluasi formatif komprehensif Matematika Semester 1 mencakup Bab 1 sampai Bab 4 (Pola Bilangan, Bentuk Aljabar, Relasi & Fungsi, Persamaan Garis Lurus).",
      mapel: "Matematika",
      tipe: "ulangan",
      durasi_menit: 60,
      passing_grade: 75,
      status: "dipublikasi",
    },
    {
      id: "u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      judul: "Ulangan Matematika Semester 2",
      deskripsi:
        "Evaluasi formatif komprehensif Matematika Semester 2 mencakup Bab 5 sampai Bab 8 (SPLDV, Teorema Pythagoras, Bangun Ruang Sisi Datar, Statistika & Peluang).",
      mapel: "Matematika",
      tipe: "ulangan",
      durasi_menit: 60,
      passing_grade: 75,
      status: "dipublikasi",
    },
    {
      id: "e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
      judul: "Ujian Resmi Matematika #1",
      deskripsi:
        "Asesmen sumatif resmi terstandar CBT Matematika Kelas 8 (Part 1 - Semester 1) materi Aljabar, Teorema Pythagoras, dan Relasi Fungsi.",
      mapel: "Matematika",
      tipe: "ujian",
      durasi_menit: 90,
      passing_grade: 75,
      status: "dipublikasi",
    },
  ];

  const guruExamsMap = new Map<string, any>();
  CANONICAL_GURU_EXAMS.forEach((item) => {
    const localPkg = getExamPackage(item.id);
    guruExamsMap.set(item.id, {
      ...item,
      status: localPkg?.status || item.status,
      durasi_menit: localPkg?.durasi_menit || item.durasi_menit,
      passing_grade: localPkg?.passing_grade || item.passing_grade,
    });
  });

  (rawExams || [])
    .filter((e) => {
      // Ulangan & ujian hanya seputar Matematika yang ada di class
      const m = (e.mapel || "").toLowerCase();
      const isOther = /ipa|inggris|indonesia|ips|agama|pjok|seni|karakter|literasi/i.test(m);
      return !isOther && (m.includes("matematika") || m === "" || !e.mapel);
    })
    .forEach((e) => {
      const isOfficial =
        e.tipe === "ujian" ||
        e.id === "e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55" ||
        /pts|pas|ujian resmi/i.test(e.judul || "");
      const calculatedTipe: "ulangan" | "ujian" = isOfficial ? "ujian" : "ulangan";
      const judul = isOfficial ? "Ujian Resmi Matematika #1" : e.judul;
      const localPkg = getExamPackage(e.id);

      guruExamsMap.set(e.id, {
        ...e,
        judul,
        tipe: calculatedTipe,
        status: localPkg?.status || e.status || "dipublikasi",
        durasi_menit: localPkg?.durasi_menit || e.durasi_menit || (isOfficial ? 90 : 60),
        passing_grade: localPkg?.passing_grade || e.passing_grade || 75,
      });
    });

  const deletedIds = getDeletedUjianIds();

  const exams = Array.from(guruExamsMap.values())
    .filter((e) => !deletedIds.includes(e.id))
    .map((e) => {
    const st = statsMap.get(e.id) || { total: 0, selesai: 0, sedang: 0, totalScore: 0 };
    const avgScore = st.selesai > 0 ? Math.round(st.totalScore / st.selesai) : 0;

    return {
      ...e,
      nama_kelas: (e.kelas as any)?.nama_kelas || "Kelas 8 (Matematika)",
      peserta_total: st.total,
      peserta_selesai: st.selesai,
      rata_rata_nilai: avgScore,
    };
  });

  return (
    <GuruLayout activeView="ujian">
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
              Rancang lembar ujian terstandar, integrasikan butir soal, dan terbitkan asesmen kompetensi untuk siswa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/guru/ujian/create?tipe=ulangan"
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Ulangan (Per Bab / Keseluruhan)</span>
            </Link>
            <Link
              href="/guru/ujian/create?tipe=ujian"
              className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>+ Buat Ujian Resmi (PTS / PAS)</span>
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
            {exams.map((u: any) => {
              const isUjian = u.tipe === "ujian" || (!/ulangan/i.test(u.judul) && u.tipe !== "ulangan");
              const isPerBab = !isUjian && (Boolean(u.bab_id) || /bab\s*\d+/i.test(u.judul));

              return (
                <div
                  key={u.id}
                  className={`saas-card rounded-3xl p-6 border bg-white flex flex-col justify-between space-y-5 shadow-xs hover:shadow-md transition duration-200 ${isUjian
                    ? "border-purple-200 hover:border-purple-400"
                    : isPerBab
                      ? "border-blue-200 hover:border-blue-400"
                      : "border-emerald-200 hover:border-emerald-400"
                    }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          isUjian
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : isPerBab
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {isUjian ? "Ujian Resmi" : isPerBab ? "Ulangan Bab" : "Formatif"}
                      </span>

                      <ExamStatusToggle ujianId={u.id} initialStatus={u.status} />
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

                  <div className="pt-2 flex items-center gap-2.5">
                    <Link
                      href={`/guru/ujian/${u.id}/edit`}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs"
                      title="Edit butir soal, kunci, dan pengaturan ujian"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Soal</span>
                    </Link>

                    <DeleteExamButton ujianId={u.id} judul={u.judul} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GuruLayout>
  );
}
