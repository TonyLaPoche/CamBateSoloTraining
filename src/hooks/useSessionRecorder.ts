import { useCallback, useRef, useState } from "react";

type Options = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
  getHud: () => { pumps: number; score: number; combo: number; multiplier: number };
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

export function useSessionRecorder({ videoRef, overlayRef, getHud }: Options) {
  const [recording, setRecording] = useState(false);
  const [lastBlobUrl, setLastBlobUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const composeRafRef = useRef<number>(0);
  const composeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const stopCompose = useCallback(() => {
    if (composeRafRef.current) cancelAnimationFrame(composeRafRef.current);
    composeRafRef.current = 0;
  }, []);

  const start = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    if (lastBlobUrl) {
      URL.revokeObjectURL(lastBlobUrl);
      setLastBlobUrl(null);
    }

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    composeCanvasRef.current = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paint = () => {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -w, 0, w, h);
      ctx.restore();

      const overlay = overlayRef.current;
      if (overlay && overlay.width > 0) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(overlay, -w, 0, w, h);
        ctx.restore();
      }

      const hud = getHud();
      // Score HUD
      ctx.fillStyle = "rgba(10,10,10,0.55)";
      ctx.fillRect(24, 24, 280, 110);
      ctx.fillStyle = "#FBFF4D";
      ctx.font = "700 28px Mazzard, system-ui, sans-serif";
      ctx.fillText(`${hud.pumps} PUMPS`, 40, 62);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 18px Mazzard, system-ui, sans-serif";
      ctx.fillText(`SCORE ${Math.floor(hud.score)}`, 40, 92);
      ctx.fillStyle = "#AF9EFF";
      ctx.font = "500 14px Mazzard, system-ui, sans-serif";
      ctx.fillText(
        `COMBO x${hud.combo} · ×${hud.multiplier}`,
        40,
        116,
      );

      // LIVE badge
      ctx.fillStyle = "#F41141";
      ctx.beginPath();
      ctx.arc(w - 48, 40, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 14px Mazzard, system-ui, sans-serif";
      ctx.fillText("REC", w - 100, 45);

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
      const url = URL.createObjectURL(blob);
      setLastBlobUrl(url);
      setRecording(false);
      recorderRef.current = null;
    };
    recorder.start(250);
    recorderRef.current = recorder;
    setRecording(true);
  }, [videoRef, overlayRef, getHud, lastBlobUrl, stopCompose]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      stopCompose();
      setRecording(false);
      return;
    }
    recorder.stop();
  }, [stopCompose]);

  const download = useCallback(() => {
    if (!lastBlobUrl) return;
    const a = document.createElement("a");
    a.href = lastBlobUrl;
    a.download = `cambate-session-${Date.now()}.webm`;
    a.click();
  }, [lastBlobUrl]);

  const clearClip = useCallback(() => {
    if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
    setLastBlobUrl(null);
  }, [lastBlobUrl]);

  return { recording, lastBlobUrl, start, stop, download, clearClip };
}
