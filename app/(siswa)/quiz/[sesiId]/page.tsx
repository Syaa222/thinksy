import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import QuizAssessmentClient, { CleanQuizQuestion } from "@/components/sesi/QuizAssessmentClient";
import { generateChapterQuestions, shuffleOptionsForStudent, resolveSpecificHint } from "@/lib/curriculum-quiz-engine";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ sesiId: string }>;
  searchParams: Promise<{ mode?: "latihan" | "inclass"; babId?: string }>;
}) {
  const { sesiId } = await params;
  const { mode, babId } = await searchParams;
  const supabase = await createClient();
  const adminDb = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/masuk?redirect=/quiz/${sesiId}`);
  }

  const { data: profil } = await supabase
    .from("profil")
    .select("nama_lengkap, sekolah_id")
    .eq("id", user.id)
    .maybeSingle();

  const isValidUUID = (str?: string) =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  const IPA_BABS: Record<string, { id: string; judul: string; mapel: string; kelas: number }> = {
    "ipa-bab-1": {
      id: "ipa-bab-1",
      judul: "Bab 1: Pengenalan Sel & Mikroskop",
      mapel: "IPA",
      kelas: 8,
    },
    "ipa-bab-2": {
      id: "ipa-bab-2",
      judul: "Bab 2: Struktur dan Fungsi Tubuh Manusia",
      mapel: "IPA",
      kelas: 8,
    },
    "ipa-bab-3": {
      id: "ipa-bab-3",
      judul: "Bab 3: Usaha, Energi, dan Pesawat Sederhana",
      mapel: "IPA",
      kelas: 8,
    },
    "ipa-bab-4": {
      id: "ipa-bab-4",
      judul: "Bab 4: Getaran, Gelombang, dan Cahaya",
      mapel: "IPA",
      kelas: 8,
    },
    "ipa-bab-5": {
      id: "ipa-bab-5",
      judul: "Bab 5: Unsur, Senyawa, dan Struktur Bumi",
      mapel: "IPA",
      kelas: 8,
    },
  };

  const isIpaTarget =
    sesiId.startsWith("ipa-") ||
    (babId ? babId.startsWith("ipa-") : false) ||
    Boolean(IPA_BABS[sesiId]) ||
    Boolean(babId && IPA_BABS[babId]);

  const targetIpaKey = isIpaTarget
    ? (sesiId.startsWith("ipa-") ? sesiId : (babId || "ipa-bab-1"))
    : null;

  // 1. Fetch Sesi record & Check if already finished
  let sesiRow: any = null;
  if (isValidUUID(sesiId)) {
    const { data: sRow } = await adminDb
      .from("sesi")
      .select("id, siswa_id, bab_id, status_sesi, batas_menit, mulai_pada")
      .eq("id", sesiId)
      .maybeSingle();
    sesiRow = sRow;

    if (sesiRow?.status_sesi === "selesai") {
      redirect(`/hasil/${sesiId}`);
    }
  }

  // 2. Resolve effective babId
  let effectiveBabId = targetIpaKey || babId || sesiRow?.bab_id;
  if (!effectiveBabId && isValidUUID(sesiId)) {
    // SesiId mungkin merupakan babId dari link langsung bab
    const { data: checkBab } = await adminDb
      .from("bab")
      .select("id")
      .eq("id", sesiId)
      .maybeSingle();
    if (checkBab?.id) {
      effectiveBabId = checkBab.id;
    }
  }

  if (!effectiveBabId && !isIpaTarget) {
    const { data: firstBab } = await adminDb
      .from("bab")
      .select("id")
      .order("urutan", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (firstBab?.id) {
      effectiveBabId = firstBab.id;
    }
  }

  // Jika sesiRow belum ada di database, cari sesi aktif milik siswa atau buat baru
  if (!sesiRow && user) {
    if (isIpaTarget && targetIpaKey) {
      const { data: newSesi } = await adminDb
        .from("sesi")
        .insert({
          siswa_id: user.id,
          bab_id: null,
          sekolah_id: profil?.sekolah_id || null,
          tipe_sesi: "kuis",
          status_sesi: "aktif",
          batas_menit: 30,
          mulai_pada: new Date().toISOString(),
        })
        .select("id, siswa_id, bab_id, status_sesi, batas_menit, mulai_pada")
        .single();

      if (newSesi?.id) {
        redirect(`/quiz/${newSesi.id}?mode=${mode || "inclass"}&babId=${targetIpaKey}`);
      }
    } else if (effectiveBabId) {
      const { data: existingActive } = await adminDb
        .from("sesi")
        .select("id, siswa_id, bab_id, status_sesi, batas_menit, mulai_pada")
        .eq("siswa_id", user.id)
        .eq("bab_id", effectiveBabId)
        .eq("status_sesi", "aktif")
        .order("mulai_pada", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingActive?.id) {
        redirect(`/quiz/${existingActive.id}?mode=${mode || "inclass"}&babId=${effectiveBabId}`);
      }

      const { data: newSesi } = await adminDb
        .from("sesi")
        .insert({
          siswa_id: user.id,
          bab_id: effectiveBabId,
          sekolah_id: profil?.sekolah_id || null,
          tipe_sesi: "kuis",
          status_sesi: "aktif",
          batas_menit: 30,
          mulai_pada: new Date().toISOString(),
        })
        .select("id, siswa_id, bab_id, status_sesi, batas_menit, mulai_pada")
        .single();

      if (newSesi?.id) {
        redirect(`/quiz/${newSesi.id}?mode=${mode || "inclass"}&babId=${effectiveBabId}`);
      }
    }
  }

  // 3. Fetch Bab Info
  let babData: { judul: string; mapel?: string; kelas?: number } | null = null;
  if (isIpaTarget && targetIpaKey) {
    babData = IPA_BABS[targetIpaKey] || IPA_BABS["ipa-bab-1"];
  } else if (effectiveBabId && isValidUUID(effectiveBabId)) {
    const { data: bData } = await adminDb
      .from("bab")
      .select("id, judul, mapel, kelas")
      .eq("id", effectiveBabId)
      .maybeSingle();
    babData = bData;
  }

  // 4. Query & Sync Real Questions in Database
  const { data: existingDbSoal } = await adminDb
    .from("soal")
    .select(`
      id,
      pertanyaan,
      tipe_soal,
      pembahasan,
      kunci_jawaban,
      opsi_soal (
        id,
        teks_opsi,
        urutan,
        benar,
        alasan_salah
      )
    `)
    .eq("bab_id", effectiveBabId)
    .order("dibuat_pada", { ascending: true });

  const isBogusQuestion = (text: string) => {
    const low = (text || "").toLowerCase();
    return (
      low.includes("definisi dan konsep dasar yang paling tepat") ||
      low.includes("prinsip fundamental") ||
      low.includes("pernyataan analisis yang paling tepat") ||
      low.includes("hafalan rumus tanpa kaitan") ||
      low.includes("metode spekulatif") ||
      low.includes("laboratorium semata") ||
      low.includes("sebanyak $n$ faktor")
    );
  };

  // Bersihkan pertanyaan lama yang tidak sesuai kurikulum nyata
  const bogusIds = (existingDbSoal || [])
    .filter((s) => isBogusQuestion(s.pertanyaan))
    .map((s) => s.id);

  if (bogusIds.length > 0) {
    try {
      await adminDb.from("soal").delete().in("id", bogusIds);
    } catch {}
  }

  const validDbSoal = (existingDbSoal || []).filter(
    (s) => !isBogusQuestion(s.pertanyaan)
  );

  const curriculum15 = generateChapterQuestions(
    babData?.judul || "Bab Pembelajaran",
    babData?.mapel || "Matematika",
    babData?.kelas || 8
  );

  const dbSoalList: any[] = [...validDbSoal];

  // Sinkronisasi otomatis agar tepat 15 butir soal tersimpan di tabel `soal` dan `opsi_soal`
  if (dbSoalList.length < 15 && effectiveBabId && isValidUUID(effectiveBabId)) {
    for (let i = 0; i < curriculum15.length; i++) {
      const cq = curriculum15[i];
      const alreadyExists = dbSoalList.some(
        (s) =>
          s.pertanyaan.trim() === cq.pertanyaan.trim() ||
          s.pertanyaan.replace(/^\d+\.\s*/, "").trim() ===
            cq.pertanyaan.replace(/^\d+\.\s*/, "").trim()
      );
      if (alreadyExists) continue;

      const newSoalId = crypto.randomUUID();
      const { error: insSoalErr } = await adminDb.from("soal").insert({
        id: newSoalId,
        bab_id: effectiveBabId,
        pertanyaan: cq.pertanyaan,
        tipe_soal: cq.tipeSoal,
        tingkat_soal: "sedang",
        sumber_konten: "manual",
        status_soal: "dipublikasi",
        kunci_jawaban: cq.kunciJawaban,
        pembahasan: cq.pembahasan,
      });

      if (!insSoalErr) {
        let insertedOpsi: any[] = [];
        if (cq.opsiSoal && cq.opsiSoal.length > 0) {
          const opsiRows = cq.opsiSoal.map((o, optIdx) => ({
            id: crypto.randomUUID(),
            soal_id: newSoalId,
            teks_opsi: o.teksOpsi,
            benar: Boolean(o.benar),
            urutan: optIdx + 1,
            label: String.fromCharCode(65 + optIdx),
            alasan_salah: (o as any).alasanSalah || null,
          }));

          const { data: newOpts } = await adminDb
            .from("opsi_soal")
            .insert(opsiRows)
            .select("id, teks_opsi, urutan, benar, alasan_salah");
          insertedOpsi = newOpts || opsiRows;
        }

        dbSoalList.push({
          id: newSoalId,
          pertanyaan: cq.pertanyaan,
          tipe_soal: cq.tipeSoal,
          pembahasan: cq.pembahasan,
          kunci_jawaban: cq.kunciJawaban,
          opsi_soal: insertedOpsi,
        });
      }
    }
  }

  // Seed unik per akun siswa untuk mengacak opsi A, B, C, D (Anti-Contek)
  const actualSesiId = sesiRow?.id || sesiId;
  const studentSeed = user?.id || actualSesiId || "siswa-anonim";

  // Pastikan tepat 15 butir soal: 10 PG, 3 Jawaban Singkat, 2 Esai (Semua Mapel)
  const formattedSoalList: CleanQuizQuestion[] = curriculum15.map((cq) => {
    const dbItem = dbSoalList.find(
      (s) =>
        s.pertanyaan.trim() === cq.pertanyaan.trim() ||
        s.pertanyaan.replace(/^\d+\.\s*/, "").trim() ===
          cq.pertanyaan.replace(/^\d+\.\s*/, "").trim()
    );
    let resolvedItem: CleanQuizQuestion;

    if (dbItem) {
      let resolvedOpsi =
        Array.isArray(dbItem.opsi_soal) && dbItem.opsi_soal.length > 0
          ? [...dbItem.opsi_soal]
              .sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
              .map((o: any) => ({
                id: o.id,
                teksOpsi: o.teks_opsi,
                benar: Boolean(o.benar),
                alasanSalah: o.alasan_salah || undefined,
              }))
          : cq.opsiSoal;

      // Pastikan ada opsi yang berstatus benar jika tipe soal adalah pilihan ganda
      if (resolvedOpsi && resolvedOpsi.length > 0) {
        const hasCorrect = resolvedOpsi.some((o: any) => o.benar);
        if (!hasCorrect) {
          const keyLower = (dbItem.kunci_jawaban || "").trim().toLowerCase();
          let matched = false;
          resolvedOpsi = resolvedOpsi.map((o: any, oIdx: number) => {
            const letter = String.fromCharCode(97 + oIdx); // 'a', 'b', 'c', 'd'
            if (
              !matched &&
              (keyLower === letter ||
                o.teksOpsi?.toLowerCase().includes(keyLower) ||
                keyLower === o.id?.toLowerCase())
            ) {
              matched = true;
              return { ...o, benar: true };
            }
            return o;
          });
          if (!matched && resolvedOpsi.length > 0) {
            resolvedOpsi[0] = { ...resolvedOpsi[0], benar: true };
          }
        }
      }

      const correctOpt = resolvedOpsi?.find((o: any) => o.benar);
      const effectiveKunci =
        dbItem.kunci_jawaban || correctOpt?.teksOpsi || cq.kunciJawaban || "";
      const effectivePembahasan =
        dbItem.pembahasan ||
        cq.pembahasan ||
        (correctOpt
          ? `Jawaban yang tepat adalah "${correctOpt.teksOpsi}" sesuai kaidah materi ${
              babData?.judul || "pembelajaran"
            }.`
          : "Periksa kembali konsep materi terkait.");

      const effectiveHint = resolveSpecificHint(
        dbItem.pertanyaan,
        effectiveKunci,
        effectivePembahasan,
        cq.hintSokratik
      );

      resolvedItem = {
        id: dbItem.id,
        pertanyaan: dbItem.pertanyaan,
        tipeSoal: dbItem.tipe_soal as "pilihan_ganda" | "isian_singkat" | "esai",
        opsiSoal: resolvedOpsi,
        hintSokratik: effectiveHint,
        kunciJawaban: effectiveKunci,
        pembahasan: effectivePembahasan,
      };
    } else {
      const effectiveHint = resolveSpecificHint(
        cq.pertanyaan,
        cq.kunciJawaban,
        cq.pembahasan,
        cq.hintSokratik
      );
      resolvedItem = {
        ...cq,
        hintSokratik: effectiveHint,
      };
    }

    // ACAK PILIHAN GANDA (A, B, C, D) SECARA UNIK PER AKUN SISWA
    // Setiap akun siswa mendapatkan urutan opsi acak berbeda agar tidak terjadi contek-mencontek
    if (resolvedItem.tipeSoal === "pilihan_ganda" && resolvedItem.opsiSoal) {
      resolvedItem.opsiSoal = shuffleOptionsForStudent(
        resolvedItem.opsiSoal,
        studentSeed,
        resolvedItem.id
      );
    }

    return resolvedItem;
  });

  // 5. Query Existing Saved Answers for State Persistence across Refresh
  const initialAnswers: Record<string, string> = {};
  if (isValidUUID(actualSesiId)) {
    const { data: existingJawaban } = await adminDb
      .from("jawaban")
      .select("soal_id, opsi_dipilih_id, jawaban_teks")
      .eq("sesi_id", actualSesiId);

    if (existingJawaban) {
      existingJawaban.forEach((j: any) => {
        initialAnswers[j.soal_id] = j.opsi_dipilih_id || j.jawaban_teks || "";
      });
    }
  }

  const sessionTitle = babData
    ? `EVALUASI: ${babData.judul}`
    : mode === "inclass"
    ? "EVALUASI BAB - ASESMEN TOPIK IN-CLASS"
    : "UJIAN FORMATIF TOPIK PEMBELAJARAN";

  return (
    <QuizAssessmentClient
      sesiId={actualSesiId}
      babId={effectiveBabId}
      judulSesi={sessionTitle}
      mapel={babData?.mapel || "Matematika"}
      batasMenit={Number(sesiRow?.batas_menit) || 30}
      mulaiPada={sesiRow?.mulai_pada || undefined}
      soalList={formattedSoalList}
      namaSiswa={profil?.nama_lengkap ?? undefined}
      initialAnswers={initialAnswers}
    />
  );
}
