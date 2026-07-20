import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import {
  allowPinchInstant,
  dwellMsFor,
  dwellProgress,
  hitHudButton,
  HUD_DWELL_DEFAULT_MS,
  layoutHudButtons,
  stepDwell,
  type DwellState,
  type HudAction,
  type HudRuntimeState,
} from "@/lib/camHud";
import {
  clearCanvas,
  drawCursor,
  drawFaceMask,
  drawHandSkeleton,
  drawHudButtons,
} from "@/lib/drawVision";
import {
  classifyFaceHand,
  faceZones,
  parseFaceExpression,
  type FaceExpression,
  type FaceHandAction,
} from "@/lib/faceFeatures";
import {
  handednessLabel,
  indexTip,
  isPinching,
  palmCenter,
} from "@/lib/handGeometry";
import {
  createPumpDetector,
  indexMetacarpalPoint,
  stepPumpDetector,
  type PumpDetectorState,
} from "@/lib/pumpDetector";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm";
const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export type VisionStatus =
  | "idle"
  | "loading"
  | "ready"
  | "tracking"
  | "no-hand"
  | "error";

export type OverlayFlags = {
  showHands: boolean;
  showFace: boolean;
  showHud: boolean;
};

type SessionFlags = {
  fapping: boolean;
  recording: boolean;
  recPaused: boolean;
  cumActive: boolean;
};

export type VisionFaceState = FaceExpression & {
  seen: boolean;
  faceAction: FaceHandAction;
  dualHand: boolean;
};

type Options = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  enabled: boolean;
  overlays: OverlayFlags;
  session: SessionFlags;
  onPump: (source: "single" | "dual") => void;
  onFaceActionTick: (action: FaceHandAction) => void;
  onHudAction: (action: HudAction) => void;
};

type TrackedHand = {
  landmarks: NormalizedLandmark[];
  handedness: "Left" | "Right" | "Unknown";
  key: string;
};

const IDLE_FACE: VisionFaceState = {
  seen: false,
  leftEyeOpen: true,
  rightEyeOpen: true,
  mouthOpen: false,
  tongueOut: false,
  blinkL: 0,
  blinkR: 0,
  jawOpen: 0,
  tongue: 0,
  faceAction: "none",
  dualHand: false,
};

export function useVisionSession({
  videoRef,
  canvasRef,
  enabled,
  overlays,
  session,
  onPump,
  onFaceActionTick,
  onHudAction,
}: Options) {
  const [status, setStatus] = useState<VisionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [handCount, setHandCount] = useState(0);
  const [faceState, setFaceState] = useState<VisionFaceState>(IDLE_FACE);

  const handRef = useRef<HandLandmarker | null>(null);
  const faceRef = useRef<FaceLandmarker | null>(null);
  const pumpDetectors = useRef<Map<string, PumpDetectorState>>(new Map());
  const dwellRef = useRef<DwellState>({ action: null, since: 0 });
  const lastFireRef = useRef(0);
  const lastFaceTickRef = useRef(0);
  const rafRef = useRef(0);
  const lastTsRef = useRef(-1);
  const statusRef = useRef<VisionStatus>("idle");
  const handCountRef = useRef(0);
  const faceStateKeyRef = useRef("");

  const overlaysRef = useRef(overlays);
  overlaysRef.current = overlays;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const onPumpRef = useRef(onPump);
  onPumpRef.current = onPump;
  const onFaceTickRef = useRef(onFaceActionTick);
  onFaceTickRef.current = onFaceActionTick;
  const onHudRef = useRef(onHudAction);
  onHudRef.current = onHudAction;

  const setStatusSafe = useCallback((next: VisionStatus) => {
    if (statusRef.current === next) return;
    statusRef.current = next;
    setStatus(next);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatusSafe("idle");
      setHandCount(0);
      setFaceState(IDLE_FACE);
      faceStateKeyRef.current = "";
      return;
    }

    let cancelled = false;
    setStatusSafe("loading");
    setError(null);

    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        if (cancelled) return;

        const [hands, face] = await Promise.all([
          HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: HAND_MODEL, delegate: "GPU" },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          }),
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: true,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          }),
        ]);

        if (cancelled) {
          hands.close();
          face.close();
          return;
        }

        handRef.current = hands;
        faceRef.current = face;
        pumpDetectors.current = new Map();
        setStatusSafe("ready");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Vision init failed");
        setStatusSafe("error");
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      handRef.current?.close();
      faceRef.current?.close();
      handRef.current = null;
      faceRef.current = null;
    };
  }, [enabled, setStatusSafe]);

  useEffect(() => {
    if (
      !enabled ||
      status === "loading" ||
      status === "error" ||
      status === "idle"
    ) {
      return;
    }

    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const hands = handRef.current;
      const face = faceRef.current;
      const ov = overlaysRef.current;
      const sess = sessionRef.current;

      if (
        video &&
        canvas &&
        hands &&
        face &&
        video.readyState >= 2 &&
        !video.paused
      ) {
        const now = performance.now();
        if (now !== lastTsRef.current) {
          lastTsRef.current = now;
          const handResult = hands.detectForVideo(video, now);
          const faceResult = face.detectForVideo(video, now);

          const w = video.videoWidth || canvas.clientWidth;
          const h = video.videoHeight || canvas.clientHeight;
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }

          const ctx = canvas.getContext("2d");
          if (ctx) {
            clearCanvas(ctx, w, h);

            const faceLm = faceResult.faceLandmarks[0] ?? null;
            const blends = faceResult.faceBlendshapes?.[0]?.categories;
            const expr = parseFaceExpression(faceLm, blends);
            const zones = faceLm ? faceZones(faceLm) : null;

            const tracked: TrackedHand[] = handResult.landmarks.map(
              (landmarks, i) => {
                const handedness = handednessLabel(handResult.handednesses[i]);
                return {
                  landmarks,
                  handedness,
                  key: `${handedness}-${i}`,
                };
              },
            );

            if (handCountRef.current !== tracked.length) {
              handCountRef.current = tracked.length;
              setHandCount(tracked.length);
            }

            const dualHand = tracked.length >= 2;

            // Classer chaque main : près du visage = vape/poppers, sinon pump
            let faceAction: FaceHandAction = "none";
            const pumpHands: TrackedHand[] = [];
            const faceHands: TrackedHand[] = [];

            for (const hand of tracked) {
              const palm = palmCenter(hand.landmarks);
              const action = classifyFaceHand(palm, zones);
              if (action !== "none") {
                faceHands.push(hand);
                if (faceAction === "none" || action === "poppers") {
                  faceAction = action;
                }
              } else {
                pumpHands.push(hand);
              }
            }

            // Pumps : toutes les mains hors zone visage (1 ou 2 = dual fap)
            if (sess.fapping) {
              const activePumps =
                pumpHands.length > 0 ? pumpHands : tracked.length === 1 && faceAction === "none"
                  ? tracked
                  : pumpHands;

              for (const hand of activePumps) {
                let det = pumpDetectors.current.get(hand.key);
                if (!det) {
                  det = createPumpDetector();
                  pumpDetectors.current.set(hand.key, det);
                }
                const mcp = indexMetacarpalPoint(hand.landmarks);
                const stepped = stepPumpDetector(det, mcp.y, mcp.x, now);
                pumpDetectors.current.set(hand.key, stepped.state);
                if (stepped.pumped) {
                  onPumpRef.current(
                    dualHand && activePumps.length >= 2 ? "dual" : "single",
                  );
                }
              }
            }

            // Tick score vape / poppers tant que main au visage
            if (
              sess.fapping &&
              faceAction !== "none" &&
              now - lastFaceTickRef.current > 400
            ) {
              lastFaceTickRef.current = now;
              onFaceTickRef.current(faceAction);
            }

            const nextFace: VisionFaceState = {
              ...expr,
              seen: Boolean(faceLm),
              faceAction,
              dualHand,
            };
            const key = [
              nextFace.seen,
              nextFace.leftEyeOpen,
              nextFace.rightEyeOpen,
              nextFace.mouthOpen,
              nextFace.tongueOut,
              nextFace.faceAction,
              nextFace.dualHand,
            ].join("|");
            if (faceStateKeyRef.current !== key) {
              faceStateKeyRef.current = key;
              setFaceState(nextFace);
            }

            if (ov.showFace && faceLm) {
              drawFaceMask(ctx, faceLm, w, h, expr);
            }

            // HUD : n'importe quelle main (pinch / dwell)
            const hudState: HudRuntimeState = {
              fapping: sess.fapping,
              recording: sess.recording,
              paused: sess.recPaused,
              cumActive: sess.cumActive,
            };
            const buttons = layoutHudButtons(hudState);
            const tipHand = tracked[0];
            const tipForHud = tipHand ? indexTip(tipHand.landmarks) : null;
            // Prefer non-pumping / face hand for HUD if dual
            const interact =
              faceHands[0] ??
              (tracked.length > 1 ? tracked[1] : tracked[0]);
            const interactTip = interact ? indexTip(interact.landmarks) : tipForHud;
            const pinching = interact ? isPinching(interact.landmarks) : false;
            const hit = interactTip ? hitHudButton(buttons, interactTip) : null;
            const requiredMs = hit
              ? dwellMsFor(hit.id, hudState)
              : HUD_DWELL_DEFAULT_MS;
            const dwellStep = stepDwell(
              dwellRef.current,
              hit,
              pinching && Boolean(hit),
              now,
              requiredMs,
              hit ? allowPinchInstant(hit.id) : false,
            );
            dwellRef.current = dwellStep.dwell;
            if (dwellStep.fired && now - lastFireRef.current > 700) {
              lastFireRef.current = now;
              onHudRef.current(dwellStep.fired);
            }

            if (ov.showHud) {
              drawHudButtons(
                ctx,
                buttons,
                w,
                h,
                hit?.id ?? null,
                dwellProgress(dwellRef.current, hit, now, requiredMs),
              );
            }

            if (ov.showHands) {
              for (const hand of tracked) {
                const palm = palmCenter(hand.landmarks);
                const near = classifyFaceHand(palm, zones);
                const color =
                  near === "poppers"
                    ? "#FF0107"
                    : near === "vape"
                      ? "#AF9EFF"
                      : "#FBFF4D";
                const label =
                  near === "poppers"
                    ? "POPPERS"
                    : near === "vape"
                      ? "VAPE"
                      : dualHand
                        ? "FAP"
                        : "PUMP";
                drawHandSkeleton(
                  ctx,
                  hand.landmarks,
                  w,
                  h,
                  color,
                  label,
                  near === "none",
                );
              }
            }

            if (interactTip && (ov.showHands || ov.showHud)) {
              drawCursor(ctx, interactTip, w, h, "#4D5DFF");
            }

            setStatusSafe(tracked.length > 0 ? "tracking" : "no-hand");
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, status, videoRef, canvasRef, setStatusSafe]);

  return { status, error, handCount, faceState };
}
