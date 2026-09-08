import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ambil profil siswa
    const { data: profil } = await adminSupabase
      .from("profil")
      .select("id, sekolah_id, nama_lengkap")
      .eq("id", user.id)
      .maybeSingle();

    // Ambil kelas siswa jika ada
    const { data: anggotaKelas } = await adminSupabase
      .from("anggota_kelas")
      .select("kelas_id")
      .eq("siswa_id", user.id)
      .maybeSingle();

    const kelasId = anggotaKelas?.kelas_id;
    const sekolahId = profil?.sekolah_id;

    // Query daftar ujian yang dipublikasi
    let ujianQuery = adminSupabase
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
        kelas_id
      `)
      .eq("status", "dipublikasi")
      .order("waktu_mulai", { ascending: false });

    if (sekolahId) {
      ujianQuery = ujianQuery.eq("sekolah_id", sekolahId);
    }

    const { data: ujianList, error } = await ujianQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ambil riwayat sesi_ujian untuk siswa ini
    const { data: sesiList } = await adminSupabase
      .from("sesi_ujian")
      .select("id, ujian_id, status, nilai_akhir, server_start_time, server_end_time, dikumpulkan_pada")
      .eq("siswa_id", user.id);

    const sesiMap = new Map((sesiList || []).map((s) => [s.ujian_id, s]));

    // Gabungkan status sesi untuk setiap ujian
    const now = new Date();
    const result = (ujianList || []).map((u) => {
      const sesi = sesiMap.get(u.id);
      let sessionStatus = "belum_mulai";
      let remainingSeconds = u.durasi_menit * 60;
      let score = null;

      if (sesi) {
        sessionStatus = sesi.status;
        score = sesi.nilai_akhir;

        if (sesi.status === "sedang_mengerjakan") {
          const endTime = new Date(sesi.server_end_time);
          const diffMs = endTime.getTime() - now.getTime();
          remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));

          if (diffMs <= 0) {
            sessionStatus = "habis_waktu";
          }
        }
      }

      return {
        id: u.id,
        judul: u.judul,
        deskripsi: u.deskripsi,
        mapel: u.mapel,
        durasi_menit: u.durasi_menit,
        passing_grade: u.passing_grade,
        waktu_mulai: u.waktu_mulai,
        waktu_berakhir: u.waktu_berakhir,
        session_status: sessionStatus,
        remaining_seconds: remainingSeconds,
        nilai_akhir: score,
        sesi_id: sesi?.id || null,
      };
    });

    return NextResponse.json({ exams: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
