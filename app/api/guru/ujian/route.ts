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

    const { data: profil } = await adminSupabase
      .from("profil")
      .select("id, peran, sekolah_id")
      .eq("id", user.id)
      .single();

    if (!profil || !["guru", "admin_sekolah", "super_admin", "superadmin"].includes(profil.peran)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    if (profil.sekolah_id) {
      query = query.eq("sekolah_id", profil.sekolah_id);
    }

    const { data: exams, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ambil statistik pengerjaan untuk setiap ujian
    const examIds = (exams || []).map((e) => e.id);
    const { data: allSessions } = await adminSupabase
      .from("sesi_ujian")
      .select("id, ujian_id, status, nilai_akhir")
      .in("ujian_id", examIds);

    const statsMap = new Map<string, { total: number; selesai: number; sedang: number; avgScore: number }>();

    (allSessions || []).forEach((s) => {
      const cur = statsMap.get(s.ujian_id) || { total: 0, selesai: 0, sedang: 0, avgScore: 0, totalScore: 0 as number };
      cur.total++;
      if (s.status === "selesai") {
        cur.selesai++;
        (cur as any).totalScore += s.nilai_akhir || 0;
      } else if (s.status === "sedang_mengerjakan") {
        cur.sedang++;
      }
      statsMap.set(s.ujian_id, cur);
    });

    const examsWithStats = (exams || []).map((e) => {
      const st = statsMap.get(e.id) || { total: 0, selesai: 0, sedang: 0, totalScore: 0 };
      const avgScore = st.selesai > 0 ? Math.round(((st as any).totalScore || 0) / st.selesai) : 0;

      return {
        ...e,
        nama_kelas: (e.kelas as any)?.nama_kelas || "Semua Kelas 8",
        peserta_total: st.total,
        peserta_selesai: st.selesai,
        peserta_sedang: st.sedang,
        rata_rata_nilai: avgScore,
      };
    });

    return NextResponse.json({ exams: examsWithStats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profil } = await adminSupabase
      .from("profil")
      .select("id, peran, sekolah_id")
      .eq("id", user.id)
      .single();

    if (!profil || !["guru", "admin_sekolah", "super_admin"].includes(profil.peran)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      judul,
      deskripsi,
      mapel = "Matematika",
      kelasId,
      babId,
      durasiMenit = 60,
      passingGrade = 75,
      waktuMulai,
      waktuBerakhir,
      acakSoal = false,
      acakOpsi = false,
      soalIds = [],
    } = body;

    if (!judul) {
      return NextResponse.json({ error: "Judul ujian wajib diisi" }, { status: 400 });
    }

    const now = new Date();
    const start = waktuMulai ? new Date(waktuMulai) : now;
    const end = waktuBerakhir ? new Date(waktuBerakhir) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Insert ke tabel ujian
    const { data: newUjian, error: insertErr } = await adminSupabase
      .from("ujian")
      .insert({
        sekolah_id: profil.sekolah_id || "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        guru_id: user.id,
        kelas_id: kelasId || null,
        bab_id: babId || null,
        mapel,
        judul,
        deskripsi: deskripsi || "",
        durasi_menit: Number(durasiMenit),
        passing_grade: Number(passingGrade),
        waktu_mulai: start.toISOString(),
        waktu_berakhir: end.toISOString(),
        acak_soal: Boolean(acakSoal),
        acak_opsi: Boolean(acakOpsi),
        status: "dipublikasi",
      })
      .select()
      .single();

    if (insertErr || !newUjian) {
      return NextResponse.json({ error: "Gagal membuat ujian: " + insertErr?.message }, { status: 500 });
    }

    // 2. Hubungkan soal ke tabel ujian_soal
    if (soalIds && soalIds.length > 0) {
      const ujianSoalPayload = soalIds.map((soalId: string, idx: number) => ({
        ujian_id: newUjian.id,
        soal_id: soalId,
        urutan: idx + 1,
        poin_bobot: 10,
      }));

      await adminSupabase.from("ujian_soal").insert(ujianSoalPayload);
    }

    // 3. Catat audit log
    await adminSupabase.from("audit_log").insert({
      actor_id: user.id,
      role: profil.peran,
      aksi: "EXAM_PUBLISHED",
      target_resource: `ujian:${newUjian.id}`,
      detail: { judul, mapel, durasi_menit: durasiMenit },
    });

    return NextResponse.json({
      success: true,
      ujian: newUjian,
      message: "Ujian berhasil dibuat dan dipublikasikan!",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profil } = await adminSupabase
      .from("profil")
      .select("id, peran")
      .eq("id", user.id)
      .single();

    if (!profil || !["guru", "admin_sekolah", "super_admin", "superadmin"].includes(profil.peran)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { ujianId, status, waktuMulai, waktuBerakhir } = body;

    if (!ujianId) {
      return NextResponse.json({ error: "ujianId wajib diisi" }, { status: 400 });
    }

    const updatePayload: any = {};
    if (status) updatePayload.status = status;
    if (waktuMulai) updatePayload.waktu_mulai = new Date(waktuMulai).toISOString();
    if (waktuBerakhir) updatePayload.waktu_berakhir = new Date(waktuBerakhir).toISOString();

    const { data, error } = await adminSupabase
      .from("ujian")
      .update(updatePayload)
      .eq("id", ujianId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ujian: data,
      message: `Status ujian berhasil diubah menjadi ${status === "dipublikasi" ? "Dibuka (Aktif)" : "Ditutup"}!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
