import type { GeoFenceZone } from "@/lib/enterprise/liv-golf/geo/types";

/**
 * Tournament geo-fence zones — update polygons as LIV events move between regions.
 * Coordinates are approximate venue corridors (WGS84 lng/lat).
 */
export const LIV_GEO_FENCE_ZONES: readonly GeoFenceZone[] = [
  {
    id: "liv-nashville-2026",
    name: "Nashville Tour Stop — Permitted Corridor",
    mode: "allow",
    enabled: true,
    polygon: [
      [-86.92, 36.08],
      [-86.86, 36.08],
      [-86.86, 36.14],
      [-86.92, 36.14],
      [-86.92, 36.08],
    ],
  },
  {
    id: "liv-riad-2026",
    name: "Riyadh Tour Stop — Permitted Corridor",
    mode: "allow",
    enabled: false,
    polygon: [
      [46.58, 24.68],
      [46.66, 24.68],
      [46.66, 24.74],
      [46.58, 24.74],
      [46.58, 24.68],
    ],
  },
  {
    id: "restricted-wagering-overlay",
    name: "Restricted Wagering Overlay",
    mode: "deny",
    enabled: true,
    polygon: [
      [-115.2, 35.95],
      [-115.1, 35.95],
      [-115.1, 36.05],
      [-115.2, 36.05],
      [-115.2, 35.95],
    ],
  },
] as const;

/** ISO 3166-1 alpha-2 country codes blocked from prop + wallet surfaces. */
export const LIV_GEO_DEFAULT_BLOCKED_COUNTRIES = new Set([
  "AU",
  "CN",
  "SG",
  "AE",
]);

export function getLivGeoBlockedCountries(): Set<string> {
  const fromEnv = process.env.LIV_GEO_BLOCKED_COUNTRY_CODES?.trim();
  if (!fromEnv) return LIV_GEO_DEFAULT_BLOCKED_COUNTRIES;

  return new Set(
    fromEnv
      .split(",")
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean),
  );
}

export function getActiveLivGeoZones(): GeoFenceZone[] {
  return LIV_GEO_FENCE_ZONES.filter((zone) => zone.enabled);
}

export function isLivGeoFenceEnabled(): boolean {
  const flag = process.env.LIV_GEO_FENCE_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return true;
}

export function isLivGeoBypassEnabled(): boolean {
  if (process.env.LIV_GEO_DEV_BYPASS === "true") return true;
  return (
    process.env.NODE_ENV === "test" ||
    process.env.NEXT_PUBLIC_E2E_BYPASS === "true" ||
    process.env.OPS_ADMIN_DEV_BYPASS === "true"
  );
}
