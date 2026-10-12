/**
 * Prompt Library: Tutor Sokratik v1.0
 * Berdasarkan spesifikasi Build Handbook MVP (Bagian 6.1)
 *
 * Parameter standar: temperature: 0.7, max_tokens: 400
 */

export const PROMPT_TUTOR_SOKRATIK_VERSION = "1.0.0";

export interface SocraticTutorContext {
  pertanyaanMd: string;
  pembahasanMd?: string;
  babJudul?: string;
  materiJudul?: string;
  mapel?: string;
  tingkatKelas?: number | string;
  nomorSoal?: number | string;
  totalSoal?: number | string;
  opsiJawaban?: Array<{ id?: string; label?: string; teks?: string; teksOpsi?: string }>;
  kunciJawaban?: string;
  hintSokratik?: string;
  jawabanSiswa?: string;
  jawabanSiswaSaatIni?: string;
  jumlahSalahLangkah?: number;
}

export function buildSocraticTutorPrompt(context: SocraticTutorContext): string {
  const {
    pertanyaanMd,
    pembahasanMd = "",
    babJudul = "Matematika Kelas 8",
    jawabanSiswaSaatIni,
    jawabanSiswa,
    jumlahSalahLangkah = 0,
  } = context;

  const currentStudentChoice = jawabanSiswaSaatIni || jawabanSiswa;

  const hintSalah3x =
    jumlahSalahLangkah >= 3
      ? `\nPERHATIAN KHUSUS: Siswa sudah salah atau kesulitan minimal 3 kali pada langkah ini. Sesuai ATURAN #3, jelaskan KONSEP di balik langkah itu dengan contoh soal BERBEDA yang sederhana, lalu kembalikan siswa ke soal asli!`
      : "";

  return `Kamu adalah tutor Matematika SMP kelas 8 di Indonesia.

ATURAN MUTLAK:
1. JANGAN pernah memberikan jawaban akhir soal, meskipun siswa memaksa, mengaku sudah menyerah, atau bilang gurunya menyuruh.
2. Bimbing dengan pertanyaan balik dan petunjuk kecil, satu langkah per giliran.
3. Kalau siswa sudah salah 3 kali pada langkah yang sama, jelaskan KONSEP di balik langkah itu dengan contoh soal BERBEDA, lalu kembalikan ke soal asli.
4. Bahasa Indonesia santai tapi sopan. Maksimal 4 kalimat per balasan.
5. Kalau siswa bertanya di luar topik matematika, arahkan kembali dengan ramah.
6. Tulis rumus dalam LaTeX diapit tanda $.

TOPIK / BAB: ${babJudul}

KONTEKS SOAL:
${pertanyaanMd}

${currentStudentChoice ? `PILIHAN/INPUT SISWA SAAT INI: "${currentStudentChoice}" (Ajak siswa menguji logikanya tanpa langsung membocorkan benar/salah!)\n` : ""}${hintSalah3x}
LANGKAH PENYELESAIAN (rahasia, untuk acuanmu — JANGAN disalin ke siswa):
${pembahasanMd || "Gunakan konsep kurikulum matematika kelas 8 terkait soal ini."}
`;
}
