"use client";

import { useEffect, useRef } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import type { RealtimeAttendeeChatRow } from "@/lib/broadcast/countdown-console-types";

type RealtimeChatFeedProps = {
  messages: RealtimeAttendeeChatRow[];
  isLoading?: boolean;
  isConnected?: boolean;
  variant?: "desktop" | "mobile";
};

export default function RealtimeChatFeed({
  messages,
  isLoading = false,
  isConnected = false,
  variant = "desktop",
}: RealtimeChatFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length]);

  const shellClass =
    variant === "mobile"
      ? "h-[55vh] overflow-y-auto rounded-xl border border-brand-border bg-brand-black/80 p-3"
      : "flex min-h-0 flex-1 flex-col rounded-xl border border-brand-border bg-brand-black/80 p-4";

  return (
    <section className={variant === "desktop" ? "flex min-h-0 flex-1 flex-col" : undefined}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.16em] text-white">
          <MessageSquare className="h-4 w-4 text-brand-blue" aria-hidden="true" />
          💬 Live Attendee Chat
        </h3>
        <span
          className={`font-ui text-[0.48rem] font-bold uppercase tracking-[0.12em] ${
            isConnected ? "text-emerald-400" : "text-brand-muted"
          }`}
        >
          {isConnected ? "Realtime" : "Polling"}
        </span>
      </div>

      <div ref={scrollRef} className={`${shellClass} min-h-0 space-y-2`}>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-brand-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="font-body text-sm">Loading chat…</span>
          </div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center font-body text-sm text-brand-muted">
            No attendee messages yet.
          </p>
        ) : (
          messages.map((row) => {
            const username = row.username?.trim() || "Guest";
            const text = row.message?.trim() || "—";
            return (
              <p key={row.id} className="break-all font-body text-sm leading-snug text-zinc-200">
                <span className="font-semibold text-brand-blue">{username}</span>
                <span className="text-brand-muted">: </span>
                {text}
              </p>
            );
          })
        )}
      </div>
      {/* TODO: wire POST send when ops chat injection endpoint lands */}
    </section>
  );
}
