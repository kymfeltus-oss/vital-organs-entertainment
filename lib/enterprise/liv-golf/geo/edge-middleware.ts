import type { NextRequest } from "next/server";
import {
  isLivGeoBypassEnabled,
  isLivGeoFenceEnabled,
} from "@/lib/enterprise/liv-golf/geo/geo-fence-config";

export type EdgeFanGeoHeaders = {
  lat: number;
  lng: number;
  country: string;
  source: "vercel-edge" | "middleware-forward";
};

const LIV_WAGERING_EDGE_PATHS = [
  "/api/enterprise/liv-golf/micro-bets/place",
] as const;

export function isLivWageringEdgePath(pathname: string): boolean {
  return LIV_WAGERING_EDGE_PATHS.some((path) => pathname.startsWith(path));
}

function parseCoordinateHeader(value: string | null): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Read CDN edge coordinates injected by middleware (`x-fan-*`) or Vercel (`x-vercel-ip-*`). */
export function resolveEdgeFanGeoHeaders(request: NextRequest | Request): EdgeFanGeoHeaders | null {
  const lat =
    parseCoordinateHeader(request.headers.get("x-fan-lat")) ??
    parseCoordinateHeader(request.headers.get("x-vercel-ip-latitude"));
  const lng =
    parseCoordinateHeader(request.headers.get("x-fan-lng")) ??
    parseCoordinateHeader(request.headers.get("x-vercel-ip-longitude"));

  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  const country =
    request.headers.get("x-fan-country")?.trim().toUpperCase() ||
    request.headers.get("x-vercel-ip-country")?.trim().toUpperCase() ||
    "UNKNOWN";

  const source = request.headers.get("x-fan-lat") ? "middleware-forward" : "vercel-edge";

  return { lat, lng, country, source };
}

export type LivGeoEdgeMiddlewareResult =
  | { action: "skip" }
  | { action: "block"; status: number; body: Record<string, unknown> }
  | { action: "forward"; headers: Headers };

/** Edge network geolocation pass-through for LIV wagering APIs (Next.js 16 `proxy.ts` equivalent of middleware.ts). */
export function resolveLivGeoEdgeMiddleware(request: NextRequest): LivGeoEdgeMiddlewareResult {
  if (!isLivWageringEdgePath(request.nextUrl.pathname)) {
    return { action: "skip" };
  }

  // Read the native Vercel Edge geolocation strings exactly as typed.
  const latitude = request.headers.get("x-vercel-ip-latitude");
  const longitude = request.headers.get("x-vercel-ip-longitude");
  const country = request.headers.get("x-vercel-ip-country");

  console.log(`[Edge Security Check] Country: ${country}, Lat: ${latitude}, Lng: ${longitude}`);

  const headers = new Headers(request.headers);

  if (latitude) headers.set("x-fan-lat", latitude);
  if (longitude) headers.set("x-fan-lng", longitude);
  headers.set("x-fan-country", country?.trim().toUpperCase() || "UNKNOWN");

  if (!isLivGeoFenceEnabled() || isLivGeoBypassEnabled()) {
    return { action: "forward", headers };
  }

  if (!latitude || !longitude || !country) {
    return {
      action: "block",
      status: 403,
      body: {
        error: "Compliance Error: Location telemetry missing.",
      },
    };
  }

  return { action: "forward", headers };
}
