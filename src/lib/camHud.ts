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

/** Boutons sur les bords — coords vidéo brutes (avant miroir CSS) */
export function layoutHudButtons(state: HudRuntimeState): HudButton[] {
  const buttons: HudButton[] = [
    {
      id: "toggle-fap",
      label: state.fapping ? "PAUSE FAP" : "START FAP",
      x: 0.04,
      y: 0.78,
      w: 0.2,
      h: 0.08,
      accent: state.fapping ? "#AF9EFF" : "#FBFF4D",
    },
    {
      id: "gonna-cum",
      label: state.cumActive ? "EDGE…" : "I'M GONNA CUM",
      x: 0.38,
      y: 0.78,
      w: 0.24,
      h: 0.08,
      accent: "#FF0107",
    },
  ];

  if (!state.recording) {
    buttons.push({
      id: "rec-start",
      label: "REC START",
      x: 0.76,
      y: 0.78,
      w: 0.2,
      h: 0.08,
      accent: "#F41141",
    });
  } else {
    buttons.push({
      id: "rec-pause",
      label: state.paused ? "REC RESUME" : "REC PAUSE",
      x: 0.64,
      y: 0.78,
      w: 0.16,
      h: 0.08,
      accent: "#FBFF4D",
    });
    buttons.push({
      id: "rec-stop",
      label: "REC STOP",
      x: 0.82,
      y: 0.78,
      w: 0.14,
      h: 0.08,
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

export const HUD_DWELL_MS = 550;

export function stepDwell(
  dwell: DwellState,
  hit: HudButton | null,
  pinching: boolean,
  now: number,
): { dwell: DwellState; fired: HudAction | null } {
  if (!hit) return { dwell: { action: null, since: 0 }, fired: null };

  // Pinch = click immédiat
  if (pinching) {
    return { dwell: { action: null, since: 0 }, fired: hit.id };
  }

  if (dwell.action !== hit.id) {
    return { dwell: { action: hit.id, since: now }, fired: null };
  }

  if (now - dwell.since >= HUD_DWELL_MS) {
    return { dwell: { action: null, since: 0 }, fired: hit.id };
  }

  return { dwell, fired: null };
}

export function dwellProgress(
  dwell: DwellState,
  hit: HudButton | null,
  now: number,
): number {
  if (!hit || dwell.action !== hit.id || !dwell.since) return 0;
  return Math.min(1, (now - dwell.since) / HUD_DWELL_MS);
}
