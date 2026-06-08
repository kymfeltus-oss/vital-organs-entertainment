"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchLiveAccessEvaluation } from "@/lib/access";
import { LIVE_STREAM_STATE_BROADCAST_EVENT } from "@/lib/live/types";
import {
  acquirePlatformChannel,
  commitPlatformChannelSubscribe,
  releasePlatformChannel,
} from "@/lib/live/platform-channel";
import { getSupabase } from "@/lib/supabase/client";

type UseLiveStreamStateResult = {
  isLive: boolean;
  isLoading: boolean;
  error: string | null;
};

export function useLiveStreamState(): UseLiveStreamStateResult {
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncFromAccessApi = useCallback(async () => {
    try {
      const evaluation = await fetchLiveAccessEvaluation();
      setIsLive(evaluation.streamIsLive);
      setError(null);
    } catch (syncError) {
      console.error("Live stream state sync failed:", syncError);
      setError("Unable to load live stream status.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;

    try {
      supabase = getSupabase();
    } catch (initError) {
      console.error("Live stream state init failed:", initError);
      queueMicrotask(() => {
        if (!cancelled) {
          setError("Live stream state is unavailable.");
          setIsLoading(false);
        }
      });
      return;
    }

    queueMicrotask(() => {
      if (!cancelled) {
        void syncFromAccessApi();
      }
    });

    const channel = acquirePlatformChannel(supabase);

    channel
      .on(
        "broadcast",
        { event: LIVE_STREAM_STATE_BROADCAST_EVENT },
        () => {
          if (cancelled) return;
          void syncFromAccessApi();
        },
      );

    commitPlatformChannelSubscribe();

    return () => {
      cancelled = true;
      releasePlatformChannel(supabase);
    };
  }, [syncFromAccessApi]);

  return {
    isLive,
    isLoading,
    error,
  };
}
