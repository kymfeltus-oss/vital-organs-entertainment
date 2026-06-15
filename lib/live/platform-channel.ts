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
    return;
  }

  await removeChannelsByName(platformSupabase, LIVE_ROOM_PLATFORM_CHANNEL);

  let channel = platformSupabase.channel(LIVE_ROOM_PLATFORM_CHANNEL);
  channel = applyAllListeners(channel);
  channel.subscribe();
  platformChannel = channel;
  isSubscribed = true;
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

  return platformChannel;
}

export function registerPlatformListener(id: string, apply: PlatformListenerApply): void {
  listeners.set(id, apply);
  schedulePlatformChannelSync();
}

export function unregisterPlatformListener(id: string): void {
  if (!listeners.has(id)) return;

  listeners.delete(id);
  schedulePlatformChannelSync();
}

/** Batch listener registration in the same commit, then bind + subscribe on a fresh channel. */
export function commitPlatformChannelSubscribe(): void {
  schedulePlatformChannelSync();
}

export function releasePlatformChannel(supabase: SupabaseClient): void {
  subscriberCount = Math.max(0, subscriberCount - 1);

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
