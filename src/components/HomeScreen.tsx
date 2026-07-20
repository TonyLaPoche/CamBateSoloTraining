import { useMemo, useState } from "react";
import { MobilePermissionsCard } from "@/components/MobilePermissionsCard";
import { useI18n } from "@/i18n/I18nProvider";
import type { SavedSessionMeta } from "@/lib/sessionLibrary";
import {
  formatDuration,
  isValidPseudo,
  normalizePseudo,
} from "@/lib/sessionLibrary";

type Props = {
  sessions: SavedSessionMeta[];
  bestScore: number;
  bestCombo: number;
  initialPseudo: string;
  onEnterArena: (pseudo: string) => void;
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
};

export function HomeScreen({
  sessions,
  bestScore,
  bestCombo,
  initialPseudo,
  onEnterArena,
  onPlay,
  onDelete,
  onDownload,
}: Props) {
  const { t } = useI18n();
  const [pseudo, setPseudo] = useState(initialPseudo);
  const normalized = useMemo(() => normalizePseudo(pseudo), [pseudo]);
  const valid = isValidPseudo(normalized);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-0.5 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:gap-4 sm:px-1 sm:py-2">
      <section className="rounded-2xl border border-cbs-bg3 bg-cbs-bg1 p-4 sm:p-6 md:p-8">
        <div className="h-1 w-16 rounded-full cbs-gradient-bg sm:w-20" />
        <h2 className="mt-3 font-display text-xl text-white sm:mt-4 sm:text-2xl md:text-4xl">
          {t("home.title")}
        </h2>
        <p className="mt-2 max-w-lg text-xs leading-relaxed text-cbs-muted sm:text-sm">
          {t("home.intro")}{" "}
          <span className="break-all text-cbs-primary">AABB-20-07-2026-22:39</span>.
        </p>

        <label className="mt-5 block sm:mt-6">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cbs-accent">
            {t("home.pseudo")}
          </span>
          <input
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            value={pseudo}
            maxLength={5}
            autoComplete="off"
            spellCheck={false}
            placeholder="AABB"
            onChange={(e) => setPseudo(normalizePseudo(e.target.value))}
            className="mt-2 w-full max-w-xs rounded-xl border border-cbs-bg3 bg-black/50 px-4 py-3 font-display text-2xl tracking-[0.2em] text-cbs-primary outline-none placeholder:text-cbs-muted focus:border-cbs-primary"
          />
          <span className="mt-2 block text-xs text-cbs-muted">
            {normalized.length}/5 · {t("home.pseudoHint")}
            {!valid && normalized.length > 0 ? ` · ${t("home.pseudoMin")}` : ""}
          </span>
        </label>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-cbs-muted">
          <span>
            {t("home.bestScore")}{" "}
            <strong className="text-white">{bestScore}</strong>
          </span>
          <span>
            {t("home.bestCombo")}{" "}
            <strong className="text-cbs-accent">×{bestCombo}</strong>
          </span>
          <span>
            {t("home.sessions")}{" "}
            <strong className="text-white">{sessions.length}</strong>
          </span>
        </div>
        <button
          type="button"
          className="cbs-btn cbs-btn-primary mt-5 w-full sm:mt-6 sm:w-auto"
          disabled={!valid}
          onClick={() => onEnterArena(normalized)}
        >
          {t("home.enterArena")}
        </button>
      </section>

      <MobilePermissionsCard />

      <section className="rounded-2xl border border-cbs-bg3 bg-cbs-bg1 p-3 sm:p-4 md:p-6">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cbs-accent sm:text-xs">
          {t("home.sessionsTitle")}
        </h3>
        {sessions.length === 0 ? (
          <p className="mt-3 text-xs text-cbs-muted sm:mt-4 sm:text-sm">
            {t("home.sessionsEmpty")}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 sm:mt-4">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 rounded-xl border border-cbs-bg3 bg-black/40 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4"
              >
                <div className="min-w-0">
                  <p className="break-all font-mono text-xs text-cbs-primary sm:text-sm">
                    {s.id}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-cbs-muted sm:text-xs">
                    {s.pseudo ? `${s.pseudo} · ` : ""}
                    {s.pumps} pumps · score {s.score} · combo ×{s.bestCombo} ·{" "}
                    {formatDuration(s.durationMs)}
                    {s.hasVideo ? " · vidéo" : " · stats"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.hasVideo && (
                    <>
                      <button
                        type="button"
                        className="cbs-btn cbs-btn-primary !min-h-9 !px-3 !py-1.5 !text-xs"
                        onClick={() => onPlay(s.id)}
                      >
                        {t("home.play")}
                      </button>
                      <button
                        type="button"
                        className="cbs-btn cbs-btn-ghost !min-h-9 !px-3 !py-1.5 !text-xs"
                        onClick={() => onDownload(s.id)}
                      >
                        {t("home.download")}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="cbs-btn cbs-btn-ghost !min-h-9 !px-3 !py-1.5 !text-xs"
                    onClick={() => onDelete(s.id)}
                  >
                    {t("home.delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
