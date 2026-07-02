"use client";

import { useEffect, useRef, useState } from "react";
import {
  LiveChatSimulationScheduler,
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
  const schedulerRef = useRef<LiveChatSimulationScheduler | null>(null);

  useEffect(() => {
    if (!enabled) {
      setMessages([]);
      schedulerRef.current = null;
      return;
    }

    const scheduler = new LiveChatSimulationScheduler();
    schedulerRef.current = scheduler;
    setMessages(scheduler.createInitialBatch(2));

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      timer = setTimeout(() => {
        if (cancelled) return;

        setMessages((current) =>
          trimSimulatedChatMessages([
            ...current,
            schedulerRef.current?.nextMessage() ?? scheduler.nextMessage(),
          ]),
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
