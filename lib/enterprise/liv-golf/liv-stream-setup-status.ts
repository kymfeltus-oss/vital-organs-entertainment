import { buildOwnerBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot";
import { LIV_STREAM_SETUP_PROBE_TIMEOUT_MS } from "@/lib/owner/hls-readiness";
import { loadShowSetupState } from "@/lib/owner/show-setup-state";
import type { PreflightCheck } from "@/lib/owner/contracts";

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
  readinessBlockers: string[];
  preflight: PreflightCheck[];
  capturedAt: string;
};

function isScheduleEnded(targetDateTime: string | null, eventPhase: string): boolean {
  if (eventPhase === "ended") return true;
  if (!targetDateTime?.trim()) return false;

  const targetMs = new Date(targetDateTime).getTime();
  return Number.isFinite(targetMs) && targetMs <= Date.now();
}

function buildReadinessBlockers(input: {
  eventPhase: string;
  targetDateTime: string | null;
  hlsUrl: string | null;
  manifestReachable: boolean;
  manifestProbeDetail: string | null;
  publishStatus: string;
  encoderConfigured: boolean;
}): string[] {
  const blockers: string[] = [];

  if (isScheduleEnded(input.targetDateTime, input.eventPhase)) {
    blockers.push(
      "Event schedule has ended. Update targetDateTime to a future window in Stream Setup.",
    );
  }

  if (!input.hlsUrl) {
    blockers.push("No HLS playback URL configured. Save a valid .m3u8 URL in encoder settings.");
  } else if (!input.manifestReachable) {
    blockers.push(
      input.manifestProbeDetail ??
        "HLS manifest is unreachable. Verify the active Amazon IVS channel playback URL.",
    );
  }

  if (!input.encoderConfigured) {
    blockers.push("Encoder ingest credentials are incomplete. Configure RTMP endpoint and stream key.");
  }

  if (input.publishStatus === "offline") {
    blockers.push(
      "Publish status is offline. Start your encoder (OBS/vMix) and push to the ingest endpoint.",
    );
  }

  return blockers;
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

  const readinessBlockers = buildReadinessBlockers({
    eventPhase,
    targetDateTime,
    hlsUrl,
    manifestReachable,
    manifestProbeDetail,
    publishStatus,
    encoderConfigured,
  });

  return {
    isLive: Boolean(snapshot?.publish.status === "publishing"),
    publishStatus,
    playbackStatus: snapshot?.playback.status ?? "unconfigured",
    eventPhase,
    hlsUrl,
    manifestReachable,
    manifestProbeDetail,
    manifestInvalidReason,
    showTitle: showSetup.showTitle?.trim() || "LIV Golf Tour",
    eventLocation: showSetup.eventLocation?.trim() || "",
    targetDateTime,
    scheduleEnded: isScheduleEnded(targetDateTime, eventPhase),
    encoderConfigured,
    readinessBlockers,
    preflight: snapshot?.preflight ?? [],
    capturedAt: snapshot?.capturedAt ?? new Date().toISOString(),
  };
}
