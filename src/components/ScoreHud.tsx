import type { VisionFaceState } from "@/hooks/useVisionSession";
import { useI18n } from "@/i18n/I18nProvider";
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
  /** dock = bandeau mobile · sidebar = colonne desktop à droite de la cam */
  variant?: "dock" | "sidebar";
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
  variant = "dock",
}: Props) {
  const { t } = useI18n();

  const faceActionLabel =
    face.faceAction === "poppers"
      ? "Poppers"
      : face.faceAction === "vape"
        ? "Vape"
        : null;

  const totalLabel =
    bonuses.total % 1 === 0 ? bonuses.total : bonuses.total.toFixed(1);

  const dock = variant === "dock";
  const sidebar = variant === "sidebar";
  const handLabel = t(`score.${bonuses.handKey}`);
  const eyesLabel = face.seen
    ? t(`score.${bonuses.eyesKey}`)
    : t("score.eyesUnknown");
  const mouthLabel = face.seen
    ? t(`score.${bonuses.mouthKey}`)
    : t("score.mouthUnknown");

  const scoreCard = (
    <div
      className={`rounded-xl border border-cbs-bg3 px-2.5 py-1.5 ${
        dock
          ? "min-w-0 flex-1 bg-cbs-bg1/90"
          : "w-full bg-cbs-bg1/95 sm:rounded-2xl sm:px-3 sm:py-2.5"
      } ${flash ? "pump-flash" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-cbs-muted">
          {fapping
            ? face.handsJoined
              ? t("score.dualJoined")
              : t("score.fapping")
            : t("score.idle")}
        </p>
        {cumActive && (
          <span className="rounded-full bg-cbs-live/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            {t("score.cumBadge")}
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
          dock
            ? "text-lg leading-tight"
            : "mt-0.5 text-xl leading-tight sm:text-2xl"
        }`}
      >
        {pumps}
        <span className="ml-1.5 text-xs font-sans font-semibold tracking-normal text-white">
          {t("score.faps")}
        </span>
      </p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] sm:gap-x-2.5 sm:text-sm">
        <span className="text-white">
          {t("score.score")}{" "}
          <strong className="font-semibold">{Math.floor(score)}</strong>
        </span>
        <span className="text-cbs-accent">×{combo}</span>
        <span className="font-mono text-cbs-primary">×{totalLabel}</span>
      </div>
      {sidebar && (
        <p className="mt-1 text-[9px] text-cbs-muted sm:text-[10px]">
          {t("score.ptsLine", {
            pts: totalLabel,
            cum: cumActive ? " ×3" : "",
          })}
        </p>
      )}
    </div>
  );

  const bonusCard = (
    <div
      className={`shrink-0 rounded-xl border border-cbs-bg3 px-2 py-1.5 ${
        dock
          ? "w-[9.5rem] bg-cbs-bg1/90 sm:w-[11.5rem] sm:px-3 sm:py-2"
          : "w-full bg-cbs-bg1/95 sm:rounded-2xl sm:px-3 sm:py-2"
      }`}
    >
      <p className="mb-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-cbs-muted sm:mb-1.5 sm:text-[9px]">
        {t("score.bonusLive")}
      </p>
      <div className="flex flex-col gap-0.5 sm:gap-1">
        <BonusRow
          label={handLabel}
          mult={bonuses.handMult}
          active={bonuses.handMult > 1}
          hint={t("score.hintHands")}
          compact={dock}
        />
        <BonusRow
          label={eyesLabel}
          mult={face.seen ? bonuses.eyesMult : 1}
          active={face.seen && bonuses.eyesMult > 1}
          hint={t("score.hintEyes")}
          compact={dock}
        />
        <BonusRow
          label={mouthLabel}
          mult={face.seen ? bonuses.mouthMult : 1}
          active={face.seen && bonuses.mouthMult > 1}
          hint={t("score.hintMouth")}
          compact={dock}
        />
        <div className="mt-0.5 grid grid-cols-[1fr_auto] border-t border-cbs-bg3 pt-0.5 text-[10px] font-semibold text-white sm:mt-1 sm:pt-1 sm:text-[11px]">
          <span>{t("score.total")}</span>
          <span className="font-mono text-cbs-primary tabular-nums">
            ×{totalLabel}
          </span>
        </div>
      </div>
      {sidebar && (
        <p className="mt-1.5 text-[9px] leading-snug text-cbs-muted">
          {t("score.cumulative", { count: handCount })}
        </p>
      )}
    </div>
  );

  if (sidebar) {
    return (
      <div className="flex w-full flex-col gap-2">
        {scoreCard}
        {bonusCard}
      </div>
    );
  }

  return (
    <div className="flex w-full items-stretch gap-2">
      {scoreCard}
      {bonusCard}
    </div>
  );
}
