-- ============================================================================
-- MASTER SEED DATA DEMO PRESENTASI (4 DASHBOARD REALTIME)
-- Jalankan script ini di: Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================================

-- 1. MASTER SEKOLAH (TENANT)
INSERT INTO sekolah (id, nama, npsn, alamat, motto, deskripsi, bg_image_url, links)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'SMP Negeri 1 Nusantara',
  '20402099',
  'Jl. Pendidikan No. 1, Nusantara',
  'Sekolah Unggul Berbasis Teknologi Pembelajaran AI',
  'SMP Negeri 1 Nusantara adalah sekolah percontohan digital yang menerapkan pembelajaran mandiri berbasis AI Sokratik dan supervisi guru aktif.',
  '/images/smk-muh1-playen.jpg',
  '[{"label": "Portal Sekolah", "url": "https://sekolah.sch.id", "icon": "Globe"}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nama = EXCLUDED.nama,
  motto = EXCLUDED.motto;

-- 2. KELAS
INSERT INTO kelas (id, sekolah_id, nama_kelas, dibuat_pada)
VALUES 
  ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kelas 8A', now() - interval '30 days'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kelas 8B', now() - interval '30 days')
ON CONFLICT (id) DO NOTHING;

-- 3. PROFIL 4 ROLE LENGKAP
-- Catatan: Profil dapat langsung di-link atau dibuat di tabel profil
INSERT INTO profil (id, sekolah_id, nama_lengkap, peran, poin, streak)
VALUES
  -- 👑 1. Super Admin
  ('11111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bapak Hendra Wijaya, M.Cs (Super Admin)', 'super_admin', 0, 0),
  -- 🏫 2. Admin Sekolah
  ('22222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ibu Ratna Kumalasari, S.Pd (Admin Sekolah)', 'admin_sekolah', 0, 0),
  -- 👨‍🏫 3. Guru Matematika
  ('33333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ibu Siti Rahmawati, M.Pd (Guru Matematika)', 'guru', 0, 0),
  -- 🎓 4. Siswa Budi
  ('44444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Budi Kartika (Siswa)', 'siswa', 380, 5),
  -- Siswa Tambahan untuk Statistik Kelas
  ('55555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ahmad Raihan', 'siswa', 520, 7),
  ('66666666-6666-6666-6666-666666666666', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Dewi Kartika', 'siswa', 290, 3),
  ('77777777-7777-7777-7777-777777777777', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Siti Rahma Putri', 'siswa', 440, 6),
  ('88888888-8888-8888-8888-888888888888', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Gilang Ramadhan', 'siswa', 150, 1)
ON CONFLICT (id) DO UPDATE SET
  nama_lengkap = EXCLUDED.nama_lengkap,
  peran = EXCLUDED.peran,
  poin = EXCLUDED.poin,
  streak = EXCLUDED.streak;

-- 4. PRESENSI HARI INI
INSERT INTO presensi (siswa_id, tanggal, waktu_masuk, status)
VALUES
  ('44444444-4444-4444-4444-444444444444', CURRENT_DATE, (CURRENT_DATE + interval '7 hours 15 minutes')::timestamptz, 'Hadir (Tepat Waktu)'),
  ('55555555-5555-5555-5555-555555555555', CURRENT_DATE, (CURRENT_DATE + interval '7 hours 10 minutes')::timestamptz, 'Terverifikasi'),
  ('66666666-6666-6666-6666-666666666666', CURRENT_DATE, (CURRENT_DATE + interval '7 hours 25 minutes')::timestamptz, 'Terverifikasi'),
  ('77777777-7777-7777-7777-777777777777', CURRENT_DATE, (CURRENT_DATE + interval '7 hours 35 minutes')::timestamptz, 'Terlambat')
ON CONFLICT (siswa_id, tanggal) DO UPDATE SET
  status = EXCLUDED.status,
  waktu_masuk = EXCLUDED.waktu_masuk;

-- 5. LOG PENGGUNAAN AI (UNTUK GRAFIK BIAYA SUPER ADMIN & GURU)
INSERT INTO log_ai (sekolah_id, pengguna_id, fitur, prompt_tokens, completion_tokens, total_tokens, biaya_usd, dibuat_pada)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '44444444-4444-4444-4444-444444444444', 'tutor_sokratik', 180, 240, 420, 0.0000855, now() - interval '2 hours'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '44444444-4444-4444-4444-444444444444', 'tutor_sokratik', 210, 190, 400, 0.0000728, now() - interval '1 hour'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '55555555-5555-5555-5555-555555555555', 'grading_esai', 350, 120, 470, 0.0000623, now() - interval '4 hours'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '66666666-6666-6666-6666-666666666666', 'grading_esai', 320, 140, 460, 0.0000660, now() - interval '3 hours'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '33333333-3333-3333-3333-333333333333', 'generate_soal', 550, 480, 1030, 0.0001853, now() - interval '1 day');

-- 6. SESI & ANTREAN PENILAIAN ESAI
INSERT INTO sesi (id, siswa_id, bab_id, sekolah_id, tipe_sesi, status_sesi, skor_akhir, mulai_pada, selesai_pada)
VALUES (
  's1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '44444444-4444-4444-4444-444444444444',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'kuis',
  'selesai',
  85,
  now() - interval '1 hour',
  now() - interval '45 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- 7. NOTIFIKASI AWAL
INSERT INTO notifikasi (user_id, judul, pesan, tipe, dibaca, dibuat_pada)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'Selamat Datang di thinksy! 🚀', 'Mulailah belajar Bab 1 Pola Bilangan dan tanyakan materi pada Tutor AI Sokratik saat latihan.', 'info', false, now() - interval '1 day'),
  ('44444444-4444-4444-4444-444444444444', 'Presensi Hari Ini Tercatat ⏰', 'Kehadiranmu hari ini pada pukul 07:15 WIB telah diverifikasi guru.', 'sukses', false, now() - interval '2 hours');

-- Selesai! Data siap untuk presentasi live di depan dosen.
