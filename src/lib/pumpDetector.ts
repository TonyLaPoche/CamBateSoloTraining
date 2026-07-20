/**
 * Détecte un cycle haut/bas (pump) à partir de la position Y normalisée de la main.
 * Y MediaPipe : 0 = haut de l'image, 1 = bas.
 */
export type PumpPhase = "idle" | "up" | "down";

export type PumpDetectorState = {
  phase: PumpPhase;
  lastY: number | null;
  peakY: number;
  valleyY: number;
  lastPumpAt: number;
};

export type PumpDetectorResult = {
  state: PumpDetectorState;
  pumped: boolean;
};

const AMPLITUDE_MIN = 0.045;
const COOLDOWN_MS = 180;
const SMOOTH = 0.35;

export function createPumpDetector(): PumpDetectorState {
  return {
    phase: "idle",
    lastY: null,
    peakY: 0,
    valleyY: 1,
    lastPumpAt: 0,
  };
}

export function stepPumpDetector(
  state: PumpDetectorState,
  rawY: number,
  now = performance.now(),
): PumpDetectorResult {
  const y =
    state.lastY == null ? rawY : state.lastY * (1 - SMOOTH) + rawY * SMOOTH;

  let phase = state.phase;
  let peakY = state.peakY;
  let valleyY = state.valleyY;
  let lastPumpAt = state.lastPumpAt;
  let pumped = false;

  if (phase === "idle") {
    peakY = y;
    valleyY = y;
    phase = "down";
  } else if (phase === "down") {
    if (y > valleyY) valleyY = y;
    // Main remonte après un creux suffisant
    if (y < valleyY - AMPLITUDE_MIN * 0.5) {
      peakY = y;
      phase = "up";
    }
  } else if (phase === "up") {
    if (y < peakY) peakY = y;
    // Main redescend après un sommet → 1 pump
    if (y > peakY + AMPLITUDE_MIN * 0.5) {
      const amplitude = valleyY - peakY;
      if (amplitude >= AMPLITUDE_MIN && now - lastPumpAt >= COOLDOWN_MS) {
        pumped = true;
        lastPumpAt = now;
      }
      valleyY = y;
      phase = "down";
    }
  }

  return {
    pumped,
    state: { phase, lastY: y, peakY, valleyY, lastPumpAt },
  };
}

/** Landmark palm approx = moyenne wrist + middle MCP */
export function palmY(
  landmarks: Array<{ x: number; y: number; z: number }>,
): number {
  const wrist = landmarks[0];
  const middle = landmarks[9];
  if (!wrist || !middle) return landmarks[0]?.y ?? 0.5;
  return (wrist.y + middle.y) / 2;
}
