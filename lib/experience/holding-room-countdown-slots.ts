/** Percentage rects on holding-room.png (926×1698) — digit overlays only. */

export type HoldingRoomCountdownUnitId = "days" | "hours" | "minutes" | "seconds";

export type HoldingRoomCountdownRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type HoldingRoomCountdownDigitSlot = {
  id: HoldingRoomCountdownUnitId;
  /** Masks baked placeholder digits — live "00" is flex-centered inside this box. */
  valueMask: HoldingRoomCountdownRect;
};

/**
 * PNG is height-fit inside the 1080×1920 stage (top-aligned, side letterbox).
 * Map PNG percentage coords → overlay percentage coords on the art-fit box.
 */
export const HOLDING_ROOM_PNG_STAGE = {
  widthRatio: (926 * 1920) / (1698 * 1080),
  xOffset: ((1 - (926 * 1920) / (1698 * 1080)) / 2) * 100,
} as const;

export function holdingRoomStageX(pngPercentX: number): number {
  return HOLDING_ROOM_PNG_STAGE.xOffset + pngPercentX * HOLDING_ROOM_PNG_STAGE.widthRatio;
}

/** Height-fit plate — PNG Y maps 1:1 to the stage art-fit box. */
export function holdingRoomStageY(pngPercentY: number): number {
  return pngPercentY;
}

export function holdingRoomStageRect(rect: HoldingRoomCountdownRect): HoldingRoomCountdownRect {
  return {
    left: holdingRoomStageX(rect.left),
    top: holdingRoomStageY(rect.top),
    width: rect.width * HOLDING_ROOM_PNG_STAGE.widthRatio,
    height: rect.height,
  };
}

/**
 * Baked DAYS / HOURS / MINS / SECS labels stay on the PNG.
 * Only center digits are masked and replaced with live values.
 *
 * Measured on `public/holding page/holding-room.png` (926×1698).
 * To move the clock down, increase `top` on each `valueMask`.
 */
export const HOLDING_ROOM_COUNTDOWN_UNITS: readonly HoldingRoomCountdownDigitSlot[] = [
  { id: "days", valueMask: { left: 9.4, top: 41.2, width: 12.8, height: 9.2 } },
  { id: "hours", valueMask: { left: 29.2, top: 41.5, width: 13.8, height: 9.0 } },
  { id: "minutes", valueMask: { left: 52.6, top: 41.5, width: 13.8, height: 9.0 } },
  { id: "seconds", valueMask: { left: 75.8, top: 41.2, width: 13.8, height: 9.2 } },
] as const;

export const HOLDING_ROOM_COUNTDOWN_VALUE_CLASS: Record<HoldingRoomCountdownUnitId, string> = {
  days: "holding-room-countdown__value--days",
  hours: "holding-room-countdown__value--hours",
  minutes: "holding-room-countdown__value--minutes",
  seconds: "holding-room-countdown__value--seconds",
};
