/** Routes where global navigation is hidden (full-bleed cinematic / gate flows) */
export const NAV_HIDDEN_ROUTES = [
  "/",
  "/email-gate",
  "/test-suite",
  "/ops",
  "/experience/live",
  "/dashboard/live",
] as const;

/** Exact paths only — event lobby uses its own sidebar + mobile nav */
export const NAV_HIDDEN_EXACT_ROUTES = ["/dashboard", "/experience"] as const;

export type NavHiddenRoute = (typeof NAV_HIDDEN_ROUTES)[number];

export function isNavHiddenRoute(pathname: string): boolean {
  if (NAV_HIDDEN_EXACT_ROUTES.some((route) => pathname === route)) {
    return true;
  }

  return NAV_HIDDEN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
