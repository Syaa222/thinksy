import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body?.userId;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Pastikan user tersebut benar-benar belum memiliki profil sebelum dihapus
    const { data: profil } = await supabase
      .from("profil")
      .select("id")
      .eq("id", userId)
      .single();

    if (profil) {
      return NextResponse.json(
        { error: "User sudah memiliki profil, tidak dapat dihapus." },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.warn("[clean-orphan] Gagal menghapus user via admin:", deleteError.message);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log(`[clean-orphan] Berhasil membersihkan user auth tanpa profil: ${userId}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[clean-orphan] Exception:", err);
    return NextResponse.json(
      { error: err?.message || "Terjadi kesalahan internal." },
      { status: 500 }
    );
  }
}

