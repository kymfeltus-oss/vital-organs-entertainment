"use client";

import { Pin, Trash2, VolumeX } from "lucide-react";
import { chatAuthorColorClass } from "@/lib/experience/chat-author-color";
import {
  classifyChatMessageVariant,
  formatChatTimestamp,
} from "@/lib/experience/chat-message-variant";
import type { FellowshipChatMessage } from "@/lib/experience/fellowship-chat";

type FellowshipChatMessageRowProps = {
  message: FellowshipChatMessage;
  isModerator: boolean;
  onPin: (id: string) => void;
  onMute: (userId: string) => void;
  onDelete: (id: string) => void;
};

const VARIANT_CLASS: Record<
  ReturnType<typeof classifyChatMessageVariant>,
  string
> = {
  default: "",
  giving: "experience-chat-giving",
  prayer: "experience-chat-prayer",
  broadcast: "experience-chat-broadcast",
};

export default function FellowshipChatMessageRow({
  message,
  isModerator,
  onPin,
  onMute,
  onDelete,
}: FellowshipChatMessageRowProps) {
  const variant = classifyChatMessageVariant(message.body);

  return (
    <div
      className={`group flex items-start gap-1 rounded-md px-1.5 py-1 transition hover:bg-white/3 ${VARIANT_CLASS[variant]}`}
    >
      <p className="min-w-0 flex-1 wrap-break-word font-body text-[0.78rem] leading-snug sm:text-[0.8125rem]">
        <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
          <span
            className={`font-ui text-[0.7rem] font-bold sm:text-[0.72rem] ${chatAuthorColorClass(message.userId)}`}
          >
            {message.author}
          </span>
          <time
            dateTime={message.createdAt}
            className="font-ui text-[0.48rem] tabular-nums tracking-wide text-zinc-500"
          >
            {formatChatTimestamp(message.createdAt)}
          </time>
        </span>
        <span className="text-zinc-400">: </span>
        <span className="text-white">{message.body}</span>
      </p>

      {isModerator ? (
        <div className="flex shrink-0 gap-0.5 opacity-70 group-hover:opacity-100">
          <button
            type="button"
            title="Pin announcement"
            onClick={() => onPin(message.id)}
            className="touch-target rounded p-1 text-zinc-500 hover:exp-text-blue"
          >
            <Pin className="h-3 w-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            title="Mute user"
            onClick={() => onMute(message.userId)}
            className="touch-target rounded p-1 text-zinc-500 hover:exp-text-magenta"
          >
            <VolumeX className="h-3 w-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            title="Delete message"
            onClick={() => onDelete(message.id)}
            className="touch-target rounded p-1 text-zinc-500 hover:exp-text-magenta"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
