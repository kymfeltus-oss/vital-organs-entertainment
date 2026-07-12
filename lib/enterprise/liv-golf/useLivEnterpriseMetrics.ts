"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import type { LivEnterpriseMetricsPayload } from "@/lib/enterprise/liv-golf/aggregate-liv-enterprise-metrics";
import {
  mapPublicMetricsToCommandCenterPayload,
  type LivPublicMetricsApiResponse,
} from "@/lib/enterprise/liv-golf/metrics-gateway";
import { useLiveViewerCount } from "@/lib/features/live/useLiveViewerCount";
import {
  LIV_MICRO_BET_LAUNCH_EVENT,
  STREAM_GRAPHICS_SYNC_EVENT,
} from "@/lib/live/types";
import {
  acquirePlatformChannel,
  commitPlatformChannelSubscribe,
  registerPlatformListener,
  releasePlatformChannel,
  unregisterPlatformListener,
} from "@/lib/live/platform-channel";
import { getSupabase } from "@/lib/supabase/client";

const POLL_MS = 8_000;
const METRICS_LISTENER_ID = "liv-enterprise-metrics-sync";

type MetricsApiError = {
  error?: string;
};

export function useLivEnterpriseMetrics() {
  const { displayLabel, actualCount, displayCount } = useLiveViewerCount({
    enabled: true,
    applyDisplayBuffer: false,
  });

  const [metrics, setMetrics] = useState<LivEnterpriseMetricsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const response = await fetch(`${getClientAppUrl()}/api/enterprise/liv-golf/metrics`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as MetricsApiError;
        setError(payload.error ?? `Unable to load enterprise metrics (${response.status}).`);
        return;
      }

      const data = (await response.json()) as LivPublicMetricsApiResponse;
      setMetrics(mapPublicMetricsToCommandCenterPayload(data));
      setError(data.success ? null : (data.error ?? "Metrics running on structural default template."));
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Enterprise metrics refresh failed.",
      );
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const poll = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;

    try {
      supabase = getSupabase();
    } catch {
      return () => window.clearInterval(poll);
    }

    acquirePlatformChannel(supabase);
    registerPlatformListener(METRICS_LISTENER_ID, (channel) =>
      channel
        .on("broadcast", { event: LIV_MICRO_BET_LAUNCH_EVENT }, () => {
          if (!cancelled) void refresh();
        })
        .on("broadcast", { event: STREAM_GRAPHICS_SYNC_EVENT }, () => {
          if (!cancelled) void refresh();
        }),
    );
    commitPlatformChannelSubscribe();

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      unregisterPlatformListener(METRICS_LISTENER_ID);
      releasePlatformChannel(supabase);
    };
  }, [refresh]);

  return {
    metrics,
    isLoading,
    error,
    liveViewersLabel: displayLabel,
    liveViewersCount: displayCount,
    liveViewersActual: actualCount,
    refresh,
  };
}
