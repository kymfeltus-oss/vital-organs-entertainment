/** Anchors on holding-room.png — digits + labels over empty neon rings. */

export type HoldingRoomCountdownUnitId = "days" | "hours" | "minutes" | "seconds";

export type HoldingRoomCountdownSlot = {
  id: HoldingRoomCountdownUnitId;
  /** Horizontal center of each ring (% of artboard width). */
  centerX: number;
  /** Vertical center of live digits inside the ring void (% of artboard height). */
  digitY: number;
  /** Vertical center of unit label below digits (% of artboard height). */
  labelY: number;
  label: string;
};

/** Measured on holding-room.png (941×1672 native, top-aligned on 1080×1920 stage). */
export const HOLDING_ROOM_COUNTDOWN_UNITS: readonly HoldingRoomCountdownSlot[] = [
  { id: "days", centerX: 13.2, digitY: 48.9, labelY: 55.0, label: "DAYS" },
  { id: "hours", centerX: 37.3, digitY: 49.5, labelY: 55.0, label: "HOURS" },
  { id: "minutes", centerX: 62.8, digitY: 49.4, labelY: 55.0, label: "MINUTES" },
  { id: "seconds", centerX: 87.2, digitY: 49.3, labelY: 55.0, label: "SECONDS" },
] as const;

export const HOLDING_ROOM_COUNTDOWN_VALUE_CLASS: Record<HoldingRoomCountdownUnitId, string> = {
  days: "holding-room-countdown__value--days",
  hours: "holding-room-countdown__value--hours",
  minutes: "holding-room-countdown__value--minutes",
  seconds: "holding-room-countdown__value--seconds",
};
