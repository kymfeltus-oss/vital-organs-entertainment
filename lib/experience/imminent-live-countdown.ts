import { GOING_LIVE_TRANSITION_SEC } from "@/lib/experience/live-go-live-transition";

/** Remaining whole seconds in the drop-curtain window — server-anchored, no client decrement drift. */
export function resolveImminentLiveRemainingSeconds(
  dropStartedAt: string,
  durationSeconds: number = GOING_LIVE_TRANSITION_SEC,
  nowMs = Date.now(),
): number {
  const startedMs = new Date(dropStartedAt).getTime();
  if (Number.isNaN(startedMs)) return 0;

  const elapsedSec = Math.floor((nowMs - startedMs) / 1000);
  return Math.max(0, durationSeconds - elapsedSec);
}

export function isValidDropStartedAt(value: string | null | undefined): value is string {
  if (!value?.trim()) return false;
  return !Number.isNaN(new Date(value).getTime());
}
