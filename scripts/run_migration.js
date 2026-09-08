const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mtpnbviztquitgszrfel',
  password: 'programermudaindonesia',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');

    const sqlPath = path.join(__dirname, '..', 'migration_digital_journal_and_exams.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing migration_digital_journal_and_exams.sql...');
    await client.query(sqlContent);
    console.log('Migration executed successfully!');

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Public tables in DB:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

runMigration();
