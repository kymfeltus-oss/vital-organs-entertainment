"use client";

import { LIVE_REACTION_CATALOG } from "@/lib/experience/live-reactions";
import { useLiveStreamReactions } from "@/lib/experience/LiveStreamReactionsContext";

type LiveReactionBarProps = {
  authenticated: boolean;
  compact?: boolean;
};

export default function LiveReactionBar({
  authenticated,
  compact = false,
}: LiveReactionBarProps) {
  const { enabled, isSending, sendReaction } = useLiveStreamReactions();

  if (!enabled) return null;

  return (
    <div className={compact ? "shrink-0" : "mb-2 shrink-0"}>
      {!compact ? (
        <p className="mb-1.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-zinc-500">
          Reactions
        </p>
      ) : null}
      <div
        className="flex min-w-0 justify-between gap-1 sm:justify-start sm:gap-1.5"
        role="toolbar"
        aria-label="Send a live reaction"
      >
        {LIVE_REACTION_CATALOG.map(({ type, label, emoji }) => (
          <button
            key={type}
            type="button"
            disabled={!authenticated || isSending}
            title={label}
            aria-label={label}
            onClick={() => {
              void sendReaction(type);
            }}
            className="touch-target flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-border/80 bg-black/50 text-lg transition hover:border-brand-blue/45 hover:bg-brand-blue/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
          >
            <span aria-hidden="true">{emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
