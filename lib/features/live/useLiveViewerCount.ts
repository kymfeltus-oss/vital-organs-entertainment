"use client";

import { useEffect, useState } from "react";
import {
  applyLiveViewerDisplayBuffer,
  countLiveViewerPresence,
  formatLiveViewerCount,
  LIVE_VIEWER_DECAY_INTERVAL_MS,
  LIVE_VIEWER_DISPLAY_BUFFER,
  LIVE_VIEWER_PRESENCE_CHANNEL,
  nextLiveViewerDisplayBuffer,
  resolveLiveViewerPresenceKey,
} from "@/lib/experience/live-viewer-count";
import { getSupabase } from "@/lib/supabase/client";

type UseLiveViewerCountOptions = {
  enabled?: boolean;
  userId?: string | null;
  /** When false, UI reflects exact Supabase presence count (executive surfaces). */
  applyDisplayBuffer?: boolean;
};

type UseLiveViewerCountResult = {
  /** Formatted count shown in UI (actual + buffer). */
  displayLabel: string;
  actualCount: number;
  displayCount: number;
};

export function useLiveViewerCount({
  enabled = true,
  userId = null,
  applyDisplayBuffer = true,
}: UseLiveViewerCountOptions = {}): UseLiveViewerCountResult {
  const [actualCount, setActualCount] = useState(0);
  const [displayBuffer, setDisplayBuffer] = useState(LIVE_VIEWER_DISPLAY_BUFFER);

  useEffect(() => {
    if (!enabled) return;

    const supabase = getSupabase();
    const presenceKey = resolveLiveViewerPresenceKey(userId);

    const channel = supabase.channel(LIVE_VIEWER_PRESENCE_CHANNEL, {
      config: { presence: { key: presenceKey } },
    });

    const syncCount = () => {
      setActualCount(countLiveViewerPresence(channel.presenceState()));
    };

    channel
      .on("presence", { event: "sync" }, syncCount)
      .on("presence", { event: "join" }, syncCount)
      .on("presence", { event: "leave" }, syncCount)
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;

        const trackStatus = await channel.track({
          online_at: new Date().toISOString(),
        });

        if (trackStatus !== "ok") {
          console.error("Live viewer presence track failed:", trackStatus);
        }

        syncCount();
      });

    return () => {
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !applyDisplayBuffer) return;

    const timer = window.setInterval(() => {
      setDisplayBuffer((current) => nextLiveViewerDisplayBuffer(current, actualCount));
    }, LIVE_VIEWER_DECAY_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [actualCount, applyDisplayBuffer, enabled]);

  const displayCount = applyDisplayBuffer
    ? applyLiveViewerDisplayBuffer(actualCount, displayBuffer)
    : Math.max(0, Math.round(actualCount));

  return {
    displayLabel: formatLiveViewerCount(displayCount),
    actualCount,
    displayCount,
  };
}
