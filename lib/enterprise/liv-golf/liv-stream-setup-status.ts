import { buildOwnerBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot";
import { loadShowSetupState } from "@/lib/owner/show-setup-state";
import type { PreflightCheck } from "@/lib/owner/contracts";

export type LivStreamSetupStatus = {
  isLive: boolean;
  publishStatus: string;
  playbackStatus: string;
  eventPhase: string;
  hlsUrl: string | null;
  manifestReachable: boolean;
  showTitle: string;
  eventLocation: string;
  targetDateTime: string | null;
  encoderConfigured: boolean;
  preflight: PreflightCheck[];
  capturedAt: string;
};

export async function loadLivStreamSetupStatus(): Promise<LivStreamSetupStatus> {
  const [{ snapshot }, showSetup] = await Promise.all([
    buildOwnerBroadcastSnapshot(),
    loadShowSetupState(),
  ]);

  const hlsUrl = snapshot?.playback.hlsUrl ?? snapshot?.feed.primary.hlsUrl ?? null;
  const manifestReachable =
    snapshot?.playback.manifestReachable ?? snapshot?.feed.primary.manifestReachable ?? false;

  const encoderConfigured = Boolean(
    showSetup.primaryIngestEndpoint?.trim() ||
      showSetup.streamKey?.trim() ||
      showSetup.attendeePlaybackHlsUrl?.trim(),
  );

  return {
    isLive: Boolean(snapshot?.publish.status === "publishing"),
    publishStatus: snapshot?.publish.status ?? "offline",
    playbackStatus: snapshot?.playback.status ?? "unconfigured",
    eventPhase: snapshot?.eventPhase.phase ?? "idle",
    hlsUrl,
    manifestReachable,
    showTitle: showSetup.showTitle?.trim() || "LIV Golf Tour",
    eventLocation: showSetup.eventLocation?.trim() || "",
    targetDateTime: showSetup.targetDateTime ?? null,
    encoderConfigured,
    preflight: snapshot?.preflight ?? [],
    capturedAt: snapshot?.capturedAt ?? new Date().toISOString(),
  };
}
