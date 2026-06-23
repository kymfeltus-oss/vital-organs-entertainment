"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { StudioEngineMode } from "@/lib/ops/studio-engine-mode";
import type { PullEngineStatus } from "@/lib/ops/ops-stream-state";

export type RestreamStatusStripTelemetry = {
  pullEngineStatus?: PullEngineStatus;
  activeSource?: string;
  uptime?: string;
  videoResolution?: string;
  fps?: number;
  droppedFramesPercent?: number;
  latencySeconds?: number;
  outputsActive?: number;
  outputsTotal?: number;
  localInputsActive?: number;
  isLive?: boolean;
  apiOk?: boolean;
};

type RestreamStatusStripProps = {
  engineMode: StudioEngineMode;
  activeSource?: "primary" | "backup" | "offline" | string;
  opsStream: RestreamStatusStripTelemetry | null;
};

export default function RestreamStatusStrip({
  engineMode,
  activeSource,
  opsStream,
}: RestreamStatusStripProps) {
  const resolvedSource =
    activeSource ?? opsStream?.activeSource ?? (opsStream?.isLive ? "primary" : "offline");
  const isFailoverActive = resolvedSource === "backup";
  const isInternalStudio = engineMode === "internal_studio";
  const isLive = opsStream?.isLive === true;
  const droppedFramesPercent = opsStream?.droppedFramesPercent ?? 0;
  const videoResolution = opsStream?.videoResolution ?? "1080p";

  if (isFailoverActive) {
    return (
      <div
        aria-label="Automatic failover engaged"
        className="flex w-full animate-pulse items-center justify-between rounded-lg border border-amber-500/70 bg-amber-500/5 px-4 py-2 font-ui text-xs font-bold text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.12)] transition-all"
      >
        <div className="flex min-w-0 items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="uppercase tracking-[0.08em]">
            Engine Warning: Automatic Failover Circuit Engaged
          </span>
        </div>
        <div className="shrink-0 rounded bg-amber-500/20 px-2 py-0.5 text-[0.68rem] uppercase tracking-wider text-amber-300">
          Routing Stream via Restream Cloud Backup
        </div>
      </div>
    );
  }

  const engineLabel = isInternalStudio
    ? "Internal Engine: Running"
    : opsStream?.pullEngineStatus === "error"
      ? "Pull Engine: Needs Attention"
      : "Pull Engine: Running";

  return (
    <div
      aria-label="Live show health status"
      className="flex w-full items-center justify-between rounded-lg border border-brand-border bg-brand-black/60 px-4 py-2 font-ui text-xs text-brand-muted transition-all"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1.5 text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          {engineLabel}
        </span>
        <span className="hidden text-brand-border sm:inline" aria-hidden="true">
          |
        </span>
        <span>Resolution: {videoResolution}</span>
        <span className="hidden text-brand-border sm:inline" aria-hidden="true">
          |
        </span>
        <span>Dropped Frames: {droppedFramesPercent.toFixed(2)}%</span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 text-[0.68rem] font-bold uppercase">
        {isLive ? (
          <span className="inline-flex animate-pulse items-center gap-1 text-brand-pink">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Distributing Live Stream
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-brand-purple">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Rehearsal Mode Active
          </span>
        )}
      </div>
    </div>
  );
}
