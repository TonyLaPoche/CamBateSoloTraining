import { useCallback, useRef, useState } from "react";

type Options = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
  getHud: () => {
    pumps: number;
    score: number;
    combo: number;
    multiplier: number;
    fapping: boolean;
    cumActive: boolean;
  };
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
  const [paused, setPaused] = useState(false);
  const [lastBlobUrl, setLastBlobUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const composeRafRef = useRef<number>(0);
  const pausedRef = useRef(false);

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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paint = () => {
      ctx.drawImage(video, 0, 0, w, h);

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
      setLastBlobUrl(URL.createObjectURL(blob));
      setRecording(false);
      pausedRef.current = false;
      setPaused(false);
      recorderRef.current = null;
    };
    recorder.start(250);
    recorderRef.current = recorder;
    setRecording(true);
    pausedRef.current = false;
    setPaused(false);
  }, [videoRef, overlayRef, getHud, lastBlobUrl, stopCompose]);

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

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      stopCompose();
      setRecording(false);
      pausedRef.current = false;
      setPaused(false);
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

  return {
    recording,
    paused,
    lastBlobUrl,
    start,
    pause,
    resume,
    stop,
    download,
  };
}
