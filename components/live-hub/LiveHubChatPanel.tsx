"use client";

import { useRef, useEffect } from "react";
import { MessageCircle, Users } from "lucide-react";
import type { ChatMessage } from "@/lib/live/types";

type LiveHubChatPanelProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onlineCount: number;
};

export default function LiveHubChatPanel({
  messages,
  isLoading,
  error,
  onlineCount,
}: LiveHubChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <section className="flex min-h-[220px] flex-col rounded-2xl border border-white/10 bg-[#111111]/95 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
          Live Chat
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#1E40AF]/35 bg-[#1E40AF]/10 px-2 py-0.5 text-[0.5rem] font-bold uppercase tracking-[0.12em] text-[#93c5fd]">
          <Users className="h-3 w-3" aria-hidden="true" />
          {onlineCount.toLocaleString("en-US")} online
        </span>
      </div>

      {error ? <p className="mt-2 text-xs text-[#B0267A]">{error}</p> : null}

      <div
        ref={scrollRef}
        className="mt-3 min-h-[120px] flex-1 space-y-2 overflow-auto rounded-xl border border-white/8 bg-[#0B090A]/80 p-3"
      >
        {isLoading ? (
          <p className="text-xs text-zinc-500">Loading live room chat...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-zinc-500">No chat messages yet.</p>
        ) : (
          messages.slice(-24).map((message) => (
            <div key={message.id} className="text-xs">
              <span className="font-bold text-[#93c5fd]">{message.author}</span>
              <span className="text-zinc-600"> · </span>
              <span className="text-zinc-300">{message.body}</span>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-[#0B090A] px-4 py-2.5">
        <MessageCircle className="h-4 w-4 text-zinc-600" aria-hidden="true" />
        <span className="text-xs text-zinc-600">Operator monitor — send from attendee live room</span>
      </div>
    </section>
  );
}
