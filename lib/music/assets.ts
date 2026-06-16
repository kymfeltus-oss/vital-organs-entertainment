/** Music tab background plates (`/public/music/`). */

export const APPLE_MUSIC_SINGLE_URL = "https://music.apple.com/";

export const MUSIC_ASSETS = {
  desktopBackground: "/music/background image.png",
  mobileBackground: "/music/background image mobile.png",
  appleMusicHeader: "/music/Apple Music Download Header.png",
} as const;

export const MUSIC_APPLE_HEADER_ART = {
  width: 1446,
  height: 383,
} as const;

export const MUSIC_DESKTOP_ART = {
  width: 1024,
  height: 1536,
} as const;

export const MUSIC_MOBILE_ART = {
  width: 853,
  height: 1844,
} as const;

export type MusicOverlayVariant = "desktop" | "mobile";

export const MUSIC_APPLE_HEADER_POSITIONS = {
  desktop: {
    left: "75%",
    top: "34.6%",
    width: "50%",
    height: "8.8%",
    transform: "translateX(-50%)",
  },
  mobile: {
    left: "50%",
    top: "35.8%",
    width: "88%",
    height: "7.4%",
    transform: "translateX(-50%)",
  },
} as const;

export const MUSIC_MOVEMENT_CARD_POSITIONS = {
  desktop: [
    {
      label: "Sow a Vital Seed",
      href: "/experience/giving",
      left: "4.5%",
      top: "85.2%",
      width: "44%",
      height: "11.5%",
    },
    {
      label: "Join the Movement",
      href: "/experience/join-movement",
      left: "51.5%",
      top: "85.2%",
      width: "44%",
      height: "11.5%",
    },
  ],
  mobile: [
    {
      label: "Sow a Vital Seed",
      href: "/experience/giving",
      left: "4.5%",
      top: "88.4%",
      width: "44%",
      height: "10.5%",
    },
    {
      label: "Join the Movement",
      href: "/experience/join-movement",
      left: "51.5%",
      top: "88.4%",
      width: "44%",
      height: "10.5%",
    },
  ],
} as const;
