"use client";

import { MessageCircle, Plus } from "lucide-react";

type LiveReactionButton = {
  assetId: string;
  emoji: string;
  label: string;
};

type LiveMobileDockProps = {
  seedBalanceLabel: string;
  seedBalanceLoading?: boolean;
  isDeductingSeeds?: boolean;
  chatOpen: boolean;
  reactions: LiveReactionButton[];
  onAddSeeds: () => void;
  onToggleChat: () => void;
  onReaction: (assetId: string) => void;
};

/** Compact mobile action dock — seeds, chat toggle, stage reactions. */
export default function LiveMobileDock({
  seedBalanceLabel,
  seedBalanceLoading = false,
  isDeductingSeeds = false,
  chatOpen,
  reactions,
  onAddSeeds,
  onToggleChat,
  onReaction,
}: LiveMobileDockProps) {
  return (
    <footer className="live-sanctuary-mobile-dock pointer-events-auto absolute inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
          <span className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.18em] text-white/45">
            Seeds
          </span>
          <span className="min-w-0 truncate font-ui text-sm font-bold tabular-nums text-brand-blue">
            {seedBalanceLoading ? "…" : seedBalanceLabel}
          </span>
          <button
            type="button"
            onClick={onAddSeeds}
            className="touch-target ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
            aria-label="Buy seeds"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleChat}
          aria-pressed={chatOpen}
          aria-label={chatOpen ? "Close chat" : "Open chat"}
          className={`touch-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full border backdrop-blur-sm transition ${
            chatOpen
              ? "border-brand-blue/50 bg-brand-blue/20 text-brand-blue"
              : "border-white/15 bg-white/5 text-white"
          }`}
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </button>

        {reactions.map((reaction) => (
          <button
            key={reaction.assetId}
            type="button"
            disabled={isDeductingSeeds}
            onClick={() => onReaction(reaction.assetId)}
            aria-label={`${reaction.label}, 5 seeds`}
            className="touch-target flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full border border-white/15 bg-white/5 text-white disabled:opacity-50"
          >
            <span className="text-base leading-none" aria-hidden="true">
              {reaction.emoji}
            </span>
            <span className="mt-0.5 font-ui text-[0.42rem] font-bold uppercase tracking-[0.08em] text-white/45">
              5
            </span>
          </button>
        ))}
      </div>
    </footer>
  );
}
