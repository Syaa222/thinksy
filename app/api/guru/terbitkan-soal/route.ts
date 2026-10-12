import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
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
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    // 2. Verifikasi Peran Guru atau Admin
    const { data: profil, error: profilErr } = await adminDb
      .from("profil")
      .select("id, peran, nama_lengkap")
      .eq("id", user.id)
      .single();

    if (profilErr || !profil) {
      return NextResponse.json(
        { error: "Profil pengguna tidak ditemukan." },
        { status: 403 }
      );
    }

    const isAuthorized = ["guru", "admin", "admin_sekolah", "super_admin"].includes(profil.peran);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Akses ditolak: hanya Guru atau Admin yang berhak menerbitkan soal." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { soalId } = body;

    if (!soalId) {
      return NextResponse.json(
        { error: "Parameter soalId wajib disertakan." },
        { status: 400 }
      );
    }

    // 3. Cek data soal dan VALIDASI WAJIB PEMBAHASAN TERISI
    const { data: soal, error: soalErr } = await adminDb
      .from("soal")
      .select("id, pertanyaan, pembahasan, status_soal, tipe_soal")
      .eq("id", soalId)
      .maybeSingle();

    if (soalErr || !soal) {
      return NextResponse.json(
        { error: "Soal tidak ditemukan." },
        { status: 404 }
      );
    }

    const pembahasanClean = (soal.pembahasan || "").trim();
    if (!pembahasanClean || pembahasanClean.length < 5) {
      return NextResponse.json(
        {
          error:
            "Review Gate: Pembahasan langkah demi langkah WAJIB terisi secara jelas sebelum soal diterbitkan ke siswa!",
        },
        { status: 400 }
      );
    }

    // 4. Update status ke 'dipublikasi' / 'terbit', catat reviewer dan timestamp
    const nowIso = new Date().toISOString();
    const { error: updateErr } = await adminDb
      .from("soal")
      .update({
        status_soal: "dipublikasi",
        direview_oleh: user.id,
        direview_at: nowIso,
      })
      .eq("id", soalId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Gagal menerbitkan soal: " + updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      soalId,
      status: "dipublikasi",
      direviewOleh: profil.nama_lengkap || user.email,
      direviewAt: nowIso,
      message: `Soal berhasil diverifikasi dan diterbitkan oleh ${profil.nama_lengkap || "Guru"}!`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal memproses penerbitan soal." },
      { status: 500 }
    );
  }
}
