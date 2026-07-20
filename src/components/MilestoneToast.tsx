import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  message: string | null;
};

export function MilestoneToast({ message }: Props) {
  const { t } = useI18n();
  if (!message) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/3 z-30 flex justify-center px-4">
      <div className="milestone-toast rounded-2xl border border-cbs-primary/40 bg-black/70 px-6 py-4 text-center backdrop-blur-md">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-cbs-accent">
          {t("toast.milestone")}
        </p>
        <p className="mt-1 font-display text-xl text-cbs-primary md:text-2xl">
          {message}
        </p>
      </div>
    </div>
  );
}
