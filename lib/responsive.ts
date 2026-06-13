/** Shared responsive layout tokens for 300 Awakening */

/** Effect tier utility classes — pair with globals.css `.effects-heavy` / `.effects-lite` */
export const EFFECTS_TIER = {
  heavy: "effects-heavy",
  lite: "effects-lite",
} as const;

export const SHELL = {
  mobile: "app-shell",
  wide: "app-shell-wide",
  full: "app-shell-full",
} as const;

export type ShellVariant = keyof typeof SHELL;

/** Fluid shell width classes — edge-to-edge, no phone-frame caps */
export const SHELL_MAX_CLASS: Record<ShellVariant, string> = {
  mobile: "w-full px-4",
  wide: "w-full px-6",
  full: "w-full px-8",
};

/** Standard 12-column page grid for desktop multi-column layouts */
export const PAGE_GRID =
  "grid w-full grid-cols-1 gap-4 md:grid-cols-12 md:gap-6";

/** Locks immersive shells to the dynamic viewport (mobile browser chrome safe) */
export const DEVICE_FIT_VIEWPORT =
  "h-dvh max-h-dvh min-h-0 w-full max-w-[100vw] overflow-hidden";

/** Standard page root — full device width, at least one viewport tall */
export const DEVICE_FIT_PAGE =
  "min-h-dvh w-full max-w-[100vw] overflow-x-hidden";

/** Scrollable main column inside a full-height device-fit grid */
export const DEVICE_FIT_SCROLL =
  "min-h-0 h-dvh max-h-dvh overflow-y-auto overflow-x-hidden";

/** Event lobby grid — fluid side rails from tablet landscape up */
export const LOBBY_GRID =
  "grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(14rem,260px)_minmax(0,1fr)_minmax(16rem,360px)]";

/** Content offset when global navigation is present (root layout) */
export const CONTENT_WITH_NAV = "pb-16 md:pb-0 md:pl-64";

/** Left sidebar width on desktop (matches navigation w-64) */
export const NAV_SIDEBAR_WIDTH = "16rem";

/** Dashboard card grid — scales with viewport */
export const CARD_GRID_DASHBOARD =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";

/** General responsive card grid */
export const CARD_GRID_RESPONSIVE =
  "grid grid-cols-1 gap-[clamp(0.5rem,2vw,1rem)] sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export function getParticleBudget(width: number, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  if (width < 480) return 50;
  if (width < 1024) return 90;
  return 130;
}
