import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ControlBar } from "@/components/ControlBar";
import { MilestoneToast } from "@/components/MilestoneToast";
import { OverlayToggles } from "@/components/OverlayToggles";
import { ScoreHud } from "@/components/ScoreHud";
import { useCamera } from "@/hooks/useCamera";
import { useSessionRecorder } from "@/hooks/useSessionRecorder";
import { useVisionSession } from "@/hooks/useVisionSession";
import type { HudAction } from "@/lib/camHud";
import type { FaceHandAction } from "@/lib/faceFeatures";
import {
  comboMultiplier,
  loadStats,
  milestoneFor,
  saveStats,
} from "@/lib/score";

const COMBO_WINDOW_MS = 1800;
const CUM_DURATION_MS = 12_000;

function trackingLabel(
  status: string,
  camReady: boolean,
  camError: string | null,
): string {
  if (camError) return "Caméra bloquée";
  if (!camReady) return "Caméra off";
  switch (status) {
    case "loading":
      return "Chargement vision…";
    case "ready":
    case "tracking":
      return "Tracking OK";
    case "no-hand":
      return "Montre tes mains";
    case "error":
      return "Tracking KO";
    default:
      return "En attente";
  }
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [fapping, setFapping] = useState(false);
  const [cumActive, setCumActive] = useState(false);
  const [pumps, setPumps] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lifetime, setLifetime] = useState(loadStats);
  const [showHands, setShowHands] = useState(true);
  const [showFace, setShowFace] = useState(true);
  const [showHud, setShowHud] = useState(true);

  const lastPumpAtRef = useRef(0);
  const comboRef = useRef(0);
  const cumTimerRef = useRef<number>(0);
  const hudRef = useRef({
    pumps: 0,
    score: 0,
    combo: 0,
    multiplier: 1,
    fapping: false,
    cumActive: false,
  });

  const camera = useCamera(videoRef);
  const baseMult = useMemo(() => comboMultiplier(combo), [combo]);
  const multiplier = baseMult * (cumActive ? 3 : 1);

  useEffect(() => {
    hudRef.current = {
      pumps,
      score,
      combo,
      multiplier,
      fapping,
      cumActive,
    };
  }, [pumps, score, combo, multiplier, fapping, cumActive]);

  const getHud = useCallback(() => hudRef.current, []);

  const recorder = useSessionRecorder({
    videoRef,
    overlayRef,
    getHud,
  });

  const showToast = useCallback((msg: string, ms = 1600) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), ms);
  }, []);

  const onPump = useCallback(
    (source: "single" | "dual") => {
      const now = performance.now();
      const nextCombo =
        now - lastPumpAtRef.current <= COMBO_WINDOW_MS
          ? comboRef.current + 1
          : 1;
      comboRef.current = nextCombo;
      lastPumpAtRef.current = now;
      const dualBonus = source === "dual" ? 1.5 : 1;
      const mult =
        comboMultiplier(nextCombo) * (cumActive ? 3 : 1) * dualBonus;

      setCombo(nextCombo);
      setPumps((p) => {
        const next = p + 1;
        const mile = milestoneFor(next);
        if (mile) showToast(`${mile} PUMPS`);
        return next;
      });
      setScore((s) => s + 10 * mult);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 280);
    },
    [cumActive, showToast],
  );

  const onFaceActionTick = useCallback(
    (action: FaceHandAction) => {
      if (action === "none") return;
      const pts = action === "poppers" ? 25 : 18;
      setScore((s) => s + pts * (cumActive ? 2 : 1));
      // Soft toast only occasionally via score — avoid spam; label in HUD
    },
    [cumActive],
  );

  const handleToggleFap = useCallback(() => {
    setFapping((v) => {
      const next = !v;
      showToast(next ? "START FAP" : "PAUSE FAP");
      return next;
    });
  }, [showToast]);

  const handleGonnaCum = useCallback(() => {
    if (cumTimerRef.current) window.clearTimeout(cumTimerRef.current);
    setCumActive(true);
    showToast("I'M GONNA CUM · ×3", 2000);
    cumTimerRef.current = window.setTimeout(() => {
      setCumActive(false);
      showToast("EDGE COOLDOWN");
    }, CUM_DURATION_MS);
  }, [showToast]);

  const handleRecStart = useCallback(() => {
    void recorder.start();
    showToast("REC START");
  }, [recorder, showToast]);

  const handleRecPause = useCallback(() => {
    if (recorder.paused) {
      recorder.resume();
      showToast("REC RESUME");
    } else {
      recorder.pause();
      showToast("REC PAUSE");
    }
  }, [recorder, showToast]);

  const handleRecStop = useCallback(() => {
    recorder.stop();
    showToast("REC STOP");
  }, [recorder, showToast]);

  const onHudAction = useCallback(
    (action: HudAction) => {
      switch (action) {
        case "toggle-fap":
          handleToggleFap();
          break;
        case "rec-start":
          handleRecStart();
          break;
        case "rec-pause":
          handleRecPause();
          break;
        case "rec-stop":
          handleRecStop();
          break;
        case "gonna-cum":
          handleGonnaCum();
          break;
      }
    },
    [
      handleToggleFap,
      handleRecStart,
      handleRecPause,
      handleRecStop,
      handleGonnaCum,
    ],
  );

  const vision = useVisionSession({
    videoRef,
    canvasRef: overlayRef,
    enabled: camera.ready,
    overlays: { showHands, showFace, showHud },
    session: {
      fapping,
      recording: recorder.recording,
      recPaused: recorder.paused,
      cumActive,
    },
    onPump,
    onFaceActionTick,
    onHudAction,
  });

  useEffect(() => {
    if (combo === 0) return;
    const id = window.setInterval(() => {
      if (performance.now() - lastPumpAtRef.current > COMBO_WINDOW_MS) {
        comboRef.current = 0;
        setCombo(0);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [combo]);

  useEffect(() => {
    if (pumps === 0 && score === 0) return;
    setLifetime((prev) => {
      const next = {
        ...prev,
        bestCombo: Math.max(prev.bestCombo, combo),
        bestScore: Math.max(prev.bestScore, Math.floor(score)),
      };
      saveStats(next);
      return next;
    });
  }, [combo, score, pumps]);

  const handleStartCam = async () => {
    setStarted(true);
    await camera.start();
  };

  const handleReset = () => {
    setLifetime((prev) => {
      const next = {
        totalPumps: prev.totalPumps + pumps,
        bestCombo: Math.max(prev.bestCombo, combo),
        bestScore: Math.max(prev.bestScore, Math.floor(score)),
        sessions: prev.sessions + (pumps > 0 ? 1 : 0),
      };
      saveStats(next);
      return next;
    });
    setPumps(0);
    setScore(0);
    setCombo(0);
    comboRef.current = 0;
    setFapping(false);
    setCumActive(false);
  };

  const face = vision.faceState;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-bm-brand">
            Batemates · local
          </p>
          <h1 className="font-display text-lg text-white md:text-xl">
            CAMBATE <span className="bm-gradient-text">SOLO</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {camera.ready && (
            <OverlayToggles
              showHands={showHands}
              showFace={showFace}
              showHud={showHud}
              onToggleHands={() => setShowHands((v) => !v)}
              onToggleFace={() => setShowFace((v) => !v)}
              onToggleHud={() => setShowHud((v) => !v)}
            />
          )}
          <div className="text-right text-xs text-bm-muted">
            <p>
              Best score{" "}
              <span className="text-white">{lifetime.bestScore}</span>
            </p>
            <p>
              Best combo{" "}
              <span className="text-bm-brand">×{lifetime.bestCombo}</span>
            </p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-6 md:px-8">
        <section className="relative min-h-[62vh] flex-1 overflow-hidden rounded-3xl border border-bm-bg3 bg-bm-bg1 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
          {!camera.ready && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-bm-bg1 p-8 text-center">
              <div className="h-1 w-24 rounded-full bm-gradient-bg" />
              <h2 className="font-display text-2xl text-white md:text-3xl">
                PUMP. FACE. RECORD.
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-bm-muted">
                1 ou 2 mains pour fapper. Approche une main du visage pour
                vaper / poppers. Yeux & bouche trackés en live.
              </p>
              {(camera.error || vision.error) && (
                <p className="text-sm text-bm-live">
                  {camera.error ?? vision.error}
                </p>
              )}
              {!started && (
                <p className="text-xs text-bm-muted">
                  Desktop · localhost / HTTPS
                </p>
              )}
            </div>
          )}

          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
            muted
          />
          <canvas
            ref={overlayRef}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />

          {camera.ready && (
            <ScoreHud
              pumps={pumps}
              score={score}
              combo={combo}
              multiplier={multiplier}
              flash={flash}
              trackingLabel={trackingLabel(
                vision.status,
                camera.ready,
                camera.error,
              )}
              fapping={fapping}
              cumActive={cumActive}
              handCount={vision.handCount}
              face={face}
            />
          )}

          <MilestoneToast message={toast} />

          {recorder.recording && (
            <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full bg-bm-live/90 px-3 py-1 text-xs font-semibold text-white shadow-[0_0_11.87px_0_#F41141]">
              <span className="live-dot h-2 w-2 rounded-full bg-white" />
              {recorder.paused ? "PAUSE" : "REC"}
            </div>
          )}

          <ControlBar
            camReady={camera.ready}
            fapping={fapping}
            recording={recorder.recording}
            recPaused={recorder.paused}
            cumActive={cumActive}
            hasClip={Boolean(recorder.lastBlobUrl)}
            onStartCam={handleStartCam}
            onToggleFap={handleToggleFap}
            onRecStart={handleRecStart}
            onRecPause={handleRecPause}
            onRecStop={handleRecStop}
            onGonnaCum={handleGonnaCum}
            onDownload={recorder.download}
            onReset={handleReset}
          />
        </section>

        <p className="mt-4 text-center text-xs text-bm-muted">
          Jaune = fap · violet = vape · rouge = poppers · pinch / dwell sur le
          HUD cam
        </p>
      </main>
    </div>
  );
}
