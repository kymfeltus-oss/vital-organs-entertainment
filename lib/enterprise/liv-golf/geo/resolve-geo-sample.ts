import type { NextRequest } from "next/server";
import { resolveEdgeFanGeoHeaders } from "@/lib/enterprise/liv-golf/geo/edge-middleware";
import type { GeoLocationSample } from "@/lib/enterprise/liv-golf/geo/types";

type PlaceBetGeoBody = {
  lat?: unknown;
  lng?: unknown;
  accuracyM?: unknown;
  capturedAt?: unknown;
};

function parseBodyCoordinates(body: PlaceBetGeoBody): GeoLocationSample | null {
  const lat = typeof body.lat === "number" ? body.lat : Number(body.lat);
  const lng = typeof body.lng === "number" ? body.lng : Number(body.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const accuracyM =
    typeof body.accuracyM === "number"
      ? body.accuracyM
      : body.accuracyM === undefined
        ? undefined
        : Number(body.accuracyM);

  const capturedAt =
    typeof body.capturedAt === "string" && body.capturedAt.trim().length > 0
      ? body.capturedAt
      : new Date().toISOString();

  return {
    lat,
    lng,
    accuracyM: Number.isFinite(accuracyM) ? accuracyM : undefined,
    capturedAt,
  };
}

/**
 * Resolve wagering coordinates for strict server enforcement.
 * Prefers device GPS from the request body; falls back to edge CDN headers.
 */
export function resolvePlaceBetGeoSample(
  request: NextRequest,
  body: PlaceBetGeoBody,
): GeoLocationSample | null {
  const deviceSample = parseBodyCoordinates(body);
  if (deviceSample) return deviceSample;

  const edge = resolveEdgeFanGeoHeaders(request);
  if (!edge) return null;

  return {
    lat: edge.lat,
    lng: edge.lng,
    accuracyM: 50_000,
    capturedAt: new Date().toISOString(),
  };
}

export function requireEdgeFanGeoHeaders(
  request: NextRequest,
): { ok: true; edge: NonNullable<ReturnType<typeof resolveEdgeFanGeoHeaders>> } | { ok: false; message: string } {
  const edge = resolveEdgeFanGeoHeaders(request);
  if (!edge) {
    return {
      ok: false,
      message: "Compliance Failure: Missing geofence parameters.",
    };
  }

  return { ok: true, edge };
}
