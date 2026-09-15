import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BelajarClient from "./BelajarClient";

export default async function BelajarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/masuk");
  }

  // 1. Fetch Student Profile
  const { data: profil } = await supabase
    .from("profil")
    .select(`
      id,
      nama_lengkap,
      email,
      peran,
      poin,
      streak,
      nisn,
      nis,
      jurusan,
      tahun_ajaran,
      foto_url,
      sekolah_id,
      anggota_kelas (
        kelas (
          id,
          nama,
          tingkat
        )
      )
    `)
    .eq("id", user.id)
    .single();

  const userRole = profil?.peran || "siswa";
  if (userRole !== "siswa") {
    if (userRole === "guru") redirect("/guru");
    if (userRole === "admin_sekolah") redirect("/admin");
    if (userRole === "superadmin") redirect("/super");
  }

  const rawKelas = (profil as any)?.anggota_kelas?.[0]?.kelas;
  const userGrade = rawKelas?.tingkat || 8;
  const namaKelas = rawKelas?.nama || "Kelas 8A";

  // 2. Fetch School Data
  let sekolahData = null;
  if (profil?.sekolah_id) {
    const { data: sek } = await supabase
      .from("sekolah")
      .select("*")
      .eq("id", profil.sekolah_id)
      .single();
    sekolahData = sek;
  }

  // 3. Fetch Chapters and Materials from Supabase
  const { data: babRows } = await supabase
    .from("bab")
    .select(`
      id,
      judul,
      deskripsi,
      urutan,
      mapel,
      kelas,
      semester,
      materi (
        id,
        judul,
        urutan
      )
    `)
    .order("urutan", { ascending: true });

  // 4. Fetch User Reading Progress from progres_materi
  const { data: progresRows } = await supabase
    .from("progres_materi")
    .select("bab_id, materi_id, status")
    .eq("siswa_id", user.id)
    .eq("status", "selesai");

  const completedMateriSet = new Set((progresRows || []).map((p: any) => p.materi_id));

  // Map chapters with progress
  const chaptersWithProgress = (babRows || []).map((bab: any) => {
    const materiList = bab.materi || [];
    const totalMat = materiList.length;
    const completedMat = materiList.filter((m: any) => completedMateriSet.has(m.id)).length;
    const progressPercent = totalMat > 0 ? Math.round((completedMat / totalMat) * 100) : 0;

    return {
      id: bab.id,
      judul: bab.judul,
      deskripsi: bab.deskripsi,
      urutan: bab.urutan,
      mapel: bab.mapel,
      kelas: bab.kelas,
      semester: bab.semester || (bab.urutan <= 3 ? 1 : 2),
      progress: progressPercent,
      materi: materiList.sort((a: any, b: any) => a.urutan - b.urutan),
    };
  });

  return (
    <BelajarClient
      userProfile={{
        nama_lengkap: profil?.nama_lengkap || "Siswa THINKSY",
        email: profil?.email || user.email || "",
        peran: "siswa",
        poin: profil?.poin || 0,
        streak: profil?.streak || 0,
        rank: 1,
        totalStudents: 1,
        isCheckedIn: true,
        checkInTime: null,
        tingkat_kelas: userGrade,
        nama_kelas: namaKelas,
        nisn: profil?.nisn || "0089247182",
        nis: profil?.nis || "260481",
        jurusan: profil?.jurusan || "Teknik Komputer & Jaringan",
        tahun_ajaran: profil?.tahun_ajaran || "2026/2027",
        foto_url: profil?.foto_url || null,
      }}
      sekolahData={sekolahData}
      chapters={chaptersWithProgress}
      completedMateriIds={Array.from(completedMateriSet)}
    />
  );
}
