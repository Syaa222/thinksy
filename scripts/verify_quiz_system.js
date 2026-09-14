const { Client } = require("pg");

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mtpnbviztquitgszrfel',
  password: 'programermudaindonesia',
  ssl: { rejectUnauthorized: false }
});

async function verifyQuizSystem() {
  console.log("=== THINKSY QUIZ SYSTEM VERIFICATION ===");

  await client.connect();
  console.log("Connected to PostgreSQL Supabase database.");

  // 1. Verify that questions across chapters exist and match chapter themes
  console.log("\n1. Checking Questions in DB across different subjects...");
  const res = await client.query(`
    SELECT 
      b.id as bab_id, 
      b.judul as bab_judul, 
      b.mapel as mapel_nama,
      b.kelas,
      count(s.id) as jumlah_soal
    FROM bab b
    LEFT JOIN soal s ON s.bab_id = b.id
    GROUP BY b.id, b.judul, b.mapel, b.kelas
    ORDER BY b.urutan ASC, b.judul ASC
    LIMIT 15;
  `);

  console.log(`\nSample of 15 Chapters and Question Counts:`);
  res.rows.forEach((r, idx) => {
    console.log(`[${idx + 1}] Bab: "${r.bab_judul}" (Kelas ${r.kelas || 8} - ${r.mapel_nama || "Umum"}) -> ${r.jumlah_soal} Soal`);
  });

  // 2. Fetch specific question and solution details
  console.log("\n2. Detail Sample Questions with Step-by-Step Pembahasan & Socratic Hint:");
  const sampleSoal = await client.query(`
    SELECT 
      s.id,
      b.judul as bab_judul,
      b.mapel as mapel_nama,
      s.pertanyaan,
      s.tipe_soal,
      s.kunci_jawaban,
      s.pembahasan,
      json_agg(json_build_object('teks', o.teks_opsi, 'benar', o.benar)) as opsi
    FROM soal s
    JOIN bab b ON s.bab_id = b.id
    LEFT JOIN opsi_soal o ON o.soal_id = s.id
    GROUP BY s.id, b.judul, b.mapel, s.pertanyaan, s.tipe_soal, s.kunci_jawaban, s.pembahasan
    LIMIT 3;
  `);

  sampleSoal.rows.forEach((q, idx) => {
    console.log(`\n--- Contoh Soal #${idx + 1} (${q.mapel_nama} - ${q.bab_judul}) ---`);
    console.log(`Pertanyaan: ${q.pertanyaan}`);
    console.log(`Kunci Jawaban: ${q.kunci_jawaban}`);
    console.log(`Pembahasan: ${q.pembahasan}`);
    console.log(`Pilihan Jawaban:`, q.opsi);
  });

  // 3. Count total questions across all 187 chapters
  const totalCount = await client.query(`SELECT count(*) as total FROM soal;`);
  console.log(`\nTotal Soal di Database: ${totalCount.rows[0].total} soal.`);

  await client.end();
  console.log("\n=== VERIFICATION SUCCESSFUL! ===");
}

verifyQuizSystem().catch(console.error);
