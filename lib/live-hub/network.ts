/** Client-side network telemetry for the Internet Connection readiness card. */

export type NetworkTelemetry = {
  /** `navigator.onLine` — can be true while the app server is unreachable. */
  browserOnline: boolean;
  /** Lightweight ops endpoint responded successfully. */
  probeOk: boolean;
  probeLatencyMs: number | null;
  /** Network Information API `connection.type` when exposed (often `wifi` / `ethernet`). */
  linkType: string | null;
  /** Network Information API `effectiveType` (e.g. `4g`). */
  effectiveType: string | null;
  downlinkMbps: number | null;
  lastProbedAt: string | null;
};

const PROBE_TIMEOUT_MS = 5_000;
const NETWORK_PROBE_PATH = "/api/ops/live-hub/network";

type NetworkInformation = {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

function readNavigatorConnection(): Pick<
  NetworkTelemetry,
  "linkType" | "effectiveType" | "downlinkMbps"
> {
  if (typeof navigator === "undefined" || !("connection" in navigator)) {
    return { linkType: null, effectiveType: null, downlinkMbps: null };
  }

  const connection = (navigator as Navigator & { connection?: NetworkInformation })
    .connection;

  return {
    linkType: connection?.type?.trim() || null,
    effectiveType: connection?.effectiveType?.trim() || null,
    downlinkMbps:
      typeof connection?.downlink === "number" && connection.downlink > 0
        ? connection.downlink
        : null,
  };
}

export function createInitialNetworkTelemetry(): NetworkTelemetry {
  return {
    browserOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    probeOk: false,
    probeLatencyMs: null,
    ...readNavigatorConnection(),
    lastProbedAt: null,
  };
}

export function isNetworkOnline(
  telemetry: NetworkTelemetry,
  options?: { requireServerProbe?: boolean },
): boolean {
  if (!telemetry.browserOnline) return false;
  if (options?.requireServerProbe === false) return true;
  return telemetry.probeOk;
}

function formatLinkLabel(linkType: string): string {
  switch (linkType.toLowerCase()) {
    case "wifi":
      return "Wi‑Fi";
    case "ethernet":
      return "Ethernet";
    case "cellular":
      return "Cellular";
    case "wimax":
      return "WiMAX";
    case "bluetooth":
      return "Bluetooth";
    case "none":
      return "Offline";
    default:
      return linkType;
  }
}

export function formatInternetDetail(telemetry: NetworkTelemetry): string {
  if (!telemetry.browserOnline) {
    return "Browser offline — connect via Wi‑Fi or Ethernet (Phase IX)";
  }

  const parts: string[] = [];
  if (telemetry.linkType) {
    parts.push(formatLinkLabel(telemetry.linkType));
  }
  if (telemetry.effectiveType) {
    parts.push(telemetry.effectiveType.toUpperCase());
  }
  if (telemetry.downlinkMbps !== null) {
    parts.push(`${telemetry.downlinkMbps.toFixed(1)} Mbps downlink est.`);
  }
  if (telemetry.probeLatencyMs !== null) {
    parts.push(`probe ${telemetry.probeLatencyMs}ms`);
  }

  const prefix = parts.length > 0 ? parts.join(" · ") : "Link type unknown";

  if (!telemetry.probeOk) {
    return `${prefix} — server probe failed (click to re-test)`;
  }

  return `${prefix} · online`;
}

/** Live probe: browser online flag + Network Information API + authenticated ops ping. */
export async function probeNetworkTelemetry(): Promise<NetworkTelemetry> {
  const link = readNavigatorConnection();
  const browserOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  const probedAt = new Date().toISOString();

  if (!browserOnline) {
    return {
      browserOnline: false,
      probeOk: false,
      probeLatencyMs: null,
      ...link,
      lastProbedAt: probedAt,
    };
  }

  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    const response = await fetch(NETWORK_PROBE_PATH, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    });

    window.clearTimeout(timeoutId);

    const latencyMs = Math.round(
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt,
    );

    return {
      browserOnline: true,
      probeOk: response.ok,
      probeLatencyMs: response.ok ? latencyMs : null,
      ...readNavigatorConnection(),
      lastProbedAt: probedAt,
    };
  } catch {
    return {
      browserOnline: true,
      probeOk: false,
      probeLatencyMs: null,
      ...readNavigatorConnection(),
      lastProbedAt: probedAt,
    };
  }
}

export function subscribeNetworkInformation(onChange: () => void): () => void {
  if (typeof navigator === "undefined" || !("connection" in navigator)) {
    return () => {};
  }

  const connection = (navigator as Navigator & { connection?: NetworkInformation })
    .connection;

  if (!connection?.addEventListener) {
    return () => {};
  }

  connection.addEventListener("change", onChange);
  return () => connection.removeEventListener?.("change", onChange);
}
