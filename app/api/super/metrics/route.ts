import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { data: profil } = await supabase
      .from("profil")
      .select("peran")
      .eq("id", user.id)
      .single();

    if (!profil || profil.peran !== "super_admin") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sekolahId = searchParams.get("sekolah_id");

    // 1. Total Sekolah
    const { count: totalSekolah } = await supabase
      .from("sekolah")
      .select("id", { count: "exact", head: true });

    // 2. Query Guru, Siswa, Admin, Kelas
    let queryAdmin = supabase
      .from("profil")
      .select("id", { count: "exact", head: true })
      .eq("peran", "admin_sekolah");

    let queryGuru = supabase
      .from("profil")
      .select("id", { count: "exact", head: true })
      .eq("peran", "guru");

    let querySiswa = supabase
      .from("profil")
      .select("id", { count: "exact", head: true })
      .eq("peran", "siswa");

    let queryKelas = supabase
      .from("kelas")
      .select("id", { count: "exact", head: true });

    if (sekolahId && sekolahId !== "all") {
      queryAdmin = queryAdmin.eq("sekolah_id", sekolahId);
      queryGuru = queryGuru.eq("sekolah_id", sekolahId);
      querySiswa = querySiswa.eq("sekolah_id", sekolahId);
      queryKelas = queryKelas.eq("sekolah_id", sekolahId);
    }

    const [{ count: totalAdmin }, { count: totalGuru }, { count: totalSiswa }, { count: totalKelas }] =
      await Promise.all([queryAdmin, queryGuru, querySiswa, queryKelas]);

    // 3. Biaya AI
    const { data: biayaData } = await supabase.from("log_ai").select("biaya_usd");
    let totalBiaya = 0;
    if (biayaData && biayaData.length > 0) {
      totalBiaya = biayaData.reduce(
        (sum: number, row: { biaya_usd: number }) => sum + Number(row.biaya_usd || 0),
        0
      );
    }

    // 4. Breakdown per sekolah
    const { data: sekolahList } = await supabase
      .from("sekolah")
      .select(`
        id,
        nama,
        npsn,
        alamat,
        dibuat_pada,
        profil (
          id,
          peran
        ),
        kelas (
          id
        )
      `)
      .order("dibuat_pada", { ascending: false });

    const tenantBreakdown = (sekolahList || []).map((s: any) => {
      const profs = Array.isArray(s.profil) ? s.profil : [];
      const admins = profs.filter((p: any) => p.peran === "admin_sekolah").length;
      const gurus = profs.filter((p: any) => p.peran === "guru").length;
      const siswas = profs.filter((p: any) => p.peran === "siswa").length;
      const kelases = Array.isArray(s.kelas) ? s.kelas.length : 0;

      return {
        id: s.id,
        nama: s.nama,
        npsn: s.npsn || "-",
        alamat: s.alamat || "-",
        dibuat_pada: s.dibuat_pada,
        adminCount: admins,
        guruCount: gurus,
        siswaCount: siswas,
        kelasCount: kelases,
      };
    });

    // 5. Ambil 15 log audit terbaru
    const { data: auditLogs } = await supabase
      .from("audit_log")
      .select(`
        id,
        actor_id,
        role,
        aksi,
        target_resource,
        detail,
        dibuat_pada,
        actor:actor_id ( nama_lengkap, email )
      `)
      .order("dibuat_pada", { ascending: false })
      .limit(15);

    return NextResponse.json({
      success: true,
      metrics: {
        totalSekolah: totalSekolah || 0,
        totalAdmin: totalAdmin || 0,
        totalGuru: totalGuru || 0,
        totalSiswa: totalSiswa || 0,
        totalKelas: totalKelas || 0,
        totalBiayaUSD: totalBiaya,
        tenantBreakdown,
        auditLogs: auditLogs || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server: " + err.message },
      { status: 500 }
    );
  }
}
