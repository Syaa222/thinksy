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

  const babRes = await client.query(`
    SELECT id, judul FROM bab 
    WHERE judul ILIKE '%pola%' OR judul ILIKE '%aljabar%' OR judul ILIKE '%pythagoras%'
    LIMIT 2
  `);

  let soalRes = { rows: [] };
  if (babRes.rows.length > 0) {
    soalRes = await client.query(`
      SELECT id, pertanyaan, tipe_soal, status_soal 
      FROM soal 
      WHERE bab_id = $1 
      LIMIT 2
    `, [babRes.rows[0].id]);
  }

  const latestSesi = await client.query(`
    SELECT id, tipe_sesi, status_sesi FROM sesi ORDER BY mulai_pada DESC LIMIT 2
  `);

  console.log('BAB:', babRes.rows);
  console.log('SOAL:', soalRes.rows);
  console.log('SESI:', latestSesi.rows);

  await client.end();
}

run().catch(console.error);
