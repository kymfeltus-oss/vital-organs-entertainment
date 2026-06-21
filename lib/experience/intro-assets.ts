/** Intro splash — mobile video plate + overlay slots. */

export const INTRO_VIDEO_SRC = "/intro%20mobile.mp4";
/** Served from `public/intro-music.m4a`. */
export const INTRO_MUSIC_SRC = "/intro-music.m4a";

/** Fallback until video metadata loads — updated from `videoWidth` / `videoHeight`. */
export const INTRO_MOBILE_ART = {
  width: 720,
  height: 1280,
} as const;

export type IntroLayoutRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Enter CTA aligned to intro mobile.mp4 art (720×1280 export). */
export const INTRO_ENTER_PANEL = {
  left: 10,
  top: 76.5,
  width: 84,
  height: 12.5,
} as const satisfies IntroLayoutRect;

/** Hides baked “AWAKENING POSSIBILITIES…” footer strip on intro mobile.mp4. */
export const INTRO_FOOTER_TAGLINE_MASK = {
  left: 0,
  top: 91,
  width: 100,
  height: 9,
} as const satisfies IntroLayoutRect;
