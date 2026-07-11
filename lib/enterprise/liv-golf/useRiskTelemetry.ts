"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  DEFAULT_CRITICAL_LIABILITY_TOKENS,
  DEFAULT_CRITICAL_RATIO_THRESHOLD,
  evaluateRiskThreshold,
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

export function useRiskTelemetry(
  roomId: string,
  criticalRatioThreshold = DEFAULT_CRITICAL_RATIO_THRESHOLD,
  criticalLiabilityTokens = DEFAULT_CRITICAL_LIABILITY_TOKENS,
) {
  const instanceId = useId();
  const listenerId = `${RISK_TELEMETRY_LISTENER_PREFIX}${instanceId}`;
  const [activeAlerts, setActiveAlerts] = useState<Map<string, RiskThresholdAlert>>(new Map());

  const applyExposureRow = useCallback(
    (row: {
      room_id: string;
      bet_id: string;
      total_yes_tickets: number;
      total_no_tickets: number;
      total_token_risk: number;
      max_liability_payout: number;
    }) => {
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
    },
    [criticalLiabilityTokens, criticalRatioThreshold],
  );

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
            setActiveAlerts((prev) => {
              const next = new Map(prev);
              next.delete(deletedBetId);
              return next;
            });
            return;
          }

          const row = payload.new as {
            room_id: string;
            bet_id: string;
            total_yes_tickets: number;
            total_no_tickets: number;
            total_token_risk: number;
            max_liability_payout: number;
          };

          if (!row?.bet_id) return;
          applyExposureRow(row);
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
  }, [applyExposureRow, listenerId, roomId]);

  return {
    activeAlerts: Array.from(activeAlerts.values()),
  };
}
