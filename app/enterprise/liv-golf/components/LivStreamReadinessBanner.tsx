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
  if (isLoading || !status) return null;

  const hardBlockers = status.goLiveBlockers ?? [];
  const ingestWarnings = status.ingestWarnings ?? [];
  const hasIssues = hardBlockers.length > 0 || ingestWarnings.length > 0;

  if (!hasIssues) return null;

  return (
    <aside
      className={`rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 ${className}`}
      role="status"
      aria-live="polite"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
        Stream Launch Diagnostics
      </p>

      {hardBlockers.length > 0 ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-200">
            Launch blockers
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-relaxed text-amber-50/90">
            {hardBlockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {ingestWarnings.length > 0 ? (
        <div className={hardBlockers.length > 0 ? "mt-3" : "mt-2"}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200">
            Ingest status
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-relaxed text-amber-50/90">
            {ingestWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {status.manifestProbeDetail ? (
        <p className="mt-3 font-mono text-[10px] text-amber-200/80">
          Manifest probe: {status.manifestProbeDetail}
        </p>
      ) : null}

      {status.scheduleEnded ? (
        <p className="mt-2 font-mono text-[10px] text-amber-200/80">
          Schedule note: past air time or eventPhase {status.eventPhase}
          {status.targetDateTime ? ` · targetDateTime: ${status.targetDateTime}` : ""} — does not
          block go-live.
        </p>
      ) : null}
    </aside>
  );
}
