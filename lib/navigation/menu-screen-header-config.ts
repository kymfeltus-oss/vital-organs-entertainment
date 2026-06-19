const MENU_HEADER_ON_ROUTES = new Set([
  "/buy-seeds",
  "/giving",
  "/live",
  "/prayer",
]);

const MENU_HEADER_OFF_ROUTES = new Set(["/experience", "/music"]);

/** Routes where the PNG bakes the stylized title + divider — hide React center text. */
const MENU_HEADER_BAKED_TITLE_ROUTES = new Set([
  "/buy-seeds",
  "/giving",
  "/live",
  "/prayer",
]);

const MENU_HEADER_TITLES: Record<string, string> = {
  "/buy-seeds": "Buy Seeds",
  "/giving": "Giving",
  "/live": "Live",
  "/prayer": "Prayer",
};

/** Menu-screen top header — ON for bottom-nav artboard tabs; OFF for locked home/music. */
export function isMenuScreenHeaderRoute(pathname: string): boolean {
  if (MENU_HEADER_OFF_ROUTES.has(pathname)) return false;
  return MENU_HEADER_ON_ROUTES.has(pathname);
}

export function getMenuScreenHeaderTitle(pathname: string): string {
  return MENU_HEADER_TITLES[pathname] ?? "";
}

/** True when the route PNG already renders the page title (no React duplicate). */
export function menuHeaderUsesBakedTitleArt(pathname: string): boolean {
  return MENU_HEADER_BAKED_TITLE_ROUTES.has(pathname);
}

export function shouldShowMenuHeaderTitle(pathname: string): boolean {
  return isMenuScreenHeaderRoute(pathname) && !menuHeaderUsesBakedTitleArt(pathname);
}
