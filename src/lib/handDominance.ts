export type HandDominance = "auto" | "left" | "right";

const STORAGE_KEY = "cbs-hand-dominance";

export function loadHandDominance(): HandDominance {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "auto" || v === "left" || v === "right") return v;
  } catch {
    /* ignore */
  }
  return "auto";
}

export function saveHandDominance(mode: HandDominance): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export type HandSide = "Left" | "Right" | "Unknown";

/** Main dominante selon le mode (MediaPipe = main physique). */
export function isDominantHand(
  side: HandSide,
  mode: HandDominance,
): boolean {
  if (mode === "auto") return true;
  if (side === "Unknown") return false;
  if (mode === "right") return side === "Right";
  return side === "Left";
}

/** Main non-dominante (vape). En auto → Left (profil droitier). */
export function isNonDominantHand(
  side: HandSide,
  mode: HandDominance,
): boolean {
  if (mode === "auto") {
    return side === "Left" || side === "Unknown";
  }
  if (side === "Unknown") return true;
  if (mode === "right") return side === "Left";
  return side === "Right";
}

/** Priorité fap / sélection HUD. */
export function pickPreferredHand<T extends { handedness: HandSide }>(
  hands: T[],
  mode: HandDominance,
): T | null {
  if (hands.length === 0) return null;
  if (hands.length === 1) return hands[0]!;

  if (mode === "auto") {
    const right = hands.find((h) => h.handedness === "Right");
    return right ?? hands[0]!;
  }

  const want = mode === "right" ? "Right" : "Left";
  const match = hands.find((h) => h.handedness === want);
  return match ?? hands[0]!;
}

/** L’autre main (HUD pendant que la dominante fap). */
export function pickOtherHand<T extends { handedness: HandSide }>(
  hands: T[],
  mode: HandDominance,
): T | null {
  if (hands.length === 0) return null;
  if (hands.length === 1) return hands[0]!;
  const pref = pickPreferredHand(hands, mode);
  return hands.find((h) => h !== pref) ?? hands[0]!;
}

/** Mains ordonnées : non-dominante d’abord (visée HUD). */
export function orderHandsForHud<T extends { handedness: HandSide }>(
  hands: T[],
  mode: HandDominance,
): T[] {
  if (hands.length <= 1) return hands;
  const other = pickOtherHand(hands, mode);
  const pref = pickPreferredHand(hands, mode);
  const out: T[] = [];
  if (other) out.push(other);
  if (pref && pref !== other) out.push(pref);
  for (const h of hands) {
    if (!out.includes(h)) out.push(h);
  }
  return out;
}

/** Flip X pour aligner overlays sur une vidéo CSS scaleX(-1). */
export function mirrorX(x: number): number {
  return 1 - x;
}
