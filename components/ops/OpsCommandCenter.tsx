"use client";

import Link from "next/link";
import { Loader2, Radio, ShieldAlert, Wifi } from "lucide-react";
import { formatPlaybackLaneLabel } from "@/lib/live/hls";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  centsToDollars,
  formatHarvestCurrency,
  computeHarvestProgressPercent,
} from "@/lib/live/harvest-metrics";
import type { OpsSnapshot, OpsStreamAction } from "@/lib/ops/types";

const METRICS_POLL_INTERVAL_MS = 8_000;

type OpsCommandCenterProps = {
  initialSnapshot: OpsSnapshot;
  adminEmail: string;
};

function formatTimestamp(value: string | null): string {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function streamStatusLabel(snapshot: OpsSnapshot): string {
  if (!snapshot.stream.isLive || snapshot.stream.activeSource === "offline") {
    return "Offline Standby";
  }

  if (snapshot.stream.activeSource === "backup") {
    return "Backup Active";
  }

  return "Primary Active";
}

function streamStatusTone(snapshot: OpsSnapshot): string {
  if (!snapshot.stream.isLive || snapshot.stream.activeSource === "offline") {
    return "border-zinc-700 bg-zinc-900/70 text-zinc-300";
  }

  if (snapshot.stream.activeSource === "backup") {
    return "border-[#B0267A]/60 bg-[#B0267A]/10 text-[#f5c2e0]";
  }

  return "border-[#1E40AF]/60 bg-[#1E40AF]/10 text-[#93c5fd]";
}

function HealthCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex min-h-[180px] flex-col rounded-xl border border-white/10 bg-[#111111]/90 p-4">
      <div className="flex items-center gap-2">
        <span className="text-[#1E40AF]">{icon}</span>
        <h2 className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-zinc-300">
          {title}
        </h2>
      </div>
      <div className="mt-4 flex flex-1 flex-col justify-between gap-3">{children}</div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#111111]/90 p-4">
      <p className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold tracking-tight text-white">{value}</p>
      {detail ? <p className="mt-2 text-xs text-zinc-400">{detail}</p> : null}
    </article>
  );
}

export default function OpsCommandCenter({
  initialSnapshot,
  adminEmail,
}: OpsCommandCenterProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<OpsStreamAction | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refreshSnapshot = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);

    try {
      const response = await fetch("/api/ops/metrics", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to refresh operations metrics.");
      }

      const next = (await response.json()) as OpsSnapshot;
      setSnapshot(next);
      setRefreshError(null);
    } catch (error) {
      setRefreshError(
        error instanceof Error ? error.message : "Unable to refresh operations metrics.",
      );
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void refreshSnapshot(true);
    }, METRICS_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [refreshSnapshot]);

  const runStreamAction = useCallback(
    async (action: OpsStreamAction) => {
      setPendingAction(action);
      setActionMessage(null);

      try {
        const response = await fetch("/api/ops/stream-action", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
          cache: "no-store",
        });

        const data = (await response.json()) as { error?: string; success?: boolean };

        if (!response.ok || !data.success) {
          throw new Error(data.error ?? "Stream action failed.");
        }

        setActionMessage(
          action === "go_live"
            ? "Primary lane is live."
            : action === "switch_backup"
              ? "Backup lane is active."
              : "Stream is offline.",
        );
        await refreshSnapshot(true);
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

  const harvestDollars = centsToDollars(snapshot.metrics.harvestTotalCents);
  const harvestPercent = computeHarvestProgressPercent(
    harvestDollars,
    snapshot.metrics.harvestGoalDollars,
  );

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0B090A] p-6 text-white">
      <header className="mb-5 flex shrink-0 items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.32em] text-[#1E40AF]">
            Operations Command Center
          </p>
          <h1 className="mt-1 text-lg font-bold uppercase tracking-widest text-white">
            300 Awakening Live Ops
          </h1>
          <p className="mt-2 text-xs text-zinc-500">
            Authenticated operator: {adminEmail}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#1E40AF]" />
          ) : null}
          <Link
            href="/ops/live-hub"
            className="rounded-full border border-[#B0267A]/50 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#f5c2e0] transition hover:border-[#B0267A] hover:bg-[#B0267A]/10"
          >
            Live Hub
          </Link>
          <button
            type="button"
            onClick={() => void refreshSnapshot()}
            className="rounded-full border border-[#1E40AF]/50 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#93c5fd] transition hover:border-[#1E40AF] hover:bg-[#1E40AF]/10"
          >
            Refresh Metrics
          </button>
        </div>
      </header>

      {refreshError ? (
        <p className="mb-4 rounded-xl border border-[#B0267A]/40 bg-[#B0267A]/10 px-4 py-2 text-xs text-zinc-200">
          {refreshError}
        </p>
      ) : null}

      {actionMessage ? (
        <p className="mb-4 rounded-xl border border-[#1E40AF]/40 bg-[#1E40AF]/10 px-4 py-2 text-xs text-zinc-200">
          {actionMessage}
        </p>
      ) : null}

      <div className="grid shrink-0 grid-cols-1 gap-4 xl:grid-cols-3">
        <HealthCard title="Stream Status" icon={<Radio className="h-4 w-4" />}>
          <div>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] ${streamStatusTone(snapshot)}`}
            >
              {streamStatusLabel(snapshot)}
            </span>
            <dl className="mt-4 space-y-2 text-xs text-zinc-400">
              <div className="flex justify-between gap-3">
                <dt>Active Source</dt>
                <dd className="font-mono text-zinc-200">{snapshot.stream.activeSource}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Primary Lane</dt>
                <dd className="font-mono text-zinc-200">
                  {formatPlaybackLaneLabel(
                    snapshot.stream.primaryPlaybackUrlStatus,
                    snapshot.stream.primaryConfigured,
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Backup Lane</dt>
                <dd className="font-mono text-zinc-200">
                  {formatPlaybackLaneLabel(
                    snapshot.stream.backupPlaybackUrlStatus,
                    snapshot.stream.backupConfigured,
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Last Mutation</dt>
                <dd className="font-mono text-zinc-200">
                  {formatTimestamp(snapshot.stream.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pendingAction !== null}
              onClick={() => void runStreamAction("go_live")}
              className="rounded-full border border-[#1E40AF]/60 bg-[#1E40AF]/15 px-3 py-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#93c5fd] transition hover:bg-[#1E40AF]/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pendingAction === "go_live" ? "Activating..." : "Go Live"}
            </button>
            <button
              type="button"
              disabled={pendingAction !== null}
              onClick={() => void runStreamAction("switch_backup")}
              className="rounded-full border border-[#B0267A]/60 bg-[#B0267A]/15 px-3 py-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#f5c2e0] transition hover:bg-[#B0267A]/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pendingAction === "switch_backup" ? "Switching..." : "Switch to Backup"}
            </button>
            <button
              type="button"
              disabled={pendingAction !== null}
              onClick={() => void runStreamAction("emergency_offline")}
              className="rounded-full border border-white/20 bg-zinc-900 px-3 py-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-zinc-200 transition hover:border-[#B0267A]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pendingAction === "emergency_offline" ? "Cutting..." : "Emergency Offline Now"}
            </button>
          </div>
        </HealthCard>

        <HealthCard
          title="Realtime Publication Sync"
          icon={<Wifi className="h-4 w-4" />}
        >
          <dl className="space-y-2 text-xs text-zinc-400">
            <div className="flex justify-between gap-3">
              <dt>Platform Channel</dt>
              <dd className="font-mono text-zinc-200">{snapshot.realtime.platformChannel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Broadcast Event</dt>
              <dd className="font-mono text-zinc-200">{snapshot.realtime.broadcastEvent}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Chat Messages (10m)</dt>
              <dd className="font-mono text-zinc-200">
                {snapshot.realtime.recentChatMessages10m}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Last Stream Sync</dt>
              <dd className="font-mono text-zinc-200">
                {formatTimestamp(snapshot.realtime.lastStreamStateSyncAt)}
              </dd>
            </div>
          </dl>
          <p className="text-[0.58rem] uppercase tracking-[0.16em] text-zinc-500">
            Realtime channel activity polled every {METRICS_POLL_INTERVAL_MS / 1000}s
          </p>
        </HealthCard>

        <HealthCard
          title="Stripe Live Hook Listeners"
          icon={<ShieldAlert className="h-4 w-4" />}
        >
          <dl className="space-y-2 text-xs text-zinc-400">
            <div className="flex justify-between gap-3">
              <dt>Paid Orders (24h)</dt>
              <dd className="font-mono text-zinc-200">
                {snapshot.stripe.paidOrdersLast24h}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Total Paid Orders</dt>
              <dd className="font-mono text-zinc-200">
                {snapshot.stripe.totalPaidOrders}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Last Fulfillment</dt>
              <dd className="font-mono text-zinc-200">
                {formatTimestamp(snapshot.stripe.lastPaidOrderAt)}
              </dd>
            </div>
          </dl>
          <p className="text-[0.58rem] uppercase tracking-[0.16em] text-zinc-500">
            Webhook health inferred from paid order ledger velocity
          </p>
        </HealthCard>
      </div>

      <div className="mt-4 grid shrink-0 grid-cols-1 gap-4 md:grid-cols-3">
        <MetricTile
          label="Total Paid Attendees"
          value={snapshot.metrics.paidAttendees.toLocaleString("en-US")}
          detail="Unique verified ticket holders"
        />
        <MetricTile
          label="Cumulative Harvest Progress"
          value={formatHarvestCurrency(harvestDollars)}
          detail={`${harvestPercent.toFixed(1)}% of ${formatHarvestCurrency(snapshot.metrics.harvestGoalDollars)} goal`}
        />
        <MetricTile
          label="Live Wallet Coins Distributed"
          value={snapshot.metrics.seedCoinsDistributed.toLocaleString("en-US")}
          detail="Total seed balance across active wallets"
        />
      </div>

      <section className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111111]/90">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-zinc-300">
            Live System Error Telemetry
          </h2>
          <p className="text-[0.58rem] uppercase tracking-[0.16em] text-zinc-500">
            stream_access_logs · latest {snapshot.accessLogs.length}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#0B090A] text-[0.58rem] uppercase tracking-[0.16em] text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-bold">Timestamp</th>
                <th className="px-4 py-3 font-bold">Result</th>
                <th className="px-4 py-3 font-bold">Reason</th>
                <th className="px-4 py-3 font-bold">IP</th>
                <th className="px-4 py-3 font-bold">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.accessLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No stream access telemetry recorded yet.
                  </td>
                </tr>
              ) : (
                snapshot.accessLogs.map((log) => {
                  const denied = log.result === "denied";

                  return (
                    <tr
                      key={log.id}
                      className={
                        denied
                          ? "border-t border-[#B0267A]/20 bg-[#B0267A]/10 text-[#f5c2e0]"
                          : "border-t border-white/5 text-zinc-300"
                      }
                    >
                      <td className="px-4 py-3 font-mono">
                        {formatTimestamp(log.created_at)}
                      </td>
                      <td className="px-4 py-3 font-bold uppercase tracking-[0.12em]">
                        {log.result}
                      </td>
                      <td className="px-4 py-3">{log.reason}</td>
                      <td className="px-4 py-3 font-mono">{log.ip ?? "—"}</td>
                      <td className="max-w-[320px] truncate px-4 py-3 font-mono">
                        {log.user_agent ?? "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
