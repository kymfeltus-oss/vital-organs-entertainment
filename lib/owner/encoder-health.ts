import { probeHlsManifest } from "@/lib/owner/hls-readiness";
import { loadShowSetupState } from "@/lib/owner/show-setup-state";

export type EncoderHealthStatus = "online" | "offline" | "unconfigured";

export type EncoderHealthReport = {
  ok: boolean;
  checkedAt: string;
  status: EncoderHealthStatus;
  label: string;
  hlsUrl: string | null;
  manifestReachable: boolean;
  detail: string | null;
};

export async function buildEncoderHealthReport(): Promise<EncoderHealthReport> {
  const checkedAt = new Date().toISOString();
  const showSetup = await loadShowSetupState();
  const hlsUrl = showSetup.attendeePlaybackHlsUrl.trim() || null;

  if (!hlsUrl) {
    return {
      ok: true,
      checkedAt,
      status: "unconfigured",
      label: "ENCODER UNCONFIGURED",
      hlsUrl: null,
      manifestReachable: false,
      detail: "Save an HLS playback URL (.m3u8) before going live.",
    };
  }

  const probe = await probeHlsManifest(hlsUrl);
  const online = probe.manifestReachable;

  return {
    ok: true,
    checkedAt,
    status: online ? "online" : "offline",
    label: online ? "ENCODER ONLINE — READY TO LAUNCH" : "ENCODER OFFLINE",
    hlsUrl,
    manifestReachable: online,
    detail: probe.detail,
  };
}
