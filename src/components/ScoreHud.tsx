import type { VisionFaceState } from "@/hooks/useVisionSession";

type Props = {
  pumps: number;
  score: number;
  combo: number;
  multiplier: number;
  flash: boolean;
  trackingLabel: string;
  fapping: boolean;
  cumActive: boolean;
  handCount: number;
  face: VisionFaceState;
  resolution: string | null;
};

export function ScoreHud({
  pumps,
  score,
  combo,
  multiplier,
  flash,
  trackingLabel,
  fapping,
  cumActive,
  handCount,
  face,
  resolution,
}: Props) {
  const eyesLabel =
    face.leftEyeOpen && face.rightEyeOpen
      ? "Yeux ouverts"
      : !face.leftEyeOpen && !face.rightEyeOpen
        ? "Yeux fermés"
        : "Clin d'œil";

  const mouthLabel = face.tongueOut
    ? "Langue dehors"
    : face.mouthOpen
      ? "Bouche ouverte"
      : "Bouche fermée";

  const faceActionLabel =
    face.faceAction === "poppers"
      ? "Poppers"
      : face.faceAction === "vape"
        ? "Vape"
        : null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 pt-20 md:p-6 md:pt-24">
      <div
        className={`rounded-2xl border border-bm-bg3 bg-black/55 px-4 py-3 backdrop-blur-md ${flash ? "pump-flash" : ""}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-bm-muted">
            {fapping ? (face.dualHand ? "Dual fap" : "Fapping") : "Idle"}
          </p>
          {cumActive && (
            <span className="rounded-full bg-bm-live/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Gonna cum
            </span>
          )}
          {faceActionLabel && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                face.faceAction === "poppers"
                  ? "bg-[#FF0107]/90 text-white"
                  : "bg-bm-brand/90 text-black"
              }`}
            >
              {faceActionLabel}
            </span>
          )}
        </div>
        <p className="mt-1 font-display text-2xl text-bm-primary md:text-3xl">
          {pumps}
          <span className="ml-2 text-sm font-sans font-semibold tracking-normal text-white">
            PUMPS
          </span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-white">
            Score <strong className="font-semibold">{Math.floor(score)}</strong>
          </span>
          <span className="text-bm-brand">
            Combo ×{combo}
            {multiplier > 1 ? ` · ×${multiplier}` : ""}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="rounded-full border border-bm-bg3 bg-black/55 px-3 py-1.5 text-xs font-medium text-bm-muted backdrop-blur-md">
          {trackingLabel}
          {resolution ? ` · ${resolution}` : ""}
        </div>
        <div className="rounded-2xl border border-bm-bg3 bg-black/55 px-3 py-2 text-right text-[11px] leading-relaxed text-bm-muted backdrop-blur-md">
          <p>
            <span className="text-bm-primary">{handCount}</span> main
            {handCount === 1 ? "" : "s"}
            {face.dualHand ? " · dual" : ""}
          </p>
          {face.seen ? (
            <>
              <p className="text-white">{eyesLabel}</p>
              <p
                className={
                  face.tongueOut
                    ? "text-bm-live"
                    : face.mouthOpen
                      ? "text-bm-primary"
                      : "text-bm-brand"
                }
              >
                {mouthLabel}
              </p>
            </>
          ) : (
            <p>Visage —</p>
          )}
        </div>
      </div>
    </div>
  );
}
