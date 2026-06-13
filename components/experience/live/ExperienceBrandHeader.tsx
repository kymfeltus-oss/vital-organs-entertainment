"use client";

type ExperienceBrandHeaderProps = {
  compact?: boolean;
  liveBadge?: boolean;
};

export default function ExperienceBrandHeader({
  compact = false,
  liveBadge = false,
}: ExperienceBrandHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.22em] text-brand-blue sm:text-[0.62rem]">
          Vital Organs Entertainment
        </p>
        <h1
          className={`mt-0.5 truncate font-headline uppercase tracking-[0.1em] text-white ${
            compact ? "text-base sm:text-lg" : "text-fluid-hero tracking-[0.12em]"
          }`}
        >
          300 Awakening Live Experience
        </h1>
      </div>

      {liveBadge ? (
        <span className="inline-flex shrink-0 items-center gap-2 rounded-md border border-red-500/50 bg-red-500/15 px-2.5 py-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-red-400">
            Live Now
          </span>
        </span>
      ) : null}
    </div>
  );
}
