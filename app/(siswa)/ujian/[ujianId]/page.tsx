import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import ExamRoomClient from "./ExamRoomClient";

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

  // 1. Ambil detail Ujian
  const { data: ujian } = await adminSupabase
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
      bab_id
    `)
    .eq("id", ujianId)
    .maybeSingle();

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
  const now = new Date();
  const startTime = new Date(ujian.waktu_mulai);
  const endTime = new Date(ujian.waktu_berakhir);
  const isTimeAvailable = now >= startTime && now <= endTime;
  const isAvailable = ujian.status === "dipublikasi" && isTimeAvailable;

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

          <a
            href="/"
            className="block w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            ← Kembali ke Dashboard
          </a>
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
    // Fallback dari tabel soal
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

  // 3. Ambil sesi_ujian siswa saat ini jika ada
  let currentSession = null;
  let savedAnswers: Record<string, { opsiId?: string; jawabanEsai?: string }> = {};
  let remainingSeconds = (ujian.durasi_menit || 60) * 60;

  if (user) {
    const { data: sesiSiswa } = await adminSupabase
      .from("sesi_ujian")
      .select("*")
      .eq("ujian_id", ujianId)
      .eq("siswa_id", user.id)
      .maybeSingle();

    if (sesiSiswa) {
      currentSession = sesiSiswa;

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

      if (sesiSiswa.server_end_time) {
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
