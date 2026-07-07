/** Intro splash — responsive background loops + overlay slots. */

import { MOBILE_ARTBOARD_REF } from "@/lib/responsive";

/** Wide desktop background loop — `public/tenant-default/bg-loop-desktop.mp4`. */
export const INTRO_BG_LOOP_DESKTOP = "/tenant-default/bg-loop-desktop.mp4";

/** Vertical mobile background loop — `public/tenant-default/bg-loop-mobile.mp4`. */
export const INTRO_BG_LOOP_MOBILE = "/tenant-default/bg-loop-mobile.mp4";

/** @deprecated Use INTRO_BG_LOOP_MOBILE / INTRO_BG_LOOP_DESKTOP for cinematic splash. */
export const INTRO_VIDEO_SRC = "/media/intro-mobile.mp4";

/** Cache-bust when replacing `public/media/intro-music.m4a`. */
export const INTRO_MUSIC_ASSET_VERSION = "20260618";

/** Served from `public/media/intro-music.m4a`. */
export const INTRO_MUSIC_SRC = `/media/intro-music.m4a?v=${INTRO_MUSIC_ASSET_VERSION}`;

/** Native intro-mobile.mp4 export (9:16 — same ratio as dashboard track). */
export const INTRO_VIDEO_ART = {
  width: 720,
  height: 1280,
} as const;

/** Stage column width — matches attendee dashboard track. */
export const INTRO_MOBILE_ART = MOBILE_ARTBOARD_REF;

export type IntroLayoutRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** @deprecated Overlay CTA is bottom-anchored in IntroMediaSplash — not percentage-positioned. */
export const INTRO_ENTER_PANEL = {
  left: 10,
  top: 76.5,
  width: 84,
  height: 12.5,
} as const satisfies IntroLayoutRect;
