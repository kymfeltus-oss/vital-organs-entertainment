/** WGS84 coordinate — [longitude, latitude] per GeoJSON convention. */
export type GeoCoordinate = readonly [longitude: number, latitude: number];

export type GeoFenceZoneMode = "allow" | "deny";

export type GeoFenceZone = {
  id: string;
  name: string;
  mode: GeoFenceZoneMode;
  /** Closed ring — first and last vertex should match. */
  polygon: readonly GeoCoordinate[];
  enabled: boolean;
};

export type GeoLocationSample = {
  lat: number;
  lng: number;
  accuracyM?: number;
  capturedAt?: string;
};

export type GeoEligibilityResult = {
  eligible: boolean;
  code: "ELIGIBLE" | "GEO_INELIGIBLE" | "GEO_UNAVAILABLE" | "GEO_BYPASS";
  reason: string;
  zoneId: string | null;
  zoneName: string | null;
  coarseCountry: string | null;
  coarseRegion: string | null;
};

export const GEO_INELIGIBLE_CODE = "GEO_INELIGIBLE" as const;
