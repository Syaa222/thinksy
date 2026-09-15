"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Gamepad2,
  X,
  Zap,
  Flame,
  Trophy,
  RotateCcw,
  Sparkles,
  Award,
  Timer,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  BookOpen,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

interface GamesHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed?: (newPoints: number) => void;
}

type GameCategory = "hub" | "math" | "english" | "indonesia";

interface GameQuestion {
  prompt: string;
  subtext?: string;
  category: string;
  options: string[];
  answer: string;
}

// Lightweight procedural sound synthesizer using Web Audio API
function playTone(type: "correct" | "wrong" | "start" | "gameover", enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "correct") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "wrong") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(160, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "start") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "gameover") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24);
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.36);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch {}
}

// 1. Math Generator
function generateMathQuestion(): GameQuestion {
  const types = ["add_sub", "mult", "algebra", "sequence"];
  const type = types[Math.floor(Math.random() * types.length)];

  if (type === "add_sub") {
    const a = Math.floor(Math.random() * 80) + 15;
    const b = Math.floor(Math.random() * 70) + 10;
    const isAdd = Math.random() > 0.5;
    const ans = isAdd ? a + b : a - b;
    const prompt = isAdd ? `${a} + ${b} = ?` : `${a} - ${b} = ?`;
    const opts = generateNumericOptions(ans);
    return { prompt, category: "Aritmatika Cepat", options: opts.map(String), answer: String(ans) };
  } else if (type === "mult") {
    const a = Math.floor(Math.random() * 12) + 3;
    const b = Math.floor(Math.random() * 12) + 3;
    const ans = a * b;
    const opts = generateNumericOptions(ans);
    return { prompt: `${a} × ${b} = ?`, category: "Perkalian Kilat", options: opts.map(String), answer: String(ans) };
  } else if (type === "algebra") {
    const x = Math.floor(Math.random() * 15) + 2;
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 20) + 1;
    const result = a * x + b;
    const opts = generateNumericOptions(x);
    return { prompt: `${a}x + ${b} = ${result}, x = ?`, category: "Aljabar Linear", options: opts.map(String), answer: String(x) };
  } else {
    const start = Math.floor(Math.random() * 10) + 1;
    const step = Math.floor(Math.random() * 6) + 2;
    const seq = [start, start + step, start + step * 2, start + step * 3];
    const ans = start + step * 4;
    const opts = generateNumericOptions(ans);
    return { prompt: `${seq.join(", ")}, [ ? ]`, category: "Pola Bilangan", options: opts.map(String), answer: String(ans) };
  }
}

function generateNumericOptions(answer: number): number[] {
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const delta = (Math.floor(Math.random() * 7) + 1) * (Math.random() > 0.5 ? 1 : -1);
    const candidate = answer + delta;
    if (candidate > 0) options.add(candidate);
  }
  return Array.from(options).sort(() => Math.random() - 0.5);
}

// 2. English Questions Bank & Generator
const ENGLISH_QUESTIONS: GameQuestion[] = [
  {
    prompt: "Fill in the blank: She _______ to the library yesterday to study.",
    category: "Past Tense",
    options: ["went", "goes", "gone", "going"],
    answer: "went",
  },
  {
    prompt: "Unscramble the word: 'C E I S N E C' (Study of the natural world)",
    category: "Word Scramble",
    options: ["SCIENCE", "SCENIC", "SCIENT", "CENSIS"],
    answer: "SCIENCE",
  },
  {
    prompt: "Synonym of 'BRILLIANT':",
    category: "Vocabulary Match",
    options: ["Smart & Intelligent", "Careless", "Very Dark", "Ancient"],
    answer: "Smart & Intelligent",
  },
  {
    prompt: "Fill in the blank: If it rains tomorrow, we _______ stay inside.",
    category: "Conditional Clause",
    options: ["will", "would have", "were", "did"],
    answer: "will",
  },
  {
    prompt: "Unscramble the word: 'A L N G U A G E'",
    category: "Word Scramble",
    options: ["LANGUAGE", "GAULANGE", "LANGUAGY", "LEAGUE"],
    answer: "LANGUAGE",
  },
  {
    prompt: "Antonym of 'ANCIENT':",
    category: "Opposites",
    options: ["Modern", "Traditional", "Historical", "Old"],
    answer: "Modern",
  },
  {
    prompt: "Complete the idiom: 'Actions speak louder than _______.'",
    category: "Idioms & Expressions",
    options: ["words", "noises", "echoes", "thoughts"],
    answer: "words",
  },
  {
    prompt: "Which word is a noun?",
    category: "Parts of Speech",
    options: ["Happiness", "Quickly", "Beautiful", "Run"],
    answer: "Happiness",
  },
];

// 3. Indonesian Questions Bank & Generator
const INDONESIA_QUESTIONS: GameQuestion[] = [
  {
    prompt: "Manakah penulisan kata baku menurut KBBI?",
    category: "Kata Baku",
    options: ["Praktik", "Praktek", "Praktekan", "Praktikan"],
    answer: "Praktik",
  },
  {
    prompt: "Lengkapi peribahasa: 'Air beriak tanda tak _______.'",
    category: "Peribahasa",
    options: ["dalam", "deras", "asin", "keruh"],
    answer: "dalam",
  },
  {
    prompt: "Sinonim dari kata 'KREDIBEL' adalah:",
    category: "Kosakata",
    options: ["Dapat dipercaya", "Sulit dipahami", "Mudah bergaul", "Berbahaya"],
    answer: "Dapat dipercaya",
  },
  {
    prompt: "Larik pantun rima a-b-a-b:\n'Bunga mawar harum baunya,\ntumbuh mekar di pekarangan.\nKalau kamu rajin membacanya,\n...'",
    category: "Pantun & Sastra",
    options: [
      "Pasti luas ilmu dan pandangan",
      "Pergi belanja ke pertokoan",
      "Makan roti bersama teman",
      "Mari kita selalu berteman",
    ],
    answer: "Pasti luas ilmu dan pandangan",
  },
  {
    prompt: "Manakah susunan kalimat efektif yang benar?",
    category: "Tata Kalimat",
    options: [
      "Para siswa menghadiri upacara bendera.",
      "Para siswa-siswa semua hadir di upacara.",
      "Kepada para siswa sekalian dipersilakan.",
      "Siswa-siswa banyak yang berdatangan semua.",
    ],
    answer: "Para siswa menghadiri upacara bendera.",
  },
  {
    prompt: "Antonim dari kata 'ANTAGONIS' adalah:",
    category: "Lawan Kata",
    options: ["Protagonis", "Tritagonis", "Figuran", "Sutradara"],
    answer: "Protagonis",
  },
  {
    prompt: "Penulisan huruf kapital yang benar adalah:",
    category: "EYD & PUEBI",
    options: [
      "Budi berkunjung ke Danau Toba.",
      "Budi berkunjung ke danau Toba.",
      "Budi berkunjung ke Danau toba.",
      "Budi berkunjung ke danau toba.",
    ],
    answer: "Budi berkunjung ke Danau Toba.",
  },
];

export default function GamesHubModal({
  isOpen,
  onClose,
  onRewardClaimed,
}: GamesHubModalProps) {
  const [selectedGame, setSelectedGame] = useState<GameCategory>("hub");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Gameplay State
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Claim State
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get Next Question based on active category
  const getNextQuestion = useCallback((category: GameCategory): GameQuestion => {
    if (category === "math") {
      return generateMathQuestion();
    } else if (category === "english") {
      const idx = Math.floor(Math.random() * ENGLISH_QUESTIONS.length);
      const q = ENGLISH_QUESTIONS[idx];
      return {
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5),
      };
    } else {
      const idx = Math.floor(Math.random() * INDONESIA_QUESTIONS.length);
      const q = INDONESIA_QUESTIONS[idx];
      return {
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5),
      };
    }
  }, []);

  const startGame = (cat: GameCategory) => {
    setSelectedGame(cat);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setTimeLeft(30);
    setQuestionsAnswered(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setFeedback(null);
    setIsGameOver(false);
    setIsClaimed(false);
    setIsPlaying(true);

    const firstQ = getNextQuestion(cat);
    setCurrentQuestion(firstQ);
    playTone("start", soundEnabled);
  };

  // Timer Tick
  useEffect(() => {
    if (isPlaying && !isGameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsPlaying(false);
            setIsGameOver(true);
            playTone("gameover", soundEnabled);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isGameOver, soundEnabled]);

  const handleSelectOption = (opt: string) => {
    if (!isPlaying || selectedAnswer !== null || !currentQuestion) return;

    setSelectedAnswer(opt);
    const isCorrect = opt === currentQuestion.answer;
    setQuestionsAnswered((p) => p + 1);

    if (isCorrect) {
      setFeedback("correct");
      playTone("correct", soundEnabled);
      const multiplier = Math.min(streak + 1, 5);
      const points = 10 * multiplier;
      setScore((prev) => prev + points);
      setStreak((prev) => {
        const next = prev + 1;
        setMaxStreak((m) => Math.max(m, next));
        return next;
      });
      setCorrectCount((c) => c + 1);
    } else {
      setFeedback("wrong");
      playTone("wrong", soundEnabled);
      setStreak(0);
    }

    // Auto next after 400ms
    setTimeout(() => {
      setSelectedAnswer(null);
      setFeedback(null);
      if (isPlaying && !isGameOver) {
        setCurrentQuestion(getNextQuestion(selectedGame));
      }
    }, 450);
  };

  const handleClaimReward = async () => {
    if (isClaimed || isClaiming) return;
    setIsClaiming(true);

    const calculatedPoints = Math.min(Math.max(5, Math.floor(score / 30)), 25);

    try {
      const res = await fetch("/api/siswa/game-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType:
            selectedGame === "math"
              ? "Matematika"
              : selectedGame === "english"
              ? "Bahasa Inggris"
              : "Bahasa Indonesia",
          score,
          pointsEarned: calculatedPoints,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsClaimed(true);
        if (onRewardClaimed && data.totalPoints) {
          onRewardClaimed(data.totalPoints);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* TOP BANNER */}
        <div className="relative bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white px-6 py-5 border-b-4 border-amber-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  THINKSY GAME HUB
                </span>
                <h3 className="text-lg font-black text-white">
                  Mini Games Edukasi Interaktif
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 pr-8">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition cursor-pointer"
                title={soundEnabled ? "Nonaktifkan Suara" : "Aktifkan Suara"}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="p-6">
          {/* ============================================================ */}
          {/* 1. SELECTION HUB VIEW                                        */}
          {/* ============================================================ */}
          {selectedGame === "hub" && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-base font-black text-[#0F172A]">
                  Pilih Arena Permainan Edukasi
                </h4>
                <p className="text-xs text-slate-500">
                  Uji kecepatan berpikir, raih combo streak tertinggi, dan klaim poin belajar nyata!
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {/* Math Game Card */}
                <div
                  onClick={() => startGame("math")}
                  className="p-4 rounded-2xl border-2 border-blue-100 hover:border-blue-500 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform">
                      📐
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wide text-blue-700">
                        Matematika
                      </div>
                      <div className="text-sm font-black text-[#0F172A]">
                        Speed Math & Pola Angka
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Hitung kilat, aljabar, & barisan bilangan
                      </div>
                    </div>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-black text-xs transition flex items-center gap-1">
                    <span>Main</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* English Game Card */}
                <div
                  onClick={() => startGame("english")}
                  className="p-4 rounded-2xl border-2 border-purple-100 hover:border-purple-500 bg-gradient-to-r from-purple-50/50 to-pink-50/30 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform">
                      🇬🇧
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wide text-purple-700">
                        Bahasa Inggris
                      </div>
                      <div className="text-sm font-black text-[#0F172A]">
                        Vocab Match & Scramble
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Tebak arti, tenses grammar, & susun kata
                      </div>
                    </div>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-purple-600 group-hover:bg-purple-700 text-white font-black text-xs transition flex items-center gap-1">
                    <span>Main</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Indonesian Game Card */}
                <div
                  onClick={() => startGame("indonesia")}
                  className="p-4 rounded-2xl border-2 border-rose-100 hover:border-rose-500 bg-gradient-to-r from-rose-50/50 to-amber-50/30 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform">
                      🇮🇩
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wide text-rose-700">
                        Bahasa Indonesia
                      </div>
                      <div className="text-sm font-black text-[#0F172A]">
                        Kata Baku & Pantun Bijak
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Kosakata KBBI, peribahasa, & rima pantun
                      </div>
                    </div>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-rose-600 group-hover:bg-rose-700 text-white font-black text-xs transition flex items-center gap-1">
                    <span>Main</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. ACTIVE GAMEPLAY VIEW                                      */}
          {/* ============================================================ */}
          {selectedGame !== "hub" && isPlaying && !isGameOver && currentQuestion && (
            <div className="space-y-5">
              {/* Gameplay Status Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button
                  onClick={() => setSelectedGame("hub")}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 transition flex items-center gap-1 cursor-pointer"
                >
                  ← Pilih Game
                </button>

                <div className="flex items-center gap-3">
                  {/* Streak */}
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Streak {streak}x</span>
                  </div>

                  {/* Timer */}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-extrabold ${
                      timeLeft <= 5
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>{timeLeft}s</span>
                  </div>

                  {/* Score */}
                  <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black">
                    {score} Pts
                  </div>
                </div>
              </div>

              {/* Question Card */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
                <span className="inline-block text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                  {currentQuestion.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#0F172A] leading-tight min-h-[56px] flex items-center justify-center">
                  {currentQuestion.prompt}
                </h3>
              </div>

              {/* 4 Multiple Choice Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentQuestion.options.map((opt, idx) => {
                  let btnStyle =
                    "bg-white hover:bg-slate-50 text-slate-900 border-slate-200";

                  if (selectedAnswer !== null) {
                    if (opt === currentQuestion.answer) {
                      btnStyle =
                        "bg-emerald-500 text-white border-emerald-600 scale-[1.02] shadow-md";
                    } else if (opt === selectedAnswer) {
                      btnStyle =
                        "bg-rose-500 text-white border-rose-600";
                    } else {
                      btnStyle = "bg-slate-100 text-slate-400 border-slate-200 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      disabled={selectedAnswer !== null}
                      className={`p-4 rounded-2xl border-2 text-sm font-black transition-all cursor-pointer shadow-2xs flex items-center justify-between ${btnStyle}`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center text-xs shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 text-center px-2">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. GAME OVER & REWARD CLAIM VIEW                             */}
          {/* ============================================================ */}
          {isGameOver && (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-500 flex items-center justify-center mx-auto text-3xl shadow-inner animate-bounce">
                🏆
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  WAKTU SELESAI
                </span>
                <h3 className="text-2xl font-black text-[#0F172A]">
                  Permainan Selesai!
                </h3>
                <p className="text-xs text-slate-500">
                  Kerja bagus! Ketangkasan berpikirmu luar biasa.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Total Skor
                  </div>
                  <div className="text-lg font-black text-blue-600 mt-0.5">
                    {score}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Benar / Soal
                  </div>
                  <div className="text-lg font-black text-emerald-600 mt-0.5">
                    {correctCount} / {questionsAnswered}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Max Streak
                  </div>
                  <div className="text-lg font-black text-amber-600 mt-0.5">
                    {maxStreak}x
                  </div>
                </div>
              </div>

              {/* Reward Action */}
              <div className="space-y-2 pt-2">
                {!isClaimed ? (
                  <button
                    onClick={handleClaimReward}
                    disabled={isClaiming || score === 0}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-sm shadow-lg hover:shadow-amber-500/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Award className="w-5 h-5 text-amber-200" />
                    <span>
                      {isClaiming
                        ? "Menyimpan ke Akun..."
                        : `Klaim Hadiah (+${Math.min(
                            Math.max(5, Math.floor(score / 30)),
                            25
                          )} Poin Belajar)`}
                    </span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Hadiah Poin Berhasil Ditambahkan ke Profil!</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startGame(selectedGame)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Main Lagi</span>
                  </button>
                  <button
                    onClick={() => setSelectedGame("hub")}
                    className="flex-1 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Pilih Game Lain
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
