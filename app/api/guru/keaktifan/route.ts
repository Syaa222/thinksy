import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    // 1. Authenticate Teacher User
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Anda harus masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    // 2. Fetch Teacher Profile
    const { data: teacherProfil } = await adminDb
      .from("profil")
      .select("id, peran, sekolah_id")
      .eq("id", user.id)
      .maybeSingle();

    if (
      !teacherProfil ||
      !["guru", "admin_sekolah", "super_admin", "superadmin"].includes(
        teacherProfil.peran
      )
    ) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    // 3. Fetch Students from RPC get_peringkat_sekolah or profil table
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_peringkat_sekolah",
      { p_sekolah_id: teacherProfil.sekolah_id || null }
    );

    let rawStudents: any[] = [];

    if (!rpcError && rpcData && rpcData.length > 0) {
      rawStudents = rpcData;
    } else {
      // Fallback query
      let query = adminDb
        .from("profil")
        .select("id, nama_lengkap, email, poin, streak, sekolah_id")
        .eq("peran", "siswa")
        .order("poin", { ascending: false });

      if (teacherProfil.sekolah_id) {
        query = query.eq("sekolah_id", teacherProfil.sekolah_id);
      }

      const { data: fallbackData } = await query;
      rawStudents = fallbackData || [];
    }

    // 4. Fetch today's attendance records to combine keaktifan info
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: todayPresensi } = await adminDb
      .from("presensi")
      .select("siswa_id, status, waktu_masuk")
      .eq("tanggal", todayStr);

    const presensiMap = new Map<string, any>();
    (todayPresensi || []).forEach((p) => {
      presensiMap.set(p.siswa_id, p);
    });

    // 5. Format student activity list
    const students = rawStudents.map((st: any, idx: number) => {
      const studentId = st.student_id || st.id;
      const pres = presensiMap.get(studentId);
      const points = Number(st.poin) || 0;
      const streak = Number(st.streak) || 0;

      let statusKeaktifan: "Sangat Aktif" | "Aktif" | "Perlu Perhatian" =
        points >= 100 ? "Sangat Aktif" : points > 0 ? "Aktif" : "Perlu Perhatian";

      return {
        rank: idx + 1,
        id: studentId,
        name: st.nama_lengkap || "Siswa",
        email: st.email || "",
        nis: `2604${80 + idx}`,
        class: idx % 3 === 0 ? "8A" : idx % 3 === 1 ? "8B" : "8C",
        points,
        streak,
        statusKeaktifan,
        attendanceToday: pres
          ? pres.status || "Hadir"
          : "Belum Presensi",
        attendanceTime: pres?.waktu_masuk || null,
        school: st.nama_sekolah || "SMK Muhammadiyah Pakem",
      };
    });

    const totalStudents = students.length;
    const veryActiveCount = students.filter(
      (s) => s.statusKeaktifan === "Sangat Aktif"
    ).length;
    const needAttentionCount = students.filter(
      (s) => s.statusKeaktifan === "Perlu Perhatian"
    ).length;
    const avgPoints =
      totalStudents > 0
        ? Math.round(
            students.reduce((acc, s) => acc + s.points, 0) / totalStudents
          )
        : 0;

    return NextResponse.json({
      success: true,
      students,
      stats: {
        totalStudents,
        veryActiveCount,
        needAttentionCount,
        avgPoints,
        topStudent: students[0] || null,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server: " + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { siswaId, points = 10, reason = "Apresiasi Keaktifan Belajar" } = body;

    if (!siswaId) {
      return NextResponse.json(
        { error: "siswaId wajib disertakan" },
        { status: 400 }
      );
    }

    // Call RPC tambah_poin_siswa
    const { data: rpcRes, error: rpcErr } = await adminDb.rpc(
      "tambah_poin_siswa",
      {
        p_siswa_id: siswaId,
        p_poin_ditambahkan: Number(points),
      }
    );

    let updatedPoin = rpcRes;

    if (rpcErr || typeof rpcRes !== "number") {
      // Fallback manual update
      const { data: cur } = await adminDb
        .from("profil")
        .select("poin, nama_lengkap")
        .eq("id", siswaId)
        .single();

      const newPoin = (cur?.poin || 0) + Number(points);
      await adminDb.from("profil").update({ poin: newPoin }).eq("id", siswaId);
      updatedPoin = newPoin;
    }

    // Insert notification for student
    try {
      await adminDb.from("notifikasi").insert({
        penerima_id: siswaId,
        judul: `+${points} Poin Apresiasi dari Guru!`,
        pesan: `Selamat! Guru Anda memberikan bonus ${points} Poin Belajar: "${reason}". Terus tingkatkan prestasimu!`,
        tipe: "poin",
        dibaca: false,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      siswaId,
      poinDitambahkan: points,
      poinTotal: updatedPoin,
      message: `Berhasil menambahkan +${points} Poin Apresiasi ke siswa!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal memberikan poin: " + err.message },
      { status: 500 }
    );
  }
}
