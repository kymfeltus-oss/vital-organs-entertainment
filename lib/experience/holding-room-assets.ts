import { MOBILE_ARTBOARD_REF } from "@/lib/responsive";

/** Pre-live holding room — `/public/holding page/holding-room.png` on mobile artboard track. */

export const HOLDING_ROOM_ARTBOARD = MOBILE_ARTBOARD_REF;

/** Native PNG plate — same 1080×1920 stage as attendee dashboard. */
export const HOLDING_ROOM_ART_NATIVE = MOBILE_ARTBOARD_REF;

export const HOLDING_ROOM_ASSETS = {
  mobileBackground: "/holding page/holding-room.png",
} as const;
