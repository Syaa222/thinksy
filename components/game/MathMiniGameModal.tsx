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
} from "lucide-react";

interface MathMiniGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Question {
  text: string;
  category: string;
  options: number[];
  answer: number;
}

// Lightweight procedural sound synthesizer using Web Audio API (0-byte payload)
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
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
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

// Procedural Math Question Generator (Kelas 8 / SMP Level)
function generateMathQuestion(): Question {
  const types = ["arithmetic", "algebra", "powers", "sequence"];
  const selectedType = types[Math.floor(Math.random() * types.length)];

  let text = "";
  let category = "Aritmatika Cepat";
  let answer = 0;

  if (selectedType === "arithmetic") {
    const ops = ["+", "-", "×", "÷"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    if (op === "+") {
      const a = Math.floor(Math.random() * 80) + 12;
      const b = Math.floor(Math.random() * 80) + 12;
      text = `${a} + ${b}`;
      answer = a + b;
    } else if (op === "-") {
      const a = Math.floor(Math.random() * 90) + 20;
      const b = Math.floor(Math.random() * (a - 5)) + 5;
      text = `${a} - ${b}`;
      answer = a - b;
    } else if (op === "×") {
      const a = Math.floor(Math.random() * 12) + 3;
      const b = Math.floor(Math.random() * 12) + 3;
      text = `${a} × ${b}`;
      answer = a * b;
    } else {
      const b = Math.floor(Math.random() * 9) + 2;
      const ans = Math.floor(Math.random() * 12) + 2;
      const a = b * ans;
      text = `${a} ÷ ${b}`;
      answer = ans;
    }
    category = "Aritmatika";
  } else if (selectedType === "algebra") {
    // ax + b = c => x = ?
    const a = Math.floor(Math.random() * 4) + 2;
    const x = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 15) + 2;
    const c = a * x + b;
    text = `${a}x + ${b} = ${c},  x = ?`;
    category = "Aljabar";
    answer = x;
  } else if (selectedType === "powers") {
    // Squares or roots
    const isRoot = Math.random() > 0.5;
    if (isRoot) {
      const base = Math.floor(Math.random() * 13) + 4; // 4 to 16
      const sq = base * base;
      text = `√${sq} = ?`;
      category = "Akar Kuadrat";
      answer = base;
    } else {
      const base = Math.floor(Math.random() * 12) + 3;
      text = `${base}² = ?`;
      category = "Pangkat Kuadrat";
      answer = base * base;
    }
  } else {
    // Number Sequence
    const isArithmetic = Math.random() > 0.4;
    if (isArithmetic) {
      const start = Math.floor(Math.random() * 10) + 2;
      const diff = Math.floor(Math.random() * 6) + 3;
      const s1 = start;
      const s2 = start + diff;
      const s3 = start + diff * 2;
      const s4 = start + diff * 3;
      text = `${s1}, ${s2}, ${s3}, ${s4}, ... ?`;
      category = "Pola Bilangan";
      answer = start + diff * 4;
    } else {
      const start = Math.floor(Math.random() * 3) + 2;
      const ratio = 2;
      const s1 = start;
      const s2 = start * ratio;
      const s3 = start * ratio * ratio;
      text = `${s1}, ${s2}, ${s3}, ... ?`;
      category = "Pola Geometri";
      answer = start * ratio * ratio * ratio;
    }
  }

  // Generate 3 unique plausible wrong options
  const optionsSet = new Set<number>([answer]);
  while (optionsSet.size < 4) {
    const delta = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
    const candidate = answer + delta;
    if (candidate > 0 && candidate !== answer) {
      optionsSet.add(candidate);
    } else {
      optionsSet.add(answer + Math.floor(Math.random() * 10) + 1);
    }
  }

  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

  return { text, category, options, answer };
}

export default function MathMiniGameModal({ isOpen, onClose }: MathMiniGameModalProps) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thinksy_math_highscore");
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    }
  }, []);

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setTotalAnswered(0);
    setTimeLeft(30);
    setFeedback(null);
    setCurrentQ(generateMathQuestion());
    setGameState("playing");
    playTone("start", soundEnabled);
  };

  // Timer loop
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameState("gameover");
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
  }, [gameState, soundEnabled]);

  // Handle game over high score update
  useEffect(() => {
    if (gameState === "gameover") {
      if (score > highScore) {
        setHighScore(score);
        if (typeof window !== "undefined") {
          localStorage.setItem("thinksy_math_highscore", score.toString());
        }
      }
    }
  }, [gameState, score, highScore]);

  const handleAnswer = (chosen: number) => {
    if (gameState !== "playing" || !currentQ) return;

    setTotalAnswered((prev) => prev + 1);

    if (chosen === currentQ.answer) {
      // Correct!
      playTone("correct", soundEnabled);
      setFeedback("correct");
      const currentMultiplier = Math.min(streak + 1, 5);
      const points = 10 * currentMultiplier;
      setScore((prev) => prev + points);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > bestStreak) setBestStreak(next);
        return next;
      });
      setCorrectCount((prev) => prev + 1);
    } else {
      // Wrong!
      playTone("wrong", soundEnabled);
      setFeedback("wrong");
      setStreak(0);
    }

    // Next Question after micro feedback
    setTimeout(() => {
      setFeedback(null);
      setCurrentQ(generateMathQuestion());
    }, 200);
  };

  if (!isOpen) return null;

  const accuracy =
    totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900 transition-all">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#0F172A] tracking-tight">
                Math Blitz: Tantangan Hitung Cepat
              </h3>
              <p className="text-[10px] text-slate-500 font-bold">
                Asah Otak Matematika • Kelas 8 SMP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Nonaktifkan Suara" : "Aktifkan Suara"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game Body */}
        <div className="p-5 sm:p-6">
          {/* STATE 1: IDLE / START SCREEN */}
          {gameState === "idle" && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                <Zap className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-lg font-black text-[#0F172A]">
                  Tantang Kecepatan Berhitungmu!
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                  Jawab sebanyak mungkin soal aritmatika, pola bilangan, dan aljabar dalam{" "}
                  <span className="font-extrabold text-amber-600">30 detik</span>. Raih combo streak tertinggi!
                </p>
              </div>

              {/* Highscore & Info pill */}
              <div className="flex items-center justify-center gap-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Skor Terbaik: {highScore} pts</span>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full py-3 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-extrabold text-sm shadow-md transition duration-200 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>Mulai Main Sekarang (30s)</span>
              </button>
            </div>
          )}

          {/* STATE 2: PLAYING ACTIVE GAME */}
          {gameState === "playing" && currentQ && (
            <div className="space-y-4">
              {/* Stats HUD Bar */}
              <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold">
                {/* Timer */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition ${
                    timeLeft <= 5
                      ? "bg-rose-100 text-rose-700 animate-bounce"
                      : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>{timeLeft}s</span>
                </div>

                {/* Streak Combo */}
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition ${
                    streak >= 3
                      ? "bg-orange-100 text-orange-700 font-extrabold animate-pulse"
                      : "text-slate-600"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>Streak {streak}x</span>
                </div>

                {/* Score */}
                <div className="flex items-center gap-1 text-blue-600 font-extrabold">
                  <span>{score} Pts</span>
                </div>
              </div>

              {/* Progress Bar Timer */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 5 ? "bg-rose-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                />
              </div>

              {/* Question Card */}
              <div
                className={`p-6 rounded-2xl border text-center transition-all duration-150 ${
                  feedback === "correct"
                    ? "bg-emerald-50 border-emerald-300 scale-[1.02]"
                    : feedback === "wrong"
                    ? "bg-rose-50 border-rose-300 scale-[0.98]"
                    : "bg-linear-to-b from-slate-50 to-white border-slate-200 shadow-xs"
                }`}
              >
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 uppercase tracking-wider mb-2">
                  {currentQ.category}
                </span>

                <div className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight py-2 font-mono">
                  {currentQ.text}
                </div>

                <div className="text-[10px] text-slate-400 font-semibold">
                  Pilih jawaban yang paling tepat:
                </div>
              </div>

              {/* 4 Choices Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {currentQ.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option)}
                    className="py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-800 font-extrabold text-base transition-all duration-150 shadow-2xs active:scale-95 cursor-pointer font-mono"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STATE 3: GAME OVER / SCORECARD */}
          {gameState === "gameover" && (
            <div className="text-center space-y-5 py-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                <Award className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Waktu Habis!
                </span>
                <h4 className="text-xl font-black text-[#0F172A] pt-1">
                  Skor Akhir: {score} Poin
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {score >= 200
                    ? "🌟 Luar biasa! Kecepatan hitungmu setingkat master!"
                    : score >= 100
                    ? "⚡ Hebat! Terus asah kecepatan analisismu!"
                    : "💪 Latihan lagi untuk memecahkan rekor barumu!"}
                </p>
              </div>

              {/* Score Breakdown Cards */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold">Benar</div>
                  <div className="text-base font-black text-emerald-600 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{correctCount}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold">Akurasi</div>
                  <div className="text-base font-black text-blue-600">
                    {accuracy}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold">Max Streak</div>
                  <div className="text-base font-black text-orange-600 flex items-center justify-center gap-0.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{bestStreak}x</span>
                  </div>
                </div>
              </div>

              {/* Highscore Callout */}
              {score >= highScore && score > 0 && (
                <div className="py-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  <span>Rekor Baru Tercapai! 🎉</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={startGame}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Main Lagi</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
