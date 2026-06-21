/** Routes where global navigation is hidden (full-bleed cinematic / gate / live flows). */

const NAV_HIDDEN_EXACT = [
  "/",
  "/intro",
  "/login",
  "/create-account",
  "/test-suite",
] as const;

const NAV_HIDDEN_PREFIXES = [
  "/intro/",
  "/login/",
  "/create-account/",
  "/live",
  "/watch",
  "/stream",
  "/studio",
  "/ops",
  "/email-gate",
  "/experience/live",
  "/dashboard/live",
] as const;

function matchesHiddenPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

const MOBILE_ARTBOARD_TAB_EXACT = [
  "/music",
  "/giving",
  "/experience/giving",
  "/buy-seeds",
  "/live",
] as const;

/** Bottom-nav artboard tabs — Live, Giving, Music, Buy Seeds (+ /live holding). */
export function isMobileArtboardTabRoute(pathname: string): boolean {
  return (MOBILE_ARTBOARD_TAB_EXACT as readonly string[]).includes(pathname);
}

export function isNavHiddenRoute(pathname: string): boolean {
  if ((NAV_HIDDEN_EXACT as readonly string[]).includes(pathname)) {
    return true;
  }

  if (pathname.includes("/create-account")) {
    return true;
  }

  return NAV_HIDDEN_PREFIXES.some((prefix) => matchesHiddenPrefix(pathname, prefix));
}

/** @deprecated Use isNavHiddenRoute — kept for existing imports. */
export type NavHiddenRoute = string;
