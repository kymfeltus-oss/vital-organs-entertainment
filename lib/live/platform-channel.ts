"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import {
  attachRealtimeChannelErrorGuard,
  removeChannelsByName,
  subscribeChannelWithResilience,
} from "@/lib/live/realtime-subscribe";
import { LIVE_ROOM_PLATFORM_CHANNEL } from "@/lib/live/types";

export type PlatformChannelStatusListener = (status: string, err?: Error) => void;

const platformStatusListeners = new Set<PlatformChannelStatusListener>();

/** Subscribe to shared platform channel subscribe() status updates (for polling fallback). */
export function subscribePlatformChannelStatus(
  listener: PlatformChannelStatusListener,
): () => void {
  platformStatusListeners.add(listener);
  return () => {
    platformStatusListeners.delete(listener);
  };
}

function emitPlatformChannelStatus(status: string, err?: Error): void {
  for (const listener of platformStatusListeners) {
    try {
      listener(status, err);
    } catch {
      // Absorb listener failures — socket recovery must not crash the attendee shell.
    }
  }
}

export type PlatformListenerApply = (channel: RealtimeChannel) => RealtimeChannel;

let platformChannel: RealtimeChannel | null = null;
let platformSupabase: SupabaseClient | null = null;
let isSubscribed = false;
let subscriberCount = 0;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let resubscribeTimer: ReturnType<typeof setTimeout> | null = null;
let syncChain: Promise<void> = Promise.resolve();
const listeners = new Map<string, PlatformListenerApply>();

function clearSyncTimer(): void {
  if (syncTimer !== null) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
}

function clearResubscribeTimer(): void {
  if (resubscribeTimer !== null) {
    clearTimeout(resubscribeTimer);
    resubscribeTimer = null;
  }
}

function applyAllListeners(channel: RealtimeChannel): RealtimeChannel {
  let next = channel;
  for (const apply of listeners.values()) {
    next = apply(next);
  }
  return next;
}

function scheduleStaleChannelResubscribe(): void {
  if (subscriberCount === 0 || listeners.size === 0) return;
  if (resubscribeTimer !== null) return;

  resubscribeTimer = setTimeout(() => {
    resubscribeTimer = null;
    schedulePlatformChannelSync();
  }, 1_500);
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
  channel = attachRealtimeChannelErrorGuard(channel);

  subscribeChannelWithResilience(channel, LIVE_ROOM_PLATFORM_CHANNEL, {
    silent: true,
    onStale: () => {
      isSubscribed = false;
      scheduleStaleChannelResubscribe();
    },
    onStatus: (status, err) => {
      emitPlatformChannelStatus(status, err);
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        isSubscribed = false;
      } else if (status === "SUBSCRIBED") {
        isSubscribed = true;
      }
    },
  });

  platformChannel = channel;
}

function schedulePlatformChannelSync(): void {
  clearSyncTimer();

  syncTimer = setTimeout(() => {
    syncTimer = null;
    syncChain = syncChain
      .then(() => syncPlatformChannel())
      .catch(() => {
        isSubscribed = false;
        platformChannel = null;
        scheduleStaleChannelResubscribe();
      });
  }, 0);
}

/** Shared live-room Realtime channel — one WebSocket for stream sync and seed wallets. */
export function acquirePlatformChannel(supabase: SupabaseClient): RealtimeChannel {
  if (platformChannel && platformSupabase !== supabase) {
    clearSyncTimer();
    clearResubscribeTimer();
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

/** Force a fresh subscribe() on the shared platform channel (e.g. after tab focus). */
export function resubscribePlatformChannel(): void {
  if (subscriberCount === 0 || listeners.size === 0) return;
  isSubscribed = false;
  clearResubscribeTimer();
  schedulePlatformChannelSync();
}

export function isPlatformChannelSubscribed(): boolean {
  return isSubscribed;
}

export function releasePlatformChannel(supabase: SupabaseClient): void {
  subscriberCount = Math.max(0, subscriberCount - 1);

  if (subscriberCount === 0) {
    clearSyncTimer();
    clearResubscribeTimer();
    listeners.clear();
    syncChain = syncChain
      .then(async () => {
        await removeChannelsByName(supabase, LIVE_ROOM_PLATFORM_CHANNEL);
        platformChannel = null;
        platformSupabase = null;
        isSubscribed = false;
      })
      .catch(() => {
        platformChannel = null;
        platformSupabase = null;
        isSubscribed = false;
      });
  } else {
    schedulePlatformChannelSync();
  }
}
