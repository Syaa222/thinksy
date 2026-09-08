import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
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

  // 1. Ambil detail ujian
  const { data: ujian } = await adminSupabase
    .from("ujian")
    .select(`
      id,
      judul,
      deskripsi,
      mapel,
      durasi_menit,
      passing_grade,
      status,
      sekolah_id,
      kelas_id,
      kelas:kelas_id ( id, nama_kelas )
    `)
    .eq("id", ujianId)
    .maybeSingle();

  if (!ujian) {
    notFound();
  }

  // 2. Ambil daftar seluruh siswa
  let studentsQuery = adminSupabase
    .from("profil")
    .select("id, nama_lengkap, email")
    .eq("peran", "siswa");

  if (ujian.sekolah_id) {
    studentsQuery = studentsQuery.eq("sekolah_id", ujian.sekolah_id);
  }

  const { data: allStudents } = await studentsQuery.order("nama_lengkap", { ascending: true });

  // 3. Ambil sesi_ujian
  const { data: sessions } = await adminSupabase
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

  return (
    <GuruLayout>
      <LiveMonitorClient
        ujian={ujian}
        initialStudents={allStudents || []}
        initialSessions={sessions || []}
      />
    </GuruLayout>
  );
}
