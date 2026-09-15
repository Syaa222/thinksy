import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profil } = await supabase
      .from("profil")
      .select("sekolah_id, peran")
      .eq("id", user.id)
      .single();

    if (!profil?.sekolah_id) {
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
    }

    const { data: sekolah } = await supabase
      .from("sekolah")
      .select("id, nama, jam_masuk, jam_terlambat, jam_tutup")
      .eq("id", profil.sekolah_id)
      .single();

    return NextResponse.json({
      sekolah,
      canEdit: ["guru", "admin_sekolah", "superadmin"].includes(profil.peran),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profil } = await supabase
      .from("profil")
      .select("sekolah_id, peran")
      .eq("id", user.id)
      .single();

    if (!profil || !["guru", "admin_sekolah", "superadmin"].includes(profil.peran)) {
      return NextResponse.json({ error: "Hanya Guru atau Admin yang berhak mengubah jam presensi" }, { status: 403 });
    }

    const body = await req.json();
    const { jam_masuk, jam_terlambat, jam_tutup } = body;

    if (!jam_masuk || !jam_tutup) {
      return NextResponse.json({ error: "jam_masuk dan jam_tutup wajib diisi" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("sekolah")
      .update({
        jam_masuk,
        jam_terlambat: jam_terlambat || jam_masuk,
        jam_tutup,
      })
      .eq("id", profil.sekolah_id)
      .select("id, nama, jam_masuk, jam_terlambat, jam_tutup")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Batas waktu presensi sekolah berhasil diperbarui!",
      sekolah: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
