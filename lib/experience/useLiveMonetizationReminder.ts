"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActiveMonetizationReminder } from "@/lib/owner/graphics-monetization-reminders";
import { getClientAppUrl } from "@/lib/client-api";

type MonetizationReminderPayload = {
  enabled: boolean;
  isLive: boolean;
  intervalMinutes: number;
  displaySeconds: number;
  active: ActiveMonetizationReminder | null;
  nextAt: string | null;
};

type UseLiveMonetizationReminderOptions = {
  enabled?: boolean;
  pollMs?: number;
};

type UseLiveMonetizationReminderResult = {
  activeReminder: ActiveMonetizationReminder | null;
  isLive: boolean;
  enabled: boolean;
  dismissActive: () => void;
};

const DEFAULT_POLL_MS = 10_000;

export function useLiveMonetizationReminder({
  enabled = true,
  pollMs = DEFAULT_POLL_MS,
}: UseLiveMonetizationReminderOptions = {}): UseLiveMonetizationReminderResult {
  const [payload, setPayload] = useState<MonetizationReminderPayload | null>(null);
  const [dismissedSlotIndex, setDismissedSlotIndex] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const syncReminder = useCallback(async () => {
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const response = await fetch(`${getClientAppUrl()}/api/access/live/monetization-reminder`, {
        cache: "no-store",
        credentials: "include",
        signal: abortController.signal,
      });

      if (!response.ok || abortController.signal.aborted) return;

      const data = (await response.json()) as MonetizationReminderPayload;
      if (abortController.signal.aborted) return;

      setPayload(data);
    } catch (error) {
      if (
        abortController.signal.aborted ||
        (error instanceof DOMException && error.name === "AbortError") ||
        (error instanceof Error && error.name === "AbortError")
      ) {
        return;
      }
      console.warn("Live monetization reminder sync failed:", error);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setPayload(null);
      setDismissedSlotIndex(null);
      return;
    }

    void syncReminder();
    const timer = window.setInterval(() => {
      void syncReminder();
    }, pollMs);

    return () => {
      window.clearInterval(timer);
      abortRef.current?.abort();
    };
  }, [enabled, pollMs, syncReminder]);

  const activeReminder =
    payload?.enabled &&
    payload.isLive &&
    payload.active &&
    payload.active.slotIndex !== dismissedSlotIndex
      ? payload.active
      : null;

  const dismissActive = useCallback(() => {
    if (payload?.active) {
      setDismissedSlotIndex(payload.active.slotIndex);
    }
  }, [payload?.active]);

  useEffect(() => {
    if (!payload?.active) return;
    if (dismissedSlotIndex !== null && dismissedSlotIndex !== payload.active.slotIndex) {
      setDismissedSlotIndex(null);
    }
  }, [dismissedSlotIndex, payload?.active]);

  return {
    activeReminder,
    isLive: payload?.isLive === true,
    enabled: payload?.enabled === true,
    dismissActive,
  };
}
