const { Client } = require('pg');
const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mtpnbviztquitgszrfel',
  password: 'programermudaindonesia',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT m.id, m.bab_id, m.judul, m.urutan, length(m.konten_markdown) as len, b.judul as bab_judul, b.mapel
    FROM materi m
    JOIN bab b ON b.id = m.bab_id
    WHERE b.mapel IN ('Matematika', 'Bahasa Inggris', 'Bahasa Indonesia') AND b.kelas = 8
    ORDER BY b.mapel, b.urutan, m.urutan
    LIMIT 10
  `);
  console.log('Sample materi for Kelas 8:', res.rows);
  await client.end();
}
check().catch(console.error);
