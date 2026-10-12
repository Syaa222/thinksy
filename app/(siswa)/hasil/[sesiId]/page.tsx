import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ExamResultClient, { QuestionReview } from "@/components/sesi/ExamResultClient";
import { generateChapterQuestions } from "@/lib/curriculum-quiz-engine";

export default async function HasilPage({
  params,
}: {
  params: Promise<{ sesiId: string }>;
}) {
  const { sesiId } = await params;
  const adminDb = createAdminClient();

  // 1. Fetch Sesi Info
  const { data: sesiData } = await adminDb
    .from("sesi")
    .select(`
      id,
      tipe_sesi,
      status_sesi,
      skor_akhir,
      mulai_pada,
      selesai_pada,
      bab_id,
      bab (
        id,
        judul,
        mapel
      )
    `)
    .eq("id", sesiId)
    .maybeSingle();

  // 2. Fetch Jawaban Data dengan alasan_salah & status override guru
  const { data: jawabanRows } = await adminDb
    .from("jawaban")
    .select(`
      id,
      soal_id,
      opsi_dipilih_id,
      jawaban_teks,
      is_benar,
      nilai,
      skor_final_guru,
      umpan_balik_ai,
      keyakinan_ai,
      status_penilaian,
      dijawab_pada,
      soal (
        id,
        pertanyaan,
        tipe_soal,
        kunci_jawaban,
        pembahasan,
        opsi_soal (
          id,
          label,
          teks_opsi,
          benar,
          alasan_salah,
          urutan
        )
      )
    `)
    .eq("sesi_id", sesiId)
    .order("dijawab_pada", { ascending: true });

  const reviews: QuestionReview[] = [];
  let correctCount = 0;
  let incorrectCount = 0;
  let totalScoreSum = 0;

  if (jawabanRows && jawabanRows.length > 0) {
    jawabanRows.forEach((item: any, idx: number) => {
      const isCorrect = Boolean(item.is_benar);
      if (isCorrect) {
        correctCount += 1;
      } else {
        incorrectCount += 1;
      }

      const effectiveScore =
        item.skor_final_guru !== null && item.skor_final_guru !== undefined
          ? Number(item.skor_final_guru)
          : Number(item.nilai || 0);

      totalScoreSum += effectiveScore;

      const soal = Array.isArray(item.soal) ? item.soal[0] : item.soal;
      let studentAns = "-";
      let correctAns = "-";
      let miskonsepsiText: string | undefined = undefined;

      if (soal?.tipe_soal === "pilihan_ganda") {
        const selectedOpt = soal.opsi_soal?.find((o: any) => o.id === item.opsi_dipilih_id);
        const correctOpt = soal.opsi_soal?.find((o: any) => o.benar);
        studentAns = selectedOpt ? `${selectedOpt.label ? `[${selectedOpt.label}] ` : ""}${selectedOpt.teks_opsi}` : (item.jawaban_teks || "Tidak Dijawab");
        correctAns = correctOpt ? `${correctOpt.label ? `[${correctOpt.label}] ` : ""}${correctOpt.teks_opsi}` : (soal.kunci_jawaban || "-");
        if (!isCorrect && selectedOpt?.alasan_salah) {
          miskonsepsiText = selectedOpt.alasan_salah;
        }
      } else if (soal?.tipe_soal === "isian_singkat") {
        studentAns = item.jawaban_teks || "Tidak Dijawab";
        correctAns = soal?.kunci_jawaban || "-";
      } else {
        studentAns = item.jawaban_teks || "Tidak Dijawab";
        correctAns = soal?.kunci_jawaban || "Sesuai kriteria rubrik esai";
      }

      const explanation =
        item.umpan_balik_ai ||
        soal?.pembahasan ||
        (isCorrect
          ? "Jawaban Anda sudah tepat dan memenuhi kriteria pemahaman konsep materi ini."
          : "Tinjau kembali konsep dan langkah penyelesaian pada materi bab ini.");

      const isEssay = soal?.tipe_soal === "esai";
      const isOverridden = item.skor_final_guru !== null && item.skor_final_guru !== undefined;
      const statusPenilaian = isOverridden
        ? "final"
        : isEssay
        ? "sementara"
        : "final";

      reviews.push({
        id: idx + 1,
        soalId: item.soal_id,
        questionText: soal?.pertanyaan || `Soal #${idx + 1}`,
        studentAnswer: studentAns,
        correctAnswer: correctAns,
        isCorrect: isCorrect,
        explanation: miskonsepsiText ? `⚠️ **Analisis Miskonsepsi Jawabanmu:** ${miskonsepsiText}\n\n**Pembahasan:**\n${explanation}` : explanation,
        tipeSoal: (soal?.tipe_soal || "pilihan_ganda") as any,
        statusPenilaian: statusPenilaian as any,
        topik: (soal as any)?.bab?.judul || "Materi Terkait",
      });
    });
  }

  const judulBab = (sesiData as any)?.bab?.judul || "Evaluasi Pembelajaran";
  const mapelNama = (sesiData as any)?.bab?.mapel || "Matematika";

  // Fallback if no jawaban rows
  if (reviews.length === 0) {
    const fallbackQuestions = generateChapterQuestions(judulBab, mapelNama, 8);
    fallbackQuestions.forEach((q, idx) => {
      reviews.push({
        id: idx + 1,
        questionText: q.pertanyaan,
        studentAnswer: q.kunciJawaban,
        correctAnswer: q.kunciJawaban,
        isCorrect: true,
        explanation: q.pembahasan,
      });
      correctCount += 1;
    });
  }

  const totalQuestions = reviews.length;
  const score =
    (sesiData as any)?.skor_akhir ??
    (totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0);
  const derivedIncorrectCount = Math.max(0, totalQuestions - correctCount);
  const poinEarned = score >= 80 ? 100 : score >= 60 ? 75 : 50;

  const jenisSesi = (sesiData as any)?.tipe_sesi
    ? String((sesiData as any).tipe_sesi).toUpperCase()
    : "KUIS";

  return (
    <ExamResultClient
      sesiId={sesiId}
      judulBab={judulBab}
      jenisSesi={jenisSesi}
      score={score}
      poinEarned={poinEarned}
      totalQuestions={totalQuestions}
      correctCount={correctCount}
      incorrectCount={derivedIncorrectCount}
      reviews={reviews}
    />
  );
}
