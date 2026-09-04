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

    const formattedDate = new Date().toISOString().split("T")[0];

    const { data: presensiList, error } = await supabase
      .from("presensi")
      .select(
        `
        id,
        siswa_id,
        tanggal,
        waktu_masuk,
        status,
        profil:siswa_id (
          id,
          nama_lengkap
        )
      `
      )
      .eq("tanggal", formattedDate)
      .order("waktu_masuk", { ascending: false });

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
