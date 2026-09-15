const { Client } = require('pg');
const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mtpnbviztquitgszrfel',
  password: 'programermudaindonesia',
  ssl: { rejectUnauthorized: false }
});

async function inspect() {
  await client.connect();
  const tables = ['sekolah', 'profil', 'kelas', 'anggota_kelas', 'bab', 'materi', 'presensi', 'ujian', 'misi_harian', 'notifikasi'];
  for (const t of tables) {
    const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${t}'`);
    console.log('=== TABLE:', t, '===');
    console.log(cols.rows.map(r => r.column_name + ' (' + r.data_type + ')').join(', '));
    const count = await client.query(`SELECT COUNT(*) FROM ${t}`);
    console.log('Row count:', count.rows[0].count);
    const sample = await client.query(`SELECT * FROM ${t} LIMIT 2`);
    console.log('Sample rows:', JSON.stringify(sample.rows, null, 2));
  }
  await client.end();
}
inspect().catch(console.error);
