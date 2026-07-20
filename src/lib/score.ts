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

/** Multiplicateur de combo (style clicker) */
export function comboMultiplier(combo: number): number {
  if (combo >= 50) return 5;
  if (combo >= 25) return 3;
  if (combo >= 10) return 2;
  if (combo >= 5) return 1.5;
  return 1;
}

export function milestoneFor(pumps: number): number | null {
  const milestones = [10, 25, 50, 100, 250, 500, 1000];
  return milestones.includes(pumps) ? pumps : null;
}
