/** Pre-live holding room — 852×1846 artboard overlays (flat bg + UI frames). */

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
  countdownFrame: "/ui/holding-room-countdown-frame.png",
  datetimeFrame: "/ui/holding-room-datetime-frame.png",
  livePill: "/ui/holding-room-live-pill.png",
} as const;

/** Percentage rects aligned to reserved empty regions on holding-room-bg-mobile.png. */
export const HOLDING_ROOM_OVERLAY_SLOTS = {
  countdown: {
    left: 0.11,
    top: 0.275,
    width: 0.78,
    height: 0.145,
  },
  livePill: {
    left: 0.22,
    top: 0.662,
    width: 0.56,
    height: 0.045,
  },
  datetime: {
    left: 0.11,
    top: 0.852,
    width: 0.78,
    height: 0.088,
  },
} as const;

/** Inner inset for dynamic text inside frame overlays (ratio of slot). */
export const HOLDING_ROOM_FRAME_INSET = {
  countdown: { x: 0.08, y: 0.18, w: 0.84, h: 0.64 },
  datetime: { x: 0.08, y: 0.22, w: 0.84, h: 0.56 },
} as const;
