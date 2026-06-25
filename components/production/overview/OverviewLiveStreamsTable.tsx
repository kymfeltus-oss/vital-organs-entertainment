"use client";

import Link from "next/link";
import { Video } from "lucide-react";
import type { OpsStreamState } from "@/lib/ops/ops-stream-state";
import type { OpsSnapshot } from "@/lib/ops/types";
import { cn } from "@/lib/utils";

type OverviewLiveStreamsTableProps = {
  stream: OpsSnapshot["stream"] | null;
  opsState: OpsStreamState | null;
  streamTitle: string;
};

function healthPercent(opsState: OpsStreamState | null): number {
  if (!opsState) return 0;
  let score = 50;
  if (opsState.apiOk) score += 20;
  if (opsState.pullEngineStatus === "running") score += 15;
  if (opsState.isLive) score += 10;
  if (opsState.droppedFramesPercent < 1) score += 5;
  return Math.min(100, score);
}

export default function OverviewLiveStreamsTable({
  stream,
  opsState,
  streamTitle,
}: OverviewLiveStreamsTableProps) {
  const health = healthPercent(opsState);
  const status = opsState?.isLive ? "LIVE" : stream?.primaryRtmpConfigured ? "STANDBY" : "OFFLINE";
  const statusClass =
    status === "LIVE"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      : status === "STANDBY"
        ? "border-brand-blue/30 bg-brand-blue/10 text-brand-blue"
        : "border-brand-border bg-brand-black/40 text-brand-muted";

  return (
    <section className="rounded-xl border border-brand-border bg-brand-panel/40">
      <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
        <h2 className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
          Live Streams
        </h2>
        <Link
          href="/production/streams"
          className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-brand-blue hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-brand-border font-ui text-[0.48rem] font-bold uppercase tracking-[0.1em] text-brand-muted">
              <th className="px-4 py-2">Stream</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Viewers</th>
              <th className="px-4 py-2">Bitrate</th>
              <th className="px-4 py-2">FPS</th>
              <th className="px-4 py-2">Health</th>
              <th className="px-4 py-2">Uptime</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-brand-border/60">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg border border-brand-border bg-brand-black/50 p-1.5 text-brand-purple">
                    <Video className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-body text-sm text-white">{streamTitle}</p>
                    <p className="font-body text-xs text-brand-muted">300 Awakening</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.08em]",
                    statusClass,
                  )}
                >
                  {status}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-brand-muted">—</td>
              <td className="px-4 py-3 font-mono text-xs text-white">
                {opsState?.bitrateKbps != null ? `${opsState.bitrateKbps} kbps` : "—"}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-white">
                {opsState?.fps ? opsState.fps : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-brand-black">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${health}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-brand-muted">{health}%</span>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-brand-muted">
                {opsState?.uptime ?? "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
