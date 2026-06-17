"use client";

import { chatAuthorColorClass } from "@/lib/experience/chat-author-color";
import { IG_LIVE_MOCK_CHAT } from "@/lib/experience/ig-live-mock";
import { useFellowshipChat } from "@/lib/experience/useFellowshipChat";

const FLOATING_CHAT_LIMIT = 8;

type IgLiveFloatingChatProps = {
  preview?: boolean;
};

export default function IgLiveFloatingChat({ preview = false }: IgLiveFloatingChatProps) {
  const { messages } = useFellowshipChat();

  const lines = preview
    ? IG_LIVE_MOCK_CHAT.slice(-FLOATING_CHAT_LIMIT)
    : messages.slice(-FLOATING_CHAT_LIMIT).map((message) => ({
        id: message.id,
        author: message.author,
        userId: message.userId,
        body: message.body,
      }));

  if (lines.length === 0) return null;

  return (
    <div
      className="ig-live-chat-mask pointer-events-none absolute bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-4 z-20 max-h-[38dvh] max-w-[min(78%,20rem)] overflow-hidden md:bottom-28 md:max-w-[min(42%,24rem)] lg:hidden"
      aria-live="polite"
      aria-label="Live chat"
    >
      <div className="ig-live-chat-scroll flex flex-col justify-end gap-2 pr-2">
        {lines.map((line) => (
          <p key={line.id} className="font-body text-[0.9rem] leading-snug ig-live-text-shadow">
            <span
              className={`font-ui text-[0.78rem] font-bold ${chatAuthorColorClass(line.userId)}`}
            >
              @{line.author.replace(/\s+/g, "")}
            </span>{" "}
            <span className="text-white">{line.body}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
