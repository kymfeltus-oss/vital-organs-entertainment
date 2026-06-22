/** Percentage rects on holding-room.png (926×1698) — label + digit overlays. */

export type HoldingRoomCountdownUnitId = "days" | "hours" | "minutes" | "seconds";

export type HoldingRoomCountdownRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type HoldingRoomCountdownDigitSlot = {
  id: HoldingRoomCountdownUnitId;
  /** Live unit label — masks baked PNG text above each digit column. */
  label: string;
  /** Move label words (DAYS / HOURS / …) — increase `top` to move down. */
  labelMask: HoldingRoomCountdownRect;
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
 * Measured on `public/holding page/holding-room.png` (926×1698).
 * - `labelMask` → moves the unit words (DAYS / HOURS / MINS / SECS)
 * - `valueMask` → moves the live colored 00 digits
 * Keep each labelMask above its valueMask (`labelMask.top + height` ≤ `valueMask.top`).
 */
export const HOLDING_ROOM_COUNTDOWN_UNITS: readonly HoldingRoomCountdownDigitSlot[] = [
  {
    id: "days",
    label: "DAYS",
    /* Baked PNG label ~42.2–43.3% Y — keep above valueMask (48.5). */
    labelMask: { left: 8.4, top: 54.4, width: 13.0, height: 3.5 },
    valueMask: { left: 8.4, top: 48.5, width: 12.8, height: 9.2 },
  },
  {
    id: "hours",
    label: "HOURS",
    labelMask: { left: 31.5, top: 54.4, width: 13.8, height: 4.0 },
    valueMask: { left: 31.5, top: 48.5, width: 13.8, height: 9.0 },
  },
  {
    id: "minutes",
    label: "MINS",
    labelMask: { left: 54.5, top: 54.4, width: 13.8, height: 4.0 },
    valueMask: { left: 54.5, top: 48.5, width: 13.8, height: 9.0 },
  },
  {
    id: "seconds",
    label: "SECS",
    labelMask: { left: 79.2, top: 54.4, width: 13.8, height: 4.0 },
    valueMask: { left: 78.2, top: 48.5, width: 13.8, height: 9.2 },
  },
] as const;

export const HOLDING_ROOM_COUNTDOWN_VALUE_CLASS: Record<HoldingRoomCountdownUnitId, string> = {
  days: "holding-room-countdown__value--days",
  hours: "holding-room-countdown__value--hours",
  minutes: "holding-room-countdown__value--minutes",
  seconds: "holding-room-countdown__value--seconds",
};
