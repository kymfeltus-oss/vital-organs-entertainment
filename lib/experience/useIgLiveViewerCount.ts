"use client";

import { useEffect, useState } from "react";
import { EVENT_LOBBY } from "@/lib/live/event-lobby";

export function formatIgViewerCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (count >= 10_000) {
    return `${Math.round(count / 1_000)}K`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return count.toLocaleString();
}

export function useIgLiveViewerCount(enabled: boolean): string {
  const [viewerCount, setViewerCount] = useState(EVENT_LOBBY.community.viewersReady);

  useEffect(() => {
    if (!enabled) return;

    const base = EVENT_LOBBY.community.viewersReady;
    setViewerCount(base + Math.floor(Math.random() * 40));

    const intervalId = window.setInterval(() => {
      setViewerCount((current) => {
        const drift = Math.floor(Math.random() * 7) - 3;
        return Math.max(base, current + drift);
      });
    }, 12_000);

    return () => window.clearInterval(intervalId);
  }, [enabled]);

  return formatIgViewerCount(viewerCount);
}
