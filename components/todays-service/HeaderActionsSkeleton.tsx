/** Placeholder for header action buttons while dashboard data streams in. */
export default function HeaderActionsSkeleton() {
  return (
    <div className="flex flex-wrap items-start gap-3" aria-hidden="true">
      <div className="h-9 w-28 animate-pulse rounded-md border border-white/15 bg-white/8" />
      <div className="h-9 w-36 animate-pulse rounded-md border border-[#00f2ff]/30 bg-[#00f2ff]/10" />
    </div>
  );
}
