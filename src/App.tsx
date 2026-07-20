import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ControlBar } from "@/components/ControlBar";
import { MilestoneToast } from "@/components/MilestoneToast";
import { ScoreHud } from "@/components/ScoreHud";
import { useCamera } from "@/hooks/useCamera";
import { useHandTracker } from "@/hooks/useHandTracker";
import { useSessionRecorder } from "@/hooks/useSessionRecorder";
import {
  comboMultiplier,
  loadStats,
  milestoneFor,
  saveStats,
} from "@/lib/score";

const COMBO_WINDOW_MS = 1800;

function trackingLabel(
  status: string,
  camReady: boolean,
  camError: string | null,
): string {
  if (camError) return "Caméra bloquée";
  if (!camReady) return "Caméra off";
  switch (status) {
    case "loading":
      return "Chargement tracking…";
    case "ready":
    case "tracking":
      return "Main détectée";
    case "no-hand":
      return "Montre ton poing";
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
  const [pumps, setPumps] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lifetime, setLifetime] = useState(loadStats);
  const lastPumpAtRef = useRef(0);
  const comboRef = useRef(0);
  const hudRef = useRef({ pumps: 0, score: 0, combo: 0, multiplier: 1 });

  const camera = useCamera(videoRef);
  const multiplier = useMemo(() => comboMultiplier(combo), [combo]);

  useEffect(() => {
    hudRef.current = { pumps, score, combo, multiplier };
  }, [pumps, score, combo, multiplier]);

  const getHud = useCallback(() => hudRef.current, []);

  const recorder = useSessionRecorder({
    videoRef,
    overlayRef,
    getHud,
  });

  const onPump = useCallback(() => {
    const now = performance.now();
    const nextCombo =
      now - lastPumpAtRef.current <= COMBO_WINDOW_MS
        ? comboRef.current + 1
        : 1;
    comboRef.current = nextCombo;
    lastPumpAtRef.current = now;
    const mult = comboMultiplier(nextCombo);

    setCombo(nextCombo);
    setPumps((p) => {
      const next = p + 1;
      const mile = milestoneFor(next);
      if (mile) {
        setToast(`${mile} PUMPS`);
        window.setTimeout(() => setToast(null), 1600);
      }
      return next;
    });
    setScore((s) => s + 10 * mult);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 280);
  }, []);

  const tracker = useHandTracker({
    videoRef,
    canvasRef: overlayRef,
    enabled: camera.ready,
    onPump,
  });

  // Combo decay
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

  // Persist bests live (total pumps committed on reset)
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
  };

  const handleToggleRecord = () => {
    if (recorder.recording) recorder.stop();
    else void recorder.start();
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="relative z-10 flex items-center justify-between px-4 py-4 md:px-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-bm-brand">
            Batemates · local
          </p>
          <h1 className="font-display text-lg text-white md:text-xl">
            CAMBATE{" "}
            <span className="bm-gradient-text">SOLO</span>
          </h1>
        </div>
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
      </header>

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-6 md:px-8">
        <section className="relative min-h-[62vh] flex-1 overflow-hidden rounded-3xl border border-bm-bg3 bg-bm-bg1 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
          {!camera.ready && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-bm-bg1 p-8 text-center">
              <div className="h-1 w-24 rounded-full bm-gradient-bg" />
              <h2 className="font-display text-2xl text-white md:text-3xl">
                PUMP. SCORE. RECORD.
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-bm-muted">
                Ta caméra reste sur cet appareil. MediaPipe compte chaque
                mouvement de poing — plus tu enchaînes, plus le multiplicateur
                grimpe.
              </p>
              {(camera.error || tracker.error) && (
                <p className="text-sm text-bm-live">
                  {camera.error ?? tracker.error}
                </p>
              )}
              {!started && (
                <p className="text-xs text-bm-muted">
                  Desktop recommandé · HTTPS ou localhost requis pour la cam
                </p>
              )}
            </div>
          )}

          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
            playsInline
            muted
          />
          <canvas
            ref={overlayRef}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />

          {camera.ready && (
            <ScoreHud
              pumps={pumps}
              score={score}
              combo={combo}
              multiplier={multiplier}
              flash={flash}
              trackingLabel={trackingLabel(
                tracker.status,
                camera.ready,
                camera.error,
              )}
            />
          )}

          <MilestoneToast message={toast} />

          {recorder.recording && (
            <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full bg-bm-live/90 px-3 py-1 text-xs font-semibold text-white shadow-[0_0_11.87px_0_#F41141]">
              <span className="live-dot h-2 w-2 rounded-full bg-white" />
              REC
            </div>
          )}

          <ControlBar
            camReady={camera.ready}
            recording={recorder.recording}
            hasClip={Boolean(recorder.lastBlobUrl)}
            onStartCam={handleStartCam}
            onToggleRecord={handleToggleRecord}
            onDownload={recorder.download}
            onReset={handleReset}
          />
        </section>

        <p className="mt-4 text-center text-xs text-bm-muted">
          18+ · traitement 100 % local · aucune vidéo n’est uploadée
        </p>
      </main>
    </div>
  );
}
