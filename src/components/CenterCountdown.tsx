type Props = {
  label: string | null;
};

export function CenterCountdown({ label }: Props) {
  if (!label) return null;

  const isBigWord = label.length > 2;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
      <div className="countdown-pop flex min-w-[40%] flex-col items-center justify-center rounded-3xl border border-cbs-primary/30 bg-black/70 px-10 py-8 backdrop-blur-md">
        <p
          className={`font-display text-cbs-primary ${
            isBigWord
              ? "text-3xl md:text-5xl"
              : "text-7xl md:text-9xl"
          }`}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
