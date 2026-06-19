/** Music page — mobile artboard + interactive action targets. */

export const APPLE_MUSIC_SINGLE_URL = "https://music.apple.com/";

export const MUSIC_ASSETS = {
  mobileBackground: "/music/background%20image%20mobile.png",
} as const;

export const MUSIC_MOBILE_ART = {
  width: 853,
  height: 1844,
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

/** Percentage hit targets on the mobile artboard (853×1844). */
export const MUSIC_PAGE_ACTIONS: readonly MusicPageAction[] = [
  {
    id: "apple-music",
    label: "Purchase on Apple Music",
    href: APPLE_MUSIC_SINGLE_URL,
    external: true,
    left: "6%",
    top: "86.2%",
    width: "88%",
    height: "9.5%",
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
