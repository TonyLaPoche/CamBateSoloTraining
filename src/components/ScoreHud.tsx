import type { VisionFaceState } from "@/hooks/useVisionSession";
import type { BonusBreakdown } from "@/lib/score";

type Props = {
  pumps: number;
  score: number;
  combo: number;
  flash: boolean;
  fapping: boolean;
  cumActive: boolean;
  handCount: number;
  face: VisionFaceState;
  bonuses: BonusBreakdown;
  /** overlay = flottant sur la cam · dock = bandeau hors flux (mobile) */
  variant?: "overlay" | "dock";
};

function BonusRow({
  label,
  mult,
  active,
  hint,
  compact,
}: {
  label: string;
  mult: number;
  active: boolean;
  hint: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[1fr_auto] gap-x-2 leading-snug ${
        compact ? "text-[10px]" : "text-[11px]"
      } ${active ? "text-white" : "text-cbs-muted"}`}
      title={hint}
    >
      <span className="truncate text-left">{label}</span>
      <span
        className={`font-mono tabular-nums ${
          active ? "text-cbs-primary" : "text-cbs-muted"
        }`}
      >
        ×{mult % 1 === 0 ? mult : mult.toFixed(1)}
      </span>
    </div>
  );
}

export function ScoreHud({
  pumps,
  score,
  combo,
  flash,
  fapping,
  cumActive,
  handCount,
  face,
  bonuses,
  variant = "overlay",
}: Props) {
  const faceActionLabel =
    face.faceAction === "poppers"
      ? "Poppers"
      : face.faceAction === "vape"
        ? "Vape"
        : null;

  const totalLabel =
    bonuses.total % 1 === 0 ? bonuses.total : bonuses.total.toFixed(1);

  const dock = variant === "dock";

  const scoreCard = (
    <div
      className={`min-w-0 flex-1 rounded-xl border border-cbs-bg3 bg-cbs-bg1/90 px-2.5 py-1.5 ${
        dock ? "" : "bg-black/55 backdrop-blur-md sm:rounded-2xl sm:px-4 sm:py-3"
      } ${flash ? "pump-flash" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-cbs-muted">
          {fapping
            ? face.handsJoined
              ? "Dual joined"
              : "Fapping"
            : "Idle"}
        </p>
        {cumActive && (
          <span className="rounded-full bg-cbs-live/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            Cum ×3
          </span>
        )}
        {faceActionLabel && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              face.faceAction === "poppers"
                ? "bg-[#FF0107]/90 text-white"
                : "bg-cbs-accent/90 text-black"
            }`}
          >
            {faceActionLabel}
          </span>
        )}
      </div>
      <p
        className={`font-display text-cbs-primary ${
          dock ? "text-lg leading-tight" : "mt-0.5 text-xl sm:mt-1 sm:text-2xl md:text-3xl"
        }`}
      >
        {pumps}
        <span className="ml-1.5 text-xs font-sans font-semibold tracking-normal text-white">
          FAPS
        </span>
      </p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] sm:gap-3 sm:text-sm">
        <span className="text-white">
          Score <strong className="font-semibold">{Math.floor(score)}</strong>
        </span>
        <span className="text-cbs-accent">×{combo}</span>
        <span className="font-mono text-cbs-primary">×{totalLabel}</span>
      </div>
      {!dock && (
        <p className="mt-0.5 text-[9px] text-cbs-muted sm:mt-1 sm:text-[10px]">
          1 fap = {totalLabel}
          {cumActive ? " ×3" : ""} pts
        </p>
      )}
    </div>
  );

  const bonusCard = (
    <div
      className={`w-[9.5rem] shrink-0 rounded-xl border border-cbs-bg3 px-2 py-1.5 sm:w-[11.5rem] sm:px-3 sm:py-2 ${
        dock
          ? "bg-cbs-bg1/90"
          : "bg-black/55 backdrop-blur-md sm:mr-14 md:mr-16 sm:rounded-2xl"
      }`}
    >
      <p className="mb-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-cbs-muted sm:mb-1.5 sm:text-[9px]">
        Bonus live
      </p>
      <div className="flex flex-col gap-0.5 sm:gap-1">
        <BonusRow
          label={bonuses.handLabel}
          mult={bonuses.handMult}
          active={bonuses.handMult > 1}
          hint="2 mains jointes = ×2 · sinon ×1"
          compact={dock}
        />
        <BonusRow
          label={face.seen ? bonuses.eyesLabel : "Yeux —"}
          mult={face.seen ? bonuses.eyesMult : 1}
          active={face.seen && bonuses.eyesMult > 1}
          hint="2 yeux fermés = ×4 · 1 œil = ×1.5"
          compact={dock}
        />
        <BonusRow
          label={face.seen ? bonuses.mouthLabel : "Bouche —"}
          mult={face.seen ? bonuses.mouthMult : 1}
          active={face.seen && bonuses.mouthMult > 1}
          hint="Bouche ouverte = ×2"
          compact={dock}
        />
        <div className="mt-0.5 grid grid-cols-[1fr_auto] border-t border-cbs-bg3 pt-0.5 text-[10px] font-semibold text-white sm:mt-1 sm:pt-1 sm:text-[11px]">
          <span>Total</span>
          <span className="font-mono text-cbs-primary tabular-nums">
            ×{totalLabel}
          </span>
        </div>
      </div>
      {!dock && (
        <p className="mt-1 hidden text-[9px] leading-snug text-cbs-muted sm:mt-2 sm:block">
          Cumulatif · {handCount} main{handCount === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );

  if (dock) {
    return (
      <div className="flex w-full items-stretch gap-2">
        {scoreCard}
        {bonusCard}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden items-start justify-between gap-3 p-4 pt-14 md:flex md:p-6 md:pt-16">
      {scoreCard}
      {bonusCard}
    </div>
  );
}
