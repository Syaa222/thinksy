-- ============================================================================
-- MIGRASI MASTER: DIGITAL LEARNING JOURNAL, EXAM ENGINE, & MULTI-TENANT AUDIT
-- ============================================================================

-- 1. TABEL HIGHLIGHT / STABILO MATERI
CREATE TABLE IF NOT EXISTS highlight_materi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
  materi_id UUID REFERENCES materi(id) ON DELETE CASCADE,
  bab_id UUID REFERENCES bab(id) ON DELETE CASCADE,
  halaman_nomor INT NOT NULL DEFAULT 1,
  text_content TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow', -- 'yellow' | 'green' | 'pink' | 'blue'
  range_selector JSONB DEFAULT '{}'::jsonb,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_highlight_siswa_materi ON highlight_materi(siswa_id, materi_id);
CREATE INDEX IF NOT EXISTS idx_highlight_siswa_bab ON highlight_materi(siswa_id, bab_id);

ALTER TABLE highlight_materi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "highlight: kelola sendiri" ON highlight_materi;
CREATE POLICY "highlight: kelola sendiri"
  ON highlight_materi FOR ALL
  USING (siswa_id = auth.uid());

-- 2. TABEL CATATAN MARGIN MATERI
CREATE TABLE IF NOT EXISTS catatan_materi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
  materi_id UUID REFERENCES materi(id) ON DELETE CASCADE,
  bab_id UUID REFERENCES bab(id) ON DELETE CASCADE,
  halaman_nomor INT NOT NULL DEFAULT 1,
  judul TEXT NOT NULL DEFAULT 'Catatan Pembelajaran',
  konten TEXT NOT NULL,
  posisi_offset INT DEFAULT 0,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
  diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catatan_siswa_materi ON catatan_materi(siswa_id, materi_id);
CREATE INDEX IF NOT EXISTS idx_catatan_siswa_bab ON catatan_materi(siswa_id, bab_id);

ALTER TABLE catatan_materi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catatan_materi: kelola sendiri" ON catatan_materi;
CREATE POLICY "catatan_materi: kelola sendiri"
  ON catatan_materi FOR ALL
  USING (siswa_id = auth.uid());

-- 3. TABEL BOOKMARK / PENANDA BUKU
CREATE TABLE IF NOT EXISTS bookmark_materi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
  materi_id UUID REFERENCES materi(id) ON DELETE CASCADE,
  bab_id UUID REFERENCES bab(id) ON DELETE CASCADE,
  halaman_nomor INT NOT NULL DEFAULT 1,
  judul_halaman TEXT NOT NULL DEFAULT '',
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(siswa_id, materi_id, halaman_nomor)
);

ALTER TABLE bookmark_materi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookmark: kelola sendiri" ON bookmark_materi;
CREATE POLICY "bookmark: kelola sendiri"
  ON bookmark_materi FOR ALL
  USING (siswa_id = auth.uid());

-- 4. TABEL UJIAN (Master Exam Schedule & Configuration)
CREATE TABLE IF NOT EXISTS ujian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sekolah_id UUID NOT NULL REFERENCES sekolah(id) ON DELETE CASCADE,
  guru_id UUID REFERENCES profil(id) ON DELETE SET NULL,
  kelas_id UUID REFERENCES kelas(id) ON DELETE CASCADE,
  mapel TEXT NOT NULL DEFAULT 'Matematika',
  bab_id UUID REFERENCES bab(id) ON DELETE SET NULL,
  judul TEXT NOT NULL,
  deskripsi TEXT DEFAULT '',
  durasi_menit INT NOT NULL DEFAULT 60,
  passing_grade INT NOT NULL DEFAULT 75,
  waktu_mulai TIMESTAMPTZ NOT NULL DEFAULT now(),
  waktu_berakhir TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '3 days'),
  acak_soal BOOLEAN NOT NULL DEFAULT false,
  acak_opsi BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'dipublikasi', -- 'draft' | 'dipublikasi' | 'ditutup'
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ujian_sekolah_kelas ON ujian(sekolah_id, kelas_id);

ALTER TABLE ujian ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ujian: baca siswa & staff sekolah" ON ujian;
CREATE POLICY "ujian: baca siswa & staff sekolah"
  ON ujian FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profil p WHERE p.id = auth.uid() AND p.sekolah_id = ujian.sekolah_id
  ));

DROP POLICY IF EXISTS "ujian: kelola guru & admin" ON ujian;
CREATE POLICY "ujian: kelola guru & admin"
  ON ujian FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profil p WHERE p.id = auth.uid() AND p.peran IN ('guru', 'admin_sekolah', 'super_admin')
  ));

-- 5. TABEL UJIAN_SOAL (Relasi Ujian dengan Bank Soal)
CREATE TABLE IF NOT EXISTS ujian_soal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ujian_id UUID NOT NULL REFERENCES ujian(id) ON DELETE CASCADE,
  soal_id UUID NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
  urutan INT NOT NULL DEFAULT 1,
  poin_bobot INT NOT NULL DEFAULT 10,
  UNIQUE(ujian_id, soal_id)
);

ALTER TABLE ujian_soal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ujian_soal: baca semua authenticated" ON ujian_soal;
CREATE POLICY "ujian_soal: baca semua authenticated"
  ON ujian_soal FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ujian_soal: kelola guru & admin" ON ujian_soal;
CREATE POLICY "ujian_soal: kelola guru & admin"
  ON ujian_soal FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profil p WHERE p.id = auth.uid() AND p.peran IN ('guru', 'admin_sekolah', 'super_admin')
  ));

-- 6. TABEL SESI UJIAN (Server-timed session tracking)
CREATE TABLE IF NOT EXISTS sesi_ujian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ujian_id UUID NOT NULL REFERENCES ujian(id) ON DELETE CASCADE,
  siswa_id UUID NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
  server_start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  server_end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'sedang_mengerjakan', -- 'sedang_mengerjakan' | 'selesai' | 'habis_waktu'
  skor_objektif INT DEFAULT 0,
  skor_esai INT DEFAULT 0,
  nilai_akhir NUMERIC(5, 2) DEFAULT 0,
  umpan_balik_guru TEXT DEFAULT '',
  dikumpulkan_pada TIMESTAMPTZ,
  UNIQUE(ujian_id, siswa_id)
);

CREATE INDEX IF NOT EXISTS idx_sesi_ujian_siswa ON sesi_ujian(siswa_id, ujian_id);

ALTER TABLE sesi_ujian ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sesi_ujian: siswa kelola sesinya" ON sesi_ujian;
CREATE POLICY "sesi_ujian: siswa kelola sesinya"
  ON sesi_ujian FOR ALL
  USING (siswa_id = auth.uid());

DROP POLICY IF EXISTS "sesi_ujian: guru & admin bisa lihat" ON sesi_ujian;
CREATE POLICY "sesi_ujian: guru & admin bisa lihat"
  ON sesi_ujian FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profil p WHERE p.id = auth.uid() AND p.peran IN ('guru', 'admin_sekolah', 'super_admin')
  ));

DROP POLICY IF EXISTS "sesi_ujian: guru update nilai" ON sesi_ujian;
CREATE POLICY "sesi_ujian: guru update nilai"
  ON sesi_ujian FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profil p WHERE p.id = auth.uid() AND p.peran IN ('guru', 'admin_sekolah', 'super_admin')
  ));

-- 7. TABEL JAWABAN UJIAN
CREATE TABLE IF NOT EXISTS jawaban_ujian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_ujian_id UUID NOT NULL REFERENCES sesi_ujian(id) ON DELETE CASCADE,
  soal_id UUID NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
  opsi_dipilih_id UUID REFERENCES opsi_soal(id) ON DELETE SET NULL,
  jawaban_esai TEXT DEFAULT '',
  is_benar BOOLEAN,
  skor_diperoleh NUMERIC(5, 2) DEFAULT 0,
  koreksi_ai TEXT,
  koreksi_guru TEXT,
  dijawab_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sesi_ujian_id, soal_id)
);

ALTER TABLE jawaban_ujian ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jawaban_ujian: siswa kelola jawabannya" ON jawaban_ujian;
CREATE POLICY "jawaban_ujian: siswa kelola jawabannya"
  ON jawaban_ujian FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sesi_ujian s WHERE s.id = jawaban_ujian.sesi_ujian_id AND s.siswa_id = auth.uid()
  ));

DROP POLICY IF EXISTS "jawaban_ujian: guru & admin lihat & koreksi" ON jawaban_ujian;
CREATE POLICY "jawaban_ujian: guru & admin lihat & koreksi"
  ON jawaban_ujian FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profil p WHERE p.id = auth.uid() AND p.peran IN ('guru', 'admin_sekolah', 'super_admin')
  ));

-- 8. TABEL AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sekolah_id UUID REFERENCES sekolah(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profil(id) ON DELETE SET NULL,
  aksi TEXT NOT NULL,
  entitas TEXT NOT NULL,
  entitas_id UUID,
  detail JSONB DEFAULT '{}'::jsonb,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log: admin lihat sekolahnya" ON audit_log;
CREATE POLICY "audit_log: admin lihat sekolahnya"
  ON audit_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profil p WHERE p.id = auth.uid() AND p.peran IN ('admin_sekolah', 'super_admin')
  ));

DROP POLICY IF EXISTS "audit_log: insert authenticated" ON audit_log;
CREATE POLICY "audit_log: insert authenticated"
  ON audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
