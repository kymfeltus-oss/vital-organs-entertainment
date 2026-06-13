/** Persisted operator preferences for Live Hub network / connectivity (client-only). */

import type { NetworkTelemetry } from "@/lib/live-hub/network";

export type NetworkConnectionPreference = "auto" | "ethernet" | "wifi";

export type LiveHubNetworkSettings = {
  /** Operator intent — browser cannot force adapter changes; used for warnings + runbook. */
  connectionPreference: NetworkConnectionPreference;
  /** Broadcast SSID label for tablets/phones (Phase X same-network check). */
  broadcastWifiSsid: string;
  /** vMix PC LAN address for Web Controller / Phase X phone test (no protocol). */
  vmixLanHost: string;
  /** Background Internet Connection probe interval (seconds). */
  probeIntervalSec: number;
  /** When true, pass requires authenticated ops network probe — not only navigator.onLine. */
  requireServerProbe: boolean;
};

export const DEFAULT_LIVE_HUB_NETWORK_SETTINGS: LiveHubNetworkSettings = {
  connectionPreference: "auto",
  broadcastWifiSsid: "",
  vmixLanHost: "",
  probeIntervalSec: 10,
  requireServerProbe: true,
};

const STORAGE_KEY = "live_hub_network_settings";

const PROBE_INTERVAL_OPTIONS = [5, 10, 30, 60] as const;

export function normalizeProbeIntervalSec(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_LIVE_HUB_NETWORK_SETTINGS.probeIntervalSec;
  const rounded = Math.round(value);
  if (rounded <= 5) return 5;
  if (rounded <= 10) return 10;
  if (rounded <= 30) return 30;
  return 60;
}

export function loadLiveHubNetworkSettings(): LiveHubNetworkSettings {
  if (typeof window === "undefined") {
    return DEFAULT_LIVE_HUB_NETWORK_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LIVE_HUB_NETWORK_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<LiveHubNetworkSettings>;
    return {
      connectionPreference:
        parsed.connectionPreference === "ethernet" ||
        parsed.connectionPreference === "wifi" ||
        parsed.connectionPreference === "auto"
          ? parsed.connectionPreference
          : DEFAULT_LIVE_HUB_NETWORK_SETTINGS.connectionPreference,
      broadcastWifiSsid:
        typeof parsed.broadcastWifiSsid === "string"
          ? parsed.broadcastWifiSsid.slice(0, 64)
          : "",
      vmixLanHost:
        typeof parsed.vmixLanHost === "string"
          ? sanitizeLanHost(parsed.vmixLanHost)
          : "",
      probeIntervalSec: normalizeProbeIntervalSec(
        parsed.probeIntervalSec ?? DEFAULT_LIVE_HUB_NETWORK_SETTINGS.probeIntervalSec,
      ),
      requireServerProbe:
        typeof parsed.requireServerProbe === "boolean"
          ? parsed.requireServerProbe
          : DEFAULT_LIVE_HUB_NETWORK_SETTINGS.requireServerProbe,
    };
  } catch {
    return DEFAULT_LIVE_HUB_NETWORK_SETTINGS;
  }
}

export function saveLiveHubNetworkSettings(settings: LiveHubNetworkSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function sanitizeLanHost(input: string): string {
  return input.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").slice(0, 64);
}

export function buildVmixWebControllerUrl(lanHost: string): string | null {
  const host = sanitizeLanHost(lanHost);
  if (!host) return null;
  return `http://${host}:8088`;
}

/** Windows Settings deep links — open OS network UI (operator must switch Wi‑Fi manually). */
export const WINDOWS_NETWORK_SETTINGS_URIS = {
  wifi: "ms-settings:network-wifi",
  ethernet: "ms-settings:network-ethernet",
  networkStatus: "ms-settings:network-status",
  network: "ms-settings:network",
} as const;

export function openWindowsNetworkSettings(
  target: keyof typeof WINDOWS_NETWORK_SETTINGS_URIS = "wifi",
): void {
  if (typeof window === "undefined") return;
  window.location.href = WINDOWS_NETWORK_SETTINGS_URIS[target];
}

export function probeIntervalLabel(seconds: number): string {
  return PROBE_INTERVAL_OPTIONS.includes(seconds as (typeof PROBE_INTERVAL_OPTIONS)[number])
    ? `${seconds}s`
    : `${normalizeProbeIntervalSec(seconds)}s`;
}

export const NETWORK_PROBE_INTERVAL_OPTIONS = PROBE_INTERVAL_OPTIONS;

export function connectionPreferenceLabel(
  preference: NetworkConnectionPreference,
): string {
  switch (preference) {
    case "ethernet":
      return "Prefer Ethernet (encoder PC)";
    case "wifi":
      return "Prefer Wi‑Fi (control tablets)";
    default:
      return "Auto — use best available link";
  }
}

/** Warn when live link type conflicts with operator preference (cannot force OS switch). */
export function evaluateConnectionPreference(
  telemetry: NetworkTelemetry,
  preference: NetworkConnectionPreference,
): { status: "pass" | "warn"; detail: string } | null {
  if (preference === "auto" || !telemetry.linkType) return null;

  if (preference === "ethernet" && telemetry.linkType === "wifi") {
    return {
      status: "warn",
      detail: "Prefer Ethernet — encoder on Wi‑Fi; plug in CAT6 or open Ethernet settings",
    };
  }

  if (preference === "wifi" && telemetry.linkType === "cellular") {
    return {
      status: "warn",
      detail: "Prefer Wi‑Fi / LAN — cellular link detected for operator PC",
    };
  }

  return null;
}
