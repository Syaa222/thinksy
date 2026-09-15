import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    // Ambil profil guru & sekolah_id
    const { data: teacherProfil } = await adminDb
      .from("profil")
      .select("sekolah_id")
      .eq("id", user.id)
      .single();

    const formattedDate = new Date().toISOString().split("T")[0];

    // 1. Ambil semua siswa di sekolah yang sama
    let studentsQuery = adminDb
      .from("profil")
      .select("id, nama_lengkap, email, sekolah_id")
      .eq("peran", "siswa");

    if (teacherProfil?.sekolah_id) {
      studentsQuery = studentsQuery.eq("sekolah_id", teacherProfil.sekolah_id);
    }

    const { data: studentsList } = await studentsQuery.order("nama_lengkap", { ascending: true });

    // 2. Ambil presensi hari ini
    const { data: presensiToday } = await adminDb
      .from("presensi")
      .select("id, siswa_id, tanggal, waktu_masuk, status")
      .eq("tanggal", formattedDate);

    const presensiMap = new Map<string, any>();
    (presensiToday || []).forEach((p: any) => {
      presensiMap.set(p.siswa_id, p);
    });

    // 3. Gabungkan agar semua siswa muncul dengan status kehadiran riil
    const combinedList = (studentsList || []).map((s: any) => {
      const pRecord = presensiMap.get(s.id);
      return {
        id: pRecord?.id || `temp-${s.id}`,
        siswa_id: s.id,
        nama_lengkap: s.nama_lengkap,
        tanggal: formattedDate,
        waktu_masuk: pRecord?.waktu_masuk || null,
        status: pRecord?.status || "Belum Absen",
        hasAttended: Boolean(pRecord),
      };
    });

    return NextResponse.json({
      success: true,
      tanggal: formattedDate,
      presensi: combinedList,
    });
  } catch (err: any) {
    console.error("[PRESENSI GET ERROR]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server: " + err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const formattedDate = body.tanggal || new Date().toISOString().split("T")[0];

    // AKSI 1: Guru Mengatur Jam & Status Presensi Siswa Individual
    if (body.action === "update_student_presence" && body.siswaId) {
      const { siswaId, status, waktuMasuk } = body;

      // Bentuk timestamp ISO untuk waktu masuk jika diberikan format "HH:mm"
      let parsedWaktuMasuk: string = new Date().toISOString();
      if (waktuMasuk && typeof waktuMasuk === "string") {
        if (waktuMasuk.includes(":")) {
          const [hours, minutes] = waktuMasuk.split(":");
          const d = new Date();
          d.setHours(parseInt(hours, 10) || 7, parseInt(minutes, 10) || 0, 0, 0);
          parsedWaktuMasuk = d.toISOString();
        } else {
          parsedWaktuMasuk = waktuMasuk;
        }
      }

      // Upsert presensi berdasarkan (siswa_id, tanggal)
      const { data: savedPresensi, error: upsertErr } = await adminDb
        .from("presensi")
        .upsert(
          {
            siswa_id: siswaId,
            tanggal: formattedDate,
            status: status || "Hadir (Tepat Waktu)",
            waktu_masuk: parsedWaktuMasuk,
          },
          { onConflict: "siswa_id,tanggal" }
        )
        .select("id, siswa_id, tanggal, waktu_masuk, status")
        .single();

      if (upsertErr) {
        return NextResponse.json({ error: "Gagal menyimpan presensi: " + upsertErr.message }, { status: 500 });
      }

      // Notifikasi ke siswa
      try {
        await adminDb.from("notifikasi").insert({
          user_id: siswaId,
          judul: `Kehadiran Disetujui: ${status}`,
          pesan: `Guru telah mencatat kehadiran Anda pada pukul ${new Date(parsedWaktuMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB dengan status "${status}".`,
          tipe: "sukses",
          dibaca: false,
        });
      } catch (notifErr) {
        console.warn("[NOTIF PRESENSI ERROR]", notifErr);
      }

      return NextResponse.json({
        success: true,
        presensi: savedPresensi,
        message: `Status kehadiran siswa berhasil diatur: ${status}`,
      });
    }

    // AKSI 2: Mass Verify Presensi
    const presensiIds = body.presensiIds || [];

    let updateQuery = adminDb
      .from("presensi")
      .update({ status: "Terverifikasi" })
      .eq("tanggal", formattedDate);

    if (presensiIds.length > 0) {
      updateQuery = updateQuery.in("id", presensiIds);
    }

    const { data: updatedRows, error: updateError } = await updateQuery.select("id, siswa_id");

    if (updateError) {
      return NextResponse.json({ error: "Gagal memverifikasi: " + updateError.message }, { status: 500 });
    }

    const verifiedSiswaIds = Array.from(
      new Set((updatedRows || []).map((r: any) => r.siswa_id).filter(Boolean))
    );

    if (verifiedSiswaIds.length > 0) {
      try {
        const notifPayloads = verifiedSiswaIds.map((sId) => ({
          user_id: sId,
          judul: "Presensi Terverifikasi 🎉",
          pesan: "Kehadiran Anda hari ini telah diverifikasi resmi oleh Guru.",
          tipe: "sukses",
          dibaca: false,
        }));
        await adminDb.from("notifikasi").insert(notifPayloads);
      } catch (notifErr) {
        console.warn("[GURU PRESENSI NOTIF ERROR]", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      count: updatedRows?.length || 0,
      verifiedSiswaIds,
      message: `Presensi berhasil diverifikasi dan disimpan!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server: " + err.message },
      { status: 500 }
    );
  }
}
