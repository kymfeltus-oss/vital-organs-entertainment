import type { EventCountdownConfig } from "@/lib/live/countdown-config";

/** Parse event start time; returns null when the timestamp is missing or invalid. */
export function parseCountdownStartMs(iso: string | undefined | null): number | null {
  if (!iso?.trim()) return null;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** True when countdown config was loaded from persisted event_countdown_config (not code defaults). */
export function hasPersistedCountdownConfig(config: EventCountdownConfig): boolean {
  return Boolean(config.id?.trim());
}

/** Show numeric countdown only when a real persisted start time exists. */
export function shouldShowCountdownTimer(
  config: EventCountdownConfig,
  countdownLoading: boolean,
): boolean {
  if (countdownLoading) return false;
  if (!hasPersistedCountdownConfig(config)) return false;
  return parseCountdownStartMs(config.start_time) !== null;
}
