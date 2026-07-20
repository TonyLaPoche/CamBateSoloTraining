type Props = {
  label: string | null;
};

export function CenterCountdown({ label }: Props) {
  if (!label) return null;

  const isBigWord = label.length > 2;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-4">
      <div className="countdown-pop flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-cbs-primary/30 bg-black/70 px-6 py-6 backdrop-blur-md sm:min-w-[40%] sm:rounded-3xl sm:px-10 sm:py-8">
        <p
          className={`text-center font-display text-cbs-primary ${
            isBigWord
              ? "text-2xl sm:text-3xl md:text-5xl"
              : "text-6xl sm:text-7xl md:text-9xl"
          }`}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
