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

    const body = await req.json();
    const { ujianId, token, judul, mapel, babId: incomingBabId } = body;

    if (!ujianId || !token) {
      return NextResponse.json(
        { error: "ID Ujian dan Password Token wajib disertakan." },
        { status: 400 }
      );
    }

    const inputToken = String(token).trim().toUpperCase();
    const isUniversalTokenValid = inputToken === "12345";

    const babId = incomingBabId || (ujianId.startsWith("ulangan-bab-") ? ujianId.replace("ulangan-bab-", "") : null);
    let targetUjianId = ujianId;

    // 1. Coba cari di database berdasarkan ID langsung
    let { data: ujian } = await adminSupabase
      .from("ujian")
      .select("id, judul, deskripsi, mapel, tipe, durasi_menit, passing_grade, status, token, waktu_berakhir, bab_id")
      .eq("id", targetUjianId)
      .maybeSingle();

    // 2. Jika belum ketemu dan ada babId, cari ujian berdasarkan bab_id
    if (!ujian && babId) {
      const { data: ujianByBab } = await adminSupabase
        .from("ujian")
        .select("id, judul, deskripsi, mapel, tipe, durasi_menit, passing_grade, status, token, waktu_berakhir, bab_id")
        .eq("bab_id", babId)
        .maybeSingle();

      if (ujianByBab) {
        ujian = ujianByBab;
        targetUjianId = ujianByBab.id;
      }
    }

    // 3. Fallback jika belum di-seed di Supabase, ambil dari central store
    if (!ujian) {
      try {
        const { getExamPackage } = await import("@/lib/exam-questions-store");
        const pkg = getExamPackage(targetUjianId);
        if (pkg) {
          ujian = {
            id: pkg.id,
            judul: pkg.judul,
            deskripsi: pkg.deskripsi,
            mapel: pkg.mapel,
            tipe: pkg.tipe,
            durasi_menit: pkg.durasi_menit,
            passing_grade: pkg.passing_grade,
            status: pkg.status,
            token: pkg.token || "12345",
            waktu_berakhir: null,
            bab_id: pkg.bab_id,
          };
        }
      } catch {}
    }

    if (!ujian) {
      return NextResponse.json(
        { error: "Ujian atau ulangan belum dibuat atau dipublikasikan oleh guru." },
        { status: 404 }
      );
    }

    // Cek apakah siswa dikeluarkan dari roster ujian oleh guru di Live Monitor
    if (user && ujian.deskripsi) {
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
        } catch { }
      }
    }

    if (ujian.status === "ditutup") {
      return NextResponse.json(
        { error: "Akses ujian ini sedang ditutup oleh Guru." },
        { status: 403 }
      );
    }

    // Periksa token dari database atau central store
    let expectedToken = (ujian.token || "").trim().toUpperCase();
    if (!expectedToken) {
      try {
        const { getExamPackage } = await import("@/lib/exam-questions-store");
        const pkg = getExamPackage(targetUjianId);
        if (pkg?.token) expectedToken = pkg.token.trim().toUpperCase();
      } catch {}
    }
    if (!expectedToken) expectedToken = "12345";
    const isCustomTokenValid = Boolean(expectedToken && inputToken === expectedToken);

    if (!isUniversalTokenValid && !isCustomTokenValid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "Password salah! Silakan gunakan password sementara: 12345",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      ujianId: targetUjianId,
      judul: ujian.judul,
      mapel: ujian.mapel,
      tipe: ujian.tipe,
      durasi_menit: ujian.durasi_menit || 30,
      message: "Password valid! Membuka lembar ujian...",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Terjadi kesalahan internal." },
      { status: 500 }
    );
  }
}
