export type HarvestAcknowledgmentTier =
  | "Seed Sower"
  | "Harvest Partner"
  | "Kingdom Pillar";

export type AcknowledgmentItem = {
  id: string;
  display_name: string;
  amount_cents: number;
  tier: HarvestAcknowledgmentTier;
};

export function resolveHarvestAcknowledgmentTier(
  amountCents: number,
): HarvestAcknowledgmentTier {
  if (amountCents >= 10_000) {
    return "Kingdom Pillar";
  }

  if (amountCents >= 2_500) {
    return "Harvest Partner";
  }

  return "Seed Sower";
}

export function mapAcknowledgmentRow(row: {
  id: string;
  display_name: string;
  amount_total: number;
}): AcknowledgmentItem {
  return {
    id: row.id,
    display_name: row.display_name,
    amount_cents: row.amount_total,
    tier: resolveHarvestAcknowledgmentTier(row.amount_total),
  };
}

export const HARVEST_ACKNOWLEDGMENT_HISTORY_LIMIT = 20;
export const HARVEST_ACKNOWLEDGMENT_BOOTSTRAP_LIMIT = 5;
