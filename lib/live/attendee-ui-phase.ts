/** Operator-controlled attendee /live surface — never derived from Date.now(). */
export type AttendeeUiPhase = "pre_show" | "live" | "ended";

export const ATTENDEE_UI_PHASE_VALUES: AttendeeUiPhase[] = ["pre_show", "live", "ended"];

export const DEFAULT_ATTENDEE_UI_PHASE: AttendeeUiPhase = "pre_show";

export function isAttendeeUiPhase(value: unknown): value is AttendeeUiPhase {
  return (
    value === "pre_show" ||
    value === "live" ||
    value === "ended"
  );
}

type AttendeeUiPhaseSource = {
  attendee_ui_phase?: unknown;
  is_live?: unknown;
};

/** Resolve phase from DB row with safe fallback when column is missing pre-migration. */
export function resolveAttendeeUiPhase(source: AttendeeUiPhaseSource | null | undefined): AttendeeUiPhase {
  if (source?.is_live === true) {
    return "live";
  }

  if (source && isAttendeeUiPhase(source.attendee_ui_phase)) {
    return source.attendee_ui_phase;
  }

  return DEFAULT_ATTENDEE_UI_PHASE;
}

export function attendeeUiPhasePromotesToLiveStream(phase: AttendeeUiPhase): boolean {
  return phase === "live";
}
