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
};

function BonusRow({
  label,
  mult,
  active,
  hint,
}: {
  label: string;
  mult: number;
  active: boolean;
  hint: string;
}) {
  return (
    <div
      className={`grid grid-cols-[1fr_auto] gap-x-3 text-[11px] leading-snug ${
        active ? "text-white" : "text-cbs-muted"
      }`}
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
}: Props) {
  const faceActionLabel =
    face.faceAction === "poppers"
      ? "Poppers"
      : face.faceAction === "vape"
        ? "Vape"
        : null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 pt-14 md:p-6 md:pt-16">
      <div
        className={`rounded-2xl border border-cbs-bg3 bg-black/55 px-4 py-3 backdrop-blur-md ${flash ? "pump-flash" : ""}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-cbs-muted">
            {fapping
              ? face.handsJoined
                ? "Dual joined"
                : "Fapping"
              : "Idle"}
          </p>
          {cumActive && (
            <span className="rounded-full bg-cbs-live/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Gonna cum ×3
            </span>
          )}
          {faceActionLabel && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                face.faceAction === "poppers"
                  ? "bg-[#FF0107]/90 text-white"
                  : "bg-cbs-accent/90 text-black"
              }`}
            >
              {faceActionLabel}
            </span>
          )}
        </div>
        <p className="mt-1 font-display text-2xl text-cbs-primary md:text-3xl">
          {pumps}
          <span className="ml-2 text-sm font-sans font-semibold tracking-normal text-white">
            FAPS
          </span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-white">
            Score <strong className="font-semibold">{Math.floor(score)}</strong>
          </span>
          <span className="text-cbs-accent">Combo ×{combo}</span>
          <span className="font-mono text-cbs-primary">
            ×{bonuses.total % 1 === 0 ? bonuses.total : bonuses.total.toFixed(1)}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-cbs-muted">
          1 fap ={" "}
          {bonuses.total % 1 === 0
            ? bonuses.total
            : bonuses.total.toFixed(1)}
          {cumActive ? " ×3" : ""} pts
        </p>
      </div>

      <div className="mr-16 w-[11.5rem] shrink-0 rounded-2xl border border-cbs-bg3 bg-black/55 px-3 py-2 backdrop-blur-md">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-cbs-muted">
          Bonus live
        </p>
        <div className="flex flex-col gap-1">
          <BonusRow
            label={bonuses.handLabel}
            mult={bonuses.handMult}
            active={bonuses.handMult > 1}
            hint="2 mains jointes = ×2 · sinon ×1 (même à 2 mains séparées)"
          />
          <BonusRow
            label={
              face.seen ? bonuses.eyesLabel : `Yeux —`
            }
            mult={face.seen ? bonuses.eyesMult : 1}
            active={face.seen && bonuses.eyesMult > 1}
            hint="2 yeux fermés = ×4 · 1 œil fermé = ×1.5"
          />
          <BonusRow
            label={
              face.seen ? bonuses.mouthLabel : "Bouche —"
            }
            mult={face.seen ? bonuses.mouthMult : 1}
            active={face.seen && bonuses.mouthMult > 1}
            hint="Bouche ouverte = ×2"
          />
          <div className="mt-1 grid grid-cols-[1fr_auto] border-t border-cbs-bg3 pt-1 text-[11px] font-semibold text-white">
            <span>Total</span>
            <span className="font-mono text-cbs-primary tabular-nums">
              ×{bonuses.total % 1 === 0 ? bonuses.total : bonuses.total.toFixed(1)}
            </span>
          </div>
        </div>
        <p className="mt-2 text-[9px] leading-snug text-cbs-muted">
          Cumulatif · {handCount} main{handCount === 1 ? "" : "s"} détectée
          {handCount === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
