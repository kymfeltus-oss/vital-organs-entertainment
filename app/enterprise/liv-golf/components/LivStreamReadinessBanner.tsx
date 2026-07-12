"use client";

import type { LivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";

type LivStreamReadinessBannerProps = {
  status: LivStreamSetupStatus | null;
  isLoading?: boolean;
  className?: string;
};

export default function LivStreamReadinessBanner({
  status,
  isLoading = false,
  className = "",
}: LivStreamReadinessBannerProps) {
  if (isLoading || !status?.readinessBlockers.length) return null;

  return (
    <aside
      className={`rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 ${className}`}
      role="status"
      aria-live="polite"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
        Stream Readiness Blockers
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-amber-50/90">
        {status.readinessBlockers.map((blocker) => (
          <li key={blocker}>{blocker}</li>
        ))}
      </ul>
      {status.manifestProbeDetail ? (
        <p className="mt-3 font-mono text-[10px] text-amber-200/80">
          Manifest probe: {status.manifestProbeDetail}
        </p>
      ) : null}
    </aside>
  );
}
