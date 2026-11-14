import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getExamPackage, saveExamPackage } from "@/lib/exam-questions-store";

export async function GET() {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profil } = await adminSupabase
      .from("profil")
      .select("id, peran, sekolah_id")
      .eq("id", user.id)
      .single();

    if (!profil || profil.peran !== "guru") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let query = adminSupabase
      .from("ujian")
      .select(`
        id,
        judul,
        deskripsi,
        mapel,
        tipe,
        durasi_menit,
        passing_grade,
        waktu_mulai,
        waktu_berakhir,
        status,
        token,
        dibuat_pada,
        kelas:kelas_id ( id, nama_kelas )
      `)
      .order("waktu_mulai", { ascending: false });

    if (profil.sekolah_id) {
      query = query.or(`sekolah_id.eq.${profil.sekolah_id},sekolah_id.eq.a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`);
    }

    const { data: rawExams, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ulangan & ujian hanya seputar Matematika yang ada di class
    const exams = (rawExams || []).filter((e) => {
      const m = (e.mapel || "").toLowerCase();
      const isOther = /ipa|inggris|indonesia|ips|agama|pjok|seni|karakter|literasi/i.test(m);
      return !isOther && (m.includes("matematika") || m === "" || !e.mapel);
    });

    // Ambil statistik pengerjaan untuk setiap ujian
    const examIds = (exams || []).map((e) => e.id);
    const { data: allSessions } = await adminSupabase
      .from("sesi_ujian")
      .select("id, ujian_id, status, nilai_akhir")
      .in("ujian_id", examIds);

    const statsMap = new Map<string, { total: number; selesai: number; sedang: number; avgScore: number }>();

    (allSessions || []).forEach((s) => {
      const cur = statsMap.get(s.ujian_id) || { total: 0, selesai: 0, sedang: 0, avgScore: 0, totalScore: 0 as number };
      cur.total++;
      if (s.status === "selesai") {
        cur.selesai++;
        (cur as any).totalScore += s.nilai_akhir || 0;
      } else if (s.status === "sedang_mengerjakan") {
        cur.sedang++;
      }
      statsMap.set(s.ujian_id, cur);
    });

    const examsWithStats = (exams || []).map((e) => {
      const st = statsMap.get(e.id) || { total: 0, selesai: 0, sedang: 0, totalScore: 0 };
      const avgScore = st.selesai > 0 ? Math.round(((st as any).totalScore || 0) / st.selesai) : 0;

      return {
        ...e,
        nama_kelas: (e.kelas as any)?.nama_kelas || "Semua Kelas 8",
        peserta_total: st.total,
        peserta_selesai: st.selesai,
        peserta_sedang: st.sedang,
        rata_rata_nilai: avgScore,
      };
    });

    return NextResponse.json({ exams: examsWithStats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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

    const { data: profil } = await adminSupabase
      .from("profil")
      .select("id, peran, sekolah_id")
      .eq("id", user.id)
      .single();

    if (!profil || profil.peran !== "guru") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      judul,
      deskripsi,
      tipe = "ulangan",
      token,
      kelasId,
      babId,
      durasiMenit = 60,
      passingGrade = 75,
      waktuMulai,
      waktuBerakhir,
      acakSoal = false,
      acakOpsi = false,
      soalIds = [],
      soalList = [],
    } = body;

    // Ulangan & Ujian sementara dikunci khusus seputar Matematika yang ada di class
    const mapel = "Matematika";

    if (!judul) {
      return NextResponse.json({ error: "Judul ujian wajib diisi" }, { status: 400 });
    }

    const now = new Date();
    const start = waktuMulai ? new Date(waktuMulai) : now;
    const end = waktuBerakhir ? new Date(waktuBerakhir) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    const defaultToken = `${mapel.substring(0, 3).toUpperCase()}-${tipe === "ulangan" ? "ULG" : "PTS"}${Math.floor(10 + Math.random() * 90)}`;

    // 1. Insert ke tabel ujian
    const { data: newUjian, error: insertErr } = await adminSupabase
      .from("ujian")
      .insert({
        sekolah_id: profil.sekolah_id || "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        guru_id: user.id,
        kelas_id: kelasId || null,
        bab_id: babId || null,
        mapel,
        tipe,
        token: (token || defaultToken).trim().toUpperCase(),
        judul,
        deskripsi: deskripsi || "",
        durasi_menit: Number(durasiMenit),
        passing_grade: Number(passingGrade),
        waktu_mulai: start.toISOString(),
        waktu_berakhir: end.toISOString(),
        acak_soal: Boolean(acakSoal),
        acak_opsi: Boolean(acakOpsi),
        status: "dipublikasi",
      })
      .select()
      .single();

    if (insertErr || !newUjian) {
      return NextResponse.json({ error: "Gagal membuat ujian: " + insertErr?.message }, { status: 500 });
    }

    // 2. Hubungkan atau simpan soal ke tabel ujian_soal
    if (soalList && Array.isArray(soalList) && soalList.length > 0) {
      for (let idx = 0; idx < soalList.length; idx++) {
        const item = soalList[idx];
        let targetSoalId = item.id;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetSoalId || "");

        if (!isUuid && item.pertanyaan) {
          const tipeSoal = item.tipeSoal || (item.opsi && item.opsi.length > 0 ? "pilihan_ganda" : "esai");
          const kunci = item.kunciJawaban || (tipeSoal === "pilihan_ganda" ? (item.opsi?.find((o: any) => o.benar)?.teks || "") : "");

          const { data: insertedSoal } = await adminSupabase
            .from("soal")
            .insert({
              bab_id: babId || null,
              pertanyaan: item.pertanyaan,
              tipe_soal: tipeSoal,
              tingkat_soal: "sedang",
              sumber_konten: "guru_dashboard",
              status_soal: "dipublikasi",
              kunci_jawaban: kunci,
              pembahasan: item.pembahasan || "",
              pembuat_id: user.id,
            })
            .select("id")
            .single();

          if (insertedSoal?.id) {
            targetSoalId = insertedSoal.id;
            if (tipeSoal === "pilihan_ganda" && Array.isArray(item.opsi)) {
              const opsiPayload = item.opsi.map((op: any, oi: number) => ({
                soal_id: insertedSoal.id,
                teks_opsi: op.teks || op.teksOpsi || "",
                benar: Boolean(op.benar),
                urutan: oi + 1,
                label: String.fromCharCode(65 + oi),
                alasan_salah: op.alasanSalah || op.alasan_salah || null,
              }));
              await adminSupabase.from("opsi_soal").insert(opsiPayload);
            }
          }
        }

        if (targetSoalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetSoalId)) {
          await adminSupabase.from("ujian_soal").insert({
            ujian_id: newUjian.id,
            soal_id: targetSoalId,
            urutan: idx + 1,
            poin_bobot: 10,
          });
        }
      }
    } else if (soalIds && soalIds.length > 0) {
      const ujianSoalPayload = soalIds.map((soalId: string, idx: number) => ({
        ujian_id: newUjian.id,
        soal_id: soalId,
        urutan: idx + 1,
        poin_bobot: 10,
      }));

      await adminSupabase.from("ujian_soal").insert(ujianSoalPayload);
    }

    // 3. Catat audit log
    await adminSupabase.from("audit_log").insert({
      actor_id: user.id,
      role: profil.peran,
      aksi: "EXAM_PUBLISHED",
      target_resource: `ujian:${newUjian.id}`,
      detail: { judul, mapel, durasi_menit: durasiMenit },
    });

    return NextResponse.json({
      success: true,
      ujian: newUjian,
      message: "Ujian berhasil dibuat dan dipublikasikan!",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profil } = await adminSupabase
      .from("profil")
      .select("id, peran")
      .eq("id", user.id)
      .maybeSingle();

    if (!profil || !["guru", "admin_sekolah", "superadmin"].includes(profil.peran)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { ujianId, status, token, durasiMenit, passingGrade, waktuMulai, waktuBerakhir } = body;

    if (!ujianId) {
      return NextResponse.json({ error: "ujianId wajib diisi" }, { status: 400 });
    }

    const updatePayload: any = {};
    if (status) {
      updatePayload.status = status;
      // Jika diaktifkan (dipublikasi) dan waktu berakhir belum diatur, berikan waktu aktif 30 hari ke depan
      if (status === "dipublikasi" && !waktuBerakhir) {
        const now = new Date();
        updatePayload.waktu_berakhir = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    }
    if (token !== undefined) {
      updatePayload.token = String(token).trim().toUpperCase();
    }
    if (durasiMenit !== undefined) {
      updatePayload.durasi_menit = Number(durasiMenit);
    }
    if (passingGrade !== undefined) {
      updatePayload.passing_grade = Number(passingGrade);
    }
    if (waktuMulai) updatePayload.waktu_mulai = new Date(waktuMulai).toISOString();
    if (waktuBerakhir) updatePayload.waktu_berakhir = new Date(waktuBerakhir).toISOString();

    // 1. Simpan ke local exam package store (data/ujian_store.json) jika ada
    const localPkg = getExamPackage(ujianId);
    let localUpdated = false;
    if (localPkg) {
      if (status) localPkg.status = status;
      if (token !== undefined) localPkg.token = String(token).trim().toUpperCase();
      if (durasiMenit !== undefined) localPkg.durasi_menit = Number(durasiMenit);
      if (passingGrade !== undefined) localPkg.passing_grade = Number(passingGrade);
      saveExamPackage(localPkg);
      localUpdated = true;
    }

    // 2. Simpan ke database Supabase jika ada recordnya
    let supabaseData: any = null;
    try {
      const { data, error } = await adminSupabase
        .from("ujian")
        .update(updatePayload)
        .eq("id", ujianId)
        .select(`
          id,
          judul,
          deskripsi,
          mapel,
          tipe,
          durasi_menit,
          passing_grade,
          waktu_mulai,
          waktu_berakhir,
          status,
          token
        `)
        .maybeSingle();

      if (error && !localUpdated) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      supabaseData = data;
    } catch (dbErr: any) {
      if (!localUpdated) {
        return NextResponse.json({ error: dbErr?.message || "Gagal memperbarui ujian di database" }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      ujian: supabaseData || localPkg,
      status: status || (supabaseData?.status || localPkg?.status),
      message: status 
        ? `Status ujian berhasil diubah menjadi ${status === "dipublikasi" ? "Dibuka (Aktif)" : status === "draft" ? "Draf" : "Ditutup"}!`
        : "Data ujian berhasil diperbarui!",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
