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
  console.log('Connected to database.');
  await client.query('ALTER TABLE profil ADD COLUMN IF NOT EXISTS jenis_kelamin text;');
  await client.query('ALTER TABLE profil ADD COLUMN IF NOT EXISTS tempat_lahir text;');
  await client.query('ALTER TABLE profil ADD COLUMN IF NOT EXISTS tanggal_lahir text;');
  await client.query('ALTER TABLE profil ADD COLUMN IF NOT EXISTS no_wa text;');
  
  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'profil' 
    ORDER BY ordinal_position;
  `);
  console.log('Updated profil columns:', cols.rows.map(c => c.column_name));
  await client.end();
}

run().catch(console.error);

