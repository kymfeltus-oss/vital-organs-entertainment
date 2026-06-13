"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchLiveAccessEvaluation } from "@/lib/access";
import { LIVE_STREAM_STATE_BROADCAST_EVENT } from "@/lib/live/types";
import {
  acquirePlatformChannel,
  commitPlatformChannelSubscribe,
  releasePlatformChannel,
} from "@/lib/live/platform-channel";
import { getSupabase } from "@/lib/supabase/client";

const POLL_FALLBACK_MS = 30_000;

type AttendeeLiveState = {
  isLive: boolean;
  isLoading: boolean;
};

/** Attendee live signal — realtime first, safe polling fallback if sync fails. */
export function useAttendeeLiveState(): AttendeeLiveState {
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usePollingFallback, setUsePollingFallback] = useState(false);

  const syncLiveState = useCallback(async () => {
    try {
      const evaluation = await fetchLiveAccessEvaluation();
      setIsLive(evaluation.streamIsLive);
      setUsePollingFallback(false);
    } catch (syncError) {
      console.error("Attendee live state sync failed:", syncError);
      setUsePollingFallback(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase> | null = null;

    try {
      supabase = getSupabase();
    } catch {
      queueMicrotask(() => {
        if (!cancelled) {
          setUsePollingFallback(true);
          void syncLiveState();
        }
      });
    }

    if (supabase) {
      queueMicrotask(() => {
        if (!cancelled) void syncLiveState();
      });

      const channel = acquirePlatformChannel(supabase);
      channel.on("broadcast", { event: LIVE_STREAM_STATE_BROADCAST_EVENT }, () => {
        if (!cancelled) void syncLiveState();
      });
      commitPlatformChannelSubscribe();
    }

    return () => {
      cancelled = true;
      if (supabase) releasePlatformChannel(supabase);
    };
  }, [syncLiveState]);

  useEffect(() => {
    if (!usePollingFallback) return;
    const intervalId = window.setInterval(() => {
      void syncLiveState();
    }, POLL_FALLBACK_MS);
    return () => window.clearInterval(intervalId);
  }, [syncLiveState, usePollingFallback]);

  return { isLive, isLoading };
}
