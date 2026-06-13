"use client";

import { useEffect, useState } from "react";
import { Lock, MessageCircle, ShieldCheck, Signal } from "lucide-react";

type LiveHubStatusStripProps = {
  networkOnline: boolean;
  networkDetail?: string | null;
  isLive?: boolean;
  liveStartedAt?: number | null;
};

function formatLiveElapsed(startedAtMs: number, nowMs: number): string {
  const totalSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function LiveHubStatusStrip({
  networkOnline,
  networkDetail = null,
  isLive = false,
  liveStartedAt = null,
}: LiveHubStatusStripProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!isLive || !liveStartedAt) return;

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isLive, liveStartedAt]);

  const liveTimer =
    isLive && liveStartedAt
      ? formatLiveElapsed(liveStartedAt, nowMs)
      : null;

  return (
    <footer className="shrink-0 border-t border-white/10 bg-brand-black px-5 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
        <div className="flex flex-wrap items-center gap-4">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 text-brand-pink neon-pink-glow">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-pink motion-reduce:animate-none" />
              On Air · {liveTimer ?? "00:00:00"}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 text-brand-blue">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Secure Connection
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Data Protected
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Signal className="h-3.5 w-3.5" aria-hidden="true" />
            Uptime 99.9%
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="max-w-[min(100%,28rem)] truncate normal-case tracking-normal">
            {networkOnline
              ? networkDetail ?? "Network Online"
              : networkDetail ?? "Network Offline"}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-brand-pink transition hover:text-white"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Chat Now
          </button>
        </div>
      </div>
    </footer>
  );
}
