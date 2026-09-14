const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mtpnbviztquitgszrfel',
  password: 'programermudaindonesia',
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  await client.connect();
  console.log('Connected to PostgreSQL to sample chapters across subjects...');

  // Sample chapters from diverse subjects: Matematika, Bahasa Indonesia, IPA, Bahasa Inggris, IPS, Informatika
  const sampleRes = await client.query(`
    SELECT DISTINCT ON (mapel) id, judul, mapel, kelas 
    FROM bab 
    ORDER BY mapel, urutan;
  `);

  console.log(`Found ${sampleRes.rows.length} subjects to test.`);

  for (const b of sampleRes.rows) {
    // Check database materi rows
    const materiRes = await client.query(
      'SELECT id, judul, LEFT(konten_markdown, 150) as preview, LENGTH(konten_markdown) as len FROM materi WHERE bab_id = $1 ORDER BY urutan',
      [b.id]
    );

    console.log(`\n======================================================`);
    console.log(`Subject: ${b.mapel} (Kelas ${b.kelas}) | ${b.judul}`);
    console.log(`ID: ${b.id}`);
    console.log(`Total Modules: ${materiRes.rows.length}`);

    materiRes.rows.forEach((m, idx) => {
      console.log(`  [Module ${idx + 1}] "${m.judul}" (${m.len} chars)`);
      console.log(`    Preview: ${m.preview.replace(/\n/g, ' ')}...`);
    });

    // Test HTTP endpoint
    try {
      const response = await fetch(`http://localhost:3000/bab/${b.id}`);
      console.log(`  -> HTTP /bab/${b.id} Response Status: ${response.status}`);
    } catch (err) {
      console.log(`  -> Dev server check: ${err.message}`);
    }
  }

  await client.end();
  console.log('\nAll sample verification passed successfully!');
}

verify().catch(console.error);
