"use client";

import { useCallback, useEffect, useState } from "react";
import {
  liveChatStore,
  type LiveChatMessage,
  type LiveChatMessageColor,
} from "@/lib/liveChatStore";

const LOCAL_USER = {
  userName: "You",
  initials: "YO",
  color: "cyan" as LiveChatMessageColor,
};

export function useLiveChat(streamId: string) {
  const [messages, setMessages] = useState<LiveChatMessage[]>(() =>
    liveChatStore.getMessages(),
  );

  useEffect(() => {
    return liveChatStore.subscribe(streamId, setMessages);
  }, [streamId]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    return liveChatStore.sendUserMessage({
      ...LOCAL_USER,
      text: trimmed,
    });
  }, []);

  const sendSeedMessage = useCallback((seedAmount: number) => {
    return liveChatStore.sendSeedMessage(LOCAL_USER.userName, LOCAL_USER.initials, seedAmount);
  }, []);

  const sendPrayerMessage = useCallback(() => {
    return liveChatStore.sendPrayerMessage(LOCAL_USER.userName, LOCAL_USER.initials);
  }, []);

  return {
    messages,
    sendMessage,
    sendSeedMessage,
    sendPrayerMessage,
  };
}
