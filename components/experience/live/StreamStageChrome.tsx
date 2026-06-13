"use client";

import { useEffect, useState } from "react";
import { Radio, Users } from "lucide-react";
import { EVENT_LOBBY } from "@/lib/live/event-lobby";

type StreamStageChromeProps = {
  isLive?: boolean;
};

export default function StreamStageChrome({ isLive = true }: StreamStageChromeProps) {
  const [viewerCount, setViewerCount] = useState<number>(EVENT_LOBBY.community.viewersReady);

  useEffect(() => {
    if (!isLive) return;
    const base = EVENT_LOBBY.community.viewersReady;
    setViewerCount(base + Math.floor(Math.random() * 40));
    const intervalId = window.setInterval(() => {
      setViewerCount((current) => {
        const drift = Math.floor(Math.random() * 7) - 3;
        return Math.max(base, current + drift);
      });
    }, 12_000);
    return () => window.clearInterval(intervalId);
  }, [isLive]);

  if (!isLive) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="experience-live-badge inline-flex items-center gap-1.5 rounded-md px-2.5 py-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          <span className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.16em] text-red-400">
            Live Now
          </span>
        </span>
        <span className="experience-glass-chip inline-flex items-center gap-1.5 rounded-md px-2 py-1">
          <Users className="h-3 w-3 exp-text-blue" aria-hidden="true" />
          <span className="font-ui text-[0.5rem] font-bold tabular-nums tracking-[0.08em] text-zinc-300">
            {viewerCount.toLocaleString()}
          </span>
        </span>
      </div>
      <span className="experience-glass-chip inline-flex items-center gap-1.5 rounded-md px-2 py-1">
        <Radio className="h-3 w-3 exp-text-blue" aria-hidden="true" />
        <span className="font-ui text-[0.5rem] font-bold uppercase tracking-[0.12em] text-zinc-300">
          Crystal HD
        </span>
      </span>
    </div>
  );
}
