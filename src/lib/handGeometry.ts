import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type Point = { x: number; y: number };

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];

export function palmCenter(landmarks: NormalizedLandmark[]): Point {
  const wrist = landmarks[0];
  const middle = landmarks[9];
  if (!wrist || !middle) return { x: 0.5, y: 0.5 };
  return { x: (wrist.x + middle.x) / 2, y: (wrist.y + middle.y) / 2 };
}

export function indexTip(landmarks: NormalizedLandmark[]): Point {
  const tip = landmarks[8];
  return tip ? { x: tip.x, y: tip.y } : palmCenter(landmarks);
}

/** Pinch : pouce (4) proche de l'index (8) */
export function isPinching(landmarks: NormalizedLandmark[], threshold = 0.055): boolean {
  const thumb = landmarks[4];
  const index = landmarks[8];
  if (!thumb || !index) return false;
  const dx = thumb.x - index.x;
  const dy = thumb.y - index.y;
  return Math.hypot(dx, dy) < threshold;
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function handednessLabel(
  categories: Array<{ categoryName?: string; displayName?: string }> | undefined,
): "Left" | "Right" | "Unknown" {
  const name =
    categories?.[0]?.displayName ?? categories?.[0]?.categoryName ?? "";
  if (name.toLowerCase().includes("left")) return "Left";
  if (name.toLowerCase().includes("right")) return "Right";
  return "Unknown";
}
