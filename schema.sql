-- ============================================================================
-- SCHEMA LENGKAP - APLIKASI PEMBELAJARAN AI (MATEMATIKA KELAS 8)
-- Jalankan script ini di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================================

-- ============================================================
-- STEP 0: HAPUS SEMUA TABEL, TYPE, DAN FUNGSI YANG ADA (JIKA ADA)
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.check_user_role CASCADE;
DROP FUNCTION IF EXISTS public.check_staff_sekolah_match CASCADE;

DROP TABLE IF EXISTS undangan CASCADE;
DROP TABLE IF EXISTS log_ai CASCADE;
DROP TABLE IF EXISTS percakapan_tutor CASCADE;
DROP TABLE IF EXISTS jawaban CASCADE;
DROP TABLE IF EXISTS sesi CASCADE;
DROP TABLE IF EXISTS opsi_soal CASCADE;
DROP TABLE IF EXISTS soal CASCADE;
DROP TABLE IF EXISTS materi CASCADE;
DROP TABLE IF EXISTS bab CASCADE;
DROP TABLE IF EXISTS anggota_kelas CASCADE;
DROP TABLE IF EXISTS kelas CASCADE;
DROP TABLE IF EXISTS profil CASCADE;
DROP TABLE IF EXISTS sekolah CASCADE;

DROP TYPE IF EXISTS peran CASCADE;
DROP TYPE IF EXISTS tipe_soal CASCADE;
DROP TYPE IF EXISTS tingkat_soal CASCADE;
DROP TYPE IF EXISTS status_soal CASCADE;
DROP TYPE IF EXISTS sumber_konten CASCADE;
DROP TYPE IF EXISTS status_sesi CASCADE;
DROP TYPE IF EXISTS tipe_sesi CASCADE;
DROP TYPE IF EXISTS fitur_ai CASCADE;

-- ============================================================
-- STEP 1: BUAT ENUM TYPES
-- ============================================================

CREATE TYPE peran AS ENUM ('super_admin', 'admin_sekolah', 'guru', 'siswa');
CREATE TYPE tipe_soal AS ENUM ('pilihan_ganda', 'esai');
CREATE TYPE tingkat_soal AS ENUM ('mudah', 'sedang', 'sulit');
CREATE TYPE status_soal AS ENUM ('draft', 'review', 'dipublikasi', 'diarsipkan');
CREATE TYPE sumber_konten AS ENUM ('manual', 'ai_generated');
CREATE TYPE status_sesi AS ENUM ('aktif', 'selesai', 'dibatalkan');
CREATE TYPE tipe_sesi AS ENUM ('latihan', 'eksplorasi', 'kuis', 'assessment');
CREATE TYPE fitur_ai AS ENUM ('tutor_sokratik', 'grading_esai', 'generate_soal');

-- ============================================================
-- STEP 2: TABEL UTAMA
-- ============================================================

-- 2.1 Tabel Sekolah (Master Tenant)
CREATE TABLE sekolah (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama         TEXT NOT NULL,
  npsn         TEXT UNIQUE,
  alamat       TEXT,
  motto        TEXT,
  deskripsi    TEXT,
  bg_image_url TEXT,
  links        JSONB DEFAULT '[]'::jsonb,
  dibuat_pada  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 Tabel Profil (Extends auth.users Supabase)
-- Otomatis dibuat via trigger saat user signup
CREATE TABLE profil (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sekolah_id      UUID REFERENCES sekolah(id) ON DELETE SET NULL,
  nama_lengkap    TEXT NOT NULL DEFAULT '',
  peran           peran NOT NULL DEFAULT 'siswa',
  poin            INT NOT NULL DEFAULT 0,
  streak          INT NOT NULL DEFAULT 0,
  dibuat_pada     TIMESTAMPTZ NOT NULL DEFAULT now(),
  diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 Tabel Kelas
CREATE TABLE kelas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sekolah_id    UUID NOT NULL REFERENCES sekolah(id) ON DELETE CASCADE,
  nama_kelas    TEXT NOT NULL,
  wali_kelas_id UUID REFERENCES profil(id) ON DELETE SET NULL,
  dibuat_pada   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 Tabel Anggota Kelas (siswa -> kelas)
CREATE TABLE anggota_kelas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id    UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  siswa_id    UUID NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(kelas_id, siswa_id)
);

-- 2.5 Tabel Bab (Chapter)
CREATE TABLE bab (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sekolah_id  UUID REFERENCES sekolah(id) ON DELETE CASCADE,
  judul       TEXT NOT NULL,
  deskripsi   TEXT,
  urutan      INT NOT NULL DEFAULT 1,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 Tabel Materi (Konten teks per Bab)
CREATE TABLE materi (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bab_id          UUID NOT NULL REFERENCES bab(id) ON DELETE CASCADE,
  judul           TEXT NOT NULL,
  konten_markdown TEXT NOT NULL DEFAULT '',
  urutan          INT NOT NULL DEFAULT 1,
  dibuat_pada     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 Tabel Soal (Bank Soal)
CREATE TABLE soal (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bab_id        UUID NOT NULL REFERENCES bab(id) ON DELETE CASCADE,
  materi_id     UUID REFERENCES materi(id) ON DELETE SET NULL,
  pembuat_id    UUID REFERENCES profil(id) ON DELETE SET NULL,
  pertanyaan    TEXT NOT NULL,
  tipe_soal     tipe_soal NOT NULL DEFAULT 'pilihan_ganda',
  tingkat_soal  tingkat_soal NOT NULL DEFAULT 'sedang',
  sumber_konten sumber_konten NOT NULL DEFAULT 'manual',
  status_soal   status_soal NOT NULL DEFAULT 'draft',
  kunci_jawaban TEXT,
  pembahasan    TEXT,
  dibuat_pada   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.8 Tabel Opsi Soal (untuk tipe pilihan_ganda)
CREATE TABLE opsi_soal (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soal_id   UUID NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
  teks_opsi TEXT NOT NULL,
  benar     BOOLEAN NOT NULL DEFAULT false,
  urutan    INT NOT NULL DEFAULT 1
);

-- 2.9 Tabel Sesi Belajar
CREATE TABLE sesi (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id     UUID NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
  bab_id       UUID REFERENCES bab(id) ON DELETE SET NULL,
  sekolah_id   UUID REFERENCES sekolah(id) ON DELETE CASCADE,
  tipe_sesi    tipe_sesi NOT NULL DEFAULT 'latihan',
  status_sesi  status_sesi NOT NULL DEFAULT 'aktif',
  skor_akhir   INT,
  mulai_pada   TIMESTAMPTZ NOT NULL DEFAULT now(),
  selesai_pada TIMESTAMPTZ
);

-- 2.10 Tabel Jawaban Siswa
CREATE TABLE jawaban (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id         UUID NOT NULL REFERENCES sesi(id) ON DELETE CASCADE,
  soal_id         UUID NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
  opsi_dipilih_id UUID REFERENCES opsi_soal(id) ON DELETE SET NULL,
  jawaban_teks    TEXT,
  is_benar        BOOLEAN,
  nilai           INT DEFAULT 0,
  umpan_balik_ai  TEXT,
  dijawab_pada    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sesi_id, soal_id)
);

-- 2.11 Tabel Percakapan Tutor AI
CREATE TABLE percakapan_tutor (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id     UUID NOT NULL REFERENCES sesi(id) ON DELETE CASCADE,
  soal_id     UUID REFERENCES soal(id) ON DELETE SET NULL,
  pengirim    TEXT NOT NULL CHECK (pengirim IN ('siswa', 'tutor_ai')),
  pesan       TEXT NOT NULL,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.12 Tabel Log Penggunaan AI (monitoring biaya)
CREATE TABLE log_ai (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sekolah_id        UUID NOT NULL REFERENCES sekolah(id) ON DELETE CASCADE,
  pengguna_id       UUID NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
  fitur             fitur_ai NOT NULL,
  prompt_tokens     INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  total_tokens      INT NOT NULL DEFAULT 0,
  biaya_usd         NUMERIC(10, 8) NOT NULL DEFAULT 0,
  dibuat_pada       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.13 Tabel Presensi (Kehadiran & Liveness Check - Tanpa Penyimpanan Foto)
-- Catatan migrasi database: ALTER TABLE presensi DROP COLUMN IF EXISTS foto_url;
CREATE TABLE presensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  waktu_masuk TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'Hadir (Tepat Waktu)', -- 'Hadir (Tepat Waktu)', 'Terlambat', 'Alpha', 'Terverifikasi'
  UNIQUE(siswa_id, tanggal)
);

-- 2.14 Tabel Misi Harian (Daily Quests)
CREATE TABLE misi_harian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID REFERENCES profil(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  progres_saat_ini INT NOT NULL DEFAULT 0,
  target_max INT NOT NULL DEFAULT 1,
  poin_hadiah INT NOT NULL DEFAULT 20,
  diklaim BOOLEAN NOT NULL DEFAULT false,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 2.15 Tabel Agenda Tugas (Tenggat Waktu)
CREATE TABLE agenda_tugas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID REFERENCES profil(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  tenggat_waktu TIMESTAMPTZ NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'kuis',
  tingkat_urgensi TEXT NOT NULL DEFAULT 'normal'
);

-- 2.16 Tabel Jadwal Kelas
CREATE TABLE jadwal_kelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sekolah_id UUID REFERENCES sekolah(id) ON DELETE CASCADE,
  mata_pelajaran TEXT NOT NULL,
  nama_guru TEXT NOT NULL,
  hari TEXT NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  ruangan TEXT NOT NULL,
  urutan INT DEFAULT 1
);

-- 2.17 Tabel Notifikasi (Log Notifikasi User)
CREATE TABLE notifikasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  pesan TEXT NOT NULL,
  tipe TEXT NOT NULL DEFAULT 'info',
  dibaca BOOLEAN NOT NULL DEFAULT false,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: notifikasi
ALTER TABLE notifikasi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifikasi: kelola notifikasi sendiri"
  ON notifikasi FOR ALL
  USING (user_id = auth.uid());

-- ============================================================
-- STEP 3: TRIGGER - AUTO CREATE PROFIL SAAT USER SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profil (id, nama_lengkap, peran)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', NEW.email, 'Pengguna Baru'),
    COALESCE((NEW.raw_user_meta_data->>'peran')::peran, 'siswa')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STEP 4: ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE sekolah          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profil           ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE anggota_kelas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bab              ENABLE ROW LEVEL SECURITY;
ALTER TABLE materi           ENABLE ROW LEVEL SECURITY;
ALTER TABLE soal             ENABLE ROW LEVEL SECURITY;
ALTER TABLE opsi_soal        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesi             ENABLE ROW LEVEL SECURITY;
ALTER TABLE jawaban          ENABLE ROW LEVEL SECURITY;
ALTER TABLE percakapan_tutor ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_ai           ENABLE ROW LEVEL SECURITY;

-- RLS: profil
CREATE OR REPLACE FUNCTION public.check_user_role(role_to_check peran)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profil
    WHERE id = auth.uid() AND peran = role_to_check
  );
$$;

CREATE OR REPLACE FUNCTION public.check_staff_sekolah_match(sekolah_id_to_check UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profil
    WHERE id = auth.uid() AND peran IN ('guru', 'admin_sekolah') AND sekolah_id = sekolah_id_to_check
  );
$$;

CREATE POLICY "profil: baca profil sendiri"
  ON profil FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profil: update profil sendiri"
  ON profil FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profil: super_admin lihat semua"
  ON profil FOR SELECT
  USING (public.check_user_role('super_admin'));

CREATE POLICY "profil: user login bisa baca leaderboard siswa"
  ON profil FOR SELECT
  USING (auth.uid() IS NOT NULL AND peran = 'siswa');

-- RLS: sekolah
CREATE POLICY "sekolah: user login bisa baca"
  ON sekolah FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sekolah: super_admin kelola"
  ON sekolah FOR ALL
  USING (EXISTS (SELECT 1 FROM profil WHERE id = auth.uid() AND peran = 'super_admin'));

-- RLS: bab
CREATE POLICY "bab: user login bisa baca"
  ON bab FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "bab: guru/admin kelola"
  ON bab FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profil WHERE id = auth.uid() AND peran IN ('guru', 'admin_sekolah', 'super_admin')
  ));

-- RLS: materi
CREATE POLICY "materi: user login bisa baca"
  ON materi FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "materi: guru/admin kelola"
  ON materi FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profil WHERE id = auth.uid() AND peran IN ('guru', 'admin_sekolah', 'super_admin')
  ));

-- View Aman & RLS: soal
-- Catatan: Siswa HANYA boleh membaca dari view aman `soal_publik` dan `opsi_soal_publik`.
-- Direct SELECT pada tabel `soal` dan `opsi_soal` hanya untuk Guru & Admin.

CREATE POLICY "soal: guru/admin baca & kelola semua"
  ON soal FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profil WHERE id = auth.uid() AND peran IN ('guru', 'admin_sekolah', 'super_admin')
  ));

-- RLS: opsi_soal
CREATE POLICY "opsi_soal: guru/admin kelola"
  ON opsi_soal FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profil WHERE id = auth.uid() AND peran IN ('guru', 'admin_sekolah', 'super_admin')
  ));

-- Secure Views untuk Siswa (Tanpa kunci_jawaban, pembahasan, dan benar)
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
  dibuat_pada
FROM soal
WHERE status_soal = 'dipublikasi';

CREATE OR REPLACE VIEW opsi_soal_publik AS
SELECT
  id,
  soal_id,
  teks_opsi,
  urutan
FROM opsi_soal;

GRANT SELECT ON soal_publik TO authenticated, anon;
GRANT SELECT ON opsi_soal_publik TO authenticated, anon;

-- RLS: sesi
CREATE POLICY "sesi: siswa kelola sesinya sendiri"
  ON sesi FOR ALL USING (siswa_id = auth.uid());

CREATE POLICY "sesi: guru/admin lihat di sekolahnya"
  ON sesi FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profil p
    WHERE p.id = auth.uid() AND p.peran IN ('guru', 'admin_sekolah', 'super_admin')
  ));

-- RLS: jawaban
CREATE POLICY "jawaban: siswa kelola jawabannya"
  ON jawaban FOR ALL
  USING (EXISTS (SELECT 1 FROM sesi WHERE id = jawaban.sesi_id AND siswa_id = auth.uid()));

CREATE POLICY "jawaban: guru/admin bisa lihat"
  ON jawaban FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profil WHERE id = auth.uid() AND peran IN ('guru', 'admin_sekolah', 'super_admin')
  ));

-- RLS: percakapan_tutor
CREATE POLICY "percakapan_tutor: siswa kelola percakapannya"
  ON percakapan_tutor FOR ALL
  USING (EXISTS (SELECT 1 FROM sesi WHERE id = percakapan_tutor.sesi_id AND siswa_id = auth.uid()));

-- RLS: log_ai
CREATE POLICY "log_ai: admin/super lihat log"
  ON log_ai FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profil WHERE id = auth.uid() AND peran IN ('admin_sekolah', 'super_admin')
  ));

CREATE POLICY "log_ai: insert oleh user login"
  ON log_ai FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- STEP 5: SEED DATA AWAL (MATEMATIKA KELAS 8 FASE D)
-- ============================================================

INSERT INTO sekolah (id, nama, npsn, alamat)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'SMP Negeri 1 Nusantara', '20101010', 'Jl. Pendidikan No. 1, Jakarta'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO bab (id, sekolah_id, judul, deskripsi, urutan)
VALUES 
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bab 1: Pola Bilangan & Barisan Bilangan', 'CP: Menggeneralisasi pola susunan benda dan barisan bilangan. TP: Menentukan suku ke-n (Un) dan jumlah n suku (Sn) pada barisan aritmetika dan geometri.', 1),
('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bab 2: Bentuk Aljabar & PLSV/PTLSV', 'CP: Menyederhanakan bentuk aljabar dan menyelesaikan persamaan/pertidaksamaan linear satu variabel. TP: Operasi aljabar serta penyelesaian PLSV dan PTLSV kontekstual.', 2),
('b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bab 3: Relasi & Fungsi', 'CP: Memahami konsep relasi dan fungsi serta menyajikannya. TP: Menentukan domain, kodomain, range, diagram panah, dan nilai fungsi f(x) = ax + b.', 3),
('b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bab 4: Persamaan Garis Lurus (PGL)', 'CP: Mengenal konsep kemiringan garis dan menyusun persamaan garis lurus. TP: Menhitung gradien (m), menyusun PGL melalui 1 atau 2 titik, dan garis sejajar/tegak lurus.', 4),
('b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bab 5: Sistem Persamaan Linear Dua Variabel (SPLDV)', 'CP: Menyelesaikan sistem persamaan linear dua variabel. TP: Menggunakan metode eliminasi, substitusi, dan campuran pada masalah kehidupan nyata.', 5),
('b6eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bab 6: Teorema Pythagoras', 'CP: Membuktikan dan menerapkan Teorema Pythagoras. TP: Menhitung panjang sisi segitiga siku-siku, memeriksa tripel Pythagoras, dan menguji jenis segitiga.', 6),
('b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bab 7: Bangun Ruang Sisi Datar (BRSD)', 'CP: Menentukan luas permukaan dan volume bangun ruang sisi datar. TP: Menhitung luas permukaan dan volume Kubus, Balok, Prisma Tegak, dan Limas.', 7),
('b8eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bab 8: Statistika & Peluang', 'CP: Mengolah data dan menentukan peluang kejadian tunggal. TP: Menhitung Mean, Median, Modus, penyajian tabel/grafik, serta peluang teoritik & empirik.', 8)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 6: TABEL UNDANGAN (Sistem Undangan Admin Sekolah)
-- ============================================================

CREATE TABLE IF NOT EXISTS undangan (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL,
  peran             peran NOT NULL DEFAULT 'admin_sekolah',
  sekolah_id        UUID REFERENCES sekolah(id) ON DELETE SET NULL,
  dibuat_oleh       UUID REFERENCES profil(id) ON DELETE SET NULL,
  nama_yang_diundang TEXT NOT NULL DEFAULT '',
  digunakan         BOOLEAN NOT NULL DEFAULT false,
  dibuat_pada       TIMESTAMPTZ NOT NULL DEFAULT now(),
  kadaluarsa_pada   TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

-- RLS: undangan
ALTER TABLE undangan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "undangan: super_admin kelola semua"
  ON undangan FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profil WHERE id = auth.uid() AND peran = 'super_admin'
  ));

CREATE POLICY "undangan: baca undangan sendiri by email"
  ON undangan FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "undangan: update saat digunakan"
  ON undangan FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- FUNGSI DATABASE RPC (SECURITY DEFINER): get_peringkat_sekolah
-- Mengembalikan peringkat siswa per sekolah secara aman tanpa
-- membuka data pribadi sensitif (seperti email/alamat) siswa lain.
-- ============================================================

CREATE OR REPLACE FUNCTION get_peringkat_sekolah(p_sekolah_id UUID DEFAULT NULL)
RETURNS TABLE (
  rank BIGINT,
  student_id UUID,
  nama_lengkap TEXT,
  poin INT,
  streak INT,
  nama_sekolah TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_sekolah_id UUID;
BEGIN
  IF p_sekolah_id IS NULL THEN
    SELECT profil.sekolah_id INTO v_user_sekolah_id
    FROM profil
    WHERE profil.id = auth.uid();
  ELSE
    v_user_sekolah_id := p_sekolah_id;
  END IF;

  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.poin DESC, p.dibuat_pada ASC)::BIGINT AS rank,
    p.id AS student_id,
    p.nama_lengkap,
    p.poin,
    p.streak,
    COALESCE(s.nama, 'Sekolah') AS nama_sekolah
  FROM profil p
  LEFT JOIN sekolah s ON s.id = p.sekolah_id
  WHERE p.peran = 'siswa'
    AND (v_user_sekolah_id IS NULL OR p.sekolah_id = v_user_sekolah_id)
  ORDER BY p.poin DESC, p.dibuat_pada ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_peringkat_sekolah(UUID) TO authenticated, anon;

-- ============================================================
-- SELESAI! Semua tabel, trigger, RLS, dan seed data sudah siap.
-- ============================================================
