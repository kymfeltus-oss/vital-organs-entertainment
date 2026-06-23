"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLiveAccessEvaluation } from "@/lib/access";
import { LIVE_STREAM_STATE_BROADCAST_EVENT } from "@/lib/live/types";
import {
  acquirePlatformChannel,
  commitPlatformChannelSubscribe,
  registerPlatformListener,
  releasePlatformChannel,
  unregisterPlatformListener,
} from "@/lib/live/platform-channel";
import { getSupabase } from "@/lib/supabase/client";

const POLL_FALLBACK_MS = 30_000;
const ATTENDEE_LIVE_LISTENER_ID = "attendee-live-broadcast";

type AttendeeLiveState = {
  isLive: boolean;
  isLoading: boolean;
};

type UseAttendeeLiveStateOptions = {
  /** When false, skips network/realtime sync until lifecycle allows live routing. */
  enabled?: boolean;
};

/** Attendee live signal — realtime first, safe polling fallback if sync fails. */
export function useAttendeeLiveState(
  options: UseAttendeeLiveStateOptions = {},
): AttendeeLiveState {
  const { enabled = true } = options;
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(enabled);
  const [usePollingFallback, setUsePollingFallback] = useState(false);
  const syncRef = useRef<() => Promise<void>>(async () => {});

  const syncLiveState = useCallback(async () => {
    if (!enabled) return;

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
  }, [enabled]);

  syncRef.current = syncLiveState;

  useEffect(() => {
    if (!enabled) {
      setUsePollingFallback(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

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

      acquirePlatformChannel(supabase);

      registerPlatformListener(ATTENDEE_LIVE_LISTENER_ID, (channel) =>
        channel.on("broadcast", { event: LIVE_STREAM_STATE_BROADCAST_EVENT }, () => {
          if (!cancelled) void syncRef.current();
        }),
      );

      commitPlatformChannelSubscribe();
    }

    return () => {
      cancelled = true;
      if (supabase) {
        unregisterPlatformListener(ATTENDEE_LIVE_LISTENER_ID);
        releasePlatformChannel(supabase);
      }
    };
  }, [enabled, syncLiveState]);

  useEffect(() => {
    if (!enabled || !usePollingFallback) return;
    const intervalId = window.setInterval(() => {
      void syncLiveState();
    }, POLL_FALLBACK_MS);
    return () => window.clearInterval(intervalId);
  }, [enabled, syncLiveState, usePollingFallback]);

  return { isLive, isLoading: enabled ? isLoading : false };
}
