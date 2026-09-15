import { createClient } from "@/lib/supabase/server";
import ExamPracticeClient from "@/components/sesi/ExamPracticeClient";
import { generateChapterQuestions } from "@/lib/curriculum-quiz-engine";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profil } = user
    ? await supabase
        .from("profil")
        .select("nama_lengkap")
        .eq("id", user.id)
        .single()
    : { data: null };

  // Fetch bab details if babId is present
  let babData: { judul: string; mapel?: string; kelas?: number } | null = null;
  if (babId) {
    const { data: bData } = await supabase
      .from("bab")
      .select("id, judul, mapel, kelas")
      .eq("id", babId)
      .maybeSingle();
    babData = bData;
  }

  // Query real questions from secure view (without answer keys)
  let query = supabase
    .from("soal_publik")
    .select(`
      id,
      pertanyaan,
      tipe_soal,
      opsi_soal_publik (
        id,
        teks_opsi
      )
    `);

  if (babId) {
    query = query.eq("bab_id", babId);
  }

  const { data: dbSoalList } = await query;

  // Generate topic-matched fallback questions if DB has no questions yet for this chapter
  const defaultSoalList = generateChapterQuestions(
    babData?.judul || "Bab Pembelajaran",
    babData?.mapel || "Matematika",
    babData?.kelas || 8
  ).map((q, idx) => ({
    id: q.id || `demo-q-${idx + 1}`,
    pertanyaan: q.pertanyaan,
    tipeSoal: q.tipeSoal,
    opsiSoal: q.opsiSoal?.map((o, optIdx) => ({
      id: o.id || `opt-${idx + 1}-${optIdx + 1}`,
      teksOpsi: o.teksOpsi,
    })),
    kunciJawaban: q.kunciJawaban,
    pembahasan: q.pembahasan,
    hintSokratik: q.hintSokratik,
  }));

  const formattedSoalList =
    dbSoalList && dbSoalList.length > 0
      ? dbSoalList.map((item: any) => ({
          id: item.id,
          pertanyaan: item.pertanyaan,
          tipeSoal: item.tipe_soal as "pilihan_ganda" | "esai",
          opsiSoal: (item.opsi_soal_publik || item.opsi_soal)?.map((o: any) => ({
            id: o.id,
            teksOpsi: o.teks_opsi,
          })),
        }))
      : defaultSoalList;

  const sessionTitle = babData
    ? `EVALUASI: ${babData.judul}`
    : mode === "inclass"
    ? "EVALUASI BAB - ASESMEN TOPIK IN-CLASS"
    : "UJIAN AKHIR SEMESTER - PRACTICE EXAM";

  return (
    <ExamPracticeClient
      sesiId={sesiId}
      babId={babId}
      mode={mode || "inclass"}
      judulSesi={sessionTitle}
      mapel={babData?.mapel || "Matematika"}
      soalList={formattedSoalList}
      namaSiswa={profil?.nama_lengkap ?? undefined}
    />
  );
}
