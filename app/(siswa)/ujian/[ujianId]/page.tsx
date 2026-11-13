import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import ExamRoomClient from "./ExamRoomClient";
import { shuffleOptionsForStudent } from "@/lib/curriculum-quiz-engine";
import {
  getExamPackage,
  getExamQuestions,
  ExamQuestion,
  ExamQuestionOption,
} from "@/lib/exam-questions-store";

export default async function DetailUjianPage({
  params,
}: {
  params: Promise<{ ujianId: string }>;
}) {
  const { ujianId } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const SIMULASI_ALIAS_MAP: Record<string, string> = {
    "sim-literasi": "e7eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
    "sim-numerasi": "e8eebc99-9c0b-4ef8-bb6d-6bb9bd380a88",
    "sim-karakter": "e9eebc99-9c0b-4ef8-bb6d-6bb9bd380a99",
  };
  const effectiveUjianId = SIMULASI_ALIAS_MAP[ujianId] || ujianId;

  // 1. Ambil detail Ujian
  let { data: ujian } = await adminSupabase
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
      bab_id
    `)
    .eq("id", effectiveUjianId)
    .maybeSingle();

  if (!ujian && (ujianId.startsWith("ulangan-bab-") || ujianId.length > 20)) {
    const babId = ujianId.startsWith("ulangan-bab-") ? ujianId.replace("ulangan-bab-", "") : ujianId;
    const { data: ujianByBab } = await adminSupabase
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
        bab_id
      `)
      .eq("bab_id", babId)
      .maybeSingle();

    if (ujianByBab) {
      ujian = ujianByBab;
    }
  }

  // Fallback ke central exam store (ujian_store.json) jika ujian belum tercatat di database Supabase
  const localPackage = getExamPackage(effectiveUjianId);
  if (!ujian && localPackage) {
    ujian = {
      id: localPackage.id,
      judul: localPackage.judul,
      deskripsi: localPackage.deskripsi,
      mapel: localPackage.mapel || "Matematika",
      tipe: localPackage.tipe || "ulangan",
      durasi_menit: localPackage.durasi_menit || 60,
      passing_grade: localPackage.passing_grade || 75,
      waktu_mulai: null,
      waktu_berakhir: null,
      status: localPackage.status || "dipublikasi",
      bab_id: localPackage.bab_id || null,
    };

    // Sinkronisasikan secara otomatis ke Supabase agar foreign key dan sesi_ujian aman
    try {
      await adminSupabase.from("ujian").upsert({
        id: localPackage.id,
        judul: localPackage.judul,
        deskripsi: localPackage.deskripsi || "",
        mapel: localPackage.mapel || "Matematika",
        tipe: localPackage.tipe || "ulangan",
        durasi_menit: localPackage.durasi_menit || 60,
        passing_grade: localPackage.passing_grade || 75,
        status: localPackage.status || "dipublikasi",
        token: localPackage.token || "MTK-SEM1",
      });
    } catch {}
  } else if (ujian && localPackage) {
    // Selaraskan judul, status, durasi terbaru dari local package jika baru diedit guru
    ujian = {
      ...ujian,
      judul: localPackage.judul || ujian.judul,
      deskripsi: localPackage.deskripsi || ujian.deskripsi,
      durasi_menit: localPackage.durasi_menit || ujian.durasi_menit,
      passing_grade: localPackage.passing_grade || ujian.passing_grade,
      status: localPackage.status || ujian.status,
    };
  }

  if (!ujian) {
    notFound();
  }

  // Security Check: Verify user role and exam status
  const { data: userProfil } = await adminSupabase
    .from("profil")
    .select("peran")
    .eq("id", user?.id || "")
    .maybeSingle();

  const isStaff = ["guru", "admin_sekolah", "superadmin"].includes(userProfil?.peran || "");

  // Periksa apakah siswa dihapus/dikeluarkan dari daftar peserta ujian oleh guru
  if (ujian.deskripsi && user?.id && !isStaff) {
    const match = ujian.deskripsi.match(/<!-- EXAM_ROSTER:(.*?) -->/);
    let isExcluded = false;
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed.excluded) && parsed.excluded.includes(user.id)) {
          isExcluded = true;
        }
      } catch {}
    }

    if (isExcluded) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
              🚫
            </div>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-black uppercase tracking-wider">
                Tidak Terdaftar
              </span>
              <h2 className="text-xl font-black text-[#0F172A]">
                Akses Ujian Tidak Tersedia
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nama Anda saat ini tidak terdaftar dalam peserta ujian <strong>&quot;{ujian.judul}&quot;</strong>. Silakan hubungi guru pengampu untuk mendapatkan undangan kembali.
              </p>
            </div>
            <Link
              href="/ujian"
              className="block w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
            >
              ← Kembali ke Ruang Ujian
            </Link>
          </div>
        </div>
      );
    }
  }

  const now = new Date();
  const startTime = ujian.waktu_mulai ? new Date(ujian.waktu_mulai) : new Date(0);
  const endTime = ujian.waktu_berakhir ? new Date(ujian.waktu_berakhir) : new Date(Date.now() + 86400000);
  // Status dipublikasi yang disetel oleh guru adalah penentu utama keterbukaan ujian, simulasi selalu terbuka
  const isAvailable = ujian.status === "dipublikasi" || ujian.tipe === "simulasi";

  // Block unauthorized direct URL access if exam is not active
  if (!isAvailable && !isStaff) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
            🔒
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-black uppercase tracking-wider">
              Akses Dibatasi
            </span>
            <h2 className="text-xl font-black text-[#0F172A]">
              Ujian Belum Tersedia
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ujian/Ulangan <strong>&quot;{ujian.judul}&quot;</strong> belum dibuka oleh Guru pengampu atau waktu pengerjaan telah berakhir. Akses langsung melalui URL dinonaktifkan demi integritas ujian.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Status Server:</span>
              <span className="font-bold text-slate-800 uppercase">{ujian.status === 'dipublikasi' ? 'Menunggu Jadwal' : 'Ditutup'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Mulai:</span>
              <span className="font-bold text-slate-800">{startTime.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} WIB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Selesai:</span>
              <span className="font-bold text-slate-800">{endTime.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} WIB</span>
            </div>
          </div>

          <Link
            href="/"
            className="block w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }
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
        pembahasan,
        kunci_jawaban,
        opsi_soal (
          id,
          teks_opsi,
          benar,
          urutan
        )
      )
    `)
    .eq("ujian_id", effectiveUjianId)
    .order("urutan", { ascending: true });

  let formattedQuestions: Array<{
    id: string;
    urutan: number;
    pertanyaan: string;
    tipe_soal: string;
    poin_bobot: number;
    pembahasan?: string | null;
    kunci_jawaban?: string | null;
    opsi: Array<{ id: string; teks_opsi: string; urutan: number; benar?: boolean }>;
  }> = [];

  if (ujianSoalList && ujianSoalList.length > 0) {
    formattedQuestions = ujianSoalList.map((item: any, idx: number) => {
      const s = item.soal;
      const rawOpsi = Array.isArray(s?.opsi_soal) ? s.opsi_soal : [];
      const sortedOpsi = rawOpsi.sort((a: any, b: any) => (a.urutan || 0) - (b.urutan || 0));
      const hasBenar = sortedOpsi.some((o: any) => o.benar);

      return {
        id: s?.id || item.id,
        urutan: item.urutan || idx + 1,
        pertanyaan: s?.pertanyaan || "Pertanyaan ujian",
        tipe_soal: s?.tipe_soal || "pilihan_ganda",
        poin_bobot: item.poin_bobot || 5,
        pembahasan: s?.pembahasan || null,
        kunci_jawaban: s?.kunci_jawaban || null,
        opsi: sortedOpsi.map((o: any) => ({
          id: o.id,
          teks_opsi: o.teks_opsi,
          urutan: o.urutan,
          benar:
            o.benar === true ||
            (!hasBenar &&
              Boolean(s?.kunci_jawaban) &&
              o.teks_opsi?.trim().toLowerCase() === s?.kunci_jawaban?.trim().toLowerCase()),
        })),
      };
    });
  } else {
    // 1. Cek Central Store Ujian Guru terlebih dahulu (ujian_store.json)
    const storeQuestions = getExamQuestions(effectiveUjianId);
    if (storeQuestions && storeQuestions.length > 0) {
      formattedQuestions = storeQuestions.map((q: ExamQuestion, idx: number) => ({
        id: q.id,
        urutan: idx + 1,
        pertanyaan: q.pertanyaan,
        tipe_soal: q.tipeSoal,
        poin_bobot: q.poin || (q.tipeSoal === "pilihan_ganda" ? 5 : 10),
        pembahasan: q.pembahasan || null,
        kunci_jawaban: q.kunciJawaban || null,
        opsi: (q.opsi || []).map((o: ExamQuestionOption, oIdx: number) => ({
          id: o.id || `${q.id}-opt-${oIdx}`,
          teks_opsi: o.teks,
          urutan: oIdx + 1,
          benar: Boolean(o.benar),
        })),
      }));
    } else {
      // 2. Fallback dari tabel soal Supabase
      let query = adminSupabase
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
            benar,
            urutan
          )
        `);

      if (ujian.bab_id) {
        query = query.eq("bab_id", ujian.bab_id);
      }

      const { data: fallbackQuestions } = await query.order("urutan", { ascending: true }).limit(20);

      if (fallbackQuestions && fallbackQuestions.length > 0) {
        formattedQuestions = fallbackQuestions.map((q: any, idx: number) => {
          const rawOpsi = Array.isArray(q.opsi_soal) ? q.opsi_soal : [];
          const sortedOpsi = rawOpsi.sort((a: any, b: any) => (a.urutan || 0) - (b.urutan || 0));
          const hasBenar = sortedOpsi.some((o: any) => o.benar);

          return {
            id: q.id,
            urutan: idx + 1,
            pertanyaan: q.pertanyaan,
            tipe_soal: q.tipe_soal || "pilihan_ganda",
            poin_bobot: 5,
            pembahasan: q.pembahasan || null,
            kunci_jawaban: q.kunci_jawaban || null,
            opsi: sortedOpsi.map((o: any) => ({
              id: o.id,
              teks_opsi: o.teks_opsi,
              urutan: o.urutan,
              benar:
                o.benar === true ||
                (!hasBenar &&
                  Boolean(q.kunci_jawaban) &&
                  o.teks_opsi?.trim().toLowerCase() === q.kunci_jawaban?.trim().toLowerCase()),
            })),
          };
        });
      }
    }
  }

  // Fallback Otomatis: Jika belum ada soal yang di-link ke ujian ini di database,
  // muat langsung 15 butir soal standar kurikulum (10 PG, 3 Isian Singkat, 2 Esai) dari engine Matematika
  if (formattedQuestions.length === 0) {
    const { generateChapterQuestions } = await import("@/lib/curriculum-quiz-engine");
    const generated = generateChapterQuestions(ujian.judul || "Bab 1: Pola Bilangan", "Matematika", 8);
    formattedQuestions = generated.map((q, idx) => ({
      id: q.id,
      urutan: idx + 1,
      pertanyaan: q.pertanyaan,
      tipe_soal: q.tipeSoal,
      poin_bobot: q.tipeSoal === "pilihan_ganda" ? 5 : q.tipeSoal === "isian_singkat" ? 10 : 15,
      pembahasan: q.pembahasan || null,
      kunci_jawaban: q.kunciJawaban || null,
      opsi: (q.opsiSoal || []).map((o, oIdx) => ({
        id: `${q.id}-opt-${oIdx}`,
        teks_opsi: o.teksOpsi,
        urutan: oIdx + 1,
        benar: Boolean(o.benar),
      })),
    }));
  }

  // Acak opsi A, B, C, D secara unik per akun siswa (Anti-Contek)
  const studentSeed = user?.id || ujianId || "siswa-anonim";
  formattedQuestions = formattedQuestions.map((q) => {
    if (q.tipe_soal === "pilihan_ganda" && q.opsi && q.opsi.length > 1) {
      return {
        ...q,
        opsi: shuffleOptionsForStudent(q.opsi, studentSeed, q.id),
      };
    }
    return q;
  });

  // 3. Ambil sesi_ujian siswa saat ini jika ada
  let currentSession = null;
  const savedAnswers: Record<
    string,
    {
      opsiId?: string;
      jawabanEsai?: string;
      isBenar?: boolean | null;
      skorDiperoleh?: number;
      koreksiAi?: string;
    }
  > = {};
  let remainingSeconds = (ujian.durasi_menit || 60) * 60;

  if (user) {
    const { data: sesiSiswa } = await adminSupabase
      .from("sesi_ujian")
      .select("*")
      .eq("ujian_id", effectiveUjianId)
      .eq("siswa_id", user.id)
      .maybeSingle();

    if (sesiSiswa) {
      currentSession = sesiSiswa;

      const isOfficial = ujian.tipe === "ujian" || (!/ulangan|formatif/i.test(ujian.judul || "") && ujian.tipe !== "ulangan");
      if (isOfficial && sesiSiswa.status === "terkunci" && !isStaff) {
        return (
          <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 shadow-xl text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
                🔒
              </div>
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-black uppercase tracking-wider">
                  Ujian Resmi Terkunci
                </span>
                <h2 className="text-xl font-black text-[#0F172A]">
                  Sesi Ujian Telah Terkunci
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sesi ujian resmi <strong>&quot;{ujian.judul}&quot;</strong> Anda terkunci karena sistem mendeteksi Anda keluar dari ruang ujian. Sesuai tata tertib CBT terstandar, Anda tidak dapat melanjutkan pengerjaan sendiri.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Petunjuk untuk Siswa:</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Silakan lapor kepada <strong>Guru Pengawas</strong> di ruang kelas/ujian. Pengawas dapat membuka kunci sesi atau mereset ujian Anda melalui <strong>Dashboard Guru (Live Monitor)</strong>.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/ujian"
                  className="block w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                >
                  ← Kembali ke Ruang Ujian
                </Link>
              </div>
            </div>
          </div>
        );
      }

      const { data: jawabanList } = await adminSupabase
        .from("jawaban_ujian")
        .select("soal_id, opsi_dipilih_id, jawaban_esai, is_benar, skor_diperoleh, koreksi_ai")
        .eq("sesi_ujian_id", sesiSiswa.id);

      if (jawabanList) {
        jawabanList.forEach((j) => {
          savedAnswers[j.soal_id] = {
            opsiId: j.opsi_dipilih_id || undefined,
            jawabanEsai: j.jawaban_esai || undefined,
            isBenar: j.is_benar,
            skorDiperoleh: j.skor_diperoleh ? Number(j.skor_diperoleh) : 0,
            koreksiAi: j.koreksi_ai || undefined,
          };
        });
      }

      if (sesiSiswa.status === "selesai" || sesiSiswa.status === "habis_waktu") {
        remainingSeconds = 0;
      } else if (sesiSiswa.server_end_time) {
        const now = new Date();
        const endTime = new Date(sesiSiswa.server_end_time);
        const diffMs = endTime.getTime() - now.getTime();
        remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
      }
    }
  }

  return (
    <ExamRoomClient
      ujian={ujian}
      initialQuestions={formattedQuestions}
      initialSession={currentSession}
      initialSavedAnswers={savedAnswers}
      initialRemainingSeconds={remainingSeconds}
    />
  );
}
