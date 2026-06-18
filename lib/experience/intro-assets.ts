/** Intro splash — mobile video plate + overlay slots. */

export const INTRO_VIDEO_SRC = "/intro%20mobile.mp4";
/** Served from `public/intro-music.m4a`. */
export const INTRO_MUSIC_SRC = "/intro-music.m4a";

/** Fallback until video metadata loads — updated from `videoWidth` / `videoHeight`. */
export const INTRO_MOBILE_ART = {
  width: 1080,
  height: 1920,
} as const;

export type IntroLayoutRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Enter CTA aligned to intro mobile.mp4 art (tune if export shifts). */
export const INTRO_ENTER_PANEL = {
  left: 8,
  top: 69.5,
  width: 84,
  height: 12,
} as const satisfies IntroLayoutRect;
