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
      return NextResponse.json(
        { error: "Anda harus masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    // 1. Ambil profil user saat ini untuk mengetahui sekolah_id miliknya
    const { data: userProfil } = await supabase
      .from("profil")
      .select("sekolah_id")
      .eq("id", user.id)
      .maybeSingle();

    const userSekolahId = userProfil?.sekolah_id || null;

    // 2. Panggil RPC SECURITY DEFINER `get_peringkat_sekolah` per sekolah_id
    let { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_peringkat_sekolah",
      { p_sekolah_id: userSekolahId }
    );

    // Jika kosong dengan filter sekolah tertentu, coba panggil dengan null (seluruh siswa aktif)
    if ((!rpcData || rpcData.length === 0) && !rpcError) {
      const { data: allRpcData, error: allRpcErr } = await supabase.rpc(
        "get_peringkat_sekolah",
        { p_sekolah_id: null }
      );
      if (!allRpcErr && allRpcData && allRpcData.length > 0) {
        rpcData = allRpcData;
      }
    }

    let leaderboardRows: any[] = [];

    if (rpcData && rpcData.length > 0) {
      leaderboardRows = rpcData.map((row: any, idx: number) => ({
        rank: Number(row.rank) || idx + 1,
        id: row.student_id || row.id,
        name: row.nama_lengkap || "Siswa",
        points: Number(row.poin) || 0,
        streak: Number(row.streak) || 0,
        school: row.nama_sekolah || "SMK Muhammadiyah Pakem",
        isCurrentUser: (row.student_id || row.id) === user.id,
      }));
    } else {
      // 3. Fallback jika RPC tidak mengembalikan data: Query tabel profil
      let query = supabase
        .from("profil")
        .select(`
          id,
          nama_lengkap,
          poin,
          streak,
          sekolah_id
        `)
        .eq("peran", "siswa")
        .order("poin", { ascending: false })
        .limit(100);

      const { data: fallbackData } = await query;

      leaderboardRows = (fallbackData || []).map((student: any, index: number) => ({
        rank: index + 1,
        id: student.id,
        name: student.nama_lengkap || "Siswa",
        points: student.poin || 0,
        streak: student.streak || 0,
        school: "SMK Muhammadiyah Pakem",
        isCurrentUser: student.id === user.id,
      }));
    }

    return NextResponse.json({
      success: true,
      leaderboard: leaderboardRows,
      totalStudents: leaderboardRows.length,
      scope: "sekolah",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server: " + err.message },
      { status: 500 }
    );
  }
}
