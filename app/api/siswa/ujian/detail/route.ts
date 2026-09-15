import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ujianId = searchParams.get("ujianId");

    if (!ujianId) {
      return NextResponse.json({ error: "ujianId is required" }, { status: 400 });
    }

    // 1. Ambil detail Ujian
    const { data: ujian, error: ujianErr } = await adminSupabase
      .from("ujian")
      .select(`
        id,
        judul,
        deskripsi,
        mapel,
        durasi_menit,
        passing_grade,
        waktu_mulai,
        waktu_berakhir,
        status,
        acak_soal,
        acak_opsi,
        bab_id
      `)
      .eq("id", ujianId)
      .single();

    if (ujianErr || !ujian) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    // 2. Ambil soal-soal ujian
    // Coba dari ujian_soal
    const { data: ujianSoalList } = await adminSupabase
      .from("ujian_soal")
      .select(`
        id,
        urutan,
        poin_bobot,
        soal:soal_id (
          id,
          pertanyaan,
          tipe_soal,
          tingkat_soal,
          opsi_soal (
            id,
            teks_opsi,
            urutan
          )
        )
      `)
      .eq("ujian_id", ujianId)
      .order("urutan", { ascending: true });

    let formattedQuestions: Array<{
      id: string;
      urutan: number;
      pertanyaan: string;
      tipe_soal: string;
      poin_bobot: number;
      opsi: Array<{ id: string; teks_opsi: string; urutan: number }>;
    }> = [];

    if (ujianSoalList && ujianSoalList.length > 0) {
      formattedQuestions = ujianSoalList.map((item: any, idx: number) => {
        const s = item.soal;
        const rawOpsi = Array.isArray(s?.opsi_soal) ? s.opsi_soal : [];
        const sortedOpsi = rawOpsi.sort((a: any, b: any) => (a.urutan || 0) - (b.urutan || 0));

        return {
          id: s?.id || item.id,
          urutan: item.urutan || idx + 1,
          pertanyaan: s?.pertanyaan || "Pertanyaan ujian",
          tipe_soal: s?.tipe_soal || "pilihan_ganda",
          poin_bobot: item.poin_bobot || 10,
          opsi: sortedOpsi.map((o: any) => ({
            id: o.id,
            teks_opsi: o.teks_opsi,
            urutan: o.urutan,
          })),
        };
      });
    } else {
      // Fallback: Jika ujian belum memiliki relasi ujian_soal, ambil dari soal yang relevan
      let query = adminSupabase
        .from("soal")
        .select(`
          id,
          pertanyaan,
          tipe_soal,
          opsi_soal (
            id,
            teks_opsi,
            urutan
          )
        `);

      if (ujian.bab_id) {
        query = query.eq("bab_id", ujian.bab_id);
      }

      const { data: fallbackQuestions } = await query.limit(10);

      if (fallbackQuestions && fallbackQuestions.length > 0) {
        formattedQuestions = fallbackQuestions.map((q: any, idx: number) => {
          const rawOpsi = Array.isArray(q.opsi_soal) ? q.opsi_soal : [];
          return {
            id: q.id,
            urutan: idx + 1,
            pertanyaan: q.pertanyaan,
            tipe_soal: q.tipe_soal || "pilihan_ganda",
            poin_bobot: 10,
            opsi: rawOpsi.map((o: any) => ({
              id: o.id,
              teks_opsi: o.teks_opsi,
              urutan: o.urutan,
            })),
          };
        });
      }
    }

    // 3. Ambil status sesi siswa saat ini jika ada
    const { data: sesiSiswa } = await adminSupabase
      .from("sesi_ujian")
      .select("*")
      .eq("ujian_id", ujianId)
      .eq("siswa_id", user.id)
      .maybeSingle();

    // 4. Ambil jawaban tersimpan (draft) jika ada sesi
    let savedAnswers: Record<string, { opsiId?: string; jawabanEsai?: string }> = {};

    if (sesiSiswa) {
      const { data: jawabanList } = await adminSupabase
        .from("jawaban_ujian")
        .select("soal_id, opsi_dipilih_id, jawaban_esai")
        .eq("sesi_ujian_id", sesiSiswa.id);

      if (jawabanList) {
        jawabanList.forEach((j) => {
          savedAnswers[j.soal_id] = {
            opsiId: j.opsi_dipilih_id || undefined,
            jawabanEsai: j.jawaban_esai || undefined,
          };
        });
      }
    }

    const now = new Date();
    let remainingSeconds = (ujian.durasi_menit || 60) * 60;
    let isExpired = false;

    if (sesiSiswa?.server_end_time) {
      const endTime = new Date(sesiSiswa.server_end_time);
      const diffMs = endTime.getTime() - now.getTime();
      remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
      if (diffMs <= 0 && sesiSiswa.status === "sedang_mengerjakan") {
        isExpired = true;
      }
    }

    return NextResponse.json({
      ujian,
      questions: formattedQuestions,
      session: sesiSiswa || null,
      savedAnswers,
      remainingSeconds,
      isExpired,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
