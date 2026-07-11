import { createHmac, timingSafeEqual } from "crypto";
import type { GeoLocationSample } from "@/lib/enterprise/liv-golf/geo/types";

const ATTESTATION_TTL_MS = 10 * 60 * 1000;

type GeoAttestationPayload = {
  lat: number;
  lng: number;
  zoneId: string | null;
  exp: number;
};

function getAttestationSecret(): string {
  const secret = process.env.LIV_GEO_ATTESTATION_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return "liv-geo-dev-attestation-secret";
  }

  throw new Error("LIV_GEO_ATTESTATION_SECRET is required for geo attestation.");
}

function roundCoord(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getAttestationSecret()).update(encodedPayload).digest("base64url");
}

function encodePayload(payload: GeoAttestationPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encodedPayload: string): GeoAttestationPayload | null {
  try {
    const json = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as GeoAttestationPayload;

    if (
      typeof parsed.lat !== "number" ||
      typeof parsed.lng !== "number" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function issueGeoAttestationToken(input: {
  lat: number;
  lng: number;
  zoneId: string | null;
}): string {
  const payload: GeoAttestationPayload = {
    lat: roundCoord(input.lat),
    lng: roundCoord(input.lng),
    zoneId: input.zoneId,
    exp: Date.now() + ATTESTATION_TTL_MS,
  };

  const encoded = encodePayload(payload);
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function verifyGeoAttestationToken(
  token: string | null | undefined,
  sample: GeoLocationSample,
): { ok: true; zoneId: string | null } | { ok: false; reason: string } {
  if (!token?.trim()) {
    return { ok: false, reason: "Missing geo attestation token." };
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return { ok: false, reason: "Malformed geo attestation token." };
  }

  const expected = signPayload(encoded);

  try {
    const expectedBuf = Buffer.from(expected, "utf8");
    const receivedBuf = Buffer.from(signature, "utf8");
    if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
      return { ok: false, reason: "Invalid geo attestation signature." };
    }
  } catch {
    return { ok: false, reason: "Invalid geo attestation signature." };
  }

  const payload = decodePayload(encoded);
  if (!payload) {
    return { ok: false, reason: "Invalid geo attestation payload." };
  }

  if (payload.exp < Date.now()) {
    return { ok: false, reason: "Geo attestation expired — refresh location." };
  }

  const lat = roundCoord(sample.lat);
  const lng = roundCoord(sample.lng);

  if (lat !== payload.lat || lng !== payload.lng) {
    return { ok: false, reason: "Geo attestation does not match submitted coordinates." };
  }

  return { ok: true, zoneId: payload.zoneId };
}
