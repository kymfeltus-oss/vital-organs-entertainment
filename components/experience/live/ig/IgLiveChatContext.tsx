"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FellowshipChatMessage, FellowshipChatSession } from "@/lib/experience/fellowship-chat";
import { useFellowshipChat } from "@/lib/experience/useFellowshipChat";

type IgLiveChatContextValue = {
  messages: FellowshipChatMessage[];
  session: FellowshipChatSession;
  isSending: boolean;
  sendMessage: (content: string) => Promise<boolean>;
};

const IgLiveChatContext = createContext<IgLiveChatContextValue | null>(null);

export function IgLiveChatProvider({ children }: { children: ReactNode }) {
  const { messages, session, isSending, sendMessage } = useFellowshipChat();

  return (
    <IgLiveChatContext.Provider value={{ messages, session, isSending, sendMessage }}>
      {children}
    </IgLiveChatContext.Provider>
  );
}

export function useIgLiveChat(): IgLiveChatContextValue {
  const context = useContext(IgLiveChatContext);
  if (!context) {
    throw new Error("useIgLiveChat must be used within IgLiveChatProvider");
  }
  return context;
}
