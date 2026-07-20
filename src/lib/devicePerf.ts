/** Profil perf : mobile / tactile vs desktop. */

export function isMobilePerfProfile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
}

/** Contraintes cam — mobile : résolution basse pour MediaPipe fluide. */
export function cameraConstraints(
  mobile: boolean,
): MediaTrackConstraints {
  if (mobile) {
    return {
      facingMode: "user",
      width: { ideal: 640, max: 960 },
      height: { ideal: 480, max: 540 },
      frameRate: { ideal: 24, max: 30 },
    };
  }
  return {
    facingMode: "user",
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
  };
}

export type VisionPerfProfile = {
  /** Intervalle min entre deux détect. mains (ms) */
  handIntervalMs: number;
  /** Intervalle min entre deux détect. visage (ms) */
  faceIntervalMs: number;
  /** Largeur max du canvas d’overlay */
  maxCanvasWidth: number;
  /** Dessin squelette allégé */
  liteDraw: boolean;
  /** Confiances Hand Landmarker */
  handDetection: number;
  handPresence: number;
  handTracking: number;
};

export function visionPerfProfile(mobile: boolean): VisionPerfProfile {
  if (mobile) {
    return {
      // ~25 Hz mains — fap rapide OK, charge maîtrisée
      handIntervalMs: 40,
      // Bonus visage : ~8 Hz
      faceIntervalMs: 120,
      maxCanvasWidth: 480,
      liteDraw: true,
      handDetection: 0.4,
      handPresence: 0.4,
      handTracking: 0.35,
    };
  }
  return {
    handIntervalMs: 0,
    faceIntervalMs: 33,
    maxCanvasWidth: 1280,
    liteDraw: false,
    handDetection: 0.5,
    handPresence: 0.5,
    handTracking: 0.5,
  };
}
