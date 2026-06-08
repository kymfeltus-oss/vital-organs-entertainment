"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { LIVE_ROOM_PLATFORM_CHANNEL } from "@/lib/live/types";

let platformChannel: RealtimeChannel | null = null;
let platformSupabase: SupabaseClient | null = null;
let isSubscribed = false;
let subscriberCount = 0;
let subscribeTimer: ReturnType<typeof setTimeout> | null = null;

function clearSubscribeTimer(): void {
  if (subscribeTimer !== null) {
    clearTimeout(subscribeTimer);
    subscribeTimer = null;
  }
}

/** Shared live-room Realtime channel — one WebSocket for chat, emotes, stream, seeds. */
export function acquirePlatformChannel(supabase: SupabaseClient): RealtimeChannel {
  if (platformChannel && platformSupabase !== supabase) {
    clearSubscribeTimer();
    void platformSupabase.removeChannel(platformChannel);
    platformChannel = null;
    isSubscribed = false;
    subscriberCount = 0;
  }

  platformSupabase = supabase;

  if (!platformChannel) {
    platformChannel = supabase.channel(LIVE_ROOM_PLATFORM_CHANNEL);
  }

  subscriberCount += 1;
  return platformChannel;
}

/** Subscribe only after every hook registers .on(...) listeners in the same commit. */
export function commitPlatformChannelSubscribe(): void {
  if (!platformChannel || isSubscribed || subscribeTimer !== null) return;

  subscribeTimer = setTimeout(() => {
    subscribeTimer = null;

    if (!platformChannel || isSubscribed) return;

    platformChannel.subscribe();
    isSubscribed = true;
  }, 0);
}

export function releasePlatformChannel(supabase: SupabaseClient): void {
  subscriberCount = Math.max(0, subscriberCount - 1);

  if (subscriberCount === 0 && platformChannel) {
    clearSubscribeTimer();
    void supabase.removeChannel(platformChannel);
    platformChannel = null;
    platformSupabase = null;
    isSubscribed = false;
  }
}
