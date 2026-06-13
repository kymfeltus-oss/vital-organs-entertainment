"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Pin, Trash2, VolumeX } from "lucide-react";
import LiveReactionBar from "@/components/experience/live/LiveReactionBar";
import { chatAuthorColorClass } from "@/lib/experience/chat-author-color";
import {
  FELLOWSHIP_MAX_CONTENT_LENGTH,
  FELLOWSHIP_SLOW_MODE_SECONDS,
} from "@/lib/experience/fellowship-chat";
import { useFellowshipChat } from "@/lib/experience/useFellowshipChat";

const NEAR_BOTTOM_PX = 72;

type FellowshipChatPanelProps = {
  embedded?: boolean;
};

function calmChatError(raw: string | null): string | null {
  if (!raw) return null;
  return raw;
}

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
  } = useFellowshipChat();

  const displayError = calmChatError(error);
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

  const handleDelete = (messageId: string) => {
    void moderate({ action: "delete", messageId });
  };

  const handleMute = (userId: string) => {
    void moderate({ action: "mute", userId, durationMinutes: 30 });
  };

  const handlePin = (messageId: string) => {
    void moderate({ action: "pin", messageId });
  };

  const handleUnpin = () => {
    void moderate({ action: "unpin" });
  };

  return (
    <div className={`flex min-h-0 flex-col ${embedded ? "h-full" : "min-h-56"}`}>
      {!embedded ? (
        <>
          <p className="font-ui text-[0.6rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
            Fellowship Chat
          </p>
          <p className="mt-1 font-body text-sm text-brand-muted">
            Encourage one another during the 300 Awakening Live Experience.
          </p>
        </>
      ) : (
        <p className="mb-2 shrink-0 font-ui text-[0.58rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
          Fellowship Chat
        </p>
      )}

      {pinned ? (
        <div className="mb-2 shrink-0 rounded-lg border border-brand-pink/45 bg-brand-pink/10 px-3 py-2 neon-pink-glow">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-ui text-[0.5rem] font-bold uppercase tracking-[0.14em] text-brand-pink">
                Pinned Announcement
              </p>
              <p className="mt-1 font-body text-sm leading-snug text-white/90">
                <span
                  className={`font-ui text-[0.72rem] font-bold ${chatAuthorColorClass(pinned.userId)}`}
                >
                  {pinned.author}
                </span>
                <span className="text-brand-muted"> · </span>
                {pinned.body}
              </p>
            </div>
            {session.isModerator ? (
              <button
                type="button"
                onClick={handleUnpin}
                className="touch-target shrink-0 rounded border border-brand-border px-2 py-1 font-ui text-[0.45rem] font-bold uppercase tracking-[0.08em] text-brand-muted hover:text-white"
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
          className="h-full min-h-48 space-y-0 overflow-y-auto rounded-lg border border-brand-border bg-black/55 px-1.5 py-1.5 md:min-h-64"
          aria-label="Fellowship chat messages"
        >
          {isLoading ? (
            <p className="px-2 py-2 font-body text-sm text-brand-muted">Loading Fellowship Chat…</p>
          ) : messages.length === 0 ? (
            <p className="px-2 py-2 font-body text-sm text-brand-muted">
              The room is quiet. Be the first to encourage someone.
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className="group flex items-start gap-0.5 rounded px-1 py-0.5 hover:bg-white/3"
              >
                <p className="min-w-0 flex-1 wrap-break-word font-body text-[0.78rem] leading-snug sm:text-[0.8125rem]">
                  <span
                    className={`font-ui text-[0.7rem] font-bold sm:text-[0.72rem] ${chatAuthorColorClass(message.userId)}`}
                  >
                    {message.author}
                  </span>
                  <span className="text-brand-muted/80">: </span>
                  <span className="text-white/92">{message.body}</span>
                </p>

                {session.isModerator ? (
                  <div className="flex shrink-0 gap-0.5 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      title="Pin announcement"
                      onClick={() => handlePin(message.id)}
                      className="touch-target rounded p-1 text-brand-muted hover:text-brand-blue"
                    >
                      <Pin className="h-3 w-3" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      title="Mute user"
                      onClick={() => handleMute(message.userId)}
                      className="touch-target rounded p-1 text-brand-muted hover:text-brand-pink"
                    >
                      <VolumeX className="h-3 w-3" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      title="Delete message"
                      onClick={() => handleDelete(message.id)}
                      className="touch-target rounded p-1 text-brand-muted hover:text-brand-pink"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        {showJumpToLatest ? (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-brand-blue/50 bg-brand-black/95 px-3 py-1.5 font-ui text-[0.55rem] font-bold uppercase tracking-[0.12em] text-brand-blue shadow-lg"
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            View Latest Messages
          </button>
        ) : null}
      </div>

      {displayError ? (
        <p className="mt-2 shrink-0 font-body text-xs text-brand-muted" role="status">
          {displayError}
        </p>
      ) : null}

      <LiveReactionBar authenticated={session.authenticated} />

      {!session.authenticated ? (
        <div className="mt-2 shrink-0 rounded-lg border border-brand-border bg-black/50 px-3 py-3 text-center">
          <p className="font-body text-xs text-brand-muted">Sign in to join chat</p>
          <Link
            href="/email-gate?next=/experience/live"
            className="mt-2 inline-flex min-h-10 items-center justify-center rounded-full border border-brand-blue/50 bg-brand-blue/10 px-5 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-blue transition hover:bg-brand-blue/20"
          >
            Sign In
          </Link>
        </div>
      ) : !session.canSend ? (
        <p className="mt-2 shrink-0 font-body text-xs text-brand-muted">
          You are temporarily muted in Fellowship Chat.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2 shrink-0">
          <label className="sr-only" htmlFor="fellowship-chat-input">
            Send a Fellowship Chat message
          </label>
          <input
            id="fellowship-chat-input"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Send a message…"
            disabled={isSending}
            maxLength={FELLOWSHIP_MAX_CONTENT_LENGTH}
            className="w-full rounded-lg border border-brand-border bg-black/70 px-3 py-2.5 font-body text-sm text-white outline-none placeholder:text-brand-muted focus:border-brand-blue/50 disabled:opacity-60"
          />
          <p className="mt-1 font-ui text-[0.45rem] uppercase tracking-widest text-brand-muted">
            {draft.length}/{FELLOWSHIP_MAX_CONTENT_LENGTH} · Slow mode{" "}
            {session.slowModeSeconds || FELLOWSHIP_SLOW_MODE_SECONDS}s
          </p>
        </form>
      )}
    </div>
  );
}
