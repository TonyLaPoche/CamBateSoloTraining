type Props = {
  camReady: boolean;
  recording: boolean;
  hasClip: boolean;
  onStartCam: () => void;
  onToggleRecord: () => void;
  onDownload: () => void;
  onReset: () => void;
};

export function ControlBar({
  camReady,
  recording,
  hasClip,
  onStartCam,
  onToggleRecord,
  onDownload,
  onReset,
}: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 p-4 md:p-6">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-bm-bg3 bg-black/60 p-3 backdrop-blur-md">
        {!camReady ? (
          <button type="button" className="bm-btn bm-btn-primary" onClick={onStartCam}>
            Activer la caméra
          </button>
        ) : (
          <>
            <button
              type="button"
              className={`bm-btn ${recording ? "bm-btn-danger" : "bm-btn-primary"}`}
              onClick={onToggleRecord}
            >
              {recording ? (
                <>
                  <span className="live-dot inline-block h-2 w-2 rounded-full bg-white" />
                  Stop REC
                </>
              ) : (
                "Record session"
              )}
            </button>
            {hasClip && (
              <button type="button" className="bm-btn bm-btn-ghost" onClick={onDownload}>
                Télécharger le clip
              </button>
            )}
            <button type="button" className="bm-btn bm-btn-ghost" onClick={onReset}>
              Reset score
            </button>
          </>
        )}
      </div>
    </div>
  );
}
