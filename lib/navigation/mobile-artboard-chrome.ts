import { MOBILE_ARTBOARD_BACK_HOTSPOT } from "@/lib/navigation/back-to-dashboard";

export type MobileArtboardChromeRect = {
  left: string;
  top: string;
  width: string;
  height: string;
};

/** Top chrome on 853×1844 artboards — measured from music/giving PNG headers. */
export const MOBILE_ARTBOARD_853_CHROME = {
  back: MOBILE_ARTBOARD_BACK_HOTSPOT,
  profile: {
    left: "76%",
    top: "1.6%",
    width: "9%",
    height: "5.2%",
  },
  menu: {
    left: "89.4%",
    top: "2%",
    width: "6.5%",
    height: "5.2%",
  },
  /** Combined row for flex layout — profile orb + hamburger menu. */
  actions: {
    left: "74%",
    top: "1.5%",
    width: "22%",
    height: "5.5%",
  },
} as const;

/** Top chrome on 1080×1920 artboards — measured from buy-seeds PNG header. */
export const MOBILE_ARTBOARD_1080_CHROME = {
  back: MOBILE_ARTBOARD_BACK_HOTSPOT,
  profile: {
    left: "72.5%",
    top: "1.8%",
    width: "7.3%",
    height: "6.5%",
  },
  menu: {
    left: "83.7%",
    top: "1.8%",
    width: "4.4%",
    height: "6.5%",
  },
  actions: {
    left: "70%",
    top: "1.8%",
    width: "18%",
    height: "6.5%",
  },
} as const;
