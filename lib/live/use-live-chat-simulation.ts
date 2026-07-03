"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LiveChatSimulationScheduler,
  nextLiveChatSimulationDelayMs,
  trimSimulatedChatMessages,
  type SimulatedChatMessage,
} from "@/lib/live/live-simulation";

type UseLiveChatSimulationOptions = {
  enabled?: boolean;
  /** Profile / host names that must never appear in ambient simulation. */
  excludedNames?: readonly string[];
};

type UseLiveChatSimulationResult = {
  messages: SimulatedChatMessage[];
};

export function useLiveChatSimulation({
  enabled = true,
  excludedNames = [],
}: UseLiveChatSimulationOptions = {}): UseLiveChatSimulationResult {
  const [messages, setMessages] = useState<SimulatedChatMessage[]>([]);
  const schedulerRef = useRef<LiveChatSimulationScheduler | null>(null);
  const excludedKey = useMemo(
    () => excludedNames.map((name) => name.trim().toLowerCase()).join("|"),
    [excludedNames],
  );

  useEffect(() => {
    if (!enabled) {
      setMessages([]);
      schedulerRef.current = null;
      return;
    }

    const scheduler = new LiveChatSimulationScheduler(excludedNames);
    schedulerRef.current = scheduler;
    queueMicrotask(() => setMessages([]));

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
  }, [enabled, excludedKey, excludedNames]);

  return { messages };
}
