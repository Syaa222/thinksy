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
    const { sesiId, ujianId, answers } = body;

    if (!sesiId || !answers) {
      return NextResponse.json({ error: "sesiId dan answers wajib disertakan" }, { status: 400 });
    }

    // 1. Verifikasi sesi ujian milik siswa ini
    const { data: sesi, error: sesiErr } = await adminSupabase
      .from("sesi_ujian")
      .select("*")
      .eq("id", sesiId)
      .eq("siswa_id", user.id)
      .single();

    if (sesiErr || !sesi) {
      return NextResponse.json({ error: "Sesi ujian tidak valid" }, { status: 404 });
    }

    if (sesi.status === "selesai") {
      return NextResponse.json({ error: "Ujian sudah dikumpulkan", isCompleted: true }, { status: 400 });
    }

    // 2. Cek apakah waktu server sudah habis
    const now = new Date();
    const endTime = new Date(sesi.server_end_time);
    const diffMs = endTime.getTime() - now.getTime();

    if (diffMs <= 0) {
      // Waktu habis - update status
      await adminSupabase
        .from("sesi_ujian")
        .update({
          status: "habis_waktu",
          dikumpulkan_pada: now.toISOString(),
        })
        .eq("id", sesiId);

      return NextResponse.json({
        isExpired: true,
        message: "Waktu pengerjaan ujian telah berakhir.",
      });
    }

    // 3. Upsert jawaban_ujian
    // answers format: Array<{ soalId: string, opsiId?: string, jawabanEsai?: string }>
    for (const ans of answers) {
      if (!ans.soalId) continue;

      const { data: existingJawaban } = await adminSupabase
        .from("jawaban_ujian")
        .select("id")
        .eq("sesi_ujian_id", sesiId)
        .eq("soal_id", ans.soalId)
        .maybeSingle();

      if (existingJawaban) {
        await adminSupabase
          .from("jawaban_ujian")
          .update({
            opsi_dipilih_id: ans.opsiId || null,
            jawaban_esai: ans.jawabanEsai || "",
          })
          .eq("id", existingJawaban.id);
      } else {
        await adminSupabase.from("jawaban_ujian").insert({
          sesi_ujian_id: sesiId,
          soal_id: ans.soalId,
          opsi_dipilih_id: ans.opsiId || null,
          jawaban_esai: ans.jawabanEsai || "",
        });
      }
    }

    return NextResponse.json({
      success: true,
      savedAt: now.toISOString(),
      remainingSeconds: Math.max(0, Math.floor(diffMs / 1000)),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
