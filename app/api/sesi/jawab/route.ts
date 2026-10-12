import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Anda harus masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { sesiId, soalId, opsiId, jawabanTeks } = body;

    if (!sesiId || !soalId) {
      return NextResponse.json(
        { error: "Parameter sesiId dan soalId wajib diisi." },
        { status: 400 }
      );
    }

    // 2. Verifikasi kepemilikan sesi
    const { data: sesi, error: sesiErr } = await adminDb
      .from("sesi")
      .select("id, siswa_id, tipe_sesi, status_sesi")
      .eq("id", sesiId)
      .maybeSingle();

    if (sesiErr || !sesi) {
      return NextResponse.json(
        { error: "Sesi tidak ditemukan." },
        { status: 404 }
      );
    }

    if (sesi.siswa_id !== user.id) {
      return NextResponse.json(
        { error: "Akses ditolak: sesi bukan milik Anda." },
        { status: 403 }
      );
    }

    // 3. Ambil data soal & kunci jawaban dari DB (Server-Side Only)
    const { data: soal, error: soalErr } = await adminDb
      .from("soal")
      .select(`
        id,
        tipe_soal,
        kunci_jawaban,
        pembahasan,
        poin,
        opsi_soal (
          id,
          label,
          teks_opsi,
          benar,
          alasan_salah
        )
      `)
      .eq("id", soalId)
      .maybeSingle();

    if (soalErr || !soal) {
      return NextResponse.json(
        { error: "Soal tidak ditemukan." },
        { status: 404 }
      );
    }

    // 4. Hitung kebenaran jawaban berdasarkan tipe soal
    let isBenar: boolean | null = null;
    let selectedOption: any = null;
    let calculatedNilai: number | null = 0;
    const poinMaks = soal.poin || 10;

    if (soal.tipe_soal === "pilihan_ganda") {
      if (opsiId && Array.isArray(soal.opsi_soal)) {
        selectedOption = soal.opsi_soal.find((o: any) => o.id === opsiId);
        isBenar = Boolean(selectedOption?.benar);
        calculatedNilai = isBenar ? poinMaks : 0;
      }
    } else if (soal.tipe_soal === "isian_singkat") {
      const studentInput = (jawabanTeks || "").trim().toLowerCase().replace(/\s+/g, " ");
      const officialKey = (soal.kunci_jawaban || "").trim().toLowerCase().replace(/\s+/g, " ");

      if (studentInput && officialKey) {
        // Cek exact match atau jika ada beberapa alternatif jawaban dipisah koma atau garis miring
        const keyOptions = officialKey.split(/[,/|]/).map((k: string) => k.trim());
        isBenar = keyOptions.includes(studentInput);
        calculatedNilai = isBenar ? poinMaks : 0;
      } else {
        isBenar = false;
        calculatedNilai = 0;
      }
    } else {
      // Esai: Menunggu penilaian AI/Guru
      isBenar = null;
      calculatedNilai = null;
    }

    // 5. Simpan ke tabel `jawaban` (Upsert per sesi_id & soal_id)
    const { error: upsertErr } = await adminDb
      .from("jawaban")
      .upsert(
        {
          sesi_id: sesiId,
          soal_id: soalId,
          opsi_dipilih_id: opsiId || null,
          jawaban_teks: jawabanTeks || (selectedOption?.teks_opsi ?? null),
          is_benar: isBenar,
          nilai: calculatedNilai,
          dijawab_pada: new Date().toISOString(),
        },
        { onConflict: "sesi_id,soal_id" }
      );

    if (upsertErr) {
      return NextResponse.json(
        { error: "Gagal menyimpan jawaban: " + upsertErr.message },
        { status: 500 }
      );
    }

    // 6. Response berbasis jenis sesi (Handbook: latihan kembalikan feedback langsung, kuis HANYA simpan)
    const isLatihan = sesi.tipe_sesi === "latihan";

    if (isLatihan) {
      return NextResponse.json({
        success: true,
        mode: "latihan",
        isBenar,
        nilai: calculatedNilai,
        pembahasan: soal.pembahasan || "Pembahasan untuk soal ini belum tersedia.",
        alasanSalah: isBenar ? null : (selectedOption?.alasan_salah || "Jawaban belum tepat, silakan pelajari kembali konsepnya."),
        kunciJawaban: isBenar ? (soal.kunci_jawaban || selectedOption?.teks_opsi) : null,
      });
    }

    // Quiz & Assessment: Kunci jawaban & pembahasan RAHASIA MUTLAK
    return NextResponse.json({
      success: true,
      mode: "quiz",
      saved: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal memproses jawaban." },
      { status: 500 }
    );
  }
}
