import { resolveLiveManifestPlayback } from "@/lib/live/resolve-manifest-playback";
import { buildOwnerBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot";
import { probeHlsManifest } from "@/lib/owner/hls-readiness";
import { resolvePrimaryFeedUrl } from "@/lib/owner/feed-urls";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state";
import { readEncoderConfigFromStreamPresets } from "@/lib/owner/resolve-show-encoder-config";
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
    activeSource: "primary" | "offline";
  };
  feeds: {
    primary: FeedHealthLane;
    backup: FeedHealthLane;
  };
  manifest: {
    route: string;
    playbackConfigured: boolean;
    playbackUrl: string | null;
    activeSource: "primary" | "offline";
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

const DISABLED_BACKUP_LANE: FeedHealthLane = {
  configured: false,
  url: null,
  manifestReachable: false,
  looksLikeHls: false,
  detail: "Restream-only — backup lane disabled.",
};

export async function buildStreamHealthReport(): Promise<StreamHealthReport> {
  const checkedAt = new Date().toISOString();
  const admin = getSupabaseAdmin();
  const { row } = await loadOwnerStreamState(admin);
  const { snapshot } = await buildOwnerBroadcastSnapshot();
  const encoder = readEncoderConfigFromStreamPresets(row?.audio_master_presets);

  const primaryUrl = resolvePrimaryFeedUrl(
    {
      primary_playback_url: row?.primary_playback_url,
      playback_url: row?.playback_url,
    },
    { showSetupHlsUrl: encoder.hlsPlaybackUrl },
  );

  const [primaryProbe, manifestResolved] = await Promise.all([
    probeHlsManifest(primaryUrl),
    resolveLiveManifestPlayback(),
  ]);

  const primaryLane = laneHealth(primaryUrl, primaryProbe);

  const encoderStreamLive =
    row?.is_live === true &&
    primaryLane.configured &&
    primaryLane.manifestReachable &&
    primaryLane.looksLikeHls;

  const playbackConfigured = Boolean(primaryUrl || manifestResolved.playbackUrl);
  const cockpitApisHealthy = snapshot.eventPhase !== undefined;

  let statusMessage: string;
  if (encoderStreamLive) {
    statusMessage = "Restream HLS is reachable and broadcast is live.";
  } else if (row?.is_live) {
    statusMessage =
      "Broadcast is live in ops state, but the Restream HLS manifest is not reachable yet.";
  } else if (playbackConfigured) {
    statusMessage = "Restream HLS is configured but broadcast is not currently live.";
  } else {
    statusMessage = "No Restream HLS URL configured — save one in the encoder panel.";
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
      activeSource: row?.is_live ? "primary" : "offline",
    },
    feeds: {
      primary: primaryLane,
      backup: DISABLED_BACKUP_LANE,
    },
    manifest: {
      route: "/api/stream/manifest",
      playbackConfigured,
      playbackUrl: manifestResolved.playbackUrl,
      activeSource: manifestResolved.playbackUrl ? "primary" : "offline",
    },
  };
}
