const STORAGE_KEY = "cbs-solo-stats";

export type SessionStats = {
  totalPumps: number;
  bestCombo: number;
  sessions: number;
  bestScore: number;
};

const DEFAULT: SessionStats = {
  totalPumps: 0,
  bestCombo: 0,
  sessions: 0,
  bestScore: 0,
};

export function loadStats(): SessionStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveStats(stats: SessionStats): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function milestoneFor(pumps: number): number | null {
  const milestones = [10, 25, 50, 100, 250, 500, 1000];
  return milestones.includes(pumps) ? pumps : null;
}

export type BonusInput = {
  handCount: number;
  /** Deux mains proches / jointes pour le dual fap */
  handsJoined: boolean;
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
  mouthOpen: boolean;
};

export type BonusBreakdown = {
  handMult: number;
  eyesMult: number;
  mouthMult: number;
  total: number;
  handKey: "handJoined" | "handSeparated" | "handOne" | "handNone";
  eyesKey: "eyesClosed" | "eyesOne" | "eyesOpen";
  mouthKey: "mouthOpen" | "mouthClosed";
};

/**
 * Multiplicateurs cumulables (produit).
 * Base : 1 fap = 1 point × hand × eyes × mouth
 */
export function computeBonuses(input: BonusInput): BonusBreakdown {
  const handMult =
    input.handCount >= 2 && input.handsJoined ? 2 : 1;

  let eyesMult = 1;
  const bothClosed = !input.leftEyeOpen && !input.rightEyeOpen;
  const oneClosed =
    input.leftEyeOpen !== input.rightEyeOpen;
  if (bothClosed) eyesMult = 4;
  else if (oneClosed) eyesMult = 1.5;

  const mouthMult = input.mouthOpen ? 2 : 1;

  const handKey =
    input.handCount >= 2 && input.handsJoined
      ? "handJoined"
      : input.handCount >= 2
        ? "handSeparated"
        : input.handCount === 1
          ? "handOne"
          : "handNone";

  const eyesKey = bothClosed
    ? "eyesClosed"
    : oneClosed
      ? "eyesOne"
      : "eyesOpen";

  const mouthKey = input.mouthOpen ? "mouthOpen" : "mouthClosed";

  return {
    handMult,
    eyesMult,
    mouthMult,
    total: handMult * eyesMult * mouthMult,
    handKey,
    eyesKey,
    mouthKey,
  };
}

/** Points pour 1 fap (compteur pumps reste +1) */
export function pointsForPump(
  bonuses: BonusBreakdown,
  cumActive: boolean,
): number {
  return bonuses.total * (cumActive ? 3 : 1);
}
