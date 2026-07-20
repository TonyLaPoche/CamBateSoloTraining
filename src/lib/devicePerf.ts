/** Profil perf : mobile / tactile vs desktop. */

export function isMobilePerfProfile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
}

/** Contraintes cam — éviter 4K qui tue MediaPipe sur tel. */
export function cameraConstraints(
  mobile: boolean,
): MediaTrackConstraints {
  if (mobile) {
    return {
      facingMode: "user",
      width: { ideal: 960, max: 1280 },
      height: { ideal: 540, max: 720 },
      frameRate: { ideal: 30, max: 30 },
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
      // ~30 Hz mains — assez pour fap rapide, charge OK
      handIntervalMs: 33,
      // Visage / bonus : 12 Hz suffisent
      faceIntervalMs: 80,
      maxCanvasWidth: 720,
      liteDraw: true,
      handDetection: 0.4,
      handPresence: 0.4,
      handTracking: 0.35,
    };
  }
  return {
    handIntervalMs: 0,
    faceIntervalMs: 0,
    maxCanvasWidth: 1920,
    liteDraw: false,
    handDetection: 0.5,
    handPresence: 0.5,
    handTracking: 0.5,
  };
}
