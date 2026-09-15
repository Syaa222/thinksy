import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { gameType, score, pointsEarned = 10 } = body;

    // Cap reward to max 25 points per game session to prevent point inflation
    const safePoints = Math.min(Math.max(1, Number(pointsEarned) || 5), 25);

    const { data: profil } = await supabase
      .from("profil")
      .select("poin, nama_lengkap")
      .eq("id", user.id)
      .single();

    const currentPoints = profil?.poin || 0;
    const newPoints = currentPoints + safePoints;

    await supabase
      .from("profil")
      .update({ poin: newPoints })
      .eq("id", user.id);

    // Optional notification
    await supabase.from("notifikasi").insert({
      user_id: user.id,
      judul: `Hadiah Game ${gameType || "Edukasi"} 🎮`,
      pesan: `Selamat! Kamu meraih skor ${score || 0} dan mendapatkan +${safePoints} Poin Belajar!`,
      tipe: "info",
      dibaca: false,
    });

    return NextResponse.json({
      success: true,
      pointsAdded: safePoints,
      totalPoints: newPoints,
      message: `Selamat! +${safePoints} Poin Belajar ditambahkan!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
