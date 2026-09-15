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
    SELECT id, mapel, kelas, urutan, judul 
    FROM bab 
    WHERE mapel IN ('Matematika', 'Bahasa Inggris', 'Bahasa Indonesia') AND kelas = 8 
    ORDER BY mapel, urutan
  `);
  console.log('Kelas 8 Bab count:', res.rows.length);
  console.log(res.rows);
  await client.end();
}
check().catch(console.error);
