"use client";

import { LIVE_REACTION_CATALOG } from "@/lib/experience/live-reactions";
import { useLiveStreamReactions } from "@/lib/experience/LiveStreamReactionsContext";

type LiveReactionBarProps = {
  authenticated: boolean;
};

export default function LiveReactionBar({ authenticated }: LiveReactionBarProps) {
  const { enabled, isSending, sendReaction } = useLiveStreamReactions();

  if (!enabled) return null;

  return (
    <div className="mb-2 shrink-0">
      <p className="mb-1.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
        Live Reactions
      </p>
      <div
        className="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            className="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-border bg-black/60 text-xl transition hover:border-brand-blue/40 hover:bg-brand-blue/10 disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:w-11"
          >
            <span aria-hidden="true">{emoji}</span>
          </button>
        ))}
      </div>
      {!authenticated ? (
        <p className="mt-1 font-body text-[0.65rem] text-brand-muted">
          Sign in to send reactions.
        </p>
      ) : null}
    </div>
  );
}
