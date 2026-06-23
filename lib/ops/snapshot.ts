import { LIVE_STREAM_ACCESS_PRODUCT_IDS } from "@/lib/merch/catalog";
import { resolvePlaybackUrlStatus, isValidHlsUrl } from "@/lib/live/hls";
import { fetchHarvestProgressCents } from "@/lib/live/harvest-metrics";
import {
  HARVEST_GOAL_DOLLARS,
  LIVE_ROOM_PLATFORM_CHANNEL,
  LIVE_STREAM_STATE_BROADCAST_EVENT,
} from "@/lib/live/types";
import type { OpsSnapshot, StreamAccessLogRow } from "@/lib/ops/types";
import { buildRtmpIngestFields } from "@/lib/ops/resolve-stream-rtmp-ingest";
import { buildRtmpPullFields } from "@/lib/ops/resolve-stream-rtmp-pull";
import { buildStoredRestreamOutputLanes } from "@/lib/ops/restream-output-lanes";
import {
  fetchLiveStreamStateRow,
  type LiveStreamStateRow,
} from "@/lib/ops/fetch-live-stream-state-row";
import { normalizeStudioEngineMode } from "@/lib/ops/studio-engine-mode";
import { ensureDevStreamPlaybackConfigured } from "@/lib/ops/ensure-dev-stream-playback";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const ACCESS_LOG_LIMIT = 80;

function buildOpsStreamSnapshot(
  streamState: LiveStreamStateRow | null,
): OpsSnapshot["stream"] {
  const primaryPlaybackUrlStatus = resolvePlaybackUrlStatus(
    streamState?.primary_playback_url,
  );
  const backupPlaybackUrlStatus = resolvePlaybackUrlStatus(
    streamState?.backup_playback_url,
  );
  const rtmp = buildRtmpIngestFields(
    streamState?.primary_rtmp_ingest_url,
    streamState?.backup_rtmp_ingest_url,
  );
  const pull = buildRtmpPullFields(
    streamState?.primary_rtmp_pull_url,
    streamState?.backup_rtmp_pull_url,
    streamState?.camera_preview_hls_url,
    streamState?.primary_playback_url,
  );
  const storedRestreamOutputs = buildStoredRestreamOutputLanes(streamState);

  const primaryPlaybackUrl = streamState?.primary_playback_url?.trim() ?? "";
  const backupPlaybackUrl = streamState?.backup_playback_url?.trim() ?? "";

  return {
    isLive: streamState?.is_live === true,
    activeSource: streamState?.active_source ?? "offline",
    primaryPlaybackUrl: isValidHlsUrl(primaryPlaybackUrl) ? primaryPlaybackUrl : null,
    backupPlaybackUrl: isValidHlsUrl(backupPlaybackUrl) ? backupPlaybackUrl : null,
    primaryConfigured: primaryPlaybackUrlStatus === "valid",
    backupConfigured: backupPlaybackUrlStatus === "valid",
    primaryPlaybackUrlStatus,
    backupPlaybackUrlStatus,
    ...rtmp,
    ...pull,
    activeMobileStreamKey: streamState?.active_mobile_stream_key?.trim() || null,
    connectedPhoneClientsCount: streamState?.connected_phone_clients_count ?? 0,
    lastMobilePingAt: streamState?.last_mobile_ping_at ?? null,
    storedRestreamOutputs,
    studioEngineMode: normalizeStudioEngineMode(streamState?.studio_engine_mode),
    updatedAt: streamState?.updated_at ?? new Date(0).toISOString(),
    updatedBy: streamState?.updated_by ?? null,
  };
}

/** Lightweight stream-only read for ops realtime patches. */
export async function loadOpsStreamSnapshot(): Promise<OpsSnapshot["stream"]> {
  await ensureDevStreamPlaybackConfigured();

  const admin = getSupabaseAdmin();
  const data = await fetchLiveStreamStateRow(admin);

  return buildOpsStreamSnapshot(data);
}

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
  await ensureDevStreamPlaybackConfigured();

  const admin = getSupabaseAdmin();
  const chatWindowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const stripeWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const streamStatePromise = fetchLiveStreamStateRow(admin);

  const [
    streamState,
    paidAttendeeOrdersResult,
    paidOrders24hResult,
    totalPaidOrdersResult,
    lastPaidOrderResult,
    seedWalletsResult,
    chatActivityResult,
    accessLogsResult,
    harvestTotalCents,
  ] = await Promise.all([
    streamStatePromise,
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

  if (paidAttendeeOrdersResult.error) {
    throw new Error(paidAttendeeOrdersResult.error.message);
  }

  if (seedWalletsResult.error) {
    throw new Error(seedWalletsResult.error.message);
  }

  if (accessLogsResult.error) {
    throw new Error(accessLogsResult.error.message);
  }

  const stream = buildOpsStreamSnapshot(streamState);

  const seedCoinsDistributed = (seedWalletsResult.data ?? []).reduce(
    (sum, wallet) => sum + (typeof wallet.balance === "number" ? wallet.balance : 0),
    0,
  );

  return {
    stream,
    realtime: {
      platformChannel: LIVE_ROOM_PLATFORM_CHANNEL,
      broadcastEvent: LIVE_STREAM_STATE_BROADCAST_EVENT,
      recentChatMessages10m: chatActivityResult.count ?? 0,
      lastStreamStateSyncAt: stream.updatedAt,
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
