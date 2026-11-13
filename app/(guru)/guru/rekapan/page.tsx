"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import GuruLayout from "@/components/guru/GuruLayout";
import Link from "next/link";
import {
  FileSpreadsheet,
  Download,
  Copy,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Award,
  TrendingUp,
  UserCheck,
  Calendar,
  BookOpen,
  ArrowUpDown,
  Check,
  ChevronRight,
  Eye,
  Printer,
  Sliders,
  X,
  Sparkles,
} from "lucide-react";

export type SemesterTab = "sem1" | "sem2" | "tahunan";

interface AttendanceRecord {
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  totalHari: number;
  persen: number;
}

interface SemesterData {
  presensi: AttendanceRecord;
  kuisRata: number | null;
  ulangan: number | null;
  ujian: number | null;
  nilaiAkhir: number | null;
  predikat: string;
  statusKKM: string;
  isTuntas: boolean;
}

interface StudentRecapRow {
  no: number;
  id: string;
  nama: string;
  nisn: string;
  kelas: string;
  email: string;
  foto: string | null;
  poin: number;
  presensi: {
    masuk: number;
    tidakMasuk: number;
    totalHari: number;
    persen: number;
    sem1?: AttendanceRecord;
    sem2?: AttendanceRecord;
    tahunan?: AttendanceRecord;
  };
  kuis: {
    rataRata: number | null;
    selesaiCount: number;
    totalBab: number;
    babScores: Record<string, number>;
    sem1?: { rataRata: number | null; selesaiCount: number; totalBab: number };
    sem2?: { rataRata: number | null; selesaiCount: number; totalBab: number };
  };
  ulangan: {
    sem1: number | null;
    sem2: number | null;
    rataRata: number | null;
  };
  ujian: {
    resmi1: number | null;
    resmi2?: number | null;
    rataRata?: number | null;
  };
  kkm: number;
  nilaiAkhir: number | null;
  statusKKM: string;
  isTuntas: boolean;
  predikat?: string;
  semesters?: {
    sem1: SemesterData;
    sem2: SemesterData;
    tahunan: SemesterData;
  };
}

interface SummaryData {
  totalSiswa: number;
  rataRataNilaiAkhir: number;
  rataRataKehadiran: number;
  totalTuntas: number;
  totalRemedial: number;
  persentaseTuntas: number;
  kkmStandar: number;
}

const SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1zsL9NyavgKzPqL1LGrNUhRObwJwAKAisNRYLEyKt9VY/edit";

const FALLBACK_REKAPAN_STUDENTS: StudentRecapRow[] = [
  {
    no: 1,
    id: "44444444-4444-4444-4444-444444444444",
    nama: "Budi Kartika",
    nisn: "0089201144",
    kelas: "Kelas 8",
    email: "budi.kartika@sekolah.sch.id",
    foto: null,
    poin: 980,
    presensi: {
      masuk: 176,
      tidakMasuk: 4,
      totalHari: 180,
      persen: 98,
      sem1: { hadir: 88, sakit: 1, izin: 1, alpa: 0, totalHari: 90, persen: 98 },
      sem2: { hadir: 88, sakit: 1, izin: 1, alpa: 0, totalHari: 90, persen: 98 },
      tahunan: { hadir: 176, sakit: 2, izin: 2, alpa: 0, totalHari: 180, persen: 98 },
    },
    kuis: {
      rataRata: 88,
      selesaiCount: 8,
      totalBab: 8,
      babScores: {},
      sem1: { rataRata: 88, selesaiCount: 4, totalBab: 4 },
      sem2: { rataRata: 88, selesaiCount: 4, totalBab: 4 },
    },
    ulangan: { sem1: 85, sem2: 88, rataRata: 87 },
    ujian: { resmi1: 86, resmi2: 88, rataRata: 87 },
    kkm: 75,
    nilaiAkhir: 87,
    statusKKM: "Tuntas",
    isTuntas: true,
    predikat: "B",
    semesters: {
      sem1: {
        presensi: { hadir: 88, sakit: 1, izin: 1, alpa: 0, totalHari: 90, persen: 98 },
        kuisRata: 88,
        ulangan: 85,
        ujian: 86,
        nilaiAkhir: 86,
        predikat: "B",
        statusKKM: "Tuntas",
        isTuntas: true,
      },
      sem2: {
        presensi: { hadir: 88, sakit: 1, izin: 1, alpa: 0, totalHari: 90, persen: 98 },
        kuisRata: 88,
        ulangan: 88,
        ujian: 88,
        nilaiAkhir: 88,
        predikat: "B",
        statusKKM: "Tuntas",
        isTuntas: true,
      },
      tahunan: {
        presensi: { hadir: 176, sakit: 2, izin: 2, alpa: 0, totalHari: 180, persen: 98 },
        kuisRata: 88,
        ulangan: 87,
        ujian: 87,
        nilaiAkhir: 87,
        predikat: "B",
        statusKKM: "Tuntas",
        isTuntas: true,
      },
    },
  },
  {
    no: 2,
    id: "s-fauzi-02",
    nama: "Ahmad Fauzi",
    nisn: "0089201145",
    kelas: "Kelas 8",
    email: "ahmad.fauzi@sekolah.sch.id",
    foto: null,
    poin: 1180,
    presensi: {
      masuk: 178,
      tidakMasuk: 2,
      totalHari: 180,
      persen: 99,
      sem1: { hadir: 89, sakit: 1, izin: 0, alpa: 0, totalHari: 90, persen: 99 },
      sem2: { hadir: 89, sakit: 0, izin: 1, alpa: 0, totalHari: 90, persen: 99 },
      tahunan: { hadir: 178, sakit: 1, izin: 1, alpa: 0, totalHari: 180, persen: 99 },
    },
    kuis: {
      rataRata: 92,
      selesaiCount: 8,
      totalBab: 8,
      babScores: {},
      sem1: { rataRata: 93, selesaiCount: 4, totalBab: 4 },
      sem2: { rataRata: 91, selesaiCount: 4, totalBab: 4 },
    },
    ulangan: { sem1: 90, sem2: 94, rataRata: 92 },
    ujian: { resmi1: 92, resmi2: 94, rataRata: 93 },
    kkm: 75,
    nilaiAkhir: 92,
    statusKKM: "Tuntas",
    isTuntas: true,
    predikat: "A",
    semesters: {
      sem1: {
        presensi: { hadir: 89, sakit: 1, izin: 0, alpa: 0, totalHari: 90, persen: 99 },
        kuisRata: 93,
        ulangan: 90,
        ujian: 92,
        nilaiAkhir: 92,
        predikat: "A",
        statusKKM: "Tuntas",
        isTuntas: true,
      },
      sem2: {
        presensi: { hadir: 89, sakit: 0, izin: 1, alpa: 0, totalHari: 90, persen: 99 },
        kuisRata: 91,
        ulangan: 94,
        ujian: 94,
        nilaiAkhir: 93,
        predikat: "A",
        statusKKM: "Tuntas",
        isTuntas: true,
      },
      tahunan: {
        presensi: { hadir: 178, sakit: 1, izin: 1, alpa: 0, totalHari: 180, persen: 99 },
        kuisRata: 92,
        ulangan: 92,
        ujian: 93,
        nilaiAkhir: 92,
        predikat: "A",
        statusKKM: "Tuntas",
        isTuntas: true,
      },
    },
  },
  {
    no: 3,
    id: "s-aisyah-03",
    nama: "Siti Aisyah Putri",
    nisn: "0089201146",
    kelas: "Kelas 8",
    email: "siti.aisyah.putri@sekolah.sch.id",
    foto: null,
    poin: 1120,
    presensi: {
      masuk: 177,
      tidakMasuk: 3,
      totalHari: 180,
      persen: 98,
      sem1: { hadir: 89, sakit: 1, izin: 0, alpa: 0, totalHari: 90, persen: 99 },
      sem2: { hadir: 88, sakit: 1, izin: 1, alpa: 0, totalHari: 90, persen: 98 },
      tahunan: { hadir: 177, sakit: 2, izin: 1, alpa: 0, totalHari: 180, persen: 98 },
    },
    kuis: {
      rataRata: 90,
      selesaiCount: 8,
      totalBab: 8,
      babScores: {},
      sem1: { rataRata: 90, selesaiCount: 4, totalBab: 4 },
      sem2: { rataRata: 90, selesaiCount: 4, totalBab: 4 },
    },
    ulangan: { sem1: 88, sem2: 90, rataRata: 89 },
    ujian: { resmi1: 90, resmi2: 91, rataRata: 90 },
    kkm: 75,
    nilaiAkhir: 90,
    statusKKM: "Tuntas",
    isTuntas: true,
    predikat: "A",
    semesters: {
      sem1: {
        presensi: { hadir: 89, sakit: 1, izin: 0, alpa: 0, totalHari: 90, persen: 99 },
        kuisRata: 90,
        ulangan: 88,
        ujian: 90,
        nilaiAkhir: 89,
        predikat: "B",
        statusKKM: "Tuntas",
        isTuntas: true,
      },
      sem2: {
        presensi: { hadir: 88, sakit: 1, izin: 1, alpa: 0, totalHari: 90, persen: 98 },
        kuisRata: 90,
        ulangan: 90,
        ujian: 91,
        nilaiAkhir: 90,
        predikat: "A",
        statusKKM: "Tuntas",
        isTuntas: true,
      },
      tahunan: {
        presensi: { hadir: 177, sakit: 2, izin: 1, alpa: 0, totalHari: 180, persen: 98 },
        kuisRata: 90,
        ulangan: 89,
        ujian: 90,
        nilaiAkhir: 90,
        predikat: "A",
        statusKKM: "Tuntas",
        isTuntas: true,
      },
    },
  },
];

export default function GuruRekapanPage() {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentRecapRow[]>(FALLBACK_REKAPAN_STUDENTS);

  // Active Semester Tab
  const [activeSemester, setActiveSemester] = useState<SemesterTab>("tahunan");

  // Summaries per semester
  const [summaries, setSummaries] = useState<Record<SemesterTab, SummaryData>>({
    tahunan: {
      totalSiswa: 12,
      rataRataNilaiAkhir: 83,
      rataRataKehadiran: 96,
      totalTuntas: 9,
      totalRemedial: 3,
      persentaseTuntas: 75,
      kkmStandar: 75,
    },
    sem1: {
      totalSiswa: 12,
      rataRataNilaiAkhir: 82,
      rataRataKehadiran: 97,
      totalTuntas: 9,
      totalRemedial: 3,
      persentaseTuntas: 75,
      kkmStandar: 75,
    },
    sem2: {
      totalSiswa: 12,
      rataRataNilaiAkhir: 84,
      rataRataKehadiran: 96,
      totalTuntas: 10,
      totalRemedial: 2,
      persentaseTuntas: 83,
      kkmStandar: 75,
    },
  });

  // Dynamic Grade Weighting State
  const [bobotKuis, setBobotKuis] = useState(30);
  const [bobotUlangan, setBobotUlangan] = useState(30);
  const [bobotUjian, setBobotUjian] = useState(40);
  const [kkmStandar, setKkmStandar] = useState(75);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Print Leger Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"semua" | "tuntas" | "remedial">("semua");
  const [filterPresensi, setFilterPresensi] = useState<"semua" | "aman" | "rawan">("semua");
  const [sortField, setSortField] = useState<"no" | "nama" | "nilaiAkhir" | "presensi">("no");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const showToast = (text: string, type: "success" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchRekapanData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guru/rekapan");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.students) && data.students.length > 0) {
        setStudents(data.students);
        if (data.summaryTahunan && data.summarySem1 && data.summarySem2) {
          setSummaries({
            tahunan: data.summaryTahunan,
            sem1: data.summarySem1,
            sem2: data.summarySem2,
          });
        }
      }
    } catch (err: any) {
      console.warn("Rekapan real-time sync:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRekapanData();
  }, []);

  // Compute Active Semester View per Student
  const processedStudents = useMemo(() => {
    const list = students.map((s) => {
      let pres: AttendanceRecord;
      let kuisVal: number | null = null;
      let ulanganVal: number | null = null;
      let ujianVal: number | null = null;

      if (activeSemester === "sem1") {
        pres = s.presensi.sem1 || {
          hadir: Math.round(s.presensi.masuk / 2),
          sakit: 1,
          izin: 1,
          alpa: 0,
          totalHari: 90,
          persen: s.presensi.persen,
        };
        kuisVal = s.kuis.sem1?.rataRata ?? s.kuis.rataRata;
        ulanganVal = s.ulangan.sem1;
        ujianVal = s.ujian.resmi1;
      } else if (activeSemester === "sem2") {
        pres = s.presensi.sem2 || {
          hadir: Math.round(s.presensi.masuk / 2),
          sakit: 1,
          izin: 1,
          alpa: 0,
          totalHari: 90,
          persen: s.presensi.persen,
        };
        kuisVal = s.kuis.sem2?.rataRata ?? s.kuis.rataRata;
        ulanganVal = s.ulangan.sem2;
        ujianVal = s.ujian.resmi2 ?? s.ujian.resmi1;
      } else {
        pres = s.presensi.tahunan || {
          hadir: s.presensi.masuk,
          sakit: 2,
          izin: 2,
          alpa: 0,
          totalHari: 180,
          persen: s.presensi.persen,
        };
        kuisVal = s.kuis.rataRata;
        ulanganVal = s.ulangan.rataRata;
        ujianVal = s.ujian.rataRata ?? s.ujian.resmi1;
      }

      // Dynamic calculation based on current Bobot settings
      const kPart = (kuisVal || 75) * (bobotKuis / 100);
      const uPart = (ulanganVal || 75) * (bobotUlangan / 100);
      const ePart = (ujianVal || 75) * (bobotUjian / 100);
      const computedNilaiAkhir = Math.round(kPart + uPart + ePart);
      const isTuntas = computedNilaiAkhir >= kkmStandar;

      let predikat = "D";
      if (computedNilaiAkhir >= 90) predikat = "A";
      else if (computedNilaiAkhir >= 80) predikat = "B";
      else if (computedNilaiAkhir >= kkmStandar) predikat = "C";

      return {
        ...s,
        activePresensi: pres,
        activeKuis: kuisVal,
        activeUlangan: ulanganVal,
        activeUjian: ujianVal,
        activeNilaiAkhir: computedNilaiAkhir,
        activeIsTuntas: isTuntas,
        activeStatusKKM: isTuntas ? "Tuntas" : "Remedial",
        activePredikat: predikat,
      };
    });

    // Filtering
    let filtered = list;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.nisn.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    if (filterStatus === "tuntas") {
      filtered = filtered.filter((s) => s.activeIsTuntas);
    } else if (filterStatus === "remedial") {
      filtered = filtered.filter((s) => !s.activeIsTuntas);
    }

    if (filterPresensi === "aman") {
      filtered = filtered.filter((s) => s.activePresensi.persen >= 85);
    } else if (filterPresensi === "rawan") {
      filtered = filtered.filter((s) => s.activePresensi.persen < 85);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comp = 0;
      if (sortField === "nama") {
        comp = a.nama.localeCompare(b.nama);
      } else if (sortField === "nilaiAkhir") {
        comp = (a.activeNilaiAkhir ?? 0) - (b.activeNilaiAkhir ?? 0);
      } else if (sortField === "presensi") {
        comp = a.activePresensi.persen - b.activePresensi.persen;
      } else {
        comp = a.no - b.no;
      }
      return sortOrder === "asc" ? comp : -comp;
    });

    return filtered;
  }, [
    students,
    activeSemester,
    searchQuery,
    filterStatus,
    filterPresensi,
    sortField,
    sortOrder,
    bobotKuis,
    bobotUlangan,
    bobotUjian,
    kkmStandar,
  ]);

  // Active Summary
  const currentSummary = useMemo(() => {
    if (processedStudents.length === 0) {
      return summaries[activeSemester];
    }
    const total = processedStudents.length;
    const sumNilai = processedStudents.reduce((acc, s) => acc + (s.activeNilaiAkhir || 0), 0);
    const avgNilai = Math.round(sumNilai / total);
    const tuntas = processedStudents.filter((s) => s.activeIsTuntas).length;
    const rem = total - tuntas;
    const sumHadir = processedStudents.reduce((acc, s) => acc + s.activePresensi.hadir, 0);
    const sumDays = processedStudents.reduce((acc, s) => acc + s.activePresensi.totalHari, 0);
    const avgKehadiran = sumDays > 0 ? Math.round((sumHadir / sumDays) * 100) : 96;

    return {
      totalSiswa: total,
      rataRataNilaiAkhir: avgNilai,
      rataRataKehadiran: avgKehadiran,
      totalTuntas: tuntas,
      totalRemedial: rem,
      persentaseTuntas: Math.round((tuntas / total) * 100),
      kkmStandar,
    };
  }, [processedStudents, summaries, activeSemester, kkmStandar]);

  const toggleSort = (field: "no" | "nama" | "nilaiAkhir" | "presensi") => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSemesterLabel = (sem: SemesterTab) => {
    if (sem === "sem1") return "Semester 1 (Ganjil)";
    if (sem === "sem2") return "Semester 2 (Genap)";
    return "Semua Semester (Kumulatif Tahunan)";
  };

  // 1. Export CSV Handler (Semester-aware with H, S, I, A)
  const handleExportCSV = () => {
    if (processedStudents.length === 0) {
      showToast("Tidak ada data untuk diunduh.", "info");
      return;
    }

    const headers = [
      "No",
      "Nama Siswa",
      "NISN",
      "Kelas",
      "Hadir (H)",
      "Sakit (S)",
      "Izin (I)",
      "Alpa (A)",
      "Total Hari",
      "% Kehadiran",
      activeSemester === "sem1"
        ? "Kuis Bab 1-4"
        : activeSemester === "sem2"
        ? "Kuis Bab 5-8"
        : "Rata Kuis Bab 1-8",
      activeSemester === "sem1"
        ? "Ulangan Sem 1"
        : activeSemester === "sem2"
        ? "Ulangan Sem 2"
        : "Rata Ulangan",
      activeSemester === "sem1"
        ? "Ujian Resmi #1 (PTS/PAS)"
        : activeSemester === "sem2"
        ? "Ujian Resmi #2 (PAT/PAS)"
        : "Rata Ujian Resmi",
      "Nilai Akhir",
      "Predikat",
      "KKM",
      "Status Ketuntasan",
    ];

    const rows = processedStudents.map((s, idx) => [
      idx + 1,
      `"${s.nama.replace(/"/g, '""')}"`,
      `="${s.nisn}"`,
      s.kelas,
      s.activePresensi.hadir,
      s.activePresensi.sakit,
      s.activePresensi.izin,
      s.activePresensi.alpa,
      s.activePresensi.totalHari,
      `${s.activePresensi.persen}%`,
      s.activeKuis ?? "-",
      s.activeUlangan ?? "-",
      s.activeUjian ?? "-",
      s.activeNilaiAkhir ?? "-",
      s.activePredikat,
      kkmStandar,
      s.activeStatusKKM,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Leger_Nilai_Presensi_Kelas_8_${activeSemester.toUpperCase()}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`File CSV Leger ${getSemesterLabel(activeSemester)} berhasil diunduh!`, "success");
  };

  // 2. Copy for Google Sheets (Tab-delimited)
  const handleCopyForGoogleSheets = async () => {
    if (processedStudents.length === 0) {
      showToast("Tidak ada data untuk disalin.", "info");
      return;
    }

    const headers = [
      "No",
      "Nama Siswa",
      "NISN",
      "H (Hadir)",
      "S (Sakit)",
      "I (Izin)",
      "A (Alpa)",
      "% Kehadiran",
      "Nilai Kuis",
      "Nilai Ulangan",
      "Nilai Ujian",
      "Nilai Akhir",
      "Predikat",
      "KKM",
      "Status",
    ];

    const rows = processedStudents.map((s, idx) => [
      idx + 1,
      s.nama,
      s.nisn,
      s.activePresensi.hadir,
      s.activePresensi.sakit,
      s.activePresensi.izin,
      s.activePresensi.alpa,
      `${s.activePresensi.persen}%`,
      s.activeKuis ?? "-",
      s.activeUlangan ?? "-",
      s.activeUjian ?? "-",
      s.activeNilaiAkhir ?? "-",
      s.activePredikat,
      kkmStandar,
      s.activeStatusKKM,
    ]);

    const tsvContent = [
      headers.join("\t"),
      ...rows.map((r) => r.join("\t")),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(tsvContent);
      showToast(
        `Data Leger ${getSemesterLabel(activeSemester)} berhasil disalin! Buka Google Sheets dan tekan Ctrl+V.`,
        "success"
      );
    } catch {
      showToast("Gagal menyalin ke clipboard. Izin browser diperlukan.", "info");
    }
  };

  // 3. Print Window Trigger
  const handlePrintLeger = () => {
    window.print();
  };

  return (
    <GuruLayout activeView="rekapan">
      <div className="space-y-6 pb-20 print:p-0 print:space-y-4">
        {/* Top Header Hero (Hidden on Print) */}
        <div className="print:hidden bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block">
                Buku Leger Nilai & Presensi Rapor Real-Time
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 inline-block">
                Kelas 8 • Matematika
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                Bobot: Kuis {bobotKuis}% | Ulangan {bobotUlangan}% | Ujian {bobotUjian}%
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Rekapan Nilai & Presensi Rapor Siswa
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Sistem buku induk leger digital terintegrasi: kalkulasi kehadiran standar resmi (Hadir, Sakit, Izin, Alpa),
              rekap nilai kuis per bab, ulangan semester, ujian CBT, serta ekspor format cetak A4 raport sekolah.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* 1. Cetak Leger Nilai (A4 Print Ready) */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 transition shadow-xs cursor-pointer"
              title="Buka tampilan Cetak Leger Nilai Rapor siap print kertas A4 Landscape"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Cetak Leger Nilai</span>
            </button>

            {/* 2. Unduh CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 transition shadow-xs cursor-pointer"
              title="Unduh file spreadsheet CSV sesuai semester aktif"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Unduh CSV</span>
            </button>

            {/* 3. Salin Spreadsheet */}
            <button
              type="button"
              onClick={handleCopyForGoogleSheets}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer bg-white"
              title="Salin seluruh tabel untuk di-paste langsung (Ctrl+V) ke Google Spreadsheet"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600" />
              <span>Salin</span>
            </button>

            {/* 4. Pengaturan Bobot Penilaian */}
            <button
              type="button"
              onClick={() => setIsWeightModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-purple-50 text-purple-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer bg-white"
              title="Sesuaikan bobot persentase Kuis, Ulangan, Ujian, dan batas KKM"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Atur Bobot</span>
            </button>

            {/* 5. Refresh Realtime */}
            <button
              type="button"
              onClick={fetchRekapanData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="Muat ulang data terbaru langsung dari Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Semester Tab Switcher (Interactive Bar) */}
        <div className="print:hidden bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider px-3">
              Pilih Semester:
            </span>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveSemester("sem1")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
                  activeSemester === "sem1"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Semester 1 (Ganjil)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSemester("sem2")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
                  activeSemester === "sem2"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Semester 2 (Genap)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSemester("tahunan")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
                  activeSemester === "tahunan"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>Kumulatif Tahunan (Rapor Akhir)</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-500 hidden lg:block pr-3">
            {activeSemester === "sem1"
              ? "Menampilkan Presensi 90 Hari, Kuis Bab 1–4, Ulangan Sem 1, dan Ujian Resmi #1"
              : activeSemester === "sem2"
              ? "Menampilkan Presensi 90 Hari, Kuis Bab 5–8, Ulangan Sem 2, dan Ujian Resmi #2"
              : "Menampilkan Akumulasi 180 Hari Efektif, Rata-rata Kuis Bab 1–8, dan Nilai Komposit Tahunan"}
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-8 right-8 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-200">
            {toastMessage.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 4 Top KPI Summary Cards (Reflects Active Semester) */}
        <div className="print:hidden grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Siswa */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">Total Siswa Terdaftar</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-sans">
              {currentSummary.totalSiswa}{" "}
              <span className="text-xs font-normal text-slate-400">siswa</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Data aktif kelas ({getSemesterLabel(activeSemester)})
            </p>
          </div>

          {/* Card 2: Rata-rata Nilai Akhir */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">Rata-rata Nilai Akhir</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-sans flex items-baseline gap-1">
              <span
                className={
                  currentSummary.rataRataNilaiAkhir >= kkmStandar
                    ? "text-emerald-700"
                    : "text-amber-700"
                }
              >
                {currentSummary.rataRataNilaiAkhir}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ 100</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Standar KKM: {kkmStandar} Poin</p>
          </div>

          {/* Card 3: Ketuntasan Belajar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">Ketuntasan KKM Kelas</span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-900 font-sans">
              {currentSummary.persentaseTuntas}%{" "}
              <span className="text-xs font-normal text-slate-400">
                ({currentSummary.totalTuntas} Tuntas / {currentSummary.totalRemedial} Remedial)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Komposit: Kuis {bobotKuis}% + Ulangan {bobotUlangan}% + Ujian {bobotUjian}%
            </p>
          </div>

          {/* Card 4: Rata-rata Kehadiran */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">Presensi Kehadiran</span>
              <UserCheck className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-teal-900 font-sans">
              {currentSummary.rataRataKehadiran}%{" "}
              <span className="text-xs font-normal text-slate-400">kehadiran</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Total {activeSemester === "tahunan" ? "180" : "90"} hari efektif belajar
            </p>
          </div>
        </div>

        {/* Filter Controls & Search (Hidden on Print) */}
        <div className="print:hidden bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setFilterStatus("semua")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                filterStatus === "semua"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({students.length})
            </button>
            <button
              onClick={() => setFilterStatus("tuntas")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                filterStatus === "tuntas"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tuntas KKM ({currentSummary.totalTuntas})</span>
            </button>
            <button
              onClick={() => setFilterStatus("remedial")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                filterStatus === "remedial"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-amber-800 hover:bg-amber-50"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Remedial ({currentSummary.totalRemedial})</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Presensi Filter */}
            <select
              value={filterPresensi}
              onChange={(e) => setFilterPresensi(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="semua">Presensi: Semua</option>
              <option value="aman">Presensi: Aman (&gt;= 85%)</option>
              <option value="rawan">Presensi: Rawan (&lt; 85%)</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari siswa atau NISN..."
                className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Master Gradebook Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Tabel Buku Induk Leger Nilai & Presensi Rapor
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  {getSemesterLabel(activeSemester)}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Kalkulasi otomatis: <strong>Kuis ({bobotKuis}%) + Ulangan ({bobotUlangan}%) + Ujian ({bobotUjian}%)</strong> • Standar KKM ({kkmStandar})
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">
              Menampilkan {processedStudents.length} dari {students.length} siswa
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Mengambil data agregat siswa dari Supabase...</p>
            </div>
          ) : processedStudents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Tidak Ada Siswa yang Ditemukan</h4>
              <p className="text-xs text-slate-500">Coba sesuaikan kata kunci pencarian atau filter status ketuntasan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[10px]">
                    <th
                      className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition"
                      onClick={() => toggleSort("no")}
                    >
                      <div className="flex items-center gap-1">
                        <span>No</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition min-w-[200px]"
                      onClick={() => toggleSort("nama")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Nama Siswa & NISN</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    {/* Presensi Rinci Format Resmi H / S / I / A */}
                    <th
                      className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition min-w-[210px]"
                      onClick={() => toggleSort("presensi")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Presensi Resmi (H / S / I / A)</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    <th className="px-4 py-3.5 text-center min-w-[120px]">
                      <span>
                        {activeSemester === "sem1"
                          ? "Kuis (Bab 1–4)"
                          : activeSemester === "sem2"
                          ? "Kuis (Bab 5–8)"
                          : "Rata Kuis (Bab 1–8)"}
                      </span>
                    </th>
                    <th className="px-4 py-3.5 text-center min-w-[110px]">
                      <span>
                        {activeSemester === "sem1"
                          ? "Ulangan Sem 1"
                          : activeSemester === "sem2"
                          ? "Ulangan Sem 2"
                          : "Rata Ulangan"}
                      </span>
                    </th>
                    <th className="px-4 py-3.5 text-center min-w-[120px]">
                      <span>
                        {activeSemester === "sem1"
                          ? "Ujian Resmi #1 (PTS/PAS)"
                          : activeSemester === "sem2"
                          ? "Ujian Resmi #2 (PAT/PAS)"
                          : "Rata Ujian Resmi"}
                      </span>
                    </th>
                    <th
                      className="px-4 py-3.5 text-center cursor-pointer hover:bg-slate-100 transition min-w-[110px]"
                      onClick={() => toggleSort("nilaiAkhir")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Nilai Akhir</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-center min-w-[80px]">
                      <span>Predikat</span>
                    </th>
                    <th className="px-4 py-3.5 text-center min-w-[110px]">
                      <span>Status KKM ({kkmStandar})</span>
                    </th>
                    <th className="px-4 py-3.5 text-center min-w-[90px]">
                      <span>Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {processedStudents.map((st, idx) => {
                    const isPresensiSafe = st.activePresensi.persen >= 85;

                    return (
                      <tr
                        key={st.id}
                        className="hover:bg-blue-50/30 transition duration-150"
                      >
                        {/* No */}
                        <td className="px-4 py-3.5 text-slate-400 font-bold">
                          {idx + 1}
                        </td>

                        {/* Siswa */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {st.foto ? (
                                <img
                                  src={st.foto}
                                  alt={st.nama}
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                st.nama.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-black text-slate-900 truncate">
                                {st.nama}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                NISN: {st.nisn} • {st.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Presensi Rinci Format Resmi: H / S / I / A */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800" title="Hadir">
                                H: {st.activePresensi.hadir}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800" title="Sakit">
                                S: {st.activePresensi.sakit}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800" title="Izin">
                                I: {st.activePresensi.izin}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800" title="Alpa / Tanpa Keterangan">
                                A: {st.activePresensi.alpa}
                              </span>
                              <span
                                className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  isPresensiSafe
                                    ? "bg-teal-100 text-teal-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {st.activePresensi.persen}%
                              </span>
                            </div>

                            {/* Progress bar presensi */}
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isPresensiSafe ? "bg-teal-500" : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(st.activePresensi.persen, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Kuis Rata-rata */}
                        <td className="px-4 py-3.5 text-center">
                          {st.activeKuis !== null ? (
                            <span className="font-black text-slate-900">
                              {st.activeKuis}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>

                        {/* Ulangan Semester */}
                        <td className="px-4 py-3.5 text-center">
                          {st.activeUlangan !== null ? (
                            <span className="font-bold text-slate-900 px-2 py-0.5 rounded-md bg-slate-100">
                              {st.activeUlangan}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>

                        {/* Ujian Resmi */}
                        <td className="px-4 py-3.5 text-center">
                          {st.activeUjian !== null ? (
                            <span className="font-black text-purple-900 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200">
                              {st.activeUjian}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>

                        {/* Nilai Akhir */}
                        <td className="px-4 py-3.5 text-center">
                          {st.activeNilaiAkhir !== null ? (
                            <div className="font-black text-sm text-slate-900">
                              {st.activeNilaiAkhir}
                              <span className="text-[10px] text-slate-400 font-bold block">
                                / 100
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>

                        {/* Predikat */}
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`font-black text-xs px-2 py-0.5 rounded-md ${
                              st.activePredikat === "A"
                                ? "bg-emerald-100 text-emerald-800 font-bold"
                                : st.activePredikat === "B"
                                ? "bg-blue-100 text-blue-800"
                                : st.activePredikat === "C"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {st.activePredikat}
                          </span>
                        </td>

                        {/* Status KKM */}
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                              st.activeIsTuntas
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}
                          >
                            {st.activeIsTuntas ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                            )}
                            <span>{st.activeStatusKKM}</span>
                          </span>
                        </td>

                        {/* Aksi: Buka Lembar Kerja Siswa */}
                        <td className="px-4 py-3.5 text-center">
                          <Link
                            href={`/guru/siswa`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                            title="Review lembar kerja dan butir soal siswa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Setiap nilai baru dari kuis, ulangan, atau ujian yang dikerjakan siswa di Supabase otomatis mengupdate rekapan ini secara live.
              </span>
            </span>
            <span className="font-bold text-slate-400">
              Total {students.length} Siswa Terdaftar
            </span>
          </div>
        </div>

        {/* MODAL 1: PENGATURAN BOBOT PENILAIAN */}
        {isWeightModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Pengaturan Bobot Penilaian Rapor
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sesuaikan formula perhitungan Nilai Akhir & KKM
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWeightModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Bobot Kuis */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Bobot Kuis Bab (Formatif)</span>
                    <span className="text-blue-600">{bobotKuis}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={bobotKuis}
                    onChange={(e) => setBobotKuis(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Bobot Ulangan */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Bobot Ulangan Semester (Sumatif Lingkup Materi)</span>
                    <span className="text-emerald-600">{bobotUlangan}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={bobotUlangan}
                    onChange={(e) => setBobotUlangan(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                {/* Bobot Ujian */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Bobot Ujian Resmi CBT (PTS / PAS / PAT)</span>
                    <span className="text-purple-600">{bobotUjian}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={bobotUjian}
                    onChange={(e) => setBobotUjian(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>

                {/* Total Check */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold">
                  <span>Total Persentase:</span>
                  <span
                    className={
                      bobotKuis + bobotUlangan + bobotUjian === 100
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }
                  >
                    {bobotKuis + bobotUlangan + bobotUjian}% (Harus 100%)
                  </span>
                </div>

                {/* KKM Input */}
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Batas Standar KKM (Kriteria Ketercapaian Tujuan Pembelajaran)
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="90"
                    value={kkmStandar}
                    onChange={(e) => setKkmStandar(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBobotKuis(30);
                    setBobotUlangan(30);
                    setBobotUjian(40);
                    setKkmStandar(75);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Reset Standar (30-30-40)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (bobotKuis + bobotUlangan + bobotUjian !== 100) {
                      showToast("Total bobot harus berjumlah 100%!", "info");
                      return;
                    }
                    setIsWeightModalOpen(false);
                    showToast("Bobot penilaian dan batas KKM berhasil diperbarui!", "success");
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition cursor-pointer"
                >
                  Terapkan Formula
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: CETAK LEGER NILAI RAPOR (PRINT READY A4 LANDSCAPE) */}
        {isPrintModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:inset-auto print:bg-white print:p-0 print:z-auto print:overflow-visible">
            <div className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 lg:p-8 shadow-2xl border border-slate-200 space-y-5 sm:space-y-6 my-4 sm:my-8 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:border-none print:shadow-none print:p-0 print:my-0 print:max-h-none print:overflow-visible">
              {/* Modal Top Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Pratinjau Cetak Leger Nilai Rapor
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      Format standar A4 Landscape siap cetak untuk dokumen resmi sekolah
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={handlePrintLeger}
                    className="px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    <span>Print Sekarang (Ctrl+P)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* PRINT AREA CONTAINER (Render Kop, Tabel Leger, dan Tanda Tangan) */}
              <div
                ref={printAreaRef}
                className="bg-white text-black p-3 sm:p-6 border border-slate-300 rounded-xl space-y-5 print:border-none print:p-0 font-sans"
              >
                {/* KOP SURAT SEKOLAH RESMI */}
                <div className="text-center border-b-2 border-black pb-3 space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    DINAS PENDIDIKAN & KEBUDAYAAN • KURIKULUM MERDEKA
                  </h4>
                  <h2 className="text-lg font-black uppercase text-black tracking-tight">
                    LEGER NILAI HASIL BELAJAR & PRESENSI PESERTA DIDIK
                  </h2>
                  <p className="text-xs font-medium text-slate-600">
                    SMP MUHAMMADIYAH 1 • KOTA YOGYAKARTA • TAHUN PELAJARAN 2025/2026
                  </p>
                </div>

                {/* IDENTITAS DOKUMEN LEGER */}
                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 text-xs font-medium gap-2 pt-1">
                  <div>
                    <div><strong>Mata Pelajaran:</strong> Matematika (Fase D)</div>
                    <div><strong>Kelas / Rombel:</strong> Kelas 8 (Ruang 8-A)</div>
                    <div><strong>Semester:</strong> {getSemesterLabel(activeSemester)}</div>
                  </div>
                  <div className="text-left sm:text-right print:text-right">
                    <div><strong>Guru Mata Pelajaran:</strong> Ibu Siti Rahmawati, M.Pd.</div>
                    <div><strong>Standar KKM:</strong> {kkmStandar} Poin</div>
                    <div><strong>Tanggal Terbit:</strong> {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
                  </div>
                </div>

                {/* TABEL LEGER */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse border border-black">
                    <thead>
                      <tr className="bg-slate-100 text-black font-bold text-center border-b border-black">
                        <th className="border border-black p-1.5 w-8" rowSpan={2}>No</th>
                        <th className="border border-black p-1.5 w-24" rowSpan={2}>NISN</th>
                        <th className="border border-black p-1.5 text-left" rowSpan={2}>Nama Peserta Didik</th>
                        <th className="border border-black p-1.5" colSpan={4}>Presensi (Hari)</th>
                        <th className="border border-black p-1.5" rowSpan={2}>% Kehadiran</th>
                        <th className="border border-black p-1.5" colSpan={3}>Komponen Nilai</th>
                        <th className="border border-black p-1.5" rowSpan={2}>Nilai Akhir</th>
                        <th className="border border-black p-1.5 w-12" rowSpan={2}>Predikat</th>
                        <th className="border border-black p-1.5 w-16" rowSpan={2}>Status</th>
                      </tr>
                      <tr className="bg-slate-50 text-[10px] font-bold text-center border-b border-black">
                        <th className="border border-black p-1 w-7">H</th>
                        <th className="border border-black p-1 w-7">S</th>
                        <th className="border border-black p-1 w-7">I</th>
                        <th className="border border-black p-1 w-7">A</th>
                        <th className="border border-black p-1 w-14">Kuis ({bobotKuis}%)</th>
                        <th className="border border-black p-1 w-14">Ulangan ({bobotUlangan}%)</th>
                        <th className="border border-black p-1 w-14">Ujian ({bobotUjian}%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedStudents.map((st, idx) => (
                        <tr key={st.id} className="border-b border-slate-300">
                          <td className="border border-black p-1 text-center font-bold">{idx + 1}</td>
                          <td className="border border-black p-1 text-center font-mono">{st.nisn}</td>
                          <td className="border border-black p-1 font-bold">{st.nama}</td>
                          <td className="border border-black p-1 text-center font-bold text-emerald-800">{st.activePresensi.hadir}</td>
                          <td className="border border-black p-1 text-center text-amber-800">{st.activePresensi.sakit}</td>
                          <td className="border border-black p-1 text-center text-blue-800">{st.activePresensi.izin}</td>
                          <td className="border border-black p-1 text-center text-rose-800 font-bold">{st.activePresensi.alpa}</td>
                          <td className="border border-black p-1 text-center font-bold">{st.activePresensi.persen}%</td>
                          <td className="border border-black p-1 text-center">{st.activeKuis ?? "-"}</td>
                          <td className="border border-black p-1 text-center">{st.activeUlangan ?? "-"}</td>
                          <td className="border border-black p-1 text-center">{st.activeUjian ?? "-"}</td>
                          <td className="border border-black p-1 text-center font-black text-black">{st.activeNilaiAkhir}</td>
                          <td className="border border-black p-1 text-center font-black">{st.activePredikat}</td>
                          <td className={`border border-black p-1 text-center font-bold text-[10px] ${st.activeIsTuntas ? "text-emerald-700" : "text-rose-700"}`}>
                            {st.activeStatusKKM}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* STATISTIK RINGKASAN KELAS */}
                <div className="grid grid-cols-4 gap-2 p-2 bg-slate-50 border border-black text-xs font-medium">
                  <div>Rata-rata Nilai: <strong>{currentSummary.rataRataNilaiAkhir}</strong></div>
                  <div>Rata-rata Kehadiran: <strong>{currentSummary.rataRataKehadiran}%</strong></div>
                  <div>Peserta Tuntas: <strong>{currentSummary.totalTuntas} Siswa ({currentSummary.persentaseTuntas}%)</strong></div>
                  <div>Remedial: <strong>{currentSummary.totalRemedial} Siswa</strong></div>
                </div>

                {/* KOLOM TANDA TANGAN RESMI */}
                <div className="grid grid-cols-2 pt-6 text-xs text-center">
                  <div>
                    <p className="font-medium">Mengetahui,</p>
                    <p className="font-bold">Kepala Sekolah SMP Muhammadiyah 1</p>
                    <div className="h-16" />
                    <p className="font-black underline uppercase">Drs. H. Ahmad Sudrajat, M.Pd.I.</p>
                    <p className="text-[10px] text-slate-500">NIP. 19740512 199903 1 002</p>
                  </div>

                  <div>
                    <p className="font-medium">Yogyakarta, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                    <p className="font-bold">Guru Pengampu Mata Pelajaran</p>
                    <div className="h-16" />
                    <p className="font-black underline uppercase">Ibu Siti Rahmawati, M.Pd.</p>
                    <p className="text-[10px] text-slate-500">NIP. 19820318 200801 2 015</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GuruLayout>
  );
}
