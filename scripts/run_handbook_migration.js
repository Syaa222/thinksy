const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mtpnbviztquitgszrfel',
  password: 'programermudaindonesia',
  ssl: { rejectUnauthorized: false }
});

async function runStep(sql, name) {
  try {
    console.log(`Running: ${name}...`);
    await client.query(sql);
    console.log(`✓ ${name} completed.`);
  } catch (e) {
    console.error(`Error in ${name}:`, e.message);
    throw e;
  }
}

async function run() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL database.');

  // 1. Add enum values first
  await runStep(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
        WHERE pg_type.typname = 'tipe_soal' AND pg_enum.enumlabel = 'isian_singkat'
      ) THEN
        ALTER TYPE tipe_soal ADD VALUE 'isian_singkat';
      END IF;
    END $$;
  `, 'Add tipe_soal isian_singkat');

  await runStep(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
        WHERE pg_type.typname = 'status_soal' AND pg_enum.enumlabel = 'terbit'
      ) THEN
        ALTER TYPE status_soal ADD VALUE 'terbit';
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
        WHERE pg_type.typname = 'status_soal' AND pg_enum.enumlabel = 'perlu_review'
      ) THEN
        ALTER TYPE status_soal ADD VALUE 'perlu_review';
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
        WHERE pg_type.typname = 'status_soal' AND pg_enum.enumlabel = 'arsip'
      ) THEN
        ALTER TYPE status_soal ADD VALUE 'arsip';
      END IF;
    END $$;
  `, 'Add status_soal values');

  // Disconnect and reconnect so new enum values are committed & visible to subsequent transactions
  await client.end();

  const client2 = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.mtpnbviztquitgszrfel',
    password: 'programermudaindonesia',
    ssl: { rejectUnauthorized: false }
  });
  await client2.connect();

  console.log('Reconnected to client2 for table alterations.');

  await client2.query(`
    ALTER TABLE soal
      ADD COLUMN IF NOT EXISTS rubrik JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS direview_oleh UUID REFERENCES profil(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS direview_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS poin INT DEFAULT 10;
  `);
  console.log('✓ Altered table soal');

  await client2.query(`
    ALTER TABLE opsi_soal
      ADD COLUMN IF NOT EXISTS label TEXT,
      ADD COLUMN IF NOT EXISTS alasan_salah TEXT;
  `);
  console.log('✓ Altered table opsi_soal');

  await client2.query(`
    ALTER TABLE jawaban
      ADD COLUMN IF NOT EXISTS skor_final_guru NUMERIC(5, 2),
      ADD COLUMN IF NOT EXISTS keyakinan_ai TEXT DEFAULT 'tinggi',
      ADD COLUMN IF NOT EXISTS status_penilaian TEXT DEFAULT 'selesai';
  `);
  console.log('✓ Altered table jawaban');

  await client2.query(`
    ALTER TABLE sesi
      ADD COLUMN IF NOT EXISTS batas_menit INT,
      ADD COLUMN IF NOT EXISTS skor_maks NUMERIC(5, 2) DEFAULT 100;
  `);
  console.log('✓ Altered table sesi');

  await client2.query(`
    ALTER TABLE log_ai
      ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'gemini-3.1-flash-lite',
      ADD COLUMN IF NOT EXISTS latensi_ms INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS sukses BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS pesan_error TEXT;
  `);
  console.log('✓ Altered table log_ai');

  await client2.query(`
    DROP VIEW IF EXISTS soal_publik CASCADE;
    CREATE OR REPLACE VIEW soal_publik AS
    SELECT
      id,
      bab_id,
      materi_id,
      pembuat_id,
      pertanyaan,
      tipe_soal,
      tingkat_soal,
      sumber_konten,
      status_soal,
      poin,
      dibuat_pada
    FROM soal
    WHERE status_soal IN ('dipublikasi', 'terbit');

    DROP VIEW IF EXISTS opsi_soal_publik CASCADE;
    CREATE OR REPLACE VIEW opsi_soal_publik AS
    SELECT
      id,
      soal_id,
      label,
      teks_opsi,
      urutan
    FROM opsi_soal;

    GRANT SELECT ON soal_publik TO authenticated, anon;
    GRANT SELECT ON opsi_soal_publik TO authenticated, anon;
  `);
  console.log('✓ Recreated views soal_publik & opsi_soal_publik');

  // Verify
  const cols = await client2.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_name IN ('soal', 'opsi_soal', 'jawaban', 'sesi', 'log_ai')
      AND column_name IN ('rubrik', 'direview_oleh', 'direview_at', 'poin', 'label', 'alasan_salah', 'skor_final_guru', 'keyakinan_ai', 'status_penilaian', 'skor_maks', 'model', 'latensi_ms', 'sukses', 'pesan_error')
    ORDER BY table_name, column_name;
  `);
  console.log('\nAll new columns verified:', cols.rows);

  await client2.end();
}

run().catch(console.error);
