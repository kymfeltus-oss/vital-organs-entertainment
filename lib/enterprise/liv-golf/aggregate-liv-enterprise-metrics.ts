import type { SupabaseClient } from "@supabase/supabase-js";
import {
  countLivMicroBetPlacements,
  loadLiveMicroBetsSession,
} from "@/lib/enterprise/liv-golf/live-micro-bets-session";
import { filterLivGolfGraphicsPresets } from "@/lib/enterprise/liv-golf/liv-graphics-scope";
import { findLivMicroBet, LIV_MICRO_BET_TRANSACTION_TYPE } from "@/lib/liv-micro-bets";
import {
  centsToDollars,
  fetchHarvestProgressCents,
  formatHarvestCurrency,
} from "@/lib/live/harvest-metrics";
import { OWNER_GRAPHICS_EVENT_ID, type OwnerGraphicsPreset } from "@/lib/owner/graphics-data-plane";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const SPONSOR_GRAPHIC_TYPES = ["LOWER_THIRD", "SLATE", "TICKER"] as const;

export type LivEnterpriseMetricsPayload = {
  isLive: boolean;
  streamHealth: "EXCELLENT" | "DEGRADED" | "STANDBY";
  harvestRevenueCents: number;
  harvestRevenue: string;
  tokenEngagementVolume: number;
  microBetPlacements: number;
  activeBetId: string | null;
  activeBetQuestion: string | null;
  clearOverlays: boolean;
  activeSponsorPlacements: number;
  sponsorPresetInventory: number;
  sponsorUtilizationPercent: number;
  retainedRevenueCents: number;
  retainedRevenue: string;
  updatedAt: string;
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

function isMissingTable(error: unknown, tableName: string): boolean {
  const message = errorMessage(error);
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  return (
    code === "PGRST205" ||
    new RegExp(`${tableName}|does not exist|Could not find the table|schema cache|42P01|PGRST205`, "i").test(
      message,
    )
  );
}

function resolveStreamHealth(
  isLive: boolean,
  activeSource: string | null | undefined,
  playbackStatus: string | null | undefined,
): LivEnterpriseMetricsPayload["streamHealth"] {
  if (!isLive) return "STANDBY";
  if (playbackStatus === "error" || playbackStatus === "failed") return "DEGRADED";
  if (activeSource === "backup") return "DEGRADED";
  return "EXCELLENT";
}

/** Sum absolute token stake volume from liv_micro_bet ledger rows. */
export async function sumLivMicroBetTokenVolume(admin: SupabaseClient): Promise<number> {
  const { data, error } = await admin
    .from("seed_transactions")
    .select("amount")
    .eq("transaction_type", LIV_MICRO_BET_TRANSACTION_TYPE);

  if (error) {
    if (isMissingTable(error, "seed_transactions")) return 0;
    throw new Error(errorMessage(error));
  }

  return (data ?? []).reduce((sum, row) => {
    const amount = typeof row.amount === "number" ? Math.abs(row.amount) : 0;
    return sum + amount;
  }, 0);
}

export async function countActiveSponsorGraphics(admin: SupabaseClient): Promise<number> {
  const { data, error } = await admin
    .from("owner_graphics_presets")
    .select("*")
    .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
    .eq("is_active_on_stream", true)
    .in("type", [...SPONSOR_GRAPHIC_TYPES]);

  if (error) {
    if (isMissingTable(error, "owner_graphics_presets")) return 0;
    throw new Error(errorMessage(error));
  }

  return filterLivGolfGraphicsPresets((data ?? []) as OwnerGraphicsPreset[]).length;
}

export async function countSponsorGraphicsInventory(admin: SupabaseClient): Promise<number> {
  const { data, error } = await admin
    .from("owner_graphics_presets")
    .select("*")
    .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
    .in("type", [...SPONSOR_GRAPHIC_TYPES]);

  if (error) {
    if (isMissingTable(error, "owner_graphics_presets")) return 0;
    throw new Error(errorMessage(error));
  }

  return filterLivGolfGraphicsPresets((data ?? []) as OwnerGraphicsPreset[]).length;
}

export async function aggregateLivEnterpriseMetrics(): Promise<LivEnterpriseMetricsPayload> {
  const admin = getSupabaseAdmin();

  const [harvestCents, betCount, tokenVolume, activeSponsorPlacements, sponsorPresetInventory, session, streamState] =
    await Promise.all([
      fetchHarvestProgressCents(admin),
      countLivMicroBetPlacements(),
      sumLivMicroBetTokenVolume(admin),
      countActiveSponsorGraphics(admin),
      countSponsorGraphicsInventory(admin),
      loadLiveMicroBetsSession(),
      loadOwnerStreamState(admin),
    ]);

  const row = streamState.row;
  const isLive = row?.is_live === true;
  const activeBetId = session?.activeBetId ?? null;
  const activeBet = findLivMicroBet(activeBetId);

  const sponsorUtilizationPercent =
    sponsorPresetInventory > 0
      ? Math.round((activeSponsorPlacements / sponsorPresetInventory) * 100)
      : 0;

  const retainedRevenueCents = harvestCents;

  return {
    isLive,
    streamHealth: resolveStreamHealth(isLive, row?.active_source, row?.playback_status),
    harvestRevenueCents: harvestCents,
    harvestRevenue: formatHarvestCurrency(centsToDollars(harvestCents)),
    tokenEngagementVolume: tokenVolume,
    microBetPlacements: betCount,
    activeBetId,
    activeBetQuestion: activeBet?.question ?? null,
    clearOverlays: session?.clearOverlays ?? false,
    activeSponsorPlacements,
    sponsorPresetInventory,
    sponsorUtilizationPercent,
    retainedRevenueCents,
    retainedRevenue: formatHarvestCurrency(centsToDollars(retainedRevenueCents)),
    updatedAt: new Date().toISOString(),
  };
}
