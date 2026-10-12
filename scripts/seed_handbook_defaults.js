const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mtpnbviztquitgszrfel',
  password: 'programermudaindonesia',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // 1. Populate label on opsi_soal
  const res1 = await client.query(`
    UPDATE opsi_soal
    SET label = CASE COALESCE(urutan, 1)
      WHEN 1 THEN 'A'
      WHEN 2 THEN 'B'
      WHEN 3 THEN 'C'
      WHEN 4 THEN 'D'
      ELSE 'E'
    END
    WHERE label IS NULL;
  `);
  console.log('Updated opsi_soal labels:', res1.rowCount);

  // 2. Populate default alasan_salah for false options where null
  const res2 = await client.query(`
    UPDATE opsi_soal
    SET alasan_salah = 'Miskonsepsi pada pemahaman definisi konsep atau kekeliruan langkah perhitungan awal.'
    WHERE benar = false AND (alasan_salah IS NULL OR alasan_salah = '');
  `);
  console.log('Updated opsi_soal alasan_salah:', res2.rowCount);

  // 3. Populate default rubrik for esai questions where null
  const res3 = await client.query(`
    UPDATE soal
    SET rubrik = '[
      {"kriteria": "Pemahaman Konsep & Rumus", "bobot": 40, "deskriptor": "Mampu mengidentifikasi rumus dan konsep matematika yang relevan."},
      {"kriteria": "Langkah Perhitungan / Pembuktian", "bobot": 40, "deskriptor": "Langkah-langkah sistematis, perhitungan akurat dan terbukti."},
      {"kriteria": "Kesimpulan Akhir & Notasi", "bobot": 20, "deskriptor": "Menyajikan jawaban akhir dengan satuan/notasi matematika yang tepat."}
    ]'::jsonb
    WHERE tipe_soal = 'esai' AND (rubrik IS NULL OR rubrik = '[]'::jsonb);
  `);
  console.log('Updated soal rubrik for esai:', res3.rowCount);

  await client.end();
}

run().catch(console.error);
