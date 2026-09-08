import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ujianId } = body;

    if (!ujianId) {
      return NextResponse.json({ error: "Ujian ID wajib disertakan" }, { status: 400 });
    }

    // 1. Ambil detail ujian untuk mendapatkan durasi
    const { data: ujian, error: ujianErr } = await adminSupabase
      .from("ujian")
      .select("id, judul, durasi_menit, status, sekolah_id")
      .eq("id", ujianId)
      .single();

    if (ujianErr || !ujian) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    if (ujian.status === "ditutup") {
      return NextResponse.json({ error: "Ujian ini sudah ditutup." }, { status: 400 });
    }

    const now = new Date();

    // 2. Cek apakah siswa sudah memiliki sesi_ujian
    const { data: existingSesi } = await adminSupabase
      .from("sesi_ujian")
      .select("*")
      .eq("ujian_id", ujianId)
      .eq("siswa_id", user.id)
      .maybeSingle();

    if (existingSesi) {
      // Jika sesi sudah selesai
      if (existingSesi.status === "selesai") {
        return NextResponse.json({
          session: existingSesi,
          status: "selesai",
          remaining_seconds: 0,
          message: "Anda sudah menyelesaikan ujian ini.",
        });
      }

      // Cek apakah waktu server sudah habis
      const endTime = new Date(existingSesi.server_end_time);
      const remainingSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

      if (remainingSeconds <= 0 && existingSesi.status === "sedang_mengerjakan") {
        // Update status sesi menjadi habis_waktu
        await adminSupabase
          .from("sesi_ujian")
          .update({
            status: "habis_waktu",
            dikumpulkan_pada: now.toISOString(),
          })
          .eq("id", existingSesi.id);

        return NextResponse.json({
          session: { ...existingSesi, status: "habis_waktu" },
          status: "habis_waktu",
          remaining_seconds: 0,
          message: "Waktu pengerjaan ujian telah habis.",
        });
      }

      return NextResponse.json({
        session: existingSesi,
        status: existingSesi.status,
        remaining_seconds: remainingSeconds,
        server_end_time: existingSesi.server_end_time,
      });
    }

    // 3. Buat sesi_ujian baru dengan server timestamp
    const durasiMenit = ujian.durasi_menit || 60;
    const startTime = now;
    const endTime = new Date(startTime.getTime() + durasiMenit * 60 * 1000);

    const { data: newSesi, error: insertError } = await adminSupabase
      .from("sesi_ujian")
      .insert({
        ujian_id: ujianId,
        siswa_id: user.id,
        server_start_time: startTime.toISOString(),
        server_end_time: endTime.toISOString(),
        status: "sedang_mengerjakan",
      })
      .select()
      .single();

    if (insertError || !newSesi) {
      return NextResponse.json(
        { error: "Gagal membuat sesi ujian: " + insertError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      session: newSesi,
      status: "sedang_mengerjakan",
      remaining_seconds: durasiMenit * 60,
      server_end_time: newSesi.server_end_time,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
