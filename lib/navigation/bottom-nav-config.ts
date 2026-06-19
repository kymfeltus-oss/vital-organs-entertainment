/** Bottom menu PNG artboard — hotspot rects are percentage-based on full image. */
export const BOTTOM_MENU_BAR_SRC =
  "/bottom-menu-bar/bottom-menu-bar.png?v=single-layer-2";

export const BOTTOM_MENU_ARTBOARD = {
  width: 1290,
  height: 192,
} as const;

export type BottomNavItemId =
  | "home"
  | "live"
  | "giving"
  | "music"
  | "prayer"
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
  return (pathname: string) => pathname === path || pathname.startsWith(`${path}/`);
}

/** Full-width capsule on 1290×192 banner (see build-bottom-nav-canvas.py + meta.json). */
export const BOTTOM_NAV_PILL_INSET = {
  left: 0,
  width: 100,
} as const;

/** Six equal columns across the full-width capsule. */
const COLUMN_WIDTH = BOTTOM_NAV_PILL_INSET.width / 6;

export const BOTTOM_NAV_HOTSPOTS: readonly BottomNavHotspot[] = [
  {
    id: "home",
    label: "Home",
    href: "/experience",
    left: BOTTOM_NAV_PILL_INSET.left + COLUMN_WIDTH * 0,
    width: COLUMN_WIDTH,
    isActive: matchesExact("/experience"),
  },
  {
    id: "live",
    label: "Live",
    href: "/live",
    left: BOTTOM_NAV_PILL_INSET.left + COLUMN_WIDTH * 1,
    width: COLUMN_WIDTH,
    isActive: matchesPrefix("/live"),
  },
  {
    id: "giving",
    label: "Giving",
    href: "/giving",
    left: BOTTOM_NAV_PILL_INSET.left + COLUMN_WIDTH * 2,
    width: COLUMN_WIDTH,
    isActive: matchesPrefix("/giving"),
  },
  {
    id: "music",
    label: "Music",
    href: "/music",
    left: BOTTOM_NAV_PILL_INSET.left + COLUMN_WIDTH * 3,
    width: COLUMN_WIDTH,
    isActive: matchesPrefix("/music"),
  },
  {
    id: "prayer",
    label: "Prayer",
    href: "/prayer",
    left: BOTTOM_NAV_PILL_INSET.left + COLUMN_WIDTH * 4,
    width: COLUMN_WIDTH,
    isActive: matchesPrefix("/prayer"),
  },
  {
    id: "buy-seeds",
    label: "Buy Seeds",
    href: "/buy-seeds",
    left: BOTTOM_NAV_PILL_INSET.left + COLUMN_WIDTH * 5,
    width: COLUMN_WIDTH,
    isActive: matchesPrefix("/buy-seeds"),
  },
] as const;
