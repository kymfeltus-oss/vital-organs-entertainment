import { isAttendeeLiveSurfacePath } from "@/lib/experience/live-routes";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";

export const BOTTOM_MENU_BAR_SRC =
  "/bottom-menu-bar/bottom-menu-bar.png?v=1290x250-user-2";

export const BOTTOM_MENU_ARTBOARD = {
  width: 1290,
  height: 250,
} as const;

export type BottomNavItemId =
  | "home"
  | "live"
  | "giving"
  | "music"
  | "buy-seeds";

export type BottomNavHotspot = {
  id: BottomNavItemId;
  label: string;
  href: string;
  left: number;
  width: number;
  isActive: (pathname: string) => boolean;
};

function matchesExact(path: string) {
  return (pathname: string) => pathname === path;
}

function matchesPrefix(path: string) {
  return (pathname: string) =>
    pathname === path || pathname.startsWith(`${path}/`);
}

/** Icon row height at ~390px track; phone safe area is added separately in CSS. */
export const BOTTOM_NAV_BAR_HEIGHT_PX = 76;

const TAB_WIDTH = 100 / 5;

export const BOTTOM_NAV_HOTSPOTS: readonly BottomNavHotspot[] = [
  {
    id: "home",
    label: "Home",
    href: ATTENDEE_DASHBOARD_PATH,
    left: TAB_WIDTH * 0,
    width: TAB_WIDTH,
    isActive: matchesExact(ATTENDEE_DASHBOARD_PATH),
  },
  {
    id: "live",
    label: "Live",
    href: "/live",
    left: TAB_WIDTH * 1,
    width: TAB_WIDTH,
    isActive: isAttendeeLiveSurfacePath,
  },
  {
    id: "giving",
    label: "Giving",
    href: "/giving",
    left: TAB_WIDTH * 2,
    width: TAB_WIDTH,
    isActive: matchesPrefix("/giving"),
  },
  {
    id: "music",
    label: "Music",
    href: "/music",
    left: TAB_WIDTH * 3,
    width: TAB_WIDTH,
    isActive: matchesPrefix("/music"),
  },
  {
    id: "buy-seeds",
    label: "Buy Seeds",
    href: "/buy-seeds",
    left: TAB_WIDTH * 4,
    width: TAB_WIDTH,
    isActive: matchesPrefix("/buy-seeds"),
  },
] as const;
