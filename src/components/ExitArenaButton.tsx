type Props = {
  onExit: () => void;
};

export function ExitArenaButton({ onExit }: Props) {
  return (
    <button
      type="button"
      onClick={onExit}
      className="absolute right-3 top-3 z-30 flex items-center gap-2 rounded-full border border-cbs-bg3 bg-black/70 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:border-cbs-live hover:text-cbs-primary"
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
      Exit
    </button>
  );
}
