"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { OpsSnapshot } from "@/lib/ops/types";

type OpsDeveloperDrawerProps = {
  snapshot: OpsSnapshot;
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

export default function OpsDeveloperDrawer({ snapshot }: OpsDeveloperDrawerProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [devPassword, setDevPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleUnlockLogs = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setVerifying(true);
    setAuthError(null);

    try {
      const response = await fetch("/api/ops/dev-drawer/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: devPassword }),
        cache: "no-store",
      });

      if (!response.ok) {
        setAuthError("Invalid authorization token signature.");
        setIsUnlocked(false);
        return;
      }

      setIsUnlocked(true);
      setDevPassword("");
    } catch {
      setAuthError("Unable to verify credential.");
    } finally {
      setVerifying(false);
    }
  }, [devPassword]);

  const closeDrawer = useCallback(() => {
    setShowDrawer(false);
  }, []);

  return (
    <footer className="mt-auto flex justify-center border-t border-brand-border pt-6">
      <button
        type="button"
        onClick={() => setShowDrawer((open) => !open)}
        className="font-ui text-xs font-medium text-brand-muted underline transition-colors hover:text-white"
      >
        {showDrawer ? "Hide Advanced Console Tools" : "🔧 Open Advanced Developer Drawer"}
      </button>

      {showDrawer ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-black/70 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-4xl flex-col gap-4 overflow-y-auto rounded-t-2xl border-t border-brand-border bg-brand-panel p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="font-ui text-sm font-bold text-white">Advanced Server Telemetry</h3>
                <p className="font-ui text-xs text-brand-muted">
                  Raw endpoint mutations, access logs, and database stream states.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded border border-brand-border bg-brand-black px-2.5 py-1 font-ui text-xs text-brand-muted"
              >
                Close
              </button>
            </div>

            {!isUnlocked ? (
              <form
                onSubmit={(event) => void handleUnlockLogs(event)}
                className="mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-3 p-8"
              >
                <p className="text-center font-ui text-xs text-brand-muted">
                  Enter the developer credential key to view secure network telemetry details.
                </p>
                <input
                  type="password"
                  placeholder="Enter Security Password"
                  value={devPassword}
                  onChange={(event) => setDevPassword(event.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-brand-black px-3 py-1.5 text-center font-ui text-xs text-white focus:border-brand-pink focus:outline-none"
                />
                {authError ? (
                  <p className="font-ui text-[10px] text-brand-pink">{authError}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full rounded-lg bg-brand-panel py-2 font-ui text-xs font-semibold text-white hover:bg-brand-black disabled:opacity-60"
                >
                  {verifying ? "Verifying…" : "Unlock System Logs"}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/dashboard/broadcast"
                    className="rounded-full border border-brand-purple/40 bg-brand-purple/10 px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-wider text-brand-purple"
                  >
                    Full Broadcast Console
                  </Link>
                  <Link
                    href="/ops/live-hub/readiness"
                    className="rounded-full border border-brand-blue/40 bg-brand-blue/10 px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-wider text-brand-blue"
                  >
                    Readiness Checklist
                  </Link>
                </div>

                <div className="overflow-x-auto rounded-lg border border-brand-border bg-brand-black p-4 font-ui text-[10px] text-brand-muted">
                  <p className="text-brand-purple">// AUTHORITATIVE SYSTEM TELEMETRY ACCESSED</p>
                  <p className="mt-2">
                    stream.activeSource={snapshot.stream.activeSource} · isLive=
                    {String(snapshot.stream.isLive)} · engine=
                    {snapshot.stream.studioEngineMode}
                  </p>
                  <p>
                    realtime.lastStreamStateSyncAt=
                    {formatTimestamp(snapshot.realtime.lastStreamStateSyncAt)}
                  </p>
                  <p>
                    stripe.paidOrdersLast24h={snapshot.stripe.paidOrdersLast24h} ·
                    totalPaidOrders={snapshot.stripe.totalPaidOrders}
                  </p>
                  <p>
                    stripe.lastPaidOrderAt={formatTimestamp(snapshot.stripe.lastPaidOrderAt)}
                  </p>
                </div>

                <div className="overflow-auto rounded-lg border border-brand-border">
                  <table className="min-w-full text-left font-ui text-[10px]">
                    <thead className="bg-brand-black text-brand-muted">
                      <tr>
                        <th className="px-3 py-2 font-bold uppercase">Timestamp</th>
                        <th className="px-3 py-2 font-bold uppercase">Result</th>
                        <th className="px-3 py-2 font-bold uppercase">Reason</th>
                        <th className="px-3 py-2 font-bold uppercase">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.accessLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-brand-muted">
                            No stream access telemetry recorded yet.
                          </td>
                        </tr>
                      ) : (
                        snapshot.accessLogs.slice(0, 40).map((log) => (
                          <tr
                            key={log.id}
                            className={
                              log.result === "denied"
                                ? "border-t border-brand-pink/20 bg-brand-pink/5 text-brand-pink"
                                : "border-t border-brand-border/40 text-brand-muted"
                            }
                          >
                            <td className="px-3 py-2 font-mono">
                              {formatTimestamp(log.created_at)}
                            </td>
                            <td className="px-3 py-2 font-bold uppercase">{log.result}</td>
                            <td className="px-3 py-2">{log.reason}</td>
                            <td className="px-3 py-2 font-mono">{log.ip ?? "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </footer>
  );
}
