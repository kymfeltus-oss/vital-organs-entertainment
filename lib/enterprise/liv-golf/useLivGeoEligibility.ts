"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import type { GeoEligibilityResult } from "@/lib/enterprise/liv-golf/geo/types";

type GeoCheckApiResponse = GeoEligibilityResult & {
  attestationToken?: string | null;
  attestationExpiresInMs?: number | null;
  error?: string;
};

export type LivGeoEligibilityState = {
  status: "idle" | "locating" | "checking" | "eligible" | "ineligible" | "unavailable" | "unsupported";
  result: GeoEligibilityResult | null;
  attestationToken: string | null;
  sample: { lat: number; lng: number } | null;
  error: string | null;
  refresh: () => Promise<void>;
};

type UseLivGeoEligibilityOptions = {
  /** Run location capture when enabled (e.g. when bet panel opens). */
  enabled?: boolean;
};

export function useLivGeoEligibility({
  enabled = true,
}: UseLivGeoEligibilityOptions = {}): LivGeoEligibilityState {
  const [status, setStatus] = useState<LivGeoEligibilityState["status"]>("idle");
  const [result, setResult] = useState<GeoEligibilityResult | null>(null);
  const [attestationToken, setAttestationToken] = useState<string | null>(null);
  const [sample, setSample] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled || inFlightRef.current) return;
    inFlightRef.current = true;
    setError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      setResult(null);
      setAttestationToken(null);
      setSample(null);
      setError("Device geolocation is not supported in this browser.");
      inFlightRef.current = false;
      return;
    }

    setStatus("locating");

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12_000,
          maximumAge: 30_000,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const capturedAt = new Date(position.timestamp).toISOString();
      const accuracyM = position.coords.accuracy;

      setStatus("checking");
      setSample({ lat, lng });

      const response = await fetch(`${getClientAppUrl()}/api/enterprise/liv-golf/geo/check`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, accuracyM, capturedAt }),
      });

      const payload = (await response.json().catch(() => ({}))) as GeoCheckApiResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? `Geo check failed (${response.status}).`);
      }

      setResult(payload);
      setAttestationToken(payload.attestationToken ?? null);
      setStatus(payload.eligible ? "eligible" : payload.code === "GEO_UNAVAILABLE" ? "unavailable" : "ineligible");
    } catch (geoError) {
      const message =
        geoError instanceof GeolocationPositionError
          ? geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission is required for regional compliance."
            : "Unable to resolve device coordinates."
          : geoError instanceof Error
            ? geoError.message
            : "Geo compliance check failed.";

      setStatus("unavailable");
      setResult(null);
      setAttestationToken(null);
      setError(message);
    } finally {
      inFlightRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    void refresh();
  }, [enabled, refresh]);

  return {
    status,
    result,
    attestationToken,
    sample,
    error,
    refresh,
  };
}
