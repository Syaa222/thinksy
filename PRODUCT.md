# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary**: Siswa SMP (kelas 7-9) di Indonesia, mengakses Thinksy sendiri — mayoritas lewat HP, sering di sela waktu terbatas (jeda kelas, di rumah). Melakukan presensi harian, membaca materi, mengerjakan latihan/kuis/ujian, mengecek progres belajar, dan mencatat catatan pribadi.

**Sekunder**: Wali kelas/guru kadang ikut melihat atau membantu siswa membuka dashboard ini (mis. saat presensi bermasalah atau membantu navigasi), meski dashboard ini utamanya dirancang untuk dipakai mandiri oleh siswa.

Peran lain di sistem (guru, admin_sekolah, super_admin) punya dashboard terpisah di luar cakupan surface ini.

## Product Purpose

Thinksy adalah platform belajar berbasis AI multi-tenant (banyak sekolah) untuk siswa SMP Indonesia. Awalnya di-scope untuk Matematika Kelas 8 (lihat context.md), kini sudah berkembang mencakup banyak mata pelajaran (9 mapel Kurikulum Merdeka), sistem ujian/assessment berwaktu, jurnal digital, presensi berbasis deteksi wajah (liveness AI), tutor AI Sokratik (memberi petunjuk bertahap, bukan jawaban langsung), dan lapisan gamifikasi (poin belajar, streak harian, misi, peringkat/leaderboard) untuk mendorong kebiasaan belajar rutin. Sukses berarti siswa kembali setiap hari, menyelesaikan presensi & misi, dan merasa dashboard ini "dibuat untuk mereka", bukan sekadar tool sekolah generik.

## Positioning

Kombinasi tutor AI Sokratik (tidak pernah memberi jawaban akhir, hanya membimbing) + presensi berbasis liveness-detection AI + gamifikasi belajar harian dalam satu produk multi-tenant untuk sekolah — kombinasi yang platform LMS generik atau aplikasi presensi terpisah tidak bisa tiru begitu saja.

## Operating Context

- Multi-tenant: setiap sekolah (sekolah_id) punya data & pengguna terisolasi (RLS wajib).
- Siswa mengakses lewat browser mobile mayoritas, kadang di koneksi tidak stabil.
- Presensi harian punya jendela waktu (cutoff pagi) — status "Alpha" (alpa) berkonsekuensi akademik nyata.
- Materi & jadwal mengikuti kalender sekolah (per kelas/rombel).

## Capabilities and Constraints

- 4 peran: super_admin, admin_sekolah, guru, siswa (enum `peran`).
- Kunci jawaban objektif tidak boleh dikirim ke client selama sesi latihan/kuis berjalan.
- Semua panggilan AI wajib lewat route handler server-side (rate limit: maks 20 pesan chat AI/siswa/hari, tercatat di `log_ai`).
- Kuis & Assessment: timer, tanpa bantuan AI Tutor, auto-submit.
- **Catatan tech stack**: ditemukan inkonsistensi terdokumentasi antara context.md (menyebut Anthropic Claude) dan README/kode (menyebut Gemini 2.5 Flash; `@anthropic-ai/sdk` juga ada di package.json) — belum dikonfirmasi mana yang aktif digunakan saat ini; jangan jadikan salah satu asumsi pasti tanpa verifikasi lebih lanjut.
- **Gamifikasi (poin, streak, misi, peringkat) adalah bagian resmi produk** — larangan gamifikasi di context.md (dokumen spek MVP awal) dinyatakan sudah usang oleh pemilik produk; boleh didesain ulang dan ditonjolkan, bukan dihapus.

## Brand Commitments

- Nama produk: **Thinksy**. Tagline: "LEARN SMARTER, GROW FURTHER".
- **Maskot wajib**: robot AI ramah bergaya kartun, memakai topi wisuda, muncul dari buku terbuka, dengan bubble bicara "AI" — sudah ada di app icon & logo (`app/icon.png`, `public/logo.png`). Pemilik produk mengonfirmasi maskot ini **wajib dipakai konsisten** sebagai bagian bahasa visual produk, termasuk di dashboard siswa — bukan hanya elemen logo yang berdiri sendiri.
- Font saat ini: Plus Jakarta Sans (dipertahankan kecuali user menyatakan sebaliknya di new-work).

## Evidence on Hand

- Logo/icon nyata di `app/icon.jpg`, `app/icon.png`, `public/logo.jpg`, `public/logo.png` — sumber rupa maskot robot AI di atas.
- Struktur data nyata tersedia di `app/(siswa)/dashboard/types.ts` (DailyMission, LeaderboardStudent, ChapterItem, ScheduleItem, NotificationItem, dll.) — dipakai sebagai fakta konten, bukan diciptakan.
- Tidak ada riset pengguna/testimoni yang tercatat — jangan mengarang kutipan atau data pengguna nyata di surface manapun.

## Product Principles

1. Bahasa visual harus terasa dibuat untuk siswa SMP Indonesia (fun, joyful, sederhana) — bukan template SaaS enterprise yang ditempeli istilah sekolah.
2. Maskot robot AI Thinksy adalah elemen identitas berulang, bukan dekorasi sekali pakai di logo.
3. Presensi dan Catatan (Notes) adalah dua fitur prioritas tertinggi di dashboard siswa — harus paling mudah ditemukan dan diakses.
4. Gamifikasi (poin/streak/misi/peringkat) mendukung kebiasaan harian dan boleh ditonjolkan, tapi tidak boleh mengorbankan kejelasan tugas utama (presensi, belajar, progres).
5. Desain harus tetap berfungsi baik di koneksi mobile Indonesia yang tidak selalu stabil — kegagalan jaringan harus terlihat, bukan diam-diam disembunyikan.

## Accessibility & Inclusion

Belum ada standar aksesibilitas eksplisit yang ditetapkan pemilik produk. Temuan audit sebelumnya (lihat `.impeccable/critique/`) mencatat gap WCAG AA nyata (fokus keyboard, ARIA pada modal/dropdown, ketergantungan warna semata) yang harus dipertimbangkan pada pekerjaan desain berikutnya meski belum menjadi persyaratan formal dari pemilik produk.
