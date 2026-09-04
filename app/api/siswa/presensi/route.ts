import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndUpdateDailyStreak, getWIBDateString } from "@/lib/streak";

interface PresensiRequestBody {
  mock_time?: string; // Format: "HH:mm", misal "06:30", "07:15", "07:45", "08:15"
}

// ─── POST: Simpan presensi & kalkulasi reward berdasarkan batas waktu ─────────
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Anda harus masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    let body: PresensiRequestBody = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const todayWIB = getWIBDateString();
    const now = new Date();

    // Tentukan waktu presensi (Mendukung Mock Time saat UAT/Development)
    let hour: number;
    let minute: number;
    let formattedTime: string;

    if (body.mock_time && /^\d{2}:\d{2}$/.test(body.mock_time)) {
      const [h, m] = body.mock_time.split(":").map(Number);
      hour = h;
      minute = m;
      formattedTime = body.mock_time;
    } else {
      const timeFormatter = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const parts = timeFormatter.formatToParts(now);
      hour = Number(parts.find((p) => p.type === "hour")?.value || now.getHours());
      minute = Number(parts.find((p) => p.type === "minute")?.value || now.getMinutes());
      formattedTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }

    const minutesTotal = hour * 60 + minute;

    // ─── ATURAN WAKTU PRESENSI ───────────────────────────────────────────────
    // 1. > 08.00 WIB (> 480 menit): Presensi Ditutup, Status Alpha
    if (minutesTotal > 480) {
      return NextResponse.json(
        {
          error:
            "Presensi telah ditutup (Pukul >08.00 WIB). Status kehadiran Anda tercatat Alpha. Silakan hubungi wali kelas Anda untuk konfirmasi/perubahan status.",
          status: "Alpha",
          isClosed: true,
          time: formattedTime,
        },
        { status: 403 }
      );
    }

    // 2. 07.16 - 08.00 WIB (436 - 480 menit): Terlambat (+3 Poin)
    // 3. 06.00 - 07.15 WIB (<= 435 menit): Hadir Tepat Waktu (+10 Poin)
    const isLate = minutesTotal > 435;
    const statusKehadiran = isLate ? "Terlambat" : "Hadir (Tepat Waktu)";
    const poinReward = isLate ? 3 : 10;

    // ─── 1. Simpan Presensi ke Database (Tanpa Foto) ─────────────────────────
    const waktuMasuk = new Date();
    waktuMasuk.setHours(hour, minute, 0, 0);

    const { data: presensiData, error: presensiError } = await supabase
      .from("presensi")
      .upsert(
        {
          siswa_id: user.id,
          tanggal: todayWIB,
          waktu_masuk: waktuMasuk.toISOString(),
          status: statusKehadiran,
        },
        { onConflict: "siswa_id,tanggal" }
      )
      .select("id, siswa_id, tanggal, waktu_masuk, status")
      .single();

    if (presensiError) {
      console.error("[PRESENSI ERROR]", presensiError.message);
      return NextResponse.json(
        { error: "Gagal menyimpan presensi: " + presensiError.message },
        { status: 500 }
      );
    }

    // ─── 2. Update Poin Siswa di Tabel Profil ────────────────────────────────
    let poinTotal = 0;
    try {
      const { data: rpcPoin } = await adminDb.rpc("tambah_poin_siswa", {
        p_siswa_id: user.id,
        p_poin_ditambahkan: poinReward,
      });
      if (typeof rpcPoin === "number" && rpcPoin > 0) {
        poinTotal = rpcPoin;
      }
    } catch {
      // fallback jika RPC belum tersedia
    }

    if (poinTotal === 0) {
      const { data: currentProfil } = await adminDb
        .from("profil")
        .select("poin, nama_lengkap, streak")
        .eq("id", user.id)
        .single();

      const poinAwal = currentProfil?.poin ?? 0;
      poinTotal = poinAwal + poinReward;

      await adminDb
        .from("profil")
        .update({ poin: poinTotal })
        .eq("id", user.id);
    }

    // ─── 3. Update Daily Streak Siswa ────────────────────────────────────────
    const streakResult = await checkAndUpdateDailyStreak(user.id, "presensi");
    const newStreak = streakResult.currentStreak;

    // ─── 4. Auto-update Misi Harian jika ada ─────────────────────────────────
    try {
      await adminDb
        .from("misi_harian")
        .update({ progres_saat_ini: 1, diklaim: true })
        .eq("siswa_id", user.id)
        .eq("tanggal", todayWIB)
        .ilike("judul", "%presensi%");
    } catch {
      // silent fail
    }

    // ─── 5. Catat Notifikasi Presensi ────────────────────────────────────────
    const notifPesan = isLate
      ? `Presensi dicatat pukul ${formattedTime} WIB (Terlambat). +${poinReward} Poin ditambahkan ke akun Anda.`
      : `Presensi dicatat pukul ${formattedTime} WIB (Tepat Waktu). Selamat! +${poinReward} Poin telah ditambahkan.`;

    try {
      await adminDb.from("notifikasi").insert({
        user_id: user.id,
        judul: `Presensi Berhasil (${statusKehadiran})`,
        pesan: notifPesan,
        tipe: "presensi",
        dibaca: false,
      });
    } catch {
      // silent fail
    }

    return NextResponse.json({
      success: true,
      message: `Presensi berhasil dicatat sebagai ${statusKehadiran}!`,
      presensi: {
        waktu: formattedTime,
        tanggal: todayWIB,
        status: statusKehadiran,
      },
      user: {
        poin: poinTotal,
        streak: newStreak,
      },
      poinReward,
    });
  } catch (err: any) {
    console.error("[PRESENSI POST FATAL]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server: " + err.message },
      { status: 500 }
    );
  }
}

// ─── GET: Cek status presensi hari ini (WIB) ─────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isCheckedIn: false });
    }

    const todayWIB = getWIBDateString();

    const { data: presensi } = await supabase
      .from("presensi")
      .select("id, waktu_masuk, status, tanggal")
      .eq("siswa_id", user.id)
      .eq("tanggal", todayWIB)
      .maybeSingle();

    if (!presensi) {
      return NextResponse.json({ isCheckedIn: false });
    }

    const formattedTime = new Date(presensi.waktu_masuk).toLocaleTimeString(
      "id-ID",
      {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    return NextResponse.json({
      isCheckedIn: true,
      checkInTime: formattedTime,
      status: presensi.status,
    });
  } catch {
    return NextResponse.json({ isCheckedIn: false });
  }
}
