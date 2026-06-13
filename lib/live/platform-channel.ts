"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { removeChannelsByName } from "@/lib/live/realtime-subscribe";
import { LIVE_ROOM_PLATFORM_CHANNEL } from "@/lib/live/types";

export type PlatformListenerApply = (channel: RealtimeChannel) => RealtimeChannel;

let platformChannel: RealtimeChannel | null = null;
let platformSupabase: SupabaseClient | null = null;
let isSubscribed = false;
let subscriberCount = 0;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncChain: Promise<void> = Promise.resolve();
const listeners = new Map<string, PlatformListenerApply>();

function clearSyncTimer(): void {
  if (syncTimer !== null) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
}

function debugLog(message: string, data: Record<string, unknown>): void {
  // #region agent log
  fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "baf5b9" },
    body: JSON.stringify({
      sessionId: "baf5b9",
      runId: "realtime-fix-v2",
      hypothesisId: "REALTIME",
      location: "platform-channel.ts",
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

function applyAllListeners(channel: RealtimeChannel): RealtimeChannel {
  let next = channel;
  for (const apply of listeners.values()) {
    next = apply(next);
  }
  return next;
}

async function syncPlatformChannel(): Promise<void> {
  if (!platformSupabase || subscriberCount === 0) {
    if (platformSupabase && platformChannel) {
      await removeChannelsByName(platformSupabase, LIVE_ROOM_PLATFORM_CHANNEL);
    }
    platformChannel = null;
    isSubscribed = false;
    return;
  }

  if (listeners.size === 0) {
    debugLog("syncPlatformChannel:skipNoListeners", { subscriberCount });
    return;
  }

  debugLog("syncPlatformChannel:start", {
    subscriberCount,
    listenerCount: listeners.size,
    listenerIds: [...listeners.keys()],
    wasSubscribed: isSubscribed,
  });

  await removeChannelsByName(platformSupabase, LIVE_ROOM_PLATFORM_CHANNEL);

  let channel = platformSupabase.channel(LIVE_ROOM_PLATFORM_CHANNEL);
  channel = applyAllListeners(channel);
  channel.subscribe();
  platformChannel = channel;
  isSubscribed = true;

  debugLog("syncPlatformChannel:complete", {
    subscriberCount,
    listenerCount: listeners.size,
  });
}

function schedulePlatformChannelSync(): void {
  clearSyncTimer();

  syncTimer = setTimeout(() => {
    syncTimer = null;
    syncChain = syncChain
      .then(() => syncPlatformChannel())
      .catch((error) => {
        console.error("Platform channel sync failed:", error);
        isSubscribed = false;
        platformChannel = null;
      });
  }, 0);
}

/** Shared live-room Realtime channel — one WebSocket for stream sync and seed wallets. */
export function acquirePlatformChannel(supabase: SupabaseClient): RealtimeChannel {
  if (platformChannel && platformSupabase !== supabase) {
    clearSyncTimer();
    listeners.clear();
    void removeChannelsByName(platformSupabase, LIVE_ROOM_PLATFORM_CHANNEL);
    platformChannel = null;
    isSubscribed = false;
    subscriberCount = 0;
  }

  platformSupabase = supabase;

  if (!platformChannel) {
    platformChannel = supabase.channel(LIVE_ROOM_PLATFORM_CHANNEL);
  }

  subscriberCount += 1;

  debugLog("acquirePlatformChannel", {
    subscriberCount,
    isSubscribed,
    listenerCount: listeners.size,
  });

  return platformChannel;
}

export function registerPlatformListener(id: string, apply: PlatformListenerApply): void {
  listeners.set(id, apply);

  debugLog("registerPlatformListener", {
    id,
    isSubscribed,
    subscriberCount,
    listenerCount: listeners.size,
  });

  schedulePlatformChannelSync();
}

export function unregisterPlatformListener(id: string): void {
  if (!listeners.has(id)) return;

  listeners.delete(id);

  debugLog("unregisterPlatformListener", {
    id,
    isSubscribed,
    subscriberCount,
    listenerCount: listeners.size,
  });

  schedulePlatformChannelSync();
}

/** Batch listener registration in the same commit, then bind + subscribe on a fresh channel. */
export function commitPlatformChannelSubscribe(): void {
  schedulePlatformChannelSync();
}

export function releasePlatformChannel(supabase: SupabaseClient): void {
  subscriberCount = Math.max(0, subscriberCount - 1);

  debugLog("releasePlatformChannel", {
    subscriberCount,
    isSubscribed,
    listenerCount: listeners.size,
  });

  if (subscriberCount === 0) {
    clearSyncTimer();
    listeners.clear();
    syncChain = syncChain
      .then(async () => {
        await removeChannelsByName(supabase, LIVE_ROOM_PLATFORM_CHANNEL);
        platformChannel = null;
        platformSupabase = null;
        isSubscribed = false;
      })
      .catch((error) => {
        console.error("Platform channel release failed:", error);
      });
  } else {
    schedulePlatformChannelSync();
  }
}
