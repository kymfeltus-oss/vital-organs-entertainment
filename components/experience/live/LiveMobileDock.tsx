"use client";

import { MessageCircle } from "lucide-react";
import LiveReactionTray from "@/components/experience/live/LiveReactionTray";

type LiveMobileDockProps = {
  chatOpen: boolean;
  onJoinConversation: () => void;
  onReaction: (assetId: string) => void;
};

/** Mobile action dock — join conversation + free praise reactions. */
export default function LiveMobileDock({
  chatOpen,
  onJoinConversation,
  onReaction,
}: LiveMobileDockProps) {
  return (
    <footer className="live-sanctuary-mobile-dock pointer-events-auto absolute inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/75 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onJoinConversation}
          aria-pressed={chatOpen}
          className={`touch-target flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border px-4 font-ui text-[0.62rem] font-bold uppercase tracking-[0.12em] transition ${
            chatOpen
              ? "border-brand-blue/50 bg-brand-blue/15 text-brand-blue"
              : "border-white/15 bg-white/5 text-white hover:border-brand-blue/35 hover:bg-brand-blue/10"
          }`}
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Join Conversation</span>
        </button>

        <LiveReactionTray variant="mobile-dock" onReaction={onReaction} />
      </div>
    </footer>
  );
}
