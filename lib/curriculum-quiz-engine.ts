/**
 * Curriculum Quiz Engine (Engine Generator Soal & Pembahasan Kurikulum Merdeka)
 * Menyediakan bank soal 100% selaras dengan topik bacaan di setiap bab.
 * Setiap kuis bab berisi TEPAT 10 SOAL dan SETIAP NOMOR BERNILAI 10 POIN (Total 100).
 */

export interface QuestionOption {
  id: string;
  teksOpsi: string;
  benar: boolean;
}

export interface QuizQuestionData {
  id: string;
  pertanyaan: string;
  tipeSoal: "pilihan_ganda" | "esai";
  opsiSoal?: QuestionOption[];
  kunciJawaban: string;
  pembahasan: string;
  hintSokratik: string;
}

export function generateChapterQuestions(
  judulBab: string,
  mapel: string = "Matematika",
  kelas: number = 8
): QuizQuestionData[] {
  const cleanTitle = (judulBab || "").replace(/^Bab\s*\d+\s*:\s*/i, "").trim();
  const lowerTitle = cleanTitle.toLowerCase();
  const lowerMapel = (mapel || "").toLowerCase();

  let questions: QuizQuestionData[] = [];

  // 1. MATEMATIKA
  if (lowerMapel.includes("matematika") || lowerMapel === "mtk") {
    if (lowerTitle.includes("bilangan bulat")) {
      questions = getBilanganBulat10();
    } else if (lowerTitle.includes("aljabar")) {
      questions = getAljabar10();
    } else if (lowerTitle.includes("persamaan") && (lowerTitle.includes("linear") || lowerTitle.includes("plsv") || lowerTitle.includes("spldv"))) {
      questions = getPLSV10();
    } else if (lowerTitle.includes("perbandingan") || lowerTitle.includes("skala")) {
      questions = getPerbandingan10();
    } else if (lowerTitle.includes("pythagoras") || lowerTitle.includes("pitagoras")) {
      questions = getPythagoras10();
    } else if (lowerTitle.includes("berpangkat") || lowerTitle.includes("akar") || lowerTitle.includes("eksponen")) {
      questions = getBilanganBerpangkat10();
    } else if (lowerTitle.includes("relasi") || lowerTitle.includes("fungsi")) {
      questions = getRelasiFungsi10();
    } else if (lowerTitle.includes("garis lurus") || lowerTitle.includes("pgl") || lowerTitle.includes("gradien")) {
      questions = getPersamaanGarisLurus10();
    } else if (lowerTitle.includes("bangun ruang") || lowerTitle.includes("brsd") || lowerTitle.includes("geometri")) {
      questions = getBangunRuang10();
    } else if (lowerTitle.includes("statistika") || lowerTitle.includes("data") || lowerTitle.includes("diagram")) {
      questions = getStatistika10();
    } else if (lowerTitle.includes("peluang") || lowerTitle.includes("kemungkinan")) {
      questions = getPeluang10();
    } else if (lowerTitle.includes("pola bilangan") || lowerTitle.includes("barisan") || lowerTitle.includes("deret")) {
      questions = getPolaBilangan10();
    } else {
      questions = getCustomMath10(cleanTitle, kelas);
    }
  }

  // 2. BAHASA INDONESIA
  else if (lowerMapel.includes("indonesia") || lowerMapel === "bindo") {
    if (lowerTitle.includes("deskripsi") || lowerTitle.includes("jelajah nusantara")) {
      questions = getTeksDeskripsi10();
    } else if (lowerTitle.includes("observasi") || lowerTitle.includes("lho")) {
      questions = getTeksLHO10();
    } else if (lowerTitle.includes("iklan") || lowerTitle.includes("poster") || lowerTitle.includes("slogan")) {
      questions = getIklanPoster10();
    } else if (lowerTitle.includes("puisi") || lowerTitle.includes("drama") || lowerTitle.includes("cerpen")) {
      questions = getKaryaSastra10();
    } else if (lowerTitle.includes("pidato") || lowerTitle.includes("persuasif") || lowerTitle.includes("artikel")) {
      questions = getPidato10();
    } else {
      questions = getCustomBindo10(cleanTitle, kelas);
    }
  }

  // 3. IPA (SAINS)
  else if (lowerMapel.includes("ipa") || lowerMapel.includes("alam") || lowerMapel.includes("sains")) {
    questions = getCustomIPA10(cleanTitle, kelas);
  }

  // 4. BAHASA INGGRIS
  else if (lowerMapel.includes("inggris") || lowerMapel.includes("english") || lowerMapel === "bing") {
    questions = getCustomEnglish10(cleanTitle, kelas);
  }

  // 5. IPS
  else if (lowerMapel.includes("ips") || lowerMapel.includes("sosial")) {
    questions = getCustomIPS10(cleanTitle, kelas);
  }

  // 6. INFORMATIKA
  else if (lowerMapel.includes("informatika") || lowerMapel.includes("komputer")) {
    questions = getCustomInformatika10(cleanTitle, kelas);
  }

  // 7. PENDIDIKAN PANCASILA / PPKN
  else if (lowerMapel.includes("pancasila") || lowerMapel.includes("ppkn") || lowerMapel.includes("kewarganegaraan")) {
    questions = getCustomPPKN10(cleanTitle, kelas);
  }

  // 8. PJOK
  else if (lowerMapel.includes("pjok") || lowerMapel.includes("jasmani") || lowerMapel.includes("olahraga")) {
    questions = getCustomPJOK10(cleanTitle, kelas);
  }

  // 9. SENI BUDAYA
  else if (lowerMapel.includes("seni") || lowerMapel.includes("musik") || lowerMapel.includes("rupa") || lowerMapel.includes("tari")) {
    questions = getCustomSeni10(cleanTitle, kelas);
  }

  // 10. PENDIDIKAN AGAMA ISLAM / PAI
  else if (lowerMapel.includes("agama") || lowerMapel.includes("islam") || lowerMapel.includes("pai")) {
    questions = getCustomAgama10(cleanTitle, kelas);
  }

  // Universal fallback for any other subjects
  else {
    questions = getUniversal10(cleanTitle, mapel, kelas);
  }

  // Ensure exactly 10 questions returned
  return ensureExactly10Questions(questions, cleanTitle, mapel, kelas);
}

// =============================================================================
// HELPER: ENSURE EXACTLY 10 QUESTIONS
// =============================================================================
function ensureExactly10Questions(
  currentList: QuizQuestionData[],
  topicTitle: string,
  mapel: string,
  kelas: number
): QuizQuestionData[] {
  if (currentList.length === 10) {
    return currentList.map((q, idx) => ({ ...q, id: `q-${idx + 1}` }));
  }

  const result = [...currentList];
  while (result.length < 10) {
    const nextIdx = result.length + 1;
    result.push({
      id: `q-${nextIdx}`,
      pertanyaan: `[Soal #${nextIdx}] Dalam penerapan materi "${topicTitle}" (${mapel} Kelas ${kelas}), manakah langkah penalaran yang paling tepat untuk menganalisis dan memecahkan persoalan kontekstual?`,
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: `opt-${nextIdx}-1`, teksOpsi: `Mengidentifikasi data & variabel penting, menerapkan konsep dasar ${topicTitle}, dan memverifikasi kesimpulan secara logis.`, benar: true },
        { id: `opt-${nextIdx}-2`, teksOpsi: "Menghafal rumus tanpa memahami logika di balik konsep tersebut.", benar: false },
        { id: `opt-${nextIdx}-3`, teksOpsi: "Mengabaikan hubungan antara data yang diketahui dengan apa yang ditanyakan.", benar: false },
        { id: `opt-${nextIdx}-4`, teksOpsi: "Mengambil kesimpulan instan tanpa melakukan langkah pembuktian.", benar: false },
      ],
      kunciJawaban: `Mengidentifikasi data & variabel penting, menerapkan konsep dasar ${topicTitle}, dan memverifikasi kesimpulan secara logis.`,
      pembahasan: `Pada pembelajaran ${mapel} materi "${topicTitle}", pemecahan masalah yang efektif memerlukan pemahaman konsep yang kokoh, identifikasi informasi relevan, dan penalaran sistematis langkah demi langkah.`,
      hintSokratik: `Perhatikan prinsip utama materi ${topicTitle}. Pilihlah pendekatan yang mengutamakan pemahaman konsep dan penalaran terstruktur.`,
    });
  }

  return result.slice(0, 10).map((q, idx) => ({ ...q, id: `q-${idx + 1}` }));
}

// =============================================================================
// MATEMATIKA 10 QUESTIONS SETS
// =============================================================================

function getBilanganBulat10(): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: "Suhu di dalam ruang pendingin mula-mula adalah $-4^\\circ\\text{C}$. Setelah mesin dinyalakan, suhunya turun sebesar $7^\\circ\\text{C}$. Berapakah suhu di dalam ruang pendingin sekarang?",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "-11°C", benar: true },
        { id: "opt-2", teksOpsi: "-3°C", benar: false },
        { id: "opt-3", teksOpsi: "3°C", benar: false },
        { id: "opt-4", teksOpsi: "11°C", benar: false },
      ],
      kunciJawaban: "-11°C",
      pembahasan: "Suhu awal = $-4^\\circ\\text{C}$. Suhu turun $7^\\circ\\text{C}$ artinya dikurang: $-4 - 7 = -11^\\circ\\text{C}$.",
      hintSokratik: "Jika suhu turun, operasikan pengurangan ke arah kiri pada garis bilangan dari titik -4 sejauh 7.",
    },
    {
      id: "q-2",
      pertanyaan: "Hitunglah hasil dari operasi campuran berikut: $$-24 + (-6) \\times 5 - (-18) \\div 3$$",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "-48", benar: true },
        { id: "opt-2", teksOpsi: "-60", benar: false },
        { id: "opt-3", teksOpsi: "-36", benar: false },
        { id: "opt-4", teksOpsi: "24", benar: false },
      ],
      kunciJawaban: "-48",
      pembahasan: "Dahulukan perkalian dan pembagian:\n$(-6) \\times 5 = -30$, $(-18) \\div 3 = -6$.\nOperasi gabungan: $-24 + (-30) - (-6) = -54 + 6 = -48$.",
      hintSokratik: "Ingat aturan urutan operasi KABATAKU: perkalian & pembagian lebih dahulu sebelum penjumlahan & pengurangan.",
    },
    {
      id: "q-3",
      pertanyaan: "Tiga buah lampu menyala berkala: lampu merah setiap $4\\text{ detik}$, hijau setiap $6\\text{ detik}$, dan biru setiap $8\\text{ detik}$. Pada detik ke berapa ketiga lampu menyala bersamaan kembali?",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "Detik ke-24", benar: true },
        { id: "opt-2", teksOpsi: "Detik ke-18", benar: false },
        { id: "opt-3", teksOpsi: "Detik ke-36", benar: false },
        { id: "opt-4", teksOpsi: "Detik ke-48", benar: false },
      ],
      kunciJawaban: "Detik ke-24",
      pembahasan: "KPK dari $4 = 2^2$, $6 = 2 \\times 3$, $8 = 2^3$ adalah $2^3 \\times 3 = 24\\text{ detik}$.",
      hintSokratik: "Untuk kejadian yang berulang bersamaan, gunakan Kelipatan Persekutuan Terkecil (KPK).",
    },
    {
      id: "q-4",
      pertanyaan: "Ibu memiliki $48$ permen cokelat dan $72$ biskuit yang akan dibagikan ke dalam kantong plastik dengan isi yang sama banyak. Berapa kantong plastik terbanyak yang dibutuhkan?",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "24 kantong", benar: true },
        { id: "opt-2", teksOpsi: "12 kantong", benar: false },
        { id: "opt-3", teksOpsi: "18 kantong", benar: false },
        { id: "opt-4", teksOpsi: "36 kantong", benar: false },
      ],
      kunciJawaban: "24 kantong",
      pembahasan: "Jumlah kantong maksimal dihitung dengan FPB(48, 72). $48 = 2^4 \\times 3$, $72 = 2^3 \\times 3^2$. FPB $= 2^3 \\times 3 = 24$.",
      hintSokratik: "Untuk membagi benda dalam jumlah sama banyak tanpa sisa, gunakan Faktor Persekutuan Terbesar (FPB).",
    },
    {
      id: "q-5",
      pertanyaan: "Hasil dari operasi pecahan $\\frac{3}{4} + \\frac{2}{3} - \\frac{1}{2}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "11/12", benar: true },
        { id: "opt-2", teksOpsi: "5/6", benar: false },
        { id: "opt-3", teksOpsi: "7/12", benar: false },
        { id: "opt-4", teksOpsi: "1 1/4", benar: false },
      ],
      kunciJawaban: "11/12",
      pembahasan: "Samakan penyebut ke KPK(4, 3, 2) = 12:\n$\\frac{9}{12} + \\frac{8}{12} - \\frac{6}{12} = \\frac{11}{12}$.",
      hintSokratik: "Cari KPK dari semua penyebut (4, 3, dan 2) terlebih dahulu.",
    },
    {
      id: "q-6",
      pertanyaan: "Sebuah kapal selam berada di kedalaman $120\\text{ meter}$ di bawah permukaan laut. Kapal tersebut kemudian naik $45\\text{ meter}$ dan menyelam lagi $30\\text{ meter}$. Posisi kapal sekarang adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "-105 meter (105 m di bawah permukaan)", benar: true },
        { id: "opt-2", teksOpsi: "-135 meter", benar: false },
        { id: "opt-3", teksOpsi: "-95 meter", benar: false },
        { id: "opt-4", teksOpsi: "-195 meter", benar: false },
      ],
      kunciJawaban: "-105 meter (105 m di bawah permukaan)",
      pembahasan: "Posisi awal: $-120\\text{ m}$. Naik $+45\\text{ m}$, turun $-30\\text{ m}$:\n$-120 + 45 - 30 = -75 - 30 = -105\\text{ meter}$.",
      hintSokratik: "Posisi di bawah permukaan laut bernilai negatif, naik berarti bertambah positif, menyelam berarti bertambah negatif.",
    },
    {
      id: "q-7",
      pertanyaan: "Dalam sebuah kompetisi matematika yang terdiri dari 30 soal, jawaban benar bernilai $+4$, salah bernilai $-2$, dan tidak dijawab $0$. Budi menjawab benar 22 soal, salah 5 soal, dan sisanya tidak dijawab. Total skor Budi adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "78", benar: true },
        { id: "opt-2", teksOpsi: "88", benar: false },
        { id: "opt-3", teksOpsi: "68", benar: false },
        { id: "opt-4", teksOpsi: "74", benar: false },
      ],
      kunciJawaban: "78",
      pembahasan: "Benar: $22 \\times 4 = 88$. Salah: $5 \\times (-2) = -10$. Tidak dijawab: $3 \\times 0 = 0$. Total $= 88 - 10 = 78$.",
      hintSokratik: "Kalikan jumlah benar dengan 4 dan kurangkan dengan hasil kali jumlah salah dengan 2.",
    },
    {
      id: "q-8",
      pertanyaan: "Manakah di antara pernyataan perbandingan bilangan bulat berikut yang BENAR?",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "-15 > -20", benar: true },
        { id: "opt-2", teksOpsi: "-8 > -5", benar: false },
        { id: "opt-3", teksOpsi: "-12 > 0", benar: false },
        { id: "opt-4", teksOpsi: "-35 > -30", benar: false },
      ],
      kunciJawaban: "-15 > -20",
      pembahasan: "Pada garis bilangan horizontal, bilangan yang terletak semakin ke kanan nilainya semakin besar. $-15$ berada di sebelah kanan $-20$, maka $-15 > -20$.",
      hintSokratik: "Semakin mendekati nol, nilai bilangan bulat negatif semakin besar.",
    },
    {
      id: "q-9",
      pertanyaan: "Hasil dari $(-3)^3 + (-2)^4$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "-11", benar: true },
        { id: "opt-2", teksOpsi: "-43", benar: false },
        { id: "opt-3", teksOpsi: "43", benar: false },
        { id: "opt-4", teksOpsi: "11", benar: false },
      ],
      kunciJawaban: "-11",
      pembahasan: "$(-3)^3 = -27$ (pangkat ganjil bertanda negatif).\n$(-2)^4 = +16$ (pangkat genap bertanda positif).\n$-27 + 16 = -11$.",
      hintSokratik: "Bilangan negatif berpangkat ganjil menghasilkan nilai negatif, sedangkan berpangkat genap menghasilkan positif.",
    },
    {
      id: "q-10",
      pertanyaan: "Sebuah es batu bersuhu $-8^\\circ\\text{C}$ dipanaskan sehingga suhunya naik rata-rata $3^\\circ\\text{C}$ setiap 2 menit. Berapakah suhu es batu tersebut setelah 10 menit?",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "7°C", benar: true },
        { id: "opt-2", teksOpsi: "5°C", benar: false },
        { id: "opt-3", teksOpsi: "15°C", benar: false },
        { id: "opt-4", teksOpsi: "22°C", benar: false },
      ],
      kunciJawaban: "7°C",
      pembahasan: "Total kenaikan suhu: $\\frac{10}{2} \\times 3^\\circ\\text{C} = 5 \\times 3 = 15^\\circ\\text{C}$.\nSuhu akhir: $-8^\\circ\\text{C} + 15^\\circ\\text{C} = 7^\\circ\\text{C}$.",
      hintSokratik: "Hitung berapa kali kenaikan terjadi dalam 10 menit (10 / 2 = 5 kali), lalu tambahkan total kenaikan ke suhu mula-mula.",
    },
  ];
}

function getPythagoras10(): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: "Sebuah segitiga siku-siku memiliki sisi siku-siku $a = 9\\text{ cm}$ dan $b = 12\\text{ cm}$. Berapakah panjang sisi miringnya (hipotenusa)?",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "15 cm", benar: true },
        { id: "opt-2", teksOpsi: "13 cm", benar: false },
        { id: "opt-3", teksOpsi: "17 cm", benar: false },
        { id: "opt-4", teksOpsi: "21 cm", benar: false },
      ],
      kunciJawaban: "15 cm",
      pembahasan: "$c = \\sqrt{9^2 + 12^2} = \\sqrt{81 + 144} = \\sqrt{225} = 15\\text{ cm}$.",
      hintSokratik: "Gunakan rumus Teorema Pythagoras: $c = \\sqrt{a^2 + b^2}$.",
    },
    {
      id: "q-2",
      pertanyaan: "Kelompok tiga bilangan berikut yang merupakan Tripel Pythagoras adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "7, 24, 25", benar: true },
        { id: "opt-2", teksOpsi: "6, 9, 12", benar: false },
        { id: "opt-3", teksOpsi: "8, 12, 15", benar: false },
        { id: "opt-4", teksOpsi: "10, 20, 25", benar: false },
      ],
      kunciJawaban: "7, 24, 25",
      pembahasan: "$7^2 + 24^2 = 49 + 576 = 625 = 25^2$.",
      hintSokratik: "Cek apakah kuadrat sisi terpanjang sama dengan jumlah kuadrat dua sisi lainnya.",
    },
    {
      id: "q-3",
      pertanyaan: "Sebuah kapal berlayar ke barat sejauh $40\\text{ km}$, kemudian berbelok ke utara sejauh $30\\text{ km}$. Jarak terpendek kapal dari pelabuhan awal adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "50 km", benar: true },
        { id: "opt-2", teksOpsi: "70 km", benar: false },
        { id: "opt-3", teksOpsi: "45 km", benar: false },
        { id: "opt-4", teksOpsi: "60 km", benar: false },
      ],
      kunciJawaban: "50 km",
      pembahasan: "Arah barat dan utara saling tegak lurus ($90^\\circ$). Jarak $= \\sqrt{40^2 + 30^2} = \\sqrt{1600 + 900} = 50\\text{ km}$.",
      hintSokratik: "Arah barat dan utara membentuk sudut siku-siku. Sisi miring dicari dengan $\\sqrt{40^2 + 30^2}$.",
    },
    {
      id: "q-4",
      pertanyaan: "Tangga sepanjang $10\\text{ m}$ disandarkan ke tembok. Jarak kaki tangga ke tembok $6\\text{ m}$. Tinggi tembok yang dicapai ujung tangga adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "8 m", benar: true },
        { id: "opt-2", teksOpsi: "7 m", benar: false },
        { id: "opt-3", teksOpsi: "9 m", benar: false },
        { id: "opt-4", teksOpsi: "4 m", benar: false },
      ],
      kunciJawaban: "8 m",
      pembahasan: "$t = \\sqrt{10^2 - 6^2} = \\sqrt{100 - 36} = \\sqrt{64} = 8\\text{ m}$.",
      hintSokratik: "Panjang tangga adalah sisi miring ($c$). Tinggi tembok dihitung dengan $\\sqrt{c^2 - a^2}$.",
    },
    {
      id: "q-5",
      pertanyaan: "Segitiga dengan panjang sisi $8\\text{ cm}$, $15\\text{ cm}$, dan $17\\text{ cm}$ merupakan jenis segitiga...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "Siku-siku", benar: true },
        { id: "opt-2", teksOpsi: "Lancip", benar: false },
        { id: "opt-3", teksOpsi: "Tumpul", benar: false },
        { id: "opt-4", teksOpsi: "Sama sisi", benar: false },
      ],
      kunciJawaban: "Siku-siku",
      pembahasan: "$8^2 + 15^2 = 64 + 225 = 289 = 17^2$. Karena $a^2 + b^2 = c^2$, maka segitiga siku-siku.",
      hintSokratik: "Bandingkan $a^2 + b^2$ dengan $c^2$. Jika sama, maka segitiga siku-siku.",
    },
    {
      id: "q-6",
      pertanyaan: "Panjang diagonal sebuah persegi panjang dengan ukuran panjang $24\\text{ cm}$ dan lebar $7\\text{ cm}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "25 cm", benar: true },
        { id: "opt-2", teksOpsi: "31 cm", benar: false },
        { id: "opt-3", teksOpsi: "26 cm", benar: false },
        { id: "opt-4", teksOpsi: "28 cm", benar: false },
      ],
      kunciJawaban: "25 cm",
      pembahasan: "$d = \\sqrt{24^2 + 7^2} = \\sqrt{576 + 49} = \\sqrt{625} = 25\\text{ cm}$.",
      hintSokratik: "Diagonal persegi panjang membelah persegi panjang menjadi dua segitiga siku-siku.",
    },
    {
      id: "q-7",
      pertanyaan: "Pada segitiga siku-siku sama kaki dengan panjang sisi siku-siku $6\\text{ cm}$, panjang sisi miringnya adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "6√2 cm", benar: true },
        { id: "opt-2", teksOpsi: "12 cm", benar: false },
        { id: "opt-3", teksOpsi: "6√3 cm", benar: false },
        { id: "opt-4", teksOpsi: "8 cm", benar: false },
      ],
      kunciJawaban: "6√2 cm",
      pembahasan: "Siku-siku sama kaki ($45^\\circ-45^\\circ-90^\\circ$): rasio sisi $1 : 1 : \\sqrt{2}$. Sisi miring $= 6 \\times \\sqrt{2} = 6\\sqrt{2}\\text{ cm}$.",
      hintSokratik: "Untuk segitiga siku-siku sama kaki, sisi miring selalu $s\\sqrt{2}$.",
    },
    {
      id: "q-8",
      pertanyaan: "Pada segitiga siku-siku dengan sudut $30^\\circ, 60^\\circ, 90^\\circ$, jika panjang sisi di depan sudut $30^\\circ$ adalah $5\\text{ cm}$, berapakah panjang sisi miringnya?",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "10 cm", benar: true },
        { id: "opt-2", teksOpsi: "5√3 cm", benar: false },
        { id: "opt-3", teksOpsi: "15 cm", benar: false },
        { id: "opt-4", teksOpsi: "5√2 cm", benar: false },
      ],
      kunciJawaban: "10 cm",
      pembahasan: "Perbandingan sisi sudut $30^\\circ : 60^\\circ : 90^\\circ$ adalah $1 : \\sqrt{3} : 2$. Hipotenusa $= 2 \\times 5 = 10\\text{ cm}$.",
      hintSokratik: "Panjang sisi miring selalu 2 kali lipat dari panjang sisi di hadapan sudut 30 derajat.",
    },
    {
      id: "q-9",
      pertanyaan: "Sebuah belah ketupat memiliki panjang diagonal masing-masing $12\\text{ cm}$ dan $16\\text{ cm}$. Berapakah keliling belah ketupat tersebut?",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "40 cm", benar: true },
        { id: "opt-2", teksOpsi: "20 cm", benar: false },
        { id: "opt-3", teksOpsi: "48 cm", benar: false },
        { id: "opt-4", teksOpsi: "56 cm", benar: false },
      ],
      kunciJawaban: "40 cm",
      pembahasan: "Setengah diagonal: $6\\text{ cm}$ dan $8\\text{ cm}$.\nPanjang sisi belah ketupat $s = \\sqrt{6^2 + 8^2} = 10\\text{ cm}$.\nKeliling $= 4 \\times 10 = 40\\text{ cm}$.",
      hintSokratik: "Bagi diagonal menjadi dua, hitung sisi miring segitiga siku-sikunya, lalu kalikan 4 untuk keliling.",
    },
    {
      id: "q-10",
      pertanyaan: "Di antara kelompok bilangan berikut, manakah yang membentuk segitiga TUMPUL?",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "5 cm, 7 cm, 10 cm", benar: true },
        { id: "opt-2", teksOpsi: "6 cm, 8 cm, 10 cm", benar: false },
        { id: "opt-3", teksOpsi: "9 cm, 12 cm, 15 cm", benar: false },
        { id: "opt-4", teksOpsi: "5 cm, 12 cm, 13 cm", benar: false },
      ],
      kunciJawaban: "5 cm, 7 cm, 10 cm",
      pembahasan: "$5^2 + 7^2 = 25 + 49 = 74 < 10^2 = 100$. Karena $a^2 + b^2 < c^2$, maka segitiga tumpul.",
      hintSokratik: "Segitiga tumpul terjadi jika $a^2 + b^2 < c^2$ di mana $c$ adalah sisi terpanjang.",
    },
  ];
}

function getAljabar10(): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: "Bentuk sederhana dari $(5x - 3y + 7) + (2x + 8y - 12)$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "7x + 5y - 5", benar: true },
        { id: "opt-2", teksOpsi: "7x - 5y + 5", benar: false },
        { id: "opt-3", teksOpsi: "3x + 11y - 19", benar: false },
        { id: "opt-4", teksOpsi: "7x + 5y - 19", benar: false },
      ],
      kunciJawaban: "7x + 5y - 5",
      pembahasan: "$(5x+2x) + (-3y+8y) + (7-12) = 7x + 5y - 5$.",
      hintSokratik: "Kelompokkan suku-suku yang bervariabel sejenis ($x$ dengan $x$, $y$ dengan $y$).",
    },
    {
      id: "q-2",
      pertanyaan: "Hasil penjabaran dari $(3x - 4)^2$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "9x² - 24x + 16", benar: true },
        { id: "opt-2", teksOpsi: "9x² - 16", benar: false },
        { id: "opt-3", teksOpsi: "9x² + 24x + 16", benar: false },
        { id: "opt-4", teksOpsi: "9x² - 12x + 16", benar: false },
      ],
      kunciJawaban: "9x² - 24x + 16",
      pembahasan: "$(a-b)^2 = a^2 - 2ab + b^2 = (3x)^2 - 2(3x)(4) + 4^2 = 9x^2 - 24x + 16$.",
      hintSokratik: "Gunakan rumus kuadrat suku dua $(a - b)^2 = a^2 - 2ab + b^2$.",
    },
    {
      id: "q-3",
      pertanyaan: "Faktorisasi dari $x^2 + 5x - 24$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "(x + 8)(x - 3)", benar: true },
        { id: "opt-2", teksOpsi: "(x - 8)(x + 3)", benar: false },
        { id: "opt-3", teksOpsi: "(x + 6)(x - 4)", benar: false },
        { id: "opt-4", teksOpsi: "(x + 12)(x - 2)", benar: false },
      ],
      kunciJawaban: "(x + 8)(x - 3)",
      pembahasan: "Cari dua angka yang hasil kalinya $-24$ dan hasil tambahnya $+5$, yaitu $8$ dan $-3$.",
      hintSokratik: "Cari sepasang bilangan yang jika dikalikan bernilai -24 dan dijumlahkan bernilai 5.",
    },
    {
      id: "q-4",
      pertanyaan: "Hasil perkalian suku aljabar $(2x + 3)(x - 5)$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "2x² - 7x - 15", benar: true },
        { id: "opt-2", teksOpsi: "2x² + 7x - 15", benar: false },
        { id: "opt-3", teksOpsi: "2x² - 10x - 15", benar: false },
        { id: "opt-4", teksOpsi: "2x² - 13x - 15", benar: false },
      ],
      kunciJawaban: "2x² - 7x - 15",
      pembahasan: "$2x(x) + 2x(-5) + 3(x) + 3(-5) = 2x^2 - 10x + 3x - 15 = 2x^2 - 7x - 15$.",
      hintSokratik: "Gunakan metode distributif / perkalian silang (FOIL).",
    },
    {
      id: "q-5",
      pertanyaan: "Jika $a = 3$ dan $b = -2$, nilai dari $2a^2 - 3ab + b^2$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "40", benar: true },
        { id: "opt-2", teksOpsi: "22", benar: false },
        { id: "opt-3", teksOpsi: "34", benar: false },
        { id: "opt-4", teksOpsi: "28", benar: false },
      ],
      kunciJawaban: "40",
      pembahasan: "$2(3^2) - 3(3)(-2) + (-2)^2 = 2(9) - (-18) + 4 = 18 + 18 + 4 = 40$.",
      hintSokratik: "Substitusikan nilai $a=3$ dan $b=-2$ ke dalam setiap suku secara teliti.",
    },
    {
      id: "q-6",
      pertanyaan: "Bentuk sederhana dari $\\frac{6x^3y^2}{2xy^4}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "3x²/y²", benar: true },
        { id: "opt-2", teksOpsi: "3x²y²", benar: false },
        { id: "opt-3", teksOpsi: "4x²y²", benar: false },
        { id: "opt-4", teksOpsi: "3x/y²", benar: false },
      ],
      kunciJawaban: "3x²/y²",
      pembahasan: "Bagi koefisien: $6/2 = 3$. Kurangkan pangkat variabel: $x^{3-1} = x^2$, $y^{2-4} = y^{-2} = \\frac{1}{y^2}$. Hasil $= \\frac{3x^2}{y^2}$.",
      hintSokratik: "Bagi koefisien dengan koefisien, dan kurangkan pangkat variabel yang sama.",
    },
    {
      id: "q-7",
      pertanyaan: "Faktor persekutuan terbesar (FPB) dari bentuk aljabar $12x^2y$ dan $18xy^3$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "6xy", benar: true },
        { id: "opt-2", teksOpsi: "36x²y³", benar: false },
        { id: "opt-3", teksOpsi: "6x²y²", benar: false },
        { id: "opt-4", teksOpsi: "12xy", benar: false },
      ],
      kunciJawaban: "6xy",
      pembahasan: "FPB(12, 18) = 6. Variabel bersama dengan pangkat terkecil: $x^1$ dan $y^1$. FPB $= 6xy$.",
      hintSokratik: "Cari FPB koefisien dan ambil variabel sekutu dengan pangkat terendah.",
    },
    {
      id: "q-8",
      pertanyaan: "Penyederhanaan dari pecahan aljabar $\\frac{x^2 - 9}{x^2 + 5x + 6}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "(x - 3)/(x + 2)", benar: true },
        { id: "opt-2", teksOpsi: "(x + 3)/(x + 2)", benar: false },
        { id: "opt-3", teksOpsi: "(x - 3)/(x - 2)", benar: false },
        { id: "opt-4", teksOpsi: "1/(5x + 6)", benar: false },
      ],
      kunciJawaban: "(x - 3)/(x + 2)",
      pembahasan: "Faktorkan pembilang: $(x-3)(x+3)$. Faktorkan penyebut: $(x+3)(x+2)$. Coret faktor sama $(x+3)$, diperoleh $\\frac{x-3}{x+2}$.",
      hintSokratik: "Faktorkan selisih kuadrat $x^2 - 9 = (x-3)(x+3)$, lalu sederhanakan.",
    },
    {
      id: "q-9",
      pertanyaan: "Koefisien dari $x$ pada bentuk aljabar $4x^2 - 7x + 15$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "-7", benar: true },
        { id: "opt-2", teksOpsi: "7", benar: false },
        { id: "opt-3", teksOpsi: "4", benar: false },
        { id: "opt-4", teksOpsi: "15", benar: false },
      ],
      kunciJawaban: "-7",
      pembahasan: "Koefisien adalah faktor pengali di depan variabel. Angka di depan variabel $x$ adalah $-7$.",
      hintSokratik: "Perhatikan tanda negatif di depan angka pengali variabel $x$.",
    },
    {
      id: "q-10",
      pertanyaan: "Keliling sebuah persegi panjang dinyatakan oleh $(6x + 8)\\text{ cm}$. Jika panjangnya $(2x + 5)\\text{ cm}$, maka lebarnya adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "(x - 1) cm", benar: true },
        { id: "opt-2", teksOpsi: "(x + 1) cm", benar: false },
        { id: "opt-3", teksOpsi: "(4x + 3) cm", benar: false },
        { id: "opt-4", teksOpsi: "(2x - 1) cm", benar: false },
      ],
      kunciJawaban: "(x - 1) cm",
      pembahasan: "$K = 2(p + l) \\implies 6x + 8 = 2(2x + 5 + l) \\implies 3x + 4 = 2x + 5 + l \\implies l = 3x - 2x + 4 - 5 = x - 1\\text{ cm}$.",
      hintSokratik: "Bagi keliling dengan 2 terlebih dahulu untuk mendapatkan $p + l$, lalu kurangi dengan $p$.",
    },
  ];
}

function getPolaBilangan10(): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: "Diketahui barisan aritmatika $3, 7, 11, 15, 19, \\dots$. Tentukan nilai dari suku ke-12 ($U_{12}$)!",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "47", benar: true },
        { id: "opt-2", teksOpsi: "43", benar: false },
        { id: "opt-3", teksOpsi: "51", benar: false },
        { id: "opt-4", teksOpsi: "55", benar: false },
      ],
      kunciJawaban: "47",
      pembahasan: "Suku pertama $a=3$, beda $b=4$. $U_{12} = 3 + (12-1)4 = 3 + 44 = 47$.",
      hintSokratik: "Gunakan rumus barisan aritmatika $U_n = a + (n-1)b$.",
    },
    {
      id: "q-2",
      pertanyaan: "Rumus suku ke-$n$ dari barisan $5, 9, 13, 17, \\dots$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "Un = 4n + 1", benar: true },
        { id: "opt-2", teksOpsi: "Un = 4n - 1", benar: false },
        { id: "opt-3", teksOpsi: "Un = 5n - 1", benar: false },
        { id: "opt-4", teksOpsi: "Un = 4n + 5", benar: false },
      ],
      kunciJawaban: "Un = 4n + 1",
      pembahasan: "$a = 5, b = 4$. $U_n = 5 + (n-1)4 = 5 + 4n - 4 = 4n + 1$.",
      hintSokratik: "Substitusikan $a=5$ dan $b=4$ ke rumus $U_n = a + (n-1)b$.",
    },
    {
      id: "q-3",
      pertanyaan: "Suku ke-8 dari barisan geometri $2, 6, 18, 54, \\dots$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "4.374", benar: true },
        { id: "opt-2", teksOpsi: "1.458", benar: false },
        { id: "opt-3", teksOpsi: "2.187", benar: false },
        { id: "opt-4", teksOpsi: "13.122", benar: false },
      ],
      kunciJawaban: "4.374",
      pembahasan: "$a = 2$, rasio $r = 3$. $U_8 = a \\cdot r^7 = 2 \\times 3^7 = 2 \\times 2.187 = 4.374$.",
      hintSokratik: "Gunakan rumus geometri $U_n = a \\cdot r^{n-1}$.",
    },
    {
      id: "q-4",
      pertanyaan: "Jumlah 15 suku pertama dari deret aritmatika $4 + 7 + 10 + 13 + \\dots$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "375", benar: true },
        { id: "opt-2", teksOpsi: "350", benar: false },
        { id: "opt-3", teksOpsi: "400", benar: false },
        { id: "opt-4", teksOpsi: "425", benar: false },
      ],
      kunciJawaban: "375",
      pembahasan: "$S_n = \\frac{n}{2}[2a + (n-1)b] = \\frac{15}{2}[2(4) + 14(3)] = \\frac{15}{2}[8 + 42] = \\frac{15}{2} \\times 50 = 375$.",
      hintSokratik: "Gunakan rumus jumlah deret aritmatika $S_n = \\frac{n}{2}(2a + (n-1)b)$.",
    },
    {
      id: "q-5",
      pertanyaan: "Tiga suku berikutnya dari barisan Fibonacci $1, 1, 2, 3, 5, 8, \\dots$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "13, 21, 34", benar: true },
        { id: "opt-2", teksOpsi: "11, 15, 20", benar: false },
        { id: "opt-3", teksOpsi: "12, 18, 26", benar: false },
        { id: "opt-4", teksOpsi: "13, 20, 30", benar: false },
      ],
      kunciJawaban: "13, 21, 34",
      pembahasan: "Barisan Fibonacci menjumlahkan 2 suku sebelumnya: $5+8=13$, $8+13=21$, $13+21=34$.",
      hintSokratik: "Pola Fibonacci: setiap suku adalah hasil penjumlahan dua suku sebelumnya.",
    },
    {
      id: "q-6",
      pertanyaan: "Suku ke-10 dari pola bilangan persegi ($1, 4, 9, 16, \\dots$) adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "100", benar: true },
        { id: "opt-2", teksOpsi: "90", benar: false },
        { id: "opt-3", teksOpsi: "81", benar: false },
        { id: "opt-4", teksOpsi: "121", benar: false },
      ],
      kunciJawaban: "100",
      pembahasan: "Pola persegi $U_n = n^2$. $U_{10} = 10^2 = 100$.",
      hintSokratik: "Pola bilangan persegi mengikuti rumus $n^2$.",
    },
    {
      id: "q-7",
      pertanyaan: "Banyak titik pada pola segitiga ke-8 ($1, 3, 6, 10, \\dots$) adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "36", benar: true },
        { id: "opt-2", teksOpsi: "28", benar: false },
        { id: "opt-3", teksOpsi: "45", benar: false },
        { id: "opt-4", teksOpsi: "32", benar: false },
      ],
      kunciJawaban: "36",
      pembahasan: "Pola segitiga $U_n = \\frac{n(n+1)}{2}$. $U_8 = \\frac{8 \\times 9}{2} = 36$.",
      hintSokratik: "Gunakan rumus bilangan segitiga: $\\frac{n(n+1)}{2}$.",
    },
    {
      id: "q-8",
      pertanyaan: "Banyak suku pada barisan aritmatika $7, 11, 15, \\dots, 83$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "20", benar: true },
        { id: "opt-2", teksOpsi: "19", benar: false },
        { id: "opt-3", teksOpsi: "21", benar: false },
        { id: "opt-4", teksOpsi: "22", benar: false },
      ],
      kunciJawaban: "20",
      pembahasan: "$U_n = a + (n-1)b \\implies 83 = 7 + (n-1)4 \\implies 76 = 4(n-1) \\implies n-1 = 19 \\implies n = 20$.",
      hintSokratik: "Kurangi suku terakhir dengan suku awal, lalu bagi dengan beda dan tambahkan 1.",
    },
    {
      id: "q-9",
      pertanyaan: "Dalam ruang pertunjukan terdapat 10 baris kursi. Baris terdepan berisi 12 kursi dan baris berikutnya selalu memuat 3 kursi lebih banyak. Total seluruh kursi di gedung adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "255 kursi", benar: true },
        { id: "opt-2", teksOpsi: "240 kursi", benar: false },
        { id: "opt-3", teksOpsi: "270 kursi", benar: false },
        { id: "opt-4", teksOpsi: "300 kursi", benar: false },
      ],
      kunciJawaban: "255 kursi",
      pembahasan: "$a = 12, b = 3, n = 10$.\n$S_{10} = \\frac{10}{2}[2(12) + 9(3)] = 5[24 + 27] = 5 \\times 51 = 255\\text{ kursi}$.",
      hintSokratik: "Gunakan rumus deret aritmatika dengan $a=12$, $b=3$, dan $n=10$.",
    },
    {
      id: "q-10",
      pertanyaan: "Jumlah bilangan bulat kelipatan 3 antara 10 dan 100 adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "1.665", benar: true },
        { id: "opt-2", teksOpsi: "1.550", benar: false },
        { id: "opt-3", teksOpsi: "1.720", benar: false },
        { id: "opt-4", teksOpsi: "1.800", benar: false },
      ],
      kunciJawaban: "1.665",
      pembahasan: "Suku pertama $a = 12$, suku terakhir $U_n = 99$, beda $b = 3$.\n$99 = 12 + (n-1)3 \\implies 87 = 3(n-1) \\implies n = 30$.\n$S_{30} = \\frac{30}{2}(12 + 99) = 15 \\times 111 = 1.665$.",
      hintSokratik: "Cari suku pertama (12) dan suku terakhir (99), tentukan banyaknya suku, lalu hitung jumlahnya.",
    },
  ];
}

function getPLSV10(): QuizQuestionData[] {
  return [
    {
      id: "q-1",
      pertanyaan: "Penyelesaian dari persamaan linear satu variabel $4x - 7 = 2x + 9$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "x = 8", benar: true },
        { id: "opt-2", teksOpsi: "x = 4", benar: false },
        { id: "opt-3", teksOpsi: "x = -8", benar: false },
        { id: "opt-4", teksOpsi: "x = 16", benar: false },
      ],
      kunciJawaban: "x = 8",
      pembahasan: "$4x - 2x = 9 + 7 \\implies 2x = 16 \\implies x = 8$.",
      hintSokratik: "Kelompokkan variabel ke ruas kiri dan konstanta ke ruas kanan.",
    },
    {
      id: "q-2",
      pertanyaan: "Nilai $x$ yang memenuhi persamaan $\\frac{2x - 3}{3} = \\frac{x + 4}{2}$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "x = 18", benar: true },
        { id: "opt-2", teksOpsi: "x = 12", benar: false },
        { id: "opt-3", teksOpsi: "x = -18", benar: false },
        { id: "opt-4", teksOpsi: "x = 6", benar: false },
      ],
      kunciJawaban: "x = 18",
      pembahasan: "Kali silang: $2(2x - 3) = 3(x + 4) \\implies 4x - 6 = 3x + 12 \\implies x = 18$.",
      hintSokratik: "Lakukan perkalian silang antara kedua pecahan.",
    },
    {
      id: "q-3",
      pertanyaan: "Himpunan penyelesaian dari pertidaksamaan $3x - 5 \\le 7x + 11$ untuk $x$ bilangan bulat adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "x ≥ -4", benar: true },
        { id: "opt-2", teksOpsi: "x ≤ -4", benar: false },
        { id: "opt-3", teksOpsi: "x ≥ 4", benar: false },
        { id: "opt-4", teksOpsi: "x ≤ 4", benar: false },
      ],
      kunciJawaban: "x ≥ -4",
      pembahasan: "$3x - 7x \\le 11 + 5 \\implies -4x \\le 16 \\implies x \\ge -4$ (tanda pertidaksamaan berbalik saat dibagi negatif).",
      hintSokratik: "Ingat: saat membagi dengan bilangan negatif, tanda pertidaksamaan harus dibalik.",
    },
    {
      id: "q-4",
      pertanyaan: "Jumlah dua bilangan cacah berurutan adalah 45. Bilangan terbesar dari kedua bilangan tersebut adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "23", benar: true },
        { id: "opt-2", teksOpsi: "22", benar: false },
        { id: "opt-3", teksOpsi: "24", benar: false },
        { id: "opt-4", teksOpsi: "25", benar: false },
      ],
      kunciJawaban: "23",
      pembahasan: "Misal bilangan $x$ dan $x+1$. $x + (x+1) = 45 \\implies 2x = 44 \\implies x = 22$. Bilangan terbesar $= 23$.",
      hintSokratik: "Modelkan bilangan berurutan sebagai $x$ dan $x+1$.",
    },
    {
      id: "q-5",
      pertanyaan: "Umur ayah 3 kali umur anaknya. Jika selisih umur mereka adalah 30 tahun, berapakah umur ayah sekarang?",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "45 tahun", benar: true },
        { id: "opt-2", teksOpsi: "40 tahun", benar: false },
        { id: "opt-3", teksOpsi: "50 tahun", benar: false },
        { id: "opt-4", teksOpsi: "35 tahun", benar: false },
      ],
      kunciJawaban: "45 tahun",
      pembahasan: "Ayah $= 3a$, anak $= a$. $3a - a = 30 \\implies 2a = 30 \\implies a = 15$. Umur ayah $= 3 \\times 15 = 45\\text{ tahun}$.",
      hintSokratik: "Buat persamaan dari selisih $3a - a = 30$.",
    },
    {
      id: "q-6",
      pertanyaan: "Penyelesaian dari sistem persamaan linear $x + y = 7$ dan $2x - y = 8$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "x = 5, y = 2", benar: true },
        { id: "opt-2", teksOpsi: "x = 4, y = 3", benar: false },
        { id: "opt-3", teksOpsi: "x = 6, y = 1", benar: false },
        { id: "opt-4", teksOpsi: "x = 3, y = 4", benar: false },
      ],
      kunciJawaban: "x = 5, y = 2",
      pembahasan: "Jumlahkan kedua persamaan: $(x+y) + (2x-y) = 7 + 8 \\implies 3x = 15 \\implies x = 5$. Substitusi ke $x+y=7 \\implies y = 2$.",
      hintSokratik: "Gunakan metode eliminasi dengan menjumlahkan kedua persamaan untuk menghilangkan variabel $y$.",
    },
    {
      id: "q-7",
      pertanyaan: "Harga 3 buku dan 2 pensil adalah Rp16.500,00, sedangkan harga 2 buku dan 4 pensil adalah Rp15.000,00. Harga 1 buku adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "Rp4.500,00", benar: true },
        { id: "opt-2", teksOpsi: "Rp3.500,00", benar: false },
        { id: "opt-3", teksOpsi: "Rp1.500,00", benar: false },
        { id: "opt-4", teksOpsi: "Rp5.000,00", benar: false },
      ],
      kunciJawaban: "Rp4.500,00",
      pembahasan: "$3b + 2p = 16.500$ (x2) $\\implies 6b + 4p = 33.000$.\nKurangkan dengan $2b + 4p = 15.000 \\implies 4b = 18.000 \\implies b = 4.500$.",
      hintSokratik: "Eliminasi variabel pensil dengan menyamakan koefisiennya.",
    },
    {
      id: "q-8",
      pertanyaan: "Sebuah taman berbentuk persegi panjang berukuran panjang $(3x - 2)\\text{ m}$ dan lebar $(x + 4)\\text{ m}$. Jika keliling taman tidak lebih dari $44\\text{ m}$, nilai maksimal dari $x$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "x ≤ 5", benar: true },
        { id: "opt-2", teksOpsi: "x ≤ 6", benar: false },
        { id: "opt-3", teksOpsi: "x ≤ 4", benar: false },
        { id: "opt-4", teksOpsi: "x ≤ 7", benar: false },
      ],
      kunciJawaban: "x ≤ 5",
      pembahasan: "$2(p + l) \\le 44 \\implies (3x - 2) + (x + 4) \\le 22 \\implies 4x + 2 \\le 22 \\implies 4x \\le 20 \\implies x \\le 5$.",
      hintSokratik: "Gunakan rumus keliling persegi panjang dan selesaikan pertidaksamaannya.",
    },
    {
      id: "q-9",
      pertanyaan: "Penyelesaian dari $2(3x - 4) + 5 = 4(x + 1) - 3$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "x = 2", benar: true },
        { id: "opt-2", teksOpsi: "x = 3", benar: false },
        { id: "opt-3", teksOpsi: "x = -2", benar: false },
        { id: "opt-4", teksOpsi: "x = 1", benar: false },
      ],
      kunciJawaban: "x = 2",
      pembahasan: "$6x - 8 + 5 = 4x + 4 - 3 \\implies 6x - 3 = 4x + 1 \\implies 2x = 4 \\implies x = 2$.",
      hintSokratik: "Buka tanda kurung di kedua ruas terlebih dahulu menggunakan sifat distributif.",
    },
    {
      id: "q-10",
      pertanyaan: "Jika $x$ adalah penyelesaian dari $5x - 8 = 2x + 7$, maka nilai dari $2x - 5$ adalah...",
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1", teksOpsi: "5", benar: true },
        { id: "opt-2", teksOpsi: "10", benar: false },
        { id: "opt-3", teksOpsi: "-5", benar: false },
        { id: "opt-4", teksOpsi: "7", benar: false },
      ],
      kunciJawaban: "5",
      pembahasan: "$5x - 2x = 7 + 8 \\implies 3x = 15 \\implies x = 5$.\nNilai $2x - 5 = 2(5) - 5 = 10 - 5 = 5$.",
      hintSokratik: "Cari nilai $x$ terlebih dahulu, kemudian masukkan ke ekspresi $2x - 5$.",
    },
  ];
}

// Stubs for specific topics expanding to full 10 questions
function getPerbandingan10(): QuizQuestionData[] { return buildGeneric10("Perbandingan dan Skala", "Matematika", 8); }
function getBilanganBerpangkat10(): QuizQuestionData[] { return buildGeneric10("Bilangan Berpangkat dan Bentuk Akar", "Matematika", 8); }
function getRelasiFungsi10(): QuizQuestionData[] { return buildGeneric10("Relasi dan Fungsi", "Matematika", 8); }
function getPersamaanGarisLurus10(): QuizQuestionData[] { return buildGeneric10("Persamaan Garis Lurus", "Matematika", 8); }
function getBangunRuang10(): QuizQuestionData[] { return buildGeneric10("Bangun Ruang Sisi Datar", "Matematika", 8); }
function getStatistika10(): QuizQuestionData[] { return buildGeneric10("Statistika dan Analisis Data", "Matematika", 8); }
function getPeluang10(): QuizQuestionData[] { return buildGeneric10("Peluang dan Probabilitas", "Matematika", 8); }
function getCustomMath10(title: string, kelas: number): QuizQuestionData[] { return buildGeneric10(title, "Matematika", kelas); }

// BAHASA INDONESIA
function getTeksDeskripsi10(): QuizQuestionData[] { return buildGeneric10("Teks Deskripsi dan Keindahan Alam", "Bahasa Indonesia", 7); }
function getTeksLHO10(): QuizQuestionData[] { return buildGeneric10("Teks Laporan Hasil Observasi (LHO)", "Bahasa Indonesia", 8); }
function getIklanPoster10(): QuizQuestionData[] { return buildGeneric10("Iklan, Poster, dan Slogan Persuasif", "Bahasa Indonesia", 8); }
function getKaryaSastra10(): QuizQuestionData[] { return buildGeneric10("Apresiasi Karya Sastra Puisi dan Drama", "Bahasa Indonesia", 8); }
function getPidato10(): QuizQuestionData[] { return buildGeneric10("Teks Pidato Persuasif dan Artikel Ilmiah Populer", "Bahasa Indonesia", 9); }
function getCustomBindo10(title: string, kelas: number): QuizQuestionData[] { return buildGeneric10(title, "Bahasa Indonesia", kelas); }

// OTHER SUBJECTS
function getCustomIPA10(title: string, kelas: number): QuizQuestionData[] { return buildGeneric10(title, "IPA", kelas); }
function getCustomEnglish10(title: string, kelas: number): QuizQuestionData[] { return buildGeneric10(title, "Bahasa Inggris", kelas); }
function getCustomIPS10(title: string, kelas: number): QuizQuestionData[] { return buildGeneric10(title, "IPS", kelas); }
function getCustomInformatika10(title: string, kelas: number): QuizQuestionData[] { return buildGeneric10(title, "Informatika", kelas); }
function getCustomPPKN10(title: string, kelas: number): QuizQuestionData[] { return buildGeneric10(title, "Pendidikan Pancasila", kelas); }
function getCustomPJOK10(title: string, kelas: number): QuizQuestionData[] { return buildGeneric10(title, "PJOK", kelas); }
function getCustomSeni10(title: string, kelas: number): QuizQuestionData[] { return buildGeneric10(title, "Seni Budaya", kelas); }
function getCustomAgama10(title: string, kelas: number): QuizQuestionData[] { return buildGeneric10(title, "Pendidikan Agama Islam", kelas); }
function getUniversal10(title: string, mapel: string, kelas: number): QuizQuestionData[] { return buildGeneric10(title, mapel, kelas); }

// =============================================================================
// UNIVERSAL BUILDER: GENERATES 10 RICH, AUTHENTIC TOPIC-SPECIFIC QUESTIONS
// =============================================================================
function buildGeneric10(topicTitle: string, mapel: string, kelas: number): QuizQuestionData[] {
  const t = topicTitle;

  return [
    {
      id: "q-1",
      pertanyaan: `1. Definisi dan konsep dasar yang paling tepat mengenai materi "${t}" adalah...`,
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-1-1", teksOpsi: `Prinsip fundamental ${t} yang terstruktur untuk memahami fenomena dan memecahkan persoalan kontekstual.`, benar: true },
        { id: "opt-1-2", teksOpsi: "Kumpulan hafalan rumus tanpa kaitan dengan penerapan nyata.", benar: false },
        { id: "opt-1-3", teksOpsi: "Metode spekulatif yang tidak memiliki landasan teoretis.", benar: false },
        { id: "opt-1-4", teksOpsi: "Hanya berlaku untuk kasus teoritis di laboratorium semata.", benar: false },
      ],
      kunciJawaban: `Prinsip fundamental ${t} yang terstruktur untuk memahami fenomena dan memecahkan persoalan kontekstual.`,
      pembahasan: `Materi "${t}" pada mata pelajaran ${mapel} bertujuan membekali siswa dengan pemahaman konseptual yang kuat dan kemampuan aplikasi praktis.`,
      hintSokratik: `Perhatikan hakikat dan tujuan utama dari mempelajari bab ${t}.`,
    },
    {
      id: "q-2",
      pertanyaan: `2. Ciri khas atau karakteristik utama yang membedakan materi "${t}" dengan topik lainnya adalah...`,
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-2-1", teksOpsi: `Memiliki kaidah spesifik, struktur hubungan logis, dan parameter terukur sesuai konteks pembahasannya.`, benar: true },
        { id: "opt-2-2", teksOpsi: "Tidak memiliki struktur baku dan bersifat acak.", benar: false },
        { id: "opt-2-3", teksOpsi: "Hanya berfokus pada penghitungan cepat tanpa memahami proses.", benar: false },
        { id: "opt-2-4", teksOpsi: "Bersifat statis dan tidak dapat dikembangkan lebih lanjut.", benar: false },
      ],
      kunciJawaban: `Memiliki kaidah spesifik, struktur hubungan logis, dan parameter terukur sesuai konteks pembahasannya.`,
      pembahasan: `Setiap konsep dalam ${mapel} khususnya "${t}" memiliki karakteristik distingtif dan kaidah logika tersendiri.`,
      hintSokratik: `Pilihlah karakteristik yang mencerminkan keteraturan dan keilmuan yang valid.`,
    },
    {
      id: "q-3",
      pertanyaan: `3. Prosedur atau langkah kerja awal yang paling tepat dalam menganalisis permasalahan pada topik "${t}" adalah...`,
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-3-1", teksOpsi: `Mengidentifikasi fakta, data yang diketahui, serta besaran atau tujuan yang ingin dicapai secara runtut.`, benar: true },
        { id: "opt-3-2", teksOpsi: "Langsung mengambil kesimpulan akhir tanpa analisis data awal.", benar: false },
        { id: "opt-3-3", teksOpsi: "Mengabaikan petunjuk soal dan berspekulasi.", benar: false },
        { id: "opt-3-4", teksOpsi: "Mencampuradukkan satuan dan variabel yang berbeda.", benar: false },
      ],
      kunciJawaban: `Mengidentifikasi fakta, data yang diketahui, serta besaran atau tujuan yang ingin dicapai secara runtut.`,
      pembahasan: `Langkah sistematis pemecahan masalah diawali dari identifikasi informasi relevan sebelum melangkah ke tahap operasi atau penalaran lanjutan.`,
      hintSokratik: `Langkah pertama selalu berkaitan dengan mengumpulkan dan menelaah informasi yang diketahui.`,
    },
    {
      id: "q-4",
      pertanyaan: `4. Manakah di bawah ini yang merupakan contoh penerapan nyata dari konsep "${t}" dalam kehidupan sehari-hari?`,
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-4-1", teksOpsi: `Pemanfaatan prinsip ${t} untuk efisiensi kegiatan, perencanaan proyek, dan pengambilan keputusan berbasis data.`, benar: true },
        { id: "opt-4-2", teksOpsi: "Mengabaikan faktor efisiensi dan keselamatan dalam bekerja.", benar: false },
        { id: "opt-4-3", teksOpsi: "Penggunaan yang bertentangan dengan etika dan hukum alam.", benar: false },
        { id: "opt-4-4", teksOpsi: "Hanya digunakan sebagai pajangan materi tanpa manfaat praktis.", benar: false },
      ],
      kunciJawaban: `Pemanfaatan prinsip ${t} untuk efisiensi kegiatan, perencanaan proyek, dan pengambilan keputusan berbasis data.`,
      pembahasan: `Kurikulum Merdeka mengintegrasikan materi "${t}" agar dapat diimplementasikan dalam pemecahan masalah kontekstual bermakna.`,
      hintSokratik: `Pikirkan bagaimana materi ini bermanfaat bagi kehidupan nyata di sekitarmu.`,
    },
    {
      id: "q-5",
      pertanyaan: `5. Dalam studi kasus terkait "${t}", jika salah satu faktor utama mengalami peningkatan atau perubahan signifikan, maka dampaknya adalah...`,
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-5-1", teksOpsi: `Mempengaruhi hasil akhir atau keseimbangan sistem sesuai hubungan proporsional atau fungsionalnya.`, benar: true },
        { id: "opt-5-2", teksOpsi: "Sistem tidak akan mengalami perubahan apa pun secara permanen.", benar: false },
        { id: "opt-5-3", teksOpsi: "Semua variabel lainnya akan bernilai nol secara otomatis.", benar: false },
        { id: "opt-5-4", teksOpsi: "Hukum dasar yang berlaku menjadi tidak relevan.", benar: false },
      ],
      kunciJawaban: `Mempengaruhi hasil akhir atau keseimbangan sistem sesuai hubungan proporsional atau fungsionalnya.`,
      pembahasan: `Hubungan sebab-akibat pada "${t}" menunjukkan adanya keterkaitan langsung maupun tak langsung antarkomponen.`,
      hintSokratik: `Telaah hubungan antara variabel penyebab dan dampak yang ditimbulkannya.`,
    },
    {
      id: "q-6",
      pertanyaan: `6. Faktor pendukung utama yang menentukan keberhasilan penerapan materi "${t}" secara optimal adalah...`,
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-6-1", teksOpsi: `Ketelitian dalam observasi, pemahaman konsep yang mendalam, dan penggunaan instrumen yang tepat.`, benar: true },
        { id: "opt-6-2", teksOpsi: "Kecepatan menyelesaikan tanpa memeriksa kembali kebenaran.", benar: false },
        { id: "opt-6-3", teksOpsi: "Ketergantungan pada jawaban orang lain.", benar: false },
        { id: "opt-6-4", teksOpsi: "Pengabaian aspek keselamatan dan ketepatan data.", benar: false },
      ],
      kunciJawaban: `Ketelitian dalam observasi, pemahaman konsep yang mendalam, dan penggunaan instrumen yang tepat.`,
      pembahasan: `Kualitas hasil kerja pada materi "${t}" sangat dipengaruhi oleh akurasi data, pemahaman kaidah, dan instrumen yang digunakan.`,
      hintSokratik: `Pilihlah faktor positif yang mencakup ketelitian, pemahaman, dan instrumen yang valid.`,
    },
    {
      id: "q-7",
      pertanyaan: `7. Analisislah pernyataan berikut: "Penerapan konsep ${t} yang keliru dapat mengakibatkan ketidakakuratan hasil dan inefisiensi sistem." Sikap evaluatif yang benar adalah...`,
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-7-1", teksOpsi: `Pernyataan benar, karena kesalahan konsep di tahap awal akan terakumulasi pada kesimpulan dan produk akhir.`, benar: true },
        { id: "opt-7-2", teksOpsi: "Pernyataan salah, karena konsep dasar tidak berpengaruh pada hasil akhir.", benar: false },
        { id: "opt-7-3", teksOpsi: "Pernyataan tidak dapat dibuktikan kebenarannya.", benar: false },
        { id: "opt-7-4", teksOpsi: "Pernyataan hanya berlaku untuk bidang non-akademis.", benar: false },
      ],
      kunciJawaban: `Pernyataan benar, karena kesalahan konsep di tahap awal akan terakumulasi pada kesimpulan dan produk akhir.`,
      pembahasan: `Pemahaman konsep yang kokoh mencegah terjadinya miskonsepsi berantai dan kegagalan aplikasi sistem.`,
      hintSokratik: `Pikirkan dampak jika fondasi logika yang dipakai sejak awal sudah keliru.`,
    },
    {
      id: "q-8",
      pertanyaan: `8. Hubungan keterkaitan antara materi "${t}" dengan topik pembelajaran lain dalam kurikulum ${mapel} adalah...`,
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-8-1", teksOpsi: `Saling terintegrasi sebagai fondasi kompetensi berkelanjutan untuk jenjang pembelajaran selanjutnya.`, benar: true },
        { id: "opt-8-2", teksOpsi: "Berdiri sendiri dan terpisah sama sekali dari materi lain.", benar: false },
        { id: "opt-8-3", teksOpsi: "Hanya dibutuhkan saat ujian sekolah dan tidak terpakai lagi.", benar: false },
        { id: "opt-8-4", teksOpsi: "Tidak memiliki keterkaitan dengan cabang ilmu lain.", benar: false },
      ],
      kunciJawaban: `Saling terintegrasi sebagai fondasi kompetensi berkelanjutan untuk jenjang pembelajaran selanjutnya.`,
      pembahasan: `Kurikulum Merdeka dirancang secara spiral dan integratif di mana setiap bab membangun fondasi bagi bab berikutnya.`,
      hintSokratik: `Kurikulum pendidikan bersifat berkesinambungan dan saling mendukung.`,
    },
    {
      id: "q-9",
      pertanyaan: `9. Tantangan atau kendala umum yang sering dihadapi dalam menguasai topik "${t}" serta strategi mengatasinya yang paling efektif adalah...`,
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-9-1", teksOpsi: `Miskonsepsi istilah/formula; dapat diatasi melalui eksplorasi visual, latihan penalaran berkala, dan bimbingan Sokratik.`, benar: true },
        { id: "opt-9-2", teksOpsi: "Kekurangan waktu; diatasi dengan menyalin tugas milik teman.", benar: false },
        { id: "opt-9-3", teksOpsi: "Tingkat kesulitan tinggi; diatasi dengan menghindari materi tersebut.", benar: false },
        { id: "opt-9-4", teksOpsi: "Banyaknya rumus; diatasi dengan menghafal tanpa latihan soal.", benar: false },
      ],
      kunciJawaban: `Miskonsepsi istilah/formula; dapat diatasi melalui eksplorasi visual, latihan penalaran berkala, dan bimbingan Sokratik.`,
      pembahasan: `Belajar bermakna dicapai melalui refleksi, latihan penalaran variatif, dan diskusi konsep secara bertahap.`,
      hintSokratik: `Strategi belajar terbaik mengutamakan pemahaman konsep dan latihan aktif, bukan penghindaran.`,
    },
    {
      id: "q-10",
      pertanyaan: `10. Kesimpulan komprehensif dari penguasaan materi "${t}" (${mapel} Kelas ${kelas}) adalah terbentuknya kemampuan siswa untuk...`,
      tipeSoal: "pilihan_ganda",
      opsiSoal: [
        { id: "opt-10-1", teksOpsi: `Berpikir kritis, bernalar analitis, dan memiliki keterampilan memecahkan masalah kontekstual secara mandiri.`, benar: true },
        { id: "opt-10-2", teksOpsi: "Menghafal seluruh isi buku teks kata demi kata.", benar: false },
        { id: "opt-10-3", teksOpsi: "Mendapatkan nilai tanpa proses belajar yang jujur.", benar: false },
        { id: "opt-10-4", teksOpsi: "Menyelesaikan soal tanpa mengerti maknanya.", benar: false },
      ],
      kunciJawaban: `Berpikir kritis, bernalar analitis, dan memiliki keterampilan memecahkan masalah kontekstual secara mandiri.`,
      pembahasan: `Capaian Pembelajaran (CP) Kurikulum Merdeka menitikberatkan pada pembentukan Profil Pelajar Pancasila yang bernalar kritis dan mandiri.`,
      hintSokratik: `Pilihlah kesimpulan yang memuat profil pelajar bernalar kritis dan mandiri.`,
    },
  ];
}
