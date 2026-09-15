---
version: 1
slug: "app-siswa-dashboard-studentdashboardclient-tsx"
primary_target: "app/(siswa)/dashboard/StudentDashboardClient.tsx"
related_targets: []
---

---
version: 1
slug: "app-siswa-dashboard-studentdashboardclient-tsx"
primary_target: "app/(siswa)/dashboard/StudentDashboardClient.tsx"
related_targets: []
---

# Surface: Dashboard Siswa (Student Dashboard)

**Scope**: `app/(siswa)/dashboard/` — halaman utama siswa (navbar, FAB, 4 tab: Belajar/Ruang Belajar/Peringkat/Pencapaian, semua modal terkait).
**Visitor mode**: Operate — siswa SMP menyelesaikan tugas harian (presensi, cek progres, lanjut belajar), ekspresi visual tidak boleh mengaburkan tugas.

## Audiens, tugas, konten, batasan

- **Audiens**: siswa SMP kelas 7-9 Indonesia, mayoritas akses lewat HP; wali kelas kadang ikut melihat.
- **Tugas prioritas** (dikonfirmasi user): **Presensi** dan **Catatan (Notes)** adalah dua fitur terpenting — harus paling mudah ditemukan.
- **Cakupan konten yang diinginkan** (dikonfirmasi user, membatasi dari versi lama yang terlalu padat): info sekolah, progress belajar, CTA ke materi terakhir yang dibaca siswa, kalender/jadwal, dan daftar kelas yang diikuti. Elemen lain di luar ini (promo Jurnal, promo Ujian, dll.) tidak lagi jadi bagian utama tampilan.
- **Quick action**: dikonfirmasi user — perlu satu section/tombol aksi cepat bertema "Mau ngapain hari ini?", dengan interface fun & joyful.
- **Frekuensi**: dipakai harian, kadang berkali-kali sehari (cek presensi pagi, buka catatan sela waktu, cek progres sore).
- **Constraint**: koneksi mobile Indonesia kadang tidak stabil — kegagalan jaringan harus terlihat (lihat PRODUCT.md Product Principles #5).

## Direction contract

**THESIS**: Dashboard bukan lagi kumpulan kartu SaaS admin, tapi satu dinding loker sekolah bernomor — tiap loker adalah satu jenis konten (Presensi, Lanjutkan Belajar, Jadwal, Kelas Diikuti, Catatan), dibuka dengan aksi buka-pintu, menolak susunan "grid kartu generik" yang jadi default kategori ini.

**OWN-WORLD**: Dinding loker bergaya sekolah asli — bidang pintu logam dengan sedikit tekstur cat & goresan halus (bukan flat vector kaku), setiap pintu dicat warna berbeda per kategori dari palet Full-palette 4-peran: Presensi = mint/teal segar, Lanjutkan Belajar (CTA materi) = coral/oranye hangat, Jadwal = lavender/periwinkle, Kelas Diikuti = kuning cerah; ground dinding krem hangat (bukan slate dingin #f8fafc), outline pintu graphite lembut (bukan hitam pekat). Nameplate loker bergaya label laminating dengan sudut membulat besar. Font tetap Plus Jakarta Sans (brand commitment) tapi lebih besar & rounded-friendly. Maskot robot Thinksy (dari logo) tampil sebagai "gantungan kunci" personal tergantung di loker milik siswa sendiri — elemen identitas berulang, bukan cuma di logo.

**STORY**: Siswa membuka dashboard dan melihat "lorong lokernya sendiri"; mengenali loker mana untuk apa dari warna nameplate (bukan dari membaca teks kecil dulu); loker Presensi & "Lanjutkan Belajar" paling besar/menonjol karena prioritas tertinggi; loker "Mau Ngapain Hari Ini?" jadi titik masuk aksi cepat yang fun, bukan FAB generik tanpa label.

**FIRST VIEWPORT**: Header ringkas (nama sekolah + sapaan personal, bukan hero banner besar gelap seperti sekarang), lalu grid loker: baris pertama berisi loker Presensi dan loker Lanjutkan Belajar (ukuran besar, dominan), baris kedua loker Jadwal + Kelas Diikuti (ukuran sedang), section "Mau Ngapain Hari Ini?" sebagai strip aksi cepat berisi Catatan + 1-2 aksi lain, ditempatkan menonjol bukan disembunyikan di balik FAB tanpa label. Progress belajar tampil sebagai indikator ringkas terpadu (bukan section terpisah panjang).

**FORM**: Diturunkan dari eksplorasi arah visual (buku agenda sekolah, binder photocard, sash lencana pramuka, panel komik, buku tabungan berstempel, loker sekolah bernomor, papan skor manual) — loker sekolah dipilih karena kecocokan langsung dengan pembatasan konten yang diminta (satu loker = satu jenis konten) dan familiaritas fisik harian siswa. Diperkuat 2 raise: (1) mini "peta lorong" ringkas di atas grid loker agar siswa langsung tahu loker mana untuk apa — mengatasi masalah discoverability yang ditemukan di critique sebelumnya; (2) tepi pintu loker memakai gradasi pastel lembut, bukan warna blok datar, untuk memperkuat nuansa fun/joyful. Seed key: `7d621ffc` (direction scope, mode operate), kandidat #4 dari 7 kandidat tergrounded.

**FINISH**: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Warna (color strategy)

**Full palette, 4 peran bernama** (bukan Restrained — brief eksplisit minta fun/joyful, dan warna di sini juga berfungsi sebagai penanda kategori/wayfinding, bukan dekorasi semata):
- Mint/Teal — Presensi
- Coral/Oranye hangat — Lanjutkan Belajar (CTA materi terakhir)
- Lavender/Periwinkle — Jadwal
- Kuning cerah — Kelas Diikuti
- Ground: krem hangat; outline: graphite lembut; teks: charcoal (bukan navy #0F172A / slate-950)

## Belum diputuskan

- Palet warna & implementasi presisi (kode hex final) akan ditentukan saat eksekusi — kerangka peran warna sudah dikunci di atas.
- Apakah tab "Ruang Belajar"/"Peringkat"/"Pencapaian" yang sudah ada tetap dipertahankan sebagai tab terpisah di luar homepage loker, atau ikut diringkas — belum dibahas eksplisit, akan dikonfirmasi sebelum implementasi tab tersebut (di luar scope redesign homepage/tab Belajar pertama).
- Path build: tidak ada tool image-generation terkonfirmasi di sesi ini, sehingga jalur pembangunan adalah **code-led** (tanpa comp gambar) — ambisi visual dituliskan di FIRST VIEWPORT & signature interaction di atas, diaudit lewat review akhir.
