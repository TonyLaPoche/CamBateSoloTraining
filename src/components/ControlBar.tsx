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
}: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 p-2 md:p-3">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-cbs-bg3 bg-black/60 p-2 backdrop-blur-md">
        {!camReady ? (
          <button
            type="button"
            className="cbs-btn cbs-btn-primary"
            onClick={onStartCam}
          >
            Activer la caméra
          </button>
        ) : (
          <>
            <button
              type="button"
              className={`cbs-btn ${fapping ? "cbs-btn-ghost" : "cbs-btn-primary"}`}
              onClick={onToggleFap}
            >
              {fapping ? "Pause fap" : "Start fap"}
            </button>

            {!recording ? (
              <button
                type="button"
                className="cbs-btn cbs-btn-danger"
                onClick={onRecStart}
              >
                Rec start
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="cbs-btn cbs-btn-ghost"
                  onClick={onRecPause}
                >
                  {recPaused ? "Rec resume" : "Rec pause"}
                </button>
                <button
                  type="button"
                  className="cbs-btn cbs-btn-danger"
                  onClick={onRecStop}
                >
                  <span className="live-dot inline-block h-2 w-2 rounded-full bg-white" />
                  Rec stop
                </button>
              </>
            )}

            <button
              type="button"
              className={`cbs-btn ${cumActive ? "cbs-btn-danger" : "cbs-btn-ghost"}`}
              onClick={onGonnaCum}
            >
              {cumActive ? "Edging…" : "I'm gonna cum"}
            </button>

            {hasClip && (
              <button
                type="button"
                className="cbs-btn cbs-btn-ghost"
                onClick={onDownload}
              >
                Télécharger
              </button>
            )}
            <button
              type="button"
              className="cbs-btn cbs-btn-ghost"
              onClick={onReset}
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
