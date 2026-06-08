"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Loader2,
  MonitorPlay,
  Radio,
  RefreshCw,
  Volume2,
} from "lucide-react";
import LiveHubPreviewPlayer from "@/components/live-hub/LiveHubPreviewPlayer";
import type { OpsLivePreviewPayload } from "@/lib/live-hub/preview";
import { fetchOpsLivePreview } from "@/lib/live-hub/preview-client";
import { VMIX_OPERATOR_GUIDANCE } from "@/lib/live-hub/readiness";
import type { VmixState } from "@/lib/live-hub/vmix/types";
import { isVmixReachable } from "@/lib/live-hub/vmix/types";

type LiveHubPreviewPanelProps = {
  refreshSignal?: number;
  vmixState: VmixState | null;
  vmixError: string | null;
};

function statusTone(status: string): string {
  switch (status) {
    case "valid":
      return "text-[#93c5fd]";
    case "invalid":
      return "text-[#f5c2e0]";
    default:
      return "text-zinc-500";
  }
}

function streamStateLabel(state: OpsLivePreviewPayload["streamState"]): string {
  switch (state) {
    case "live":
      return "Live";
    case "standby":
      return "Standby";
    default:
      return "Offline";
  }
}

function streamStateTone(state: OpsLivePreviewPayload["streamState"]): string {
  switch (state) {
    case "live":
      return "border-[#1E40AF]/70 bg-[#1E40AF]/20 text-[#93c5fd]";
    case "standby":
      return "border-white/15 bg-[#111111]/80 text-zinc-300";
    default:
      return "border-white/10 bg-[#0B090A] text-zinc-500";
  }
}

function PreviewWaveformStrip() {
  return (
    <div
      aria-hidden="true"
      className="flex h-6 items-end justify-center gap-0.5 border-t border-white/10 bg-[#0B090A]/80 px-2 py-1"
    >
      {Array.from({ length: 24 }).map((_, index) => (
        <span
          key={index}
          className="live-waveform-bar w-0.5 rounded-full bg-gradient-to-t from-[#1E40AF] to-[#B0267A]"
          style={{ animationDelay: `${index * 0.05}s` }}
        />
      ))}
    </div>
  );
}

export default function LiveHubPreviewPanel({
  refreshSignal = 0,
  vmixState,
  vmixError,
}: LiveHubPreviewPanelProps) {
  const [preview, setPreview] = useState<OpsLivePreviewPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const refreshPreview = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const next = await fetchOpsLivePreview();
      setPreview(next);
      if (next.error) {
        setFetchError(next.error);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to refresh preview.";
      setFetchError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await fetchOpsLivePreview();
        if (cancelled) return;
        setPreview(next);
        setFetchError(next.error ?? null);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Unable to refresh preview.";
        setFetchError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshSignal]);

  const vmixReachable = isVmixReachable(vmixState);
  const audioPresent =
    vmixState && vmixReachable && (vmixState.audioMasterLevel ?? 0) > 0;

  const telemetry = useMemo(
    () => ({
      resolution: preview?.canPreview ? "1920×1080" : "—",
      fps: preview?.canPreview ? 30 : 0,
      bitrateKbps: preview?.canPreview ? 4500 : 0,
    }),
    [preview?.canPreview],
  );

  return (
    <section className="rounded-xl border border-white/10 bg-[#111111]/90 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
            Live Preview
          </h3>
          <p className="mt-1 text-[0.55rem] uppercase tracking-[0.14em] text-zinc-500">
            Viewer signal monitor
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshPreview()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-zinc-300 transition hover:border-[#1E40AF]/50 hover:text-white disabled:opacity-60"
        >
          <RefreshCw
            className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.55rem] font-bold uppercase tracking-[0.12em] ${streamStateTone(preview?.streamState ?? "offline")}`}
        >
          <Radio className="h-3 w-3" aria-hidden="true" />
          {streamStateLabel(preview?.streamState ?? "offline")}
        </span>
        <span className="rounded-full border border-white/10 bg-[#0B090A] px-3 py-1 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-zinc-400">
          Source · {preview?.activeSource ?? "offline"}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-[0.55rem] text-zinc-500">
        <div>
          <dt>Primary URL</dt>
          <dd
            className={`font-mono uppercase ${statusTone(preview?.primaryPlaybackUrlStatus ?? "missing")}`}
          >
            {preview?.primaryPlaybackUrlStatus ?? "—"}
          </dd>
        </div>
        <div>
          <dt>Backup URL</dt>
          <dd
            className={`font-mono uppercase ${statusTone(preview?.backupPlaybackUrlStatus ?? "missing")}`}
          >
            {preview?.backupPlaybackUrlStatus ?? "—"}
          </dd>
        </div>
      </dl>

      <div className="relative mt-3 overflow-hidden rounded-lg border border-[#1E40AF]/30 bg-[#0B090A]">
        <div className="relative aspect-video">
          {isLoading && !preview?.canPreview ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#1E40AF]" aria-hidden="true" />
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Loading preview state
              </p>
            </div>
          ) : preview?.canPreview && preview.playbackUrl ? (
            <LiveHubPreviewPlayer playbackUrl={preview.playbackUrl} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_center,rgba(30,64,175,0.1),transparent_70%)] px-4 text-center">
              <MonitorPlay className="h-8 w-8 text-[#1E40AF]" aria-hidden="true" />
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-zinc-400">
                {preview?.previewMessage ?? "No valid HLS preview source configured."}
              </p>
            </div>
          )}
        </div>
        <PreviewWaveformStrip />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-[0.58rem] text-zinc-500">
        <div>
          <dt>Resolution</dt>
          <dd className="font-mono text-zinc-300">{telemetry.resolution}</dd>
        </div>
        <div>
          <dt>FPS</dt>
          <dd className="font-mono text-zinc-300">{telemetry.fps || "—"}</dd>
        </div>
        <div>
          <dt>Bitrate</dt>
          <dd className="font-mono text-zinc-300">
            {telemetry.bitrateKbps ? `${telemetry.bitrateKbps} kbps` : "—"}
          </dd>
        </div>
        <div>
          <dt>Audio</dt>
          <dd className="flex items-center gap-1 font-mono text-zinc-300">
            <Volume2 className="h-3 w-3" aria-hidden="true" />
            {vmixReachable
              ? audioPresent
                ? "Present"
                : "Silent"
              : "vMix offline"}
          </dd>
        </div>
      </dl>

      {fetchError ? (
        <p className="mt-2 text-xs text-[#f5c2e0]">{fetchError}</p>
      ) : null}

      {!vmixReachable ? (
        <p className="mt-2 rounded-lg border border-white/10 bg-[#0B090A]/80 px-3 py-2 text-xs text-zinc-400">
          {vmixError ?? VMIX_OPERATOR_GUIDANCE}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/dashboard/live"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#1E40AF]/50 bg-[#1E40AF]/10 px-3 py-2 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-[#93c5fd] transition hover:border-[#1E40AF] hover:bg-[#1E40AF]/20"
        >
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
          Open Attendee View
        </Link>
      </div>
    </section>
  );
}
