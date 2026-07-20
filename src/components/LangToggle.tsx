import { useI18n } from "@/i18n/I18nProvider";

/** Toggle FR ↔ EN dans le header. */
export function LangToggle() {
  const { locale, toggleLocale, t } = useI18n();
  const next = locale === "fr" ? "EN" : "FR";

  return (
    <button
      type="button"
      onClick={toggleLocale}
      title={t("header.langToggle")}
      aria-label={t("header.langToggle")}
      className="flex h-8 min-w-10 shrink-0 items-center justify-center rounded-full border border-cbs-bg3 bg-black/50 px-2 font-mono text-[10px] font-semibold tracking-wider text-cbs-primary transition hover:border-cbs-primary hover:text-white sm:h-9 sm:min-w-11 sm:text-[11px]"
    >
      {next}
    </button>
  );
}
