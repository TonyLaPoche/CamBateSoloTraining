import { useCallback, useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import {
  createPumpDetector,
  palmY,
  stepPumpDetector,
  type PumpDetectorState,
} from "@/lib/pumpDetector";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export type HandTrackerStatus =
  | "idle"
  | "loading"
  | "ready"
  | "tracking"
  | "no-hand"
  | "error";

type Options = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  enabled: boolean;
  onPump: () => void;
};

export function useHandTracker({
  videoRef,
  canvasRef,
  enabled,
  onPump,
}: Options) {
  const [status, setStatus] = useState<HandTrackerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const detectorRef = useRef<PumpDetectorState>(createPumpDetector());
  const rafRef = useRef<number>(0);
  const lastTsRef = useRef<number>(-1);
  const statusRef = useRef<HandTrackerStatus>("idle");
  const onPumpRef = useRef(onPump);
  onPumpRef.current = onPump;

  const setStatusSafe = useCallback((next: HandTrackerStatus) => {
    if (statusRef.current === next) return;
    statusRef.current = next;
    setStatus(next);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatusSafe("idle");
      return;
    }

    let cancelled = false;
    setStatusSafe("loading");
    setError(null);

    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        if (cancelled) return;
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        detectorRef.current = createPumpDetector();
        setStatusSafe("ready");
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Échec du chargement MediaPipe";
        setError(message);
        setStatusSafe("error");
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, [enabled, setStatusSafe]);

  const drawHands = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      landmarks: NormalizedLandmark[][],
      w: number,
      h: number,
    ) => {
      ctx.clearRect(0, 0, w, h);
      for (const hand of landmarks) {
        ctx.strokeStyle = "#FBFF4D";
        ctx.fillStyle = "#FBFF4D";
        ctx.lineWidth = 2;
        const connections: [number, number][] = [
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
        for (const [a, b] of connections) {
          const pa = hand[a];
          const pb = hand[b];
          if (!pa || !pb) continue;
          ctx.beginPath();
          ctx.moveTo(pa.x * w, pa.y * h);
          ctx.lineTo(pb.x * w, pb.y * h);
          ctx.stroke();
        }
        for (const p of hand) {
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!enabled || status === "loading" || status === "error" || status === "idle") {
      return;
    }

    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (
        video &&
        canvas &&
        landmarker &&
        video.readyState >= 2 &&
        !video.paused
      ) {
        const now = performance.now();
        if (now !== lastTsRef.current) {
          lastTsRef.current = now;
          const result = landmarker.detectForVideo(video, now);
          const w = video.videoWidth || canvas.clientWidth;
          const h = video.videoHeight || canvas.clientHeight;
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }
          const ctx = canvas.getContext("2d");
          if (ctx) {
            if (result.landmarks.length > 0) {
              drawHands(ctx, result.landmarks, w, h);
              const y = palmY(result.landmarks[0]);
              const { state, pumped } = stepPumpDetector(
                detectorRef.current,
                y,
                now,
              );
              detectorRef.current = state;
              if (pumped) onPumpRef.current();
              setStatusSafe("tracking");
            } else {
              ctx.clearRect(0, 0, w, h);
              setStatusSafe("no-hand");
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, status, videoRef, canvasRef, drawHands, setStatusSafe]);

  return { status, error };
}
