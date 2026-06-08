"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LIVE_EMOTE_BATCH_BROADCAST_EVENT,
  LIVE_EMOTE_BROADCAST_EVENT,
  type LiveEmoteBatchBroadcastPayload,
  type LiveEmoteBroadcastPayload,
} from "@/lib/live/emotes";
import {
  acquirePlatformChannel,
  commitPlatformChannelSubscribe,
  releasePlatformChannel,
} from "@/lib/live/platform-channel";
import { getSupabase } from "@/lib/supabase/client";

export type FloatingEmote = LiveEmoteBroadcastPayload & {
  key: string;
};

type UseLiveEmoteFanoutResult = {
  floatingEmotes: FloatingEmote[];
  dismissEmote: (key: string) => void;
};

function isBatchPayload(
  payload: unknown,
): payload is LiveEmoteBatchBroadcastPayload {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as LiveEmoteBatchBroadcastPayload;
  return (
    typeof candidate.senderId === "string" &&
    Array.isArray(candidate.emotes)
  );
}

function isSinglePayload(payload: unknown): payload is LiveEmoteBroadcastPayload {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as LiveEmoteBroadcastPayload;
  return (
    typeof candidate.emoteId === "string" &&
    typeof candidate.emoji === "string"
  );
}

export function useLiveEmoteFanout(): UseLiveEmoteFanoutResult {
  const [floatingEmotes, setFloatingEmotes] = useState<FloatingEmote[]>([]);
  const localUserIdRef = useRef<string | null>(null);

  const dismissEmote = useCallback((key: string) => {
    setFloatingEmotes((current) => current.filter((emote) => emote.key !== key));
  }, []);

  const pushEmote = useCallback((payload: LiveEmoteBroadcastPayload) => {
    const key = `${payload.emoteId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setFloatingEmotes((current) => [
      ...current.slice(-24),
      { ...payload, key },
    ]);
  }, []);

  const pushEmoteBatch = useCallback((payloads: LiveEmoteBroadcastPayload[]) => {
    if (payloads.length === 0) return;

    setFloatingEmotes((current) => {
      const next = [...current];

      for (const [index, payload] of payloads.entries()) {
        if (!payload?.emoji || !payload?.emoteId) continue;

        const key = `${payload.emoteId}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
        next.push({
          emoteId: payload.emoteId,
          emoji: payload.emoji,
          author: payload.author ?? "Fan",
          originX:
            typeof payload.originX === "number" ? payload.originX : 0.5,
          key,
        });
      }

      return next.slice(-24);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;

    try {
      supabase = getSupabase();
    } catch {
      return;
    }

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) {
        localUserIdRef.current = user?.id ?? null;
      }
    });

    const channel = acquirePlatformChannel(supabase);

    channel
      .on(
        "broadcast",
        { event: LIVE_EMOTE_BATCH_BROADCAST_EVENT },
        ({ payload }) => {
          if (cancelled) return;

          if (!isBatchPayload(payload)) return;

          if (
            localUserIdRef.current &&
            payload.senderId === localUserIdRef.current
          ) {
            return;
          }

          pushEmoteBatch(payload.emotes);
        },
      )
      .on("broadcast", { event: LIVE_EMOTE_BROADCAST_EVENT }, ({ payload }) => {
        if (cancelled) return;

        if (!isSinglePayload(payload)) return;

        pushEmote({
          emoteId: payload.emoteId,
          emoji: payload.emoji,
          author: payload.author ?? "Fan",
          originX:
            typeof payload.originX === "number" ? payload.originX : 0.5,
        });
      });

    commitPlatformChannelSubscribe();

    return () => {
      cancelled = true;
      releasePlatformChannel(supabase);
    };
  }, [pushEmote, pushEmoteBatch]);

  return {
    floatingEmotes,
    dismissEmote,
  };
}

export { getAppUrl } from "@/lib/client-api";
