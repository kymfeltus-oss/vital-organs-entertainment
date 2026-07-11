import { NextResponse } from "next/server";
import { issueGeoAttestationToken } from "@/lib/enterprise/liv-golf/geo/geo-attestation";
import { evaluateLivGeoEligibility } from "@/lib/enterprise/liv-golf/geo/geo-eligibility";
import type { GeoLocationSample } from "@/lib/enterprise/liv-golf/geo/types";

export const dynamic = "force-dynamic";

type GeoCheckBody = {
  lat?: unknown;
  lng?: unknown;
  accuracyM?: unknown;
  capturedAt?: unknown;
};

function parseBody(body: GeoCheckBody): GeoLocationSample | null {
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

/** Edge geolocation compliance check — polygon intersection + coarse IP fallback. */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as GeoCheckBody;
    const sample = parseBody(body);
    const result = evaluateLivGeoEligibility(request, sample);

    const attestationToken =
      result.eligible && sample
        ? issueGeoAttestationToken({
            lat: sample.lat,
            lng: sample.lng,
            zoneId: result.zoneId,
          })
        : null;

    return NextResponse.json({
      ...result,
      attestationToken,
      attestationExpiresInMs: result.eligible ? 10 * 60 * 1000 : null,
    });
  } catch (error) {
    console.error("[enterprise/liv-golf/geo/check] POST failed:", error);
    return NextResponse.json({ error: "Unable to evaluate geo eligibility." }, { status: 500 });
  }
}
