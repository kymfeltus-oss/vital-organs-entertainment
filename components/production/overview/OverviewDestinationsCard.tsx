"use client";

import Link from "next/link";
import type { OpsSnapshot } from "@/lib/ops/types";
import { cn } from "@/lib/utils";

const DESTINATION_LABELS = [
  { id: "twitch", label: "Twitch", resolution: "1080p60" },
  { id: "youtube", label: "YouTube", resolution: "1080p60" },
  { id: "facebook", label: "Facebook Live", resolution: "1080p60" },
  { id: "kick", label: "Kick", resolution: "1080p60" },
  { id: "custom", label: "Custom RTMP", resolution: "1080p60" },
] as const;

type OverviewDestinationsCardProps = {
  stream: OpsSnapshot["stream"] | null;
  outputsActive: number;
  outputsTotal: number;
};

export default function OverviewDestinationsCard({
  stream,
  outputsActive,
  outputsTotal,
}: OverviewDestinationsCardProps) {
  const connected = stream?.storedRestreamOutputs?.pushConfigured === true;

  return (
    <section className="rounded-xl border border-brand-border bg-brand-panel/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
          Destinations
        </h2>
        <Link
          href="/production/destinations"
          className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-brand-blue"
        >
          Manage
        </Link>
      </div>

      <ul className="space-y-2">
        {DESTINATION_LABELS.map((destination, index) => {
          const isConnected =
            connected && index < Math.max(outputsActive, stream?.storedRestreamOutputs?.provisionedCount ?? 0);

          return (
            <li
              key={destination.id}
              className="flex items-center justify-between rounded-lg border border-brand-border bg-brand-black/30 px-3 py-2"
            >
              <div>
                <p className="font-body text-sm text-white">{destination.label}</p>
                <p className="font-body text-xs text-brand-muted">{destination.resolution}</p>
              </div>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.08em]",
                  isConnected
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-brand-border text-brand-muted",
                )}
              >
                {isConnected ? "Connected" : "Offline"}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 font-body text-xs text-brand-muted">
        {outputsActive}/{outputsTotal || 4} output lanes active
      </p>
    </section>
  );
}
