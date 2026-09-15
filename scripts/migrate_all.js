const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mtpnbviztquitgszrfel',
  password: 'programermudaindonesia',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL...');

  const sql = `
    -- 1. PROFIL
    ALTER TABLE profil ADD COLUMN IF NOT EXISTS nisn TEXT;
    ALTER TABLE profil ADD COLUMN IF NOT EXISTS nis TEXT;
    ALTER TABLE profil ADD COLUMN IF NOT EXISTS jurusan TEXT;
    ALTER TABLE profil ADD COLUMN IF NOT EXISTS tahun_ajaran TEXT DEFAULT '2026/2027';
    ALTER TABLE profil ADD COLUMN IF NOT EXISTS foto_url TEXT;

    -- 2. SEKOLAH
    ALTER TABLE sekolah ADD COLUMN IF NOT EXISTS jam_masuk TIME DEFAULT '07:00:00';
    ALTER TABLE sekolah ADD COLUMN IF NOT EXISTS jam_terlambat TIME DEFAULT '07:15:00';
    ALTER TABLE sekolah ADD COLUMN IF NOT EXISTS jam_tutup TIME DEFAULT '08:00:00';

    UPDATE sekolah
    SET jam_masuk = COALESCE(jam_masuk, '07:00:00'::time),
        jam_terlambat = COALESCE(jam_terlambat, '07:15:00'::time),
        jam_tutup = COALESCE(jam_tutup, '08:00:00'::time)
    WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    -- 3. BAB
    ALTER TABLE bab ADD COLUMN IF NOT EXISTS semester INT DEFAULT 1;
    UPDATE bab SET semester = CASE WHEN urutan <= 3 THEN 1 ELSE 2 END WHERE semester IS NULL OR semester = 1;

    -- 4. UJIAN
    ALTER TABLE ujian ADD COLUMN IF NOT EXISTS tipe TEXT DEFAULT 'ujian';
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ujian_tipe_check'
      ) THEN
        ALTER TABLE ujian ADD CONSTRAINT ujian_tipe_check CHECK (tipe IN ('ulangan', 'ujian'));
      END IF;
    END $$;

    -- 5. AGENDA AKADEMIK
    CREATE TABLE IF NOT EXISTS agenda_akademik (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sekolah_id UUID NOT NULL REFERENCES sekolah(id) ON DELETE CASCADE,
      pembuat_id UUID REFERENCES profil(id) ON DELETE SET NULL,
      judul TEXT NOT NULL,
      deskripsi TEXT,
      kategori TEXT NOT NULL DEFAULT 'agenda', -- 'ulangan' | 'ujian' | 'tugas' | 'agenda'
      tanggal DATE NOT NULL,
      jam_mulai TIME,
      jam_selesai TIME,
      lokasi TEXT,
      dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE agenda_akademik ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "agenda_akademik_read_all" ON agenda_akademik;
    CREATE POLICY "agenda_akademik_read_all" ON agenda_akademik FOR SELECT USING (true);
    DROP POLICY IF EXISTS "agenda_akademik_modify_staff" ON agenda_akademik;
    CREATE POLICY "agenda_akademik_modify_staff" ON agenda_akademik FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profil p WHERE p.id = auth.uid() AND p.peran IN ('guru', 'admin_sekolah', 'super_admin')
      )
    );

    -- 6. PROGRES MATERI
    CREATE TABLE IF NOT EXISTS progres_materi (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      siswa_id UUID NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
      materi_id UUID NOT NULL REFERENCES materi(id) ON DELETE CASCADE,
      selesai BOOLEAN NOT NULL DEFAULT true,
      terakhir_dibaca TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(siswa_id, materi_id)
    );

    ALTER TABLE progres_materi ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "progres_materi_user_policy" ON progres_materi;
    CREATE POLICY "progres_materi_user_policy" ON progres_materi FOR ALL USING (true);

    -- 7. NOTIFIKASI
    ALTER TABLE notifikasi ADD COLUMN IF NOT EXISTS link_url TEXT;

    -- 8. UNIFIED CHAT
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sekolah_id UUID NOT NULL REFERENCES sekolah(id) ON DELETE CASCADE,
      tipe TEXT NOT NULL DEFAULT 'direct', -- 'direct' | 'global'
      nama TEXT,
      dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
      diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS chat_participants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
      last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(room_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
      pesan TEXT NOT NULL,
      dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
    ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
    ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "chat_rooms_policy" ON chat_rooms;
    CREATE POLICY "chat_rooms_policy" ON chat_rooms FOR ALL USING (true);
    DROP POLICY IF EXISTS "chat_participants_policy" ON chat_participants;
    CREATE POLICY "chat_participants_policy" ON chat_participants FOR ALL USING (true);
    DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;
    CREATE POLICY "chat_messages_policy" ON chat_messages FOR ALL USING (true);

    -- 9. MASTER KELAS & ANGGOTA KELAS
    INSERT INTO kelas (id, sekolah_id, nama_kelas, dibuat_pada)
    VALUES 
      ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kelas 8A', now() - interval '30 days'),
      ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kelas 8B', now() - interval '30 days')
    ON CONFLICT (id) DO UPDATE SET nama_kelas = EXCLUDED.nama_kelas;

    -- Set student profile & link to Kelas 8A
    UPDATE profil
    SET 
      nama_lengkap = 'Budi Kartika',
      nisn = '0089247182',
      nis = '260481',
      jurusan = 'Teknik Komputer & Jaringan',
      tahun_ajaran = '2026/2027',
      sekolah_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    WHERE id = 'a77413b2-dc71-44ac-abac-d3eb28727f33';

    INSERT INTO anggota_kelas (kelas_id, siswa_id)
    VALUES ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a77413b2-dc71-44ac-abac-d3eb28727f33')
    ON CONFLICT (kelas_id, siswa_id) DO NOTHING;

    -- Also ensure guru profile is set up nicely
    UPDATE profil
    SET 
      nama_lengkap = 'Ibu Siti Rahmawati, M.Pd.',
      sekolah_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    WHERE id = 'c403ff8b-2422-43c2-9abd-3f88ac55ec87';

    -- 10. SAMPLE AGENDA AKADEMIK
    DELETE FROM agenda_akademik WHERE sekolah_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    INSERT INTO agenda_akademik (sekolah_id, judul, deskripsi, kategori, tanggal, jam_mulai, jam_selesai, lokasi)
    VALUES
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ulangan Harian Matematika (Bab 1 Bilangan Berpangkat)', 'Ulangan harian formatif materi eksponen dan bentuk akar.', 'ulangan', '2026-09-15', '08:00:00', '09:30:00', 'Ruang Kelas 8A'),
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tugas Proyek Bahasa Indonesia (Teks LHO)', 'Pengumpulan laporan observasi lingkungan sekolah.', 'tugas', '2026-09-17', '10:00:00', '11:30:00', 'Lab Bahasa'),
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Penilaian Tengah Semester (PTS) Bahasa Inggris', 'Ujian sumatif tengah semester ganjil.', 'ujian', '2026-09-22', '07:30:00', '09:30:00', 'Ruang Ujian Utama'),
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Upacara Hari Pahlawan & Kegiatan Literasi', 'Kegiatan upacara bendera dan bedah buku bersama perpustakaan.', 'agenda', '2026-09-25', '07:00:00', '09:00:00', 'Lapangan Utama');

    -- 11. SAMPLE UJIAN ("AKU LULUS")
    -- Insert 1 active Ulangan and 1 active/upcoming Ujian
    DELETE FROM ujian WHERE sekolah_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    INSERT INTO ujian (id, sekolah_id, guru_id, kelas_id, mapel, judul, deskripsi, durasi_menit, passing_grade, waktu_mulai, waktu_berakhir, acak_soal, acak_opsi, status, tipe)
    VALUES
      (
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'c403ff8b-2422-43c2-9abd-3f88ac55ec87',
        'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Matematika',
        'Ulangan Harian 1: Bilangan Berpangkat & Aljabar',
        'Penilaian kompetensi dasar perpangkatan dan manipulasi aljabar.',
        60,
        75,
        now() - interval '1 hour',
        now() + interval '5 days',
        false,
        false,
        'dipublikasi',
        'ulangan'
      ),
      (
        'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'c403ff8b-2422-43c2-9abd-3f88ac55ec87',
        'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Bahasa Inggris',
        'Penilaian Tengah Semester (PTS) Ganjil',
        'Ujian sumatif resmi Bahasa Inggris Kelas 8.',
        90,
        75,
        now() - interval '30 minutes',
        now() + interval '7 days',
        true,
        true,
        'dipublikasi',
        'ujian'
      );

    -- 12. INITIAL SCHOOL GLOBAL CHAT ROOM
    INSERT INTO chat_rooms (id, sekolah_id, tipe, nama)
    VALUES ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'global', 'Forum Diskusi Sekolah')
    ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama;

    -- Add a welcome chat message from Guru
    DELETE FROM chat_messages WHERE room_id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    INSERT INTO chat_messages (room_id, sender_id, pesan, dibuat_pada)
    VALUES
      ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c403ff8b-2422-43c2-9abd-3f88ac55ec87', 'Selamat pagi anak-anak! Jangan lupa untuk mengecek jadwal Ulangan Harian dan materi Bab 1 di ruang Belajar ya.', now() - interval '15 minutes');
  `;

  await client.query(sql);
  console.log('Migration executed successfully!');
  await client.end();
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
