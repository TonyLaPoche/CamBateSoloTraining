import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  HandLandmarker,
  type FaceLandmarkerResult,
  type HandLandmarkerResult,
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
  isMobilePerfProfile,
  visionPerfProfile,
  type VisionPerfProfile,
} from "@/lib/devicePerf";
import {
  clearCanvas,
  drawCursor,
  drawFaceMask,
  drawHandSkeleton,
  drawHudButtons,
} from "@/lib/drawVision";
import {
  faceZones,
  isPoppersHand,
  isVapeUnderMouth,
  parseFaceExpression,
  type FaceExpression,
  type FaceHandAction,
} from "@/lib/faceFeatures";
import {
  isNonDominantHand,
  pickPreferredHand,
  type HandDominance,
} from "@/lib/handDominance";
import {
  dist,
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

/** Distance normalisée max pour considérer 2 mains « jointes » */
const HANDS_JOINED_DIST = 0.13;

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
  handsJoined: boolean;
};

type Options = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  enabled: boolean;
  overlays: OverlayFlags;
  session: SessionFlags;
  handDominance?: HandDominance;
  /** Labels HUD cam (i18n) */
  hudLabels?: import("@/lib/camHud").HudLayoutOpts["labels"];
  onPump: () => void;
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
  handsJoined: false,
};

async function createHandLandmarker(
  vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
  profile: VisionPerfProfile,
  delegate: "GPU" | "CPU",
) {
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: HAND_MODEL, delegate },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: profile.handDetection,
    minHandPresenceConfidence: profile.handPresence,
    minTrackingConfidence: profile.handTracking,
  });
}

async function createFaceLandmarker(
  vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
  delegate: "GPU" | "CPU",
) {
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: FACE_MODEL, delegate },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
    minFaceDetectionConfidence: 0.45,
    minFacePresenceConfidence: 0.45,
    minTrackingConfidence: 0.45,
  });
}

function fitCanvasSize(
  videoW: number,
  videoH: number,
  maxW: number,
): { w: number; h: number } {
  if (videoW <= maxW) return { w: videoW, h: videoH };
  const scale = maxW / videoW;
  return {
    w: Math.round(videoW * scale),
    h: Math.round(videoH * scale),
  };
}

export function useVisionSession({
  videoRef,
  canvasRef,
  enabled,
  overlays,
  session,
  handDominance = "auto",
  hudLabels,
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
  const lastHandInferRef = useRef(0);
  const lastFaceInferRef = useRef(0);
  const lastHandResultRef = useRef<HandLandmarkerResult | null>(null);
  const lastFaceResultRef = useRef<FaceLandmarkerResult | null>(null);
  const statusRef = useRef<VisionStatus>("idle");
  const statusDebounceRef = useRef(0);
  const handCountRef = useRef(0);
  const faceStateKeyRef = useRef("");
  const profileRef = useRef(visionPerfProfile(false));
  const fastPumpRef = useRef(false);

  const overlaysRef = useRef(overlays);
  overlaysRef.current = overlays;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const dominanceRef = useRef(handDominance);
  dominanceRef.current = handDominance;
  const hudLabelsRef = useRef(hudLabels);
  hudLabelsRef.current = hudLabels;
  const onPumpRef = useRef(onPump);
  onPumpRef.current = onPump;
  const onFaceTickRef = useRef(onFaceActionTick);
  onFaceTickRef.current = onFaceActionTick;
  const onHudRef = useRef(onHudAction);
  onHudRef.current = onHudAction;

  const setStatusSafe = useCallback((next: VisionStatus) => {
    if (statusRef.current === next) return;
    if (
      (statusRef.current === "tracking" || statusRef.current === "no-hand") &&
      (next === "tracking" || next === "no-hand")
    ) {
      if (statusDebounceRef.current) window.clearTimeout(statusDebounceRef.current);
      statusDebounceRef.current = window.setTimeout(() => {
        if (statusRef.current === next) return;
        statusRef.current = next;
        setStatus(next);
      }, 280);
      return;
    }
    if (statusDebounceRef.current) {
      window.clearTimeout(statusDebounceRef.current);
      statusDebounceRef.current = 0;
    }
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

    const mobile = isMobilePerfProfile();
    const profile = visionPerfProfile(mobile);
    profileRef.current = profile;
    fastPumpRef.current = mobile;

    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        if (cancelled) return;

        let hands: HandLandmarker;
        let face: FaceLandmarker;
        try {
          [hands, face] = await Promise.all([
            createHandLandmarker(vision, profile, "GPU"),
            createFaceLandmarker(vision, "GPU"),
          ]);
        } catch {
          // Fallback CPU (certains mobiles WebGL flaky)
          [hands, face] = await Promise.all([
            createHandLandmarker(vision, profile, "CPU"),
            createFaceLandmarker(vision, "CPU"),
          ]);
        }

        if (cancelled) {
          hands.close();
          face.close();
          return;
        }

        handRef.current = hands;
        faceRef.current = face;
        pumpDetectors.current = new Map();
        lastHandResultRef.current = null;
        lastFaceResultRef.current = null;
        setStatusSafe("ready");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Vision init failed");
        setStatusSafe("error");
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (statusDebounceRef.current) window.clearTimeout(statusDebounceRef.current);
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
      const profile = profileRef.current;

      if (
        video &&
        canvas &&
        hands &&
        face &&
        video.readyState >= 2 &&
        !video.paused
      ) {
        const now = performance.now();
        const handInterval = sess.fapping
          ? profile.handIntervalMs
          : Math.max(profile.handIntervalMs, profile.liteDraw ? 66 : 0);
        const faceInterval = ov.showFace
          ? profile.faceIntervalMs
          : Math.max(profile.faceIntervalMs, profile.liteDraw ? 160 : 80);

        // Inférence mains prioritaires (tracking fap)
        if (now - lastHandInferRef.current >= handInterval) {
          try {
            lastHandResultRef.current = hands.detectForVideo(video, now);
            lastHandInferRef.current = now;
          } catch {
            // timestamp / frame glitch — skip
          }
        }

        // Visage moins fréquent (bonus yeux/bouche)
        if (now - lastFaceInferRef.current >= faceInterval) {
          try {
            const faceTs = now + 0.001;
            lastFaceResultRef.current = face.detectForVideo(video, faceTs);
            lastFaceInferRef.current = now;
          } catch {
            // skip
          }
        }

        const handResult = lastHandResultRef.current;
        const faceResult = lastFaceResultRef.current;
        if (!handResult) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        const needDraw = ov.showHands || ov.showFace || ov.showHud;
        const videoW = video.videoWidth || 640;
        const videoH = video.videoHeight || 480;
        const { w, h } = fitCanvasSize(videoW, videoH, profile.maxCanvasWidth);

        const faceLm = faceResult?.faceLandmarks[0] ?? null;
        const blends = faceResult?.faceBlendshapes?.[0]?.categories;
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
        const mode = dominanceRef.current;

        let faceAction: FaceHandAction = "none";
        const pumpHands: TrackedHand[] = [];
        const faceHands: TrackedHand[] = [];

        for (const hand of tracked) {
          const palm = palmCenter(hand.landmarks);
          if (isPoppersHand(palm, zones)) {
            faceHands.push(hand);
            faceAction = "poppers";
            continue;
          }
          if (
            isNonDominantHand(hand.handedness, mode) &&
            isVapeUnderMouth(palm, zones)
          ) {
            faceHands.push(hand);
            if (faceAction !== "poppers") faceAction = "vape";
            continue;
          }
          pumpHands.push(hand);
        }

        let handsJoined = false;
        if (pumpHands.length >= 2) {
          const a = indexMetacarpalPoint(pumpHands[0]!.landmarks);
          const b = indexMetacarpalPoint(pumpHands[1]!.landmarks);
          handsJoined = dist(a, b) <= HANDS_JOINED_DIST;
        }

        const pumpOpts = { fast: fastPumpRef.current };

        if (sess.fapping) {
          const activePumps =
            pumpHands.length > 0
              ? pumpHands
              : tracked.length === 1 && faceAction === "none"
                ? tracked
                : pumpHands;

          if (activePumps.length >= 2 && handsJoined) {
            const preferred =
              pickPreferredHand(activePumps, mode) ?? activePumps[0]!;
            const other =
              activePumps.find((h) => h.key !== preferred.key) ??
              activePumps[1]!;
            const pa = indexMetacarpalPoint(preferred.landmarks);
            const pb = indexMetacarpalPoint(other.landmarks);
            const y = (pa.y + pb.y) / 2;
            const x = (pa.x + pb.x) / 2;
            let det = pumpDetectors.current.get("pump-pair");
            if (!det) {
              det = createPumpDetector();
              pumpDetectors.current.set("pump-pair", det);
            }
            const stepped = stepPumpDetector(det, y, x, now, pumpOpts);
            pumpDetectors.current.set("pump-pair", stepped.state);
            if (stepped.pumped) onPumpRef.current();
          } else if (activePumps.length >= 1) {
            const hand =
              pickPreferredHand(activePumps, mode) ?? activePumps[0]!;
            let det = pumpDetectors.current.get(hand.key);
            if (!det) {
              det = createPumpDetector();
              pumpDetectors.current.set(hand.key, det);
            }
            const mcp = indexMetacarpalPoint(hand.landmarks);
            const stepped = stepPumpDetector(
              det,
              mcp.y,
              mcp.x,
              now,
              pumpOpts,
            );
            pumpDetectors.current.set(hand.key, stepped.state);
            if (stepped.pumped) onPumpRef.current();
          }
        }

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
          handsJoined,
        };
        const key = [
          nextFace.seen,
          nextFace.leftEyeOpen,
          nextFace.rightEyeOpen,
          nextFace.mouthOpen,
          nextFace.tongueOut,
          nextFace.faceAction,
          nextFace.dualHand,
          nextFace.handsJoined,
        ].join("|");
        if (faceStateKeyRef.current !== key) {
          faceStateKeyRef.current = key;
          setFaceState(nextFace);
        }

        setStatusSafe(tracked.length > 0 ? "tracking" : "no-hand");

        // Pas d’overlay → pas de dessin canvas (gros gain mobile)
        if (!needDraw) {
          if (canvas.width > 0 || canvas.height > 0) {
            canvas.width = 0;
            canvas.height = 0;
          }
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }

        const ctx = canvas.getContext("2d", { alpha: true });
        if (ctx) {
          clearCanvas(ctx, w, h);

          // Cam vidéo en miroir CSS → overlays dessinés en X miroir pour coller
          const flipLm = (lms: NormalizedLandmark[]) =>
            lms.map((p) => ({ ...p, x: 1 - p.x, y: p.y, z: p.z }));

          if (ov.showFace && faceLm && !profile.liteDraw) {
            drawFaceMask(ctx, flipLm(faceLm), w, h, expr);
          }

          const hudState: HudRuntimeState = {
            fapping: sess.fapping,
            recording: sess.recording,
            paused: sess.recPaused,
            cumActive: sess.cumActive,
          };
          // Boutons en espace visuel (LTR) — tip aussi converti en miroir
          const buttons = ov.showHud
            ? layoutHudButtons(hudState, {
                compact: h > w || w < 700,
                labels: hudLabelsRef.current,
              })
            : [];

          const interactPool =
            faceHands.length > 0
              ? faceHands
              : tracked.length > 0
                ? tracked
                : [];
          const interact =
            pickPreferredHand(interactPool, mode) ?? interactPool[0] ?? null;
          const interactTipRaw = interact
            ? indexTip(interact.landmarks)
            : null;
          const interactTip = interactTipRaw
            ? { x: 1 - interactTipRaw.x, y: interactTipRaw.y }
            : null;
          const pinching = interact ? isPinching(interact.landmarks) : false;
          const hit =
            ov.showHud && interactTip
              ? hitHudButton(buttons, interactTip)
              : null;
          const requiredMs = hit
            ? dwellMsFor(hit.id, hudState)
            : HUD_DWELL_DEFAULT_MS;

          if (ov.showHud) {
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
              let near: FaceHandAction = "none";
              if (isPoppersHand(palm, zones)) near = "poppers";
              else if (
                isNonDominantHand(hand.handedness, mode) &&
                isVapeUnderMouth(palm, zones)
              ) {
                near = "vape";
              }
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
                    : handsJoined
                      ? "JOINED"
                      : dualHand
                        ? "FAP"
                        : "PUMP";
              drawHandSkeleton(
                ctx,
                flipLm(hand.landmarks),
                w,
                h,
                near === "none" && handsJoined ? "#FBFF4D" : color,
                label,
                near === "none",
                profile.liteDraw,
              );
            }
          }

          if (
            interactTip &&
            (ov.showHands || ov.showHud) &&
            !profile.liteDraw
          ) {
            drawCursor(ctx, interactTip, w, h, "#4D5DFF");
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
