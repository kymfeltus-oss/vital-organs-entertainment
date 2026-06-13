/** Central PARABLE broadcast configuration — Architecture v1.0 */

export const ARCHITECTURE_VERSION = "1.0";

/** Explicit env flag (string compare). Prefer `isBroadcastDevMode()` for runtime rules. */
export const BROADCAST_DEV_MODE = process.env.BROADCAST_DEV_MODE === "true";

export const BROADCAST_HEARTBEAT_TTL_MS = 15_000;
export const BROADCAST_DISCOVERY_TICK_MS = 5_000;
export const BROADCAST_SNAPSHOT_POLL_MS = 2_000;
export const BROADCAST_PREFERRED_CAMERA_COUNT = 3;
export const BROADCAST_PACKET_LOSS_BLOCK_PERCENT = 2.5;
/** Event Guardian warning threshold — below hard interlock block. */
export const BROADCAST_PACKET_LOSS_WARNING_PERCENT = 1.5;
export const BROADCAST_BITRATE_DEGRADED_KBPS = 4_500;
export const BROADCAST_STORAGE_WARNING_GB = 20;

/** High-frequency vMix HTTP poll loop (Phase 2A). */
export const VMIX_POLL_INTERVAL_MS = 250;

export const VMIX_FETCH_TIMEOUT_MS = 4_000;

/** Default local vMix Web API base when env is unset (operator workstation). */
export const VMIX_DEFAULT_BASE_URL = "http://127.0.0.1:8088/api";

export function getVmixApiBaseUrl(): string | null {
  const configured = process.env.VMIX_API_BASE_URL?.trim();
  return configured || null;
}

/** Optional vMix input number for STINGER (PlayInput). */
export function getVmixStingerInputNumber(): number | null {
  const raw = process.env.VMIX_STINGER_INPUT?.trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function isBroadcastDevMode(): boolean {
  const explicit = process.env.BROADCAST_DEV_MODE?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return process.env.NODE_ENV === "development";
}

export function getObsWebSocketUrl(): string | null {
  const configured = process.env.OBS_WEBSOCKET_URL?.trim();
  return configured || null;
}

export function getObsWebSocketPassword(): string | null {
  const configured = process.env.OBS_WEBSOCKET_PASSWORD?.trim();
  return configured || null;
}
