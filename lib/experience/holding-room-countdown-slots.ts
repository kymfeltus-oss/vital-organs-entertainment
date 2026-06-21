/** Percentage slots on holding-room.png — one flex column per neon ring. */

export type HoldingRoomCountdownUnitId = "days" | "hours" | "minutes" | "seconds";

/** Center-anchored ring — overlay uses translate(-50%, -50%). */
export type HoldingRoomCountdownRing = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};

export type HoldingRoomCountdownUnit = {
  id: HoldingRoomCountdownUnitId;
  label: string;
  ring: HoldingRoomCountdownRing;
};

/** PNG (926×1698) is height-fit inside the 1080×1920 stage with side letterbox. */
const STAGE_PNG_WIDTH_RATIO = (926 * 1920) / (1698 * 1080);
const STAGE_PNG_X_OFFSET = ((1 - STAGE_PNG_WIDTH_RATIO) / 2) * 100;

export function holdingRoomStageX(pngPercentX: number): number {
  return STAGE_PNG_X_OFFSET + pngPercentX * STAGE_PNG_WIDTH_RATIO;
}

function ringSlot(
  pngX: number,
  pngY: number,
  width: number,
  height: number,
): HoldingRoomCountdownRing {
  return {
    centerX: holdingRoomStageX(pngX),
    centerY: pngY,
    width,
    height,
  };
}

/** Measured ring interiors on holding-room.png (band ~40%–58% Y). */
export const HOLDING_ROOM_COUNTDOWN_UNITS: readonly HoldingRoomCountdownUnit[] = [
  { id: "days", label: "DAYS", ring: ringSlot(14.7, 48.94, 12, 17.5) },
  { id: "hours", label: "HOURS", ring: ringSlot(36.4, 48.94, 12, 17.5) },
  { id: "minutes", label: "MINS", ring: ringSlot(59.9, 48.94, 12, 17.5) },
  { id: "seconds", label: "SECS", ring: ringSlot(82.9, 48.94, 12, 17.5) },
] as const;

export const HOLDING_ROOM_COUNTDOWN_VALUE_CLASS: Record<HoldingRoomCountdownUnitId, string> = {
  days: "holding-room-countdown__value--days",
  hours: "holding-room-countdown__value--hours",
  minutes: "holding-room-countdown__value--minutes",
  seconds: "holding-room-countdown__value--seconds",
};

export const HOLDING_ROOM_COUNTDOWN_LABEL_CLASS: Record<HoldingRoomCountdownUnitId, string> = {
  days: "holding-room-countdown__label--days",
  hours: "holding-room-countdown__label--hours",
  minutes: "holding-room-countdown__label--minutes",
  seconds: "holding-room-countdown__label--seconds",
};
