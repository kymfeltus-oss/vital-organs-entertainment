"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import type { LivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";
import {
  LIV_MICRO_BET_LAUNCH_EVENT,
  STREAM_GRAPHICS_SYNC_EVENT,
} from "@/lib/live/types";
import {
  acquirePlatformChannel,
  commitPlatformChannelSubscribe,
  registerPlatformListener,
  releasePlatformChannel,
  unregisterPlatformListener,
} from "@/lib/live/platform-channel";
import { getSupabase } from "@/lib/supabase/client";

const POLL_MS = 6_000;
const STATUS_LISTENER_ID = "liv-stream-status-sync";

type StatusApiError = {
  error?: string;
};

export function useLivStreamStatus() {
  const [status, setStatus] = useState<LivStreamSetupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const response = await fetch(`${getClientAppUrl()}/api/enterprise/liv-golf/stream-setup`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as StatusApiError;
        setError(payload.error ?? `Unable to load stream status (${response.status}).`);
        return;
      }

      const data = (await response.json()) as LivStreamSetupStatus;
      setStatus(data);
      setError(null);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error ? refreshError.message : "Stream status refresh failed.",
      );
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const poll = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;

    try {
      supabase = getSupabase();
    } catch {
      return () => window.clearInterval(poll);
    }

    acquirePlatformChannel(supabase);
    registerPlatformListener(STATUS_LISTENER_ID, (channel) =>
      channel.on("broadcast", { event: STREAM_GRAPHICS_SYNC_EVENT }, () => {
        if (!cancelled) void refresh();
      }),
    );
    commitPlatformChannelSubscribe();

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      unregisterPlatformListener(STATUS_LISTENER_ID);
      releasePlatformChannel(supabase);
    };
  }, [refresh]);

  return { status, isLoading, error, refresh };
}

/** Re-export for studio bet-launch refresh alongside stream state. */
export { LIV_MICRO_BET_LAUNCH_EVENT };
