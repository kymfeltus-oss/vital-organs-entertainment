"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLivStreamStatus } from "@/lib/enterprise/liv-golf/fetch-liv-stream-status";
import type { LivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";
import { isLivStreamLiveStatus } from "@/lib/enterprise/liv-golf/liv-stream-status-patches";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import {
  LIV_MICRO_BET_LAUNCH_EVENT,
  LIVE_STREAM_STATE_BROADCAST_EVENT,
  STREAM_GRAPHICS_SYNC_EVENT,
} from "@/lib/live/types";
import {
  acquirePlatformChannel,
  commitPlatformChannelSubscribe,
  registerPlatformListener,
  releasePlatformChannel,
  subscribePlatformChannelStatus,
  unregisterPlatformListener,
} from "@/lib/live/platform-channel";
import { getSupabase } from "@/lib/supabase/client";

const STATUS_LISTENER_ID = "liv-stream-status-realtime";
const REALTIME_POLL_MS = 5_000;

export type StreamStateSyncPayload = {
  at?: string;
};

export type StreamGraphicsSyncPayload = {
  at?: string;
  reason?: string;
};

export type UseLivStreamStatusOptions = {
  /** When false, skips network and realtime subscription. */
  enabled?: boolean;
  /**
   * When true, mounts the player shell during stream-state-sync refresh
   * (eliminates standby flash while authoritative status loads).
   */
  mountPlayerDuringStateSync?: boolean;
};

export type UseLivStreamStatusResult = {
  status: LivStreamSetupStatus | null;
  isLoading: boolean;
  isRealtimeConnected: boolean;
  /** True while stream-state-sync triggered refresh is in flight. */
  isStateSyncing: boolean;
  error: string | null;
  /** True when player shell should mount (live phase / is_live). */
  isPlayerLive: boolean;
  refresh: () => Promise<void>;
};

/**
 * Real-time LIV Golf stream status with WebSocket push + HTTP polling fallback.
 * Binds to Supabase platform channel for stream-state-sync / stream-graphics-sync.
 * Polls every 5s regardless of socket state so fan viewports still open when
 * Realtime transport is flaky (transport failure).
 */
export function useLivStreamStatus(
  options: UseLivStreamStatusOptions = {},
): UseLivStreamStatusResult {
  const { enabled = true, mountPlayerDuringStateSync = true } = options;

  const [status, setStatus] = useState<LivStreamSetupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isStateSyncing, setIsStateSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const refreshRef = useRef<(fromStateSync: boolean) => Promise<void>>(async () => {});

  const refresh = useCallback(
    async (fromStateSync = false) => {
      if (!enabled || !mountedRef.current) return;
      if (inFlightRef.current) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      inFlightRef.current = true;
      if (fromStateSync) setIsStateSyncing(true);

      try {
        const data = await fetchLivStreamStatus(undefined, controller.signal);
        if (!mountedRef.current || controller.signal.aborted) return;

        setStatus(data);
        setError(null);
      } catch (refreshError) {
        if (!mountedRef.current || controller.signal.aborted) return;

        const message =
          refreshError instanceof Error ? refreshError.message : "Stream status refresh failed.";
        const isTransientNetwork =
          refreshError instanceof TypeError &&
          message.toLowerCase().includes("failed to fetch");

        if (isTransientNetwork) {
          setError(
            "Stream status is temporarily unreachable. Confirm the dev server is running on this port.",
          );
          console.warn("[liv-golf/useLivStreamStatus] refresh failed:", message);
        } else {
          console.error("[liv-golf/useLivStreamStatus] refresh failed:", message);
          setError(message);
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        inFlightRef.current = false;
        if (mountedRef.current) {
          setIsLoading(false);
          if (fromStateSync) setIsStateSyncing(false);
        }
      }
    },
    [enabled],
  );

  refreshRef.current = refresh;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let cancelled = false;

    let supabase: ReturnType<typeof getSupabase>;
    try {
      supabase = getSupabase();
    } catch (initError) {
      const message =
        initError instanceof Error ? initError.message : "Supabase client unavailable.";
      console.error("[liv-golf/useLivStreamStatus] init failed:", message);
      setError("Realtime stream status is unavailable.");
      setIsLoading(false);
      return;
    }

    void refreshRef.current(false);

    const unsubscribeChannelStatus = subscribePlatformChannelStatus((channelStatus) => {
      if (cancelled) return;
      setIsRealtimeConnected(channelStatus === "SUBSCRIBED");
    });

    acquirePlatformChannel(supabase);
    registerPlatformListener(STATUS_LISTENER_ID, (channel) =>
      channel
        .on("broadcast", { event: LIVE_STREAM_STATE_BROADCAST_EVENT }, () => {
          if (cancelled) return;
          void refreshRef.current(true);
        })
        .on("broadcast", { event: STREAM_GRAPHICS_SYNC_EVENT }, () => {
          if (cancelled) return;
          void refreshRef.current(false);
        }),
    );
    commitPlatformChannelSubscribe();

    return () => {
      cancelled = true;
      unsubscribeChannelStatus();
      unregisterPlatformListener(STATUS_LISTENER_ID);
      releasePlatformChannel(supabase);
      setIsRealtimeConnected(false);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const poll = window.setInterval(() => {
      void refreshRef.current(false);
    }, REALTIME_POLL_MS);

    return () => window.clearInterval(poll);
  }, [enabled]);

  const isPlayerLive =
    isLivStreamLiveStatus(status) ||
    (mountPlayerDuringStateSync && isStateSyncing);

  return {
    status,
    isLoading,
    isRealtimeConnected,
    isStateSyncing,
    error,
    isPlayerLive,
    refresh: () => refresh(false),
  };
}

/** Singleton row scope — maps to public.live_stream_state.id */
export const LIV_STREAM_STATE_ROW_ID = LIVE_STREAM_STATE_ID;

export { LIV_MICRO_BET_LAUNCH_EVENT };
