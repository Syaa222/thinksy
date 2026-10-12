import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
    const {
      babId,
      jenis = "latihan",
      batasMenit: customBatasMenit,
    } = body;

    // Resolve babId jika tidak ada
    let effectiveBabId = babId;
    if (!effectiveBabId) {
      const { data: firstBab } = await adminDb
        .from("bab")
        .select("id")
        .order("urutan", { ascending: true })
        .limit(1)
        .single();
      effectiveBabId = firstBab?.id;
    }

    // Tentukan timer default sesuai jenis sesi
    let batasMenit: number | null = null;
    if (typeof customBatasMenit === "number") {
      batasMenit = customBatasMenit;
    } else if (jenis === "quiz" || jenis === "kuis") {
      batasMenit = 15;
    } else if (jenis === "assessment") {
      batasMenit = 30;
    }

    // Mapping nama jenis sesi ke tipe_sesi database ('latihan', 'kuis' / 'quiz', 'assessment')
    const mappedTipeSesi = jenis === "quiz" ? "kuis" : jenis;

    // 2. Buat sesi di database
    const { data: newSesi, error: insertError } = await adminDb
      .from("sesi")
      .insert({
        siswa_id: user.id,
        bab_id: effectiveBabId,
        tipe_sesi: mappedTipeSesi,
        status_sesi: "aktif",
        batas_menit: batasMenit,
        skor_maks: 100,
      })
      .select("id, siswa_id, bab_id, tipe_sesi, status_sesi, batas_menit, mulai_pada")
      .single();

    if (insertError || !newSesi) {
      return NextResponse.json(
        { error: "Gagal membuat sesi belajar: " + insertError?.message },
        { status: 500 }
      );
    }

    // 3. Query Bank Soal terbit untuk bab ini (Strictly without answers/keys)
    let soalQuery = adminDb
      .from("soal")
      .select(`
        id,
        pertanyaan,
        tipe_soal,
        poin,
        opsi_soal (
          id,
          label,
          teks_opsi,
          urutan
        )
      `)
      .in("status_soal", ["dipublikasi", "terbit"]);

    if (effectiveBabId) {
      soalQuery = soalQuery.eq("bab_id", effectiveBabId);
    }

    // Filter tipe soal sesuai jenis sesi
    if (jenis === "quiz" || jenis === "kuis") {
      // Quiz fokus pada soal objektif (PG & Isian Singkat)
      soalQuery = soalQuery.in("tipe_soal", ["pilihan_ganda", "isian_singkat"]);
    }

    const { data: rawSoalList, error: soalError } = await soalQuery;

    if (soalError) {
      return NextResponse.json(
        { error: "Gagal mengambil bank soal: " + soalError.message },
        { status: 500 }
      );
    }

    // 4. Bersihkan dan format payload soal agar kunci jawaban 100% AMAN dari DevTools
    const cleanQuestions = (rawSoalList || []).map((q: any) => {
      let sanitizedOptions = undefined;

      if (q.tipe_soal === "pilihan_ganda" && Array.isArray(q.opsi_soal)) {
        const sorted = [...q.opsi_soal].sort(
          (a, b) => (a.urutan || 0) - (b.urutan || 0)
        );
        sanitizedOptions = sorted.map((opt, idx) => ({
          id: opt.id,
          label: opt.label || String.fromCharCode(65 + idx),
          teksOpsi: opt.teks_opsi,
        }));
      }

      return {
        id: q.id,
        pertanyaan: q.pertanyaan,
        tipeSoal: q.tipe_soal,
        poin: q.poin || 10,
        opsiSoal: sanitizedOptions,
      };
    });

    // 5. Acak soal (Maksimal 10 soal untuk quiz/latihan agar padat & fokus)
    const shuffledQuestions = shuffleArray(cleanQuestions).slice(0, 10);

    return NextResponse.json({
      success: true,
      sesiId: newSesi.id,
      jenis: jenis,
      batasMenit: newSesi.batas_menit,
      soalList: shuffledQuestions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal memulai sesi." },
      { status: 500 }
    );
  }
}
