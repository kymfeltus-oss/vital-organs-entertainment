"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Send, Shield } from "lucide-react";
import FellowshipChatMessageRow from "@/components/experience/live/FellowshipChatMessageRow";
import LiveReactionBar from "@/components/experience/live/LiveReactionBar";
import { chatAuthorColorClass } from "@/lib/experience/chat-author-color";
import { formatChatTimestamp } from "@/lib/experience/chat-message-variant";
import {
  FELLOWSHIP_MAX_CONTENT_LENGTH,
  FELLOWSHIP_SLOW_MODE_SECONDS,
} from "@/lib/experience/fellowship-chat";
import { useFellowshipChat } from "@/lib/experience/useFellowshipChat";
import { buildAttendeeGateUrl } from "@/lib/auth/routing";

const NEAR_BOTTOM_PX = 72;

type FellowshipChatPanelProps = {
  embedded?: boolean;
};

export default function FellowshipChatPanel({ embedded = false }: FellowshipChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [draft, setDraft] = useState("");
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const {
    messages,
    pinned,
    session,
    isLoading,
    isSending,
    error,
    sendMessage,
    moderate,
    clearError,
  } = useFellowshipChat();

  const canCompose = session.authenticated && session.canSend;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    isNearBottomRef.current = true;
    setShowJumpToLatest(false);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    isNearBottomRef.current = nearBottom;
    setShowJumpToLatest(!nearBottom);
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom("auto");
    }
  }, [messages.length, pinned?.id, scrollToBottom]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isSending || !canCompose) return;

    void sendMessage(trimmed).then((sent) => {
      if (sent) {
        setDraft("");
        scrollToBottom();
      }
    });
  };

  return (
    <div
      className={`flex flex-col overflow-hidden ${
        embedded
          ? "h-full min-h-0 max-md:mx-2 max-md:rounded-xl max-md:border max-md:border-white/[0.08] bg-[#111111] md:bg-transparent md:mx-0 md:rounded-none md:border-0"
          : "min-h-56"
      }`}
    >
      {!embedded ? (
        <p className="mb-2 shrink-0 font-headline text-lg uppercase tracking-[0.14em] text-white">
          Fellowship Chat
        </p>
      ) : (
        <>
          <div className="flex h-10 shrink-0 items-center border-b border-white/5 bg-black/20 px-4 md:hidden">
            <span className="font-ui text-[0.65rem] font-bold uppercase tracking-[0.15em] text-zinc-400">
              Live Fellowship Chat
            </span>
          </div>
          <p className="mb-2 hidden shrink-0 font-ui text-[0.55rem] font-bold uppercase tracking-[0.18em] text-zinc-400 md:block">
            Fellowship Chat
          </p>
        </>
      )}

      {pinned ? (
        <div className="experience-chat-pin mb-2 shrink-0 rounded-xl px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.16em] exp-text-blue">
                <Shield className="h-3 w-3" aria-hidden="true" />
                Pinned Announcement
              </p>
              <p className="mt-1.5 font-body text-sm leading-snug text-white">
                <span
                  className={`shrink-0 font-ui text-[0.72rem] font-black tracking-wide filter drop-shadow-[0_0_8px_rgba(255,255,255,0.12)] ${chatAuthorColorClass(pinned.userId)}`}
                >
                  {pinned.author}
                </span>
                <span className="text-zinc-500"> · </span>
                <time
                  dateTime={pinned.createdAt}
                  className="font-ui text-[0.48rem] text-zinc-500"
                >
                  {formatChatTimestamp(pinned.createdAt)}
                </time>
                <span className="text-zinc-400"> — </span>
                {pinned.body}
              </p>
            </div>
            {session.isModerator ? (
              <button
                type="button"
                onClick={() => void moderate({ action: "unpin" })}
                className="touch-target shrink-0 rounded border border-white/8 px-2 py-1 font-ui text-[0.45rem] font-bold uppercase tracking-[0.08em] text-zinc-400 hover:text-white"
              >
                Unpin
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={`min-w-0 flex-1 overflow-y-auto overflow-x-hidden wrap-break-word ${
            embedded
              ? "min-h-0 px-4 py-3 md:experience-glass-panel md:rounded-xl md:px-1 md:py-1.5"
              : "experience-glass-panel h-full min-h-48 rounded-xl px-1 py-1.5 md:min-h-64"
          }`}
          aria-label="Fellowship chat messages"
        >
          {isLoading ? (
            <p className="px-2 py-3 font-body text-sm text-zinc-400">Loading Fellowship Chat…</p>
          ) : messages.length === 0 ? (
            <p className="px-2 py-3 font-body text-sm text-zinc-400">
              The room is quiet. Be the first to encourage someone.
            </p>
          ) : (
            messages.map((message) => (
              <FellowshipChatMessageRow
                key={message.id}
                message={message}
                isModerator={session.isModerator}
                onPin={(id) => void moderate({ action: "pin", messageId: id })}
                onMute={(userId) =>
                  void moderate({ action: "mute", userId, durationMinutes: 30 })
                }
                onDelete={(id) => void moderate({ action: "delete", messageId: id })}
              />
            ))
          )}
        </div>

        {showJumpToLatest ? (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#1E40AF]/50 bg-[#0B090A]/95 px-3 py-1.5 font-ui text-[0.55rem] font-bold uppercase tracking-[0.12em] exp-text-blue shadow-lg"
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            View Latest Messages
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 shrink-0 font-body text-xs text-zinc-400" role="status">
          {error}
          <button
            type="button"
            onClick={clearError}
            className="ml-2 font-ui text-[0.5rem] uppercase tracking-widest exp-text-blue"
          >
            Dismiss
          </button>
        </p>
      ) : null}

      {!session.authenticated ? (
        <div className="mt-2 shrink-0 space-y-2">
          <LiveReactionBar authenticated={false} compact />
          <div className="experience-glass-panel rounded-xl px-3 py-3 text-center">
          <p className="font-body text-xs text-zinc-400">Sign in to join the conversation</p>
          <Link
            href={buildAttendeeGateUrl("/experience/live")}
            className="mt-2 inline-flex min-h-10 items-center justify-center rounded-full border border-[#1E40AF]/50 bg-[#1E40AF]/10 px-5 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] exp-text-blue transition hover:bg-[#1E40AF]/20"
          >
            Sign In
          </Link>
          </div>
        </div>
      ) : !session.canSend ? (
        <p className="mt-2 shrink-0 font-body text-xs text-zinc-400">
          You are temporarily muted in Fellowship Chat.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={`mt-0 shrink-0 space-y-2 ${
            embedded
              ? "border-t border-white/5 bg-black/40 p-3 backdrop-blur-md md:border-0 md:bg-transparent md:p-0"
              : "mt-2"
          }`}
        >
          <div className="experience-glass-composer flex items-center gap-2 rounded-xl px-2 py-1.5">
            <label className="sr-only" htmlFor="fellowship-chat-input">
              Join the conversation
            </label>
            <input
              id="fellowship-chat-input"
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Join the conversation..."
              disabled={isSending}
              maxLength={FELLOWSHIP_MAX_CONTENT_LENGTH}
              className="min-w-0 flex-1 bg-transparent px-2 py-2 font-body text-sm text-white outline-none placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              className="experience-send-btn touch-target flex h-10 shrink-0 items-center justify-center rounded-lg px-3 transition active:scale-95 md:w-10 md:px-0"
              aria-label="Send message"
            >
              <span className="font-ui text-[0.58rem] font-black uppercase tracking-wider md:hidden">
                Chat
              </span>
              <Send className="hidden h-4 w-4 md:block" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-end justify-between gap-2">
            <LiveReactionBar authenticated={session.authenticated} compact />
            <p className="shrink-0 pb-1 font-ui text-[0.45rem] uppercase tracking-widest text-zinc-500">
              {draft.length}/{FELLOWSHIP_MAX_CONTENT_LENGTH}
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
