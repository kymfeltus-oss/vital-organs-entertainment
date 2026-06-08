export type EventLifecycleStatus = "waiting" | "live" | "ended";

export type EventLifecycleInput = {
  streamIsLive: boolean;
  isStreamStateLoading: boolean;
  /** When wired to backend event state, set true after the broadcast has concluded. */
  platformEventEnded?: boolean;
};

/**
 * Derives attendee-facing event lifecycle without conflating offline standby with ended.
 */
export function deriveEventLifecycleStatus(
  input: EventLifecycleInput,
): EventLifecycleStatus {
  if (input.platformEventEnded === true) {
    return "ended";
  }

  if (input.isStreamStateLoading) {
    return "waiting";
  }

  if (input.streamIsLive) {
    return "live";
  }

  return "waiting";
}
