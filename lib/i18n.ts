import { SettingsLanguage } from "@/lib/student-settings";

export interface TranslationDictionary {
  // Navigation & Common
  home: string;
  calendar: string;
  todo: string;
  todoSubtitle: string;
  studyRoom: string;
  mathGrade8: string;
  settings: string;
  berandaSection: string;
  settingsSection: string;
  studentDashboard: string;
  myProfile: string;
  studentStatus: string;
  statusActive: string;
  statusInactive: string;
  notes: string;
  help: string;
  examRoom: string;
  modules: string;
  welcome: string;
  welcomeSubtitle: string;
  searchPlaceholder: string;
  signOut: string;
  backToHome: string;
  refresh: string;
  save: string;
  cancel: string;
  done: string;
  assigned: string;
  missing: string;
  active: string;
  offline: string;

  // Class card actions
  openStudyRoom: string;
  viewChaptersAndMaterials: string;
  leaveClass: string;
  leaveClassConfirmTitle: string;
  leaveClassConfirmMsg: string;
  leaveClassAction: string;
  leaveClassSuccess: string;
  leaveClassPendingBadge: string;
  leaveClassPendingToast: string;
  leaveClassCancelBtn: string;
  leaveClassWaitingTeacher: string;
  teacherNotifTitle: string;
  unenrollRequestsHeading: string;
  noUnenrollRequests: string;
  approve: string;
  reject: string;
  approvedSuccess: string;
  rejectedSuccess: string;

  // Attendance
  checkInNow: string;
  checkedIn: string;
  verified: string;
  presentOnTime: string;
  late: string;
  absent: string;
  checkInClosed: string;
  presenceTime: string;
  officialAttendance: string;

  // Student Dashboard Components
  chapterMastery: string;
  chapterMasterySub: string;
  learningTargets: string;
  continueLearning: string;
  classmatePeers: string;
  registeredStudents: string;
  assignmentsAndTasks: string;
  upcomingExams: string;
  noOverdueTasks: string;
  completedTasks: string;
  addSchedule: string;
  personalSchedule: string;
  recentLearning: string;
  continueQuiz: string;
  inProgress: string;
  activeExamsCount: string;
  noActiveExams: string;
  noCompletedExams: string;
  enterExamRoom: string;

  // Teacher Dashboard Components
  teacherPanel: string;
  navBeranda: string;
  navManajemenSiswa: string;
  navManagementKelas: string;
  navPengelolaan: string;
  navPengaturan: string;
  navBankSoal: string;
  navPenilaianEsai: string;
  navBiayaToken: string;
  classSummary: string;
  averageScore: string;
  studentsNeedAttention: string;
  viewAllStudents: string;
  historyAndAnswers: string;
  liveAttendanceTitle: string;
  filterClass: string;
  allClasses: string;
  sortBy: string;
  studentName: string;
  nisn: string;
  scoreAvg: string;
  progressMastery: string;
  lastActivity: string;
  action: string;
  publishSoal: string;
  rubricGrading: string;
  aiCostTitle: string;
}

export const translations: Record<SettingsLanguage, TranslationDictionary> = {
  id: {
    home: "Home",
    calendar: "Agenda Akademik",
    todo: "Tugas & Ujian",
    todoSubtitle: "Kelola seluruh penugasan mandiri, materi terakhir, dan jadwal asesmen formatif Matematika.",
    studyRoom: "Ruang Belajar",
    mathGrade8: "Matematika (Kelas 8)",
    settings: "Pengaturan",
    berandaSection: "BERANDA",
    settingsSection: "PENGATURAN",
    studentDashboard: "Dashboard Siswa",
    myProfile: "Profil Saya",
    studentStatus: "Status Siswa",
    statusActive: "Aktif",
    statusInactive: "Tidak Aktif",
    notes: "Catatan Belajar",
    help: "Bantuan",
    examRoom: "Ruang Ujian",
    modules: "Modul Pembelajaran",
    welcome: "Selamat Datang",
    welcomeSubtitle: "Mari lanjutkan pemahaman konsep Matematika Kurikulum Merdeka Fase D hari ini.",
    searchPlaceholder: "Cari materi, soal, atau siswa...",
    signOut: "Keluar Akun",
    backToHome: "← Kembali ke Home",
    refresh: "Segarkan",
    save: "Simpan",
    cancel: "Batal",
    done: "Selesai",
    assigned: "Ditugaskan",
    missing: "Terlambat",
    active: "Aktif",
    offline: "Offline",

    openStudyRoom: "Buka Ruang Belajar",
    viewChaptersAndMaterials: "Lihat Bab & Materi",
    leaveClass: "Keluar kelas",
    leaveClassConfirmTitle: "Keluar dari kelas ini?",
    leaveClassConfirmMsg: "Anda tidak akan lagi melihat tugas, pengumuman, atau materi kelas ini di dashboard Anda. Seluruh riwayat belajar Anda tetap aman tersimpan.",
    leaveClassAction: "Kirim Permintaan Keluar",
    leaveClassSuccess: "Berhasil keluar dari kelas.",
    leaveClassPendingBadge: "Menunggu Persetujuan Guru",
    leaveClassPendingToast: "Permintaan keluar kelas telah dikirim. Menunggu konfirmasi dari guru pengampu.",
    leaveClassCancelBtn: "Batalkan Permintaan",
    leaveClassWaitingTeacher: "Menunggu Konfirmasi Guru",
    teacherNotifTitle: "Notifikasi Guru",
    unenrollRequestsHeading: "Permintaan Keluar Kelas",
    noUnenrollRequests: "Tidak ada permintaan keluar kelas yang pending.",
    approve: "Setujui",
    reject: "Tolak",
    approvedSuccess: "Permintaan keluar kelas berhasil disetujui.",
    rejectedSuccess: "Permintaan keluar kelas ditolak.",

    checkInNow: "Absen Sekarang",
    checkedIn: "Sudah Absen",
    verified: "Terverifikasi",
    presentOnTime: "Hadir Tepat Waktu",
    late: "Terlambat",
    absent: "Alpha",
    checkInClosed: "Presensi Ditutup",
    presenceTime: "Waktu Presensi",
    officialAttendance: "Presensi Resmi Sekolah",

    chapterMastery: "Ketuntasan Bab",
    chapterMasterySub: "Progres penuntasan 5 bab Matematika Fase D",
    learningTargets: "Target & Rekomendasi Belajar",
    continueLearning: "Lanjutkan Belajar",
    classmatePeers: "Rekan Sekelas",
    registeredStudents: "Siswa Terdaftar",
    assignmentsAndTasks: "Daftar Tugas & Asesmen",
    upcomingExams: "Jadwal Asesmen & Ujian Resmi",
    noOverdueTasks: "Hebat! Tidak ada tugas yang terlambat dikerjakan.",
    completedTasks: "Tugas yang Telah Diselesaikan",
    addSchedule: "Tambah Jadwal Belajar",
    personalSchedule: "Jadwal Mandiri Siswa",
    recentLearning: "Pembelajaran & Kuis Terakhir",
    continueQuiz: "Lanjutkan Kuis",
    inProgress: "Belum Selesai",
    activeExamsCount: "Ulangan & Ujian Aktif",
    noActiveExams: "Tidak ada ulangan atau ujian aktif yang membutuhkan pengerjaan saat ini.",
    noCompletedExams: "Belum ada asesmen atau ulangan yang diselesaikan.",
    enterExamRoom: "Masuk Ruang Ujian",

    teacherPanel: "Panel Guru",
    navBeranda: "Beranda",
    navManajemenSiswa: "Manajemen Siswa",
    navManagementKelas: "Management Kelas",
    navPengelolaan: "Pengelolaan",
    navPengaturan: "Pengaturan",
    navBankSoal: "Bank Soal",
    navPenilaianEsai: "Penilaian Esai AI",
    navBiayaToken: "Biaya & Token AI",
    classSummary: "Ringkasan Kelas",
    averageScore: "Rata-rata Nilai",
    studentsNeedAttention: "Siswa Butuh Perhatian",
    viewAllStudents: "Lihat Semua Siswa",
    historyAndAnswers: "Riwayat & Jawaban",
    liveAttendanceTitle: "Monitoring Realtime Presensi",
    filterClass: "Kelas:",
    allClasses: "Semua Kelas",
    sortBy: "Urutkan:",
    studentName: "Nama Siswa",
    nisn: "NISN",
    scoreAvg: "Nilai Rata-rata",
    progressMastery: "Ketuntasan Belajar",
    lastActivity: "Aktivitas Terakhir",
    action: "Aksi",
    publishSoal: "Terbitkan Soal",
    rubricGrading: "Rubrik Penilaian Esai",
    aiCostTitle: "Monitoring Konsumsi Token AI",
  },
  en: {
    home: "Home",
    calendar: "Academic Schedule",
    todo: "Assignments & Tasks",
    todoSubtitle: "Manage independent homework, recent course materials, and formative math assessment schedules.",
    studyRoom: "Study Room",
    mathGrade8: "Mathematics (Grade 8)",
    settings: "Settings",
    berandaSection: "HOME",
    settingsSection: "SETTINGS",
    studentDashboard: "Student Dashboard",
    myProfile: "My Profile",
    studentStatus: "Student Status",
    statusActive: "Active",
    statusInactive: "Inactive",
    notes: "Study Notes",
    help: "Help Center",
    examRoom: "Exam Room",
    modules: "Learning Modules",
    welcome: "Welcome",
    welcomeSubtitle: "Continue exploring Grade 8 Math concepts step by step today.",
    searchPlaceholder: "Search materials, questions, or students...",
    signOut: "Sign Out",
    backToHome: "← Back to Home",
    refresh: "Refresh",
    save: "Save",
    cancel: "Cancel",
    done: "Completed",
    assigned: "Assigned",
    missing: "Missing / Overdue",
    active: "Active",
    offline: "Offline",

    openStudyRoom: "Open Study Room",
    viewChaptersAndMaterials: "View Chapters & Materials",
    leaveClass: "Unenroll class",
    leaveClassConfirmTitle: "Unenroll from this class?",
    leaveClassConfirmMsg: "You will no longer see assignments, announcements, or materials for this class on your dashboard. Your learning history remains securely saved.",
    leaveClassAction: "Submit Request",
    leaveClassSuccess: "Successfully unenrolled from class.",
    leaveClassPendingBadge: "Pending Teacher Approval",
    leaveClassPendingToast: "Unenroll request submitted. Waiting for teacher's confirmation.",
    leaveClassCancelBtn: "Cancel Request",
    leaveClassWaitingTeacher: "Pending Confirmation",
    teacherNotifTitle: "Teacher Notifications",
    unenrollRequestsHeading: "Unenroll Requests",
    noUnenrollRequests: "No pending unenroll requests.",
    approve: "Approve",
    reject: "Reject",
    approvedSuccess: "Unenroll request successfully approved.",
    rejectedSuccess: "Unenroll request rejected.",

    checkInNow: "Check-in Now",
    checkedIn: "Checked In",
    verified: "Verified",
    presentOnTime: "Present (On-time)",
    late: "Late",
    absent: "Absent",
    checkInClosed: "Attendance Closed",
    presenceTime: "Time Checked-in",
    officialAttendance: "Official Attendance",

    chapterMastery: "Chapter Mastery",
    chapterMasterySub: "Progress across 5 Phase D math chapters",
    learningTargets: "Learning Targets & Recommendations",
    continueLearning: "Continue Learning",
    classmatePeers: "Classmates",
    registeredStudents: "Enrolled Students",
    assignmentsAndTasks: "Assignments & Assessment Tasks",
    upcomingExams: "Official Exam Schedule",
    noOverdueTasks: "Great job! No overdue assignments or tasks.",
    completedTasks: "Completed Assignments",
    addSchedule: "Add Study Schedule",
    personalSchedule: "Personal Study Schedule",
    recentLearning: "Recent Learning & Quizzes",
    continueQuiz: "Continue Quiz",
    inProgress: "In Progress",
    activeExamsCount: "Active Exams & Tests",
    noActiveExams: "No active exams or quizzes requiring completion at this time.",
    noCompletedExams: "No assessments or exams completed yet.",
    enterExamRoom: "Enter Exam Room",

    teacherPanel: "Teacher Panel",
    navBeranda: "Overview",
    navManajemenSiswa: "Student Management",
    navManagementKelas: "Classroom",
    navPengelolaan: "Operations",
    navPengaturan: "Settings",
    navBankSoal: "Question Bank",
    navPenilaianEsai: "AI Essay Grading",
    navBiayaToken: "AI Token & Costs",
    classSummary: "Class Summary",
    averageScore: "Average Score",
    studentsNeedAttention: "Students Needing Attention",
    viewAllStudents: "View All Students",
    historyAndAnswers: "History & Submissions",
    liveAttendanceTitle: "Real-time Attendance Monitoring",
    filterClass: "Class:",
    allClasses: "All Classes",
    sortBy: "Sort by:",
    studentName: "Student Name",
    nisn: "Student ID (NISN)",
    scoreAvg: "Average Grade",
    progressMastery: "Learning Mastery",
    lastActivity: "Last Activity",
    action: "Action",
    publishSoal: "Publish Question",
    rubricGrading: "Essay Grading Rubric",
    aiCostTitle: "AI Token Consumption Monitor",
  },
};
