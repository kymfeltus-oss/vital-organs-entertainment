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
  "/prayer",
] as const;

/** Bottom-nav artboard tabs — Live, Giving, Music, Buy Seeds (+ /live holding). */
export function isMobileArtboardTabRoute(pathname: string): boolean {
  return (MOBILE_ARTBOARD_TAB_EXACT as readonly string[]).includes(pathname);
}

/** Full-viewport PNG artboard routes — login, create-account, email-gate. */
export function isFullHeightArtboardRoute(pathname: string): boolean {
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return true;
  }

  if (pathname.includes("create-account")) {
    return true;
  }

  return pathname === "/email-gate" || pathname.startsWith("/email-gate/");
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
