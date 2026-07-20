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
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-cbs-primary bg-cbs-primary text-black"
          : "border-cbs-bg3 bg-black/50 text-cbs-muted hover:text-white"
      }`}
    >
      {label}
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
    <div className="flex flex-wrap items-center gap-2">
      <Chip active={showHands} label="Mains" onClick={onToggleHands} />
      <Chip active={showFace} label="Visage" onClick={onToggleFace} />
      <Chip active={showHud} label="HUD cam" onClick={onToggleHud} />
    </div>
  );
}
