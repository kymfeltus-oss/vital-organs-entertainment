import { normalizeEnvPlaybackString } from "@/lib/live/manifest-dev-fallback";
import { isValidHlsUrl } from "@/lib/live/hls";

const DEFAULT_LIV_STREAM_SETUP_PROBE_TIMEOUT_MS = 1_200;

/**
 * When false (default), LIV stream setup / master go-live ignore targetDateTime and
 * eventPhase ended state. Set LIV_REQUIRE_SCHEDULE_GATE=1 to re-enable schedule gates.
 */
export function isLivScheduleGateEnabled(): boolean {
  const raw = process.env.LIV_REQUIRE_SCHEDULE_GATE?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

/** Read LIV stream-setup manifest probe timeout from env (ms). */
export function resolveLivStreamSetupProbeTimeoutMs(): number {
  const raw = process.env.LIV_STREAM_SETUP_PROBE_TIMEOUT_MS?.trim();
  if (!raw) return DEFAULT_LIV_STREAM_SETUP_PROBE_TIMEOUT_MS;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_LIV_STREAM_SETUP_PROBE_TIMEOUT_MS;
}

/** LIV-specific public HLS manifest from .env.local (must end in .m3u8). */
export function resolveLivGolfHlsManifestFromEnv(): string | null {
  const raw = normalizeEnvPlaybackString(process.env.NEXT_PUBLIC_LIV_GOLF_HLS_MANIFEST_URL);
  if (!raw || !isValidHlsUrl(raw)) return null;
  return raw;
}
