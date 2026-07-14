import { buildOwnerBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot";
import { LIV_STREAM_SETUP_PROBE_TIMEOUT_MS } from "@/lib/owner/hls-readiness";
import { loadShowSetupState } from "@/lib/owner/show-setup-state";
import type { PreflightCheck } from "@/lib/owner/contracts";
import { sanitizeLivShowSetupFields } from "@/lib/enterprise/liv-golf/sanitize-liv-show-setup";

export type LivStreamSetupStatus = {
  isLive: boolean;
  publishStatus: string;
  playbackStatus: string;
  eventPhase: string;
  hlsUrl: string | null;
  manifestReachable: boolean;
  manifestProbeDetail: string | null;
  manifestInvalidReason: string | null;
  showTitle: string;
  eventLocation: string;
  targetDateTime: string | null;
  scheduleEnded: boolean;
  encoderConfigured: boolean;
  /** All operator-facing issues (hard blockers + ingest warnings). */
  readinessBlockers: string[];
  /** Hard stops before master go-live. */
  goLiveBlockers: string[];
  /** Encoder / ingest hints that do not block go-live when manifest is healthy. */
  ingestWarnings: string[];
  canAttemptGoLive: boolean;
  canMountPlayer: boolean;
  preflight: PreflightCheck[];
  capturedAt: string;
};

function isScheduleEnded(targetDateTime: string | null, eventPhase: string): boolean {
  if (eventPhase === "ended") return true;
  if (!targetDateTime?.trim()) return false;

  const targetMs = new Date(targetDateTime).getTime();
  return Number.isFinite(targetMs) && targetMs <= Date.now();
}

function buildLivStreamReadiness(input: {
  eventPhase: string;
  targetDateTime: string | null;
  hlsUrl: string | null;
  manifestReachable: boolean;
  manifestProbeDetail: string | null;
  publishStatus: string;
  encoderConfigured: boolean;
  isLive: boolean;
}) {
  const goLiveBlockers: string[] = [];
  const ingestWarnings: string[] = [];

  // Schedule / eventPhase is informational only — operators may go live without a future air time.
  if (isScheduleEnded(input.targetDateTime, input.eventPhase)) {
    ingestWarnings.push(
      "Event schedule is in the past or marked ended. Master go-live will refresh the broadcast window automatically.",
    );
  }

  if (!input.hlsUrl) {
    goLiveBlockers.push("No HLS playback URL configured. Save a valid .m3u8 URL in encoder settings.");
  } else if (!input.manifestReachable) {
    goLiveBlockers.push(
      input.manifestProbeDetail ??
        "HLS manifest is unreachable. Verify the active Amazon IVS channel playback URL.",
    );
  }

  if (!input.encoderConfigured) {
    goLiveBlockers.push(
      "Encoder ingest credentials are incomplete. Configure RTMP endpoint and stream key.",
    );
  }

  if (input.publishStatus === "offline" && !input.isLive) {
    ingestWarnings.push(
      input.manifestReachable
        ? "Publish status is offline — encoder feed detected. Run Preflight, then Go Live on Platform."
        : "Publish status is offline. Start your encoder (OBS/vMix) and push to the ingest endpoint.",
    );
  }

  const readinessBlockers = [...goLiveBlockers, ...ingestWarnings];

  return {
    goLiveBlockers,
    ingestWarnings,
    readinessBlockers,
    canAttemptGoLive: goLiveBlockers.length === 0,
    canMountPlayer: input.isLive,
  };
}

export async function loadLivStreamSetupStatus(): Promise<LivStreamSetupStatus> {
  const [{ snapshot }, showSetup] = await Promise.all([
    buildOwnerBroadcastSnapshot(undefined, {
      manifestProbeTimeoutMs: LIV_STREAM_SETUP_PROBE_TIMEOUT_MS,
    }),
    loadShowSetupState(),
  ]);

  const hlsUrl = snapshot?.playback.hlsUrl ?? snapshot?.feed.primary.hlsUrl ?? null;
  const manifestReachable =
    snapshot?.playback.manifestReachable ?? snapshot?.feed.primary.manifestReachable ?? false;
  const manifestProbeDetail = snapshot?.feed.primary.detail ?? null;
  const manifestInvalidReason = manifestReachable ? null : hlsUrl ? "manifest_unreachable" : "missing";

  const encoderConfigured = Boolean(
    showSetup.primaryIngestEndpoint?.trim() ||
      showSetup.streamKey?.trim() ||
      showSetup.attendeePlaybackHlsUrl?.trim(),
  );

  const eventPhase = snapshot?.eventPhase.phase ?? "idle";
  const targetDateTime = showSetup.targetDateTime ?? null;
  const publishStatus = snapshot?.publish.status ?? "offline";
  const isLive =
    Boolean(snapshot?.publish.status === "publishing") ||
    snapshot?.eventPhase.phase === "live";

  const readiness = buildLivStreamReadiness({
    eventPhase,
    targetDateTime,
    hlsUrl,
    manifestReachable,
    manifestProbeDetail,
    publishStatus,
    encoderConfigured,
    isLive,
  });

  const canMountPlayer =
    isLive || eventPhase === "live" || publishStatus === "publishing" || publishStatus === "starting";

  const sanitizedMetadata = sanitizeLivShowSetupFields({
    showTitle: showSetup.showTitle,
    eventLocation: showSetup.eventLocation,
  });

  return {
    isLive,
    publishStatus,
    playbackStatus: snapshot?.playback.status ?? "unconfigured",
    eventPhase,
    hlsUrl,
    manifestReachable,
    manifestProbeDetail,
    manifestInvalidReason,
    showTitle: sanitizedMetadata.showTitle ?? "",
    eventLocation: sanitizedMetadata.eventLocation ?? "",
    targetDateTime,
    scheduleEnded: isScheduleEnded(targetDateTime, eventPhase),
    encoderConfigured,
    readinessBlockers: readiness.readinessBlockers,
    goLiveBlockers: readiness.goLiveBlockers,
    ingestWarnings: readiness.ingestWarnings,
    canAttemptGoLive: readiness.canAttemptGoLive,
    canMountPlayer,
    preflight: snapshot?.preflight ?? [],
    capturedAt: snapshot?.capturedAt ?? new Date().toISOString(),
  };
}
