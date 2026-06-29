"use client";

import { useCallback, useState } from "react";
import { useLiveChatStore } from "@/lib/liveChatStore";

export type FloatingReaction = {
  id: string;
  xOffset: number;
  createdAt: number;
};

export function useFloatingReactions() {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const emitLiveStreamReaction = useLiveChatStore((state) => state.emitLiveStreamReaction);

  const spawnHeart = useCallback(() => {
    const reaction: FloatingReaction = {
      id: `heart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      xOffset: Math.round(Math.random() * 24 - 12),
      createdAt: Date.now(),
    };
    setReactions((current) => [...current, reaction].slice(-12));
    void emitLiveStreamReaction("heart").catch(() => undefined);
  }, [emitLiveStreamReaction]);

  const removeReaction = useCallback((id: string) => {
    setReactions((current) => current.filter((item) => item.id !== id));
  }, []);

  return {
    reactions,
    spawnHeart,
    removeReaction,
  };
}
