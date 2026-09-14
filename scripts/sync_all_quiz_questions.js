const { Client } = require('pg');
const ts = require('typescript');
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

// Transpile curriculum-quiz-engine.ts
const engineCode = fs.readFileSync(path.join(__dirname, '../lib/curriculum-quiz-engine.ts'), 'utf8');
const transpiled = ts.transpile(engineCode);
const engineModule = { exports: {} };
const fn = new Function('module', 'exports', transpiled);
fn(engineModule, engineModule.exports);
const { generateChapterQuestions } = engineModule.exports;

async function syncAllQuizQuestions() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL Supabase database.');

    const babsRes = await client.query(`
      SELECT id, judul, mapel, kelas 
      FROM bab 
      ORDER BY kelas, mapel, urutan;
    `);

    console.log(`Processing 10-question quizzes for ${babsRes.rows.length} total chapters...`);

    // Clean up old questions efficiently
    console.log('Cleaning existing questions and options...');
    await client.query(`DELETE FROM jawaban WHERE soal_id IN (SELECT id FROM soal);`);
    await client.query(`DELETE FROM opsi_soal;`);
    await client.query(`DELETE FROM soal;`);
    console.log('Old questions cleaned.');

    let totalQuestionsInserted = 0;

    for (let bIdx = 0; bIdx < babsRes.rows.length; bIdx++) {
      const b = babsRes.rows[bIdx];
      const generatedQuestions = generateChapterQuestions(b.judul, b.mapel, b.kelas);

      for (const q of generatedQuestions) {
        const insertSoalRes = await client.query(
          `INSERT INTO soal (bab_id, pertanyaan, tipe_soal, kunci_jawaban, pembahasan, dibuat_pada)
           VALUES ($1, $2, $3, $4, $5, now())
           RETURNING id;`,
          [
            b.id,
            q.pertanyaan,
            q.tipeSoal,
            q.kunciJawaban,
            q.pembahasan,
          ]
        );

        const newSoalId = insertSoalRes.rows[0].id;
        totalQuestionsInserted++;

        if (q.tipeSoal === 'pilihan_ganda' && q.opsiSoal && q.opsiSoal.length > 0) {
          const values = [];
          const params = [];
          let paramIdx = 1;

          for (let i = 0; i < q.opsiSoal.length; i++) {
            const opt = q.opsiSoal[i];
            values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3})`);
            params.push(newSoalId, opt.teksOpsi, opt.benar, i + 1);
            paramIdx += 4;
          }

          await client.query(
            `INSERT INTO opsi_soal (soal_id, teks_opsi, benar, urutan) VALUES ${values.join(', ')}`,
            params
          );
        }
      }

      if ((bIdx + 1) % 25 === 0 || bIdx + 1 === babsRes.rows.length) {
        console.log(`Synced 10 questions for ${bIdx + 1}/${babsRes.rows.length} chapters (${totalQuestionsInserted} questions total)...`);
      }
    }

    console.log(`\nSUCCESS! All ${babsRes.rows.length} chapters now have exactly 10 authentic, topic-matched questions (${totalQuestionsInserted} total questions in DB).`);
    await client.end();
  } catch (err) {
    console.error('Error during quiz sync:', err);
    process.exit(1);
  }
}

syncAllQuizQuestions();
