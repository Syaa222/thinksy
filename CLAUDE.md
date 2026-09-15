# thinksy — AI-Assisted Learning Platform (MVP Multi-Tenant)

Dokumen ini adalah ringkasan aturan arsitektur, konvensi teknis, dan alur kerja aplikasi pembelajaran mandiri berbasis AI Sokratik (Matematika Kelas 8).

---

## 1. Arsitektur 4 Dashboard & Rute Utama

- **👑 Super Admin:** `/super` — Analitik multi-tenant, pemantauan konsumsi token & biaya AI harian (USD/IDR), lisensi sekolah.
- **🏫 Admin Sekolah:** `/admin` — Manajemen Guru, Siswa, Kelas, Penetapan Wali Kelas & Profil Sekolah.
- **👨‍🏫 Guru Matematika:** `/guru` — Analitik kelas, Review Gate Bank Soal (AI & Manual), Koreksi & Override Nilai Esai Siswa, Pengaturan Jam & Status Presensi Kehadiran.
- **🎓 Siswa:** `/` — Dashboard mandiri, Latihan berpandu Tutor Sokratik AI, Kuis & Asesmen berwaktu, Jurnal Belajar (Stabilo & Catatan).

**Demo Mode Switcher:**
Tersedia tombol mengambang (*floating switcher*) di pojok kanan bawah untuk berpindah peran 1-klik (`Super Admin` ↔ `Admin Sekolah` ↔ `Guru` ↔ `Siswa`) saat pengujian dan demonstrasi.

---

## 2. Konvensi Koding & Standar Database

- **Nama Tabel & Kolom:** Bahasa Indonesia, `snake_case` (contoh: `profil`, `soal`, `opsi_soal`, `sesi`, `jawaban`, `presensi`, `log_ai`).
- **Nama Variabel & Fungsi:** Bahasa Inggris, `camelCase`.
- **Komponen UI:** `PascalCase` di folder `components/`.
- **Prompt AI Terisolasi:** Disimpan di `lib/prompts/` sebagai modul terpisah (contoh: `lib/prompts/tutor.ts`, `lib/prompts/nilai-esai.ts`).

---

## 3. Keamanan & Kebijakan AI

- **Anti-Bocor Kunci Jawaban:** Kunci jawaban objektif (`kunci_jawaban` dan `opsi_soal.benar`) tidak pernah dikirim ke browser siswa sebelum sesi kuis selesai (dilindungi via View `soal_publik` & server route handler).
- **Metode Sokratik Murni:** AI tidak pernah memberikan jawaban akhir langsung, membimbing bertahap 1 langkah per percakapan, maksimal 4 kalimat, format LaTeX diapit `$`.
- **Human-in-the-Loop:** Guru memiliki wewenang override mutlak pada nilai rekomendasi AI.
- **Kontrol Biaya & Rate Limit:** Maksimal 5 pesan/menit dan 20 pesan/hari per siswa. Riwayat percakapan yang dikirim ke API dipotong maksimal 10 giliran terakhir. Semua pemanggilan dicatat di tabel `log_ai`.

---

## 4. Sinkronisasi Real-time (Supabase Channel)

Nama Channel: `realtime-dashboard-global`
Event yang didukung:
- `ATTENDANCE_CHECKIN`: Siswa melakukan check-in.
- `ATTENDANCE_VERIFIED`: Guru mengubah status atau jam kehadiran siswa.
- `NEW_ESSAY_SUBMISSION`: Siswa mengumpulkan jawaban kuis/esai (antrean guru terupdate otomatis).
- `ESSAY_GRADED`: Guru menyetujui / override nilai esai siswa (dashboard siswa terupdate otomatis).
- `SOAL_PUBLISHED`: Guru menerbitkan soal latihan baru (dashboard siswa menerima notifikasi).
