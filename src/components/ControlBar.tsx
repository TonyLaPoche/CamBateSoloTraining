import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  camReady: boolean;
  fapping: boolean;
  recording: boolean;
  recPaused: boolean;
  cumActive: boolean;
  hasClip: boolean;
  onStartCam: () => void;
  onToggleFap: () => void;
  onRecStart: () => void;
  onRecPause: () => void;
  onRecStop: () => void;
  onGonnaCum: () => void;
  onDownload: () => void;
  onReset: () => void;
  variant?: "overlay" | "dock";
};

export function ControlBar({
  camReady,
  fapping,
  recording,
  recPaused,
  cumActive,
  hasClip,
  onStartCam,
  onToggleFap,
  onRecStart,
  onRecPause,
  onRecStop,
  onGonnaCum,
  onDownload,
  onReset,
  variant = "overlay",
}: Props) {
  const { t } = useI18n();
  const dock = variant === "dock";

  return (
    <div
      className={
        dock
          ? "w-full p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          : "absolute inset-x-0 bottom-0 z-20 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:p-3"
      }
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-1 rounded-2xl border border-cbs-bg3 bg-cbs-bg1 p-1.5 sm:gap-1.5 sm:bg-black/60 sm:p-2 sm:backdrop-blur-md">
        {!camReady ? (
          <button
            type="button"
            className="cbs-btn cbs-btn-primary w-full sm:w-auto"
            onClick={onStartCam}
          >
            {t("controls.enableCam")}
          </button>
        ) : (
          <>
            <button
              type="button"
              className={`cbs-btn ${fapping ? "cbs-btn-ghost" : "cbs-btn-primary"}`}
              onClick={onToggleFap}
            >
              {fapping ? t("controls.pause") : t("controls.start")}
            </button>

            {!recording ? (
              <button
                type="button"
                className="cbs-btn cbs-btn-danger"
                onClick={onRecStart}
              >
                {t("controls.rec")}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="cbs-btn cbs-btn-ghost"
                  onClick={onRecPause}
                >
                  {recPaused ? t("controls.resume") : t("controls.pause")}
                </button>
                <button
                  type="button"
                  className="cbs-btn cbs-btn-danger"
                  onClick={onRecStop}
                >
                  <span className="live-dot inline-block h-2 w-2 rounded-full bg-white" />
                  {t("controls.stop")}
                </button>
              </>
            )}

            <button
              type="button"
              className={`cbs-btn ${cumActive ? "cbs-btn-danger" : "cbs-btn-ghost"}`}
              onClick={onGonnaCum}
            >
              {cumActive ? t("controls.edge") : t("controls.cum")}
            </button>

            {hasClip && (
              <button
                type="button"
                className="cbs-btn cbs-btn-ghost"
                onClick={onDownload}
              >
                {t("controls.download")}
              </button>
            )}
            <button
              type="button"
              className="cbs-btn cbs-btn-ghost"
              onClick={onReset}
            >
              {t("controls.reset")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
