type Props = {
  showHands: boolean;
  showFace: boolean;
  showHud: boolean;
  onToggleHands: () => void;
  onToggleFace: () => void;
  onToggleHud: () => void;
};

function Chip({
  active,
  short,
  label,
  onClick,
}: {
  active: boolean;
  short: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-full border px-2 py-1 text-[10px] font-semibold transition sm:px-3 sm:py-1.5 sm:text-xs ${
        active
          ? "border-cbs-primary bg-cbs-primary text-black"
          : "border-cbs-bg3 bg-black/50 text-cbs-muted hover:text-white"
      }`}
    >
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function OverlayToggles({
  showHands,
  showFace,
  showHud,
  onToggleHands,
  onToggleFace,
  onToggleHud,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
      <Chip
        active={showHands}
        short="M"
        label="Mains"
        onClick={onToggleHands}
      />
      <Chip
        active={showFace}
        short="V"
        label="Visage"
        onClick={onToggleFace}
      />
      <Chip
        active={showHud}
        short="H"
        label="HUD cam"
        onClick={onToggleHud}
      />
    </div>
  );
}
