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
    const { ujianId, token } = body;

    if (!ujianId) {
      return NextResponse.json({ error: "Ujian ID wajib disertakan" }, { status: 400 });
    }

    // 1. Ambil detail ujian untuk mendapatkan durasi
    const SIMULASI_ALIAS_MAP: Record<string, string> = {
      "sim-literasi": "e7eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
      "sim-numerasi": "e8eebc99-9c0b-4ef8-bb6d-6bb9bd380a88",
      "sim-karakter": "e9eebc99-9c0b-4ef8-bb6d-6bb9bd380a99",
    };
    let targetUjianId = SIMULASI_ALIAS_MAP[ujianId] || ujianId;
    const { data: initialUjian, error: ujianErr } = await adminSupabase
      .from("ujian")
      .select("id, judul, deskripsi, durasi_menit, status, sekolah_id, token, bab_id, tipe")
      .eq("id", targetUjianId)
      .maybeSingle();
    let ujian = initialUjian;

    if (!ujian && targetUjianId.startsWith("ulangan-bab-")) {
      const bId = targetUjianId.replace("ulangan-bab-", "");
      const { data: uBab } = await adminSupabase
        .from("ujian")
        .select("id, judul, deskripsi, durasi_menit, status, sekolah_id, token, bab_id, tipe")
        .eq("bab_id", bId)
        .maybeSingle();
      if (uBab) {
        ujian = uBab;
        targetUjianId = uBab.id;
      }
    }

    // Fallback central store jika data ujian belum di-seed di Supabase
    if (!ujian) {
      try {
        const { getExamPackage } = await import("@/lib/exam-questions-store");
        const pkg = getExamPackage(targetUjianId);
        if (pkg) {
          ujian = {
            id: pkg.id,
            judul: pkg.judul,
            deskripsi: pkg.deskripsi,
            durasi_menit: pkg.durasi_menit,
            status: pkg.status,
            sekolah_id: null,
            token: pkg.token || "12345",
            bab_id: pkg.bab_id,
            tipe: pkg.tipe,
          };
        }
      } catch {}
    }

    if (!ujian) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    // Cek apakah siswa dikeluarkan dari roster ujian oleh guru
    if (ujian.deskripsi) {
      const rosterMatch = ujian.deskripsi.match(/<!-- EXAM_ROSTER:(.*?) -->/);
      if (rosterMatch) {
        try {
          const rosterMeta = JSON.parse(rosterMatch[1]);
          if (Array.isArray(rosterMeta.excluded) && rosterMeta.excluded.includes(user.id)) {
            return NextResponse.json(
              {
                error:
                  "Nama Anda belum di-invit ke sesi ujian ini oleh Guru Pengawas. Silakan hubungi Guru Pengawas untuk meng-invit Anda melalui Live Monitor.",
              },
              { status: 403 }
            );
          }
        } catch {}
      }
    }

    if (ujian.status === "ditutup" && ujian.tipe !== "simulasi") {
      return NextResponse.json({ error: "Ujian ini sudah ditutup oleh Guru." }, { status: 400 });
    }

    if (token && ujian.tipe !== "simulasi") {
      const inputToken = String(token).trim().toUpperCase();
      const isUniversal = inputToken === "12345";
      const isCustom = ujian.token ? inputToken === ujian.token.trim().toUpperCase() : true;
      if (!isUniversal && !isCustom) {
        return NextResponse.json({ error: "Password / Kode token tidak valid. Gunakan password sementara: 12345" }, { status: 400 });
      }
    }

    const now = new Date();

    // 2. Cek apakah siswa sudah memiliki sesi_ujian
    const { data: existingSesi } = await adminSupabase
      .from("sesi_ujian")
      .select("*")
      .eq("ujian_id", targetUjianId)
      .eq("siswa_id", user.id)
      .maybeSingle();

    if (existingSesi) {
      // Jika sesi sudah selesai
      if (existingSesi.status === "selesai") {
        if (ujian.tipe === "simulasi") {
          // Buat sesi baru untuk simulasi mandiri agar siswa bisa latihan lagi
          const durasiMenit = ujian.durasi_menit || 60;
          const startTime = now;
          const endTime = new Date(startTime.getTime() + durasiMenit * 60 * 1000);
          const { data: newSimSesi } = await adminSupabase
            .from("sesi_ujian")
            .update({
              server_start_time: startTime.toISOString(),
              server_end_time: endTime.toISOString(),
              status: "sedang_mengerjakan",
              skor_objektif: null,
              skor_esai: null,
              nilai_akhir: null,
              dikumpulkan_pada: null,
            })
            .eq("id", existingSesi.id)
            .select()
            .single();

          if (newSimSesi) {
            await adminSupabase.from("jawaban_ujian").delete().eq("sesi_ujian_id", existingSesi.id);
            return NextResponse.json({
              session: newSimSesi,
              status: "sedang_mengerjakan",
              remaining_seconds: durasiMenit * 60,
              server_end_time: newSimSesi.server_end_time,
            });
          }
        }

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

      if (existingSesi.status === "terkunci") {
        return NextResponse.json({
          session: existingSesi,
          status: "terkunci",
          remaining_seconds: remainingSeconds,
          message:
            "Sesi ujian Anda terkunci karena terdeteksi keluar dari ruang ujian resmi. Silakan hubungi Guru Pengawas untuk meng-invit ulang dan membuka kunci ujian Anda.",
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
        ujian_id: targetUjianId,
        siswa_id: user.id,
        server_start_time: startTime.toISOString(),
        server_end_time: endTime.toISOString(),
        status: "sedang_mengerjakan",
      })
      .select()
      .single();

    let activeSession = newSesi;

    if (insertError || !activeSession) {
      // Coba upsert row ujian ke Supabase terlebih dahulu jika terjadi foreign key issue
      try {
        await adminSupabase.from("ujian").upsert({
          id: targetUjianId,
          judul: ujian.judul || "Ujian",
          deskripsi: ujian.deskripsi || "",
          mapel: "Matematika",
          tipe: ujian.tipe || "ulangan",
          durasi_menit: durasiMenit,
          passing_grade: 75,
          status: "dipublikasi",
          token: ujian.token || "12345",
        });

        const retryRes = await adminSupabase
          .from("sesi_ujian")
          .insert({
            ujian_id: targetUjianId,
            siswa_id: user.id,
            server_start_time: startTime.toISOString(),
            server_end_time: endTime.toISOString(),
            status: "sedang_mengerjakan",
          })
          .select()
          .single();

        if (retryRes.data) {
          activeSession = retryRes.data;
        }
      } catch {}

      // Jika database offline/unreachable, gunakan sesi fallback terproteksi
      if (!activeSession) {
        activeSession = {
          id: `sesi-${Date.now()}`,
          ujian_id: targetUjianId,
          siswa_id: user.id,
          server_start_time: startTime.toISOString(),
          server_end_time: endTime.toISOString(),
          status: "sedang_mengerjakan",
        };
      }
    }

    return NextResponse.json({
      session: activeSession,
      status: "sedang_mengerjakan",
      remaining_seconds: durasiMenit * 60,
      server_end_time: activeSession.server_end_time,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
