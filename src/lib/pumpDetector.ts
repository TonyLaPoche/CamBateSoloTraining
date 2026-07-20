import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { Point } from "./handGeometry";

/**
 * Détecte un cycle haut/bas (pump) sur la zone métacarpe index.
 * Y MediaPipe : 0 = haut de l'image, 1 = bas.
 * N'accepte le cycle que si le déplacement est majoritairement vertical.
 */
export type PumpPhase = "idle" | "up" | "down";

export type PumpDetectorState = {
  phase: PumpPhase;
  lastY: number | null;
  lastX: number | null;
  peakY: number;
  valleyY: number;
  lastPumpAt: number;
  /** Cumul |Δy| / |Δx| sur le stroke courant */
  strokeVert: number;
  strokeHoriz: number;
};

export type PumpDetectorResult = {
  state: PumpDetectorState;
  pumped: boolean;
};

/** Amplitude min sur MCP index (plus localisée que la paume) */
const AMPLITUDE_MIN = 0.032;
const AMPLITUDE_MIN_FAST = 0.026;
const COOLDOWN_MS = 160;
const COOLDOWN_MS_FAST = 110;
const SMOOTH = 0.4;
const SMOOTH_FAST = 0.22;
/** Le stroke doit être clairement plus vertical qu'horizontal */
const VERTICAL_RATIO = 1.25;
const VERTICAL_RATIO_FAST = 1.1;

export type PumpDetectorOptions = {
  /** Moins de lissage + seuil plus bas — mieux pour fap rapide (mobile) */
  fast?: boolean;
};

export function createPumpDetector(): PumpDetectorState {
  return {
    phase: "idle",
    lastY: null,
    lastX: null,
    peakY: 0,
    valleyY: 1,
    lastPumpAt: 0,
    strokeVert: 0,
    strokeHoriz: 0,
  };
}

export function stepPumpDetector(
  state: PumpDetectorState,
  rawY: number,
  rawX = 0.5,
  now = performance.now(),
  opts: PumpDetectorOptions = {},
): PumpDetectorResult {
  const fast = opts.fast === true;
  const smooth = fast ? SMOOTH_FAST : SMOOTH;
  const ampMin = fast ? AMPLITUDE_MIN_FAST : AMPLITUDE_MIN;
  const cooldown = fast ? COOLDOWN_MS_FAST : COOLDOWN_MS;
  const vertRatio = fast ? VERTICAL_RATIO_FAST : VERTICAL_RATIO;

  const y =
    state.lastY == null ? rawY : state.lastY * (1 - smooth) + rawY * smooth;
  const x =
    state.lastX == null ? rawX : state.lastX * (1 - smooth) + rawX * smooth;

  let phase = state.phase;
  let peakY = state.peakY;
  let valleyY = state.valleyY;
  let lastPumpAt = state.lastPumpAt;
  let strokeVert = state.strokeVert;
  let strokeHoriz = state.strokeHoriz;
  let pumped = false;

  if (state.lastY != null && state.lastX != null) {
    strokeVert += Math.abs(y - state.lastY);
    strokeHoriz += Math.abs(x - state.lastX);
  }

  const mostlyVertical =
    strokeVert >= strokeHoriz * vertRatio || strokeHoriz < 0.01;

  if (phase === "idle") {
    peakY = y;
    valleyY = y;
    strokeVert = 0;
    strokeHoriz = 0;
    phase = "down";
  } else if (phase === "down") {
    if (y > valleyY) valleyY = y;
    if (y < valleyY - ampMin * 0.4) {
      peakY = y;
      phase = "up";
    }
  } else if (phase === "up") {
    if (y < peakY) peakY = y;
    if (y > peakY + ampMin * 0.4) {
      const amplitude = valleyY - peakY;
      if (
        amplitude >= ampMin &&
        mostlyVertical &&
        now - lastPumpAt >= cooldown
      ) {
        pumped = true;
        lastPumpAt = now;
      }
      valleyY = y;
      strokeVert = 0;
      strokeHoriz = 0;
      phase = "down";
    }
  }

  return {
    pumped,
    state: {
      phase,
      lastY: y,
      lastX: x,
      peakY,
      valleyY,
      lastPumpAt,
      strokeVert,
      strokeHoriz,
    },
  };
}

/**
 * Zone métacarpe proche de l'index :
 * 5 = INDEX_FINGER_MCP, 6 = INDEX_PIP, 9 = MIDDLE_FINGER_MCP
 */
export function indexMetacarpalPoint(
  landmarks: Array<{ x: number; y: number; z?: number }> | NormalizedLandmark[],
): Point {
  const mcp = landmarks[5];
  const pip = landmarks[6];
  const midMcp = landmarks[9];
  if (!mcp) {
    const fallback = landmarks[0];
    return { x: fallback?.x ?? 0.5, y: fallback?.y ?? 0.5 };
  }
  if (pip && midMcp) {
    return {
      x: mcp.x * 0.55 + pip.x * 0.25 + midMcp.x * 0.2,
      y: mcp.y * 0.55 + pip.y * 0.25 + midMcp.y * 0.2,
    };
  }
  if (pip) {
    return {
      x: mcp.x * 0.7 + pip.x * 0.3,
      y: mcp.y * 0.7 + pip.y * 0.3,
    };
  }
  return { x: mcp.x, y: mcp.y };
}
