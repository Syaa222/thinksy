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
    SELECT id, email, encrypted_password 
    FROM auth.users 
    LIMIT 5;
  `);
  console.log(res.rows);
  await client.end();
}
check().catch(console.error);
