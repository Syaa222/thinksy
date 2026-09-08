import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ujianId } = await params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Ambil detail ujian
    const { data: ujian, error: ujianErr } = await adminSupabase
      .from("ujian")
      .select(`
        id,
        judul,
        mapel,
        durasi_menit,
        passing_grade,
        status,
        sekolah_id,
        kelas_id,
        kelas:kelas_id ( id, nama_kelas )
      `)
      .eq("id", ujianId)
      .single();

    if (ujianErr || !ujian) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    // 2. Ambil daftar seluruh siswa di sekolah / kelas terkait
    let studentsQuery = adminSupabase
      .from("profil")
      .select("id, nama_lengkap, email")
      .eq("peran", "siswa");

    if (ujian.sekolah_id) {
      studentsQuery = studentsQuery.eq("sekolah_id", ujian.sekolah_id);
    }

    const { data: allStudents } = await studentsQuery.order("nama_lengkap", { ascending: true });

    // 3. Ambil seluruh sesi_ujian untuk ujian ini
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

    const sessionMap = new Map((sessions || []).map((s) => [s.siswa_id, s]));

    const now = new Date();
    let countSelesai = 0;
    let countSedang = 0;
    let countBelum = 0;
    let totalScore = 0;

    const studentLiveRows = (allStudents || []).map((st) => {
      const sess = sessionMap.get(st.id);
      let status = "belum_mulai";
      let score = null;
      let elapsedMins = 0;
      let remainingMins = ujian.durasi_menit;

      if (sess) {
        status = sess.status;
        score = sess.nilai_akhir;

        if (sess.server_start_time) {
          const startTime = new Date(sess.server_start_time);
          const endTime = new Date(sess.server_end_time);
          const elapsedMs = Math.max(0, now.getTime() - startTime.getTime());
          elapsedMins = Math.floor(elapsedMs / (1000 * 60));

          const remainingMs = Math.max(0, endTime.getTime() - now.getTime());
          remainingMins = Math.floor(remainingMs / (1000 * 60));

          if (remainingMs <= 0 && sess.status === "sedang_mengerjakan") {
            status = "habis_waktu";
          }
        }

        if (status === "selesai" || status === "habis_waktu") {
          countSelesai++;
          totalScore += score || 0;
        } else if (status === "sedang_mengerjakan") {
          countSedang++;
        }
      } else {
        countBelum++;
      }

      return {
        id: st.id,
        nama_lengkap: st.nama_lengkap || "Siswa",
        email: st.email,
        status,
        score,
        elapsedMins,
        remainingMins,
        dikumpulkan_pada: sess?.dikumpulkan_pada || null,
      };
    });

    const avgScore = countSelesai > 0 ? Math.round(totalScore / countSelesai) : 0;

    return NextResponse.json({
      ujian,
      stats: {
        totalSiswa: allStudents?.length || 0,
        selesai: countSelesai,
        sedangMengerjakan: countSedang,
        belumMulai: countBelum,
        rataRataNilai: avgScore,
      },
      students: studentLiveRows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
