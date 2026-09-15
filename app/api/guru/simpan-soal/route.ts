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

    const body = await req.json();
    const {
      babId,
      materiId,
      pertanyaan,
      tipeSoal,
      tingkatSoal,
      sumberKonten = "manual",
      statusSoal = "dipublikasi",
      kunciJawaban,
      pembahasan,
      opsiSoal = [],
    } = body;

    if (!babId || !pertanyaan) {
      return NextResponse.json(
        { error: "Bab dan pertanyaan wajib diisi." },
        { status: 400 }
      );
    }

    // Insert to `soal` table via adminDb
    const soalPayload: Record<string, any> = {
      bab_id: babId,
      pertanyaan,
      tipe_soal: tipeSoal || "pilihan_ganda",
      tingkat_soal: tingkatSoal || "sedang",
      sumber_konten: sumberKonten,
      status_soal: statusSoal || (sumberKonten === "ai_generated" ? "draft" : "dipublikasi"),
      kunci_jawaban: kunciJawaban || "",
      pembahasan: pembahasan || "",
      pembuat_id: user.id,
    };

    if (materiId) {
      soalPayload.materi_id = materiId;
    }

    const { data: insertedSoal, error: insertError } = await adminDb
      .from("soal")
      .insert(soalPayload)
      .select("id")
      .single();

    if (insertError || !insertedSoal) {
      return NextResponse.json(
        { error: "Gagal menyimpan soal: " + insertError?.message },
        { status: 500 }
      );
    }

    // Insert options if Pilihan Ganda
    if ((tipeSoal === "pilihan_ganda" || !tipeSoal) && opsiSoal.length > 0) {
      const opsiPayload = opsiSoal.map((o: any, idx: number) => ({
        soal_id: insertedSoal.id,
        teks_opsi: o.teksOpsi || o.teks || "",
        benar: Boolean(o.benar),
        urutan: idx + 1,
      }));

      const { error: opsiError } = await adminDb
        .from("opsi_soal")
        .insert(opsiPayload);

      if (opsiError) {
        console.error("Error inserting options:", opsiError);
      }
    }

    // Ambil info bab untuk notifikasi
    const { data: babData } = await adminDb
      .from("bab")
      .select("judul, sekolah_id")
      .eq("id", babId)
      .single();

    // Jika soal langsung dipublikasikan, kirim notifikasi ke siswa sekolah tersebut
    if (statusSoal === "dipublikasi") {
      try {
        let studentsQuery = adminDb
          .from("profil")
          .select("id")
          .eq("peran", "siswa");

        if (babData?.sekolah_id) {
          studentsQuery = studentsQuery.eq("sekolah_id", babData.sekolah_id);
        }

        const { data: students } = await studentsQuery;

        if (students && students.length > 0) {
          const notifs = students.map((s: any) => ({
            user_id: s.id,
            judul: "Soal Latihan Baru Tersedia! 📝",
            pesan: `Guru telah menerbitkan soal latihan baru pada "${babData?.judul || "Materi Matematika"}". Coba kerjakan sekarang!`,
            tipe: "info",
            dibaca: false,
          }));
          await adminDb.from("notifikasi").insert(notifs);
        }
      } catch (notifErr) {
        console.warn("[SOAL NOTIF ERROR]", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      soalId: insertedSoal.id,
      statusSoal: soalPayload.status_soal,
      message: "Soal berhasil disimpan dan dipublikasikan ke siswa!",
    });
  } catch (error: any) {
    console.error("Error saving question:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menyimpan soal." },
      { status: 500 }
    );
  }
}
