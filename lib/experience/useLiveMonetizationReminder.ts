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
const MAX_REMINDER_VISIBILITY_MS = 10_000;

export function useLiveMonetizationReminder({
  enabled = true,
  pollMs = DEFAULT_POLL_MS,
}: UseLiveMonetizationReminderOptions = {}): UseLiveMonetizationReminderResult {
  const [payload, setPayload] = useState<MonetizationReminderPayload | null>(null);
  const [dismissedSlotStartedAt, setDismissedSlotStartedAt] = useState<string | null>(null);
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
      abortRef.current?.abort();
      return;
    }

    const initialTimer = window.setTimeout(() => {
      void syncReminder();
    }, 0);
    const timer = window.setInterval(() => {
      void syncReminder();
    }, pollMs);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
      abortRef.current?.abort();
    };
  }, [enabled, pollMs, syncReminder]);

  const activeReminder =
    payload?.enabled &&
    payload.isLive &&
    payload.active &&
    payload.active.slotStartedAt !== dismissedSlotStartedAt
      ? payload.active
      : null;

  const dismissActive = useCallback(() => {
    if (payload?.active) {
      setDismissedSlotStartedAt(payload.active.slotStartedAt);
    }
  }, [payload]);

  useEffect(() => {
    if (!activeReminder) return;

    const serverRemainingMs = Date.parse(activeReminder.visibleUntil) - Date.now();
    const visibleForMs = Math.max(0, Math.min(MAX_REMINDER_VISIBILITY_MS, serverRemainingMs));
    const timer = window.setTimeout(() => {
      setDismissedSlotStartedAt(activeReminder.slotStartedAt);
    }, visibleForMs);

    return () => window.clearTimeout(timer);
  }, [activeReminder]);

  return {
    activeReminder,
    isLive: payload?.isLive === true,
    enabled: payload?.enabled === true,
    dismissActive,
  };
}
