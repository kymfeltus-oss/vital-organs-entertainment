/** Center anchors on holding-room.png — live digits in empty ring voids (labels stay baked). */

export type HoldingRoomCountdownUnitId = "days" | "hours" | "minutes" | "seconds";

export type HoldingRoomCountdownSlot = {
  id: HoldingRoomCountdownUnitId;
  /** Horizontal center of each ring void (% of artboard width). */
  centerX: number;
  /** Vertical center of digit slot — upper void above baked labels (% of artboard height). */
  centerY: number;
  /** Font-scaling box width (% of artboard width via cqw). */
  sizeCqw: number;
};

/** Measured on holding-room.png ring voids (941×1672 native, top-aligned on 1080×1920 stage). */
export const HOLDING_ROOM_COUNTDOWN_UNITS: readonly HoldingRoomCountdownSlot[] = [
  { id: "days", centerX: 12.4, centerY: 45.9, sizeCqw: 14 },
  { id: "hours", centerX: 37.4, centerY: 45.9, sizeCqw: 14 },
  { id: "minutes", centerX: 62.4, centerY: 45.9, sizeCqw: 14 },
  { id: "seconds", centerX: 87.3, centerY: 45.9, sizeCqw: 14 },
] as const;

export const HOLDING_ROOM_COUNTDOWN_VALUE_CLASS: Record<HoldingRoomCountdownUnitId, string> = {
  days: "holding-room-countdown__value--days",
  hours: "holding-room-countdown__value--hours",
  minutes: "holding-room-countdown__value--minutes",
  seconds: "holding-room-countdown__value--seconds",
};
