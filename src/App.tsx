import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CenterCountdown } from "@/components/CenterCountdown";
import { ControlBar } from "@/components/ControlBar";
import { ExitArenaButton } from "@/components/ExitArenaButton";
import { HomeScreen } from "@/components/HomeScreen";
import { MilestoneToast } from "@/components/MilestoneToast";
import { OverlayToggles } from "@/components/OverlayToggles";
import { ScoreHud } from "@/components/ScoreHud";
import { useCamera } from "@/hooks/useCamera";
import { useSessionRecorder } from "@/hooks/useSessionRecorder";
import { useVisionSession } from "@/hooks/useVisionSession";
import type { HudAction } from "@/lib/camHud";
import type { FaceHandAction } from "@/lib/faceFeatures";
import {
  computeBonuses,
  loadStats,
  milestoneFor,
  pointsForPump,
  saveStats,
} from "@/lib/score";
import {
  deleteSession,
  getSessionBlob,
  isValidPseudo,
  listSessions,
  loadStoredPseudo,
  saveSession,
  sessionFileName,
  storePseudo,
  type SavedSessionMeta,
} from "@/lib/sessionLibrary";

const COMBO_WINDOW_MS = 1800;
const CUM_DURATION_MS = 12_000;
const COUNTDOWN_STEP_MS = 1000;

type Screen = "home" | "arena";

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function trackingDotClass(
  status: string,
  camReady: boolean,
  camError: string | null,
): string {
  if (camError || status === "error") return "bg-cbs-live";
  if (!camReady || status === "loading" || status === "idle") return "bg-cbs-muted";
  if (status === "tracking" || status === "ready") return "bg-cbs-primary";
  return "bg-cbs-accent"; // no-hand
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [sessions, setSessions] = useState<SavedSessionMeta[]>([]);
  const [pseudo, setPseudo] = useState(loadStoredPseudo);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fapping, setFapping] = useState(false);
  const [cumActive, setCumActive] = useState(false);
  const [pumps, setPumps] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [centerLabel, setCenterLabel] = useState<string | null>(null);
  const [lifetime, setLifetime] = useState(loadStats);
  const [showHands, setShowHands] = useState(true);
  const [showFace, setShowFace] = useState(true);
  const [showHud, setShowHud] = useState(true);
  const [sessionPeakCombo, setSessionPeakCombo] = useState(0);

  const lastPumpAtRef = useRef(0);
  const comboRef = useRef(0);
  const cumTimerRef = useRef<number>(0);
  const countdownGenRef = useRef(0);
  const countdownBusyRef = useRef(false);
  const fappingRef = useRef(false);
  const arenaStartedAtRef = useRef(0);
  const hudRef = useRef({
    pumps: 0,
    score: 0,
    combo: 0,
    multiplier: 1,
    fapping: false,
    cumActive: false,
  });

  const camera = useCamera(videoRef);
  const inArena = screen === "arena";
  const bonusInputRef = useRef({
    handCount: 0,
    handsJoined: false,
    leftEyeOpen: true,
    rightEyeOpen: true,
    mouthOpen: false,
  });

  const refreshSessions = useCallback(async () => {
    setSessions(await listSessions());
  }, []);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    fappingRef.current = fapping;
  }, [fapping]);

  useEffect(() => {
    setSessionPeakCombo((p) => Math.max(p, combo));
  }, [combo]);

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

  const runCenterCountdown = useCallback(async (steps: string[]) => {
    if (countdownBusyRef.current) return false;
    countdownBusyRef.current = true;
    const gen = ++countdownGenRef.current;
    try {
      for (const step of steps) {
        if (countdownGenRef.current !== gen) return false;
        setCenterLabel(step);
        await sleep(COUNTDOWN_STEP_MS);
      }
      if (countdownGenRef.current !== gen) return false;
      setCenterLabel(null);
      return true;
    } finally {
      if (countdownGenRef.current === gen) {
        countdownBusyRef.current = false;
        setCenterLabel(null);
      }
    }
  }, []);

  const onPump = useCallback(() => {
    const now = performance.now();
    const nextCombo =
      now - lastPumpAtRef.current <= COMBO_WINDOW_MS
        ? comboRef.current + 1
        : 1;
    comboRef.current = nextCombo;
    lastPumpAtRef.current = now;

    const bonuses = computeBonuses(bonusInputRef.current);
    const pts = pointsForPump(bonuses, cumActive);

    setCombo(nextCombo);
    setPumps((p) => {
      const next = p + 1;
      const mile = milestoneFor(next);
      if (mile) showToast(`${mile} FAPS`);
      return next;
    });
    setScore((s) => s + pts);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 280);
  }, [cumActive, showToast]);

  const onFaceActionTick = useCallback(
    (action: FaceHandAction) => {
      if (action === "none") return;
      const pts = action === "poppers" ? 25 : 18;
      setScore((s) => s + pts * (cumActive ? 2 : 1));
    },
    [cumActive],
  );

  const handleStartFap = useCallback(async () => {
    if (fappingRef.current || countdownBusyRef.current) return;
    const ok = await runCenterCountdown(["3", "2", "1", "LET'S FAP!"]);
    if (!ok) return;
    setFapping(true);
    showToast("FAPPING");
  }, [runCenterCountdown, showToast]);

  const handleStopFap = useCallback(() => {
    if (!fappingRef.current) return;
    countdownGenRef.current += 1;
    countdownBusyRef.current = false;
    setCenterLabel(null);
    setFapping(false);
    showToast("PAUSE FAP");
  }, [showToast]);

  const handleToggleFap = useCallback(() => {
    if (fappingRef.current) handleStopFap();
    else void handleStartFap();
  }, [handleStartFap, handleStopFap]);

  const handleGonnaCum = useCallback(async () => {
    if (countdownBusyRef.current || cumActive) return;
    const ok = await runCenterCountdown(["5", "4", "3", "2", "1"]);
    if (!ok) return;
    if (cumTimerRef.current) window.clearTimeout(cumTimerRef.current);
    setCumActive(true);
    setCenterLabel("I'M GONNA CUM");
    window.setTimeout(() => setCenterLabel(null), 900);
    showToast("×3 ACTIVE", 2000);
    cumTimerRef.current = window.setTimeout(() => {
      setCumActive(false);
      showToast("EDGE COOLDOWN");
    }, CUM_DURATION_MS);
  }, [cumActive, runCenterCountdown, showToast]);

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

  const persistCurrentSession = useCallback(
    async (blob: Blob | null) => {
      if (pumps <= 0 && !blob) return;
      if (!isValidPseudo(pseudo)) return;
      await saveSession({
        pseudo,
        pumps,
        score,
        bestCombo: sessionPeakCombo,
        durationMs: Math.max(0, Date.now() - arenaStartedAtRef.current),
        blob,
      });
      await refreshSessions();
    },
    [pseudo, pumps, score, sessionPeakCombo, refreshSessions],
  );

  const handleRecStop = useCallback(async () => {
    const blob = await recorder.stop();
    showToast("REC STOP");
    if (blob) {
      await persistCurrentSession(blob);
      showToast("Session sauvegardée");
    }
  }, [recorder, showToast, persistCurrentSession]);

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
          void handleRecStop();
          break;
        case "gonna-cum":
          void handleGonnaCum();
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
    enabled: inArena && camera.ready,
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

  const resetArenaState = useCallback(() => {
    setPumps(0);
    setScore(0);
    setCombo(0);
    comboRef.current = 0;
    setSessionPeakCombo(0);
    setFapping(false);
    setCumActive(false);
    countdownGenRef.current += 1;
    countdownBusyRef.current = false;
    setCenterLabel(null);
    recorder.clearClip();
  }, [recorder]);

  const handleEnterArena = useCallback(
    async (nextPseudo: string) => {
      if (!isValidPseudo(nextPseudo)) return;
      storePseudo(nextPseudo);
      setPseudo(nextPseudo);
      resetArenaState();
      arenaStartedAtRef.current = Date.now();
      setScreen("arena");
      await camera.start();
    },
    [camera, resetArenaState],
  );

  const handleExitArena = useCallback(async () => {
    countdownGenRef.current += 1;
    countdownBusyRef.current = false;
    setCenterLabel(null);
    setFapping(false);
    setCumActive(false);

    let blob: Blob | null = null;
    if (recorder.recording) {
      blob = await recorder.stop();
    } else {
      blob = recorder.lastBlobRef.current;
    }

    if (pumps > 0 || blob) {
      await persistCurrentSession(blob);
      setLifetime((prev) => {
        const next = {
          totalPumps: prev.totalPumps + pumps,
          bestCombo: Math.max(prev.bestCombo, sessionPeakCombo),
          bestScore: Math.max(prev.bestScore, Math.floor(score)),
          sessions: prev.sessions + 1,
        };
        saveStats(next);
        return next;
      });
    }

    camera.stop();
    resetArenaState();
    setScreen("home");
    showToast("Retour à l’accueil");
  }, [
    recorder,
    pumps,
    score,
    sessionPeakCombo,
    persistCurrentSession,
    camera,
    resetArenaState,
    showToast,
  ]);

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
    resetArenaState();
  };

  const handlePlaySession = useCallback(async (id: string) => {
    const blob = await getSessionBlob(id);
    if (!blob) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(blob));
  }, [previewUrl]);

  const handleDownloadSession = useCallback(async (id: string) => {
    const blob = await getSessionBlob(id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = sessionFileName(id);
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
      await refreshSessions();
    },
    [refreshSessions],
  );

  const face = vision.faceState;

  const bonusInput = useMemo(
    () => ({
      handCount: vision.handCount,
      handsJoined: face.handsJoined,
      leftEyeOpen: face.seen ? face.leftEyeOpen : true,
      rightEyeOpen: face.seen ? face.rightEyeOpen : true,
      mouthOpen: face.seen ? face.mouthOpen : false,
    }),
    [vision.handCount, face],
  );

  const bonuses = useMemo(() => computeBonuses(bonusInput), [bonusInput]);

  useEffect(() => {
    bonusInputRef.current = bonusInput;
  }, [bonusInput]);

  useEffect(() => {
    hudRef.current = {
      pumps,
      score,
      combo,
      multiplier: bonuses.total * (cumActive ? 3 : 1),
      fapping,
      cumActive,
    };
  }, [pumps, score, combo, bonuses.total, fapping, cumActive]);

  const statusTitle = camera.error
    ? camera.error
    : !camera.ready
      ? "Caméra off"
      : vision.status === "tracking" || vision.status === "ready"
        ? "Tracking OK"
        : vision.status === "no-hand"
          ? "Montre tes mains"
          : vision.status === "loading"
            ? "Chargement…"
            : vision.status === "error"
              ? "Tracking KO"
              : "En attente";
  const resolutionText =
    camera.width && camera.height
      ? `${camera.width}×${camera.height}`
      : "—×—";

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
      <header className="relative z-10 flex h-14 shrink-0 items-center justify-between gap-3 px-3 md:px-6">
        <div className="min-w-0 shrink">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-cbs-accent">
            Local only
          </p>
          <h1 className="font-display truncate text-base text-white md:text-lg">
            CAMBATE <span className="cbs-gradient-text">SOLO</span>
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {inArena && camera.ready && (
            <OverlayToggles
              showHands={showHands}
              showFace={showFace}
              showHud={showHud}
              onToggleHands={() => setShowHands((v) => !v)}
              onToggleFace={() => setShowFace((v) => !v)}
              onToggleHud={() => setShowHud((v) => !v)}
            />
          )}
          {inArena ? (
            <>
              <div className="w-14 shrink-0 truncate rounded-full border border-cbs-bg3 bg-black/50 px-2 py-1.5 text-center font-mono text-[11px] text-cbs-primary">
                {pseudo || "????"}
              </div>
              <div
                className="flex w-[9.5rem] shrink-0 items-center gap-2 rounded-full border border-cbs-bg3 bg-black/50 px-3 py-1.5 text-[11px] text-cbs-muted"
                title={statusTitle}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${trackingDotClass(
                    vision.status,
                    camera.ready,
                    camera.error,
                  )}`}
                />
                <span className="truncate font-mono tabular-nums">
                  {resolutionText}
                </span>
              </div>
            </>
          ) : (
            <div className="hidden text-right text-[11px] text-cbs-muted sm:block">
              Best{" "}
              <span className="text-white">{lifetime.bestScore}</span>
              {" · "}
              <span className="text-cbs-accent">×{lifetime.bestCombo}</span>
            </div>
          )}
        </div>
      </header>

      <main className="relative mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-2 pb-2 md:px-4">
        {screen === "home" ? (
          <>
            <HomeScreen
              sessions={sessions}
              bestScore={lifetime.bestScore}
              bestCombo={lifetime.bestCombo}
              initialPseudo={pseudo}
              onEnterArena={(p) => void handleEnterArena(p)}
              onPlay={(id) => void handlePlaySession(id)}
              onDelete={(id) => void handleDeleteSession(id)}
              onDownload={(id) => void handleDownloadSession(id)}
            />
            {previewUrl && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                <div className="w-full max-w-3xl rounded-2xl border border-cbs-bg3 bg-cbs-bg1 p-3">
                  <video
                    src={previewUrl}
                    controls
                    autoPlay
                    className="max-h-[70vh] w-full rounded-xl bg-black"
                  />
                  <button
                    type="button"
                    className="cbs-btn cbs-btn-ghost mt-3 w-full"
                    onClick={() => {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <section className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-cbs-bg3 bg-black shadow-[0_0_60px_rgba(0,0,0,0.45)]">
            {!camera.ready && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-cbs-bg1 p-8 text-center">
                <div className="h-1 w-24 rounded-full cbs-gradient-bg" />
                <h2 className="font-display text-2xl text-white md:text-3xl">
                  ACTIVATION CAM…
                </h2>
                {(camera.error || vision.error) && (
                  <p className="text-sm text-cbs-live">
                    {camera.error ?? vision.error}
                  </p>
                )}
                <button
                  type="button"
                  className="cbs-btn cbs-btn-ghost"
                  onClick={() => void handleExitArena()}
                >
                  Retour
                </button>
              </div>
            )}

            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-contain bg-black"
              playsInline
              muted
            />
            <canvas
              ref={overlayRef}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            />

            {camera.ready && (
              <>
                <ExitArenaButton onExit={() => void handleExitArena()} />
                <ScoreHud
                  pumps={pumps}
                  score={score}
                  combo={combo}
                  flash={flash}
                  fapping={fapping}
                  cumActive={cumActive}
                  handCount={vision.handCount}
                  face={face}
                  bonuses={bonuses}
                />
              </>
            )}

            <CenterCountdown label={centerLabel} />
            <MilestoneToast message={toast} />

            {recorder.recording && (
              <div className="absolute right-3 top-14 z-20 flex items-center gap-2 rounded-full bg-cbs-live/90 px-3 py-1 text-xs font-semibold text-white shadow-[0_0_11.87px_0_#F41141]">
                <span className="live-dot h-2 w-2 rounded-full bg-white" />
                {recorder.paused ? "PAUSE" : "REC"}
              </div>
            )}

            {/* Raccourcis souris masqués si HUD cam actif */}
            {!showHud && camera.ready && (
              <ControlBar
                camReady={camera.ready}
                fapping={fapping}
                recording={recorder.recording}
                recPaused={recorder.paused}
                cumActive={cumActive}
                hasClip={Boolean(recorder.lastBlobUrl)}
                onStartCam={() => void camera.start()}
                onToggleFap={handleToggleFap}
                onRecStart={handleRecStart}
                onRecPause={handleRecPause}
                onRecStop={() => void handleRecStop()}
                onGonnaCum={() => void handleGonnaCum()}
                onDownload={recorder.download}
                onReset={handleReset}
              />
            )}
          </section>
        )}
      </main>
    </div>
  );
}
