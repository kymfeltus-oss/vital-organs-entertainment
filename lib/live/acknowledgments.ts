export type LiveAcknowledgmentRow = {
  id: string;
  order_id: string | null;
  display_name: string;
  product_type: string;
  amount_total: number;
  message: string;
  created_at: string;
};

export type LiveAcknowledgment = {
  id: string;
  displayName: string;
  message: string;
  productType: string;
  amountTotal: number;
  createdAt: string;
};

export function mapLiveAcknowledgmentRow(row: LiveAcknowledgmentRow): LiveAcknowledgment {
  return {
    id: row.id,
    displayName: row.display_name,
    message: row.message,
    productType: row.product_type,
    amountTotal: row.amount_total,
    createdAt: row.created_at,
  };
}

export const LIVE_ACKNOWLEDGMENTS_CHANNEL = "live-acknowledgments";

export const ACKNOWLEDGMENT_TOAST_DURATION_MS = 6_000;
export const ACKNOWLEDGMENT_HISTORY_LIMIT = 8;
