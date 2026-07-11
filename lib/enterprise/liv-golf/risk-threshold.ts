export type BetPoolExposureRow = {
  room_id: string;
  bet_id: string;
  total_yes_tickets: number;
  total_no_tickets: number;
  total_token_risk: number;
  max_liability_payout: number;
  updated_at: string;
};

export type RiskThresholdAlert = {
  room_id: string;
  bet_id: string;
  total_token_risk: number;
  max_liability_payout: number;
  yes_to_no_ratio: number;
  is_critical: boolean;
};

export const DEFAULT_CRITICAL_RATIO_THRESHOLD = 4.0;
export const DEFAULT_CRITICAL_LIABILITY_TOKENS = 100_000;

export function evaluateRiskThreshold(
  row: Pick<
    BetPoolExposureRow,
    "room_id" | "bet_id" | "total_yes_tickets" | "total_no_tickets" | "total_token_risk" | "max_liability_payout"
  >,
  criticalRatioThreshold = DEFAULT_CRITICAL_RATIO_THRESHOLD,
  criticalLiabilityTokens = DEFAULT_CRITICAL_LIABILITY_TOKENS,
): RiskThresholdAlert | null {
  const yesCount = row.total_yes_tickets;
  const noCount = row.total_no_tickets;
  const yesDenom = yesCount || 1;
  const noDenom = noCount || 1;
  const yesToNoRatio = yesCount / noDenom;
  const noToYesRatio = noCount / yesDenom;

  const ratioBreached =
    yesToNoRatio >= criticalRatioThreshold || noToYesRatio >= criticalRatioThreshold;
  const liabilityBreached = row.max_liability_payout > criticalLiabilityTokens;

  if (!ratioBreached && !liabilityBreached) {
    return null;
  }

  return {
    room_id: row.room_id,
    bet_id: row.bet_id,
    total_token_risk: row.total_token_risk,
    max_liability_payout: row.max_liability_payout,
    yes_to_no_ratio: yesToNoRatio,
    is_critical: liabilityBreached || ratioBreached,
  };
}
