/**
 * Bottom dock PNG artboard + five equal hotspot columns.
 *
 * USER-OWNED ASSET: `public/bottom-menu-bar/bottom-menu-bar.png`
 * Sync width/height + ?v= cache bust only when the user replaces the file.
 * Never crop, resize, git-show, or python-process that PNG.
 */

export const BOTTOM_MENU_BAR_SRC =
  "/bottom-menu-bar/bottom-menu-bar.png?v=1756x896-user-1";

export const BOTTOM_MENU_ARTBOARD = {
  width: 1756,
  height: 896,
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
  /** Percentage rect on the PNG artboard (0–100). */
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

/** Page padding fallback — proportional dock height at ~390px track (1756×896 art). */
export const BOTTOM_NAV_BAR_HEIGHT_PX = 199;

const TAB_WIDTH = 100 / 5;

export const BOTTOM_NAV_HOTSPOTS: readonly BottomNavHotspot[] = [
  {
    id: "home",
    label: "Home",
    href: "/experience",
    left: TAB_WIDTH * 0,
    width: TAB_WIDTH,
    isActive: matchesExact("/experience"),
  },
  {
    id: "live",
    label: "Live",
    href: "/live",
    left: TAB_WIDTH * 1,
    width: TAB_WIDTH,
    isActive: matchesPrefix("/live"),
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
