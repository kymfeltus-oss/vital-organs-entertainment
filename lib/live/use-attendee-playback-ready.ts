"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLiveAccessEvaluation } from "@/lib/access";
import { LIVE_STREAM_STATE_BROADCAST_EVENT } from "@/lib/live/types";
import {
  acquirePlatformChannel,
  commitPlatformChannelSubscribe,
  registerPlatformListener,
  releasePlatformChannel,
  unregisterPlatformListener,
} from "@/lib/live/platform-channel";
import { getSupabase } from "@/lib/supabase/client";

const MANIFEST_POLL_MS = 5_000;
const MANIFEST_SYNC_LISTENER_ID = "attendee-playback-ready-sync";

type ManifestResponse = {
  success?: boolean;
  playbackUrl?: string;
};

/** Poll attendee manifest — used to defer live shell mount until HLS is actually ready. */
export function useAttendeePlaybackReady(enabled: boolean) {
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(enabled);
  const pollRef = useRef<() => Promise<void>>(async () => {});

  const pollManifest = useCallback(async () => {
    if (!enabled) return;

    try {
      const access = await fetchLiveAccessEvaluation();
      if (!access.streamIsLive || access.attendeeUiPhase !== "live") {
        setPlaybackUrl(null);
        return;
      }

      const response = await fetch("/api/stream/manifest?experience=main_stage", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setPlaybackUrl(null);
        return;
      }

      const data = (await response.json()) as ManifestResponse;
      const url = data.playbackUrl?.trim() ?? "";
      setPlaybackUrl(data.success && url ? url : null);
    } catch {
      setPlaybackUrl(null);
    } finally {
      setIsChecking(false);
    }
  }, [enabled]);

  pollRef.current = pollManifest;

  useEffect(() => {
    if (!enabled) {
      setPlaybackUrl(null);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase> | null = null;

    queueMicrotask(() => {
      if (!cancelled) void pollManifest();
    });

    const intervalId = window.setInterval(() => void pollRef.current(), MANIFEST_POLL_MS);

    try {
      supabase = getSupabase();
      acquirePlatformChannel(supabase);
      registerPlatformListener(MANIFEST_SYNC_LISTENER_ID, (channel) =>
        channel.on("broadcast", { event: LIVE_STREAM_STATE_BROADCAST_EVENT }, () => {
          if (cancelled) return;
          void pollRef.current();
        }),
      );
      commitPlatformChannelSubscribe();
    } catch {
      // Polling alone is sufficient when Supabase is unavailable.
    }

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      if (supabase) {
        unregisterPlatformListener(MANIFEST_SYNC_LISTENER_ID);
        releasePlatformChannel(supabase);
      }
    };
  }, [enabled, pollManifest]);

  return {
    playbackUrl,
    isReady: Boolean(playbackUrl),
    isChecking: enabled ? isChecking : false,
  };
}
