const { Client } = require('pg');
const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mtpnbviztquitgszrfel',
  password: 'programermudaindonesia',
  ssl: { rejectUnauthorized: false }
});

async function checkAuth() {
  await client.connect();
  const res = await client.query(`
    SELECT id, email, confirmed_at, raw_user_meta_data 
    FROM auth.users 
    LIMIT 15;
  `);
  console.log('Auth users count:', res.rows.length);
  console.log(res.rows);
  await client.end();
}
checkAuth().catch(console.error);
