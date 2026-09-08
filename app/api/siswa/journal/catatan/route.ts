import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const materiId = searchParams.get("materiId");
    const babId = searchParams.get("babId");

    let query = supabase
      .from("catatan_materi")
      .select("*")
      .eq("siswa_id", user.id)
      .order("dibuat_pada", { ascending: false });

    if (materiId) query = query.eq("materi_id", materiId);
    if (babId) query = query.eq("bab_id", babId);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notes: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { materiId, babId, halamanNomor = 1, judul = "Catatan Pembelajaran", konten, posisiOffset = 0 } = body;

    if (!konten || (!materiId && !babId)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("catatan_materi")
      .insert({
        siswa_id: user.id,
        materi_id: materiId || null,
        bab_id: babId || null,
        halaman_nomor: halamanNomor,
        judul,
        konten,
        posisi_offset: posisiOffset,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, note: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Note ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("catatan_materi")
      .delete()
      .eq("id", id)
      .eq("siswa_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
