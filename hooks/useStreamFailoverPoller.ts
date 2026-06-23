"use client";

import { useEffect } from "react";

const FAILOVER_POLL_MS = 2_000;

type UseStreamFailoverPollerOptions = {
  enabled: boolean;
};

/** Ops-only 2s pulse that triggers backend primary-ingest health checks while live on primary. */
export function useStreamFailoverPoller({ enabled }: UseStreamFailoverPollerOptions): void {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        await fetch("/api/ops/stream-health", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
      } catch (error) {
        console.warn("[STREAM_FAILOVER_POLLER]:", error);
      }
    };

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, FAILOVER_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [enabled]);
}
