import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { computeCountdown } from "@/lib/live/event-lobby";
import type { OwnerCountdownSnapshot } from "@/lib/owner/contracts";

export function defaultOwnerCountdownSnapshot(): OwnerCountdownSnapshot {
  return {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isComplete: true,
    targetIso: null,
  };
}

export function buildOwnerCountdownSnapshot(
  config: EventCountdownConfig,
  nowMs = Date.now(),
): OwnerCountdownSnapshot {
  const targetIso = config.start_time?.trim() || null;

  if (!config.is_active || !targetIso) {
    return defaultOwnerCountdownSnapshot();
  }

  const parts = computeCountdown(targetIso, nowMs);
  return {
    days: parts.days,
    hours: parts.hours,
    minutes: parts.minutes,
    seconds: parts.seconds,
    isComplete: parts.isComplete,
    targetIso,
  };
}
