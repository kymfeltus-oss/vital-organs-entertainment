"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buildAttendeeGateUrl } from "@/lib/auth/routing";
import { chatAuthorColorClass } from "@/lib/experience/chat-author-color";
import {
  FELLOWSHIP_MAX_CONTENT_LENGTH,
} from "@/lib/experience/fellowship-chat";
import { useIgLiveChat } from "@/components/experience/live/ig/IgLiveChatContext";
import { formatChatDisplayName } from "@/lib/live/chat";
import type { SimulatedChatMessage } from "@/lib/live/live-simulation";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";


type LiveStreamChatLayout = "sidebar" | "responsive";

type LiveStreamChatProps = {
  profile: AttendeeProfileSnapshot | null;
  seedBalance: number;
  className?: string;
  signInHref?: string;
  /** sidebar = desktop panel; responsive = IG overlay on mobile, sidebar on lg+ */
  layout?: LiveStreamChatLayout;
  /** Ambient simulated comments merged into the overlay feed (never persisted). */
  simulatedMessages?: SimulatedChatMessage[];
};

function ScrollToBottom({
  containerRef,
  dependencyKey,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  dependencyKey: number;
}) {
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [containerRef, dependencyKey]);

  return null;
}

/**
 * YouTube-style live chat panel for the attendee `/live` sidebar.
 * Mobile typing lives in the dock bar; desktop composer stays in this panel.
 */
export default function LiveStreamChat({
  profile,
  seedBalance,
  className,
  signInHref = "/live",
  layout = "responsive",
  simulatedMessages = [],
}: LiveStreamChatProps) {
  const isResponsive = layout === "responsive";
  const { messages, session, isSending, error, sendMessage, clearError } = useIgLiveChat();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

    const profileUserId = profile?.userId ?? null;

    const ownChatLabel = useMemo(() => {
      if (!profile?.userId) return null;
      return formatChatDisplayName({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
      });
    }, [profile]);

    const feedLines = useMemo(() => {
      const merged = [...messages, ...simulatedMessages];
      return merged.sort(
        (left, right) =>
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      );
    }, [messages, simulatedMessages]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = draft.trim();
      if (!trimmed) return;
      void sendMessage(trimmed).then((ok) => {
        if (ok) setDraft("");
      });
    };

    const rootClass = isResponsive
      ? "max-lg:absolute max-lg:inset-0 max-lg:flex max-lg:flex-col max-lg:justify-end max-lg:overflow-hidden max-lg:pointer-events-none lg:flex lg:min-h-0 lg:flex-col"
      : "flex min-h-0 flex-col";

    const headerClass = isResponsive ? "hidden lg:flex" : "flex";
    const feedClass = isResponsive
      ? "viewer-pov-chat-mask pointer-events-none absolute left-3 z-20 max-h-[28%] max-w-[min(78%,18rem)] overflow-hidden max-lg:bottom-[calc(var(--live-mobile-dock-h)+0.75rem)] min-h-0 flex-1 overflow-y-auto px-1 py-2 sm:left-4 lg:relative lg:inset-auto lg:max-h-none lg:max-w-none lg:flex-1 lg:space-y-2 lg:px-4 lg:py-3 sm:px-5"
      : "min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3 sm:px-5";

    const composerShellClass = isResponsive
      ? "max-lg:hidden shrink-0 border-t border-white/10 px-4 py-3 sm:px-5 lg:relative lg:flex lg:flex-col lg:border-t lg:border-white/10"
      : "shrink-0 border-t border-white/10 px-4 py-3 sm:px-5";

    return (
      <div
        id="live-stream-chat-panel"
        className={`${rootClass} ${className ?? ""}`}
      >
        <div
          className={`${headerClass} shrink-0 items-center justify-between border-b border-white/10 px-4 py-2.5 sm:px-5`}
        >
          <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.2em] text-brand-blue">
            Live Chat
          </p>
          <span className="inline-flex items-center gap-1 font-ui text-[0.55rem] font-bold uppercase tracking-[0.1em] text-brand-muted">
            <Sparkles className="h-3 w-3 text-amber-300" aria-hidden="true" />
            {seedBalance.toLocaleString("en-US")} Seeds
          </span>
        </div>

        <div
          ref={scrollRef}
          className={feedClass}
          aria-live="polite"
          aria-label="Live chat messages"
        >
          <ScrollToBottom containerRef={scrollRef} dependencyKey={feedLines.length} />
          <div className={isResponsive ? "viewer-pov-chat-scroll flex flex-col justify-end gap-2" : "contents"}>
            {feedLines.length === 0 ? (
              <p
                className={`font-body text-brand-muted viewer-pov-text-shadow ${isResponsive ? "text-xs text-white/55" : "text-sm"}`}
              >
                The room is gathering...
              </p>
            ) : (
              feedLines.slice(-10).map((message) => {
                const isSimulated = "isSimulated" in message && message.isSimulated;
                const isOwn =
                  Boolean(profileUserId) && message.userId === profileUserId;
                const authorLabel =
                  isOwn && ownChatLabel ? ownChatLabel : message.author;
                return (
                  <p
                    key={message.id}
                    className={`font-body leading-snug text-white viewer-pov-text-shadow ${isResponsive ? "text-[0.82rem] max-lg:rounded-md max-lg:bg-black/35 max-lg:px-2 max-lg:py-1 max-lg:backdrop-blur-sm" : "text-sm"} ${isSimulated ? "max-lg:opacity-85" : ""}`}
                  >
                    <span
                      className={`font-ui text-xs font-bold ${chatAuthorColorClass(message.userId)}`}
                    >
                      {authorLabel}
                      {isOwn ? " (you)" : ""}
                    </span>{" "}
                    <span className="text-white/90">{message.body}</span>
                  </p>
                );
              })
            )}
          </div>
        </div>

        <div className={composerShellClass}>
          {error ? (
            <button
              type="button"
              onClick={clearError}
              className="mb-2 block w-full truncate text-left font-body text-xs text-brand-pink max-lg:mb-1.5"
            >
              {error}
            </button>
          ) : null}
          {!session.authenticated ? (
            <Link
              href={buildAttendeeGateUrl(signInHref)}
              className="touch-target inline-flex min-h-11 w-full items-center justify-center rounded-full border border-brand-blue/40 bg-brand-blue/10 px-4 font-ui text-[0.62rem] font-bold uppercase tracking-[0.12em] text-brand-blue"
            >
              Sign in to join chat
            </Link>
          ) : !session.canSend ? (
            <p
              className="rounded-full bg-black/40 px-4 py-3 text-center font-ui text-xs font-bold uppercase tracking-[0.14em] text-brand-muted"
              role="status"
            >
              Muted
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <label className="sr-only" htmlFor="live-stream-chat-input">
                Join the conversation
              </label>
              <input
                ref={inputRef}
                id="live-stream-chat-input"
                type="text"
                enterKeyHint="send"
                autoComplete="off"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Say something..."
                disabled={isSending}
                maxLength={FELLOWSHIP_MAX_CONTENT_LENGTH}
                className="h-11 min-w-0 flex-1 rounded-full border border-white/10 bg-black/45 px-4 font-body text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-brand-blue/35 max-lg:bg-black/55"
              />
              <button
                type="submit"
                disabled={isSending || !draft.trim()}
                className="touch-target shrink-0 rounded-full border border-brand-blue/40 bg-brand-blue/15 px-4 py-2.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-blue disabled:opacity-40"
              >
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    );
}
