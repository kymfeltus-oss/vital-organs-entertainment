import type { NextRequest } from "next/server";
import {
  getActiveLivGeoZones,
  getLivGeoBlockedCountries,
  isLivGeoBypassEnabled,
  isLivGeoFenceEnabled,
} from "@/lib/enterprise/liv-golf/geo/geo-fence-config";
import { isPointInsidePolygon } from "@/lib/enterprise/liv-golf/geo/point-in-polygon";
import type {
  GeoEligibilityResult,
  GeoLocationSample,
} from "@/lib/enterprise/liv-golf/geo/types";

const MAX_ACCURACY_METERS = 500;
const MAX_SAMPLE_AGE_MS = 5 * 60 * 1000;

export type VercelGeoHeaders = {
  country: string | null;
  region: string | null;
  city: string | null;
};

export function resolveVercelGeoHeaders(request: NextRequest | Request): VercelGeoHeaders {
  return {
    country:
      request.headers.get("x-fan-country")?.trim().toUpperCase() ||
      request.headers.get("x-vercel-ip-country")?.trim().toUpperCase() ||
      null,
    region: request.headers.get("x-vercel-ip-country-region")?.trim().toUpperCase() || null,
    city: request.headers.get("x-vercel-ip-city")?.trim() || null,
  };
}

export function isLivGolfComplianceContext(request: NextRequest | Request): boolean {
  const explicit = request.headers.get("x-liv-golf-context")?.trim().toLowerCase();
  if (explicit === "enterprise" || explicit === "liv-golf") return true;

  const referer = request.headers.get("referer")?.toLowerCase() ?? "";
  return referer.includes("/enterprise/liv-golf/");
}

function parseLocationSample(sample: GeoLocationSample): GeoLocationSample | null {
  const lat = sample.lat;
  const lng = sample.lng;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  if (typeof sample.accuracyM === "number") {
    if (!Number.isFinite(sample.accuracyM) || sample.accuracyM > MAX_ACCURACY_METERS) {
      return null;
    }
  }

  if (sample.capturedAt) {
    const capturedMs = Date.parse(sample.capturedAt);
    if (!Number.isFinite(capturedMs) || Date.now() - capturedMs > MAX_SAMPLE_AGE_MS) {
      return null;
    }
  }

  return { lat, lng, accuracyM: sample.accuracyM, capturedAt: sample.capturedAt };
}

function evaluateZones(lat: number, lng: number): {
  matchedAllowZoneId: string | null;
  matchedAllowZoneName: string | null;
  deniedByZoneId: string | null;
} {
  const point: [number, number] = [lng, lat];
  const zones = getActiveLivGeoZones();

  let matchedAllowZoneId: string | null = null;
  let matchedAllowZoneName: string | null = null;
  let deniedByZoneId: string | null = null;

  for (const zone of zones) {
    const inside = isPointInsidePolygon(point, zone.polygon);
    if (!inside) continue;

    if (zone.mode === "deny") {
      deniedByZoneId = zone.id;
      break;
    }

    matchedAllowZoneId = zone.id;
    matchedAllowZoneName = zone.name;
  }

  return { matchedAllowZoneId, matchedAllowZoneName, deniedByZoneId };
}

export function evaluateLivGeoEligibility(
  request: NextRequest | Request,
  sample: GeoLocationSample | null,
): GeoEligibilityResult {
  const geoHeaders = resolveVercelGeoHeaders(request);

  if (!isLivGeoFenceEnabled() || isLivGeoBypassEnabled()) {
    return {
      eligible: true,
      code: "GEO_BYPASS",
      reason: "Geo-fence checks bypassed for this environment.",
      zoneId: null,
      zoneName: null,
      coarseCountry: geoHeaders.country,
      coarseRegion: geoHeaders.region,
    };
  }

  const blockedCountries = getLivGeoBlockedCountries();
  if (geoHeaders.country && blockedCountries.has(geoHeaders.country)) {
    return {
      eligible: false,
      code: "GEO_INELIGIBLE",
      reason: `Prop wagering and token wallet access are unavailable in ${geoHeaders.country}.`,
      zoneId: null,
      zoneName: null,
      coarseCountry: geoHeaders.country,
      coarseRegion: geoHeaders.region,
    };
  }

  const parsed = sample ? parseLocationSample(sample) : null;
  if (!parsed) {
    return {
      eligible: false,
      code: "GEO_UNAVAILABLE",
      reason: "Precise device location is required to verify regional compliance.",
      zoneId: null,
      zoneName: null,
      coarseCountry: geoHeaders.country,
      coarseRegion: geoHeaders.region,
    };
  }

  const zoneResult = evaluateZones(parsed.lat, parsed.lng);

  if (zoneResult.deniedByZoneId) {
    return {
      eligible: false,
      code: "GEO_INELIGIBLE",
      reason: "Your coordinates fall inside a restricted wagering jurisdiction overlay.",
      zoneId: zoneResult.deniedByZoneId,
      zoneName: null,
      coarseCountry: geoHeaders.country,
      coarseRegion: geoHeaders.region,
    };
  }

  const hasAllowZones = getActiveLivGeoZones().some((zone) => zone.mode === "allow");
  if (hasAllowZones && !zoneResult.matchedAllowZoneId) {
    return {
      eligible: false,
      code: "GEO_INELIGIBLE",
      reason: "You are outside the permitted tournament viewing corridor for prop wagering.",
      zoneId: null,
      zoneName: null,
      coarseCountry: geoHeaders.country,
      coarseRegion: geoHeaders.region,
    };
  }

  return {
    eligible: true,
    code: "ELIGIBLE",
    reason: "Location verified for prop module and token wallet access.",
    zoneId: zoneResult.matchedAllowZoneId,
    zoneName: zoneResult.matchedAllowZoneName,
    coarseCountry: geoHeaders.country,
    coarseRegion: geoHeaders.region,
  };
}

export function assertLivGeoEligibleForAction(
  request: NextRequest | Request,
  sample: GeoLocationSample | null,
): GeoEligibilityResult {
  const result = evaluateLivGeoEligibility(request, sample);
  return result;
}
