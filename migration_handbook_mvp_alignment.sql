-- ============================================================================
-- MIGRATION: HANDBOOK MVP ALIGNMENT
-- Menyelaraskan skema database dengan spesifikasi Build Handbook MVP
-- ============================================================================

-- 1. Tambahkan tipe soal 'isian_singkat' ke enum tipe_soal jika belum ada
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

-- 2. Tambahkan value 'perlu_review', 'terbit', 'arsip' ke status_soal jika belum ada
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

-- 3. Tambah kolom pada tabel `soal`:
--    - rubrik (jsonb untuk rubrik esai: [{kriteria, bobot, deskriptor}])
--    - direview_oleh (uuid references profil)
--    - direview_at (timestamptz)
--    - poin (int default 10)
ALTER TABLE soal
  ADD COLUMN IF NOT EXISTS rubrik JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS direview_oleh UUID REFERENCES profil(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS direview_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS poin INT DEFAULT 10;

-- 4. Tambah kolom pada tabel `opsi_soal`:
--    - label (text: 'A', 'B', 'C', 'D')
--    - alasan_salah (text: distraktor / miskonsepsi)
ALTER TABLE opsi_soal
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS alasan_salah TEXT;

-- 5. Tambah kolom pada tabel `jawaban`:
--    - skor_final_guru (numeric(5, 2): override nilai oleh guru)
--    - keyakinan_ai (text: 'tinggi' | 'sedang' | 'rendah')
--    - status_penilaian (text: 'selesai' | 'sementara_menunggu_guru' | 'terverifikasi_guru')
ALTER TABLE jawaban
  ADD COLUMN IF NOT EXISTS skor_final_guru NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS keyakinan_ai TEXT DEFAULT 'tinggi',
  ADD COLUMN IF NOT EXISTS status_penilaian TEXT DEFAULT 'selesai';

-- 6. Tambah kolom pada tabel `sesi`:
--    - batas_menit (int: timer)
--    - skor_maks (numeric(5, 2))
ALTER TABLE sesi
  ADD COLUMN IF NOT EXISTS batas_menit INT,
  ADD COLUMN IF NOT EXISTS skor_maks NUMERIC(5, 2) DEFAULT 100;

-- 7. Tambah kolom pada tabel `log_ai`:
--    - model (text)
--    - latensi_ms (int)
--    - sukses (boolean)
--    - pesan_error (text)
ALTER TABLE log_ai
  ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'gemini-3.1-flash-lite',
  ADD COLUMN IF NOT EXISTS latensi_ms INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sukses BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS pesan_error TEXT;

-- 8. Update view `soal_publik` agar mendukung tipe_soal isian_singkat & poin
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

-- 9. Update view `opsi_soal_publik` agar menyertakan label jika ada
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
