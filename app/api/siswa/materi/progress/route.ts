import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const babId = searchParams.get("babId");

    let query = supabase
      .from("progres_materi")
      .select("id, materi_id, bab_id, status, terakhir_dibaca")
      .eq("siswa_id", user.id);

    if (babId) {
      query = query.eq("bab_id", babId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ progress: data || [] });
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

    const body = await req.json();
    const { babId, materiId, status = "selesai" } = body;

    if (!babId || !materiId) {
      return NextResponse.json({ error: "babId and materiId are required" }, { status: 400 });
    }

    // Check if already marked
    const { data: existing } = await supabase
      .from("progres_materi")
      .select("id, status")
      .eq("siswa_id", user.id)
      .eq("materi_id", materiId)
      .maybeSingle();

    const isFirstTime = !existing;

    if (existing) {
      await supabase
        .from("progres_materi")
        .update({
          status,
          terakhir_dibaca: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("progres_materi")
        .insert({
          siswa_id: user.id,
          bab_id: babId,
          materi_id: materiId,
          status,
          terakhir_dibaca: new Date().toISOString(),
        });

      // Reward student with 5 points for completing a material
      const { data: profil } = await supabase
        .from("profil")
        .select("poin")
        .eq("id", user.id)
        .single();

      if (profil) {
        await supabase
          .from("profil")
          .update({ poin: (profil.poin || 0) + 5 })
          .eq("id", user.id);
      }
    }

    return NextResponse.json({
      success: true,
      isFirstTime,
      message: isFirstTime ? "Materi selesai dibaca! (+5 Poin)" : "Progres diperbarui",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
