"use client";

import { useCallback, useMemo, useState } from "react";
import LiveHubPreviewPlayer from "@/components/live-hub/LiveHubPreviewPlayer";
import ProductionPathBanner from "@/components/ops/ProductionPathBanner";
import { resolveActiveOpsPreviewHlsUrl } from "@/lib/ops/resolve-active-stream-playback";
import { useOpsStreamStateRealtime } from "@/hooks/useOpsStreamStateRealtime";
import { useStreamFailoverPoller } from "@/hooks/useStreamFailoverPoller";
import type { OpsSnapshot, OpsStreamAction } from "@/lib/ops/types";

type ActivityEntry = {
  id: string;
  time: string;
  message: string;
  tone?: "default" | "accent" | "warn";
};

type CleanLiveConsoleProps = {
  initialStream?: OpsSnapshot["stream"];
};

function formatClock(date = new Date()): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function pushActivity(
  setLog: React.Dispatch<React.SetStateAction<ActivityEntry[]>>,
  message: string,
  tone: ActivityEntry["tone"] = "default",
) {
  setLog((current) => [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      time: formatClock(),
      message,
      tone,
    },
    ...current.slice(0, 11),
  ]);
}

export default function CleanLiveConsole({ initialStream }: CleanLiveConsoleProps) {
  const { stream: opsStream } = useOpsStreamStateRealtime();
  const stream = opsStream ?? initialStream ?? null;

  const [previewLane, setPreviewLane] = useState<"primary" | "backup">("primary");
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [pendingAction, setPendingAction] = useState<OpsStreamAction | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([
    {
      id: "boot",
      time: formatClock(),
      message: "system: Core engine initialized.",
      tone: "default",
    },
    {
      id: "sync",
      time: formatClock(),
      message: "database: Attendee schedule synchronized.",
      tone: "default",
    },
    {
      id: "await",
      time: formatClock(),
      message: "state: Ready for show execution token.",
      tone: "accent",
    },
  ]);

  const isLive = stream?.isLive === true;
  const liveSource: "primary" | "backup" =
    stream?.activeSource === "backup" ? "backup" : "primary";
  const activeLane = isLive ? liveSource : previewLane;

  useStreamFailoverPoller({
    enabled: isLive && liveSource === "primary",
  });

  const previewUrl = useMemo(() => {
    if (activeLane === "backup") {
      return stream?.backupPlaybackUrl?.trim() || stream?.cameraPreviewHlsUrl?.trim() || null;
    }
    return resolveActiveOpsPreviewHlsUrl(stream);
  }, [activeLane, stream]);

  const runStreamAction = useCallback(async (action: OpsStreamAction) => {
    setPendingAction(action);

    try {
      const response = await fetch("/api/ops/stream-action", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        cache: "no-store",
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Stream action failed.");
      }

      if (action === "go_live") {
        pushActivity(setActivityLog, "state: primary lane is now on air.", "accent");
      } else if (action === "switch_backup") {
        pushActivity(setActivityLog, "state: backup lane is now on air.", "accent");
      } else {
        pushActivity(setActivityLog, "state: emergency offline — stream cut.", "warn");
      }
    } catch (error) {
      pushActivity(
        setActivityLog,
        `error: ${error instanceof Error ? error.message : "Stream action failed."}`,
        "warn",
      );
    } finally {
      setPendingAction(null);
    }
  }, []);

  const handleToggleLive = useCallback(() => {
    void runStreamAction(isLive ? "emergency_offline" : "go_live");
  }, [isLive, runStreamAction]);

  const handleLaneSwitch = useCallback(
    (lane: "primary" | "backup") => {
      if (!isLive) {
        setPreviewLane(lane);
        pushActivity(
          setActivityLog,
          `preview: ${lane === "primary" ? "primary feed" : "backup lane"} selected.`,
        );
        return;
      }

      if (lane === "primary" && liveSource !== "primary") {
        void runStreamAction("go_live");
        return;
      }

      if (lane === "backup" && liveSource !== "backup") {
        void runStreamAction("switch_backup");
      }
    },
    [isLive, liveSource, runStreamAction],
  );

  return (
    <div className="flex min-h-dvh flex-col gap-6 bg-brand-black p-6 font-body text-white">
      <ProductionPathBanner isLive={isLive} />

      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-border bg-brand-panel p-4 shadow-md">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${isLive ? "animate-pulse bg-brand-pink" : "bg-brand-muted"}`}
            aria-hidden="true"
          />
          <div>
            <h1 className="font-ui text-lg font-bold">Live Production Console</h1>
            <p className="font-ui text-xs text-brand-muted">Show-Day Sequence Controller</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleLive}
          disabled={pendingAction != null}
          className={`touch-target rounded-lg px-8 py-3 font-ui text-sm font-bold tracking-wide transition-all disabled:opacity-60 ${
            isLive
              ? "border border-brand-pink/60 bg-brand-pink/20 text-brand-pink neon-pink-glow"
              : "bg-brand-pink text-white neon-pink-glow hover:opacity-90"
          }`}
        >
          {pendingAction
            ? "Working…"
            : isLive
              ? "🛑 EMERGENCY STOP (OFFLINE)"
              : "⚡ GO LIVE NOW"}
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-xl border border-brand-border bg-brand-panel p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border pb-3">
            <div className="flex items-center gap-3">
              <h2 className="font-ui text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Broadcast Source Monitor
              </h2>
              <button
                type="button"
                onClick={() => setShowTechDetails((value) => !value)}
                className="font-ui text-[10px] uppercase tracking-wider text-brand-purple underline"
              >
                {showTechDetails ? "Hide tech details" : "Show tech details"}
              </button>
            </div>

            <div className="flex rounded-lg border border-brand-border bg-brand-black p-1">
              <button
                type="button"
                onClick={() => handleLaneSwitch("primary")}
                disabled={pendingAction != null}
                className={`touch-target rounded-md px-4 py-1 font-ui text-xs font-medium transition-all disabled:opacity-60 ${
                  activeLane === "primary" ? "bg-brand-pink text-white" : "text-brand-muted"
                }`}
              >
                Primary Feed
              </button>
              <button
                type="button"
                onClick={() => handleLaneSwitch("backup")}
                disabled={pendingAction != null}
                className={`touch-target rounded-md px-4 py-1 font-ui text-xs font-medium transition-all disabled:opacity-60 ${
                  activeLane === "backup" ? "bg-brand-purple text-white" : "text-brand-muted"
                }`}
              >
                Backup Lane
              </button>
            </div>
          </div>

          {showTechDetails ? (
            <div className="rounded-lg border border-brand-border bg-brand-black p-3 font-ui text-[10px] text-brand-muted">
              engine={stream?.studioEngineMode ?? "—"} · activeSource=
              {stream?.activeSource ?? "offline"} · preview=
              {stream?.cameraPreviewConfigured ? "configured" : "missing"} · backupPull=
              {stream?.backupRtmpPullConfigured ? "configured" : "missing"}
            </div>
          ) : null}

          <div className="relative flex min-h-[380px] flex-1 flex-col items-center justify-center overflow-hidden rounded-lg border border-brand-border bg-brand-black p-6 text-center">
            {previewUrl ? (
              <div className="absolute inset-0">
                <LiveHubPreviewPlayer playbackUrl={previewUrl} />
              </div>
            ) : (
              <>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-brand-border bg-brand-panel">
                  <span
                    className={`h-2 w-2 rounded-full ${isLive ? "animate-ping bg-brand-blue" : "bg-brand-muted"}`}
                    aria-hidden="true"
                  />
                </div>
                <p className="font-ui text-sm font-medium tracking-tight text-white">
                  {isLive
                    ? `STREAMING ACTIVE VIA ${activeLane.toUpperCase()}`
                    : "STREAM SYSTEM IDLE"}
                </p>
                <p className="mt-1 font-ui text-xs text-brand-muted">
                  Attendee player channels configured and locked.
                </p>
              </>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4 rounded-xl border border-brand-border bg-brand-panel p-5">
          <h2 className="border-b border-brand-border pb-3 font-ui text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Event Log
          </h2>
          <div className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto font-ui text-[11px] text-brand-muted">
            {activityLog.map((entry) => (
              <div
                key={entry.id}
                className={`rounded border p-2 ${
                  entry.tone === "accent"
                    ? "border-brand-pink/30 text-brand-pink"
                    : entry.tone === "warn"
                      ? "border-brand-purple/30 text-brand-purple"
                      : "border-brand-border/40 bg-brand-black"
                }`}
              >
                ● [{entry.time}] {entry.message}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
