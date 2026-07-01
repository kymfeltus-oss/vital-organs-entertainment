import type { EventCountdownConfig, EventCountdownPhase } from "@/lib/live/countdown-config";
import type { AttendeeUiPhase } from "@/lib/live/attendee-ui-phase";
import type { CountdownParts } from "@/lib/live/event-lobby";

export const COUNTDOWN_STARTING_SHORTLY_LABEL = "STARTING SHORTLY";
export const HOLDING_ROOM_STARTING_MESSAGE =
  "Stream starting momentarily... Please stand by.";
export const HOLDING_ROOM_CONNECTING_MESSAGE =
  "Connecting secure stream broadcast... Standing by.";

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

/** Scheduled start passed but broadcast has not opened yet. */
export function isCountdownStartingShortly(
  countdown: CountdownParts,
  eventPhase: AttendeeUiPhase | EventCountdownPhase,
): boolean {
  return countdown.isComplete && (eventPhase === "pre_show" || eventPhase === "waiting");
}

export function getCountdownAriaLabel(
  countdown: CountdownParts,
  eventPhase: AttendeeUiPhase | EventCountdownPhase,
  options: { isLoading?: boolean; hasStartTime?: boolean } = {},
): string {
  if (options.isLoading) return "Loading event countdown";
  if (options.hasStartTime === false) return "Event countdown unavailable";
  if (isCountdownStartingShortly(countdown, eventPhase)) return HOLDING_ROOM_STARTING_MESSAGE;
  if (countdown.isComplete) return "Event starting now";
  return `${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds until live`;
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
