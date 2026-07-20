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
  handLabel: string;
  eyesLabel: string;
  mouthLabel: string;
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

  const handLabel =
    input.handCount >= 2 && input.handsJoined
      ? "2 mains jointes"
      : input.handCount >= 2
        ? "2 mains (séparées)"
        : input.handCount === 1
          ? "1 main"
          : "0 main";

  const eyesLabel = bothClosed
    ? "Yeux fermés"
    : oneClosed
      ? "1 œil fermé"
      : "Yeux ouverts";

  const mouthLabel = input.mouthOpen ? "Bouche ouverte" : "Bouche fermée";

  return {
    handMult,
    eyesMult,
    mouthMult,
    total: handMult * eyesMult * mouthMult,
    handLabel,
    eyesLabel,
    mouthLabel,
  };
}

/** Points pour 1 fap (compteur pumps reste +1) */
export function pointsForPump(
  bonuses: BonusBreakdown,
  cumActive: boolean,
): number {
  return bonuses.total * (cumActive ? 3 : 1);
}
