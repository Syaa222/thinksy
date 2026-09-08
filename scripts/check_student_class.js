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
  const profilCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'profil' 
    ORDER BY ordinal_position;
  `);
  console.log('Profil columns:', profilCols.rows);

  const profilData = await client.query(`SELECT * FROM profil LIMIT 10;`);
  console.log('Profil data:', profilData.rows);

  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('All public tables:', tablesRes.rows.map(r => r.table_name));

  await client.end();
}
check();
