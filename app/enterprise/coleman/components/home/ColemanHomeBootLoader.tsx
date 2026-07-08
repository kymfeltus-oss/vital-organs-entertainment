export default function ColemanHomeBootLoader() {
  return (
    <div
      className="coleman-premium-home relative flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Loading Coleman home"
    >
      <div className="coleman-premium-bg" aria-hidden>
        <div className="coleman-premium-wave coleman-premium-wave--1" />
        <div className="coleman-premium-wave coleman-premium-wave--2" />
        <div className="coleman-premium-vignette" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--cp-espresso)]/20 border-t-[var(--cp-espresso)]"
          aria-hidden
        />
        <span className="text-[9px] font-normal tracking-[0.28em] text-[var(--cp-muted)]">
          C O L E M A N
        </span>
      </div>
    </div>
  );
}
