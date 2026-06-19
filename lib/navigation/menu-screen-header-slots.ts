import type { CSSProperties } from "react";
import { MOBILE_ARTBOARD_BACK_HOTSPOT } from "@/lib/navigation/back-to-dashboard";

/** Shared 853×1844 menu-screen artboard — matches buy seeds, giving, prayer PNGs. */
export const MENU_HEADER_ARTBOARD = {
  width: 853,
  height: 1844,
} as const;

export type MenuHeaderOverlayRect = {
  left: string;
  top: string;
  width: string;
  height: string;
};

/** Aligns with baked pink chevron on menu-screen PNGs. */
export const MENU_HEADER_BACK_SLOT: MenuHeaderOverlayRect & { label: string } = {
  label: MOBILE_ARTBOARD_BACK_HOTSPOT.label,
  left: MOBILE_ARTBOARD_BACK_HOTSPOT.left,
  top: MOBILE_ARTBOARD_BACK_HOTSPOT.top,
  width: MOBILE_ARTBOARD_BACK_HOTSPOT.width,
  height: MOBILE_ARTBOARD_BACK_HOTSPOT.height,
};

/** Profile orb + hamburger — tuned to baked top-right chrome on menu PNGs. */
export const MENU_HEADER_ACTIONS_SLOT: MenuHeaderOverlayRect = {
  left: "54%",
  top: "1.5%",
  width: "44%",
  height: "7%",
};

export function menuHeaderOverlayRectStyle(rect: MenuHeaderOverlayRect): CSSProperties {
  return {
    position: "absolute",
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}
