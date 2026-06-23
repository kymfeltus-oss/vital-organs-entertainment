type ProductionPathBannerProps = {
  isLive: boolean;
};

export default function ProductionPathBanner({ isLive }: ProductionPathBannerProps) {
  if (!isLive) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 w-full border-b border-brand-pink/50 bg-brand-panel px-4 py-2.5 text-center text-sm font-medium text-brand-pink shadow-[0_0_20px_rgba(255,47,175,0.2)]"
    >
      <span className="inline-flex items-center justify-center gap-2 font-ui uppercase tracking-[0.12em]">
        <span
          className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-brand-pink motion-reduce:animate-none"
          aria-hidden="true"
        />
        On Air — Production Path — Attendees can see this stream
      </span>
    </div>
  );
}
