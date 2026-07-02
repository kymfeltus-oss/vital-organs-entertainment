"use client";

import { useEffect, useState } from "react";
import {
  createInitialSimulatedChatBatch,
  createSimulatedChatMessage,
  nextLiveChatSimulationDelayMs,
  trimSimulatedChatMessages,
  type SimulatedChatMessage,
} from "@/lib/live/live-simulation";

type UseLiveChatSimulationOptions = {
  enabled?: boolean;
};

type UseLiveChatSimulationResult = {
  messages: SimulatedChatMessage[];
};

export function useLiveChatSimulation({
  enabled = true,
}: UseLiveChatSimulationOptions = {}): UseLiveChatSimulationResult {
  const [messages, setMessages] = useState<SimulatedChatMessage[]>([]);

  useEffect(() => {
    if (!enabled) {
      setMessages([]);
      return;
    }

    setMessages(createInitialSimulatedChatBatch(2));

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      timer = setTimeout(() => {
        if (cancelled) return;

        setMessages((current) =>
          trimSimulatedChatMessages([...current, createSimulatedChatMessage()]),
        );
        scheduleNext();
      }, nextLiveChatSimulationDelayMs());
    };

    scheduleNext();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled]);

  return { messages };
}
