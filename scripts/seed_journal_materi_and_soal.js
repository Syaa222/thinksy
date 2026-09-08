const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mtpnbviztquitgszrfel',
  password: 'programermudaindonesia',
  ssl: { rejectUnauthorized: false }
});

async function seedMateriAndSoal() {
  try {
    await client.connect();
    console.log('Connected to DB for seeding journal materi & questions...');

    // Fetch all Class 8 Matematika & other chapters
    const babsRes = await client.query(`
      SELECT id, judul, mapel, kelas, urutan 
      FROM bab 
      ORDER BY kelas, mapel, urutan;
    `);

    console.log(`Found ${babsRes.rows.length} total chapters.`);

    for (const b of babsRes.rows) {
      // Check if materi already exists
      const existingMateri = await client.query('SELECT id FROM materi WHERE bab_id = $1', [b.id]);
      if (existingMateri.rows.length === 0) {
        // Generate 3 rich modules per chapter
        const mod1Judul = `Konsep Dasar & Tujuan Pembelajaran: ${b.judul.replace(/Bab \d+:\s*/, '')}`;
        const mod1Content = `## 📖 Jurnal Pembelajaran: ${b.judul}

### 🎯 Tujuan Pembelajaran
Pada bagian ini, kamu akan diajak untuk:
1. Memahami konsep fundamental mengenai **${b.judul.replace(/Bab \d+:\s*/, '')}** sesuai Capaian Pembelajaran Kurikulum Merdeka Fase D.
2. Mengidentifikasi hubungan antara konsep matematis dengan fenomena sehari-hari.
3. Melatih kemampuan penalaran logis, analitis, dan representasi matematis.

---

### 💡 Apersepsi & Pengantar Kontekstual
Pernahkah kamu memperhatikan bagaimana pola keteraturan terjadi di alam semesta? Dari susunan kelopak bunga matahari, arsitektur jembatan gantung, hingga kalkulasi algoritma kecerdasan buatan, semuanya berakar pada prinsip keteraturan dan persamaan matematis.

> **Catatan Inspiratif**: Matematika bukan sekadar menghafal rumus, melainkan bahasa universal untuk memecahkan masalah nyata dan memahami pola di sekitar kita.

---

### 🔍 Istilah Kunci (Glossary)
- **Variabel**: Simbol (biasanya huruf seperti $x$, $y$, atau $n$) yang mewakili nilai yang belum diketahui.
- **Koefisien**: Faktor pengali bilangan di depan suatu variabel.
- **Konstanta**: Suku yang bernilai tetap dan tidak memuat variabel.
- **Gradien ($m$)**: Tingkat kemiringan garis lurus terhadap sumbu horizontal.`;

        const mod2Judul = `Eksplorasi Teorema & Contoh Soal Terbimbing`;
        const mod2Content = `## 📐 Eksplorasi Rumus & Contoh Penyelesaian

### 📚 Pendalaman Materi & Rumus Inti
Mari kita telaah struktur persamaan dan dalil matematis utama pada topik ini:

$$\\begin{aligned}
y &= mx + c \\\\[6pt]
c^2 &= a^2 + b^2 \\\\[6pt]
U_n &= a + (n-1)b
\\end{aligned}$$

#### Penjelasan Komponen:
1. **Suku Pertama ($a$ / $U_1$)**: Titik tolak awal dari suatu deret atau barisan bilangan teratur.
2. **Beda ($b$)**: Selisih konstan antara dua suku yang berurutan ($b = U_{n} - U_{n-1}$).
3. **Persamaan Garis Lurus**: Hubungan linier antara variabel terikat $y$ dan variabel bebas $x$ dengan gradien kemiringan $m$.

---

### ✏️ Contoh Soal & Pembahasan Bertahap

**Soal Latihan 1**:
Tentukan suku ke-$15$ ($U_{15}$) dari barisan bilangan aritmetika berikut: $3, 7, 11, 15, 19, \\dots$

**Langkah-langkah Penyelesaian**:
- **Langkah 1**: Identifikasi suku pertama ($a = 3$) dan beda ($b = 7 - 3 = 4$).
- **Langkah 2**: Gunakan rumus umum suku ke-$n$:
  $$U_n = a + (n-1)b$$
- **Langkah 3**: Substitusikan nilai $n = 15$:
  $$U_{15} = 3 + (15 - 1) \\times 4 = 3 + (14 \\times 4) = 3 + 56 = 59$$

**Kesimpulan**: Jadi, suku ke-15 dari barisan tersebut adalah **$59$**.`;

        const mod3Judul = `Studi Kasus Kontekstual & Refleksi Pembelajaran`;
        const mod3Content = `## 🌟 Penerapan Nyata & Refleksi Belajar

### 🏗️ Studi Kasus Dunia Nyata
Sebuah perusahaan penyedia layanan transportasi online menerapkan tarif dasar sebesar $\\text{Rp}10.000$ untuk biaya awal perjalanan dan $\\text{Rp}3.000$ per kilometer berikutnya.

Jika fungsi biaya perjalanan $f(x)$ dalam rupiah dirumuskan sebagai:
$$f(x) = 3.000x + 10.000$$
di mana $x$ menyatakan jarak tempuh dalam kilometer:
- Berapakah tarif yang harus dibayar seorang penumpang yang menempuh jarak $12\\text{ km}$?
- **Penyelesaian**:
  $$f(12) = 3.000(12) + 10.000 = 36.000 + 10.000 = \\text{Rp}46.000$$

---

### 🧠 Refleksi Diri (Self-Assessment)
Setelah menyelesaikan pembelajaran modul ini, tanyakan pada dirimu:
- [x] Apakah saya sudah memahami definisi dasar dan rumus umum bab ini?
- [x] Bisakah saya menjelaskan langkah penyelesaian kepada teman sebangku?
- [ ] Bagian mana yang masih membuat saya ragu atau membutuhkan latihan tambahan?

> **Tips Belajar**: Gunakan fitur **Stabilo (Highlighter)** untuk menandai kalimat penting dan tombol **+ (Floating Hub)** untuk mencatat hal-hal yang ingin kamu tanyakan kepada guru atau AI Tutor!`;

        const m1 = await client.query(
          `INSERT INTO materi (bab_id, judul, konten_markdown, urutan) VALUES ($1, $2, $3, 1) RETURNING id;`,
          [b.id, mod1Judul, mod1Content]
        );
        const m2 = await client.query(
          `INSERT INTO materi (bab_id, judul, konten_markdown, urutan) VALUES ($1, $2, $3, 2) RETURNING id;`,
          [b.id, mod2Judul, mod2Content]
        );
        const m3 = await client.query(
          `INSERT INTO materi (bab_id, judul, konten_markdown, urutan) VALUES ($1, $2, $3, 3) RETURNING id;`,
          [b.id, mod3Judul, mod3Content]
        );

        // Also seed 3 high-quality questions in soal & opsi_soal
        const q1 = await client.query(
          `INSERT INTO soal (bab_id, materi_id, pertanyaan, tipe_soal, tingkat_soal, status_soal, kunci_jawaban, pembahasan)
           VALUES ($1, $2, $3, 'pilihan_ganda', 'sedang', 'dipublikasi', 'A', $4) RETURNING id;`,
          [
            b.id,
            m1.rows[0].id,
            `Diberikan barisan aritmetika dengan suku pertama $a = 4$ dan beda $b = 5$. Berapakah nilai suku ke-10 ($U_{10}$)?`,
            `Gunakan rumus $U_n = a + (n-1)b$. Maka $U_{10} = 4 + (10-1) \\times 5 = 4 + 45 = 49$.`
          ]
        );

        await client.query(`
          INSERT INTO opsi_soal (soal_id, teks_opsi, benar, urutan) VALUES
          ($1, '49', true, 1),
          ($1, '45', false, 2),
          ($1, '54', false, 3),
          ($1, '50', false, 4);
        `, [q1.rows[0].id]);

        const q2 = await client.query(
          `INSERT INTO soal (bab_id, materi_id, pertanyaan, tipe_soal, tingkat_soal, status_soal, kunci_jawaban, pembahasan)
           VALUES ($1, $2, $3, 'pilihan_ganda', 'sedang', 'dipublikasi', 'C', $4) RETURNING id;`,
          [
            b.id,
            m2.rows[0].id,
            `Persamaan garis lurus yang melalui titik $(0, 4)$ dengan gradien $m = 3$ adalah...`,
            `Persamaan garis dengan gradien $m$ dan titik potong sumbu-y $(0, c)$ adalah $y = mx + c$. Dengan $m = 3$ dan $c = 4$, diperoleh $y = 3x + 4$.`
          ]
        );

        await client.query(`
          INSERT INTO opsi_soal (soal_id, teks_opsi, benar, urutan) VALUES
          ($1, 'y = 4x + 3', false, 1),
          ($1, 'y = 3x - 4', false, 2),
          ($1, 'y = 3x + 4', true, 3),
          ($1, 'y = -3x + 4', false, 4);
        `, [q2.rows[0].id]);

        const q3 = await client.query(
          `INSERT INTO soal (bab_id, materi_id, pertanyaan, tipe_soal, tingkat_soal, status_soal, kunci_jawaban, pembahasan)
           VALUES ($1, $2, $3, 'esai', 'sedang', 'dipublikasi', 'Panjang sisi miring adalah 10 cm.', $4) RETURNING id;`,
          [
            b.id,
            m3.rows[0].id,
            `Sebuah segitiga siku-siku memiliki panjang sisi siku-siku $a = 6\\text{ cm}$ dan $b = 8\\text{ cm}$. Hitunglah panjang sisi miringnya ($c$) dan jelaskan langkah pembuktiannya!`,
            `Berdasarkan Teorema Pythagoras: $c^2 = a^2 + b^2 = 6^2 + 8^2 = 36 + 64 = 100$, sehingga $c = \\sqrt{100} = 10\\text{ cm}$.`
          ]
        );
      }
    }

    const mCount = await client.query('SELECT COUNT(*) FROM materi');
    const sCount = await client.query('SELECT COUNT(*) FROM soal');
    console.log(`Seeding complete! Total materi: ${mCount.rows[0].count}, Total soal: ${sCount.rows[0].count}`);
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await client.end();
  }
}

seedMateriAndSoal();
