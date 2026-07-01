import { resolveLiveManifestPlayback } from "@/lib/live/resolve-manifest-playback";
import { buildOwnerBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot";
import { probeHlsManifest } from "@/lib/owner/hls-readiness";
import {
  normalizeActiveFeedSource,
  resolveBackupFeedUrl,
  resolvePrimaryFeedUrl,
} from "@/lib/owner/feed-urls";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type FeedHealthLane = {
  configured: boolean;
  url: string | null;
  manifestReachable: boolean;
  looksLikeHls: boolean;
  detail: string | null;
};

export type StreamHealthReport = {
  ok: boolean;
  checkedAt: string;
  statusMessage: string;
  dressRehearsalReady: boolean;
  encoderStreamLive: boolean;
  broadcast: {
    isLive: boolean;
    publishStatus: string;
    publishMode: string;
    eventPhase: string;
    activeSource: "primary" | "backup" | "offline";
  };
  feeds: {
    primary: FeedHealthLane;
    backup: FeedHealthLane;
  };
  manifest: {
    route: string;
    playbackConfigured: boolean;
    playbackUrl: string | null;
    activeSource: "primary" | "backup" | "offline";
  };
};

function laneHealth(
  url: string | null,
  probe: Awaited<ReturnType<typeof probeHlsManifest>>,
): FeedHealthLane {
  return {
    configured: Boolean(url),
    url,
    manifestReachable: probe.manifestReachable,
    looksLikeHls: probe.manifestReachable,
    detail: probe.detail,
  };
}

export async function buildStreamHealthReport(): Promise<StreamHealthReport> {
  const checkedAt = new Date().toISOString();
  const admin = getSupabaseAdmin();
  const { row } = await loadOwnerStreamState(admin);
  const { snapshot } = await buildOwnerBroadcastSnapshot();

  const inputs = {
    primary_playback_url: row?.primary_playback_url,
    backup_playback_url: row?.backup_playback_url,
    playback_url: row?.playback_url,
    active_source: row?.active_source,
    is_live: row?.is_live,
  };

  const primaryUrl = resolvePrimaryFeedUrl(inputs);
  const backupUrl = resolveBackupFeedUrl(inputs);
  const [primaryProbe, backupProbe, manifestResolved] = await Promise.all([
    probeHlsManifest(primaryUrl),
    probeHlsManifest(backupUrl),
    resolveLiveManifestPlayback(),
  ]);

  const activeSource = normalizeActiveFeedSource(row?.active_source, row?.is_live === true);
  const activeLane =
    activeSource === "backup"
      ? laneHealth(backupUrl, backupProbe)
      : laneHealth(primaryUrl, primaryProbe);

  const encoderStreamLive =
    row?.is_live === true &&
    activeLane.configured &&
    activeLane.manifestReachable &&
    activeLane.looksLikeHls;

  const playbackConfigured = Boolean(primaryUrl || backupUrl || manifestResolved.playbackUrl);
  const cockpitApisHealthy = snapshot.eventPhase !== undefined;

  let statusMessage: string;
  if (encoderStreamLive) {
    statusMessage = "Encoder HLS manifest is reachable and broadcast is live.";
  } else if (row?.is_live) {
    statusMessage =
      "Broadcast is live in ops state, but the active HLS manifest is not reachable or valid yet.";
  } else if (playbackConfigured) {
    statusMessage = "Stream URLs are configured but broadcast is not currently live.";
  } else {
    statusMessage = "No HLS playback URL is configured for attendee manifest routing.";
  }

  const dressRehearsalReady =
    cockpitApisHealthy &&
    (playbackConfigured ||
      row?.is_live === true ||
      snapshot.eventPhase.phase === "scheduled" ||
      snapshot.eventPhase.phase === "preshow");

  return {
    ok: cockpitApisHealthy,
    checkedAt,
    statusMessage,
    dressRehearsalReady,
    encoderStreamLive,
    broadcast: {
      isLive: row?.is_live === true,
      publishStatus: snapshot.publish.status,
      publishMode: snapshot.publish.mode,
      eventPhase: snapshot.eventPhase.phase,
      activeSource,
    },
    feeds: {
      primary: laneHealth(primaryUrl, primaryProbe),
      backup: laneHealth(backupUrl, backupProbe),
    },
    manifest: {
      route: "/api/stream/manifest",
      playbackConfigured,
      playbackUrl: manifestResolved.playbackUrl,
      activeSource: manifestResolved.activeSource,
    },
  };
}
