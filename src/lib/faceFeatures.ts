import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

/** Contours MediaPipe Face Mesh — yeux & bouche uniquement */
export const LEFT_EYE = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
] as const;

export const RIGHT_EYE = [
  362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384,
  398,
] as const;

export const LIPS_OUTER = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37,
  39, 40, 185,
] as const;

export const LIPS_INNER = [
  78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82,
  81, 80, 191,
] as const;

export type FaceExpression = {
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
  mouthOpen: boolean;
  tongueOut: boolean;
  /** Scores bruts 0–1 pour debug / UI */
  blinkL: number;
  blinkR: number;
  jawOpen: number;
  tongue: number;
};

const DEFAULT_EXPR: FaceExpression = {
  leftEyeOpen: true,
  rightEyeOpen: true,
  mouthOpen: false,
  tongueOut: false,
  blinkL: 0,
  blinkR: 0,
  jawOpen: 0,
  tongue: 0,
};

function scoreOf(
  cats: Array<{ categoryName?: string; score?: number }> | undefined,
  name: string,
): number {
  if (!cats) return 0;
  const hit = cats.find((c) => c.categoryName === name);
  return hit?.score ?? 0;
}

/** EAR fallback si pas de blendshapes */
function eyeAspectRatio(
  landmarks: NormalizedLandmark[],
  indices: readonly number[],
): number {
  const pts = indices
    .map((i) => landmarks[i])
    .filter(Boolean) as NormalizedLandmark[];
  if (pts.length < 6) return 0.3;
  let minY = 1;
  let maxY = 0;
  let minX = 1;
  let maxX = 0;
  for (const p of pts) {
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
  }
  const h = maxY - minY;
  const w = Math.max(1e-4, maxX - minX);
  return h / w;
}

function mouthOpenRatio(landmarks: NormalizedLandmark[]): number {
  const top = landmarks[13];
  const bottom = landmarks[14];
  const left = landmarks[78];
  const right = landmarks[308];
  if (!top || !bottom || !left || !right) return 0;
  const vert = Math.abs(bottom.y - top.y);
  const horiz = Math.max(1e-4, Math.abs(right.x - left.x));
  return vert / horiz;
}

export function parseFaceExpression(
  landmarks: NormalizedLandmark[] | null,
  blendshapes?: Array<{ categoryName?: string; score?: number }>,
): FaceExpression {
  if (!landmarks?.length) return { ...DEFAULT_EXPR };

  const blinkL = scoreOf(blendshapes, "eyeBlinkLeft");
  const blinkR = scoreOf(blendshapes, "eyeBlinkRight");
  const jawOpen = scoreOf(blendshapes, "jawOpen");
  const tongue = scoreOf(blendshapes, "tongueOut");
  const hasBlend = Boolean(blendshapes?.length);

  let leftEyeOpen: boolean;
  let rightEyeOpen: boolean;
  let mouthOpen: boolean;
  let tongueOut: boolean;

  if (hasBlend) {
    leftEyeOpen = blinkL < 0.45;
    rightEyeOpen = blinkR < 0.45;
    mouthOpen = jawOpen > 0.28 || mouthOpenRatio(landmarks) > 0.35;
    tongueOut = tongue > 0.35;
  } else {
    leftEyeOpen = eyeAspectRatio(landmarks, LEFT_EYE) > 0.18;
    rightEyeOpen = eyeAspectRatio(landmarks, RIGHT_EYE) > 0.18;
    const mar = mouthOpenRatio(landmarks);
    mouthOpen = mar > 0.35;
    tongueOut = mar > 0.55;
  }

  return {
    leftEyeOpen,
    rightEyeOpen,
    mouthOpen,
    tongueOut,
    blinkL,
    blinkR,
    jawOpen,
    tongue,
  };
}

export type FaceZone = {
  cx: number;
  cy: number;
  radius: number;
  mouthX: number;
  mouthY: number;
  noseX: number;
  noseY: number;
};

export function faceZones(landmarks: NormalizedLandmark[]): FaceZone | null {
  if (!landmarks.length) return null;
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (const p of landmarks) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const nose = landmarks[1] ?? landmarks[4];
  const mouth = landmarks[13] ?? landmarks[14];
  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    radius: Math.max(maxX - minX, maxY - minY) / 2,
    noseX: nose?.x ?? (minX + maxX) / 2,
    noseY: nose?.y ?? (minY + maxY) / 2,
    mouthX: mouth?.x ?? (minX + maxX) / 2,
    mouthY: mouth?.y ?? minY + (maxY - minY) * 0.72,
  };
}

export type FaceHandAction = "none" | "vape" | "poppers";

/** Poppers : main sur / près de la bouche (inchangé). */
export function isPoppersHand(
  palm: { x: number; y: number },
  zone: FaceZone | null,
): boolean {
  if (!zone) return false;
  const dFace = Math.hypot(palm.x - zone.cx, palm.y - zone.cy);
  if (dFace > zone.radius * 1.45) return false;
  const dMouth = Math.hypot(palm.x - zone.mouthX, palm.y - zone.mouthY);
  const dNose = Math.hypot(palm.x - zone.noseX, palm.y - zone.noseY);
  return dMouth < zone.radius * 0.85 || dMouth <= dNose;
}

/**
 * Vape : main sous la bouche (pas sur le côté), typiquement non-dominante.
 * y MediaPipe augmente vers le bas → sous la bouche = palm.y > mouthY.
 */
export function isVapeUnderMouth(
  palm: { x: number; y: number },
  zone: FaceZone | null,
): boolean {
  if (!zone) return false;
  const under =
    palm.y > zone.mouthY + zone.radius * 0.08 &&
    palm.y < zone.mouthY + zone.radius * 1.35;
  const centered = Math.abs(palm.x - zone.mouthX) < zone.radius * 0.55;
  const nearFace =
    Math.hypot(palm.x - zone.cx, palm.y - zone.cy) < zone.radius * 1.6;
  return under && centered && nearFace;
}

/** @deprecated Prefer isPoppersHand / isVapeUnderMouth */
export function classifyFaceHand(
  palm: { x: number; y: number },
  zone: FaceZone | null,
): FaceHandAction {
  if (isPoppersHand(palm, zone)) return "poppers";
  if (isVapeUnderMouth(palm, zone)) return "vape";
  return "none";
}
