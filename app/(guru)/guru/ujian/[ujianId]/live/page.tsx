import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import GuruLayout from "@/components/guru/GuruLayout";
import LiveMonitorClient from "./LiveMonitorClient";

export default async function GuruLiveMonitorPage({
  params,
}: {
  params: Promise<{ ujianId: string }>;
}) {
  const { ujianId } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/masuk?redirect=/guru/ujian/${ujianId}/live`);
  }

  // 1. Ambil detail ujian
  let ujianData: any = null;
  const { data: dbUjian } = await adminSupabase
    .from("ujian")
    .select(`
      id,
      judul,
      deskripsi,
      mapel,
      tipe,
      durasi_menit,
      passing_grade,
      status,
      sekolah_id,
      kelas_id,
      kelas:kelas_id ( id, nama_kelas )
    `)
    .eq("id", ujianId)
    .maybeSingle();

  ujianData = dbUjian;

  // Fallback jika ID ujian adalah mockup starter PTS
  if (!ujianData && ujianId === "pts-matematika-k8") {
    ujianData = {
      id: "pts-matematika-k8",
      judul: "Penilaian Tengah Semester (PTS) Matematika Terpadu",
      deskripsi: "Asesmen sumatif resmi tengah semester mata pelajaran Matematika Kelas 8.",
      mapel: "Matematika",
      tipe: "ujian",
      durasi_menit: 90,
      passing_grade: 75,
      status: "dipublikasi",
    };
  }

  if (!ujianData) {
    notFound();
  }

  // 2. Ambil daftar seluruh siswa di sekolah terdaftar di Supabase
  let studentsQuery = adminSupabase
    .from("profil")
    .select("id, nama_lengkap, email, nisn, foto_url")
    .eq("peran", "siswa")
    .order("nama_lengkap", { ascending: true });

  if (ujianData.sekolah_id) {
    studentsQuery = studentsQuery.eq("sekolah_id", ujianData.sekolah_id);
  }

  let { data: rawStudents } = await studentsQuery;

  // Fallback ke seluruh siswa jika spesifik sekolah kosong
  if (!rawStudents || rawStudents.length === 0) {
    const { data: allSiswa } = await adminSupabase
      .from("profil")
      .select("id, nama_lengkap, email, nisn, foto_url")
      .eq("peran", "siswa")
      .order("nama_lengkap", { ascending: true });
    rawStudents = allSiswa;
  }

  const initialStudents =
    rawStudents && rawStudents.length > 0
      ? rawStudents.map((s) => ({
          id: s.id,
          nama_lengkap: s.nama_lengkap || "Siswa",
          email: s.email || "-",
          nisn: s.nisn || "",
          foto_url: s.foto_url || "",
        }))
      : [
          { id: "s1", nama_lengkap: "Ahmad Rizky Pratama", email: "ahmad.rizky@sekolah.sch.id", nisn: "0081234567", foto_url: "" },
          { id: "s2", nama_lengkap: "Bella Safitri", email: "bella.safitri@sekolah.sch.id", nisn: "0081234568", foto_url: "" },
          { id: "s3", nama_lengkap: "Dimas Anggara", email: "dimas.anggara@sekolah.sch.id", nisn: "0081234569", foto_url: "" },
          { id: "s4", nama_lengkap: "Fani Rahmawati", email: "fani.rahma@sekolah.sch.id", nisn: "0081234570", foto_url: "" },
          { id: "s5", nama_lengkap: "Gilang Permana", email: "gilang.permana@sekolah.sch.id", nisn: "0081234571", foto_url: "" },
        ];

  // Ekstrak metadata daftar siswa dikeluarkan / di-invit khusus jika ada
  let initialExcludedIds: string[] = [];
  if (ujianData.deskripsi) {
    const match = ujianData.deskripsi.match(/<!-- EXAM_ROSTER:(.*?) -->/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed.excluded)) {
          initialExcludedIds = parsed.excluded;
        }
      } catch {}
    }
  }

  // 3. Ambil data sesi_ujian siswa
  const { data: rawSessions } = await adminSupabase
    .from("sesi_ujian")
    .select(`
      id,
      siswa_id,
      status,
      nilai_akhir,
      server_start_time,
      server_end_time,
      dikumpulkan_pada
    `)
    .eq("ujian_id", ujianId);

  const initialSessions = (rawSessions || []).map((s) => ({
    id: s.id,
    siswa_id: s.siswa_id,
    status: s.status,
    nilai_akhir: s.nilai_akhir ?? undefined,
    server_start_time: s.server_start_time,
    server_end_time: s.server_end_time,
    dikumpulkan_pada: s.dikumpulkan_pada ?? undefined,
  }));

  return (
    <GuruLayout activeView="ujian">
      <LiveMonitorClient
        ujian={ujianData}
        initialStudents={initialStudents}
        initialSessions={initialSessions}
        initialExcludedStudentIds={initialExcludedIds}
      />
    </GuruLayout>
  );
}
