/**
 * Prompt Library: Penilai Esai AI v1.0
 * Berdasarkan spesifikasi Build Handbook MVP (Bagian 6.2)
 *
 * Parameter standar: temperature: 0.2
 * Jika keyakinan = 'rendah', otomatis masuk antrean review guru.
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
  jawabanTeks: string;
  kunciJawaban?: string;
  pembahasan?: string;
}

export function buildEssayEvaluationPrompt(context: EssayEvaluationContext): string {
  const { pertanyaan, rubrikJson, jawabanTeks, kunciJawaban, pembahasan } = context;

  const rubrikStr =
    typeof rubrikJson === "string"
      ? rubrikJson
      : JSON.stringify(rubrikJson, null, 2);

  return `Kamu penilai jawaban esai matematika SMP kelas 8. Nilai HANYA berdasarkan rubrik di bawah.
Jangan menambah kriteria sendiri. Jangan menilai gaya bahasa kecuali rubrik memintanya.

PERTANYAAN:
${pertanyaan}

KUNCI KONSEP ACUAN:
${kunciJawaban || pembahasan || "Konsep logika matematis kelas 8 terkait."}

RUBRIK:
${rubrikStr}

JAWABAN SISWA:
${jawabanTeks || "(Tidak ada jawaban)"}

Balas HANYA JSON valid tanpa markdown fence:
{
  "skor_per_kriteria": [{"kriteria": "...", "skor": 0, "alasan": "..."}],
  "skor_total": 0,
  "umpan_balik": "2-3 kalimat untuk siswa, gunakan kata 'kamu', sebutkan satu hal yang sudah benar dan satu yang perlu diperbaiki",
  "keyakinan": "tinggi|sedang|rendah"
}
`;
}
