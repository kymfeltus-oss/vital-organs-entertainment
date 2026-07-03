"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Gem, MessageCircle } from "lucide-react";
import LiveReactionTray from "@/components/experience/live/LiveReactionTray";
import { useIgLiveChat } from "@/components/experience/live/ig/IgLiveChatContext";
import { buildAttendeeGateUrl } from "@/lib/auth/routing";
import { FELLOWSHIP_MAX_CONTENT_LENGTH } from "@/lib/experience/fellowship-chat";

type LiveMobileDockProps = {
  chatOpen: boolean;
  onJoinConversation: () => void;
  onReaction: (assetId: string) => void;
  onBuySeeds: () => void;
  seedBalance: number;
  signInHref?: string;
};

/** Mobile action dock — inline conversation input + free praise reactions. */
export default function LiveMobileDock({
  chatOpen,
  onJoinConversation,
  onReaction,
  onBuySeeds,
  seedBalance,
  signInHref = "/live",
}: LiveMobileDockProps) {
  const { session, isSending, error, sendMessage, clearError } = useIgLiveChat();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!chatOpen) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [chatOpen]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    void sendMessage(trimmed).then((ok) => {
      if (ok) setDraft("");
    });
  };

  const conversationSlot = (() => {
    if (!chatOpen) {
      return (
        <button
          type="button"
          onClick={onJoinConversation}
          aria-expanded="false"
          aria-controls="live-mobile-chat-composer"
          className="touch-target flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 font-ui text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white transition hover:border-brand-blue/35 hover:bg-brand-blue/10"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Join Conversation</span>
        </button>
      );
    }

    if (!session.authenticated) {
      return (
        <Link
          href={buildAttendeeGateUrl(signInHref)}
          className="touch-target flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-full border border-brand-blue/40 bg-brand-blue/10 px-4 font-ui text-[0.62rem] font-bold uppercase tracking-[0.12em] text-brand-blue"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Sign in to join chat</span>
        </Link>
      );
    }

    if (!session.canSend) {
      return (
        <p
          className="flex min-h-11 w-full min-w-0 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-center font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-muted"
          role="status"
        >
          Muted
        </p>
      );
    }

    return (
      <form
        id="live-mobile-chat-composer"
        onSubmit={handleSubmit}
        className="flex min-h-12 w-full min-w-0 items-center gap-2 rounded-2xl border border-white/20 bg-black/90 px-3 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition focus-within:border-brand-blue/70 focus-within:ring-2 focus-within:ring-brand-blue/25"
      >
        <label className="sr-only" htmlFor="live-mobile-dock-chat-input">
          Join the conversation
        </label>
        <input
          ref={inputRef}
          id="live-mobile-dock-chat-input"
          type="text"
          enterKeyHint="send"
          autoComplete="off"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Join the conversation..."
          disabled={isSending}
          maxLength={FELLOWSHIP_MAX_CONTENT_LENGTH}
          className="h-11 min-w-0 flex-1 appearance-none bg-transparent px-1 font-body text-base text-white caret-brand-blue placeholder:text-white/55 focus:outline-none disabled:cursor-wait disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          className="touch-target min-h-9 shrink-0 rounded-full bg-brand-blue/15 px-3 py-1 font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] text-brand-blue transition active:scale-95 disabled:bg-transparent disabled:opacity-40"
        >
          Send
        </button>
      </form>
    );
  })();

  return (
    <footer className="live-sanctuary-mobile-dock pointer-events-auto absolute inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/75 backdrop-blur-xl lg:hidden">
      {error && chatOpen ? (
        <button
          type="button"
          onClick={clearError}
          className="block w-full truncate px-3 pt-2 text-left font-body text-xs text-brand-pink"
        >
          {error}
        </button>
      ) : null}
      <div className="px-3 pt-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {chatOpen ? <div className="mb-2 w-full">{conversationSlot}</div> : null}
        <div className="flex min-w-0 items-center gap-2">
          {!chatOpen ? conversationSlot : null}
          <button
            type="button"
            onClick={onBuySeeds}
            aria-label="Buy Vital Seeds"
            className="touch-target flex h-11 shrink-0 flex-col items-center justify-center rounded-full border border-brand-pink/35 bg-brand-pink/10 px-3 font-ui text-[0.48rem] font-bold uppercase tracking-[0.08em] text-brand-pink"
          >
            <Gem className="mb-0.5 h-4 w-4" aria-hidden="true" />
            <span className="tabular-nums">{seedBalance >= 1000 ? `${Math.floor(seedBalance / 1000)}k` : seedBalance}</span>
          </button>
          <LiveReactionTray variant="mobile-dock" onReaction={onReaction} />
        </div>
      </div>
    </footer>
  );
}
