---
target: student dashboard
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:D:\\Les Private\\Web\\0 Project\\Arsya\\thinksy\\app\\(siswa)\\dashboard\\StudentDashboardClient.tsx"
target_fingerprint: "sha256:3733a1c7397c988a14808cb167f9b72bca0ee7509efdc9f22574a279cb0d0d1b"
target_path: "D:\\Les Private\\Web\\0 Project\\Arsya\\thinksy\\app\\(siswa)\\dashboard\\StudentDashboardClient.tsx"
timestamp: 2026-09-14T23-56-22Z
slug: app-siswa-dashboard-studentdashboardclient-tsx
---
**Metode**: dual-agent (Assessment A: Tinjauan Desain · Assessment B: Detektor + Bukti Browser) — keduanya berjalan sebagai sub-agent terisolasi, tidak saling melihat hasil satu sama lain.

## Skor Kesehatan Desain

| # | Heuristik | Skor | Masalah Kunci |
|---|-----------|------|----------------|
| 1 | Visibilitas Status Sistem | 2 | 5 dari 6 fetch di `StudentDashboardClient.tsx` diam-diam menelan error (`catch {}`) — tidak ada sinyal ke siswa saat data gagal dimuat |
| 2 | Kesesuaian dengan Dunia Nyata | 3 | Istilah (Presensi, Poin, Bab, Misi) sudah pas dengan bahasa sekolah, tapi bahasa visualnya (SaaS enterprise) tidak cocok dengan alam pikir siswa SMP |
| 3 | Kontrol & Kebebasan Pengguna | 1 | Tidak ada konfirmasi/undo untuk aksi berisiko (hapus catatan langsung terhapus), tidak ada penanganan tombol Escape di modal manapun |
| 4 | Konsistensi & Standar | 2 | Kelas `.saas-modal` dipakai di sebagian modal saja (Settings/Help/Profile) tapi tidak di modal lain (Notes/GlobalChat) — bayangan & border beda tanpa alasan produk |
| 5 | Pencegahan Error | 1 | Tidak ada konfirmasi sebelum hapus catatan/laporan; tombol "Klaim Misi" rawan double-klik tanpa debounce |
| 6 | Pengenalan, Bukan Mengingat | 3 | Ikon + label teks konsisten hampir di semua tempat, tab aktif selalu terlihat di navbar |
| 7 | Fleksibilitas & Efisiensi | 1 | Tidak ada shortcut keyboard, tidak ada personalisasi/urutan custom — power user tidak punya jalur lebih cepat dari first-time user |
| 8 | Estetika & Desain Minimalis | 2 | Kartu individual bersih, tapi satu halaman penuh (`TabBelajar`) menumpuk 7+ gaya kartu berbeda dalam satu scroll |
| 9 | Bantu Kenali & Pulih dari Error | 1 | Error di-diamkan atau muncul lewat `alert()` browser native (`AttendanceModal.tsx:197,202`) yang merusak bahasa visual custom UI |
| 10 | Bantuan & Dokumentasi | 3 | `HelpCenterModal.tsx` isinya relevan & spesifik, tapi hanya bisa diakses lewat menu profil, tidak kontekstual di dekat fitur yang dijelaskan |
| **Total** | | **19/40** | **Kurang (Poor)** |

Semua heuristik berhasil dinilai (tidak ada yang di-n/a-kan) — ini surface Operate harian, jadi heuristik 7 dan 10 tetap relevan penuh dan sengaja tidak dilewati.

## Vonis Spesifisitas Desain

**Penilaian LLM**: Dashboard ini pada dasarnya adalah dashboard SaaS enterprise generik yang ditempeli kosakata pendidikan Indonesia. Buktinya eksplisit, bukan tebakan — `app/globals.css` baris 33 punya komentar "Professional Enterprise SaaS Styling" tepat di atas `.saas-card`/`.saas-nav`/`.saas-modal`. Palet warna (`--primary:#0F172A` navy + `--accent:#F59E0B` amber, latar `#f8fafc`) adalah kombinasi "SaaS B2B ala Vercel/Linear" yang dipakai ribuan template dashboard, bukan sesuatu yang terasa dirancang untuk siswa SMP 13-15 tahun. Font Plus Jakarta Sans rapi tapi juga pilihan paling umum untuk SaaS modern 2023-2025. Bahasa layout (navbar pill blur, dropdown avatar, badge grid, modal center dengan tombol X) persis boilerplate shadcn/ui + Tailwind admin dashboard — ganti label "Presensi/Poin Belajar/Bab/Misi Harian" jadi "Tasks/Points/Chapter/Daily Quests" dan hasilnya tidak bisa dibedakan dari platform corporate L&D generik. Satu tempat yang menunjukkan pemikiran khas produk: sistem MAPEL_THEMES di `TabKursusSaya.tsx` (9 warna per mata pelajaran) — nyata dan spesifik konten, tapi diredam oleh 4 varian kartu yang hanya beda kosmetik. **Vonis: gagal uji spesifisitas** — surface ini bisa diganti nama "TaskFlow Enterprise Dashboard" tanpa perubahan struktural apapun.

**Pemindaian deterministik**: Detektor impeccable detect menemukan 14 temuan di `app/(siswa)/dashboard` + `components/game` (exit code 2). Setelah diverifikasi manual, **11 dari 14 adalah false positive**: 8 temuan side-tab/border-accent-on-rounded di `AttendanceModal.tsx:313,322,333,342` ternyata adalah bracket sudut viewfinder kamera liveness-scan (7x7px), bukan border aksen kartu; 3 temuan gray-on-color (`AttendanceModal.tsx:281`, `FloatingActionHub.tsx:31`, `TabBelajar.tsx:99`) salah membaca text-slate-950 (nyaris hitam, kontras tinggi) sebagai warna abu-abu pudar — justru kebalikan dari masalah yang coba ditangkap rule tersebut. **3 temuan valid**: side-tab di `TabPeringkat.tsx:81` (border kiri amber untuk highlight baris peringkat pengguna — sah, bukan cacat), dan dua bounce-easing (`AttendanceModal.tsx:355`, `MathMiniGameModal.tsx:388`) — easing elastis/bounce yang justru memperkuat vonis spesifisitas di atas: pola animasi generik "khas AI-generated UI", bukan gerakan yang dirancang khusus untuk momen produk ini.

**Bukti visual**: Inspeksi browser langsung terhambat — rute dashboard siswa (/siswa/dashboard) di-gate oleh login Supabase (dikonfirmasi: navigasi langsung selalu redirect 307 ke /masuk), dan tidak ada kredensial uji yang tersedia untuk Assessment B. Sesuai protokol, tidak ada upaya bypass otentikasi. Karena itu tidak ada overlay visual yang bisa ditampilkan di tab browser — temuan di atas murni dari pembacaan kode sumber dan hasil impeccable detect, bukan dari inspeksi halaman yang benar-benar ter-render.

## Kesan Keseluruhan

Dashboard ini punya "tulang" yang solid secara teknis — state empty/loading ditangani dengan baik, dan flow presensi wajah punya urutan feedback yang benar-benar dipikirkan. Tapi begitu semua bagian digabung dalam satu halaman (TabBelajar), hasilnya adalah tumpukan 7+ jenis konten berbeda dengan bahasa visual "SaaS enterprise" yang bertentangan dengan nada ramah di copy-nya sendiri. Peluang terbesar: dashboard ini butuh satu bahasa visual yang jelas-jelas dirancang untuk siswa SMP, bukan chrome korporat yang diberi kosakata sekolah, dan butuh disiplin cakupan di halaman utama — terlalu banyak titik masuk (12+) bersaing untuk perhatian yang sama.

## Yang Sudah Berjalan Baik

1. **Flow presensi wajah (AttendanceModal.tsx)** — tahapan idle -> kamera aktif dengan viewfinder real-time -> konfirmasi liveness lolos -> status submit, dengan pill status warna (slate -> amber -> emerald) yang terus memberi rasa aman selama interaksi biometrik yang berpotensi bikin cemas.
2. **Sistem warna per mata pelajaran (MAPEL_THEMES di TabKursusSaya.tsx)** — 9 warna konsisten untuk 9 mapel Kurikulum Merdeka adalah desain informasi yang nyata, membantu siswa membangun memori spasial/warna "mapel mana yang mana" — pola khas edukasi, bukan SaaS generik.
3. **State kosong & loading yang ditangani menyeluruh** untuk misi, catatan, leaderboard, dan pencarian bab — dengan ikon + copy penjelas, kadang disertai tombol reset — kualitas kerajinan yang di atas rata-rata dashboard sejenis.

## Masalah Prioritas

**[P0] Fetch data gagal secara diam-diam, nol umpan balik error**
- **Kenapa penting**: Semua fetcher (fetchNotifications, fetchLeaderboard, fetchMissions, fetchNotes, fetchGlobalChat, fetchPresensiStatus) memakai try-catch kosong. Di koneksi mobile Indonesia yang sering putus-putus (konteks pemakaian utama), ini bukan kasus langka — siswa akan sering melihat dashboard yang "kelihatan kosong saja" tanpa tahu itu error jaringan atau memang belum ada data, dan tanpa tombol coba-lagi.
- **Perbaikan**: Tambahkan state hasError per fetch, tampilkan banner kecil "Gagal memuat — coba lagi" menggantikan empty state saat catch terpicu.
- **Command yang disarankan**: /impeccable harden

**[P0] Tidak ada manajemen fokus/keyboard di dropdown & modal**
- **Kenapa penting**: Dropdown notifikasi, dropdown profil, dan ke-7 modal tidak punya Escape-to-close, focus trap, atau atribut role="dialog"/aria-modal; beberapa tombol pemicu (avatar profil) tidak punya aria-label sama sekali. Ini blocker keras untuk kepatuhan WCAG AA, bukan sekadar polish — pengguna keyboard/screen reader (persona Sam) sama sekali tidak bisa mengoperasikan dashboard ini.
- **Perbaikan**: Tambahkan role="dialog" aria-modal="true", focus-trap saat modal terbuka, handler Escape, kembalikan fokus ke trigger saat ditutup, serta aria-label di semua tombol ikon-saja.
- **Command yang disarankan**: /impeccable harden

**[P1] Kelebihan pilihan simultan di tab beranda**
- **Kenapa penting**: TabBelajar.tsx ditambah navbar yang selalu tampil ditambah FAB bersama-sama menampilkan 12+ titik masuk sekaligus (4 tab, tombol Math Game, Presensi, Bell, menu Profil, FAB x3, plus 7 seksi konten bertumpuk di bawah lipatan). Ini langsung bertentangan dengan praktik terbaik beban kognitif untuk surface Operate — persona Casey (pengguna mobile yang terganggu) yang membuka ini di HP saat commute tidak punya satu aksi berikutnya yang jelas.
- **Perbaikan**: Sembunyikan Math Game & promo sekunder (Jurnal/Ujian) di balik satu affordance "Jelajahi", atau pindahkan ke Ruang Belajar; jadikan satu aksi (mis. "Lanjutkan belajar" / misi hari ini) sebagai jangkar visual yang jelas, sisanya dibuat lebih redup.
- **Command yang disarankan**: /impeccable distill

**[P1] Status "Alpha" (alpa) memakai toast selevel dengan pesan sukses rutin**
- **Kenapa penting**: ToastNotification.tsx menampilkan "Klaim Misi Berhasil!" dan "Presensi Ditutup (Status: Alpha)" lewat shell toast yang identik, hanya beda warna border. Status alpa punya konsekuensi akademik nyata, tapi dikomunikasikan dengan bobot visual yang sama seperti "catatan tersimpan" — justru saat butuh kejelasan & rasa aman paling besar.
- **Perbaikan**: Beri status "Alpha" perlakuan berbeda yang lebih menonjol (interupsi modal, atau minimal banner persisten) dengan aksi satu-tap "Hubungi Wali Kelas" yang jelas, bukan cuma teks instruksi di dalam toast.
- **Command yang disarankan**: /impeccable clarify

**[P2] Pemanggilan alert() native browser merusak UI custom**
- **Kenapa penting**: AttendanceModal.tsx baris 197 & 202 jatuh ke alert(...) bawaan browser di tengah flow yang sebelumnya sepenuhnya custom-styled. Dialog native yang tiba-tiba muncul memberi kesan "aplikasi ini rusak" jauh lebih kuat daripada error state in-app yang dirancang — makin terasa aneh di mobile.
- **Perbaikan**: Ganti kedua alert() dengan komponen ToastNotification yang sudah ada atau banner error inline di dalam modal.
- **Command yang disarankan**: /impeccable polish

## Red Flag Persona

**Alex (Power User)**: Tidak ada ringkasan "hari ini" yang persisten dan ringkas — siswa harus memindai ulang seluruh tumpukan TabBelajar.tsx setiap hari. handleClaimMission tidak punya optimistic UI (tombol spinner, tunggu round-trip penuh baru poin ter-update) — terasa lambat untuk pengguna yang mengharapkan respons instan. Cek peringkat memicu fetch ulang penuh dengan spinner setiap kali tab dibuka, tanpa cache — meski baru dicek 30 detik lalu.

**Sam (Pengguna Bergantung Aksesibilitas)**: Tidak bisa mengoperasikan dropdown profil/notifikasi dengan screen reader — tidak ada aria-expanded di tombol pemicu, tidak ada role="menu"/role="menuitem" di isinya, sehingga screen reader tidak mengumumkan apa pun saat menu terbuka. Detail jadwal di kalender (TabBelajar.tsx) sepenuhnya berbasis tooltip hover — sama sekali tidak terjangkau lewat keyboard atau sentuhan, jadi Sam tidak bisa mengakses info jadwal hari apa pun. Pembedaan status hari kalender (hari-ini/streak/terjadwal) murni lewat warna — melanggar pedoman WCAG untuk tidak mengandalkan warna saja bagi pengguna low-vision/buta warna.

**Casey (Pengguna Mobile yang Terganggu)**: Tombol Math Game duduk di navbar bagian atas (sticky top-3) — zona jangkauan satu-tangan yang canggung di HP besar, untuk fitur yang tidak ada hubungannya dengan tugas utama "cek progres/kerjakan pelajaran". Di koneksi lambat, 6 fetch awal berjalan bersamaan tanpa prioritas/urutan dan tanpa loading state agregat — Casey melihat halaman yang separuh-termuat, separuh-skeleton, separuh-nilai-default dalam waktu tak tentu, dan catch yang diam-diam gagal berarti sebagian seksi mungkin tidak pernah selesai dimuat tanpa penjelasan. Flow presensi langsung meminta akses kamera dan mengunduh model MediaPipe FaceLandmarker (unduhan cukup besar) hanya dengan pill generik "Menyiapkan AI Deteksi..." tanpa estimasi ukuran/waktu — jika koneksi Casey putus di tengah, tidak ada state "gagal muat, coba lagi" yang jelas.

## Observasi Minor

- StudentDashboardClient.tsx menyimpan kalender penuh September 2026 dengan nama bab/jadwal hardcoded langsung di komponen (~350 baris) — kemungkinan besar data demo/UAT yang belum dibersihkan (diperkuat oleh keberadaan UatDevMenu.tsx dan state mockTime).
- handleSendChat men-hardcode kelas_penulis: "Kelas 8A" tanpa memandang kelas asli siswa yang login — akan salah label untuk siswa non-8A.
- Kesulitan Math Mini-Game dipatok level "Kelas 8 SMP" tanpa memandang tingkat_kelas siswa sebenarnya (7/8/9) — siswa kelas 7 akan menghadapi soal aljabar di luar levelnya, merusak niat game ini untuk membangun kepercayaan diri.
- 4 varian kartu di TabKursusSaya.tsx hanya beda kosmetik (posisi badge, tint latar, accent bar) tanpa beda informasi — menambah noise visual tanpa menambah kemudahan pindai, malah bikin siswa sulit belajar "di mana X biasanya berada" karena layout terus berubah per kartu.
- Kelas .saas-modal dipakai tidak konsisten (hanya di Settings/Help/Profile, tidak di Notes/GlobalChat) — utang konsistensi kecil yang lama-lama mengikis kesan sistem yang terencana. (Command: /impeccable clarify)

## Pertanyaan untuk Dipertimbangkan

- Jika ke-7 modal dan FAB dihapus lalu diganti satu command-bar "mau ngapain hari ini?", apakah siswa akan benar-benar kehilangan sesuatu — atau sprawl saat ini justru menyelesaikan masalah discoverability yang diciptakan sendiri dengan memecah lima aksi terkait (catatan, bantuan AI, chat, setelan, bantuan) jadi terpisah-pisah?
- Kenapa AI Tutor — yang mestinya jadi nilai jual utama Thinksy — bersembunyi di balik tombol "+" tanpa label yang berbagi tempat dengan dua fitur tak terkait, sementara math mini-game (fitur sampingan) punya pill permanen berlabel dan berwarna sendiri di navbar? Apakah investasi visual saat ini sudah sesuai fitur mana yang sebenarnya ingin didorong bisnis?
- Jika dashboard ini ditunjukkan ke siswa SMP 13 tahun di samping Duolingo atau menu Roblox lalu ditanya "ini kerasa dibuat buat kamu, gak?" — bukti apa yang bisa mereka tunjuk? Kalau jawaban jujurnya "gak ada", apa perubahan terkecil (maskot, gaya ilustrasi, ikonografi khas, cerita warna non-SaaS) yang bisa membalikkan jawaban itu jadi "iya"?
