export interface SekolahLink {
  label: string;
  url: string;
  icon?: string;
}

export interface SekolahData {
  id: string;
  nama: string;
  motto?: string | null;
  deskripsi?: string | null;
  bg_image_url?: string | null;
  links?: SekolahLink[] | null;
  alamat?: string | null;
  npsn?: string | null;
}

export interface PeerStudent {
  id: string;
  name: string;
  avatarUrl?: string | null;
  initials: string;
}

export interface CalendarDayItem {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  status: "today" | "streak" | "past" | "scheduled" | "normal" | "muted";
  fullDateStr: string;
  schedule: {
    bab: string;
    jam: string;
    room?: string;
    teacher?: string;
  } | null;
}

export interface CalendarWeekItem {
  weekIndex: number;
  hasStreakBadge: boolean;
  streakCount: number;
  days: CalendarDayItem[];
}

export interface ChapterMaterial {
  id: string;
  judul: string;
  urutan: number;
}

export interface ChapterItem {
  id: string;
  judul: string;
  deskripsi: string | null;
  urutan: number;
  progress?: number;
  materi?: ChapterMaterial[];
}

export interface ScheduleItem {
  id: string;
  subject: string;
  teacher: string;
  day: string;
  time: string;
  room: string;
}

export interface DailyMission {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
  rewardPoints: number;
  isCompleted: boolean;
  isClaimed: boolean;
  iconType: string;
}

export interface NoteItem {
  id: string;
  judul: string;
  konten: string;
  mata_pelajaran: string;
  dibuat_pada: string;
}

export interface GlobalChatItem {
  id: string;
  nama_penulis: string;
  kelas_penulis: string;
  konten: string;
  minat_kategori: string;
  jumlah_suka: number;
  jumlah_komentar: number;
  dibuat_pada: string;
}

export interface ChatCommentItem {
  id: string;
  nama_penulis: string;
  kelas_penulis: string;
  konten: string;
  dibuat_pada: string;
}

export interface LeaderboardStudent {
  rank: number;
  id: string;
  name: string;
  points: number;
  streak: number;
  school: string;
  isCurrentUser: boolean;
}

export interface NotificationItem {
  id: string | number;
  title: string;
  desc: string;
  time: string;
  type: string;
  dibaca?: boolean;
}

export interface ToastNotificationData {
  show: boolean;
  title: string;
  message: string;
  time: string;
  type?: "success" | "alpha" | "info";
}

export interface StudentDashboardProps {
  userProfile: {
    nama_lengkap: string;
    email: string;
    peran: string;
    poin: number;
    streak: number;
    rank: number;
    totalStudents: number;
    isCheckedIn: boolean;
    checkInTime: string | null;
    checkInStatus?: string | null;
  };
  sekolahData?: SekolahData | null;
  schedulesData?: ScheduleItem[];
  chapters?: ChapterItem[];
  peerStudents?: PeerStudent[];
  completedQuizCount?: number;
  answeredSoalCount?: number;
  totalSoalCount?: number;
  learningProgressPercent?: number;
}
