/** Canonical production host for LIV Golf enterprise surfaces on PARABLE. */
export const LIV_GOLF_PRODUCTION_HOST = "parablestream.com";

export const LIV_GOLF_PRODUCTION_ORIGIN = `https://${LIV_GOLF_PRODUCTION_HOST}`;

export const LIV_GOLF_ROUTES = {
  landing: "/enterprise/liv-golf",
  live: "/enterprise/liv-golf/live",
  studio: "/enterprise/liv-golf/studio",
  commandCenter: "/enterprise/liv-golf/command-center",
} as const;

export function livGolfProductionUrl(path: keyof typeof LIV_GOLF_ROUTES): string {
  return `${LIV_GOLF_PRODUCTION_ORIGIN}${LIV_GOLF_ROUTES[path]}`;
}
