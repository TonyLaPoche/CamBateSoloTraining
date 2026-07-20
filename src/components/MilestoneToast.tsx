type Props = {
  message: string | null;
};

export function MilestoneToast({ message }: Props) {
  if (!message) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/3 z-30 flex justify-center px-4">
      <div className="milestone-toast rounded-2xl border border-bm-primary/40 bg-black/70 px-6 py-4 text-center backdrop-blur-md">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-bm-brand">
          Milestone
        </p>
        <p className="mt-1 font-display text-xl text-bm-primary md:text-2xl">
          {message}
        </p>
      </div>
    </div>
  );
}
