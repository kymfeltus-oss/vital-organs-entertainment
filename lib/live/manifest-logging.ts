type ManifestResolutionSource = "database_live" | "env" | "database_primary" | "none";

export type ManifestResolutionLog = {
  source: ManifestResolutionSource;
  isLive: boolean;
  activeSource: "primary" | "backup";
  upstreamUrl: string | null;
  clientPlaybackUrl: string | null;
  usedRelay: boolean;
  fromDatabase: boolean;
};

export function logManifestResolution(log: ManifestResolutionLog): void {
  const relayNote = log.usedRelay ? " [dev relay wrapper]" : "";
  const upstream = log.upstreamUrl ?? "(none)";

  if (!log.clientPlaybackUrl) {
    console.warn(
      `[stream/manifest] No playback URL resolved — source=${log.source}, is_live=${log.isLive}. ` +
        "Set ATTENDEE_PLAYBACK_HLS_URL to your Restream .m3u8 or go live with primary_playback_url in Supabase.",
    );
    return;
  }

  console.warn(
    `[stream/manifest] Resolved playback — source=${log.source}, is_live=${log.isLive}, ` +
      `active_source=${log.activeSource}, from_database=${log.fromDatabase}${relayNote}`,
  );
  console.warn(`[stream/manifest]   upstream: ${upstream}`);
  if (log.usedRelay && log.clientPlaybackUrl) {
    console.warn(`[stream/manifest]   client:   ${log.clientPlaybackUrl}`);
    console.warn(
      "[stream/manifest]   tip: open client URL in browser — expect text starting with #EXTM3U",
    );
  }
}
