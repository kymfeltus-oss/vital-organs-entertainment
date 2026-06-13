"use client";

import { useLiveStreamReactions } from "@/lib/experience/LiveStreamReactionsContext";

export default function FloatingLiveReactions() {
  const { enabled, floatingReactions } = useLiveStreamReactions();

  if (!enabled || floatingReactions.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {floatingReactions.map((reaction) => (
        <span
          key={reaction.key}
          className="live-reaction-burst absolute bottom-[16%] text-3xl drop-shadow-[0_0_16px_rgba(0,168,255,0.45)] sm:text-4xl md:text-5xl"
          style={{ left: `${reaction.originX * 100}%` }}
        >
          {reaction.emoji}
        </span>
      ))}
    </div>
  );
}
