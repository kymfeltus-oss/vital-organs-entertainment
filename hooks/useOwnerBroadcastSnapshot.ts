"use client";

import { useCallback, useEffect, useState } from "react";
import type { OwnerBroadcastSnapshot } from "@/lib/owner/contracts";
import { defaultOwnerCountdownSnapshot } from "@/lib/owner/build-countdown-snapshot";
import { defaultEventPhaseState } from "@/lib/owner/map-event-phase";

const POLL_MS = 4_000;

const EMPTY_SNAPSHOT: OwnerBroadcastSnapshot = {
  capturedAt: "",
  eventPhase: defaultEventPhaseState(),
  countdown: defaultOwnerCountdownSnapshot(),
  publish: { mode: "none", status: "offline", errorMessage: null },
  playback: {
    status: "unconfigured",
    hlsUrl: null,
    manifestReachable: false,
    errorMessage: null,
  },
  gate: {
    currentState: "offline",
    imminentLiveStartedAt: null,
    concertTitle: "The Awakening Experience",
    headlinerName: "Pastor David Jenkins",
    ticketCapacityLimit: 500,
    gatesLocked: false,
    preShowVipOnly: true,
  },
  feed: {
    activeSource: "offline",
    primary: { hlsUrl: null, manifestReachable: false, detail: null },
    backup: { hlsUrl: null, manifestReachable: false, detail: null },
  },
  preflight: [],
  publisherSessionId: null,
  publisherChannel: null,
  vmix: null,
};

type BroadcastResponse = {
  snapshot?: OwnerBroadcastSnapshot;
  error?: string;
  message?: string;
  ok?: boolean;
};

export function useOwnerBroadcastSnapshot() {
  const [snapshot, setSnapshot] = useState<OwnerBroadcastSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/owner/broadcast", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        setError("Owner access denied. Sign in with an ADMIN_EMAILS account.");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load broadcast snapshot.");
      }

      const data = (await response.json()) as BroadcastResponse;
      if (data.snapshot) setSnapshot(data.snapshot);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSnapshot();
    const intervalId = window.setInterval(() => void loadSnapshot(true), POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [loadSnapshot]);

  return { snapshot, loading, error, reload: loadSnapshot, setSnapshot };
}
