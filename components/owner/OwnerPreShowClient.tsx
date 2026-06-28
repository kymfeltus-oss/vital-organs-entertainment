"use client";

import { useCallback, useState } from "react";
import PreShowCountdownManager from "@/components/owner/PreShowCountdownManager";
import { derivePendingTodos } from "@/lib/owner/derive-pending-todos";
import { useOwnerBroadcastSnapshot } from "@/hooks/useOwnerBroadcastSnapshot";

type CountdownResponse = {
  snapshot?: ReturnType<typeof useOwnerBroadcastSnapshot>["snapshot"];
  message?: string;
  ok?: boolean;
  error?: string;
};

export default function OwnerPreShowClient() {
  const { snapshot, loading, error, reload, setSnapshot } = useOwnerBroadcastSnapshot();
  const [timerPending, setTimerPending] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleAdjustTimer = useCallback(
    async (offsetSeconds: number) => {
      setTimerPending(true);
      setActionMessage(null);
      try {
        const response = await fetch("/api/owner/countdown", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offsetSeconds }),
        });
        const data = (await response.json()) as CountdownResponse;
        if (data.snapshot) setSnapshot(data.snapshot);
        setActionMessage(data.message ?? data.error ?? "Countdown updated.");
      } catch {
        setActionMessage("Countdown adjustment failed.");
      } finally {
        setTimerPending(false);
      }
    },
    [setSnapshot],
  );

  return (
    <div>
      {error ? (
        <div className="mx-4 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 font-body text-sm text-red-200 sm:mx-6">
          {error}
        </div>
      ) : null}
      {actionMessage ? (
        <div className="mx-4 mt-4 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 font-body text-sm text-slate-200 sm:mx-6">
          {actionMessage}
        </div>
      ) : null}
      {loading && !snapshot.capturedAt ? (
        <p className="p-6 font-body text-sm text-slate-500">Loading pre-show snapshot…</p>
      ) : (
        <PreShowCountdownManager
          snapshot={snapshot}
          pendingTodos={derivePendingTodos(snapshot.preflight)}
          onAdjustTimer={(offset) => void handleAdjustTimer(offset)}
          timerPending={timerPending}
        />
      )}
    </div>
  );
}
