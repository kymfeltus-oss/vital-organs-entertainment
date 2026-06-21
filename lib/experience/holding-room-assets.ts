import { MOBILE_ARTBOARD_REF } from "@/lib/responsive";

/** Pre-live holding room — `/public/holding page/holding-room.png` on mobile artboard track. */

export const HOLDING_ROOM_ARTBOARD = MOBILE_ARTBOARD_REF;

/** Native background plate dimensions (853×1844). */
export const HOLDING_ROOM_ART_NATIVE = {
  width: 853,
  height: 1844,
} as const;

export const HOLDING_ROOM_ASSETS = {
  mobileBackground: "/holding page/holding-room.png",
} as const;
