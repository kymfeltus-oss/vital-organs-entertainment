"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveStreamGraphicPayload } from "@/lib/live/stream-graphics";
import { STREAM_GRAPHICS_SYNC_EVENT } from "@/lib/live/types";
import {
  acquirePlatformChannel,
  commitPlatformChannelSubscribe,
  registerPlatformListener,
  releasePlatformChannel,
  unregisterPlatformListener,
} from "@/lib/live/platform-channel";
import { getClientAppUrl } from "@/lib/client-api";
import { getSupabase } from "@/lib/supabase/client";

const STREAM_GRAPHICS_LISTENER_ID = "live-stream-graphics-sync";
const STREAM_GRAPHICS_POLL_MS = 5_000;

type LiveStreamGraphicsPayload = {
  isLive: boolean;
  active: LiveStreamGraphicPayload | null;
};

type UseLiveStreamGraphicsOptions = {
  enabled?: boolean;
};

type UseLiveStreamGraphicsResult = {
  activeGraphic: LiveStreamGraphicPayload | null;
  isLive: boolean;
};

export function useLiveStreamGraphics({
  enabled = true,
}: UseLiveStreamGraphicsOptions = {}): UseLiveStreamGraphicsResult {
  const [payload, setPayload] = useState<LiveStreamGraphicsPayload | null>(null);
  const syncRef = useRef<() => Promise<void>>(async () => {});

  const syncGraphics = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await fetch(`${getClientAppUrl()}/api/access/live/stream-graphics`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) return;

      const data = (await response.json()) as LiveStreamGraphicsPayload;
      setPayload(data);
    } catch (error) {
      console.warn("Live stream graphics sync failed:", error);
    }
  }, [enabled]);

  syncRef.current = syncGraphics;

  useEffect(() => {
    if (!enabled) {
      setPayload(null);
      return;
    }

    void syncGraphics();

    const pollTimer = window.setInterval(() => {
      void syncGraphics();
    }, STREAM_GRAPHICS_POLL_MS);

    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;

    try {
      supabase = getSupabase();
    } catch {
      return () => window.clearInterval(pollTimer);
    }

    acquirePlatformChannel(supabase);

    registerPlatformListener(STREAM_GRAPHICS_LISTENER_ID, (channel) =>
      channel.on("broadcast", { event: STREAM_GRAPHICS_SYNC_EVENT }, () => {
        if (cancelled) return;
        void syncRef.current();
      }),
    );

    commitPlatformChannelSubscribe();

    return () => {
      cancelled = true;
      window.clearInterval(pollTimer);
      unregisterPlatformListener(STREAM_GRAPHICS_LISTENER_ID);
      releasePlatformChannel(supabase);
    };
  }, [enabled, syncGraphics]);

  return {
    activeGraphic: payload?.active ?? null,
    isLive: payload?.isLive === true,
  };
}
