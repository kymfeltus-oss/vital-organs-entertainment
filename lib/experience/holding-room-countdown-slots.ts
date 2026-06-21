/** Percentage rects on holding-room.png (1080×1920) — neon ring countdown row. */

export type HoldingRoomCountdownUnitId = "days" | "hours" | "minutes" | "seconds";

export type HoldingRoomCountdownSlot = {
  id: HoldingRoomCountdownUnitId;
  /** Masks baked placeholder digits in the PNG. */
  valueMask: { left: number; top: number; width: number; height: number };
  /** Live countdown digit overlay — centered in each ring. */
  value: { left: number; top: number; width: number; height: number };
};

/** Baked labels (DAYS / HOURS / …) stay on the PNG — only digits are replaced. */
export const HOLDING_ROOM_COUNTDOWN_UNITS: readonly HoldingRoomCountdownSlot[] = [
  {
    id: "days",
    valueMask: { left: 7.5, top: 44.2, width: 17.5, height: 7.2 },
    value: { left: 8.5, top: 44.6, width: 15.5, height: 6.4 },
  },
  {
    id: "hours",
    valueMask: { left: 29.5, top: 44.2, width: 17.5, height: 7.2 },
    value: { left: 30.5, top: 44.6, width: 15.5, height: 6.4 },
  },
  {
    id: "minutes",
    valueMask: { left: 51.5, top: 44.2, width: 17.5, height: 7.2 },
    value: { left: 52.5, top: 44.6, width: 15.5, height: 6.4 },
  },
  {
    id: "seconds",
    valueMask: { left: 73.5, top: 44.2, width: 17.5, height: 7.2 },
    value: { left: 74.5, top: 44.6, width: 15.5, height: 6.4 },
  },
] as const;

export const HOLDING_ROOM_COUNTDOWN_VALUE_CLASS: Record<HoldingRoomCountdownUnitId, string> = {
  days: "holding-room-countdown__value--days",
  hours: "holding-room-countdown__value--hours",
  minutes: "holding-room-countdown__value--minutes",
  seconds: "holding-room-countdown__value--seconds",
};
