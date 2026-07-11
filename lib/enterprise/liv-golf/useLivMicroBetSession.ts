"use client";

import { useLiveStreamSubscriber } from "@/lib/live/useLiveStreamSubscriber";
import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";

/** @deprecated Prefer useLiveStreamSubscriber(LIV_GOLF_TOUR_MAIN_ROOM) for fan surfaces. */
export function useLivMicroBetSession() {
  const subscriber = useLiveStreamSubscriber(LIV_GOLF_TOUR_MAIN_ROOM);

  return {
    activeBetId: subscriber.activeBetId,
    activeBet: subscriber.activeBet,
    clearOverlays: subscriber.clearOverlays,
    launchedAt: subscriber.launchedAt,
    updatedAt: subscriber.updatedAt,
    isPanelOpen: subscriber.isPanelOpen,
    isLoading: subscriber.isLoading,
    error: subscriber.error,
    refresh: subscriber.refresh,
  };
}
