import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    // Get teacher profile & sekolah_id
    const { data: teacherProfil } = await supabase
      .from("profil")
      .select("sekolah_id")
      .eq("id", user.id)
      .single();

    const formattedDate = new Date().toISOString().split("T")[0];

    // Fetch presensi today with student profile details
    let query = supabase
      .from("presensi")
      .select(
        `
        id,
        siswa_id,
        tanggal,
        waktu_masuk,
        status,
        profil:siswa_id!inner (
          id,
          nama_lengkap,
          sekolah_id
        )
      `
      )
      .eq("tanggal", formattedDate);

    if (teacherProfil?.sekolah_id) {
      query = query.eq("profil.sekolah_id", teacherProfil.sekolah_id);
    }

    const { data: presensiList, error } = await query.order("waktu_masuk", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      presensi: presensiList || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server: " + err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    let body: { classId?: string; presensiIds?: string[] };
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const presensiIds = body.presensiIds || [];
    const formattedDate = new Date().toISOString().split("T")[0];

    let updateQuery = supabase
      .from("presensi")
      .update({ status: "Terverifikasi" })
      .eq("tanggal", formattedDate);

    if (presensiIds.length > 0) {
      updateQuery = updateQuery.in("id", presensiIds);
    }

    const { data: updatedRows, error: updateError } = await updateQuery.select("id, siswa_id");

    if (updateError) {
      return NextResponse.json({ error: "Gagal memverifikasi: " + updateError.message }, { status: 500 });
    }

    const verifiedSiswaIds = Array.from(
      new Set((updatedRows || []).map((r: any) => r.siswa_id).filter(Boolean))
    );

    if (verifiedSiswaIds.length > 0) {
      try {
        const notifPayloads = verifiedSiswaIds.map((sId) => ({
          user_id: sId,
          judul: "Presensi Terverifikasi 🎉",
          pesan: "Foto presensi dan kehadiran Anda hari ini telah diverifikasi resmi oleh Guru.",
          tipe: "success",
          dibaca: false,
        }));
        await adminDb.from("notifikasi").insert(notifPayloads);
      } catch (notifErr) {
        console.warn("[GURU PRESENSI NOTIF ERROR]", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      count: updatedRows?.length || 0,
      verifiedSiswaIds,
      message: `Presensi berhasil diverifikasi dan disimpan!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server: " + err.message },
      { status: 500 }
    );
  }
}
