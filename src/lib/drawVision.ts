import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { HudButton } from "./camHud";
import {
  LEFT_EYE,
  LIPS_INNER,
  LIPS_OUTER,
  RIGHT_EYE,
  type FaceExpression,
} from "./faceFeatures";
import { HAND_CONNECTIONS, type Point } from "./handGeometry";

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  ctx.clearRect(0, 0, w, h);
}

export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  w: number,
  h: number,
  color: string,
  roleLabel?: string,
  highlightMcp = false,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.2;
  for (const [a, b] of HAND_CONNECTIONS) {
    const pa = landmarks[a];
    const pb = landmarks[b];
    if (!pa || !pb) continue;
    ctx.beginPath();
    ctx.moveTo(pa.x * w, pa.y * h);
    ctx.lineTo(pb.x * w, pb.y * h);
    ctx.stroke();
  }
  for (const p of landmarks) {
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Zone métacarpe index (5–6–9) — point suivi pour le compteur
  if (highlightMcp) {
    const mcp = landmarks[5];
    const pip = landmarks[6];
    const mid = landmarks[9];
    if (mcp) {
      ctx.beginPath();
      ctx.arc(mcp.x * w, mcp.y * h, 9, 0, Math.PI * 2);
      ctx.strokeStyle = "#FBFF4D";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "rgba(251,255,77,0.35)";
      ctx.fill();
    }
    if (mcp && pip) {
      ctx.beginPath();
      ctx.moveTo(mcp.x * w, mcp.y * h);
      ctx.lineTo(pip.x * w, pip.y * h);
      if (mid) ctx.lineTo(mid.x * w, mid.y * h);
      ctx.closePath();
      ctx.strokeStyle = "rgba(251,255,77,0.85)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  if (roleLabel) {
    const tip = landmarks[8] ?? landmarks[0];
    if (tip) {
      ctx.font = "600 13px Mazzard, system-ui, sans-serif";
      ctx.fillStyle = color;
      ctx.fillText(roleLabel, tip.x * w + 10, tip.y * h - 8);
    }
  }
}

function strokeLoop(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  indices: readonly number[],
  w: number,
  h: number,
  color: string,
  lineWidth: number,
  fill?: string,
) {
  const first = landmarks[indices[0]!];
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(first.x * w, first.y * h);
  for (let i = 1; i < indices.length; i++) {
    const p = landmarks[indices[i]!];
    if (!p) continue;
    ctx.lineTo(p.x * w, p.y * h);
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/** Masque précis : contours yeux + lèvres, couleurs selon expression */
export function drawFaceMask(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  w: number,
  h: number,
  expr: FaceExpression,
) {
  if (landmarks.length < 100) return;

  const eyeOpenColor = "#22c55e";
  const eyeClosedColor = "#4D5DFF";
  const mouthClosedColor = "#AF9EFF";
  const mouthOpenColor = "#FBFF4D";
  const tongueColor = "#FF0107";

  strokeLoop(
    ctx,
    landmarks,
    LEFT_EYE,
    w,
    h,
    expr.leftEyeOpen ? eyeOpenColor : eyeClosedColor,
    expr.leftEyeOpen ? 2.2 : 3,
    expr.leftEyeOpen ? "rgba(34,197,94,0.12)" : "rgba(77,93,255,0.2)",
  );
  strokeLoop(
    ctx,
    landmarks,
    RIGHT_EYE,
    w,
    h,
    expr.rightEyeOpen ? eyeOpenColor : eyeClosedColor,
    expr.rightEyeOpen ? 2.2 : 3,
    expr.rightEyeOpen ? "rgba(34,197,94,0.12)" : "rgba(77,93,255,0.2)",
  );

  const mouthColor = expr.tongueOut
    ? tongueColor
    : expr.mouthOpen
      ? mouthOpenColor
      : mouthClosedColor;
  const mouthFill = expr.tongueOut
    ? "rgba(255,1,7,0.22)"
    : expr.mouthOpen
      ? "rgba(251,255,77,0.15)"
      : "rgba(175,158,255,0.1)";

  strokeLoop(ctx, landmarks, LIPS_OUTER, w, h, mouthColor, 2.4, mouthFill);
  strokeLoop(
    ctx,
    landmarks,
    LIPS_INNER,
    w,
    h,
    mouthColor,
    expr.mouthOpen ? 1.8 : 1.2,
  );

  // Iris si dispo (478 landmarks)
  if (landmarks.length >= 478) {
    for (const idx of [468, 473]) {
      const p = landmarks[idx];
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
    }
  }

  // Labels expression près de la tempe
  const anchor = landmarks[127] ?? landmarks[33] ?? landmarks[0];
  if (anchor) {
    const eyesBoth =
      expr.leftEyeOpen && expr.rightEyeOpen
        ? "YEUX OUVERTS"
        : !expr.leftEyeOpen && !expr.rightEyeOpen
          ? "YEUX FERMÉS"
          : "CLIN D'ŒIL";
    const mouth = expr.tongueOut
      ? "LANGUE DEHORS"
      : expr.mouthOpen
        ? "BOUCHE OUVERTE"
        : "BOUCHE FERMÉE";

    ctx.font = "700 12px Mazzard, system-ui, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    const lx = Math.max(8, anchor.x * w - 4);
    const ly = Math.max(18, anchor.y * h - 28);
    ctx.fillText(eyesBoth, lx, ly);
    ctx.fillStyle = mouthColor;
    ctx.fillText(mouth, lx, ly + 16);
  }
}

export function drawHudButtons(
  ctx: CanvasRenderingContext2D,
  buttons: HudButton[],
  w: number,
  h: number,
  hoverId: string | null,
  progress: number,
) {
  for (const b of buttons) {
    const x = b.x * w;
    const y = b.y * h;
    const bw = b.w * w;
    const bh = b.h * h;
    const active = hoverId === b.id;
    const radius = Math.min(18, bh * 0.35);

    ctx.fillStyle = active ? "rgba(10,10,10,0.75)" : "rgba(10,10,10,0.55)";
    roundRect(ctx, x, y, bw, bh, radius);
    ctx.fill();
    ctx.strokeStyle = b.accent;
    ctx.lineWidth = active ? 2.5 : 1.5;
    roundRect(ctx, x, y, bw, bh, radius);
    ctx.stroke();

    if (active && progress > 0) {
      ctx.fillStyle = `${b.accent}55`;
      roundRect(ctx, x, y, bw * progress, bh, radius);
      ctx.fill();
    }

    // Taille proportionnelle au bouton (lisible en 1080p / 4K)
    const byHeight = bh * 0.42;
    const byWidth = (bw * 0.92) / Math.max(4, b.label.length * 0.58);
    const fontSize = Math.max(18, Math.min(byHeight, byWidth, 36));

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 ${fontSize}px Mazzard, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(b.label, x + bw / 2, y + bh / 2);
  }
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

export function drawCursor(
  ctx: CanvasRenderingContext2D,
  tip: Point | null,
  w: number,
  h: number,
  color: string,
) {
  if (!tip) return;
  ctx.beginPath();
  ctx.arc(tip.x * w, tip.y * h, 10, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(tip.x * w, tip.y * h, 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
