type Props = {
  pumps: number;
  score: number;
  combo: number;
  multiplier: number;
  flash: boolean;
  trackingLabel: string;
};

export function ScoreHud({
  pumps,
  score,
  combo,
  multiplier,
  flash,
  trackingLabel,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 md:p-6">
      <div
        className={`rounded-2xl border border-bm-bg3 bg-black/55 px-4 py-3 backdrop-blur-md ${flash ? "pump-flash" : ""}`}
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-bm-muted">
          Session
        </p>
        <p className="mt-1 font-display text-2xl text-bm-primary md:text-3xl">
          {pumps}
          <span className="ml-2 text-sm font-sans font-semibold tracking-normal text-white">
            PUMPS
          </span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-white">
            Score{" "}
            <strong className="font-semibold">{Math.floor(score)}</strong>
          </span>
          <span className="text-bm-brand">
            Combo ×{combo}
            {multiplier > 1 ? ` · ×${multiplier}` : ""}
          </span>
        </div>
      </div>

      <div className="rounded-full border border-bm-bg3 bg-black/55 px-3 py-1.5 text-xs font-medium text-bm-muted backdrop-blur-md">
        {trackingLabel}
      </div>
    </div>
  );
}
