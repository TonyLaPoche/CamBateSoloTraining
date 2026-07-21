import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CenterCountdown } from "@/components/CenterCountdown";
import { ControlBar } from "@/components/ControlBar";
import { ExitArenaButton } from "@/components/ExitArenaButton";
import { HomeScreen } from "@/components/HomeScreen";
import { MilestoneToast } from "@/components/MilestoneToast";
import { OverlayToggles } from "@/components/OverlayToggles";
import { LangToggle } from "@/components/LangToggle";
import { PwaInstallHint } from "@/components/PwaInstallHint";
import { ScoreHud } from "@/components/ScoreHud";
import { useCamera } from "@/hooks/useCamera";
import { useSessionRecorder } from "@/hooks/useSessionRecorder";
import { useVisionSession } from "@/hooks/useVisionSession";
import { useI18n } from "@/i18n/I18nProvider";
import type { HudAction } from "@/lib/camHud";
import type { FaceHandAction } from "@/lib/faceFeatures";
import {
  loadHandDominance,
  saveHandDominance,
  type HandDominance,
} from "@/lib/handDominance";
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
  const { t, messages } = useI18n();
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
  const [showHands, setShowHands] = useState(false);
  const [showFace, setShowFace] = useState(false);
  const [showHud, setShowHud] = useState(true);
  const [handDominance, setHandDominance] =
    useState<HandDominance>(loadHandDominance);
  const [sessionPeakCombo, setSessionPeakCombo] = useState(0);
  /** Mobile : HUD hors flux cam (pas de superposition) */
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false,
  );

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
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
      if (mile) showToast(t("toast.fapsMilestone", { n: mile }));
      return next;
    });
    setScore((s) => s + pts);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 280);
  }, [cumActive, showToast, t]);

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
    const ok = await runCenterCountdown([
      "3",
      "2",
      "1",
      t("toast.letsFap"),
    ]);
    if (!ok) return;
    setFapping(true);
    showToast(t("toast.fapping"));
  }, [runCenterCountdown, showToast, t]);

  const handleStopFap = useCallback(() => {
    if (!fappingRef.current) return;
    countdownGenRef.current += 1;
    countdownBusyRef.current = false;
    setCenterLabel(null);
    setFapping(false);
    showToast(t("toast.pauseFap"));
  }, [showToast, t]);

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
    setCenterLabel(t("toast.gonnaCum"));
    window.setTimeout(() => setCenterLabel(null), 900);
    showToast(t("toast.cumActive"), 2000);
    cumTimerRef.current = window.setTimeout(() => {
      setCumActive(false);
      showToast(t("toast.edgeCooldown"));
    }, CUM_DURATION_MS);
  }, [cumActive, runCenterCountdown, showToast, t]);

  const handleRecStart = useCallback(() => {
    void recorder.start();
    showToast(t("toast.recStart"));
  }, [recorder, showToast, t]);

  const handleRecPause = useCallback(() => {
    if (recorder.paused) {
      recorder.resume();
      showToast(t("toast.recResume"));
    } else {
      recorder.pause();
      showToast(t("toast.recPause"));
    }
  }, [recorder, showToast, t]);

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
    showToast(t("toast.recStop"));
    if (blob) {
      await persistCurrentSession(blob);
      showToast(t("toast.sessionSaved"));
    }
  }, [recorder, showToast, persistCurrentSession, t]);

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
    overlays: {
      showHands,
      showFace,
      // Sur mobile : contrôles HTML hors cam, pas de boutons canvas
      showHud: showHud && !isNarrow,
    },
    session: {
      fapping,
      recording: recorder.recording,
      recPaused: recorder.paused,
      cumActive,
    },
    handDominance,
    hudLabels: messages.hud,
    onPump,
    onFaceActionTick,
    onHudAction,
  });

  const handleHandDominanceChange = useCallback((mode: HandDominance) => {
    setHandDominance(mode);
    saveHandDominance(mode);
  }, []);

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
    showToast(t("toast.backHome"));
  }, [
    recorder,
    pumps,
    score,
    sessionPeakCombo,
    persistCurrentSession,
    camera,
    resetArenaState,
    showToast,
    t,
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
      ? t("status.camOff")
      : vision.status === "tracking" || vision.status === "ready"
        ? t("status.trackingOk")
        : vision.status === "no-hand"
          ? t("status.showHands")
          : vision.status === "loading"
            ? t("status.loading")
            : vision.status === "error"
              ? t("status.trackingKo")
              : t("status.waiting");
  const resolutionText =
    camera.width && camera.height
      ? `${camera.width}×${camera.height}`
      : "—×—";

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
      <header className="relative z-10 flex h-12 shrink-0 items-center justify-between gap-2 px-2 sm:h-14 sm:gap-3 sm:px-3 md:px-6">
        <div className="min-w-0 shrink">
          <p className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-cbs-accent sm:block">
            {t("header.localOnly")}
          </p>
          <h1 className="font-display truncate text-sm text-white sm:text-base md:text-lg">
            CAMBATE <span className="cbs-gradient-text">SOLO</span>
          </h1>
        </div>
        <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
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
              <div className="w-12 shrink-0 truncate rounded-full border border-cbs-bg3 bg-black/50 px-1.5 py-1 text-center font-mono text-[10px] text-cbs-primary sm:w-14 sm:px-2 sm:py-1.5 sm:text-[11px]">
                {pseudo || "????"}
              </div>
              <div
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-cbs-bg3 bg-black/50 px-2 py-1 text-[10px] text-cbs-muted sm:w-[9.5rem] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px]"
                title={statusTitle}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${trackingDotClass(
                    vision.status,
                    camera.ready,
                    camera.error,
                  )}`}
                />
                <span className="hidden truncate font-mono tabular-nums sm:inline">
                  {resolutionText}
                </span>
              </div>
            </>
          ) : (
            <div className="hidden text-right text-[11px] text-cbs-muted sm:block">
              {t("header.best")}{" "}
              <span className="text-white">{lifetime.bestScore}</span>
              {" · "}
              <span className="text-cbs-accent">×{lifetime.bestCombo}</span>
            </div>
          )}
          <LangToggle />
        </div>
      </header>

      <main className="relative mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-1.5 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:px-2 sm:pb-2 md:px-4">
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4">
                <div className="w-full max-w-3xl rounded-2xl border border-cbs-bg3 bg-cbs-bg1 p-2 sm:p-3">
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    autoPlay
                    className="max-h-[70dvh] w-full rounded-xl bg-black"
                  />
                  <button
                    type="button"
                    className="cbs-btn cbs-btn-ghost mt-3 w-full"
                    onClick={() => {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }}
                  >
                    {t("home.close")}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-cbs-bg3 bg-black shadow-[0_0_60px_rgba(0,0,0,0.45)] sm:rounded-2xl">
            {!camera.ready && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-cbs-bg1 p-6 text-center sm:p-8">
                <div className="h-1 w-24 rounded-full cbs-gradient-bg" />
                <h2 className="font-display text-xl text-white sm:text-2xl md:text-3xl">
                  {t("arena.activating")}
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
                  {t("arena.back")}
                </button>
              </div>
            )}

            {/* Mobile : score + bonus + exit dans la zone noire hors flux */}
            {camera.ready && (
              <div className="relative z-20 flex shrink-0 items-start gap-2 border-b border-cbs-bg3 bg-black px-2 py-1.5 md:hidden">
                <ScoreHud
                  variant="dock"
                  pumps={pumps}
                  score={score}
                  combo={combo}
                  flash={flash}
                  fapping={fapping}
                  cumActive={cumActive}
                  handCount={vision.handCount}
                  face={face}
                  bonuses={bonuses}
                  handDominance={handDominance}
                  onHandDominanceChange={handleHandDominanceChange}
                />
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {recorder.recording && (
                    <div className="flex items-center gap-1 rounded-full bg-cbs-live/90 px-2 py-0.5 text-[9px] font-semibold text-white">
                      <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" />
                      {recorder.paused ? "PAUSE" : "REC"}
                    </div>
                  )}
                  <ExitArenaButton
                    variant="dock"
                    onExit={() => void handleExitArena()}
                  />
                </div>
              </div>
            )}

            {/* Zone cam + sidebar desktop (score/bonus hors flux) */}
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              <div className="relative min-h-0 min-w-0 flex-1 bg-black">
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full scale-x-[-1] object-contain bg-black"
                  playsInline
                  muted
                />
                <canvas
                  ref={overlayRef}
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                />

                {camera.ready && (
                  <div className="hidden md:block">
                    <ExitArenaButton onExit={() => void handleExitArena()} />
                  </div>
                )}

                <CenterCountdown label={centerLabel} />
                <MilestoneToast message={toast} />

                {recorder.recording && (
                  <div className="absolute right-3 top-3 z-20 hidden items-center gap-2 rounded-full bg-cbs-live/90 px-3 py-1 text-xs font-semibold text-white shadow-[0_0_11.87px_0_#F41141] md:flex">
                    <span className="live-dot h-2 w-2 rounded-full bg-white" />
                    {recorder.paused ? "PAUSE" : "REC"}
                  </div>
                )}

                {!showHud && camera.ready && (
                  <div className="hidden md:block">
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
                  </div>
                )}
              </div>

              {camera.ready && (
                <aside className="hidden w-[13.5rem] shrink-0 flex-col gap-2 overflow-y-auto border-l border-cbs-bg3 bg-black p-2 md:flex lg:w-[15rem] lg:p-3">
                  <ScoreHud
                    variant="sidebar"
                    pumps={pumps}
                    score={score}
                    combo={combo}
                    flash={flash}
                    fapping={fapping}
                    cumActive={cumActive}
                    handCount={vision.handCount}
                    face={face}
                    bonuses={bonuses}
                    handDominance={handDominance}
                    onHandDominanceChange={handleHandDominanceChange}
                  />
                </aside>
              )}
            </div>

            {/* Mobile : contrôles dans la zone noire sous la cam */}
            {camera.ready && (
              <div className="shrink-0 border-t border-cbs-bg3 bg-black md:hidden">
                <ControlBar
                  variant="dock"
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
              </div>
            )}
          </section>
        )}
      </main>
      {screen === "home" && <PwaInstallHint />}
    </div>
  );
}
