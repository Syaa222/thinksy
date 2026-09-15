import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface StudentBadgeDetail {
  id: string;
  title: string;
  desc: string;
  tier: "Bronze" | "Silver" | "Gold" | "Emerald" | "Indigo" | "Diamond";
  tierColor: string;
  icon: string;
  rewardPoints: number;
  isUnlocked: boolean;
  currentValue: number;
  targetValue: number;
  unit: string;
  progressPercent: number;
  progressText: string;
  remainingText: string;
  tips: string;
  actionUrl?: string;
  actionLabel?: string;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Anda harus masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    // 2. Fetch User Profile (Points & Streak)
    const { data: profil } = await adminDb
      .from("profil")
      .select("id, nama_lengkap, poin, streak, sekolah_id")
      .eq("id", user.id)
      .maybeSingle();

    const learningPoints = profil?.poin ?? 0;
    const dailyStreak = profil?.streak ?? 0;

    // 3. Fetch Completed Sessions (sesi kuis/latihan + sesi_ujian resmi)
    // Sesi kuis/latihan
    const { count: sesiSelesaiCount } = await adminDb
      .from("sesi")
      .select("id", { count: "exact", head: true })
      .eq("siswa_id", user.id)
      .eq("status_sesi", "selesai");

    // Sesi ujian/ulangan
    const { count: ujianSelesaiCount } = await adminDb
      .from("sesi_ujian")
      .select("id", { count: "exact", head: true })
      .eq("siswa_id", user.id)
      .eq("status", "selesai");

    const completedQuizCount = (sesiSelesaiCount || 0) + (ujianSelesaiCount || 0);

    // 4. Fetch Answered Questions (jawaban kuis + jawaban_ujian)
    const { data: jawabanList } = await adminDb
      .from("jawaban")
      .select("soal_id, sesi!inner(siswa_id)")
      .eq("sesi.siswa_id", user.id);

    const { data: jawabanUjianList } = await adminDb
      .from("jawaban_ujian")
      .select("soal_id, sesi_ujian!inner(siswa_id)")
      .eq("sesi_ujian.siswa_id", user.id);

    const answeredSet = new Set<string>();
    jawabanList?.forEach((j: any) => {
      if (j.soal_id) answeredSet.add(j.soal_id);
    });
    jawabanUjianList?.forEach((j: any) => {
      if (j.soal_id) answeredSet.add(j.soal_id);
    });

    const answeredSoalCount = answeredSet.size;

    // 5. Build Badges List with real-time math
    const badges: StudentBadgeDetail[] = [
      {
        id: "b1",
        title: "Langkah Pertama",
        desc: "Menyelesaikan 1 kuis atau latihan pertama Anda.",
        tier: "Bronze",
        tierColor: "from-amber-600 to-amber-700 border-amber-300 text-amber-900 bg-amber-50",
        icon: "🚀",
        rewardPoints: 50,
        isUnlocked: completedQuizCount >= 1,
        currentValue: completedQuizCount,
        targetValue: 1,
        unit: "Kuis",
        progressPercent: Math.min(100, Math.round((completedQuizCount / 1) * 100)),
        progressText: `${completedQuizCount}/1 Kuis`,
        remainingText:
          completedQuizCount >= 1
            ? "Telah selesai diraih! 🎉"
            : `Kurang ${1 - completedQuizCount} kuis lagi`,
        tips: "Buka menu Belajar atau Ruang Ujian, lalu selesaikan 1 sesi latihan materi.",
        actionUrl: "#belajar",
        actionLabel: "Buka Belajar",
      },
      {
        id: "b2",
        title: "Master Kuis",
        desc: "Menyelesaikan minimal 5 kuis atau ujian dengan sungguh-sungguh.",
        tier: "Silver",
        tierColor: "from-slate-400 to-slate-600 border-slate-300 text-slate-900 bg-slate-50",
        icon: "🏆",
        rewardPoints: 150,
        isUnlocked: completedQuizCount >= 5,
        currentValue: completedQuizCount,
        targetValue: 5,
        unit: "Kuis",
        progressPercent: Math.min(100, Math.round((completedQuizCount / 5) * 100)),
        progressText: `${completedQuizCount}/5 Kuis`,
        remainingText:
          completedQuizCount >= 5
            ? "Lencana Master Kuis telah dibuka! 🏆"
            : `Kurang ${Math.max(0, 5 - completedQuizCount)} kuis lagi`,
        tips: "Konsisten kerjakan kuis di setiap bab pelajaran matematika.",
        actionUrl: "#ruang-ujian",
        actionLabel: "Lihat Ujian",
      },
      {
        id: "b3",
        title: "Pejuang Streak",
        desc: "Kehadiran presensi sekolah harian berturut-turut selama 7 hari.",
        tier: "Gold",
        tierColor: "from-amber-400 to-orange-500 border-amber-400 text-orange-950 bg-amber-50/80",
        icon: "🔥",
        rewardPoints: 200,
        isUnlocked: dailyStreak >= 7,
        currentValue: dailyStreak,
        targetValue: 7,
        unit: "Hari",
        progressPercent: Math.min(100, Math.round((dailyStreak / 7) * 100)),
        progressText: `${dailyStreak}/7 Hari`,
        remainingText:
          dailyStreak >= 7
            ? "Streak 7 hari tercapai! Pertahankan api belajarmu 🔥"
            : `Kurang ${Math.max(0, 7 - dailyStreak)} hari berturut-turut`,
        tips: "Lakukan presensi selfie setiap pagi sebelum pukul 07.15 WIB.",
        actionUrl: "#presensi",
        actionLabel: "Cek Presensi",
      },
      {
        id: "b4",
        title: "Pembelajar Hebat",
        desc: "Mengumpulkan minimal 1.000 Poin Belajar (XP) dari seluruh aktivitas.",
        tier: "Emerald",
        tierColor: "from-emerald-500 to-teal-600 border-emerald-300 text-emerald-950 bg-emerald-50",
        icon: "⭐",
        rewardPoints: 300,
        isUnlocked: learningPoints >= 1000,
        currentValue: learningPoints,
        targetValue: 1000,
        unit: "Poin",
        progressPercent: Math.min(100, Math.round((learningPoints / 1000) * 100)),
        progressText: `${learningPoints.toLocaleString("id-ID")}/1.000 Poin`,
        remainingText:
          learningPoints >= 1000
            ? "Pencapaian 1.000 Poin tercapai dengan gemilang! ⭐"
            : `Kurang ${(1000 - learningPoints).toLocaleString("id-ID")} poin lagi`,
        tips: "Kumpulkan poin dari presensi tepat waktu (+20), kuis (+50), dan ulangan (+100).",
        actionUrl: "#peringkat",
        actionLabel: "Lihat Papan Skor",
      },
      {
        id: "b5",
        title: "Penjelajah Soal",
        desc: "Menjawab minimal 10 butir soal matematika dan eksplorasi kurikulum.",
        tier: "Indigo",
        tierColor: "from-indigo-500 to-blue-600 border-indigo-300 text-indigo-950 bg-indigo-50",
        icon: "🎯",
        rewardPoints: 100,
        isUnlocked: answeredSoalCount >= 10,
        currentValue: answeredSoalCount,
        targetValue: 10,
        unit: "Soal",
        progressPercent: Math.min(100, Math.round((answeredSoalCount / 10) * 100)),
        progressText: `${answeredSoalCount}/10 Soal`,
        remainingText:
          answeredSoalCount >= 10
            ? "Penjelajah Soal berhasil dikuasai! 🎯"
            : `Kurang ${Math.max(0, 10 - answeredSoalCount)} butir soal lagi`,
        tips: "Buka latihan mandiri pada modul kurikulum bab aljabar atau pythagoras.",
        actionUrl: "#belajar",
        actionLabel: "Mulai Latihan",
      },
      {
        id: "b6",
        title: "Bintang Matematika",
        desc: "Mengumpulkan 1.500+ Poin Belajar dan menyelesaikan minimal 10 sesi kuis/ujian.",
        tier: "Diamond",
        tierColor: "from-purple-500 via-pink-500 to-indigo-600 border-purple-300 text-purple-950 bg-purple-50",
        icon: "👑",
        rewardPoints: 500,
        isUnlocked: learningPoints >= 1500 && completedQuizCount >= 10,
        currentValue: Math.min(learningPoints, 1500),
        targetValue: 1500,
        unit: "XP & Kuis",
        progressPercent: Math.min(
          100,
          Math.round(
            ((Math.min(learningPoints, 1500) / 1500) * 0.7 +
              (Math.min(completedQuizCount, 10) / 10) * 0.3) *
              100
          )
        ),
        progressText: `${completedQuizCount}/10 Kuis • ${learningPoints.toLocaleString("id-ID")}/1.500 XP`,
        remainingText:
          learningPoints >= 1500 && completedQuizCount >= 10
            ? "Lencana Tertinggi Legenda Bintang Matematika Terbuka! 👑"
            : `Butuh ${Math.max(0, 1500 - learningPoints)} poin & ${Math.max(0, 10 - completedQuizCount)} kuis lagi`,
        tips: "Raih nilai tinggi pada PTS dan selesaikan seluruh bab matematika semester ini.",
        actionUrl: "#ruang-ujian",
        actionLabel: "Ke Ruang Ujian",
      },
    ];

    const unlockedCount = badges.filter((b) => b.isUnlocked).length;
    const totalBadgesCount = badges.length;
    const totalPotentialBonus = badges.reduce((acc, b) => acc + b.rewardPoints, 0);
    const earnedBonus = badges
      .filter((b) => b.isUnlocked)
      .reduce((acc, b) => acc + b.rewardPoints, 0);

    const overallProgressPercent = Math.round(
      (badges.reduce((acc, b) => acc + b.progressPercent, 0) / (totalBadgesCount * 100)) * 100
    );

    return NextResponse.json({
      success: true,
      stats: {
        learningPoints,
        dailyStreak,
        completedQuizCount,
        answeredSoalCount,
        unlockedCount,
        totalBadgesCount,
        totalPotentialBonus,
        earnedBonus,
        overallProgressPercent,
      },
      badges,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Gagal memuat data pencapaian: " + error.message },
      { status: 500 }
    );
  }
}
