import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Helper: Tanggal hari ini dalam zona waktu WIB (UTC+7) ───────────────────
function getTodayWIB(): string {
  // Gunakan Intl.DateTimeFormat agar akurat di semua environment
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date()); // Format: "YYYY-MM-DD"
}

// ─── Helper: Auto-klaim misi dan tambah poin (dipakai oleh route lain) ────────
export async function autoClaimMisi(
  adminDb: ReturnType<typeof createAdminClient>,
  siswaId: string,
  judulKeyword: string
): Promise<{ claimed: boolean; poinDitambahkan: number; poinTotal: number }> {
  const todayWIB = getTodayWIB();

  // Pastikan misi harian untuk hari ini sudah ter-generate di database
  await ensureDailyMissions(adminDb, siswaId, todayWIB);

  // 1. Cari misi hari ini yg cocok & belum diklaim
  const { data: misi } = await adminDb
    .from("misi_harian")
    .select("*")
    .eq("siswa_id", siswaId)
    .eq("tanggal", todayWIB)
    .ilike("judul", `%${judulKeyword}%`)
    .eq("diklaim", false)
    .maybeSingle();

  if (!misi) {
    // Tidak ada misi yang perlu diklaim (sudah diklaim atau belum dibuat)
    return { claimed: false, poinDitambahkan: 0, poinTotal: 0 };
  }

  // 2. Update progres ke target & tandai diklaim
  const targetMax = Number(misi.target_max) || 1;
  await adminDb
    .from("misi_harian")
    .update({ progres_saat_ini: targetMax, diklaim: true })
    .eq("id", misi.id)
    .eq("siswa_id", siswaId);

  // 3. Tambahkan poin ke profil (RPC + fallback)
  const poinDitambahkan = Number(misi.poin_hadiah) || 20;
  let poinTotal = 0;

  try {
    const { data: rpcPoin } = await adminDb.rpc("tambah_poin_siswa", {
      p_siswa_id: siswaId,
      p_poin_ditambahkan: poinDitambahkan,
    });
    if (typeof rpcPoin === "number" && rpcPoin > 0) {
      poinTotal = rpcPoin;
    }
  } catch {
    // rpc fallback
  }

  if (poinTotal === 0) {
    const { data: profil } = await adminDb
      .from("profil")
      .select("poin")
      .eq("id", siswaId)
      .single();

    const poinAwal = profil?.poin ?? 0;
    poinTotal = poinAwal + poinDitambahkan;

    await adminDb
      .from("profil")
      .update({ poin: poinTotal })
      .eq("id", siswaId);
  }

  // 4. Catat notifikasi
  try {
    await adminDb.from("notifikasi").insert({
      user_id: siswaId,
      judul: "Misi Harian Selesai! 🎉",
      pesan: `Misi "${misi.judul}" selesai otomatis! +${poinDitambahkan} Poin ditambahkan.`,
      tipe: "urgent",
      dibaca: false,
    });
  } catch {
    // silent fail
  }

  return { claimed: true, poinDitambahkan, poinTotal };
}

// ─── Helper: Buat misi harian untuk siswa jika belum ada ─────────────────────
async function ensureDailyMissions(
  adminDb: ReturnType<typeof createAdminClient>,
  siswaId: string,
  todayWIB: string
) {
  // Cek sudah ada misi hari ini atau belum
  const { data: existing } = await adminDb
    .from("misi_harian")
    .select("id, judul, diklaim, progres_saat_ini")
    .eq("siswa_id", siswaId)
    .eq("tanggal", todayWIB);

  if (existing && existing.length > 0) {
    return existing; // Sudah ada, return data yang ada
  }

  // Cek status aktivitas hari ini untuk set progres awal
  const { data: presensiToday } = await adminDb
    .from("presensi")
    .select("id")
    .eq("siswa_id", siswaId)
    .eq("tanggal", todayWIB)
    .maybeSingle();

  // Batas range sesi selesai hari ini (WIB midnight → midnight berikutnya)
  const todayStart = `${todayWIB}T00:00:00+07:00`;
  const tomorrowDate = new Date(`${todayWIB}T00:00:00+07:00`);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStart = tomorrowDate.toISOString().split("T")[0] + "T00:00:00+07:00";

  const { data: sesiHariIni } = await adminDb
    .from("sesi")
    .select("id")
    .eq("siswa_id", siswaId)
    .eq("status_sesi", "selesai")
    .gte("selesai_pada", todayStart)
    .lt("selesai_pada", tomorrowStart)
    .limit(1);

  const { data: logsHariIni } = await adminDb
    .from("log_ai")
    .select("id")
    .eq("pengguna_id", siswaId)
    .eq("fitur", "tutor_sokratik")
    .gte("dibuat_pada", todayStart)
    .lt("dibuat_pada", tomorrowStart)
    .limit(3);

  const isPresensiDone = Boolean(presensiToday);
  const isSesiDone = Boolean(sesiHariIni && sesiHariIni.length > 0);
  const sokratikCount = Math.min(3, logsHariIni?.length ?? 0);

  const defaultMissions = [
    {
      siswa_id: siswaId,
      judul: "Presensi Selfie Harian",
      deskripsi: "Absen selfie kamera kehadiran hari ini.",
      progres_saat_ini: isPresensiDone ? 1 : 0,
      target_max: 1,
      poin_hadiah: 20,
      diklaim: isPresensiDone, // Auto-diklaim jika sudah presensi
      tanggal: todayWIB,
    },
    {
      siswa_id: siswaId,
      judul: "Selesaikan 1 Kuis / Latihan",
      deskripsi: "Kerjakan 1 sesi kuis atau latihan matematika.",
      progres_saat_ini: isSesiDone ? 1 : 0,
      target_max: 1,
      poin_hadiah: 50,
      diklaim: isSesiDone, // Auto-diklaim jika sudah ada sesi selesai hari ini
      tanggal: todayWIB,
    },
    {
      siswa_id: siswaId,
      judul: "Eksplorasi Soal Sokratik",
      deskripsi: "Gunakan chat Tutor AI Sokratik minimal 1 kali hari ini.",
      progres_saat_ini: sokratikCount,
      target_max: 1, // Target 1 interaksi (bukan 3)
      poin_hadiah: 30,
      diklaim: sokratikCount >= 1,
      tanggal: todayWIB,
    },
  ];

  const { data: created, error: insertErr } = await adminDb
    .from("misi_harian")
    .insert(defaultMissions)
    .select();

  if (insertErr) {
    console.error("[MISI INSERT ERROR]", insertErr.message);
    // Coba fetch ulang kalau-kalau sudah dimasukkan oleh request lain
    const { data: retry } = await adminDb
      .from("misi_harian")
      .select("*")
      .eq("siswa_id", siswaId)
      .eq("tanggal", todayWIB);

    if (retry && retry.length > 0) {
      return retry;
    }

    // Fallback: Kembalikan defaultMissions dengan UUID sintetis agar UI tetap menampilkan 3 kartu misi
    return defaultMissions.map((m, idx) => ({
      id: `00000000-0000-4000-a000-00000000000${idx + 1}`,
      ...m,
    }));
  }

  // Jika misi baru dibuat dan aktivitas sudah ada → tambahkan poin otomatis
  if (created) {
    for (const m of created) {
      if (m.diklaim) {
        const { data: profil } = await adminDb
          .from("profil")
          .select("poin")
          .eq("id", siswaId)
          .single();
        const poinAwal = profil?.poin ?? 0;
        await adminDb
          .from("profil")
          .update({ poin: poinAwal + Number(m.poin_hadiah) })
          .eq("id", siswaId);
      }
    }
  }

  return created || [];
}

// ─── GET: Ambil misi harian siswa (auto-create + sync WIB) ───────────────────
export async function GET() {
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

    const todayWIB = getTodayWIB();

    // Ambil atau buat misi harian
    let missions = await ensureDailyMissions(adminDb, user.id, todayWIB);

    // ── AUTO-CLAIM DALAM 24 JAM: Jika siswa tidak klaim manual, sistem otomatis mengklaim ──
    const { data: unclaimedPastMissions } = await adminDb
      .from("misi_harian")
      .select("id, judul, poin_hadiah, progres_saat_ini, target_max, tanggal")
      .eq("siswa_id", user.id)
      .lt("tanggal", todayWIB)
      .eq("diklaim", false);

    if (unclaimedPastMissions && unclaimedPastMissions.length > 0) {
      for (const pastM of unclaimedPastMissions) {
        if (Number(pastM.progres_saat_ini) >= Number(pastM.target_max)) {
          // Tandai diklaim
          await adminDb
            .from("misi_harian")
            .update({ diklaim: true })
            .eq("id", pastM.id);

          const pts = Number(pastM.poin_hadiah) || 20;
          try {
            await adminDb.rpc("tambah_poin_siswa", {
              p_siswa_id: user.id,
              p_poin_ditambahkan: pts,
            });
          } catch {
            const { data: p } = await adminDb.from("profil").select("poin").eq("id", user.id).single();
            await adminDb.from("profil").update({ poin: (p?.poin || 0) + pts }).eq("id", user.id);
          }

          // Catat notifikasi bahwa misi terklaim otomatis 24 jam
          try {
            await adminDb.from("notifikasi").insert({
              user_id: user.id,
              judul: "Misi Harian Terklaim Otomatis (24 Jam) 🎉",
              pesan: `Misi "${pastM.judul}" otomatis diklaim setelah 24 jam. +${pts} Poin telah ditambahkan ke akun Anda.`,
              tipe: "info",
              dibaca: false,
            });
          } catch {}
        }
      }
    }

    // Sync progres untuk misi yang belum diklaim
    // (dalam kasus sudah ada misi tapi progres belum terupdate)
    for (const m of missions) {
      if (m.diklaim) continue;

      let updatedProgress = m.progres_saat_ini;
      const targetMax = Number(m.target_max);

      if (m.judul.toLowerCase().includes("presensi")) {
        const { data: presensi } = await adminDb
          .from("presensi")
          .select("id")
          .eq("siswa_id", user.id)
          .eq("tanggal", todayWIB)
          .maybeSingle();
        updatedProgress = presensi ? targetMax : 0;
      } else if (
        m.judul.toLowerCase().includes("kuis") ||
        m.judul.toLowerCase().includes("latihan")
      ) {
        const todayStart = `${todayWIB}T00:00:00+07:00`;
        const tomorrowDate = new Date(`${todayWIB}T00:00:00+07:00`);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowStart =
          tomorrowDate.toISOString().split("T")[0] + "T00:00:00+07:00";

        const { data: sesiSelesai } = await adminDb
          .from("sesi")
          .select("id")
          .eq("siswa_id", user.id)
          .eq("status_sesi", "selesai")
          .gte("selesai_pada", todayStart)
          .lt("selesai_pada", tomorrowStart)
          .limit(1);
        updatedProgress =
          sesiSelesai && sesiSelesai.length > 0 ? targetMax : 0;
      } else if (
        m.judul.toLowerCase().includes("sokratik") ||
        m.judul.toLowerCase().includes("eksplorasi")
      ) {
        const todayStart = `${todayWIB}T00:00:00+07:00`;
        const tomorrowDate = new Date(`${todayWIB}T00:00:00+07:00`);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowStart =
          tomorrowDate.toISOString().split("T")[0] + "T00:00:00+07:00";

        const { data: logs } = await adminDb
          .from("log_ai")
          .select("id")
          .eq("pengguna_id", user.id)
          .eq("fitur", "tutor_sokratik")
          .gte("dibuat_pada", todayStart)
          .lt("dibuat_pada", tomorrowStart)
          .limit(targetMax);
        updatedProgress = Math.min(targetMax, logs?.length ?? 0);
      }

      // Update jika progres berubah
      if (updatedProgress !== m.progres_saat_ini) {
        await adminDb
          .from("misi_harian")
          .update({ progres_saat_ini: updatedProgress })
          .eq("id", m.id)
          .eq("siswa_id", user.id);
        m.progres_saat_ini = updatedProgress;
      }
    }

    return NextResponse.json({
      success: true,
      missions,
      misi: missions,
      todayWIB,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server: " + err.message },
      { status: 500 }
    );
  }
}

// ─── POST: Validasi & klaim misi (server-side verification ketat) ─────────────
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

    let body: { misiId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format request body tidak valid." },
        { status: 400 }
      );
    }

    const { misiId } = body;
    if (!misiId) {
      return NextResponse.json(
        { error: "Parameter misiId wajib diisi." },
        { status: 400 }
      );
    }

    const isValidUUID = (str: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        str
      );

    if (!isValidUUID(misiId)) {
      return NextResponse.json(
        { error: "ID misi tidak valid. Hanya UUID yang diterima." },
        { status: 400 }
      );
    }

    const todayWIB = getTodayWIB();

    // 1. Fetch misi dari DB — coba by UUID dulu
    let misi: any = null;
    if (isValidUUID(misiId)) {
      const { data } = await adminDb
        .from("misi_harian")
        .select("*")
        .eq("id", misiId)
        .eq("siswa_id", user.id)
        .eq("tanggal", todayWIB)
        .maybeSingle();
      misi = data;
    }

    // Fallback: Jika ID sintetis atau belum ketemu, cari dari misi harian hari ini by keyword
    if (!misi) {
      const missions = await ensureDailyMissions(adminDb, user.id, todayWIB);
      if (misiId.endsWith("1") || misiId.toLowerCase().includes("presensi")) {
        misi = missions.find((m: any) => m.judul.toLowerCase().includes("presensi"));
      } else if (misiId.endsWith("2") || misiId.toLowerCase().includes("kuis")) {
        misi = missions.find((m: any) => m.judul.toLowerCase().includes("kuis") || m.judul.toLowerCase().includes("latihan"));
      } else if (misiId.endsWith("3") || misiId.toLowerCase().includes("sokratik")) {
        misi = missions.find((m: any) => m.judul.toLowerCase().includes("sokratik") || m.judul.toLowerCase().includes("eksplorasi"));
      }
      if (!misi && missions && missions.length > 0) {
        misi = missions[0];
      }
    }

    if (!misi) {
      return NextResponse.json(
        { success: false, error: "Misi tidak ditemukan atau belum tersedia hari ini." },
        { status: 404 }
      );
    }

    // 2. Cek sudah diklaim
    if (misi.diklaim === true) {
      return NextResponse.json(
        { success: false, error: "Misi ini sudah diklaim sebelumnya hari ini." },
        { status: 400 }
      );
    }

    // 3. ═══ VERIFIKASI SERVER-SIDE: Pastikan siswa benar-benar melakukan misi ═══
    const todayStart = `${todayWIB}T00:00:00+07:00`;
    const tomorrowDate = new Date(`${todayWIB}T00:00:00+07:00`);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStart =
      tomorrowDate.toISOString().split("T")[0] + "T00:00:00+07:00";

    const judulLower = misi.judul.toLowerCase();
    let verifiedProgress = 0;
    const targetMax = Number(misi.target_max);

    if (judulLower.includes("presensi")) {
      // Verifikasi: cek tabel presensi hari ini
      const { data: presensi } = await adminDb
        .from("presensi")
        .select("id")
        .eq("siswa_id", user.id)
        .eq("tanggal", todayWIB)
        .maybeSingle();

      verifiedProgress = presensi ? 1 : 0;

      if (!presensi) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Misi Belum Selesai! Kamu belum melakukan presensi selfie hari ini. Silakan klik tombol Presensi terlebih dahulu.",
          },
          { status: 400 }
        );
      }
    } else if (judulLower.includes("kuis") || judulLower.includes("latihan")) {
      // Verifikasi: cek sesi selesai hari ini di WIB
      const { data: sesiSelesai } = await adminDb
        .from("sesi")
        .select("id")
        .eq("siswa_id", user.id)
        .eq("status_sesi", "selesai")
        .gte("selesai_pada", todayStart)
        .lt("selesai_pada", tomorrowStart)
        .limit(1);

      verifiedProgress =
        sesiSelesai && sesiSelesai.length > 0 ? targetMax : 0;

      if (!sesiSelesai || sesiSelesai.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Misi Belum Selesai! Kamu belum mengerjakan kuis atau latihan hari ini. Silakan selesaikan 1 kuis terlebih dahulu.",
          },
          { status: 400 }
        );
      }
    } else if (judulLower.includes("sokratik") || judulLower.includes("eksplorasi")) {
      // Verifikasi: cek log_ai hari ini
      const { data: logs } = await adminDb
        .from("log_ai")
        .select("id")
        .eq("pengguna_id", user.id)
        .eq("fitur", "tutor_sokratik")
        .gte("dibuat_pada", todayStart)
        .lt("dibuat_pada", tomorrowStart)
        .limit(targetMax);

      verifiedProgress = Math.min(targetMax, logs?.length ?? 0);

      if (verifiedProgress < targetMax) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Misi Belum Selesai! Kamu belum berinteraksi dengan Chat Tutor AI Sokratik hari ini.",
          },
          { status: 400 }
        );
      }
    } else {
      // Misi generik: gunakan progres yang tersimpan di DB
      verifiedProgress = Number(misi.progres_saat_ini);
      if (verifiedProgress < targetMax) {
        return NextResponse.json(
          {
            success: false,
            error: `Misi belum selesai. Progres: ${verifiedProgress}/${targetMax}.`,
          },
          { status: 400 }
        );
      }
    }

    // 4. Update misi: diklaim=true, progres=targetMax
    const { error: claimErr } = await adminDb
      .from("misi_harian")
      .update({ diklaim: true, progres_saat_ini: verifiedProgress })
      .eq("id", misi.id)
      .eq("siswa_id", user.id);

    if (claimErr) {
      return NextResponse.json(
        {
          success: false,
          error: "Gagal memperbarui status klaim: " + claimErr.message,
        },
        { status: 500 }
      );
    }

    // 5. Tambah poin ke profil siswa (RPC + fallback authenticated client)
    const poinDitambahkan = Number(misi.poin_hadiah) || 20;
    let poinTotal = 0;

    try {
      const { data: rpcPoin } = await supabase.rpc("tambah_poin_siswa", {
        p_siswa_id: user.id,
        p_poin_ditambahkan: poinDitambahkan,
      });
      if (typeof rpcPoin === "number" && rpcPoin > 0) {
        poinTotal = rpcPoin;
      }
    } catch {
      // ignore
    }

    if (poinTotal === 0) {
      const { data: profil } = await supabase
        .from("profil")
        .select("poin")
        .eq("id", user.id)
        .single();

      const poinAwal = profil?.poin ?? 0;
      poinTotal = poinAwal + poinDitambahkan;

      await supabase
        .from("profil")
        .update({ poin: poinTotal })
        .eq("id", user.id);
    }

    // 6. Notifikasi klaim
    try {
      await adminDb.from("notifikasi").insert({
        user_id: user.id,
        judul: "Klaim Misi Harian Berhasil 🎉",
        pesan: `Selamat! +${poinDitambahkan} Poin dari misi "${misi.judul}" berhasil diklaim.`,
        tipe: "urgent",
        dibaca: false,
      });
    } catch {
      // silent fail
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengklaim +${poinDitambahkan} poin dari misi "${misi.judul}"!`,
      poinDitambahkan,
      poinTotal,
      misiId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server: " + err.message },
      { status: 500 }
    );
  }
}
