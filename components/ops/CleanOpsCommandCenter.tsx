"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  centsToDollars,
  computeHarvestProgressPercent,
  formatHarvestCurrency,
} from "@/lib/live/harvest-metrics";
import type { LiveHubHeartbeatPayload } from "@/lib/ops/live-hub-heartbeat";
import type { OpsSnapshot, OpsStreamAction } from "@/lib/ops/types";
import OpsDeveloperDrawer from "@/components/ops/OpsDeveloperDrawer";
import ProductionPathBanner from "@/components/ops/ProductionPathBanner";
import { useOpsStreamStateRealtime } from "@/hooks/useOpsStreamStateRealtime";

const HEARTBEAT_POLL_INTERVAL_MS = 15_000;

type StreamUiState = "offline" | "live" | "backup";

type CleanOpsCommandCenterProps = {
  initialSnapshot: OpsSnapshot;
  operatorEmail: string;
};

function resolveStreamUiState(stream: OpsSnapshot["stream"]): StreamUiState {
  if (!stream.isLive || stream.activeSource === "offline") return "offline";
  if (stream.activeSource === "backup") return "backup";
  return "live";
}

function resolveSafetyStatus(stream: OpsSnapshot["stream"]): {
  ok: boolean;
  title: string;
  detail: string;
  footnote: string;
} {
  const primaryReady =
    stream.primaryConfigured ||
    stream.cameraPreviewConfigured ||
    stream.primaryRtmpPullConfigured;
  const backupReady = stream.backupConfigured || stream.backupRtmpPullConfigured;

  if (!primaryReady) {
    return {
      ok: false,
      title: "Setup Needed",
      detail: "Primary video path is not configured yet.",
      footnote: "Open Restream Setup before going live.",
    };
  }

  if (!backupReady) {
    return {
      ok: true,
      title: "Primary Path Ready",
      detail: "Main stream looks configured. Backup lane is optional.",
      footnote: "Ready for show execution.",
    };
  }

  return {
    ok: true,
    title: "All Lanes Stable",
    detail: "No stream blockers found.",
    footnote: "Ready for show execution.",
  };
}

function streamStatusBadgeClass(state: StreamUiState): string {
  switch (state) {
    case "live":
      return "bg-brand-pink/10 text-brand-pink";
    case "backup":
      return "bg-brand-purple/10 text-brand-purple";
    default:
      return "bg-brand-black text-brand-muted";
  }
}

export default function CleanOpsCommandCenter({
  initialSnapshot,
  operatorEmail,
}: CleanOpsCommandCenterProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [pendingAction, setPendingAction] = useState<OpsStreamAction | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const patchStreamState = useCallback((stream: OpsSnapshot["stream"]) => {
    setSnapshot((current) => ({
      ...current,
      stream,
      realtime: {
        ...current.realtime,
        lastStreamStateSyncAt: stream.updatedAt,
      },
    }));
  }, []);

  useOpsStreamStateRealtime(patchStreamState);

  const refreshSnapshot = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/live-hub/heartbeat", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as LiveHubHeartbeatPayload;
      setSnapshot(data.opsSnapshot);
    } catch {
      // Keep last good snapshot visible for operators.
    }
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshSnapshot();
    }, HEARTBEAT_POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [refreshSnapshot]);

  const streamState = resolveStreamUiState(snapshot.stream);
  const safety = useMemo(
    () => resolveSafetyStatus(snapshot.stream),
    [snapshot.stream],
  );

  const harvestDollars = centsToDollars(snapshot.metrics.harvestTotalCents);
  const harvestLabel = formatHarvestCurrency(harvestDollars);
  const harvestPercent = computeHarvestProgressPercent(
    harvestDollars,
    snapshot.metrics.harvestGoalDollars,
  );
  const backupReady =
    snapshot.stream.backupConfigured || snapshot.stream.backupRtmpPullConfigured;

  const runStreamAction = useCallback(
    async (action: OpsStreamAction) => {
      setPendingAction(action);
      setActionMessage(null);

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

        setActionMessage(
          action === "go_live"
            ? "Primary stream is now live for attendees."
            : action === "switch_backup"
              ? "Backup lane is now live for attendees."
              : "Stream is offline. Attendees see the holding state.",
        );

        await refreshSnapshot();
      } catch (error) {
        setActionMessage(
          error instanceof Error ? error.message : "Stream action failed.",
        );
      } finally {
        setPendingAction(null);
      }
    },
    [refreshSnapshot],
  );

  return (
    <div className="flex min-h-dvh flex-col gap-6 bg-brand-black p-6 font-body text-white">
      <ProductionPathBanner isLive={snapshot.stream.isLive} />

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <h1 className="font-ui text-xl font-bold tracking-tight">Awakening Operations</h1>
          <p className="font-ui text-xs text-brand-muted">Simplified Command Center</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-brand-border bg-brand-panel px-3 py-1 font-ui text-xs text-brand-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" aria-hidden="true" />
          Active Operator · {operatorEmail}
        </div>
      </header>

      {actionMessage ? (
        <p
          className={`rounded-lg border px-4 py-2 font-ui text-xs ${
            /failed|forbidden|invalid|required|error|not configured/i.test(actionMessage)
              ? "border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
              : "border-brand-blue/30 bg-brand-blue/10 text-white"
          }`}
          role="status"
        >
          {actionMessage}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-xl border border-brand-border bg-brand-panel p-5 md:col-span-2">
          <div>
            <h2 className="font-ui text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Stream Master Actions
            </h2>
            <p className="font-ui text-[11px] text-brand-muted">
              One-click controls to toggle states for all public attendees.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-border bg-brand-black p-2.5 font-ui text-xs">
            <span className="text-brand-muted">Active Output Track:</span>
            <span
              className={`rounded px-2 py-0.5 font-bold uppercase tracking-wide ${streamStatusBadgeClass(streamState)}`}
            >
              {streamState}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => void runStreamAction("go_live")}
              disabled={pendingAction != null}
              className="touch-target rounded-lg bg-brand-pink py-2.5 font-ui text-xs font-semibold tracking-wide shadow-sm disabled:opacity-60"
            >
              {pendingAction === "go_live" ? "Working…" : "🚀 GO LIVE"}
            </button>
            <button
              type="button"
              onClick={() => void runStreamAction("switch_backup")}
              disabled={pendingAction != null}
              className="touch-target rounded-lg bg-brand-purple py-2.5 font-ui text-xs font-semibold tracking-wide shadow-sm disabled:opacity-60"
            >
              {pendingAction === "switch_backup" ? "Working…" : "🔄 USE BACKUP"}
            </button>
            <button
              type="button"
              onClick={() => void runStreamAction("emergency_offline")}
              disabled={pendingAction != null}
              className="touch-target rounded-lg border border-brand-pink/50 bg-brand-pink/15 py-2.5 font-ui text-xs font-semibold tracking-wide text-brand-pink disabled:opacity-60"
            >
              {pendingAction === "emergency_offline" ? "Working…" : "🛑 GO OFFLINE"}
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-brand-border bg-brand-panel p-5">
          <div>
            <h2 className="font-ui text-xs font-semibold uppercase tracking-wider text-brand-muted">
              System Shield
            </h2>
            <p className="font-ui text-[11px] text-brand-muted">Automated stream health guard.</p>
          </div>
          <div
            className={`my-2 flex items-center gap-3 rounded-lg border p-3 ${
              safety.ok
                ? "border-brand-blue/20 bg-brand-blue/5"
                : "border-brand-pink/20 bg-brand-pink/5"
            }`}
          >
            <div
              className={`font-ui text-sm font-bold ${safety.ok ? "text-brand-blue" : "text-brand-pink"}`}
            >
              {safety.ok ? "✓" : "!"}
            </div>
            <div>
              <p
                className={`font-ui text-xs font-semibold ${safety.ok ? "text-brand-blue" : "text-brand-pink"}`}
              >
                {safety.title}
              </p>
              <p className="font-ui text-[10px] text-brand-muted">{safety.detail}</p>
            </div>
          </div>
          <p className="text-center font-ui text-[10px] italic text-brand-muted">
            {safety.footnote}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-brand-border bg-brand-panel p-4 text-center">
          <p className="mb-1 font-ui text-xs font-medium text-brand-muted">Attendees Online</p>
          <p className="text-2xl font-bold">
            {snapshot.metrics.paidAttendees.toLocaleString("en-US")}
          </p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-panel p-4 text-center">
          <p className="mb-1 font-ui text-xs font-medium text-brand-muted">Event Goals Raised</p>
          <p className="text-2xl font-bold text-white">{harvestLabel}</p>
          <p className="mt-1 font-ui text-[10px] text-brand-muted">
            {harvestPercent.toFixed(1)}% of goal
          </p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-panel p-4 text-center">
          <p className="mb-1 font-ui text-xs font-medium text-brand-muted">Backup Route</p>
          <p
            className={`text-2xl font-bold ${backupReady ? "text-brand-blue" : "text-brand-muted"}`}
          >
            {backupReady ? "STANDBY" : "SETUP"}
          </p>
        </div>
      </div>

      <OpsDeveloperDrawer snapshot={snapshot} />
    </div>
  );
}
