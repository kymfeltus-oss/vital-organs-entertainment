import {
  computeEventLifecycleStage,
  resolveAttendeeLifecycleStage,
} from "@/lib/experience/event-lifecycle";
import {
  EXPERIENCE_LIVE_PATH,
  PUBLIC_COUNTDOWN_PATH,
} from "@/lib/experience/live-routes";
import { computeEventCountdownPhase } from "@/lib/live/countdown-config";

export type AttendeeLiveNavTarget = typeof EXPERIENCE_LIVE_PATH | typeof PUBLIC_COUNTDOWN_PATH;

type ResolveAttendeeLiveNavTargetOptions = {
  broadcastIsLive?: boolean;
  nowMs?: number;
};

/**
 * Resolve whether attendee "Live" navigation opens `/countdown` (announcement)
 * or `/live` (holding room + stream arena).
 */
export function resolveAttendeeLiveNavTarget(
  startIso: string,
  endIso: string,
  options: ResolveAttendeeLiveNavTargetOptions = {},
): AttendeeLiveNavTarget {
  const nowMs = options.nowMs ?? Date.now();
  const countdownPhase = computeEventCountdownPhase(startIso, endIso, nowMs);
  const scheduleStage = computeEventLifecycleStage(startIso, endIso, nowMs);
  const lifecycleStage = resolveAttendeeLifecycleStage(scheduleStage, {
    broadcastIsLive: options.broadcastIsLive,
    countdownPhase,
  });

  if (lifecycleStage === "announcement" || lifecycleStage === "ended") {
    return PUBLIC_COUNTDOWN_PATH;
  }

  return EXPERIENCE_LIVE_PATH;
}
