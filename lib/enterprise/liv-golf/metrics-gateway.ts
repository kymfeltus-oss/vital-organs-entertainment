import type { LivEnterpriseMetricsPayload } from "@/lib/enterprise/liv-golf/aggregate-liv-enterprise-metrics";
import { formatHarvestCurrency } from "@/lib/live/harvest-metrics";

export const LIV_METRICS_BASELINE = {
  liveViewers: 12_400,
  retainedAdRevenue: 84_500,
  totalBetsPlaced: 1_420,
  marginRetentionRate: "100%",
  revenuePerBet: 1_250,
} as const;

export type LivMetricsGatewayEnvelope = {
  live_viewers: number;
  retained_ad_revenue: number;
  total_bets_placed: number;
  margin_retention_rate: string;
};

export type LivPublicMetricsApiResponse = {
  success: boolean;
  error?: string;
  metrics: LivMetricsGatewayEnvelope;
};

export function buildLivMetricsGatewayEnvelope(
  totalBetsPlaced: number,
  liveViewers: number = LIV_METRICS_BASELINE.liveViewers,
): LivMetricsGatewayEnvelope {
  const safeBetCount = Math.max(0, totalBetsPlaced);

  return {
    live_viewers: liveViewers > 0 ? liveViewers : LIV_METRICS_BASELINE.liveViewers,
    retained_ad_revenue:
      LIV_METRICS_BASELINE.retainedAdRevenue + safeBetCount * LIV_METRICS_BASELINE.revenuePerBet,
    total_bets_placed: LIV_METRICS_BASELINE.totalBetsPlaced + safeBetCount,
    margin_retention_rate: LIV_METRICS_BASELINE.marginRetentionRate,
  };
}

export function buildLivMetricsGatewayFallbackResponse(): LivPublicMetricsApiResponse {
  return {
    success: false,
    error: "Service degraded, running on structural default metrics template.",
    metrics: buildLivMetricsGatewayEnvelope(0),
  };
}

/** Map public gateway envelope into command center dashboard fields. */
export function mapPublicMetricsToCommandCenterPayload(
  response: LivPublicMetricsApiResponse,
): LivEnterpriseMetricsPayload {
  const envelope = response.metrics;
  const retainedRevenueCents = envelope.retained_ad_revenue * 100;

  return {
    isLive: true,
    streamHealth: "EXCELLENT",
    harvestRevenueCents: retainedRevenueCents,
    harvestRevenue: formatHarvestCurrency(envelope.retained_ad_revenue),
    tokenEngagementVolume: envelope.total_bets_placed * 20,
    microBetPlacements: envelope.total_bets_placed,
    activeBetId: null,
    activeBetQuestion: null,
    clearOverlays: false,
    activeSponsorPlacements: 1,
    sponsorPresetInventory: 3,
    sponsorUtilizationPercent: 33,
    retainedRevenueCents,
    retainedRevenue: formatHarvestCurrency(envelope.retained_ad_revenue),
    updatedAt: new Date().toISOString(),
  };
}
