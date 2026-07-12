"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import {
  DEFAULT_CRITICAL_LIABILITY_TOKENS,
  DEFAULT_CRITICAL_RATIO_THRESHOLD,
  evaluateRiskThreshold,
  type BetPoolExposureRow,
  type RiskThresholdAlert,
} from "@/lib/enterprise/liv-golf/risk-threshold";
import { PRODUCTION_RISK_WARNING_EVENT } from "@/lib/live/types";
import {
  acquirePlatformChannel,
  commitPlatformChannelSubscribe,
  registerPlatformListener,
  releasePlatformChannel,
  unregisterPlatformListener,
} from "@/lib/live/platform-channel";
import { getSupabase } from "@/lib/supabase/client";

const RISK_TELEMETRY_LISTENER_PREFIX = "liv-risk-telemetry";

export type RiskExposureMetrics = {
  bet_id: string;
  yes_ticket_count: number;
  no_ticket_count: number;
  total_token_risk: number;
  max_liability_payout: number;
  updated_at: string;
};

type RiskExposureApiResponse = {
  metrics?: BetPoolExposureRow[];
  alerts?: RiskThresholdAlert[];
  error?: string;
};

function mapExposureRow(row: BetPoolExposureRow): RiskExposureMetrics {
  return {
    bet_id: row.bet_id,
    yes_ticket_count: row.total_yes_tickets,
    no_ticket_count: row.total_no_tickets,
    total_token_risk: row.total_token_risk,
    max_liability_payout: row.max_liability_payout,
    updated_at: row.updated_at,
  };
}

export function useRiskTelemetry(
  roomId: string,
  activeBetId?: string | null,
  criticalRatioThreshold = DEFAULT_CRITICAL_RATIO_THRESHOLD,
  criticalLiabilityTokens = DEFAULT_CRITICAL_LIABILITY_TOKENS,
) {
  const instanceId = useId();
  const listenerId = `${RISK_TELEMETRY_LISTENER_PREFIX}${instanceId}`;
  const [metricsByBetId, setMetricsByBetId] = useState<Map<string, RiskExposureMetrics>>(new Map());
  const [activeAlerts, setActiveAlerts] = useState<Map<string, RiskThresholdAlert>>(new Map());

  const upsertMetricRow = useCallback((row: BetPoolExposureRow) => {
    setMetricsByBetId((prev) => {
      const next = new Map(prev);
      next.set(row.bet_id, mapExposureRow(row));
      return next;
    });

    const alert = evaluateRiskThreshold(row, criticalRatioThreshold, criticalLiabilityTokens);
    setActiveAlerts((prev) => {
      const next = new Map(prev);
      if (alert) {
        next.set(row.bet_id, alert);
      } else {
        next.delete(row.bet_id);
      }
      return next;
    });
  }, [criticalLiabilityTokens, criticalRatioThreshold]);

  const refreshMetrics = useCallback(async () => {
    try {
      const response = await fetch(
        `${getClientAppUrl()}/api/enterprise/liv-golf/risk-exposure?roomId=${encodeURIComponent(roomId)}`,
        { cache: "no-store", credentials: "include" },
      );

      if (!response.ok) return;

      const payload = (await response.json()) as RiskExposureApiResponse;
      const metrics = payload.metrics ?? [];

      setMetricsByBetId(() => {
        const next = new Map<string, RiskExposureMetrics>();
        metrics.forEach((row) => next.set(row.bet_id, mapExposureRow(row)));
        return next;
      });

      setActiveAlerts(() => {
        const next = new Map<string, RiskThresholdAlert>();
        metrics.forEach((row) => {
          const alert = evaluateRiskThreshold(row, criticalRatioThreshold, criticalLiabilityTokens);
          if (alert) next.set(row.bet_id, alert);
        });
        (payload.alerts ?? []).forEach((alert) => {
          if (alert?.bet_id) next.set(alert.bet_id, alert);
        });
        return next;
      });
    } catch {
      // Non-fatal — realtime channel remains authoritative.
    }
  }, [criticalLiabilityTokens, criticalRatioThreshold, roomId]);

  useEffect(() => {
    void refreshMetrics();
  }, [refreshMetrics]);

  useEffect(() => {
    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;

    try {
      supabase = getSupabase();
    } catch {
      return;
    }

    const exposureChannel = supabase
      .channel(`table-exposure-sync:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bet_pool_exposure_metrics",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (cancelled) return;

          if (payload.eventType === "DELETE") {
            const deletedBetId = (payload.old as { bet_id?: string }).bet_id;
            if (!deletedBetId) return;
            setMetricsByBetId((prev) => {
              const next = new Map(prev);
              next.delete(deletedBetId);
              return next;
            });
            setActiveAlerts((prev) => {
              const next = new Map(prev);
              next.delete(deletedBetId);
              return next;
            });
            return;
          }

          const row = payload.new as BetPoolExposureRow;
          if (!row?.bet_id) return;
          upsertMetricRow(row);
        },
      )
      .subscribe();

    acquirePlatformChannel(supabase);
    registerPlatformListener(listenerId, (channel) =>
      channel.on("broadcast", { event: PRODUCTION_RISK_WARNING_EVENT }, (message) => {
        if (cancelled) return;
        const alert = message.payload as RiskThresholdAlert;
        if (!alert?.bet_id || alert.room_id !== roomId) return;

        setActiveAlerts((prev) => {
          const next = new Map(prev);
          next.set(alert.bet_id, alert);
          return next;
        });
      }),
    );
    commitPlatformChannelSubscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(exposureChannel);
      unregisterPlatformListener(listenerId);
      releasePlatformChannel(supabase);
    };
  }, [listenerId, roomId, upsertMetricRow]);

  const riskMetrics = useMemo(() => {
    if (activeBetId) {
      return metricsByBetId.get(activeBetId) ?? null;
    }

    const rows = Array.from(metricsByBetId.values());
    if (rows.length === 0) return null;

    return rows.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )[0];
  }, [activeBetId, metricsByBetId]);

  const riskWarning = useMemo(() => {
    if (activeBetId) {
      return activeAlerts.has(activeBetId);
    }
    return activeAlerts.size > 0;
  }, [activeAlerts, activeBetId]);

  return {
    activeAlerts: Array.from(activeAlerts.values()),
    riskMetrics,
    riskWarning,
    refresh: refreshMetrics,
  };
}
