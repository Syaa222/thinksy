"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  Eye,
} from "lucide-react";
import {
  getFaceLandmarker,
  evaluateFaceFrame,
  type LivenessStatus,
} from "@/lib/face-liveness";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  effectiveTime: string;
  isLate: boolean;
  mockTime: string | null;
  onSubmitSuccess: (data: {
    waktu: string;
    status: string;
    poinReward: number;
    streak?: number;
    poinTotal?: number;
  }) => void;
  onPresensiClosed: (time: string, errorMsg?: string) => void;
}

export default function AttendanceModal({
  isOpen,
  onClose,
  effectiveTime,
  isLate,
  mockTime,
  onSubmitSuccess,
  onPresensiClosed,
}: AttendanceModalProps) {
  const [livenessStatus, setLivenessStatus] = useState<LivenessStatus | null>(null);
  const [isLivenessPassed, setIsLivenessPassed] = useState(false);
  const [isFaceModelLoading, setIsFaceModelLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isCameraActiveRef = useRef(false);

  const stopCamera = () => {
    isCameraActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setIsFaceModelLoading(false);
  };

  const handleStartCamera = async () => {
    try {
      setIsCameraActive(true);
      isCameraActiveRef.current = true;
      setIsLivenessPassed(false);
      setLivenessStatus(null);
      setIsFaceModelLoading(true);

      let stream: MediaStream | null = null;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } else {
        const legacyGetUserMedia =
          (navigator as any).getUserMedia ||
          (navigator as any).webkitGetUserMedia ||
          (navigator as any).mozGetUserMedia ||
          (navigator as any).msGetUserMedia;
        if (legacyGetUserMedia) {
          stream = await new Promise((resolve, reject) => {
            legacyGetUserMedia.call(navigator, { video: true }, resolve, reject);
          });
        }
      }

      if (stream) {
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play().catch(() => {});
        }
      }

      // Load MediaPipe FaceLandmarker
      const landmarker = await getFaceLandmarker();
      landmarkerRef.current = landmarker;
      setIsFaceModelLoading(false);

      // Loop Real-Time Face Detection & Liveness Challenge
      const runDetectionLoop = () => {
        if (!isCameraActiveRef.current) return;
        if (
          videoRef.current &&
          videoRef.current.readyState >= 2 &&
          landmarkerRef.current
        ) {
          try {
            const results = landmarkerRef.current.detectForVideo(
              videoRef.current,
              performance.now()
            );
            const evalResult = evaluateFaceFrame(results);
            setLivenessStatus(evalResult);
            if (evalResult.livenessVerified) {
              setIsLivenessPassed(true);
            }
          } catch {
            // silent frame skip
          }
        }
        animationFrameRef.current = requestAnimationFrame(runDetectionLoop);
      };

      animationFrameRef.current = requestAnimationFrame(runDetectionLoop);
    } catch (err: any) {
      console.error("[CAMERA/AI ERROR]", err);
      setIsFaceModelLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleStartCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive, cameraStream]);

  const handleSubmitAttendance = async () => {
    stopCamera();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/siswa/presensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mock_time: mockTime || undefined }),
      });
      const data = await res.json();

      if (res.ok) {
        const timeRecorded = data.presensi?.waktu || effectiveTime;
        const finalStatus =
          data.presensi?.status ||
          (isLate ? "Terlambat" : "Hadir (Tepat Waktu)");
        const rewardPoints = data.poinReward || (isLate ? 3 : 10);

        onSubmitSuccess({
          waktu: timeRecorded,
          status: finalStatus,
          poinReward: rewardPoints,
          streak: data.user?.streak,
          poinTotal: data.user?.poin,
        });
      } else {
        if (data.isClosed || data.status === "Alpha") {
          onPresensiClosed(effectiveTime, data.error);
        } else {
          alert(data.error || "Gagal mencatat presensi.");
        }
      }
    } catch (err) {
      console.error("[SUBMIT ATTENDANCE ERROR]", err);
      alert("Terjadi kesalahan jaringan saat mencatat presensi.");
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-6 max-w-lg w-full relative space-y-4 text-slate-800 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0F172A]">
                Verifikasi Presensi Kehadiran
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Verifikasi instan AI wajah tanpa simpan foto
              </p>
            </div>
          </div>

          <button
            disabled={isSubmitting}
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Viewport / Clean Checkmark Saving State */}
        {isSubmitting ? (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 aspect-[4/3] flex flex-col items-center justify-center p-6 text-center border border-emerald-200/80 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200 select-none">
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/15">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-in zoom-in-50 duration-300" />
              </div>
              <div className="absolute -inset-2 rounded-full bg-emerald-400/20 blur-md -z-10 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-[#0F172A]">
                Wajah Terverifikasi!
              </h4>
              <p className="text-xs text-slate-500 font-medium max-w-xs leading-relaxed">
                Sedang mencatat kehadiran Anda ke sistem...
              </p>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] flex items-center justify-center border border-slate-200/80 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ transform: "scaleX(-1)" }}
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {isCameraActive ? (
              <div className="absolute inset-0 pointer-events-none">
                {/* Top Status Glass Pill */}
                <div className="absolute top-3.5 inset-x-0 flex justify-center pointer-events-none z-10">
                  <div
                    className={`px-4 py-1.5 rounded-full backdrop-blur-md border text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all duration-300 ${
                      isLivenessPassed
                        ? "bg-emerald-500 text-white border-emerald-300 shadow-emerald-500/30 ring-4 ring-emerald-400/30 scale-105"
                        : livenessStatus?.hasFace
                        ? "bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30 animate-pulse"
                        : "bg-slate-900/90 text-white border-white/20"
                    }`}
                  >
                    {isFaceModelLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-300" />
                        <span>Menyiapkan AI Deteksi...</span>
                      </>
                    ) : isLivenessPassed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Wajah Terdeteksi! (Siap Presensi ✓)</span>
                      </>
                    ) : livenessStatus?.hasFace ? (
                      <>
                        <Eye className="w-4 h-4 text-slate-950" />
                        <span>Kedipkan mata atau tersenyum 🙂</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                        <span>Posisikan wajah Anda di depan kamera</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Sleek Modern Viewfinder Brackets */}
                <div className="absolute inset-4 pointer-events-none flex flex-col justify-between transition-colors duration-300">
                  <div className="flex justify-between">
                    <div
                      className={`w-7 h-7 border-t-2 border-l-2 rounded-tl-xl transition-all duration-300 ${
                        isLivenessPassed
                          ? "border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                          : livenessStatus?.hasFace
                          ? "border-amber-400"
                          : "border-white/30"
                      }`}
                    />
                    <div
                      className={`w-7 h-7 border-t-2 border-r-2 rounded-tr-xl transition-all duration-300 ${
                        isLivenessPassed
                          ? "border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                          : livenessStatus?.hasFace
                          ? "border-amber-400"
                          : "border-white/30"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between">
                    <div
                      className={`w-7 h-7 border-b-2 border-l-2 rounded-bl-xl transition-all duration-300 ${
                        isLivenessPassed
                          ? "border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                          : livenessStatus?.hasFace
                          ? "border-amber-400"
                          : "border-white/30"
                      }`}
                    />
                    <div
                      className={`w-7 h-7 border-b-2 border-r-2 rounded-br-xl transition-all duration-300 ${
                        isLivenessPassed
                          ? "border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                          : livenessStatus?.hasFace
                          ? "border-amber-400"
                          : "border-white/30"
                      }`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white space-y-3 bg-slate-950/90">
                <Camera className="w-10 h-10 text-emerald-400 animate-bounce" />
                <p className="text-xs text-slate-300 font-medium max-w-xs">
                  Aktifkan kamera untuk memindai kehadiran Anda hari ini
                </p>
                <button
                  onClick={handleStartCamera}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Aktifkan Kamera
                </button>
              </div>
            )}
          </div>
        )}

        {/* Attendance Time & Reward Badge */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              Jam Presensi:{" "}
              <strong className="text-[#0F172A] font-extrabold">
                {effectiveTime} WIB
              </strong>
            </span>
          </div>
          <div
            className={`px-3 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 ${
              isLate
                ? "bg-amber-50 border border-amber-200 text-amber-800"
                : "bg-emerald-50 border border-emerald-200 text-emerald-800"
            }`}
          >
            {isLate ? (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Terlambat (+3 Poin)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tepat Waktu (+10 Poin)</span>
              </>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className={`flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition ${
              isSubmitting
                ? "opacity-30 cursor-not-allowed pointer-events-none"
                : "cursor-pointer"
            }`}
          >
            Batal
          </button>

          <button
            type="button"
            disabled={!isCameraActive || !isLivenessPassed || isSubmitting}
            onClick={handleSubmitAttendance}
            className={`flex-1 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-sm ${
              isSubmitting
                ? "bg-emerald-600 text-white opacity-80 cursor-wait pointer-events-none"
                : isLivenessPassed
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 hover:scale-[1.01] cursor-pointer"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Menyimpan Presensi...</span>
              </>
            ) : isLivenessPassed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Konfirmasi Hadir</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 text-slate-400" />
                <span>Menunggu Deteksi Wajah</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
