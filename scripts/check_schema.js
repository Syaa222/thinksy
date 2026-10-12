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
  const enumRes = await client.query(`
    SELECT pg_type.typname, enumlabel 
    FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    ORDER BY pg_type.typname, pg_enum.enumsortorder;
  `);
  
  const grouped = {};
  for (const row of enumRes.rows) {
    if (!grouped[row.typname]) grouped[row.typname] = [];
    grouped[row.typname].push(row.enumlabel);
  }
  console.log('Enums in DB:', grouped);

  await client.end();
}

check().catch(console.error);
