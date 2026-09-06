import {
  FilesetResolver,
  FaceLandmarker,
  FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

let faceLandmarkerInstance: FaceLandmarker | null = null;
let isLoadingLandmarker = false;

/**
 * Inisialisasi singleton FaceLandmarker dari MediaPipe Tasks Vision.
 * Menggunakan WASM & model ringan Google CDN untuk eksekusi real-time di GPU/CPU browser.
 */
export async function getFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (typeof window === "undefined") return null;
  if (faceLandmarkerInstance) return faceLandmarkerInstance;

  if (isLoadingLandmarker) {
    // Tunggu sampai inisialisasi selesai jika sedang loading
    while (isLoadingLandmarker && !faceLandmarkerInstance) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return faceLandmarkerInstance;
  }

  isLoadingLandmarker = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: false,
    });

    return faceLandmarkerInstance;
  } catch (error) {
    console.warn(
      "[FaceLandmarker] GPU delegate gagal, mencoba CPU fallback...",
      error
    );
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
      });
      return faceLandmarkerInstance;
    } catch (cpuError) {
      console.error("[FaceLandmarker] Gagal inisialisasi model:", cpuError);
      return null;
    }
  } finally {
    isLoadingLandmarker = false;
  }
}

export interface LivenessStatus {
  hasFace: boolean;
  isBlinking: boolean;
  isSmiling: boolean;
  livenessVerified: boolean;
  feedbackText: string;
  confidence: number;
}

/**
 * Mengevaluasi frame video untuk deteksi wajah & verifikasi liveness
 * (Kedipan mata / Senyuman natural).
 */
export function evaluateFaceFrame(
  result: FaceLandmarkerResult | null
): LivenessStatus {
  if (!result || !result.faceLandmarks || result.faceLandmarks.length === 0) {
    return {
      hasFace: false,
      isBlinking: false,
      isSmiling: false,
      livenessVerified: false,
      feedbackText: "Posisikan wajah Anda di depan kamera",
      confidence: 0,
    };
  }

  const blendshapes = result.faceBlendshapes?.[0]?.categories || [];

  // Helper untuk membaca nilai blendshape score
  const getScore = (name: string) =>
    blendshapes.find((b) => b.categoryName === name)?.score || 0;

  const eyeBlinkLeft = getScore("eyeBlinkLeft");
  const eyeBlinkRight = getScore("eyeBlinkRight");
  const mouthSmileLeft = getScore("mouthSmileLeft");
  const mouthSmileRight = getScore("mouthSmileRight");
  const jawOpen = getScore("jawOpen");

  // Deteksi Kedip (Kedua mata atau salah satu mata tertutup cukup)
  const isBlinking =
    (eyeBlinkLeft > 0.45 && eyeBlinkRight > 0.45) ||
    eyeBlinkLeft > 0.6 ||
    eyeBlinkRight > 0.6;

  // Deteksi Senyum
  const isSmiling =
    (mouthSmileLeft > 0.35 && mouthSmileRight > 0.35) ||
    mouthSmileLeft > 0.5 ||
    mouthSmileRight > 0.5;

  const isLively = isBlinking || isSmiling || jawOpen > 0.45;

  let feedback = "Wajah Terdeteksi — Silakan kedipkan mata atau tersenyum";
  if (isBlinking) {
    feedback = "Wajah Terdeteksi! (Kedipan Terverifikasi ✓)";
  } else if (isSmiling) {
    feedback = "Wajah Terdeteksi! (Senyuman Terverifikasi ✓)";
  }

  return {
    hasFace: true,
    isBlinking,
    isSmiling,
    livenessVerified: isLively,
    feedbackText: feedback,
    confidence: Math.max(eyeBlinkLeft, eyeBlinkRight, mouthSmileLeft, mouthSmileRight, 0.9),
  };
}
