<!-- converted from Rencana perbaikan Thinksy.docx -->

Rencana Perbaikan Aplikasi Thinksy
Fitur Siswa & Guru [Permasalahan, Prompt Siap Pakai, dan Hasil yang Diharapkan]
Disusun: 26 Agustus 2026
Dokumen ini berisi daftar perbaikan untuk fitur SISWA dan GURU pada aplikasi Thinksy. Setiap poin ditulis dengan bahasa sederhana dan dilengkapi “prompt siap pakai” — yaitu kalimat perintah yang bisa langsung Anda berikan kepada pemrogram atau asisten AI (seperti Claude Code / Cursor) untuk mengerjakan perbaikannya. Bagian 1 membahas dua perbaikan prioritas secara rinci. Bagian 2 merangkum perbaikan lainnya dalam bentuk tabel.
# Bagian 1 — Perbaikan Prioritas (Rinci)
## 1. Mengamankan Kunci Jawaban Soal
Permasalahan:
Walaupun di layar tidak terlihat, siswa yang sudah login sebenarnya masih bisa “mengintip” kunci jawaban dan pembahasan soal langsung dari database lewat trik teknis di browser (kolom kunci_jawaban & pembahasan pada tabel soal, serta kolom benar pada tabel opsi_soal). Artinya kuis dan latihan berpotensi dicurangi.
Prompt siap pakai:

Hasil yang diharapkan:
Siswa tidak bisa lagi melihat atau mengunduh kunci jawaban/pembahasan lewat cara apa pun. Penilaian tetap akurat karena dihitung di server. Guru dan admin tetap punya akses penuh.
## 2. Mengganti Seluruh Konten ke Kurikulum Merdeka (SMP, Fase D)
Permasalahan:
Sebagian besar isi aplikasi — bab, materi, dan soal — adalah contoh palsu yang ditanam langsung di dalam kode. Banyak yang bahkan di luar pelajaran (persamaan kuadrat, rumus ABC, sampai mata pelajaran Fisika/Biologi/Kimia), padahal ini aplikasi Matematika SMP. Di database pun hanya ada 1 bab contoh (Pola Bilangan). Akibatnya siswa tidak belajar materi yang benar dan guru tidak bisa mengandalkan isinya.
Prompt siap pakai:

Hasil yang diharapkan:
Seluruh bab, materi, dan soal menjadi materi Matematika Kelas 8 yang nyata dan sesuai Kurikulum Merdeka (Fase D) beserta Tujuan Pembelajarannya. Tidak ada lagi konten palsu atau mapel di luar Matematika. Materi asli buatan guru tampil dengan benar di layar siswa, dan semua konten bersumber dari database sehingga mudah diperbarui.
# Bagian 2 — Daftar Perbaikan Lainnya
## A. Fitur Siswa

## B. Fitur Guru

## C. Umum (Siswa & Guru)

| Tolong amankan kunci jawaban soal supaya tidak bisa diakses oleh siswa dengan cara apa pun.

Konteks: aplikasi Next.js + Supabase. Saat ini siswa yang login masih bisa membaca kolom
`kunci_jawaban` dan `pembahasan` di tabel `soal`, serta kolom `benar` di tabel `opsi_soal`,
langsung dari database (lewat anon key di browser), walau tampilan tidak menunjukkannya.

Yang harus dilakukan:
1. Di Supabase, buat dua VIEW aman untuk siswa: `soal_publik` (semua kolom `soal` KECUALI
   `kunci_jawaban` dan `pembahasan`) dan `opsi_soal_publik` (semua kolom `opsi_soal` KECUALI `benar`).
2. Atur izin agar siswa HANYA boleh membaca dari kedua view itu, bukan dari tabel aslinya.
   Guru dan admin tetap boleh membaca tabel asli secara lengkap.
3. Ubah semua kode sisi siswa (halaman & komponen latihan/kuis/eksplorasi) agar mengambil soal
   dari view aman tersebut, dan pastikan tidak ada kolom kunci jawaban yang ikut terkirim ke browser.
4. Penilaian benar/salah harus tetap dihitung di server (endpoint /api/quiz/grade-essay), bukan di browser.
5. Terakhir, tunjukkan cara mengetes bahwa siswa benar-benar sudah tidak bisa membaca kunci jawaban. |
| --- |
| Tolong ganti SELURUH isi pembelajaran aplikasi (bab, materi, dan soal) menjadi konten nyata
yang 100% sesuai Kurikulum Merdeka untuk Matematika SMP, dan hilangkan semua konten contoh/palsu di kode.

ATURAN KONTEN (WAJIB):
1. Semua konten mengikuti Kurikulum Merdeka jenjang SMP. Matematika SMP berada di FASE D (kelas 7-8-9).
   Aplikasi ini untuk KELAS 8, jadi gunakan cakupan materi Kelas 8 dalam Fase D.
2. Susun berjenjang: Bab -> Materi -> Soal. Setiap Bab dan Materi harus mengacu pada Capaian Pembelajaran (CP)
   Fase D dan dijabarkan menjadi Tujuan Pembelajaran (TP) reguler. Cantumkan TP terkait pada deskripsi tiap bab/materi.
3. Cakupan materi Matematika Kelas 8 (Fase D) minimal mencakup:
   (a) Bilangan  - Pola Bilangan & Barisan (aritmetika/geometri);
   (b) Aljabar   - Bentuk Aljabar; Persamaan & Pertidaksamaan Linear Satu Variabel; Relasi & Fungsi;
                   Persamaan Garis Lurus; Sistem Persamaan Linear Dua Variabel (SPLDV);
   (c) Geometri & Pengukuran - Teorema Pythagoras; Bangun Ruang Sisi Datar (kubus, balok, prisma, limas);
   (d) Analisis Data & Peluang - Statistika (rata-rata, median, modus, penyajian data) dan Peluang.
   (Verifikasi/sesuaikan dengan CP resmi Kemendikbud terbaru bila ada penyesuaian.)
4. Setiap Materi: tulis konten pembelajaran dalam format Markdown (boleh memuat rumus matematika) yang
   jelas dan runtut, tersimpan di kolom `konten_markdown`.
5. Setiap Bab: sediakan beberapa Soal campuran pilihan ganda dan esai, lengkap dengan `kunci_jawaban`,
   `pembahasan`, dan tingkat kesulitan (mudah/sedang/sulit). Pastikan soal relevan dengan TP materinya.

YANG HARUS DILAKUKAN DI KODE & DATABASE:
6. Buat/isi ulang file seed database (schema.sql / seed.sql) dengan seluruh Bab, Materi, dan Soal di atas
   untuk sekolah contoh, memakai tabel yang sudah ada (`bab`, `materi`, `soal`, `opsi_soal`).
7. Hapus semua konten contoh yang di-hardcode di komponen & halaman (mis. soal kuadrat/diskriminan di
   komponen kuis, materi kuadrat di daftar materi, mapel Fisika/Biologi/Kimia di dashboard) dan ganti
   agar semuanya diambil dari database.
8. Perbaiki bug tampilan materi: pada halaman baca materi, data dari database bernama `konten_markdown`,
   tetapi kode membacanya sebagai `konten` sehingga isi asli tidak pernah muncul. Samakan penamaannya.
9. Pastikan judul, label kelas, dan nama bab yang muncul di layar mengikuti data database (bukan teks
   “Bab 1” atau “Matematika Kelas X” yang di-hardcode).

Terakhir, tampilkan ringkasan daftar Bab-Materi-Soal yang dibuat beserta TP-nya agar mudah diperiksa guru. |
| --- |
| Permasalahan singkat | Prompt siap pakai | Hasil yang diharapkan |
| --- | --- | --- |
| Halaman hasil ujian/kuis menampilkan nilai yang sama untuk semua siswa (selalu 88, benar 22, salah 3) karena angkanya ditulis mati di kode. | Perbaiki halaman hasil ujian/kuis (components/sesi/ExamResultClient.tsx dan app/(siswa)/hasil/[sesiId]) agar menampilkan hasil NYATA berdasarkan sesiId: ambil skor, jumlah benar/salah, dan pembahasan tiap soal dari tabel `sesi` dan `jawaban`. Hapus semua angka contoh yang di-hardcode. | Setiap siswa melihat nilai dan pembahasan sesuai jawabannya sendiri, bukan angka yang sama untuk semua orang. |
| Halaman kuis (/quiz) memakai 25 soal contoh yang tidak sesuai pelajaran, kunci jawabannya tertanam di browser (mudah dicurangi), dan hasilnya tidak tersimpan. | Ubah halaman kuis (components/sesi/ExamPracticeClient.tsx) agar memakai soal asli dari database, menyimpan jawaban siswa ke tabel `jawaban`, dan menilai lewat server. Hilangkan kunci jawaban dari sisi browser. Samakan alurnya dengan komponen latihan yang sudah benar (SessionQuizClient.tsx). | Kuis memakai soal resmi, jawaban tersimpan, hasil bisa dilihat kembali, dan tidak bisa dicurangi lewat browser. |
| Menurut aturan aplikasi, Kuis & Assessment harus pakai timer dan otomatis terkumpul saat waktu habis, TANPA AI. Saat ini malah tidak ada timer dan tutor AI justru aktif. | Tambahkan hitung mundur (timer) + pengumpulan otomatis saat waktu habis untuk sesi tipe `kuis` dan `assessment`, dan nonaktifkan tutor AI (hasAI=false) untuk kedua tipe itu (AI hanya untuk `latihan` dan `eksplorasi`). Perbaiki juga app/(siswa)/assessment/[sesiId]/page.tsx yang sekarang hanya meniru halaman latihan. | Kuis dan Assessment berjalan dengan batas waktu, terkumpul otomatis, dan tanpa bantuan AI — sesuai aturan. |
| Misi harian memberi poin tanpa benar-benar menyelesaikan tugas, dan poin bisa diklaim berulang tanpa batas setiap halaman dimuat ulang. (Fitur opsional / di luar cakupan.) | (Opsional — boleh dihapus.) Jika dipertahankan: perbaiki app/api/siswa/misi/route.ts. Simpan misi per-siswa per-tanggal di tabel `misi_harian` dengan id UUID (jangan id teks q1/q2/q3). Sebelum memberi poin, pastikan progres sudah mencapai target; setelah diklaim, tandai diklaim=true agar tidak bisa diklaim lagi. Hilangkan jalur cadangan yang memberi poin tanpa pengecekan. | Poin hanya diberikan jika misi benar-benar selesai, dan hanya bisa diklaim satu kali. |
| Fitur presensi mengklaim “wajah terdeteksi”, padahal hanya menghitung warna mirip kulit — tembok, tangan, atau foto pun dianggap wajah, jadi absen mudah dipalsukan. | Perbaiki presensi selfie (app/(siswa)/StudentDashboardClient.tsx). Ganti deteksi berbasis warna kulit dengan deteksi wajah sungguhan (mis. face-api.js atau MediaPipe); ATAU jika deteksi wajah belum diperlukan, hapus klaim “wajah terdeteksi” dan sebut apa adanya “foto presensi”. Jangan menyiarkan foto ke saluran realtime yang bisa dilihat pengguna lain. | Presensi tidak lagi memberi klaim palsu; kalaupun ada deteksi wajah, benar-benar berfungsi; foto tidak bocor ke pengguna lain. |
| Angka “streak” (rentetan hari) selalu 14 untuk semua siswa karena tidak pernah dihitung ulang. (Fitur opsional / di luar cakupan.) | (Opsional — boleh dihapus.) Jika dipertahankan: hitung streak saat siswa presensi harian — tambah 1 jika kemarin hadir, kembali ke 0 jika bolong — lalu simpan ke profil.streak. Ubah nilai awal streak di database dari 14 menjadi 0. | Streak mencerminkan kehadiran nyata siswa, bukan angka tetap 14. |
| Peringkat selalu menampilkan “#1 dari 1 Siswa” karena aturan keamanan hanya membuka data siswa itu sendiri. (Fitur opsional / di luar cakupan.) | (Opsional — boleh dihapus.) Jika dipertahankan: buat fungsi database khusus (RPC SECURITY DEFINER) yang mengembalikan peringkat per sekolah tanpa membuka data pribadi siswa lain, dan tampilkan hanya lingkup sekolah (bukan “nasional”). Perbaiki app/api/siswa/peringkat/route.ts agar difilter per sekolah_id. | Peringkat menampilkan banyak siswa dalam satu sekolah dengan benar — atau fitur dihapus jika tidak dipakai. |
| Kotak notifikasi selalu menampilkan 3 pesan contoh (Biologi/Fisika) yang tidak nyata, dan “tandai sudah dibaca” tidak tersimpan. | Perbaiki app/api/siswa/notifikasi/route.ts agar mengembalikan daftar KOSONG ketika belum ada notifikasi (bukan 3 pesan contoh). Pastikan “tandai sudah dibaca” menyimpan status ke database. | Notifikasi hanya menampilkan pesan asli; jika kosong tampil kosong; status “dibaca” tersimpan. |
| Di dashboard siswa, kartu “Kelas Aktif” menampilkan mapel Fisika/Kimia, “Kelas X”, dan progres 75%/40%/20% yang semuanya ditulis mati, padahal ini Matematika Kelas 8. | Perbaiki dashboard siswa (app/(siswa)/StudentDashboardClient.tsx) agar kartu kelas dan lingkaran progres mengambil data nyata dari database (mata pelajaran, kelas, progres belajar). Hapus mapel & persentase yang di-hardcode; sesuaikan label menjadi Matematika Kelas 8. | Dashboard menampilkan kelas dan progres yang sebenarnya, bukan angka contoh. |
| Semua lencana pencapaian selalu tampil “Terbuka ✓” tanpa memandang aktivitas siswa. (Fitur opsional / di luar cakupan.) | (Opsional — boleh dihapus.) Jika dipertahankan: tentukan status tiap lencana berdasarkan data nyata siswa (mis. jumlah kuis selesai, streak, poin), jangan selalu “Terbuka”. | Lencana terbuka hanya jika syaratnya benar-benar tercapai — atau dihapus. |
| Halaman bab menampilkan bab palsu “Persamaan Kuadrat” untuk id yang tidak dikenal, progres 25% & 2 modul pertama selalu “Selesai”, dan beberapa tautan daftar isi tidak berfungsi. | Perbaiki halaman bab (app/(siswa)/bab/[id]/page.tsx & DaftarMateriClient.tsx): tampilkan halaman “tidak ditemukan” jika bab tidak ada (jangan tampilkan bab contoh), hitung progres dari data nyata, dan benahi tautan daftar isi yang mati (href=“#”). | Halaman bab hanya menampilkan bab asli, progres nyata, dan semua tautan berfungsi. |
| Halaman Eksplorasi masih berupa halaman kosong sementara, dan cara membaca alamat halaman sudah tidak sesuai Next.js versi baru sehingga rawan error. | Implementasikan halaman Eksplorasi (app/(siswa)/eksplorasi/[sesiId]/page.tsx) sesuai alur soal AI yang bisa dipakai setelah ditinjau guru. Perbaiki cara membaca parameter halaman menjadi `const { sesiId } = await params` sesuai Next.js terbaru. | Halaman Eksplorasi berfungsi penuh dan tidak error di Next.js versi baru. |
| Beberapa tombol tidak berfungsi (Pusat Bantuan, Simpan Pengaturan), pilihan “Tingkat Bimbingan Tutor AI” & mode gelap tidak tersimpan, dan klaim misi tetap “berhasil” walau koneksi gagal. | Di dashboard siswa: hubungkan tombol “Pusat Bantuan” & “Simpan Pengaturan” ke aksi nyata (atau sembunyikan bila belum siap), simpan pilihan “Tingkat Bimbingan Tutor AI” & mode gelap agar bertahan setelah refresh, dan perbaiki agar klaim misi tidak menampilkan “berhasil” saat permintaan ke server gagal. | Semua tombol & pengaturan berfungsi dan tersimpan; tidak ada pesan “berhasil” palsu. |
| Permasalahan singkat | Prompt siap pakai | Hasil yang diharapkan |
| --- | --- | --- |
| Di halaman penilaian, tombol “Simpan & Setujui Nilai” tidak benar-benar menyimpan ke database, dan hanya bisa dipakai untuk satu siswa contoh (s1). | Perbaiki app/(guru)/guru/penilaian/page.tsx: tampilkan daftar jawaban esai NYATA dari tabel `jawaban` (join `sesi`) milik sekolah guru, dan buat tombol “Simpan & Setujui Nilai” menyimpan nilai + catatan ke tabel `jawaban` untuk siswa mana pun (bukan hanya s1). Buat kolom input nilai bisa diubah untuk semua siswa. | Guru bisa menilai semua siswa dan nilainya benar-benar tersimpan. |
| Halaman kurasi soal AI (Eksplorasi) hanya menampilkan satu soal contoh; tombol “Terbitkan” & “Tolak” tidak mengubah status soal di database. | Perbaiki app/(guru)/guru/soal/eksplorasi/page.tsx agar menampilkan daftar soal berstatus “draft”/“review” dari database milik sekolah guru. Tombol “Terbitkan” mengubah status_soal menjadi “dipublikasi”, “Tolak/Arsip” menjadi “diarsipkan”. Aktifkan tombol “Edit & Revisi”. | Guru bisa meninjau, menerbitkan, atau menolak soal AI, dan statusnya benar-benar berubah. |
| Soal buatan AI langsung berstatus “dipublikasi” (melewati proses tinjauan guru) dan selalu dikaitkan ke satu bab yang sama. | Ubah penyimpanan soal (app/api/guru/simpan-soal/route.ts & app/(guru)/buat-soal/page.tsx) agar soal baru disimpan sebagai “draft” (atau “review”), bukan langsung “dipublikasi”. Kaitkan soal ke bab sesuai topik yang dipilih (jangan pakai bab tetap), isi sekolah_id & pembuat_id. Publikasi hanya lewat halaman kurasi guru. | Soal AI masuk antrean tinjauan dulu, terkait bab yang benar, dan hanya tayang setelah disetujui guru. |
| Saat guru menekan “Simpan & Verifikasi Absen”, SEMUA presensi hari ini di semua sekolah ikut terverifikasi; daftar presensi juga menampilkan siswa sekolah lain. Bahkan saat gagal, sistem menampilkan pesan berhasil. | Perbaiki presensi guru (app/(guru)/guru/siswa/page.tsx & app/api/guru/presensi/route.ts): saring data GET dan aksi verifikasi hanya untuk sekolah (dan kelas) guru terkait, dan hanya untuk presensi yang benar-benar dipilih (presensiIds). Perbaiki penanganan error agar tidak menampilkan “berhasil” ketika sebenarnya gagal. | Guru hanya melihat & memverifikasi presensi siswa di sekolah/kelasnya, dan pesan status jujur sesuai hasil. |
| Bank Soal Latihan, daftar siswa, halaman detail siswa, dan dashboard guru masih memakai data contoh; menambah/mengubah/menghapus soal tidak tersimpan, dan detail siswa selalu menampilkan orang yang sama. | Sambungkan halaman guru ke database milik sekolahnya: (a) Bank Soal Latihan (app/(guru)/guru/soal/latihan/page.tsx) simpan tambah/ubah/hapus ke tabel `soal`+`opsi_soal`; (b) daftar & detail siswa (guru/siswa/page.tsx, .../[id]/page.tsx) ambil data nyata sesuai id & sekolah; (c) dashboard guru (guru/page.tsx) hitung angka dari data nyata. Hapus semua data contoh. | Semua halaman guru menampilkan dan menyimpan data nyata sesuai sekolahnya. |
| Saat membuat/mengedit soal, pilihan jawaban, kunci, dan pembahasan yang diisi guru ikut hilang karena tidak diteruskan/disimpan. | Perbaiki components/guru/EditorSoalModal.tsx dan penerimanya agar SEMUA isian (pilihan jawaban, kunci jawaban, pembahasan) ikut tersimpan ke database, bukan hanya sebagian. Jangan membuat id soal acak di browser — biarkan database yang membuat id. | Soal tersimpan lengkap dengan pilihan, kunci jawaban, dan pembahasannya. |
| Bab sering salah label (semua jadi “GEOMETRI”), dan kotak pencarian/filter/halaman di bank soal tidak berfungsi (tertulis “1-3 dari 124 soal” padahal hanya 3). | Di bank soal guru (app/(guru)/guru/soal/latihan/page.tsx & eksplorasi), buat pencarian, filter bab, dan urutan benar-benar bekerja pada data. Perbaiki penentuan kategori/bab agar sesuai bab aslinya, dan tampilkan jumlah data yang sebenarnya (bukan angka tetap). | Pencarian, filter, dan jumlah soal akurat; kategori bab benar. |
| Nama guru yang tampil tidak sesuai user yang login (kadang “Budi Santoso”, kadang “Ibu Siti Rahmawati”), notifikasi & pencarian di header tidak berfungsi, dan menu “Pengaturan” menuju halaman kosong. | Kirim data profil guru yang login ke tampilan (components/guru/GuruLayout.tsx) sehingga nama & peran sesuai user asli. Nonaktifkan/hapus notifikasi & pencarian contoh yang belum berfungsi, dan perbaiki tautan “Pengaturan” yang mengarah ke halaman kosong. | Identitas guru yang tampil sesuai akun login, dan tidak ada tombol/menu yang menyesatkan. |
| Di beberapa tempat tertulis “Anthropic AI”, di tempat lain “Powered by Gemini AI”, padahal aplikasi memakai Gemini. | Samakan semua label penyedia AI di halaman guru menjadi “Gemini” (sesuai yang benar-benar dipakai). Perbaiki di app/(guru)/buat-soal/page.tsx dan app/(guru)/guru/page.tsx. | Label AI konsisten dan sesuai kenyataan. |
| Permasalahan singkat | Prompt siap pakai | Hasil yang diharapkan |
| --- | --- | --- |
| Batas 20 percakapan AI per hari bisa terlewati oleh siswa yang belum punya sekolah, dan pemakaiannya tidak tercatat (biaya tidak terpantau). | Perbaiki app/api/tutor/chat/route.ts agar setiap percakapan AI selalu dicatat ke `log_ai` dan batas 20/hari tetap berlaku meski sekolah_id kosong. Jika siswa belum punya sekolah, tetapkan aturan yang jelas (blokir atau tetapkan sekolah dulu). | Batas harian AI selalu berlaku dan pemakaian selalu tercatat. |
| Jawaban esai yang kosong atau gagal diproses tetap diberi nilai 75 dan dianggap benar. | Perbaiki app/api/quiz/grade-essay/route.ts agar nilai default 0. Esai kosong dinilai 0; bila penilaian AI gagal diproses, tandai “perlu ditinjau guru”, jangan otomatis 75. | Nilai esai mencerminkan jawaban sebenarnya; tidak ada nilai 75 gratis. |
| Endpoint sesi belajar belum berisi logika apa pun (hanya mengembalikan data yang dikirim), padahal seharusnya mengatur mulai/cek/selesai sesi. | Implementasikan app/api/sesi/route.ts untuk menangani mulai sesi, cek sesi aktif, dan selesai sesi (menghitung skor akhir) sesuai aturan aplikasi — atau hapus jika sudah digantikan mekanisme lain. | Sesi belajar dikelola dengan benar dari mulai hingga selesai. |
| Di banyak tempat, poin default ditulis 1250 sehingga siswa seolah sudah punya banyak poin sejak awal. (Terkait fitur gamifikasi yang opsional.) | Ganti semua nilai poin default 1250 menjadi 0 (di database & kode), dan jadikan database sebagai satu-satunya sumber angka poin. | Poin awal siswa 0 dan konsisten di semua tampilan. |