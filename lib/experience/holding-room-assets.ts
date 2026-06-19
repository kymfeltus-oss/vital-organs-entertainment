/** Pre-live holding room — flat background artboard + pure-code dynamic content slots. */

export const HOLDING_ROOM_ARTBOARD = {
  width: 852,
  height: 1846,
} as const;

export const HOLDING_ROOM_SAFE_AREA = {
  top: 60,
  right: 40,
  bottom: 60,
  left: 40,
} as const;

export const HOLDING_ROOM_ASSETS = {
  mobileBackground: "/experience/holding-room-bg-mobile.png",
} as const;

/** Percentage rects aligned to reserved empty regions on holding-room-bg-mobile.png. */
export const HOLDING_ROOM_CONTENT_SLOTS = {
  countdown: {
    left: 0.11,
    top: 0.495,
    width: 0.78,
    height: 0.105,
  },
} as const;

/** Inner inset for dynamic text inside baked neon frame regions (ratio of slot). */
export const HOLDING_ROOM_CONTENT_INSET = {
  countdown: { x: 0.06, y: 0.12, w: 0.88, h: 0.76 },
} as const;
