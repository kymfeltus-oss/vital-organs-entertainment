import type { SupabaseClient } from "@supabase/supabase-js";
import type { BetPoolExposureRow } from "@/lib/enterprise/liv-golf/risk-threshold";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export class BetPoolExposureUnavailableError extends Error {
  constructor(message = "bet_pool_exposure_metrics table is unavailable.") {
    super(message);
    this.name = "BetPoolExposureUnavailableError";
  }
}

function isMissingExposureTable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  return (
    code === "PGRST205" ||
    /bet_pool_exposure_metrics|does not exist|Could not find the table|schema cache|42P01|PGRST205/i.test(
      message,
    )
  );
}

function computeMaxLiability(
  yesTickets: number,
  noTickets: number,
  payout: number,
): number {
  return Math.max(yesTickets * payout, noTickets * payout);
}

export async function recordBetPoolExposure(input: {
  roomId: string;
  betId: string;
  selection: "Yes" | "No";
  stake: number;
  payout: number;
  admin?: SupabaseClient;
}): Promise<BetPoolExposureRow> {
  const admin = input.admin ?? getSupabaseAdmin();

  const { data: existing, error: loadError } = await admin
    .from("bet_pool_exposure_metrics")
    .select(
      "room_id, bet_id, total_yes_tickets, total_no_tickets, total_token_risk, max_liability_payout, updated_at",
    )
    .eq("room_id", input.roomId)
    .eq("bet_id", input.betId)
    .maybeSingle();

  if (loadError) {
    if (isMissingExposureTable(loadError)) {
      throw new BetPoolExposureUnavailableError();
    }
    throw new Error(loadError.message);
  }

  const yesTickets = (existing?.total_yes_tickets ?? 0) + (input.selection === "Yes" ? 1 : 0);
  const noTickets = (existing?.total_no_tickets ?? 0) + (input.selection === "No" ? 1 : 0);
  const totalTokenRisk = (existing?.total_token_risk ?? 0) + input.stake;
  const maxLiability = computeMaxLiability(yesTickets, noTickets, input.payout);
  const now = new Date().toISOString();

  const row = {
    room_id: input.roomId,
    bet_id: input.betId,
    total_yes_tickets: yesTickets,
    total_no_tickets: noTickets,
    total_token_risk: totalTokenRisk,
    max_liability_payout: maxLiability,
    updated_at: now,
  };

  const { data, error } = await admin
    .from("bet_pool_exposure_metrics")
    .upsert(row, { onConflict: "room_id,bet_id" })
    .select(
      "room_id, bet_id, total_yes_tickets, total_no_tickets, total_token_risk, max_liability_payout, updated_at",
    )
    .single();

  if (error) {
    if (isMissingExposureTable(error)) {
      throw new BetPoolExposureUnavailableError();
    }
    throw new Error(error.message);
  }

  return data as BetPoolExposureRow;
}

export async function loadBetPoolExposureMetrics(
  roomId: string,
  admin?: SupabaseClient,
): Promise<BetPoolExposureRow[]> {
  const client = admin ?? getSupabaseAdmin();

  const { data, error } = await client
    .from("bet_pool_exposure_metrics")
    .select(
      "room_id, bet_id, total_yes_tickets, total_no_tickets, total_token_risk, max_liability_payout, updated_at",
    )
    .eq("room_id", roomId)
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingExposureTable(error)) {
      throw new BetPoolExposureUnavailableError();
    }
    throw new Error(error.message);
  }

  return (data ?? []) as BetPoolExposureRow[];
}
