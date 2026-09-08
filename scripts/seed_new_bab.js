const { Client } = require('pg');

const rawBabData = [
  {
    "idx": 0,
    "id": "5bb5b21c-fed5-4f1b-acca-4b95509932fc",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 7,
    "judul": "Bab 1: Bilangan Bulat",
    "deskripsi": "Memahami konsep, sifat, dan operasi hitung bilangan bulat serta penerapannya dalam menyelesaikan masalah sehari-hari.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 1,
    "id": "3d7f782f-a4fc-449f-b257-3cd1c5783b1d",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 7,
    "judul": "Bab 2: Aljabar",
    "deskripsi": "Memahami variabel, bentuk aljabar, persamaan, dan pertidaksamaan sederhana.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 2,
    "id": "0456a1e2-4a24-48ff-beaf-94ccc8a984e9",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 7,
    "judul": "Bab 3: Persamaan Linear",
    "deskripsi": "Menentukan penyelesaian persamaan linear satu variabel melalui substitusi, eliminasi, maupun gabungan keduanya.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 3,
    "id": "67d3e93b-13b5-4a69-bc7b-dfa1823b3934",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 7,
    "judul": "Bab 4: Perbandingan Senilai dan Berbalik Nilai",
    "deskripsi": "Memahami konsep perbandingan serta menyelesaikan masalah perbandingan senilai dan berbalik nilai.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 4,
    "id": "a3675b9d-225a-4514-8b40-f29229cb8e36",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 7,
    "judul": "Bab 5: Bangun Datar",
    "deskripsi": "Mengidentifikasi jenis bangun datar serta menghitung luas dan kelilingnya.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 5,
    "id": "ea516057-f7a3-4235-ad5e-1a3a356f3581",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 7,
    "judul": "Bab 6: Bangun Ruang",
    "deskripsi": "Mengidentifikasi jenis dan sifat bangun ruang serta menyelesaikan masalah terkait.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 6,
    "id": "bb2579b8-caab-4210-95ac-ff6aa7983a0d",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 7,
    "judul": "Bab 7: Menggunakan Data",
    "deskripsi": "Mengumpulkan, menyajikan, dan menganalisis data untuk menyelesaikan masalah kontekstual.",
    "urutan": 7,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 7,
    "id": "5f649043-e4b7-4d11-a353-991b07a77d5c",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 8,
    "judul": "Bab 1: Bilangan Berpangkat",
    "deskripsi": "Memahami bilangan berpangkat bulat, bentuk akar, dan penulisan bentuk baku bilangan.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 8,
    "id": "b4ae1851-1aa0-435f-8379-34cfe59afd6f",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 8,
    "judul": "Bab 2: Teorema Pythagoras",
    "deskripsi": "Menemukan konsep, tripel, dan penerapan Teorema Pythagoras pada segitiga siku-siku.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 9,
    "id": "a1fb5fd1-bcf8-451b-8dcc-01f09b30c768",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 8,
    "judul": "Bab 3: Persamaan dan Pertidaksamaan Linear Satu Variabel",
    "deskripsi": "Menyajikan dan menyelesaikan persamaan serta pertidaksamaan linear satu variabel.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 10,
    "id": "1fd7a8c2-079c-4044-be29-207c4c5da83b",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 8,
    "judul": "Bab 4: Relasi dan Fungsi",
    "deskripsi": "Memahami konsep himpunan, relasi, fungsi, dan korespondensi satu-satu.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 11,
    "id": "4a215311-c0b3-4cc5-8177-48eb40221f9e",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 8,
    "judul": "Bab 5: Persamaan Garis Lurus",
    "deskripsi": "Memahami bentuk persamaan garis lurus, gradien, dan grafiknya pada koordinat Kartesius.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 12,
    "id": "fd4ebc86-d354-4f40-a886-48a76cd0ef48",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 8,
    "judul": "Bab 6: Statistika",
    "deskripsi": "Menyajikan dan menganalisis data menggunakan ukuran pemusatan data.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 13,
    "id": "a00b94a0-c1b3-4e10-ad31-263e5450685c",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 9,
    "judul": "Bab 1: Sistem Persamaan Linear Dua Variabel",
    "deskripsi": "Memahami konsep dan menentukan penyelesaian sistem persamaan linear dua variabel dengan metode grafik, substitusi, eliminasi, dan campuran.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 14,
    "id": "5c68dbdf-9fa0-4f2e-922f-4ea23cb689a8",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 9,
    "judul": "Bab 2: Bangun Ruang",
    "deskripsi": "Menentukan luas permukaan dan volume bangun ruang sisi datar dan sisi lengkung, termasuk lingkaran.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 15,
    "id": "4f330f89-9001-46a4-9f92-12b9f24f0b07",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 9,
    "judul": "Bab 3: Transformasi Geometri",
    "deskripsi": "Memahami dan menerapkan translasi, refleksi, rotasi, dilatasi, serta kekongruenan bangun datar.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 16,
    "id": "ea1abeef-011c-4dbf-96bc-e6224c952bad",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Matematika",
    "kelas": 9,
    "judul": "Bab 4: Peluang dan Pemilihan Sampel",
    "deskripsi": "Menjelaskan dan menggunakan peluang, frekuensi relatif, frekuensi harapan, serta pemilihan sampel representatif.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 17,
    "id": "3dc41488-63b9-46fd-85b2-7e5d67d80cfd",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 7,
    "judul": "Bab 1: Jelajah Nusantara",
    "deskripsi": "Memahami dan menyajikan teks deskripsi tentang keragaman budaya dan wilayah Nusantara.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 18,
    "id": "b8940aad-0e07-45f6-b764-a71b8b2bfe84",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 7,
    "judul": "Bab 2: Berkelana di Dunia怪",
    "judul": "Bab 2: Berkelana di Dunia Imajinasi",
    "deskripsi": "Mengapresiasi dan menulis teks narasi/cerita fantasi.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 19,
    "id": "fe5a1471-eb60-45ad-b9d0-2057e78d6af7",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 7,
    "judul": "Bab 3: Hal yang Baik bagi Tubuh",
    "deskripsi": "Memahami dan menyajikan teks prosedur terkait kesehatan dan gaya hidup sehat.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 20,
    "id": "7b9adafb-7feb-449b-bb81-37384f375724",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 7,
    "judul": "Bab 4: Aksi Nyata Para Pelindung Bumi",
    "deskripsi": "Memahami dan menulis teks eksposisi tentang isu lingkungan hidup.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 21,
    "id": "030e4dc1-17cf-4095-a540-0c694b64c9a9",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 7,
    "judul": "Bab 5: Membuka Gerbang Dunia",
    "deskripsi": "Memahami teks laporan hasil observasi dan informasi faktual dari berbagai sumber.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 22,
    "id": "29d04c86-87ea-45ba-863c-c01b8879672a",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 7,
    "judul": "Bab 6: Sampaikan Melalui Surat",
    "deskripsi": "Menulis berbagai jenis surat pribadi dan surat dinas sesuai kaidah kebahasaan.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 23,
    "id": "cf07f113-3682-4733-972e-0fc5c47700d9",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 8,
    "judul": "Bab 1: Menulis Teks Laporan Hasil Observasi",
    "deskripsi": "Menyusun teks laporan hasil observasi berdasarkan data dan fakta yang akurat.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 24,
    "id": "666ef331-bb16-4a07-87c5-b6c6bbe16283",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 8,
    "judul": "Bab 2: Membuat Iklan, Slogan, dan Poster",
    "deskripsi": "Merancang dan menulis iklan, slogan, dan poster yang persuasif.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 25,
    "id": "d895ad56-d19a-4db2-8731-618b75717f0d",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 8,
    "judul": "Bab 3: Menulis Artikel Ilmiah Populer",
    "deskripsi": "Menyusun artikel ilmiah populer dengan struktur dan kaidah kebahasaan yang tepat.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 26,
    "id": "98fd5fc4-9007-4c76-9fd6-1ac7f10d90d3",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 8,
    "judul": "Bab 4: Mengulas Karya Fiksi",
    "deskripsi": "Menganalisis dan menulis ulasan terhadap karya fiksi (novel/cerpen).",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 27,
    "id": "05f05958-9428-467f-857b-14185a55eecf",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 8,
    "judul": "Bab 5: Menciptakan Puisi",
    "deskripsi": "Memahami unsur puisi dan menciptakan puisi dengan diksi serta majas yang tepat.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 28,
    "id": "e6719684-6719-4807-85e4-2ca7f2b8fd52",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 8,
    "judul": "Bab 6: Menulis Teks Pidato",
    "deskripsi": "Menyusun dan menyampaikan teks pidato persuasif secara efektif.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 29,
    "id": "7d413dbf-fc9e-49c9-9413-48a20355bf48",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 9,
    "judul": "Bab 1: Membanggakan Indonesia: Teks Laporan Hasil Observasi",
    "deskripsi": "Menyajikan dan menganalisis teks laporan hasil observasi tentang kekayaan Indonesia.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 30,
    "id": "f8427420-c553-49b1-9440-3d9f69f2099d",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 9,
    "judul": "Bab 2: Menyingkap Fakta: Teks Eksplanasi",
    "deskripsi": "Memahami dan menulis teks eksplanasi tentang fenomena alam maupun sosial.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 31,
    "id": "099fe6b7-d48b-4f84-96ee-682f5cff9b13",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 9,
    "judul": "Bab 3: Menginspirasi Sesama: Cerita Inspiratif",
    "deskripsi": "Mengapresiasi dan menulis cerita inspiratif berdasarkan pengalaman nyata.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 32,
    "id": "5de4157b-e5ad-4429-927f-0f75ce934e95",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 9,
    "judul": "Bab 4: Membuka Cakrawala: Karya Ilmiah",
    "deskripsi": "Menyusun karya ilmiah sederhana dengan metode dan sistematika yang tepat.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 33,
    "id": "81fa1ce8-60ba-44b5-90ee-3a8c443ed024",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 9,
    "judul": "Bab 5: Mengukir Kata dalam Puisi dan Drama",
    "deskripsi": "Mengapresiasi dan menciptakan puisi serta naskah drama pendek.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 34,
    "id": "2a13267c-75cc-4476-9385-0e20b43da338",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Indonesia",
    "kelas": 9,
    "judul": "Bab 6: Berbahasa Persuasif: Pidato dan Diskusi",
    "deskripsi": "Menyampaikan gagasan secara persuasif dalam pidato dan forum diskusi.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 35,
    "id": "a7840a35-ccb9-4696-abb8-66c47264f512",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 7,
    "judul": "Bab 1: Hakikat Ilmu Sains dan Metode Ilmiah",
    "deskripsi": "Memahami hakikat sains, langkah-langkah metode ilmiah, dan keselamatan kerja di laboratorium.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 36,
    "id": "3a784a38-176c-4814-873b-b00418757654",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 7,
    "judul": "Bab 2: Zat dan Perubahannya",
    "deskripsi": "Mengidentifikasi wujud zat, perubahan fisika dan kimia, serta pemisahan campuran.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 37,
    "id": "53aee99d-f254-49f6-b0f9-8ed3e7aa27a8",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 7,
    "judul": "Bab 3: Suhu, Kalor, dan Pemuaian",
    "deskripsi": "Menjelaskan konsep suhu, kalor, perpindahan kalor, dan pemuaian zat.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 38,
    "id": "ae70f837-6888-4c9d-ac69-57de6173e9cc",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 7,
    "judul": "Bab 4: Gerak dan Gaya",
    "deskripsi": "Menganalisis konsep gerak lurus, jenis gaya, dan Hukum Newton.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 39,
    "id": "3c000125-a2eb-400d-a424-dd699ce329b3",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 7,
    "judul": "Bab 5: Klasifikasi Makhluk Hidup",
    "deskripsi": "Mengklasifikasikan makhluk hidup berdasarkan ciri dan kekerabatannya.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 40,
    "id": "b42da1be-93ee-4e44-b3e5-cf2248bbedca",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 7,
    "judul": "Bab 6: Ekologi dan Keanekaragaman Hayati",
    "deskripsi": "Menganalisis interaksi makhluk hidup dengan lingkungan dan keanekaragaman hayati Indonesia.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 41,
    "id": "2b7062b3-6692-461a-80c9-8282fa8d3a0c",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 7,
    "judul": "Bab 7: Bumi dan Tata Surya",
    "deskripsi": "Menjelaskan struktur Bumi, sistem tata surya, dan fenomena antariksa.",
    "urutan": 7,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 42,
    "id": "6af8e33d-be35-4a2e-9b15-f7e7485f22ae",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 8,
    "judul": "Bab 1: Pengenalan Sel",
    "deskripsi": "Memahami struktur, fungsi, dan jenis sel sebagai unit dasar kehidupan.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 43,
    "id": "648e50d7-7cb9-41cc-9135-2c9c2d47d98b",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 8,
    "judul": "Bab 2: Struktur dan Fungsi Tubuh Makhluk Hidup",
    "deskripsi": "Menganalisis sistem organ pada manusia, hewan, dan tumbuhan.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 44,
    "id": "43bf3a7d-89b8-4414-b9ea-035e8d70a6f3",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 8,
    "judul": "Bab 3: Usaha, Energi, dan Pesawat Sederhana",
    "deskripsi": "Menjelaskan konsep usaha, energi, dan prinsip kerja pesawat sederhana.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 45,
    "id": "b7c0cd23-af4b-458a-a5f6-9f8c5dd2b282",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 8,
    "judul": "Bab 4: Getaran, Gelombang, dan Cahaya",
    "deskripsi": "Menganalisis konsep getaran, gelombang, bunyi, cahaya, dan alat optik.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 46,
    "id": "db5cacfb-ffbc-4f8a-a5bc-e4e96ffee2ee",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 8,
    "judul": "Bab 5: Unsur, Senyawa, dan Campuran",
    "deskripsi": "Mengklasifikasikan zat berdasarkan unsur, senyawa, dan campuran.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 47,
    "id": "c2f07034-8ea7-4a05-98c6-0a1fb5766584",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 8,
    "judul": "Bab 6: Struktur Bumi dan Perkembangannya",
    "deskripsi": "Menjelaskan struktur lapisan Bumi, lempeng tektonik, dan mitigasi bencana.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 48,
    "id": "69edf4df-b86c-4cca-8332-88800d21665a",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 9,
    "judul": "Bab 1: Sistem Reproduksi pada Manusia",
    "deskripsi": "Menganalisis struktur, fungsi, dan kesehatan sistem reproduksi manusia.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 49,
    "id": "d250f7d9-f1b1-416e-a5ea-68cf459e8b09",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 9,
    "judul": "Bab 2: Pewarisan Sifat",
    "deskripsi": "Menjelaskan mekanisme pewarisan sifat dan penerapan hukum Mendel.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 50,
    "id": "e9e5c1e6-8b8a-44e3-8d97-1b2bab7d6ca2",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 9,
    "judul": "Bab 3: Kemagnetan dan Pemanfaatannya",
    "deskripsi": "Menganalisis konsep kemagnetan serta penerapannya dalam teknologi.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 51,
    "id": "f3bbe298-2d53-400c-99ac-02046d6b6645",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 9,
    "judul": "Bab 4: Listrik dan Teknologi Listrik di Lingkungan",
    "deskripsi": "Menganalisis rangkaian listrik dan sumber energi listrik alternatif.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 52,
    "id": "a8d38ac8-eb4f-4d13-8524-8a0b21075df9",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 9,
    "judul": "Bab 5: Bioteknologi",
    "deskripsi": "Menjelaskan prinsip bioteknologi konvensional dan modern serta pemanfaatannya.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 53,
    "id": "1ef189cb-e08f-4d73-9bd6-2b90e5ccb5d6",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPA",
    "kelas": 9,
    "judul": "Bab 6: Tanah dan Keberlangsungan Kehidupan",
    "deskripsi": "Menganalisis peran tanah bagi keberlangsungan kehidupan dan upaya pelestariannya.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 54,
    "id": "0e910d9a-7c89-4003-8edf-8156b3344e5f",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPS",
    "kelas": 7,
    "judul": "Bab 1: Keluarga Awal Kehidupan",
    "deskripsi": "Memahami peran keluarga sebagai lembaga sosial pertama dalam kehidupan manusia.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 55,
    "id": "3e0a32f3-e2d0-4a17-be51-a401dfad40d0",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPS",
    "kelas": 7,
    "judul": "Bab 2: Keanekaragaman Lingkungan Sekitar",
    "deskripsi": "Menganalisis kondisi geografis dan keragaman lingkungan tempat tinggal.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 56,
    "id": "3dcaeeaf-cad7-410a-b161-fb2863a3a0eb",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPS",
    "kelas": 7,
    "judul": "Bab 3: Potensi Ekonomi Lingkungan",
    "deskripsi": "Mengidentifikasi potensi sumber daya ekonomi di lingkungan sekitar.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 57,
    "id": "f21381d3-ef7a-42b9-b55b-ebdd7f5c224a",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPS",
    "kelas": 7,
    "judul": "Bab 4: Pemberdayaan Masyarakat",
    "deskripsi": "Menganalisis upaya pemberdayaan masyarakat untuk kesejahteraan bersama.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 58,
    "id": "f54a7389-663c-450d-9902-99047d575349",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPS",
    "kelas": 8,
    "judul": "Bab 1: Kondisi Geografis dan Pelestarian Sumber Daya Alam",
    "deskripsi": "Menganalisis kondisi geografis Indonesia dan upaya pelestarian sumber daya alam.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 59,
    "id": "f5045dd0-eabd-4f9a-9f1c-bc5c9b1f6728",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPS",
    "kelas": 8,
    "judul": "Bab 2: Kemajemukan Masyarakat Indonesia",
    "deskripsi": "Memahami keragaman sosial, budaya, dan agama di Indonesia.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 60,
    "id": "b6bd6f0c-9c81-4d32-81b9-1faba08e459f",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPS",
    "kelas": 8,
    "judul": "Bab 3: Nasionalisme dan Jati Diri Bangsa",
    "deskripsi": "Menganalisis sejarah pergerakan nasional dan pembentukan jati diri bangsa.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 61,
    "id": "81a70dda-56ee-44a1-bbd3-e5f1b31a9c01",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPS",
    "kelas": 8,
    "judul": "Bab 4: Pembangunan Perekonomian Indonesia",
    "deskripsi": "Menganalisis proses dan permasalahan pembangunan ekonomi Indonesia.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 62,
    "id": "50b5702e-8dfa-4568-92df-955bdc06a103",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPS",
    "kelas": 9,
    "judul": "Bab 1: Perubahan Sosial Budaya dalam Arus Globalisasi",
    "deskripsi": "Menganalisis dampak globalisasi terhadap perubahan sosial budaya masyarakat.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 63,
    "id": "9f273f8a-9cfe-41b4-b8c8-687a0dfeb4a3",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPS",
    "kelas": 9,
    "judul": "Bab 2: Potensi Indonesia Menjadi Negara Maju",
    "deskripsi": "Menganalisis potensi sumber daya dan sektor unggulan Indonesia.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 64,
    "id": "9cbefaf0-5f87-4108-8696-582e1126319d",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPS",
    "kelas": 9,
    "judul": "Bab 3: Kerja Sama dan Perdagangan Internasional",
    "deskripsi": "Memahami bentuk kerja sama dan perdagangan antarnegara.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 65,
    "id": "437ccab4-0cb1-4efb-8722-bfd0158ecde1",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "IPS",
    "kelas": 9,
    "judul": "Bab 4: Persebaran serta Upaya Menjaga Perdamaian Dunia",
    "deskripsi": "Menganalisis peran Indonesia dalam hubungan internasional dan perdamaian dunia.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 66,
    "id": "465db5b9-1a04-4246-8195-31614e2b6865",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 7,
    "judul": "Bab 1: Sejarah Kelahiran Pancasila",
    "deskripsi": "Memahami proses perumusan dan penetapan Pancasila sebagai dasar negara.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 67,
    "id": "457e6023-1c27-4c21-b3d5-5728f637ec14",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 7,
    "judul": "Bab 2: Penerapan Nilai-nilai Pancasila",
    "deskripsi": "Menerapkan nilai-nilai Pancasila dalam kehidupan sehari-hari.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 68,
    "id": "c64ba0b3-c65c-4ff9-b3ec-df6c7aed7f4f",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 7,
    "judul": "Bab 3: Patuh Terhadap Norma",
    "deskripsi": "Memahami jenis dan fungsi norma dalam menciptakan ketertiban masyarakat.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 69,
    "id": "95d5c6ea-7d83-42c6-b833-80944b22777f",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 7,
    "judul": "Bab 4: Keberagaman Indonesia",
    "deskripsi": "Menghargai keberagaman suku, agama, ras, dan antargolongan di Indonesia.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 70,
    "id": "4c930903-a5a0-4dfa-86cc-e8c84cae5d65",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 7,
    "judul": "Bab 5: Wilayah Negara Kesatuan Republik Indonesia",
    "deskripsi": "Memahami konsep wilayah, batas, dan kedaulatan NKRI.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 71,
    "id": "20c15f1b-7aee-489d-b63f-8c0ca0a46fd5",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 8,
    "judul": "Bab 1: Pancasila sebagai Dasar Negara dan Pandangan Hidup Bangsa",
    "deskripsi": "Menganalisis kedudukan dan fungsi Pancasila bagi bangsa Indonesia.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 72,
    "id": "16e721f1-45e9-4a0e-b8fa-bdcb3f5d4009",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 8,
    "judul": "Bab 2: Norma dan Undang-Undang Dasar NRI Tahun 1945",
    "deskripsi": "Memahami kedudukan UUD NRI Tahun 1945 sebagai hukum dasar negara.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 73,
    "id": "7b5b321d-fddb-4118-bc50-896606627e2c",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 8,
    "judul": "Bab 3: Keberagaman dan Harmoni dalam Masyarakat",
    "deskripsi": "Menganalisis upaya menjaga harmoni dalam masyarakat yang beragam.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 74,
    "id": "b2b3bacc-e76d-48e5-8522-60d5c8f7dcde",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 8,
    "judul": "Bab 4: Bhinneka Tunggal Ika",
    "deskripsi": "Memahami makna dan penerapan semboyan Bhinneka Tunggal Ika.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 75,
    "id": "181b1019-2c49-4d9f-9cbf-8e8074f9f76f",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 8,
    "judul": "Bab 5: Daerah dalam Kerangka Negara Kesatuan Republik Indonesia",
    "deskripsi": "Menganalisis hubungan pemerintah pusat dan daerah dalam kerangka NKRI.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 76,
    "id": "2bd97c4a-9d93-4687-8ccb-bff4356cd65e",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 9,
    "judul": "Bab 1: Pancasila sebagai Ideologi Terbuka",
    "deskripsi": "Menganalisis Pancasila sebagai ideologi terbuka yang dinamis.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 77,
    "id": "452c2ee3-2972-4788-894b-9a55a20b3225",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 9,
    "judul": "Bab 2: UUD NRI Tahun 1945 sebagai Konstitusi Negara",
    "deskripsi": "Memahami sistematika dan isi UUD NRI Tahun 1945.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 78,
    "id": "bdeb2434-e501-496f-9efe-979a45d18317",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 9,
    "judul": "Bab 3: Keberagaman dan Potensi Konflik dalam Masyarakat",
    "deskripsi": "Menganalisis potensi konflik akibat keberagaman serta cara mengatasinya.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 79,
    "id": "e82206d4-16e6-4094-9443-dd9733c1910f",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 9,
    "judul": "Bab 4: Bela Negara dalam Konteks NKRI",
    "deskripsi": "Memahami bentuk dan pentingnya bela negara bagi warga negara.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 80,
    "id": "3cd59b63-ae39-4519-a511-741dca359717",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Pancasila",
    "kelas": 9,
    "judul": "Bab 5: Indonesia dan Kerja Sama Internasional di Era Globalisasi",
    "deskripsi": "Menganalisis peran dan tantangan Indonesia dalam pergaulan dunia.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 81,
    "id": "9097c2c9-ed21-4741-a680-323bb1b2b2ec",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 7,
    "judul": "Bab 1: Introducing Myself and Others",
    "deskripsi": "Mengungkapkan dan merespons perkenalan diri dan orang lain dalam bahasa Inggris.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 82,
    "id": "4cdbab0f-3dc7-42ad-bbcc-bf426403ddee",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 7,
    "judul": "Bab 2: My Daily Activities",
    "deskripsi": "Menceritakan kegiatan sehari-hari menggunakan simple present tense.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 83,
    "id": "75588ade-a0c3-42ad-a555-82c954fe3e6e",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 7,
    "judul": "Bab 3: Descriptive Text: People, Animals, and Places",
    "deskripsi": "Mendeskripsikan orang, hewan, dan tempat dalam teks deskriptif sederhana.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 84,
    "id": "f3d99102-e02f-48c9-8eae-5e96b39e20a9",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 7,
    "judul": "Bab 4: Recount Text: Past Experiences",
    "deskripsi": "Menceritakan pengalaman masa lalu dalam teks recount.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 85,
    "id": "057be507-8941-40ad-ad86-cc3f931e44fb",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 7,
    "judul": "Bab 5: Procedure Text: Instructions and Recipes",
    "deskripsi": "Memahami dan menulis teks prosedur berupa instruksi dan resep.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 86,
    "id": "30a25f9a-4c01-460c-b3b2-9ec17b3a22ef",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 7,
    "judul": "Bab 6: Caring for Our Environment",
    "deskripsi": "Menyampaikan gagasan tentang kepedulian lingkungan dalam bahasa Inggris.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 87,
    "id": "746dc513-45b0-4a7b-b729-154b7e1f0c46",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 8,
    "judul": "Bab 1: Congratulation and Compliment",
    "deskripsi": "Mengungkapkan dan merespons ucapan selamat dan pujian.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 88,
    "id": "ccd0ad14-b685-480c-8807-454b417d427b",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 8,
    "judul": "Bab 2: Narrative Text: Legend and Folklore",
    "deskripsi": "Memahami dan menceritakan kembali legenda dan cerita rakyat.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 89,
    "id": "88343239-c711-4b83-ac03-f0b88a44194c",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 8,
    "judul": "Bab 3: Explanation Text: How Things Work",
    "deskripsi": "Menjelaskan proses atau cara kerja suatu hal dalam teks eksplanasi.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 90,
    "id": "963ed477-2a2e-4c55-8593-2543fc41cdd8",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 8,
    "judul": "Bab 4: Advertisement, Slogan, and Short Message",
    "deskripsi": "Memahami dan membuat iklan, slogan, serta pesan singkat.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 91,
    "id": "69e8953c-5bce-480f-8ee0-087e659e46a0",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 8,
    "judul": "Bab 5: Asking and Giving Opinion",
    "deskripsi": "Menyampaikan dan merespons pendapat dalam percakapan sehari-hari.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 92,
    "id": "14d10bde-7149-4e8c-9117-6d49effaf127",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 8,
    "judul": "Bab 6: Report Text: Nature and Technology",
    "deskripsi": "Menyusun teks laporan sederhana tentang alam dan teknologi.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 93,
    "id": "7f2e42f0-3329-4591-a7ad-d93ea0afd6f2",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 9,
    "judul": "Bab 1: Expressing Hopes and Wishes",
    "deskripsi": "Mengungkapkan harapan dan keinginan menggunakan ungkapan bahasa Inggris yang tepat.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 94,
    "id": "5f67d169-bce2-41a5-86ea-a136c6f8167d",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 9,
    "judul": "Bab 2: Discussion Text: Pros and Cons",
    "deskripsi": "Menyampaikan argumen pro dan kontra dalam teks diskusi.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 95,
    "id": "021fbe35-6fec-4077-8743-4b06d488724d",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 9,
    "judul": "Bab 3: Application Letter and Curriculum Vitae",
    "deskripsi": "Menyusun surat lamaran dan CV sederhana dalam bahasa Inggris.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 96,
    "id": "c5da85cc-3a10-437e-aa63-566a11042949",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 9,
    "judul": "Bab 4: News Item Text",
    "deskripsi": "Memahami struktur dan menulis teks berita sederhana.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 97,
    "id": "4fe145ba-069b-4e05-a18c-2ba40d85c907",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 9,
    "judul": "Bab 5: Review Text: Film and Book",
    "deskripsi": "Menulis ulasan sederhana terhadap film atau buku.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 98,
    "id": "704c5e7d-29b2-466a-983c-9b85ccf17da8",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Bahasa Inggris",
    "kelas": 9,
    "judul": "Bab 6: Preparing for the Future",
    "deskripsi": "Membahas rencana karier dan pendidikan lanjutan dalam bahasa Inggris.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 99,
    "id": "81ac55b0-821d-4e3f-b42f-d15d168a7a07",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 7,
    "judul": "Bab 1: Permainan Invasi: Bola Basket",
    "deskripsi": "Mempraktikkan variasi gerak dasar dan strategi permainan bola basket.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 100,
    "id": "65fe8f2d-988e-4fb5-bd10-f1d3c0ddad82",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 7,
    "judul": "Bab 2: Permainan Net: Bola Voli",
    "deskripsi": "Mempraktikkan variasi gerak dasar dan taktik permainan bola voli.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 101,
    "id": "9b2ba028-c086-444e-b13f-8c75c1a3c9ff",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 7,
    "judul": "Bab 3: Permainan Lapangan: Kasti",
    "deskripsi": "Mempraktikkan variasi gerak dasar dan aturan permainan kasti.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 102,
    "id": "83bcde15-4d28-4c88-b944-3547db0ada27",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 7,
    "judul": "Bab 4: Bela Diri",
    "deskripsi": "Mempraktikkan gerak dasar bela diri untuk pertahanan dan sportivitas.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 103,
    "id": "5aab6adc-8fba-4830-aeeb-d16bd41fff6c",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 7,
    "judul": "Bab 5: Atletik",
    "deskripsi": "Mempraktikkan variasi gerak dasar jalan, lari, lompat, dan lempar.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 104,
    "id": "afafe63d-f46d-4e6b-90d8-8bdc9e209e84",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 7,
    "judul": "Bab 6: Senam Lantai",
    "deskripsi": "Mempraktikkan rangkaian gerak senam lantai dengan teknik yang benar.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 105,
    "id": "17546feb-ba31-429b-83d7-e80aced25120",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 7,
    "judul": "Bab 7: Senam Irama",
    "deskripsi": "Mempraktikkan rangkaian gerak berirama sesuai musik pengiring.",
    "urutan": 7,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 106,
    "id": "f4f97c5c-7959-4c5b-8e0c-b2f2a9d47995",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 7,
    "judul": "Bab 8: Kebugaran Jasmani",
    "deskripsi": "Memahami komponen kebugaran jasmani dan menyusun program latihan sederhana.",
    "urutan": 8,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 107,
    "id": "d7738c3e-36c8-428f-a314-4e75b720afcc",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 8,
    "judul": "Bab 1: Permainan Invasi: Sepak Bola",
    "deskripsi": "Mempraktikkan variasi gerak dasar dan strategi permainan sepak bola.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 108,
    "id": "83f958c2-bdfc-447f-8e10-f4601d5c9c42",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 8,
    "judul": "Bab 2: Permainan Net: Bulu Tangkis",
    "deskripsi": "Mempraktikkan variasi gerak dasar dan taktik permainan bulu tangkis.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 109,
    "id": "0d1bc6f8-908b-4e31-ad81-167c500e7a85",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 8,
    "judul": "Bab 3: Permainan Lapangan: Rounders/Softball",
    "deskripsi": "Mempraktikkan variasi gerak dasar dan aturan permainan rounders atau softball.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 110,
    "id": "731a8c53-be75-4f36-b18a-77233d1a1963",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 8,
    "judul": "Bab 4: Bela Diri: Pencak Silat",
    "deskripsi": "Mempraktikkan gerak dasar dan jurus pencak silat.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 111,
    "id": "8028d051-86d4-403d-820a-64f6abb13016",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 8,
    "judul": "Bab 5: Atletik: Lompat Jauh dan Lempar Lembing",
    "deskripsi": "Mempraktikkan teknik lompat jauh dan lempar lembing.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 112,
    "id": "39497a61-bebf-4f0c-b030-f1e69c8ff85f",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 8,
    "judul": "Bab 6: Senam Lantai Lanjutan",
    "deskripsi": "Mempraktikkan rangkaian gerak senam lantai tingkat lanjut.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 113,
    "id": "ee505f99-02a9-4aa9-a19e-8f6c1e21cd5b",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 8,
    "judul": "Bab 7: Aktivitas Gerak Berirama",
    "deskripsi": "Mempraktikkan rangkaian gerak berirama secara berkelompok.",
    "urutan": 7,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 114,
    "id": "ce224e83-2e6e-4041-b478-844921417d82",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 8,
    "judul": "Bab 8: Kebugaran Jasmani dan Pola Hidup Sehat",
    "deskripsi": "Menerapkan pola hidup sehat untuk menjaga kebugaran jasmani.",
    "urutan": 8,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 115,
    "id": "32af9ecd-8734-44d6-87b9-13d2d5196494",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 9,
    "judul": "Bab 1: Permainan Invasi: Bola Tangan",
    "deskripsi": "Mempraktikkan variasi gerak dasar dan strategi permainan bola tangan.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 116,
    "id": "d4ef103b-f84a-474c-969f-ecebfe8fe907",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 9,
    "judul": "Bab 2: Permainan Net: Tenis Meja",
    "deskripsi": "Mempraktikkan variasi gerak dasar dan taktik permainan tenis meja.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 117,
    "id": "3e79cf17-6d54-480a-a08a-753f70433495",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 9,
    "judul": "Bab 3: Permainan Lapangan Lanjutan",
    "deskripsi": "Mempraktikkan strategi lanjutan dalam permainan bola kecil.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 118,
    "id": "8e299931-8b43-4808-96a5-69045c5043fd",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 9,
    "judul": "Bab 4: Bela Diri: Karate",
    "deskripsi": "Mempraktikkan gerak dasar dan jurus karate.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 119,
    "id": "c305cc8f-959f-4fa8-81a9-2dadbfe4d5ff",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 9,
    "judul": "Bab 5: Atletik: Lari Estafet dan Tolak Peluru",
    "deskripsi": "Mempraktikkan teknik lari estafet dan tolak peluru.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 120,
    "id": "c1fa227a-c2de-414c-8c57-49994f31dfee",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 9,
    "judul": "Bab 6: Senam Ketangkasan",
    "deskripsi": "Mempraktikkan rangkaian gerak senam ketangkasan menggunakan alat.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 121,
    "id": "da3be7d7-cb84-46cc-a635-667570943f6b",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 9,
    "judul": "Bab 7: Aktivitas Air (Renang)",
    "deskripsi": "Mempraktikkan teknik dasar renang dan keselamatan di air.",
    "urutan": 7,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 122,
    "id": "feb46b4c-abb8-483d-a559-466ecfe5e72b",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "PJOK",
    "kelas": 9,
    "judul": "Bab 8: Kesehatan Reproduksi dan Bahaya NAPZA",
    "deskripsi": "Memahami kesehatan reproduksi remaja dan bahaya penyalahgunaan NAPZA.",
    "urutan": 8,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 123,
    "id": "3032b2f0-3477-49e9-810f-666e3277bfae",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 7,
    "judul": "Bab 1: Informatika dan Keterampilan Generik",
    "deskripsi": "Memahami peran informatika dan keterampilan generik dalam kehidupan sehari-hari.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 124,
    "id": "ce33c550-69cf-460b-ad67-aced473b6dac",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 7,
    "judul": "Bab 2: Berpikir Komputasional",
    "deskripsi": "Menerapkan konsep dekomposisi, pengenalan pola, abstraksi, dan algoritma dalam pemecahan masalah.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 125,
    "id": "dc016588-3ec9-4a62-ab51-dc00e07b4f0b",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 7,
    "judul": "Bab 3: Teknologi Informasi dan Komunikasi",
    "deskripsi": "Mengoperasikan perangkat lunak pengolah kata, angka, dan presentasi secara efektif.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 126,
    "id": "8899cb70-cc1a-4d98-b98a-e8764df2d62d",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 7,
    "judul": "Bab 4: Sistem Komputer",
    "deskripsi": "Memahami komponen perangkat keras dan perangkat lunak serta interaksi keduanya.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 127,
    "id": "42e48129-023e-43da-82e3-f63354a565d1",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 7,
    "judul": "Bab 5: Jaringan Komputer dan Internet",
    "deskripsi": "Memahami konsep jaringan komputer, internet, dan komunikasi data.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 128,
    "id": "cf14bd3b-3e9c-4629-8b2e-15f4984c1eee",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 7,
    "judul": "Bab 6: Analisis Data",
    "deskripsi": "Mengumpulkan, mengolah, dan menganalisis data sederhana menggunakan aplikasi pengolah data.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 129,
    "id": "8f135764-b134-430f-9ee5-c0c5b1304634",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 7,
    "judul": "Bab 7: Algoritma dan Pemrograman",
    "deskripsi": "Menyusun algoritma dan program sederhana menggunakan bahasa pemrograman visual.",
    "urutan": 7,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 130,
    "id": "69aa149e-bfb6-4eb6-8cd2-47e35d23a536",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 7,
    "judul": "Bab 8: Dampak Sosial Informatika",
    "deskripsi": "Memahami dampak sosial, etika, dan keamanan dalam pemanfaatan teknologi informasi.",
    "urutan": 8,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 131,
    "id": "2824eaf6-67e5-4cc4-8d65-9e5ee62cb767",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 7,
    "judul": "Bab 9: Praktik Lintas Bidang",
    "deskripsi": "Mengembangkan proyek kolaboratif yang mengintegrasikan berbagai elemen informatika.",
    "urutan": 9,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 132,
    "id": "a75ac363-afca-4d45-8738-7551c16efe30",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 8,
    "judul": "Bab 1: Berpikir Komputasional Lanjutan",
    "deskripsi": "Menerapkan berpikir komputasional pada masalah yang lebih kompleks.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 133,
    "id": "fa2fe9f7-a087-43fd-a56c-fdf7358f9f5d",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 8,
    "judul": "Bab 2: Teknologi Informasi dan Komunikasi Lanjutan",
    "deskripsi": "Mengintegrasikan berbagai aplikasi perkantoran untuk menghasilkan dokumen kompleks.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 134,
    "id": "f1a0252a-6ed1-41cb-a74e-1eb19bdf1eda",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 8,
    "judul": "Bab 3: Sistem Komputer: Perangkat Keras dan Sistem Operasi",
    "deskripsi": "Menganalisis fungsi perangkat keras dan cara kerja sistem operasi.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 135,
    "id": "772a89a8-9d46-4c46-94a4-7c6172fa3d90",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 8,
    "judul": "Bab 4: Jaringan Komputer dan Internet Lanjutan",
    "deskripsi": "Memahami konfigurasi jaringan dan layanan internet lanjutan.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 136,
    "id": "946ef14f-13c6-4eb4-a346-c078ddc620a7",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 8,
    "judul": "Bab 5: Analisis Data dengan Spreadsheet",
    "deskripsi": "Mengolah dan menganalisis data menggunakan fungsi lanjutan pada spreadsheet.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 137,
    "id": "b1cca858-b907-4732-b12b-7a1f9406f371",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 8,
    "judul": "Bab 6: Algoritma dan Pemrograman Visual",
    "deskripsi": "Menyusun program dengan struktur kontrol dan perulangan menggunakan pemrograman visual.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 138,
    "id": "0a4bd9a5-d251-4ab4-bb05-80fcfe523a9d",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 8,
    "judul": "Bab 7: Dampak Sosial Informatika: Keamanan Digital",
    "deskripsi": "Memahami risiko keamanan digital dan cara melindungi data pribadi.",
    "urutan": 7,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 139,
    "id": "ed5b8489-2b94-4f1e-8dbe-21eb15ae532a",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 8,
    "judul": "Bab 8: Praktik Lintas Bidang: Proyek Kolaboratif",
    "deskripsi": "Mengembangkan proyek kolaboratif berbasis teknologi informasi.",
    "urutan": 8,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 140,
    "id": "9ea4a12a-4aee-4ded-a76e-8ff1341b8007",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 9,
    "judul": "Bab 1: Berpikir Komputasional: Optimasi dan Struktur Data",
    "deskripsi": "Menerapkan konsep optimasi dan struktur data sederhana dalam pemecahan masalah.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 141,
    "id": "12f7f0f8-41e0-4253-8cef-ab6821aacc70",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 9,
    "judul": "Bab 2: Teknologi Informasi dan Komunikasi: Multimedia",
    "deskripsi": "Membuat dan mengolah konten multimedia sederhana.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 142,
    "id": "ceb90822-9b95-4480-a347-dcf8d3263a22",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 9,
    "judul": "Bab 3: Sistem Komputer: Jaringan dan Keamanan Sistem",
    "deskripsi": "Menganalisis keamanan sistem komputer dan jaringan.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 143,
    "id": "7224e80b-8fb5-419b-9d77-c3bacc2abf24",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 9,
    "judul": "Bab 4: Jaringan Komputer dan Internet: Konektivitas Lanjutan",
    "deskripsi": "Memahami konektivitas internet lanjutan dan layanan cloud.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 144,
    "id": "330d6187-4bb3-4da6-a5e4-10fd462b8ddc",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 9,
    "judul": "Bab 5: Analisis Data: Visualisasi dan Interpretasi",
    "deskripsi": "Menyajikan dan menginterpretasi data dalam bentuk visualisasi yang efektif.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 145,
    "id": "4800bb5c-4fb8-4de6-afae-7f4805cde6aa",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 9,
    "judul": "Bab 6: Algoritma dan Pemrograman Blok/Teks",
    "deskripsi": "Menyusun program menggunakan struktur data dan fungsi sederhana.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 146,
    "id": "4822deb9-cd60-4ae2-8ff5-be535255149a",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 9,
    "judul": "Bab 7: Dampak Sosial Informatika: Etika dan Karier Digital",
    "deskripsi": "Memahami etika digital dan peluang karier di bidang teknologi informasi.",
    "urutan": 7,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 147,
    "id": "441e09de-0cbd-4766-8d74-90003ebc1b89",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Informatika",
    "kelas": 9,
    "judul": "Bab 8: Praktik Lintas Bidang: Proyek Akhir Informatika",
    "deskripsi": "Mengembangkan proyek akhir yang mengintegrasikan seluruh elemen informatika.",
    "urutan": 8,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 148,
    "id": "9bb2c4ac-a3ad-460e-8927-3a1ec671b4c9",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 7,
    "judul": "Bab 1: Mengenal Bunyi dan Musik",
    "deskripsi": "Mengidentifikasi sumber bunyi dan unsur-unsur musik dalam kehidupan sehari-hari.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 149,
    "id": "83250159-8cf2-40d4-94ca-c94529a8872c",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 7,
    "judul": "Bab 2: Elemen-elemen Dasar Musik",
    "deskripsi": "Memahami irama, melodi, harmoni, dan dinamika dalam musik.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 150,
    "id": "8c23e093-4e5b-44d7-af9c-44a2db3ace48",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 7,
    "judul": "Bab 3: Bernyanyi Secara Unisono",
    "deskripsi": "Mempraktikkan teknik bernyanyi unisono dengan intonasi dan artikulasi yang tepat.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 151,
    "id": "c22a7298-76c5-4358-95ba-d07e40636133",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 7,
    "judul": "Bab 4: Bermain Musik Ansambel Sederhana",
    "deskripsi": "Mempraktikkan permainan musik ansambel menggunakan alat musik sederhana.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 152,
    "id": "afc4351c-bb9f-487f-83a9-0014670d3e08",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 7,
    "judul": "Bab 5: Apresiasi Musik Daerah Nusantara",
    "deskripsi": "Mengapresiasi keragaman musik tradisional dari berbagai daerah di Indonesia.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 153,
    "id": "b09fbf57-452a-424c-86bc-00bbc15912dc",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 8,
    "judul": "Bab 1: Bernyanyi dengan Teknik Vokal yang Benar",
    "deskripsi": "Mempraktikkan teknik vokal dalam bernyanyi solo maupun kelompok.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 154,
    "id": "8bf64b97-4d88-4375-bf27-88f602011fbb",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 8,
    "judul": "Bab 2: Bermain Alat Musik Melodis",
    "deskripsi": "Mempraktikkan permainan alat musik melodis sederhana.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 155,
    "id": "afd8d99b-03d1-457a-b968-123ef28c3e73",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 8,
    "judul": "Bab 3: Aransemen Musik Sederhana",
    "deskripsi": "Menyusun aransemen sederhana untuk lagu daerah atau nasional.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 156,
    "id": "3f69fdac-2d85-43d1-9e24-c25e4bd101ba",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 8,
    "judul": "Bab 4: Musik Populer dan Perkembangannya",
    "deskripsi": "Mengapresiasi perkembangan musik populer di Indonesia dan dunia.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 157,
    "id": "2d2d8ec4-a056-4e1d-8c13-b489fe0ab803",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 8,
    "judul": "Bab 5: Pergelaran Musik Kelompok",
    "deskripsi": "Merancang dan menampilkan pergelaran musik secara berkelompok.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 158,
    "id": "be6f3f17-8a72-4a68-9c61-762e7b40a3a9",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 9,
    "judul": "Bab 1: Komposisi Musik Sederhana",
    "deskripsi": "Menciptakan komposisi musik sederhana berdasarkan gagasan pribadi.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 159,
    "id": "7db0e352-c759-48bc-86c7-844949250742",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 9,
    "judul": "Bab 2: Musik Tradisi dan Musik Kontemporer",
    "deskripsi": "Membandingkan karakteristik musik tradisi dengan musik kontemporer.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 160,
    "id": "4dd9a08d-90f8-44c4-8a27-8180a2bbb6cc",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 9,
    "judul": "Bab 3: Kritik Musik",
    "deskripsi": "Menyusun kritik musik terhadap sebuah karya secara objektif.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 161,
    "id": "aaa12ff5-5fff-49fd-85b8-5817fbdcbd80",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 9,
    "judul": "Bab 4: Produksi dan Rekaman Musik Sederhana",
    "deskripsi": "Memahami proses dasar produksi dan rekaman musik sederhana.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 162,
    "id": "1c4a72fc-4bef-4fa3-affb-9dd682910b1f",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Seni Musik",
    "kelas": 9,
    "judul": "Bab 5: Proyek Pergelaran Musik Akhir",
    "deskripsi": "Merancang dan menampilkan proyek pergelaran musik sebagai karya akhir.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 163,
    "id": "3ddba0de-8179-4d4b-8ef0-ec61d63af5f4",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 7,
    "judul": "Bab 1: Al-Qur'an Pedoman Hidupku",
    "deskripsi": "Membaca dan memahami ayat Al-Qur'an dengan tartil sebagai pedoman hidup.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 164,
    "id": "3ab739d5-8e76-4904-ba40-712d5c5d97f7",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 7,
    "judul": "Bab 2: Meneladani Asmaul Husna",
    "deskripsi": "Memahami dan meneladani makna Asmaul Husna dalam kehidupan sehari-hari.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 165,
    "id": "0a735934-53e1-4bc1-bdcc-53454f90e4a9",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 7,
    "judul": "Bab 3: Mujahadah an-Nafs, Husnuzan, dan Ukhuwah",
    "deskripsi": "Menerapkan sikap mujahadah an-nafs, husnuzan, dan ukhuwah dalam pergaulan.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 166,
    "id": "8b63e6d5-fc3a-4aab-9848-edb41a136158",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 7,
    "judul": "Bab 4: Bersuci (Thaharah) dalam Islam",
    "deskripsi": "Memahami ketentuan bersuci dari hadas dan najis menurut syariat Islam.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 167,
    "id": "84eafa8e-74a0-49c7-a53c-648a78ec7c26",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 7,
    "judul": "Bab 5: Indahnya Salat Berjemaah",
    "deskripsi": "Memahami tata cara dan keutamaan salat berjemaah.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 168,
    "id": "0ab269ea-e0c2-4109-b9ec-e7d3aa02e414",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 7,
    "judul": "Bab 6: Semangat Menuntut Ilmu",
    "deskripsi": "Menumbuhkan semangat menuntut ilmu sebagai kewajiban setiap muslim.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 169,
    "id": "e2a7e490-44d4-42cb-83bb-85771330a312",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 7,
    "judul": "Bab 7: Hijrah ke Madinah: Meneladani Perjuangan Nabi",
    "deskripsi": "Meneladani nilai perjuangan Nabi Muhammad saw. dalam peristiwa hijrah.",
    "urutan": 7,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 170,
    "id": "89b8de7d-7bdc-414d-80e0-8d89590483e4",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 7,
    "judul": "Bab 8: Salat Jumat, Jamak, dan Qasar",
    "deskripsi": "Memahami ketentuan salat Jumat serta salat jamak dan qasar.",
    "urutan": 8,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 171,
    "id": "5b5c2578-2898-4978-9c54-9bdc0fb8e229",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 8,
    "judul": "Bab 1: Meyakini Kitab-kitab Allah dan Mencintai Al-Qur'an",
    "deskripsi": "Memahami kedudukan kitab-kitab Allah dan mencintai Al-Qur'an sebagai kitab suci.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 172,
    "id": "cbb23182-7b2f-4d89-8214-288990b3d2ca",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 8,
    "judul": "Bab 2: Meneladani Sifat Rasul: Jujur dan Adil",
    "deskripsi": "Meneladani sifat jujur dan adil sebagaimana dicontohkan para rasul.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 173,
    "id": "b5389683-29c5-427f-8c37-0cb14434afbf",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 8,
    "judul": "Bab 3: Menghindari Perilaku Tercela",
    "deskripsi": "Memahami bahaya minuman keras, judi, dan pertengkaran serta cara menghindarinya.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 174,
    "id": "f078ce3d-c723-48a4-8c4e-4553d3ecdc64",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 8,
    "judul": "Bab 4: Hormat dan Patuh kepada Orang Tua dan Guru",
    "deskripsi": "Menerapkan sikap hormat dan patuh kepada orang tua dan guru.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 175,
    "id": "cd12de61-c0c9-471d-add9-e8e7844d79c1",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 8,
    "judul": "Bab 5: Sujud Syukur, Sujud Sahwi, dan Sujud Tilawah",
    "deskripsi": "Memahami ketentuan dan tata cara sujud syukur, sahwi, dan tilawah.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 176,
    "id": "c8be19aa-a331-4c52-8c2a-6330a1b32fb1",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 8,
    "judul": "Bab 6: Puasa Wajib dan Puasa Sunnah",
    "deskripsi": "Memahami ketentuan puasa wajib dan puasa sunnah beserta hikmahnya.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 177,
    "id": "8e630978-7cd6-4a7f-9c2c-18616483d44b",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 8,
    "judul": "Bab 7: Perkembangan Ilmu Pengetahuan Masa Bani Umayyah",
    "deskripsi": "Memahami sejarah perkembangan ilmu pengetahuan pada masa Bani Umayyah.",
    "urutan": 7,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 178,
    "id": "041819f6-1996-4613-8a00-94b11710f8d1",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 8,
    "judul": "Bab 8: Zakat dan Hikmahnya",
    "deskripsi": "Memahami ketentuan zakat fitrah dan zakat mal beserta hikmahnya.",
    "urutan": 8,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 179,
    "id": "d8b4ed46-bafb-4715-9dc9-2c603deeda82",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 9,
    "judul": "Bab 1: Meyakini Hari Akhir",
    "deskripsi": "Memahami tanda-tanda dan hikmah beriman kepada hari akhir.",
    "urutan": 1,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 180,
    "id": "7c85bed0-c0e1-474a-b99e-6f85f4982c07",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 9,
    "judul": "Bab 2: Meyakini Qada dan Qadar",
    "deskripsi": "Memahami makna dan hikmah beriman kepada qada dan qadar Allah.",
    "urutan": 2,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 181,
    "id": "554df724-d7c6-433f-8c6c-0ac46a92b1d5",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 9,
    "judul": "Bab 3: Berbakti dan Taat kepada Orang Tua dan Guru",
    "deskripsi": "Menerapkan perilaku berbakti dan taat kepada orang tua dan guru.",
    "urutan": 3,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 182,
    "id": "531ec94e-b947-4de9-9a41-16410e084c1b",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 9,
    "judul": "Bab 4: Bahaya Pergaulan Bebas dan Zina",
    "deskripsi": "Memahami bahaya pergaulan bebas dan zina serta cara menghindarinya.",
    "urutan": 4,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 183,
    "id": "91c1dc2f-565e-48d5-bf11-732d321712fa",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 9,
    "judul": "Bab 5: Ketentuan Penyembelihan Hewan dalam Islam",
    "deskripsi": "Memahami syarat dan tata cara penyembelihan hewan menurut syariat Islam.",
    "urutan": 5,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 184,
    "id": "17640f15-9ddc-4e87-8ea5-564a97fb412a",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 9,
    "judul": "Bab 6: Ibadah Haji dan Umrah",
    "deskripsi": "Memahami ketentuan dan tata cara pelaksanaan ibadah haji dan umrah.",
    "urutan": 6,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 185,
    "id": "fa202aea-a0cb-45fe-a25d-13d567637205",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 9,
    "judul": "Bab 7: Perkembangan Islam pada Masa Modern",
    "deskripsi": "Memahami sejarah perkembangan Islam pada masa modern.",
    "urutan": 7,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  },
  {
    "idx": 186,
    "id": "718772ee-b4d6-4213-87b2-f43f644a1d1b",
    "sekolah_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "mapel": "Pendidikan Agama Islam dan Budi Pekerti",
    "kelas": 9,
    "judul": "Bab 8: Toleransi dan Menghargai Perbedaan",
    "deskripsi": "Menerapkan sikap toleransi dan menghargai perbedaan dalam kehidupan bermasyarakat.",
    "urutan": 8,
    "dibuat_pada": "2026-09-06 00:00:00+00"
  }
];

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mtpnbviztquitgszrfel',
  password: 'programermudaindonesia',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully!');

    // 1. Ensure mapel and kelas columns exist on bab table
    console.log('Ensuring mapel and kelas columns exist in bab table...');
    await client.query(`
      ALTER TABLE bab ADD COLUMN IF NOT EXISTS mapel TEXT;
      ALTER TABLE bab ADD COLUMN IF NOT EXISTS kelas INT;
    `);
    console.log('Schema verified/updated successfully.');

    // 2. Clear all existing data in bab table
    console.log('Clearing existing records in bab table...');
    await client.query('DELETE FROM bab;');
    const countAfterDelete = await client.query('SELECT count(*) FROM bab;');
    console.log('Count in bab after delete:', countAfterDelete.rows[0].count);

    // 3. Insert all records
    console.log(`Inserting ${rawBabData.length} records into bab table...`);
    let insertedCount = 0;

    for (const item of rawBabData) {
      await client.query(
        `INSERT INTO bab (id, sekolah_id, mapel, kelas, judul, deskripsi, urutan, dibuat_pada)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          item.id,
          item.sekolah_id,
          item.mapel,
          item.kelas,
          item.judul,
          item.deskripsi,
          item.urutan,
          item.dibuat_pada
        ]
      );
      insertedCount++;
    }

    console.log(`Successfully inserted ${insertedCount} records!`);

    // 4. Verification queries
    const totalCountRes = await client.query('SELECT count(*) FROM bab;');
    console.log('Total rows in bab table now:', totalCountRes.rows[0].count);

    const mapelSummaryRes = await client.query(`
      SELECT mapel, kelas, count(*) as total_bab
      FROM bab
      GROUP BY mapel, kelas
      ORDER BY mapel, kelas;
    `);
    console.log('Summary by Mapel & Kelas:');
    console.table(mapelSummaryRes.rows);

    const sampleRes = await client.query(`
      SELECT id, mapel, kelas, urutan, judul
      FROM bab
      ORDER BY urutan, mapel
      LIMIT 10;
    `);
    console.log('Sample bab records:');
    console.table(sampleRes.rows);

    await client.end();
    console.log('Database operation completed successfully.');
  } catch (err) {
    console.error('Error during database operation:', err);
    process.exit(1);
  }
}

main();
