import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email as string)?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Format email tidak valid." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Panggil RPC database untuk mengecek status akun secara aman
    const { data, error } = await supabase.rpc("check_user_account_status", {
      p_email: email,
    });

    if (error) {
      console.error("[check-account RPC Error]", error);
      return NextResponse.json(
        { error: "Gagal memeriksa status akun." },
        { status: 500 }
      );
    }

    const result = data as {
      exists: boolean;
      has_profile: boolean;
      user_id: string | null;
      nama_lengkap: string | null;
      peran: string | null;
      foto_url: string | null;
    };

    return NextResponse.json({
      exists: Boolean(result?.exists),
      hasProfile: Boolean(result?.has_profile),
      userId: result?.user_id || null,
      namaLengkap: result?.nama_lengkap || null,
      peran: result?.peran || null,
      fotoUrl: result?.foto_url || null,
    });
  } catch (err: any) {
    console.error("[check-account API Error]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat memeriksa akun." },
      { status: 500 }
    );
  }
}

