"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { StudioEngineMode } from "@/lib/ops/studio-engine-mode";
import type { PullEngineStatus } from "@/lib/ops/ops-stream-state";

export type RestreamStatusStripTelemetry = {
  pullEngineStatus?: PullEngineStatus;
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
  opsStream: RestreamStatusStripTelemetry | null;
};

function StatusMetric({
  label,
  value,
  fixHint,
  detailTitle,
  tone = "neutral",
  warn = false,
}: {
  label: string;
  value: string;
  fixHint?: string;
  detailTitle?: string;
  tone?: "healthy" | "neutral" | "warning" | "critical";
  warn?: boolean;
}) {
  const toneClass =
    tone === "healthy"
      ? "text-emerald-400"
      : tone === "warning"
        ? "text-amber-400 animate-pulse"
        : tone === "critical"
          ? "text-red-400 animate-pulse"
          : "text-zinc-300";

  return (
    <span
      className={`inline-flex max-w-full flex-col font-ui text-[0.48rem] font-medium uppercase ${toneClass}`}
      title={detailTitle}
    >
      <span className="inline-flex items-center gap-1">
        {warn ? <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" /> : null}
        <span className="text-brand-muted">{label}:</span>
        <span>{value}</span>
      </span>
      {fixHint && warn ? (
        <span className="mt-0.5 normal-case tracking-normal text-[0.44rem] text-amber-300/90">
          Fix: {fixHint}
        </span>
      ) : null}
    </span>
  );
}

export default function RestreamStatusStrip({
  engineMode,
  opsStream,
}: RestreamStatusStripProps) {
  const isInternalStudio = engineMode === "internal_studio";

  const pullEngineStatus = opsStream?.pullEngineStatus ?? "stopped";
  const uptime = opsStream?.uptime ?? "00:00:00";
  const droppedFramesPercent = opsStream?.droppedFramesPercent ?? 0;
  const latencySeconds = opsStream?.latencySeconds ?? 0;
  const outputsActive = opsStream?.outputsActive ?? 0;
  const outputsTotal = opsStream?.outputsTotal ?? 4;
  const localInputsActive = opsStream?.localInputsActive ?? 0;
  const isLive = opsStream?.isLive === true;
  const apiOk = opsStream?.apiOk !== false;

  const droppedWarn = droppedFramesPercent > 1.0;
  const latencyWarn = latencySeconds > 4;
  const outputsWarn = outputsActive < outputsTotal;
  const engineError = pullEngineStatus === "error" || !apiOk;
  const engineRunning = pullEngineStatus === "running" && apiOk;

  const containerBorder = engineError
    ? "border-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.1)]"
    : droppedWarn || latencyWarn || outputsWarn
      ? "border-amber-400/70 shadow-[0_0_12px_rgba(251,191,36,0.1)]"
      : "border-zinc-800/60";

  const systemLabel = engineRunning
    ? "Healthy & Running"
    : engineError
      ? "Needs Attention"
      : "Standby";

  return (
    <div
      aria-label="Live show health status"
      className={`rounded-lg border bg-brand-black/60 px-3 py-1.5 ${containerBorder}`}
    >
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <p className="font-ui text-[0.45rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
          Live show health
        </p>
        <div className="font-ui text-[0.52rem] font-bold uppercase">
          {isLive ? (
            <span className="inline-flex items-center gap-1 text-brand-pink">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Viewers Are Watching Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-brand-purple">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              Practice Mode — Not On Air Yet
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <StatusMetric
          label="System"
          value={systemLabel}
          tone={engineError ? "critical" : engineRunning ? "healthy" : "neutral"}
          warn={engineError}
          fixHint={
            engineError
              ? "Open Settings and confirm your camera stream links are saved."
              : undefined
          }
        />
        <StatusMetric label="Show Running For" value={uptime} tone="neutral" />
        <StatusMetric
          label="Picture Quality"
          value={isLive ? "Clear (HD)" : "Waiting for show start"}
          tone="neutral"
          detailTitle={
            opsStream?.videoResolution && opsStream.videoResolution !== "—"
              ? `Technical: ${opsStream.videoResolution}${opsStream.fps ? ` · ${opsStream.fps} FPS` : ""}`
              : undefined
          }
        />
        <StatusMetric
          label={droppedWarn ? "Warning: Blurry or Stuttering Video" : "Video Smoothness"}
          value={droppedWarn ? `${droppedFramesPercent.toFixed(2)}% issues` : "Looking good"}
          tone={droppedWarn ? "warning" : "healthy"}
          warn={droppedWarn}
          fixHint={
            droppedWarn
              ? "Ask the camera operator to move closer to their Wi-Fi router."
              : undefined
          }
        />
        <StatusMetric
          label={latencyWarn ? "Warning: Video is Lagging Behind" : "Live Delay"}
          value={latencyWarn ? `${latencySeconds.toFixed(1)}s behind` : "In sync"}
          tone={latencyWarn ? "warning" : latencySeconds <= 4 ? "healthy" : "neutral"}
          warn={latencyWarn}
          fixHint={
            latencyWarn
              ? "The video signal is lagging behind real life — check internet on the camera side."
              : undefined
          }
        />
        <StatusMetric
          label={
            outputsWarn
              ? "Setup"
              : isInternalStudio
                ? "Local Cameras Ready"
                : "Display Targets Connected"
          }
          value={
            isInternalStudio
              ? `${localInputsActive} of ${outputsTotal} ready`
              : `${outputsActive} of ${outputsTotal} connected`
          }
          tone={outputsWarn ? "warning" : "healthy"}
          warn={outputsWarn}
          fixHint={
            outputsWarn
              ? "Check the settings menu to connect the final display platform."
              : undefined
          }
        />
      </div>
    </div>
  );
}
