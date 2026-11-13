"use client";

import { useState, useRef, useTransition, Suspense, useEffect } from "react";
import { registerAction } from "../actions";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  School,
  MapPin,
  Calendar,
  CreditCard,
  Camera,
  Upload,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Check,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  saveStoredStudentProfile,
  saveStoredStudentPhoto,
  DEFAULT_STUDENT_PHOTO,
  FEMALE_STUDENT_PHOTO,
} from "@/lib/student-settings";

// Data Wali Kelas otomatis berdasarkan pilihan kelas
const KELAS_OPTIONS = [
  {
    id: "Kelas 8A",
    label: "Kelas 8A (Unggulan)",
    waliKelas: "Ibu Siti Rahmawati, M.Pd.",
    ruang: "Lab Matematika & Komputer 1",
  },
  {
    id: "Kelas 8B",
    label: "Kelas 8B (Reguler)",
    waliKelas: "Bapak Budi Santoso, S.Pd.",
    ruang: "Gedung Teori Lantai 2",
  },
  {
    id: "Kelas 8C",
    label: "Kelas 8C (Reguler)",
    waliKelas: "Dra. Nurul Hidayah",
    ruang: "Gedung Teori Lantai 2",
  },
];

// Opsi Preset Foto Siswa
const PRESET_AVATARS = [
  {
    id: "siswa-1",
    label: "Siswa Putra",
    sublabel: "Seragam Resmi",
    gender: "Laki-laki",
    src: DEFAULT_STUDENT_PHOTO,
  },
  {
    id: "siswi-1",
    label: "Siswi Putri",
    sublabel: "Hijab Rapi",
    gender: "Perempuan",
    src: FEMALE_STUDENT_PHOTO,
  },
  {
    id: "avatar-ai",
    label: "Pelajar AI",
    sublabel: "Digital Avatar",
    gender: "Netral",
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  },
];

/**
 * Deteksi cerdas gender berdasarkan nama Indonesia.
 */
function detectGenderFromName(name: string): "Perempuan" | "Laki-laki" | null {
  const n = name.toLowerCase().trim();
  if (!n || n.length < 2) return null;

  const femaleKeywords = [
    "siti", "putri", "dewi", "ayu", "nur", "nurul", "rahma", "rahmawati", "annisa",
    "nisa", "sarah", "nadela", "rina", "wati", "laras", "aulia", "fitri", "fitria",
    "indah", "dwi", "lestari", "nia", "mega", "nadia", "tasya", "bella", "bunga",
    "zahra", "nayla", "salsa", "salsabila", "kartika", "anggun", "mutia", "intan",
    "rani", "amalia", "widya", "retno", "safitri", "tiara", "cantika", "hanifah",
    "nanoka", "heffa", "agneisca", "alyssa", "khansa", "salma", "syifa", "nabila"
  ];

  const maleKeywords = [
    "ahmad", "muhammad", "budi", "santoso", "fauzi", "zafa", "kuncoro", "dimas",
    "bayu", "pratama", "rizky", "reza", "dani", "adi", "aditya", "agus", "wahyu",
    "fajar", "ilham", "arif", "yoga", "rendi", "hendra", "joko", "anton", "ferdi",
    "alif", "bilal", "daffa", "raka", "bagus", "gilang", "arya", "hafiz", "kevin",
    "aldo", "doni", "eko", "putra", "raditya", "rafli", "zidan", "syahrul"
  ];

  const words = n.split(/\s+/);
  for (const word of words) {
    if (femaleKeywords.includes(word)) return "Perempuan";
    if (maleKeywords.includes(word)) return "Laki-laki";
  }

  for (const kw of femaleKeywords) {
    if (n.includes(kw)) return "Perempuan";
  }
  for (const kw of maleKeywords) {
    if (n.includes(kw)) return "Laki-laki";
  }

  return null;
}

function DaftarFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const isFromOAuthUnregistered = searchParams.get("error") === "unregistered_oauth";

  const queryNama = searchParams.get("nama") || "";
  const queryEmail = searchParams.get("email") || "";
  const initialGender = queryNama ? detectGenderFromName(queryNama) : null;

  // Step state: 1 = Form Pendaftaran, 2 = Pembuatan Profile Foto
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields State
  const [namaLengkap, setNamaLengkap] = useState(queryNama);
  const [jenisKelamin, setJenisKelamin] = useState<"Laki-laki" | "Perempuan">(initialGender || "Laki-laki");
  const [isGenderManual, setIsGenderManual] = useState(false);
  const [detectedGenderHint, setDetectedGenderHint] = useState<string | null>(
    initialGender ? `Terdeteksi: ${initialGender === "Perempuan" ? "Siswi Putri 🌸" : "Siswa Putra 👔"}` : null
  );

  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [noWa, setNoWa] = useState("");
  const [namaKelas, setNamaKelas] = useState("Kelas 8A");
  const [nisn, setNisn] = useState("");
  const [email, setEmail] = useState(queryEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Foto Profil State (Default draft disesuaikan dengan jenis kelamin)
  const [selectedPhoto, setSelectedPhoto] = useState<string>(
    initialGender === "Perempuan" ? FEMALE_STUDENT_PHOTO : DEFAULT_STUDENT_PHOTO
  );
  const [customPhotoPreview, setCustomPhotoPreview] = useState<string | null>(null);
  const [hasCustomPhotoSelected, setHasCustomPhotoSelected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status Akun & Validasi Email Unik
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [alreadyRegisteredUser, setAlreadyRegisteredUser] = useState<string | null>(null);

  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handler nama lengkap berubah -> Deteksi cerdas gender & penyesuaian draft profil
  const handleNameChange = (val: string) => {
    setNamaLengkap(val);
    setErrorMessage(null);

    if (!isGenderManual) {
      const detected = detectGenderFromName(val);
      if (detected) {
        setJenisKelamin(detected);
        setDetectedGenderHint(`Terdeteksi: ${detected === "Perempuan" ? "Siswi Putri 🌸" : "Siswa Putra 👔"}`);
        // Jika belum memilih foto kustom sendiri, sesuaikan draft foto profil
        if (!hasCustomPhotoSelected) {
          setSelectedPhoto(detected === "Perempuan" ? FEMALE_STUDENT_PHOTO : DEFAULT_STUDENT_PHOTO);
        }
      } else {
        setDetectedGenderHint(null);
      }
    }
  };

  // Handler pilih jenis kelamin manual
  const handleGenderSelect = (gender: "Laki-laki" | "Perempuan") => {
    setIsGenderManual(true);
    setJenisKelamin(gender);
    setDetectedGenderHint(null);
    setErrorMessage(null);

    // Sesuaikan draft pasfoto profil jika belum upload foto sendiri
    if (!hasCustomPhotoSelected) {
      setSelectedPhoto(gender === "Perempuan" ? FEMALE_STUDENT_PHOTO : DEFAULT_STUDENT_PHOTO);
    }
  };

  // Periksa apakah email sudah terdaftar di sistem
  const checkEmailAccountStatus = async (emailToCheck: string): Promise<boolean> => {
    const cleanEmail = emailToCheck.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) return false;

    setIsCheckingAccount(true);
    try {
      const res = await fetch("/api/auth/check-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.exists && data.hasProfile) {
          setAlreadyRegisteredUser(cleanEmail);
          setErrorMessage(
            "Email ini sudah terdaftar dan sudah memiliki profil. 1 akun hanya dapat digunakan oleh 1 pengguna. Silakan masuk melalui jalur login."
          );
          return true;
        }
      }
      setAlreadyRegisteredUser(null);
      return false;
    } catch {
      return false;
    } finally {
      setIsCheckingAccount(false);
    }
  };

  // Handler validasi Step 1 dan lanjut ke Step 2 (Pembuatan Profile Foto)
  const handleProceedToPhotoStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!namaLengkap.trim() || namaLengkap.trim().length < 3) {
      setErrorMessage("Nama lengkap minimal 3 karakter.");
      return;
    }

    if (!tempatLahir.trim() || !tanggalLahir) {
      setErrorMessage("Tempat dan tanggal lahir wajib dilengkapi.");
      return;
    }

    if (!nisn.trim()) {
      setErrorMessage("NISN wajib diisi.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Alamat email tidak valid.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Kata sandi minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    // Periksa status akun: 1 akun hanya 1 pengguna
    const isAlready = await checkEmailAccountStatus(email);
    if (isAlready) {
      return;
    }

    // Pastikan foto profil draft default terpasang sesuai jenis kelamin jika belum disetel
    if (!hasCustomPhotoSelected) {
      setSelectedPhoto(jenisKelamin === "Perempuan" ? FEMALE_STUDENT_PHOTO : DEFAULT_STUDENT_PHOTO);
    }

    // Lanjut ke Step 2 (Pembuatan Profile Foto)
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler upload foto custom dari perangkat
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setErrorMessage("Ukuran foto maksimal 4MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomPhotoPreview(base64String);
        setSelectedPhoto(base64String);
        setHasCustomPhotoSelected(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler Final Submit Pendaftaran
  const handleFinalSubmit = async () => {
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("nama_lengkap", namaLengkap.trim());
    formData.append("email", email.trim().toLowerCase());
    formData.append("password", password);
    formData.append("jenis_kelamin", jenisKelamin);
    formData.append("tempat_lahir", tempatLahir.trim());
    formData.append("tanggal_lahir", tanggalLahir);
    formData.append("nama_kelas", namaKelas);
    formData.append("nisn", nisn.trim());
    formData.append("no_wa", noWa.trim());
    formData.append("foto_url", selectedPhoto);
    formData.append("asal_sekolah", "SMK Muhammadiyah 1");

    startTransition(async () => {
      try {
        const res = await registerAction(null, formData);

        if (res?.error) {
          if (res.alreadyRegistered) {
            setAlreadyRegisteredUser(email.trim().toLowerCase());
          }
          setErrorMessage(res.error);
          return;
        }

        // Simpan ke local storage agar profil siswa langsung aktif & terisi
        saveStoredStudentProfile({
          nama_lengkap: namaLengkap.trim(),
          nama_kelas: namaKelas,
          nis: nisn.slice(-6) || "260481",
          nisn: nisn.trim(),
          jurusan: "Fase D (Kurikulum Merdeka)",
          tempat_tgl_lahir: `${tempatLahir.trim()}, ${tanggalLahir}`,
          jenis_kelamin: jenisKelamin,
          agama: "Islam",
          tahun_ajaran: "2026/2027",
          foto_url: selectedPhoto,
        });
        saveStoredStudentPhoto(selectedPhoto, namaLengkap.trim(), nisn.trim());

        if (res?.success) {
          setSuccessMessage(
            res.message || "Pendaftaran akun siswa berhasil! Mengalihkan ke dashboard..."
          );
          setTimeout(() => {
            router.push("/");
          }, 1200);
        }
      } catch (err: any) {
        console.error("Gagal mendaftar:", err);
        setErrorMessage("Terjadi kesalahan sistem saat mendaftar. Silakan coba lagi.");
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#081220] font-sans antialiased text-slate-800 selection:bg-blue-600 selection:text-white">
      {/* ======================================================== */}
      {/* SISI KIRI: BRANDING & 3D HERO VISUAL PALLETE THINKSY     */}
      {/* ======================================================== */}
      <div className="lg:w-1/2 min-h-full relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-[#0B1A2E] via-[#0D2342] to-[#071324] text-white overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        {/* Header Logo Thinksy */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 shadow-xl shadow-blue-900/30 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Thinksy Logo"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white font-sans">
            Thinksy
          </span>
        </div>

        {/* Centerpiece Hero 3D Illustration & Headlines */}
        <div className="relative z-10 my-auto py-8 sm:py-12 flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="relative w-full max-w-[340px] sm:max-w-[400px] aspect-[4/3] mb-8 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(8,20,40,0.6)] border border-white/10 group">
            <img
              src="/images/thinksy-hero.jpg"
              alt="Mulai Perjalanan Belajarmu - Thinksy"
              className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1A2E]/80 via-transparent to-transparent pointer-events-none" />
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-3">
            Mulai Perjalanan Belajarmu
          </h2>
          <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed font-normal max-w-md">
            Satu akun resmi untuk satu siswa. Data pendaftaran Anda langsung membentuk profil digital dan Kartu Pelajar terverifikasi.
          </p>
        </div>

        {/* Footer Sisi Kiri */}
        <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 border-t border-white/10">
          <span>&copy; {new Date().getFullYear()} Thinksy Education. Hak Cipta Dilindungi.</span>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <span className="hover:text-white cursor-pointer transition-colors">Bantuan</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privasi</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer transition-colors">Syarat Ketentuan</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SISI KANAN: FORM PENDAFTARAN SCROLLABLE & DIPERBESAR     */}
      {/* ======================================================== */}
      <div className="lg:w-1/2 min-h-screen bg-[#F8FAFC] flex flex-col justify-start items-center py-10 px-4 sm:px-8 lg:px-12 overflow-y-auto">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-6 sm:p-10 my-auto">
          {/* Heading Card */}
          <div className="mb-6 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
                Langkah {step} dari 2
              </span>
              <span className="text-xs text-slate-400">
                {step === 1 ? "Biodata Siswa" : "Draft Foto & Profil"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1A2E] tracking-tight">
              {step === 1 ? "Buat Akun Siswa Baru" : "Sesuaikan Draft Profil Siswa"}
            </h1>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {step === 1
                ? "Lengkapi data diri Anda. 1 akun hanya digunakan oleh 1 pengguna resmi."
                : `Draft profil ${jenisKelamin === "Perempuan" ? "Siswi Putri" : "Siswa Putra"} disesuaikan otomatis dengan data pendaftaran Anda.`}
            </p>
          </div>

          {/* Notifikasi Khusus: Akun Sudah Terdaftar -> Hanya Jalur Login */}
          {alreadyRegisteredUser && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-amber-900">Akun Sudah Memiliki Profil</p>
                  <p className="text-amber-800 text-xs leading-relaxed">
                    Email <strong>{alreadyRegisteredUser}</strong> sudah terdaftar di sistem. Satu akun hanya dapat digunakan oleh satu pengguna. Anda tidak perlu mendaftar lagi, silakan masuk ke akun Anda.
                  </p>
                </div>
              </div>
              <Link
                href={`/masuk?email=${encodeURIComponent(alreadyRegisteredUser)}`}
                className="block w-full text-center py-2.5 px-4 rounded-xl bg-[#0B1A2E] hover:bg-slate-800 text-white font-bold transition text-xs shadow-md"
              >
                Masuk Sekarang Menggunakan Akun Ini →
              </Link>
            </div>
          )}

          {/* Notifikasi jika dialihkan dari percobaan login Google/GitHub yang belum terdaftar */}
          {isFromOAuthUnregistered && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm space-y-2 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-900">Akun Belum Terdaftar di Thinksy</p>
                  <p className="text-amber-800 text-xs leading-relaxed">
                    Akun Google / GitHub Anda ({email || "sosial media"}) belum terdaftar di sistem. Tombol login sosial hanya diperuntukkan bagi akun yang sudah aktif.
                  </p>
                  <p className="text-amber-800 text-xs leading-relaxed font-semibold">
                    Silakan lengkapi formulir di bawah ini (data NISN, kelas, dan data profil) untuk membuat akun resmi Thinksy Anda.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pesan Error Umum */}
          {errorMessage && !alreadyRegisteredUser && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold">Perhatian</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm animate-in fade-in duration-200">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
              <div>
                <p className="font-semibold">Sukses</p>
                <p className="mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: FORMULIR BIODATA SISWA LENGKAP                   */}
          {/* ======================================================== */}
          {step === 1 && (
            <form onSubmit={handleProceedToPhotoStep} className="space-y-4 sm:space-y-5">
              {/* 1. Nama Lengkap */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  {detectedGenderHint && (
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {detectedGenderHint}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <User className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    value={namaLengkap}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    minLength={3}
                    placeholder="Contoh: Siti Rahayu atau Ahmad Fauzi"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-xs"
                  />
                </div>
              </div>

              {/* 2. Jenis Kelamin (Penyesuai Draft Profil Otomatis) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 tracking-wide">
                  Jenis Kelamin <span className="text-red-500">*</span>
                  <span className="ml-1 text-[11px] font-normal text-slate-400">
                    (Menentukan draft foto & kartu profil siswa)
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleGenderSelect("Laki-laki")}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2.5 transition-all cursor-pointer font-bold text-xs sm:text-sm ${
                      jenisKelamin === "Laki-laki"
                        ? "bg-[#0B1A2E] text-white border-[#0B1A2E] shadow-md ring-2 ring-blue-500/30"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span>👦</span>
                    <span>Laki-laki (Putra)</span>
                    {jenisKelamin === "Laki-laki" && <Check className="w-4 h-4 ml-auto text-blue-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenderSelect("Perempuan")}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2.5 transition-all cursor-pointer font-bold text-xs sm:text-sm ${
                      jenisKelamin === "Perempuan"
                        ? "bg-rose-950 text-white border-rose-900 shadow-md ring-2 ring-rose-500/30"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span>👧</span>
                    <span>Perempuan (Putri)</span>
                    {jenisKelamin === "Perempuan" && <Check className="w-4 h-4 ml-auto text-rose-300" />}
                  </button>
                </div>
              </div>

              {/* 3. Asal Sekolah (DITETAPKAN: SMK Muhammadiyah 1) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide">
                    Asal Sekolah
                  </label>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Ditetapkan Resmi
                  </span>
                </div>
                <div className="relative flex items-center">
                  <School className="w-5 h-5 text-blue-600 absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    readOnly
                    value="SMK Muhammadiyah 1"
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-100/90 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 cursor-not-allowed select-none shadow-xs"
                  />
                  <div className="absolute right-4 text-slate-400 flex items-center">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* 4. Tempat Lahir & Tanggal Lahir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide">
                    Tempat Lahir <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={tempatLahir}
                      onChange={(e) => setTempatLahir(e.target.value)}
                      required
                      placeholder="Kota / Kab Lahir"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide">
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="date"
                      value={tanggalLahir}
                      onChange={(e) => setTanggalLahir(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Pilihan Kelas & No WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide">
                    Pilihan Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={namaKelas}
                    onChange={(e) => setNamaKelas(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-800 font-semibold focus:outline-none transition-all duration-200 cursor-pointer shadow-xs"
                  >
                    {KELAS_OPTIONS.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide">
                    Nomor WhatsApp / HP
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="tel"
                      value={noWa}
                      onChange={(e) => setNoWa(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="08123456789"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 6. NISN (1 Akun = 1 Siswa) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 tracking-wide">
                  NISN (Nomor Induk Siswa Nasional) <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <CreditCard className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value.replace(/[^0-9]/g, ""))}
                    required
                    maxLength={10}
                    placeholder="Contoh: 0089247182 (10 digit)"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-xs"
                  />
                </div>
              </div>

              {/* 7. Alamat Email (Wajib Unik per Pengguna) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide">
                    Alamat Email <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">1 akun = 1 pengguna</span>
                </div>
                <div className="relative flex items-center">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setAlreadyRegisteredUser(null);
                      setErrorMessage(null);
                    }}
                    onBlur={(e) => {
                      if (e.target.value.includes("@")) {
                        checkEmailAccountStatus(e.target.value);
                      }
                    }}
                    required
                    placeholder="siswa@sekolah.sch.id"
                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-50/70 hover:bg-slate-50 border focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-xs ${
                      alreadyRegisteredUser ? "border-amber-400 ring-2 ring-amber-200" : "border-slate-200 focus:border-blue-500"
                    }`}
                  />
                  {isCheckingAccount && (
                    <div className="absolute right-4">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* 8. Kata Sandi & Konfirmasi Kata Sandi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide">
                    Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Min. 8 karakter"
                      className="w-full pl-12 pr-11 py-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide">
                    Ulangi Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Ulangi kata sandi"
                      className="w-full pl-12 pr-11 py-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tombol Lanjut: Pembuatan Profile Foto Siswa */}
              <button
                type="submit"
                disabled={isCheckingAccount || Boolean(alreadyRegisteredUser)}
                className="w-full mt-4 py-4 bg-[#0B1A2E] hover:bg-[#132A4A] text-white font-bold text-sm sm:text-base rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-blue-950/20 hover:shadow-xl cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Lanjut: Sesuaikan Pasfoto & Profil ({jenisKelamin === "Perempuan" ? "Siswi Putri" : "Siswa Putra"})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Divider Atau */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Atau
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Masuk jika sudah punya akun */}
              <Link
                href={`/masuk${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 shadow-xs transition-all"
              >
                <span>Sudah Punya Akun? Masuk di Sini</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 2: PENYESUAIAN DRAFT PROFIL & PASFOTO SISWA        */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Preview Draft Profil Lengkap Sesuai Jenis Kelamin */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-blue-50/40 border border-slate-200 text-center relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${
                      jenisKelamin === "Perempuan"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    <span>{jenisKelamin === "Perempuan" ? "🌸 Siswi Putri" : "👔 Siswa Putra"}</span>
                  </span>
                </div>

                <div className="relative group mb-3 mx-auto w-28 h-28 sm:w-32 sm:h-32">
                  <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl shadow-blue-900/15 bg-slate-200">
                    <img
                      src={selectedPhoto}
                      alt="Preview Pasfoto Siswa"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-[#0B1A2E] text-white flex items-center justify-center shadow-md hover:bg-blue-600 transition-colors cursor-pointer"
                    title="Unggah Pasfoto Pribadi"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-extrabold text-slate-900">
                  {namaLengkap || "Nama Siswa"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {email}
                </p>

                {/* Badge Detail Profil */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-600 font-medium">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                    {namaKelas}
                  </span>
                  <span>•</span>
                  <span>SMK Muhammadiyah 1</span>
                  <span>•</span>
                  <span>NISN: {nisn || "-"}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/70 text-[11px] text-slate-500 flex items-center justify-center gap-4">
                  <span>TTL: {tempatLahir}, {tanggalLahir}</span>
                  <span>•</span>
                  <span>Fase D (Kurikulum Merdeka)</span>
                </div>
              </div>

              {/* Pilihan Pasfoto Rekomendasi Sesuai Jenis Kelamin */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide">
                    Pilih Pasfoto Resmi Siswa
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Draft aktif: {jenisKelamin === "Perempuan" ? "Siswi Putri" : "Siswa Putra"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {PRESET_AVATARS.map((av) => {
                    const isGenderMatch = av.gender === jenisKelamin;
                    const isSelected = selectedPhoto === av.src;

                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          setSelectedPhoto(av.src);
                          setHasCustomPhotoSelected(true);
                        }}
                        className={`p-3 rounded-2xl border flex flex-col items-center text-center transition-all cursor-pointer relative ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        {isGenderMatch && (
                          <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-600 text-white">
                            Draft
                          </span>
                        )}
                        <div className="w-14 h-14 rounded-full overflow-hidden mb-2 border-2 border-white shadow-sm">
                          <img src={av.src} alt={av.label} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">{av.label}</span>
                        <span className="text-[10px] text-slate-400">{av.sublabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opsi Unggah Foto Sendiri */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 tracking-wide">
                  Atau Unggah Pasfoto Pribadi
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Unggah dari Komputer / Smartphone (Maks. 4MB)</span>
                </button>
              </div>

              {/* Tombol Aksi Step 2 */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setStep(1)}
                  className="w-full sm:w-1/3 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Ubah Data</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleFinalSubmit}
                  className="w-full sm:w-2/3 py-3.5 px-4 bg-[#0B1A2E] hover:bg-[#132A4A] text-white font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-950/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Menyimpan Akun & Profil...</span>
                    </>
                  ) : (
                    <>
                      <span>Selesaikan & Masuk Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Footer Card: Link ke Login jika sudah punya akun */}
          <div className="mt-8 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Sudah punya akun terdaftar?{" "}
              <Link
                href={`/masuk${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                className="text-blue-600 font-bold hover:text-blue-800 hover:underline transition-colors"
              >
                Masuk Sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DaftarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#081220] text-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      }
    >
      <DaftarFormContent />
    </Suspense>
  );
}
