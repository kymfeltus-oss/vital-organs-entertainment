/** Music page — mobile artboard + interactive action targets. */

export const APPLE_MUSIC_SINGLE_URL =
  "https://music.apple.com/us/artist/ian-craig-300/1643247247";

export const MUSIC_ASSETS = {
  mobileBackground: "/music/background%20image%20mobile.png",
} as const;

export const MUSIC_MOBILE_ART = {
  width: 1080,
  height: 1920,
} as const;

export type MusicPageAction = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  left: string;
  top: string;
  width: string;
  height: string;
};

/** Percentage hit targets on the mobile artboard (1080×1920). */
export const MUSIC_PAGE_ACTIONS: readonly MusicPageAction[] = [
  {
    id: "apple-music",
    label: "Purchase on Apple Music",
    href: APPLE_MUSIC_SINGLE_URL,
    external: true,
    left: "14%",
    top: "84.8%",
    width: "72%",
    height: "8.5%",
  },
  {
    id: "vital-seed",
    label: "Sow a Vital Seed",
    href: "/experience/giving",
    left: "4.5%",
    top: "88.4%",
    width: "44%",
    height: "10.5%",
  },
  {
    id: "join-movement",
    label: "Join the Movement",
    href: "/experience/join-movement",
    left: "51.5%",
    top: "88.4%",
    width: "44%",
    height: "10.5%",
  },
] as const;

/** Actions visible on the current mobile single layout (movement cards live on desktop art). */
export const MUSIC_MOBILE_VISIBLE_ACTION_IDS = ["apple-music"] as const;
