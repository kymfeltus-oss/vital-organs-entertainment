"use client";

import { useMemo } from "react";
import type { FellowshipChatMessage } from "@/lib/experience/fellowship-chat";
import { useAttendeeChatRealtime } from "@/lib/experience/useAttendeeChatRealtime";
import type { RealtimeAttendeeChatRow } from "@/lib/broadcast/countdown-console-types";

const MAX_MESSAGES = 100;

function mapRow(message: FellowshipChatMessage): RealtimeAttendeeChatRow {
  return {
    id: message.id,
    username: message.author?.trim() || null,
    message: message.body?.trim() || null,
    created_at: message.createdAt,
  };
}

type UseRealtimeAttendeeChatOptions = {
  enabled?: boolean;
};

type UseRealtimeAttendeeChatResult = {
  messages: RealtimeAttendeeChatRow[];
  isLoading: boolean;
  isConnected: boolean;
};

/** Hydrate + subscribe to attendee fellowship chat for ops monitors. */
export function useRealtimeAttendeeChat(
  options: UseRealtimeAttendeeChatOptions = {},
): UseRealtimeAttendeeChatResult {
  const { enabled = true } = options;

  const { messages, isLoading, isConnected } = useAttendeeChatRealtime({ enabled });

  const rows = useMemo(
    () => messages.map(mapRow).slice(-MAX_MESSAGES),
    [messages],
  );

  return { messages: rows, isLoading, isConnected };
}

export type { RealtimeAttendeeChatRow };
