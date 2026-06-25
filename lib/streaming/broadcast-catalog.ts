import type { StreamingPlatform } from "@/lib/streaming/types";
import type {
  BroadcastDestinationCard,
  ServiceBroadcastDestination,
  StreamingDestination,
} from "@/lib/todays-service/types";

export type BroadcastPlatformFeature = {
  id: string;
  label: string;
};

export type BroadcastPlatformCatalogEntry = {
  platform: StreamingPlatform;
  label: string;
  description: string;
  maxResolution: string;
  maxFps: number;
  features: BroadcastPlatformFeature[];
  setupTimeSeconds: number;
  setupTimeLabel: string;
  oauth: boolean;
  advanced?: boolean;
};

export const BROADCAST_PLATFORM_CATALOG: BroadcastPlatformCatalogEntry[] = [
  {
    platform: "youtube",
    label: "YouTube Live",
    description: "Stream to your church YouTube channel.",
    maxResolution: "4K",
    maxFps: 60,
    features: [
      { id: "4k60", label: "4K60" },
      { id: "hdr", label: "HDR" },
      { id: "dvr", label: "DVR" },
      { id: "chapters", label: "Chapters" },
      { id: "live_chat", label: "Live Chat" },
    ],
    setupTimeSeconds: 30,
    setupTimeLabel: "~30 seconds",
    oauth: true,
  },
  {
    platform: "facebook",
    label: "Facebook Live",
    description: "Stream to your church Facebook page.",
    maxResolution: "1080p",
    maxFps: 60,
    features: [
      { id: "1080p60", label: "1080p60" },
      { id: "live_chat", label: "Live Comments" },
      { id: "crosspost", label: "Crossposting" },
    ],
    setupTimeSeconds: 45,
    setupTimeLabel: "~45 seconds",
    oauth: true,
  },
  {
    platform: "vimeo",
    label: "Vimeo",
    description: "Stream through your Vimeo account.",
    maxResolution: "4K",
    maxFps: 60,
    features: [
      { id: "4k60", label: "4K60" },
      { id: "privacy", label: "Privacy Controls" },
      { id: "embed", label: "Embed Player" },
    ],
    setupTimeSeconds: 40,
    setupTimeLabel: "~40 seconds",
    oauth: true,
  },
  {
    platform: "church_website",
    label: "Church Website",
    description: "Embed the livestream on your church website.",
    maxResolution: "1080p",
    maxFps: 60,
    features: [
      { id: "embed", label: "Website Embed" },
      { id: "iframe", label: "iFrame Player" },
    ],
    setupTimeSeconds: 20,
    setupTimeLabel: "~20 seconds",
    oauth: false,
  },
  {
    platform: "twitch",
    label: "Twitch",
    description: "Stream to your Twitch channel.",
    maxResolution: "1080p",
    maxFps: 60,
    features: [
      { id: "1080p60", label: "1080p60" },
      { id: "low_latency", label: "Low Latency" },
      { id: "live_chat", label: "Live Chat" },
    ],
    setupTimeSeconds: 35,
    setupTimeLabel: "~35 seconds",
    oauth: true,
  },
  {
    platform: "custom_rtmp",
    label: "Custom RTMP",
    description: "Advanced setups with a custom streaming server.",
    maxResolution: "4K",
    maxFps: 60,
    features: [
      { id: "rtmp", label: "Custom RTMP" },
      { id: "backup_url", label: "Backup URL" },
      { id: "4k60", label: "4K60" },
    ],
    setupTimeSeconds: 120,
    setupTimeLabel: "~2 minutes",
    oauth: false,
    advanced: true,
  },
];

export const DEFAULT_RECOMMENDED_BROADCAST_PLATFORM: StreamingPlatform = "youtube";

export function catalogEntry(platform: StreamingPlatform): BroadcastPlatformCatalogEntry {
  return BROADCAST_PLATFORM_CATALOG.find((e) => e.platform === platform) ?? BROADCAST_PLATFORM_CATALOG[0];
}

export function estimateCombinedSetupTime(platforms: StreamingPlatform[]): string {
  if (platforms.length === 0) return "~0 seconds";
  const maxSeconds = Math.max(...platforms.map((p) => catalogEntry(p).setupTimeSeconds));
  if (maxSeconds >= 90) return "~2 minutes";
  return `~${maxSeconds} seconds`;
}

export type DestinationHealthStatus = "healthy" | "expired" | "not_connected" | "needs_attention";

export type DestinationHealth = {
  status: DestinationHealthStatus;
  headline: string;
  details: string[];
};

export function computeDestinationHealth(
  destination: StreamingDestination | null | undefined,
): DestinationHealth {
  if (!destination || destination.connectionStatus === "not_connected") {
    return {
      status: "not_connected",
      headline: "Not Connected",
      details: ["Authentication Required"],
    };
  }

  const expiresAt = destination.oauthExpiresAt;
  if (expiresAt) {
    const expiresMs = new Date(expiresAt).getTime();
    const now = Date.now();
    if (expiresMs <= now) {
      return {
        status: "expired",
        headline: "Authentication expired",
        details: ["Reconnect Required"],
      };
    }
    const days = Math.max(1, Math.ceil((expiresMs - now) / (1000 * 60 * 60 * 24)));
    const permissions = destination.oauthPermissionsJson?.granted;
    const permissionDetail =
      Array.isArray(permissions) && permissions.length > 0
        ? "Live permissions granted"
        : destination.connectionStatus === "ready"
          ? "Live permissions granted"
          : "Permissions pending verification";

    if (destination.connectionStatus === "needs_attention" || destination.connectionStatus === "error") {
      return {
        status: "needs_attention",
        headline: "Needs Attention",
        details: [destination.lastErrorMessage ?? "Reconnect Required", `Token expires in ${days} days`],
      };
    }

    return {
      status: "healthy",
      headline: "Healthy",
      details: [`Token expires in ${days} days`, permissionDetail],
    };
  }

  if (destination.connectionStatus === "ready") {
    return {
      status: "healthy",
      headline: "Healthy",
      details: ["Ready to broadcast", "Connection verified"],
    };
  }

  if (destination.connectionStatus === "connected") {
    return {
      status: "healthy",
      headline: "Connected",
      details: ["Account linked", "Complete setup to go live"],
    };
  }

  return {
    status: "needs_attention",
    headline: "Needs Attention",
    details: [destination.lastErrorMessage ?? "Verification required"],
  };
}

export function formatLastConnected(at: string | null | undefined): string {
  if (!at) return "Never";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(at));
  } catch {
    return "Unknown";
  }
}

export function mapConnectionToOAuthStatus(
  connectionStatus: StreamingDestination["connectionStatus"],
  oauthExpiresAt: string | null,
): string {
  if (oauthExpiresAt) {
    const expired = new Date(oauthExpiresAt).getTime() <= Date.now();
    if (expired) return "expired";
  }
  if (connectionStatus === "ready") return "ready";
  if (connectionStatus === "connected") return "connected";
  if (connectionStatus === "needs_attention" || connectionStatus === "error") return "needs_attention";
  return "not_connected";
}

export function buildBroadcastDestinationCards(input: {
  destinations: StreamingDestination[];
  selections: ServiceBroadcastDestination[];
  recommendedPlatform?: StreamingPlatform;
}): BroadcastDestinationCard[] {
  const recommended = input.recommendedPlatform ?? DEFAULT_RECOMMENDED_BROADCAST_PLATFORM;
  const selectedPlatforms = new Set(
    input.selections.filter((s) => s.enabled).map((s) => s.platform),
  );

  return BROADCAST_PLATFORM_CATALOG.map((entry) => {
    const streaming = input.destinations.find((d) => d.platform === entry.platform) ?? null;
    const selection = input.selections.find((s) => s.platform === entry.platform) ?? null;
    const health = computeDestinationHealth(streaming);

    return {
      platform: entry.platform,
      label: entry.label,
      description: entry.description,
      maxResolution: entry.maxResolution,
      maxFps: entry.maxFps,
      features: entry.features,
      setupTimeLabel: entry.setupTimeLabel,
      recommended: entry.platform === recommended,
      selected: selectedPlatforms.has(entry.platform),
      enabled: selection?.enabled ?? selectedPlatforms.has(entry.platform),
      destinationId: streaming?.id ?? selection?.destinationId ?? null,
      connectedAccount: streaming?.accountName ?? streaming?.channelName ?? selection?.connectedAccount ?? null,
      oauthStatus:
        selection?.oauthStatus ??
        mapConnectionToOAuthStatus(streaming?.connectionStatus ?? "not_connected", streaming?.oauthExpiresAt ?? null),
      connectionStatus: streaming?.connectionStatus ?? "not_connected",
      lastConnectedAt: streaming?.lastAuthenticatedAt ?? streaming?.lastCheckedAt ?? null,
      lastTestedAt: streaming?.lastSuccessfulTestAt ?? selection?.lastTestedAt ?? null,
      health,
    };
  });
}
