import { useCallback, useRef, useState } from "react";

export type RecHudSnapshot = {
  pumps: number;
  score: number;
  combo: number;
  multiplier: number;
  fapping: boolean;
  cumActive: boolean;
  /** Countdown centre : "3", "LET'S FAP!", etc. */
  centerLabel: string | null;
  /** Annonce milestone / toast */
  toast: string | null;
  toastEyebrow: string;
};

type Options = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
  getHud: () => RecHudSnapshot;
};

function pickMimeType(): string | undefined {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

function drawCenterAnnouncement(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  label: string,
) {
  const isBigWord = label.length > 2;
  const boxW = Math.min(w * 0.72, 520);
  const boxH = isBigWord ? Math.min(h * 0.28, 160) : Math.min(h * 0.32, 200);
  const x = (w - boxW) / 2;
  const y = (h - boxH) / 2;

  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.strokeStyle = "rgba(251,255,77,0.35)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, boxW, boxH, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FBFF4D";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = isBigWord
    ? Math.max(28, Math.min(52, boxW / (label.length * 0.55)))
    : Math.max(64, Math.min(120, boxH * 0.55));
  ctx.font = `700 ${fontSize}px Mazzard, system-ui, sans-serif`;
  ctx.fillText(label, w / 2, h / 2);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

function drawMilestoneToast(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  message: string,
  eyebrow: string,
) {
  const boxW = Math.min(w * 0.7, 420);
  const boxH = Math.min(h * 0.16, 100);
  const x = (w - boxW) / 2;
  const y = h * 0.28;

  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.strokeStyle = "rgba(251,255,77,0.4)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, boxW, boxH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#AF9EFF";
  ctx.font = "600 12px Mazzard, system-ui, sans-serif";
  ctx.fillText(eyebrow.toUpperCase(), w / 2, y + boxH * 0.32);
  ctx.fillStyle = "#FBFF4D";
  ctx.font = "700 28px Mazzard, system-ui, sans-serif";
  ctx.fillText(message, w / 2, y + boxH * 0.68);
  ctx.textAlign = "start";
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

export function useSessionRecorder({ videoRef, overlayRef, getHud }: Options) {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lastBlobUrl, setLastBlobUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const composeRafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const lastBlobRef = useRef<Blob | null>(null);
  const stopResolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  const stopCompose = useCallback(() => {
    if (composeRafRef.current) cancelAnimationFrame(composeRafRef.current);
    composeRafRef.current = 0;
  }, []);

  const clearClip = useCallback(() => {
    if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
    setLastBlobUrl(null);
    lastBlobRef.current = null;
  }, [lastBlobUrl]);

  const start = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    clearClip();

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paint = () => {
      // Vidéo miroir (comme l’UI CSS) ; overlay déjà dessiné en X miroir
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();

      // Overlay = HUD cam uniquement pendant le rec (mains/visage masqués côté vision)
      const overlay = overlayRef.current;
      if (overlay && overlay.width > 0) {
        ctx.drawImage(overlay, 0, 0, w, h);
      }

      const hud = getHud();
      ctx.fillStyle = "rgba(10,10,10,0.55)";
      ctx.fillRect(24, 24, 300, 120);
      ctx.fillStyle = "#FBFF4D";
      ctx.font = "700 28px Mazzard, system-ui, sans-serif";
      ctx.fillText(`${hud.pumps} PUMPS`, 40, 62);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 18px Mazzard, system-ui, sans-serif";
      ctx.fillText(`SCORE ${Math.floor(hud.score)}`, 40, 92);
      ctx.fillStyle = "#AF9EFF";
      ctx.font = "500 14px Mazzard, system-ui, sans-serif";
      ctx.fillText(`COMBO x${hud.combo} · ×${hud.multiplier}`, 40, 116);

      if (hud.cumActive) {
        ctx.fillStyle = "#F41141";
        ctx.font = "700 16px Mazzard, system-ui, sans-serif";
        ctx.fillText("I'M GONNA CUM", w / 2 - 70, 48);
      }

      ctx.fillStyle = "#F41141";
      ctx.beginPath();
      ctx.arc(w - 48, 40, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 14px Mazzard, system-ui, sans-serif";
      ctx.fillText(pausedRef.current ? "PAUSE" : "REC", w - 110, 45);

      // Annonces à l’écran (countdown + milestones) — visibles à la relecture
      if (hud.toast) {
        drawMilestoneToast(ctx, w, h, hud.toast, hud.toastEyebrow);
      }
      if (hud.centerLabel) {
        drawCenterAnnouncement(ctx, w, h, hud.centerLabel);
      }

      composeRafRef.current = requestAnimationFrame(paint);
    };
    paint();

    const stream = canvas.captureStream(30);
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 4_000_000,
    });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      stopCompose();
      const blob = new Blob(chunksRef.current, {
        type: mimeType ?? "video/webm",
      });
      lastBlobRef.current = blob;
      setLastBlobUrl(URL.createObjectURL(blob));
      setRecording(false);
      pausedRef.current = false;
      setPaused(false);
      recorderRef.current = null;
      stopResolveRef.current?.(blob);
      stopResolveRef.current = null;
    };
    recorder.start(250);
    recorderRef.current = recorder;
    setRecording(true);
    pausedRef.current = false;
    setPaused(false);
  }, [videoRef, overlayRef, getHud, clearClip, stopCompose]);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.pause();
    pausedRef.current = true;
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    recorder.resume();
    pausedRef.current = false;
    setPaused(false);
  }, []);

  const stop = useCallback((): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      stopCompose();
      setRecording(false);
      pausedRef.current = false;
      setPaused(false);
      return Promise.resolve(lastBlobRef.current);
    }
    return new Promise((resolve) => {
      stopResolveRef.current = resolve;
      recorder.stop();
    });
  }, [stopCompose]);

  const download = useCallback(() => {
    if (!lastBlobUrl) return;
    const a = document.createElement("a");
    a.href = lastBlobUrl;
    a.download = `cambate-session-${Date.now()}.webm`;
    a.click();
  }, [lastBlobUrl]);

  return {
    recording,
    paused,
    lastBlobUrl,
    lastBlobRef,
    start,
    pause,
    resume,
    stop,
    download,
    clearClip,
  };
}
