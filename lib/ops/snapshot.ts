import { LIVE_STREAM_ACCESS_PRODUCT_IDS } from "@/lib/merch/catalog";
import { resolvePlaybackUrlStatus } from "@/lib/live/hls";
import { fetchHarvestProgressCents } from "@/lib/live/harvest-metrics";
import {
  HARVEST_GOAL_DOLLARS,
  LIVE_ROOM_PLATFORM_CHANNEL,
  LIVE_STREAM_STATE_BROADCAST_EVENT,
  LIVE_STREAM_STATE_ID,
} from "@/lib/live/types";
import type { OpsSnapshot, StreamAccessLogRow } from "@/lib/ops/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const ACCESS_LOG_LIMIT = 80;

function uniquePaidAttendees(
  rows: Array<{ email: string | null }> | null,
): number {
  const emails = new Set<string>();

  for (const row of rows ?? []) {
    const email = row.email?.trim().toLowerCase();
    if (email) emails.add(email);
  }

  return emails.size;
}

export async function loadOpsSnapshot(): Promise<OpsSnapshot> {
  const admin = getSupabaseAdmin();
  const chatWindowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const stripeWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    streamStateResult,
    paidAttendeeOrdersResult,
    paidOrders24hResult,
    totalPaidOrdersResult,
    lastPaidOrderResult,
    seedWalletsResult,
    chatActivityResult,
    accessLogsResult,
    harvestTotalCents,
  ] = await Promise.all([
    admin
      .from("live_stream_state")
      .select(
        "is_live, active_source, primary_playback_url, backup_playback_url, updated_at, updated_by",
      )
      .eq("id", LIVE_STREAM_STATE_ID)
      .maybeSingle(),
    admin
      .from("orders")
      .select("email")
      .eq("status", "paid")
      .in("product_type", [...LIVE_STREAM_ACCESS_PRODUCT_IDS]),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid")
      .gte("created_at", stripeWindowStart),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid"),
    admin
      .from("orders")
      .select("created_at")
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("seed_wallets").select("balance"),
    admin
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", chatWindowStart),
    admin
      .from("stream_access_logs")
      .select("id, user_id, result, reason, ip, user_agent, created_at")
      .order("created_at", { ascending: false })
      .limit(ACCESS_LOG_LIMIT),
    fetchHarvestProgressCents(admin),
  ]);

  if (streamStateResult.error) {
    throw new Error(streamStateResult.error.message);
  }

  if (paidAttendeeOrdersResult.error) {
    throw new Error(paidAttendeeOrdersResult.error.message);
  }

  if (seedWalletsResult.error) {
    throw new Error(seedWalletsResult.error.message);
  }

  if (accessLogsResult.error) {
    throw new Error(accessLogsResult.error.message);
  }

  const streamState = streamStateResult.data;
  const primaryPlaybackUrlStatus = resolvePlaybackUrlStatus(
    streamState?.primary_playback_url,
  );
  const backupPlaybackUrlStatus = resolvePlaybackUrlStatus(
    streamState?.backup_playback_url,
  );

  const seedCoinsDistributed = (seedWalletsResult.data ?? []).reduce(
    (sum, wallet) => sum + (typeof wallet.balance === "number" ? wallet.balance : 0),
    0,
  );

  return {
    stream: {
      isLive: streamState?.is_live === true,
      activeSource: streamState?.active_source ?? "offline",
      primaryConfigured: primaryPlaybackUrlStatus === "valid",
      backupConfigured: backupPlaybackUrlStatus === "valid",
      primaryPlaybackUrlStatus,
      backupPlaybackUrlStatus,
      updatedAt: streamState?.updated_at ?? new Date(0).toISOString(),
      updatedBy: streamState?.updated_by ?? null,
    },
    realtime: {
      platformChannel: LIVE_ROOM_PLATFORM_CHANNEL,
      broadcastEvent: LIVE_STREAM_STATE_BROADCAST_EVENT,
      recentChatMessages10m: chatActivityResult.count ?? 0,
      lastStreamStateSyncAt: streamState?.updated_at ?? new Date(0).toISOString(),
    },
    stripe: {
      paidOrdersLast24h: paidOrders24hResult.count ?? 0,
      totalPaidOrders: totalPaidOrdersResult.count ?? 0,
      lastPaidOrderAt: lastPaidOrderResult.data?.created_at ?? null,
    },
    metrics: {
      paidAttendees: uniquePaidAttendees(paidAttendeeOrdersResult.data),
      harvestTotalCents,
      harvestGoalDollars: HARVEST_GOAL_DOLLARS,
      seedCoinsDistributed,
    },
    accessLogs: (accessLogsResult.data ?? []) as StreamAccessLogRow[],
  };
}
