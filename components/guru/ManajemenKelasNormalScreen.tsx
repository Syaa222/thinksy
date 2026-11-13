"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import KelasSoalConfigModal from "@/components/guru/KelasSoalConfigModal";
import MarkdownRenderer from "@/components/materi/MarkdownRenderer";
import {
  GraduationCap,
  Users,
  Search,
  ChevronRight,
  ArrowLeft,
  X,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  AlertTriangle,
  Mail,
  Phone,
  BarChart3,
  Calendar,
  Check,
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  ExternalLink,
  Sliders,
  Filter,
  CheckSquare,
} from "lucide-react";
import { resolveStudentPhoto } from "@/lib/student-settings";

interface ManajemenKelasNormalScreenProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export default function ManajemenKelasNormalScreen({
  isOpen = true,
  onClose,
  isEmbedded = false,
}: ManajemenKelasNormalScreenProps) {
  const router = useRouter();

  // Navigation level: "overview" | "student_detail"
  const [currentLevel, setCurrentLevel] = useState<"overview" | "student_detail">("overview");

  // Tabs in overview: "hasil_siswa" | "kelas_aktif" | "profil_rombel"
  const [activeTab, setActiveTab] = useState<"hasil_siswa" | "kelas_aktif" | "profil_rombel">("hasil_siswa");

  // Selected Student & Selected Exam Detail (Level 2: student_detail)
  const [selectedStudentData, setSelectedStudentData] = useState<any | null>(null);
  const [selectedExamDetail, setSelectedExamDetail] = useState<any | null>(null);

  // Data from API
  const [kelasUtama, setKelasUtama] = useState<any | null>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [mapelAktifList, setMapelAktifList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter in Table
  const [searchTableQuery, setSearchTableQuery] = useState("");
  const [sortBy, setSortBy] = useState<"nilai" | "nama" | "poin" | "progress">("nilai");
  const [mapelSuccessMsg, setMapelSuccessMsg] = useState<string | null>(null);

  // Kelas Soal Config Modal State
  const [isKelasSoalConfigOpen, setIsKelasSoalConfigOpen] = useState(false);
  const [selectedMapelForSoal, setSelectedMapelForSoal] = useState<any | null>(null);

  const fetchManajemenKelasData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/guru/manajemen-kelas");
      if (res.ok) {
        const data = await res.json();
        setKelasUtama(data.kelas_utama || null);
        setAllStudents(data.hasil_keseluruhan_siswa || []);
        setMapelAktifList(data.mapel_aktif || []);
      }
    } catch (err) {
      console.error("Gagal memuat data manajemen kelas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen || isEmbedded) {
      fetchManajemenKelasData();
      setCurrentLevel("overview");
      setSelectedStudentData(null);
      setSelectedExamDetail(null);
    }
  }, [isOpen, isEmbedded]);

  // Real-time listener for student photo changes
  useEffect(() => {
    const handlePhotoSync = () => {
      setAllStudents((prev) =>
        prev.map((st) => ({
          ...st,
          foto: resolveStudentPhoto({ ...st, name: st.nama_lengkap }) || st.foto,
        }))
      );
      setSelectedStudentData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          foto: resolveStudentPhoto({ ...prev, name: prev.nama_lengkap }) || prev.foto,
        };
      });
    };

    window.addEventListener("thinksy_photo_change", handlePhotoSync);
    window.addEventListener("thinksy_profile_change", handlePhotoSync);
    window.addEventListener("thinksy_joined_students_updated", handlePhotoSync);

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === "thinksy_student_photo" ||
        e.key === "thinksy_student_profile" ||
        e.key === "thinksy_student_photos_map" ||
        e.key === "thinksy_joined_students"
      ) {
        handlePhotoSync();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("thinksy_photo_change", handlePhotoSync);
      window.removeEventListener("thinksy_profile_change", handlePhotoSync);
      window.removeEventListener("thinksy_joined_students_updated", handlePhotoSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleToggleMapel = async (mapelId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/guru/kelas-aktif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          id: mapelId,
          is_active: !currentStatus,
        }),
      });

      if (res.ok) {
        // Update local state
        setMapelAktifList((prev) =>
          prev.map((m) => (m.id === mapelId ? { ...m, is_active: !currentStatus } : m))
        );
        setMapelSuccessMsg("Status mata pelajaran berhasil diperbarui.");
        setTimeout(() => setMapelSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error("Gagal mengubah status mapel:", err);
    }
  };


  const handleDeleteMapel = async (mapelId: string, mapelNama: string) => {
    if (!confirm(`Hapus mata pelajaran "${mapelNama}" dari daftar?`)) return;

    try {
      const res = await fetch("/api/guru/kelas-aktif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id: mapelId,
        }),
      });

      if (res.ok) {
        setMapelAktifList((prev) => prev.filter((m) => m.id !== mapelId));
        setMapelSuccessMsg(`Mata pelajaran "${mapelNama}" berhasil dihapus.`);
        setTimeout(() => setMapelSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error("Gagal menghapus mapel:", err);
    }
  };

  const handleSelectStudent = (st: any) => {
    setSelectedStudentData(st);
    if (st.riwayat_ujian && st.riwayat_ujian.length > 0) {
      setSelectedExamDetail(st.riwayat_ujian[0]);
    } else {
      setSelectedExamDetail(null);
    }
    setCurrentLevel("student_detail");
  };

  // Filter and sort students for the large table
  const filteredStudents = allStudents
    .filter((st) => {
      const q = searchTableQuery.toLowerCase();
      return (
        st.nama_lengkap.toLowerCase().includes(q) ||
        (st.nisn && st.nisn.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "nilai") return (b.nilai || 0) - (a.nilai || 0);
      if (sortBy === "poin") return (b.total_poin || 0) - (a.total_poin || 0);
      if (sortBy === "progress") return (b.progress || 0) - (a.progress || 0);
      if (sortBy === "nama") return a.nama_lengkap.localeCompare(b.nama_lengkap);
      return 0;
    });

  if (!isOpen && !isEmbedded) return null;

  return (
    <div
      className={
        isEmbedded
          ? "w-full bg-[#F8FAFC] flex flex-col text-slate-900 rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200"
          : "fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col overflow-hidden text-slate-900 animate-in fade-in duration-200"
      }
    >
      {/* 1. TOP HEADER BAR */}
      <header className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          {currentLevel === "student_detail" && (
            <button
              type="button"
              onClick={() => {
                setCurrentLevel("overview");
                setSelectedStudentData(null);
                setSelectedExamDetail(null);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition cursor-pointer mr-1"
              title="Kembali ke Manajemen Kelas"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-black shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <span
                onClick={() => {
                  setCurrentLevel("overview");
                  setSelectedStudentData(null);
                }}
                className="hover:text-blue-300 transition cursor-pointer"
              >
                Manajemen Siswa
              </span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-white font-extrabold">Data Keseluruhan Siswa</span>
              {selectedStudentData && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span className="text-blue-400 font-extrabold truncate max-w-[160px] sm:max-w-none">
                    {selectedStudentData.nama_lengkap}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-lg font-black text-white tracking-tight mt-0.5">
              {currentLevel === "overview"
                ? "Manajemen Siswa — Hasil Keseluruhan Siswa & Poin"
                : `Hasil Evaluasi & Jawaban Siswa: ${selectedStudentData?.nama_lengkap}`}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchManajemenKelasData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            title="Segarkan Data Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <X className="w-4 h-4" />
              <span>Tutup Layar</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {isLoading && !kelasUtama ? (
            <div className="py-28 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs font-bold">Memuat data asli Supabase...</span>
            </div>
          ) : currentLevel === "overview" ? (
            <>
              {/* SUCCESS NOTIFICATION */}
              {mapelSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{mapelSuccessMsg}</span>
                  </div>
                  <button
                    onClick={() => setMapelSuccessMsg(null)}
                    className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* CLASS SUMMARY BANNER (SINGLE KELAS 8) */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    <Check className="w-3 h-3 text-blue-600" />
                    <span>KELAS UTAMA ROMBEL AKTIF • TA 2026/2027</span>
                  </div>
                  <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">
                    Kelas 8 — SMK Muhammadiyah 1
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Wali Kelas: <strong className="text-slate-700">{kelasUtama?.wali_kelas?.nama || "Ibu Siti Rahmawati, M.Pd."}</strong> • {kelasUtama?.wali_kelas?.mapel || "Matematika"} (NIP. {kelasUtama?.wali_kelas?.nip || "19880415 201001 2 012"})
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[110px]">
                    <div className="text-xl font-black text-[#0F172A]">
                      {allStudents.length} Siswa
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">Terdaftar Aktif</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[110px]">
                    <div className="text-xl font-black text-emerald-700">
                      {kelasUtama?.rata_rata_kehadiran || "97.5%"}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">Presensi Kelas</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[110px]">
                    <div className="text-xl font-black text-blue-600">
                      {kelasUtama?.rata_rata_nilai || 83}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">Rata-rata Nilai</div>
                  </div>
                </div>
              </div>

              {/* HEADER: HASIL KESELURUHAN SISWA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1967D2] flex items-center justify-center font-bold">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0F172A]">
                      Hasil Keseluruhan Siswa & Ketuntasan Akademik
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Menampilkan data seluruh siswa, ketuntasan bab, skor latihan, kuis, dan nilai rata-rata akademik terintegrasi Supabase.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-[#1967D2] border border-blue-200/80">
                    {allStudents.length} Siswa Terdaftar
                  </span>
                </div>
              </div>

              {/* TAB CONTENT: HASIL KESELURUHAN SISWA (TABEL BESAR) */}
              <div className="space-y-4">
                  {/* Table Control Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTableQuery}
                        onChange={(e) => setSearchTableQuery(e.target.value)}
                        placeholder="Cari nama siswa atau NISN..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <span className="text-[11px] font-bold text-slate-500">Urutkan:</span>
                      <select
                        value={sortBy}
                        onChange={(e: any) => setSortBy(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F172A] cursor-pointer"
                      >
                        <option value="nilai">Rata-rata Nilai Tertinggi</option>
                        <option value="poin">Total Skor Tertinggi</option>
                        <option value="progress">Ketuntasan Belajar Tertinggi</option>
                        <option value="nama">Nama (A - Z)</option>
                      </select>
                    </div>
                  </div>

                  {/* Big Responsive Normal-Screen Data Table */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                            <th className="py-3.5 px-4 text-center">No</th>
                            <th className="py-3.5 px-4">Nama Siswa</th>
                            <th className="py-3.5 px-3">NISN</th>
                            <th className="py-3.5 px-3 text-center">Kelas</th>
                            <th className="py-3.5 px-3 text-center">Presensi</th>
                            <th className="py-3.5 px-3 text-center">Poin Kuis</th>
                            <th className="py-3.5 px-3 text-center">Latihan Bab</th>
                            <th className="py-3.5 px-3 text-center">Total Skor</th>
                            <th className="py-3.5 px-3 text-center">Nilai Rata-rata</th>
                            <th className="py-3.5 px-3 text-center">Ketuntasan</th>
                            <th className="py-3.5 px-4 text-center">Aktivitas Terakhir</th>
                            <th className="py-3.5 px-4 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                          {filteredStudents.length === 0 ? (
                            <tr>
                              <td colSpan={12} className="py-12 text-center text-slate-400 font-bold">
                                Tidak ada data siswa yang cocok dengan pencarian &quot;{searchTableQuery}&quot;.
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map((st, idx) => {
                              const scoreColor =
                                st.nilai >= 85
                                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                  : st.nilai >= 75
                                  ? "text-blue-700 bg-blue-50 border-blue-200"
                                  : "text-amber-700 bg-amber-50 border-amber-200";

                              return (
                                <tr
                                  key={st.id || idx}
                                  className="hover:bg-slate-50/80 transition-colors"
                                >
                                  <td className="py-3 px-4 text-center text-slate-400 font-bold">
                                    {idx + 1}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 relative border border-slate-200">
                                        <Image
                                          src={resolveStudentPhoto({ ...st, name: st.nama_lengkap }) || st.foto || "/images/pasfoto-siswa-1.jpg"}
                                          alt={st.nama_lengkap}
                                          fill
                                          className="object-cover"
                                          unoptimized
                                        />
                                      </div>
                                      <span className="font-bold text-slate-900 hover:text-blue-600 transition truncate max-w-[150px]">
                                        {st.nama_lengkap}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                                    {st.nisn}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                                      {st.kelas}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center text-slate-700 font-semibold">
                                    {st.poin_absensi}
                                  </td>
                                  <td className="py-3 px-3 text-center text-slate-700 font-semibold">
                                    {st.poin_kuis}
                                  </td>
                                  <td className="py-3 px-3 text-center text-slate-700 font-semibold">
                                    {st.poin_ulangan || st.poin_ujian || 0}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                                      {st.total_poin}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-md font-black border text-[11px] ${scoreColor}`}
                                    >
                                      {st.nilai}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <div className="w-12 h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                          className="h-full bg-blue-600 rounded-full"
                                          style={{ width: `${Math.min(100, st.progress)}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-500">
                                        {st.progress}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center text-[10px] text-slate-500">
                                    {st.status_keaktifan}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleSelectStudent(st)}
                                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0F172A] hover:text-white text-slate-700 text-[11px] font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Jawaban</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : currentLevel === "student_detail" && selectedStudentData ? (
            /* ======================================================== */
            /* VIEW: DETAIL HASIL UJIAN & LEMBAR JAWABAN SISWA          */
            /* ======================================================== */
            <div className="space-y-6">
              {/* Student Overview Header Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <Image
                      src={resolveStudentPhoto({ ...selectedStudentData, name: selectedStudentData.nama_lengkap }) || selectedStudentData.foto || "/images/pasfoto-siswa-1.jpg"}
                      alt={selectedStudentData.nama_lengkap}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {selectedStudentData.kelas}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        NISN {selectedStudentData.nisn}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-[#0F172A] mt-0.5">
                      {selectedStudentData.nama_lengkap}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Total Skor: <strong className="text-slate-800">{selectedStudentData.total_poin}</strong> • Presensi: <strong className="text-emerald-700">{selectedStudentData.poin_absensi || 100}%</strong> • Ketuntasan Belajar: <strong className="text-blue-600">{selectedStudentData.progress || 0}%</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentLevel("overview");
                      setSelectedStudentData(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Tabel Siswa</span>
                  </button>
                </div>
              </div>

              {/* Exam Sessions Picker */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">
                  Riwayat Evaluasi & Lembar Ujian Siswa ({selectedStudentData.riwayat_ujian?.length || 0})
                </h3>

                {(!selectedStudentData.riwayat_ujian || selectedStudentData.riwayat_ujian.length === 0) ? (
                  <div className="p-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl">
                    Siswa ini belum memiliki riwayat pengerjaan ujian tercatat di database.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {selectedStudentData.riwayat_ujian.map((ex: any, eIdx: number) => {
                      const isChosen = selectedExamDetail?.sesi_id === ex.sesi_id;
                      return (
                        <div
                          key={ex.sesi_id || eIdx}
                          onClick={() => setSelectedExamDetail(ex)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            isChosen
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                              : "bg-slate-50 hover:bg-white text-slate-800 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold opacity-75">
                            <span>{ex.mapel}</span>
                            <span className="uppercase">{ex.tipe}</span>
                          </div>
                          <h4 className="text-xs font-black mt-1 truncate">{ex.judul}</h4>
                          <div className="mt-2 flex items-center justify-between text-xs font-bold">
                            <span>Nilai Akhir:</span>
                            <span className={isChosen ? "text-emerald-300 font-black text-sm" : "text-emerald-600 font-black text-sm"}>
                              {ex.nilai}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Exam Answer Sheet Details */}
              {selectedExamDetail && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        LEMBAR JAWABAN RESMI
                      </span>
                      <h3 className="text-lg font-black text-[#0F172A] mt-1">
                        {selectedExamDetail.judul}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Mata Pelajaran: {selectedExamDetail.mapel} • Passing Grade: {selectedExamDetail.passing_grade}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-600">
                        {selectedExamDetail.nilai}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold">Nilai Perolehan</div>
                    </div>
                  </div>

                  {/* Question items */}
                  {(!selectedExamDetail.lembar_jawaban || selectedExamDetail.lembar_jawaban.length === 0) ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl">
                      Detail butir soal untuk sesi ini telah terekam dengan nilai akhir {selectedExamDetail.nilai}.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedExamDetail.lembar_jawaban.map((q: any) => (
                        <div
                          key={q.nomor}
                          className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-bold text-xs text-slate-800 flex-1">
                              <span className="font-black mr-1.5 text-blue-600">Nomor {q.nomor}.</span>
                              <MarkdownRenderer content={q.pertanyaan} isCompact className="inline-block" />
                            </div>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                                q.is_benar
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {q.is_benar ? "Benar (+10)" : "Salah (0)"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-white border border-slate-200">
                              <span className="text-[10px] text-slate-400 font-bold block">
                                Jawaban Siswa:
                              </span>
                              <span className="font-extrabold text-slate-800">
                                Pilihan {q.jawaban_siswa}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-white border border-slate-200">
                              <span className="text-[10px] text-slate-400 font-bold block">
                                Kunci Jawaban:
                              </span>
                              <span className="font-extrabold text-emerald-700">
                                Pilihan {q.kunci_jawaban}
                              </span>
                            </div>
                          </div>

                          {q.pembahasan && (
                            <div className="p-3 rounded-xl bg-blue-50/70 text-blue-900 text-xs font-medium space-y-1">
                              <strong className="block font-bold text-blue-950">Pembahasan:</strong>
                              <MarkdownRenderer content={q.pembahasan} isCompact />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>



      {/* MODAL SETTING SOAL KELAS AKTIF */}
      {isKelasSoalConfigOpen && selectedMapelForSoal && (
        <KelasSoalConfigModal
          isOpen={isKelasSoalConfigOpen}
          onClose={() => {
            setIsKelasSoalConfigOpen(false);
            setSelectedMapelForSoal(null);
          }}
          kelasId={selectedMapelForSoal.id || "8a"}
          kelasName={selectedMapelForSoal.kode_mapel || "8A"}
          kelasTitle={selectedMapelForSoal.nama_mapel}
          mapel={selectedMapelForSoal.nama_mapel}
          onUpdated={() => {
            fetchManajemenKelasData();
          }}
        />
      )}
    </div>
  );
}
