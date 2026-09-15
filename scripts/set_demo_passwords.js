const { Client } = require('pg');
const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mtpnbviztquitgszrfel',
  password: 'programermudaindonesia',
  ssl: { rejectUnauthorized: false }
});

async function setDemoPasswords() {
  await client.connect();
  // Check if pgcrypto extension is installed
  await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  
  // Update password for demo users
  const res = await client.query(`
    UPDATE auth.users 
    SET encrypted_password = crypt('password123', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE email IN (
      'siswa.demo@thinksy.app',
      'guru.demo@thinksy.app',
      'admin.demo@thinksy.app',
      'super.demo@thinksy.app'
    )
    RETURNING id, email;
  `);
  console.log('Updated passwords for:', res.rows);
  await client.end();
}
setDemoPasswords().catch(console.error);
