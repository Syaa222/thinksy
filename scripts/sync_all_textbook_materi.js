const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mtpnbviztquitgszrfel',
  password: 'programermudaindonesia',
  ssl: { rejectUnauthorized: false }
});

// Import the generator functions compiled/transpiled or direct JS
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const engineCode = fs.readFileSync(path.join(__dirname, '../lib/curriculum-textbook-engine.ts'), 'utf8');
const transpiled = ts.transpile(engineCode);
const engineModule = { exports: {} };
const fn = new Function('module', 'exports', transpiled);
fn(engineModule, engineModule.exports);
const { generateTextbookModules } = engineModule.exports;

async function syncAllMateri() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL Supabase database.');

    const babsRes = await client.query(`
      SELECT id, judul, mapel, kelas, deskripsi, urutan 
      FROM bab 
      ORDER BY kelas, mapel, urutan;
    `);

    console.log(`Processing ${babsRes.rows.length} total chapters in database...`);

    let updatedBabCount = 0;
    let insertedMateriCount = 0;

    for (const b of babsRes.rows) {
      const generatedModules = generateTextbookModules(b.judul, b.mapel, b.kelas, b.deskripsi);

      // Check existing materi rows
      const existingMateri = await client.query('SELECT id, urutan FROM materi WHERE bab_id = $1 ORDER BY urutan', [b.id]);

      if (existingMateri.rows.length === 0) {
        // Insert new modules
        for (const mod of generatedModules) {
          await client.query(
            `INSERT INTO materi (bab_id, judul, konten_markdown, urutan, dibuat_pada)
             VALUES ($1, $2, $3, $4, now())`,
            [b.id, mod.judul, mod.konten_markdown, mod.urutan]
          );
          insertedMateriCount++;
        }
      } else {
        // Update existing modules with rich title-matched long-form textbook content
        for (let i = 0; i < generatedModules.length; i++) {
          const mod = generatedModules[i];
          if (i < existingMateri.rows.length) {
            const rowId = existingMateri.rows[i].id;
            await client.query(
              `UPDATE materi 
               SET judul = $1, konten_markdown = $2, urutan = $3 
               WHERE id = $4`,
              [mod.judul, mod.konten_markdown, mod.urutan, rowId]
            );
          } else {
            await client.query(
              `INSERT INTO materi (bab_id, judul, konten_markdown, urutan, dibuat_pada)
               VALUES ($1, $2, $3, $4, now())`,
              [b.id, mod.judul, mod.konten_markdown, mod.urutan]
            );
            insertedMateriCount++;
          }
        }
      }

      updatedBabCount++;
      if (updatedBabCount % 20 === 0 || updatedBabCount === babsRes.rows.length) {
        console.log(`Synced ${updatedBabCount}/${babsRes.rows.length} chapters...`);
      }
    }

    console.log(`SUCCESS! All ${updatedBabCount} chapters now have authentic, long-form textbook reading content.`);
    await client.end();
  } catch (err) {
    console.error('Error during sync:', err);
    process.exit(1);
  }
}

syncAllMateri();
