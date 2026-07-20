import type { Point } from "./handGeometry";

export type HudAction =
  | "toggle-fap"
  | "rec-start"
  | "rec-pause"
  | "rec-stop"
  | "gonna-cum";

export type HudButton = {
  id: HudAction;
  label: string;
  /** Normalized rect in video space (0–1), pre-mirror */
  x: number;
  y: number;
  w: number;
  h: number;
  accent: string;
};

export type HudRuntimeState = {
  fapping: boolean;
  recording: boolean;
  paused: boolean;
  cumActive: boolean;
};

/** Boutons en haut de la cam — 3 slots */
export function layoutHudButtons(state: HudRuntimeState): HudButton[] {
  const y = 0.028;
  const h = 0.09;
  const buttons: HudButton[] = [
    {
      id: "toggle-fap",
      label: state.fapping ? "PAUSE FAP" : "START FAP",
      x: 0.03,
      y,
      w: 0.28,
      h,
      accent: state.fapping ? "#AF9EFF" : "#FBFF4D",
    },
    {
      id: "gonna-cum",
      label: state.cumActive ? "EDGE…" : "I'M GONNA CUM",
      x: 0.36,
      y,
      w: 0.28,
      h,
      accent: "#FF0107",
    },
  ];

  if (!state.recording) {
    buttons.push({
      id: "rec-start",
      label: "REC START",
      x: 0.69,
      y,
      w: 0.28,
      h,
      accent: "#F41141",
    });
  } else {
    buttons.push({
      id: "rec-pause",
      label: state.paused ? "RESUME" : "PAUSE",
      x: 0.69,
      y,
      w: 0.13,
      h,
      accent: "#FBFF4D",
    });
    buttons.push({
      id: "rec-stop",
      label: "STOP",
      x: 0.84,
      y,
      w: 0.13,
      h,
      accent: "#F41141",
    });
  }

  return buttons;
}

export function hitHudButton(
  buttons: HudButton[],
  tip: Point,
): HudButton | null {
  for (const b of buttons) {
    if (
      tip.x >= b.x &&
      tip.x <= b.x + b.w &&
      tip.y >= b.y &&
      tip.y <= b.y + b.h
    ) {
      return b;
    }
  }
  return null;
}

export type DwellState = {
  action: HudAction | null;
  since: number;
};

/** Hover par défaut (start fap, rec, cum confirm) */
export const HUD_DWELL_DEFAULT_MS = 1200;
/** Hover pour PAUSE / arrêter le fap */
export const HUD_DWELL_STOP_MS = 2000;

export function dwellMsFor(
  action: HudAction,
  state: HudRuntimeState,
): number {
  if (action === "toggle-fap" && state.fapping) return HUD_DWELL_STOP_MS;
  return HUD_DWELL_DEFAULT_MS;
}

/** Pinch instant seulement sur les boutons rec */
export function allowPinchInstant(action: HudAction): boolean {
  return (
    action === "rec-start" ||
    action === "rec-pause" ||
    action === "rec-stop"
  );
}

export function stepDwell(
  dwell: DwellState,
  hit: HudButton | null,
  pinching: boolean,
  now: number,
  requiredMs: number,
  pinchInstant: boolean,
): { dwell: DwellState; fired: HudAction | null } {
  if (!hit) return { dwell: { action: null, since: 0 }, fired: null };

  if (pinching && pinchInstant) {
    return { dwell: { action: null, since: 0 }, fired: hit.id };
  }

  if (dwell.action !== hit.id) {
    return { dwell: { action: hit.id, since: now }, fired: null };
  }

  if (now - dwell.since >= requiredMs) {
    return { dwell: { action: null, since: 0 }, fired: hit.id };
  }

  return { dwell, fired: null };
}

export function dwellProgress(
  dwell: DwellState,
  hit: HudButton | null,
  now: number,
  requiredMs: number,
): number {
  if (!hit || dwell.action !== hit.id || !dwell.since) return 0;
  return Math.min(1, (now - dwell.since) / requiredMs);
}
