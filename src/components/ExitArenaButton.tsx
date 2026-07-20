type Props = {
  onExit: () => void;
};

export function ExitArenaButton({ onExit }: Props) {
  return (
    <button
      type="button"
      onClick={onExit}
      className="absolute right-2 top-2 z-30 flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-full border border-cbs-bg3 bg-black/70 px-2.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:border-cbs-live hover:text-cbs-primary sm:right-3 sm:top-3 sm:gap-2 sm:px-3"
      aria-label="Exit"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M10 3H5a2 2 0 00-2 2v14a2 2 0 002 2h5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M15 17l5-5-5-5M20 12H10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="hidden sm:inline">Exit</span>
    </button>
  );
}
