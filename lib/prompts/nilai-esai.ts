/**
 * Prompt Library: Penilai Esai AI v1.0
 * Berdasarkan spesifikasi Build Handbook MVP (Bagian 6.2)
 *
 * Menghasilkan evaluasi esai berbasis rubrik terstruktur dengan tingkat keyakinan (confidence).
 * Jika keyakinan = 'rendah', sistem otomatis menandai untuk review guru.
 */

export const PROMPT_NILAI_ESAI_VERSION = "1.0.0";

export interface RubrikKriteria {
  kriteria: string;
  bobot: number;
  deskriptor?: string;
}

export interface EssayEvaluationContext {
  pertanyaan: string;
  rubrikJson: string | RubrikKriteria[];
  kunciJawaban?: string;
  pembahasan?: string;
  jawabanSiswa: string;
}

export function buildEssayEvaluationPrompt(context: EssayEvaluationContext): string {
  const { pertanyaan, rubrikJson, kunciJawaban, pembahasan, jawabanSiswa } = context;

  const rubrikStr = typeof rubrikJson === "string" 
    ? rubrikJson 
    : JSON.stringify(rubrikJson, null, 2);

  return `Kamu penilai jawaban esai matematika SMP kelas 8. Nilai HANYA berdasarkan rubrik dan kunci konsep di bawah.
Jangan menambah kriteria sendiri. Jangan menilai gaya bahasa kecuali rubrik memintanya.

SOAL ESAI:
${pertanyaan}

KUNCI JAWABAN / KONSEP ACUAN:
${kunciJawaban || pembahasan || "Penjelasan konsep secara logis dan matematis."}

RUBRIK PENILAIAN:
${rubrikStr}

JAWABAN SISWA:
${jawabanSiswa || "(Tidak ada jawaban)"}

Balas HANYA JSON valid tanpa markdown fence atau teks pengantar apapun:
{
  "skor_per_kriteria": [
    { "kriteria": "Pemahaman Konsep", "skor": 8, "alasan": "Konsep dasar dijelaskan dengan tepat." },
    { "kriteria": "Langkah Perhitungan", "skor": 7, "alasan": "Terdapat sedikit kekeliruan perhitungan pada baris kedua." }
  ],
  "skor_total": 75,
  "umpan_balik": "2-3 kalimat untuk siswa, gunakan kata 'kamu', sebutkan satu hal yang sudah benar dan satu hal yang perlu diperbaiki.",
  "keyakinan": "tinggi"
}

Catatan untuk properti "keyakinan": Isi dengan salah satu nilai mutlak: "tinggi", "sedang", atau "rendah". 
Gunakan "rendah" jika jawaban ambigu atau sulit dinilai otomatis agar otomatis ditinjau oleh guru.
`;
}
