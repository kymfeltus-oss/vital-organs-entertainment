import type {
  RestreamAdapterResult,
  RestreamCommand,
  RestreamConnectionStatus,
  RestreamDestination,
  RestreamState,
} from "@/lib/live-hub/restream/types";
import { markRestreamStale } from "@/lib/live-hub/restream/types";

const RESTREAM_API_BASE = "https://api.restream.io";
const RESTREAM_WS_URL = "wss://streaming.api.restream.io/ws";
const RESTREAM_FETCH_TIMEOUT_MS = 4_000;
const RESTREAM_WS_SNAPSHOT_MS = 4_000;

/** Minimum ingest bitrate before the backup lane is flagged degraded (4500 kbps). */
const MIN_INGEST_BITRATE_BPS = 4_500_000;
/** Healthy ingest target when live (5000 kbps). */
const READY_INGEST_BITRATE_BPS = 5_000_000;

type RestreamApiChannel = {
  id: number;
  streamingPlatformId: number;
  displayName: string;
  active: boolean;
};

type RestreamWsSnapshot = {
  ingestBitrateBps: number | null;
  outgoingByChannelId: Map<number, "CONNECTING" | "CONNECTED" | "DISCONNECTED">;
};

const disconnectedMockState = (): RestreamState => ({
  connectionStatus: "disconnected",
  lastUpdatedAt: null,
  streamTitle: "300 Awakening Live Experience",
  streamStatus: "Offline",
  multistreamDestinations: [
    { id: "yt", name: "YouTube", platform: "YouTube", healthy: false },
    { id: "fb", name: "Facebook", platform: "Facebook", healthy: false },
  ],
  chatConnected: false,
  isStale: true,
  source: "mock",
});

let mockRestreamState: RestreamState = disconnectedMockState();

function connectedMockState(): RestreamState {
  return {
    connectionStatus: "connected",
    lastUpdatedAt: new Date().toISOString(),
    streamTitle: "300 Awakening Live Experience",
    streamStatus: mockRestreamState.streamStatus,
    multistreamDestinations: [
      { id: "yt", name: "YouTube", platform: "YouTube", healthy: true },
      { id: "fb", name: "Facebook", platform: "Facebook", healthy: true },
      { id: "web", name: "Web Player", platform: "HLS", healthy: true },
    ],
    chatConnected: true,
    isStale: false,
    source: "mock",
  };
}

function applyMockCommand(command: RestreamCommand): RestreamState {
  switch (command.type) {
    case "refresh_status":
      mockRestreamState = connectedMockState();
      return mockRestreamState;
    case "sync_metadata":
      mockRestreamState = {
        ...connectedMockState(),
        streamTitle: "300 Awakening Live Experience",
        streamStatus: "Ready",
      };
      return mockRestreamState;
    default:
      return mockRestreamState;
  }
}

async function fetchRestreamChannels(token: string): Promise<RestreamApiChannel[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RESTREAM_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${RESTREAM_API_BASE}/v2/user/channel/all`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Restream API returned ${response.status}.`);
    }

    const payload = (await response.json()) as RestreamApiChannel[];
    return Array.isArray(payload) ? payload : [];
  } finally {
    clearTimeout(timeoutId);
  }
}

async function snapshotRestreamMetrics(token: string): Promise<RestreamWsSnapshot> {
  const empty: RestreamWsSnapshot = {
    ingestBitrateBps: null,
    outgoingByChannelId: new Map(),
  };

  if (typeof WebSocket === "undefined") {
    return empty;
  }

  return new Promise((resolve) => {
    const outgoingByChannelId = new Map<
      number,
      "CONNECTING" | "CONNECTED" | "DISCONNECTED"
    >();
    let ingestBitrateBps: number | null = null;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve({ ingestBitrateBps, outgoingByChannelId });
    };

    const timeoutId = setTimeout(() => {
      ws.close();
      finish();
    }, RESTREAM_WS_SNAPSHOT_MS);

    let ws: WebSocket;
    try {
      ws = new WebSocket(
        `${RESTREAM_WS_URL}?accessToken=${encodeURIComponent(token)}`,
      );
    } catch {
      clearTimeout(timeoutId);
      finish();
      return;
    }

    ws.addEventListener("message", (event) => {
      try {
        const update = JSON.parse(String(event.data)) as {
          action?: string;
          channelId?: number;
          streaming?: {
            bitrate?: number | { total?: number };
            status?: "CONNECTING" | "CONNECTED" | "DISCONNECTED";
          };
        };

        if (update.action === "updateIncoming") {
          const bitrate = update.streaming?.bitrate;
          ingestBitrateBps =
            typeof bitrate === "object" && bitrate !== null
              ? (bitrate.total ?? null)
              : typeof bitrate === "number"
                ? bitrate
                : null;
        }

        if (update.action === "updateOutgoing" && typeof update.channelId === "number") {
          const status = update.streaming?.status;
          if (status) {
            outgoingByChannelId.set(update.channelId, status);
          }
        }
      } catch {
        // Ignore malformed websocket frames.
      }
    });

    ws.addEventListener("error", () => {
      clearTimeout(timeoutId);
      finish();
    });

    ws.addEventListener("close", () => {
      clearTimeout(timeoutId);
      finish();
    });
  });
}

function mapChannelsToDestinations(
  channels: RestreamApiChannel[],
  outgoingByChannelId: Map<number, "CONNECTING" | "CONNECTED" | "DISCONNECTED">,
): RestreamDestination[] {
  return channels.map((channel) => {
    const outgoing = outgoingByChannelId.get(channel.id);
    const outgoingHealthy = outgoing ? outgoing === "CONNECTED" : true;

    return {
      id: String(channel.id),
      name: channel.displayName,
      platform: String(channel.streamingPlatformId),
      healthy: channel.active && outgoingHealthy,
    };
  });
}

function evaluateRestreamHealth(
  destinations: RestreamDestination[],
  ingestBitrateBps: number | null,
): { connectionStatus: RestreamConnectionStatus; streamStatus: string } {
  const anyUnhealthyDestination = destinations.some((destination) => !destination.healthy);
  const isIngestLive = ingestBitrateBps !== null && ingestBitrateBps > 0;

  if (isIngestLive && ingestBitrateBps < MIN_INGEST_BITRATE_BPS) {
    return { connectionStatus: "degraded", streamStatus: "Degraded" };
  }

  if (isIngestLive) {
    if (anyUnhealthyDestination) {
      return { connectionStatus: "degraded", streamStatus: "Degraded" };
    }

    if (ingestBitrateBps >= READY_INGEST_BITRATE_BPS) {
      return { connectionStatus: "connected", streamStatus: "Active" };
    }

    return { connectionStatus: "connected", streamStatus: "Active" };
  }

  if (anyUnhealthyDestination) {
    return { connectionStatus: "degraded", streamStatus: "Standby" };
  }

  return { connectionStatus: "connected", streamStatus: "Offline" };
}

async function fetchLiveRestreamState(token: string): Promise<RestreamAdapterResult> {
  try {
    const [channels, metrics] = await Promise.all([
      fetchRestreamChannels(token),
      snapshotRestreamMetrics(token),
    ]);

    const destinations = mapChannelsToDestinations(
      channels,
      metrics.outgoingByChannelId,
    );
    const { connectionStatus, streamStatus } = evaluateRestreamHealth(
      destinations,
      metrics.ingestBitrateBps,
    );

    const state: RestreamState = markRestreamStale({
      connectionStatus,
      lastUpdatedAt: new Date().toISOString(),
      streamTitle: "300 Awakening Live Experience",
      streamStatus,
      multistreamDestinations: destinations,
      chatConnected: connectionStatus !== "disconnected",
      isStale: false,
      source: "live",
    });

    return { ok: true, state };
  } catch {
    return {
      ok: false,
      error: "Restream API unreachable — backup lane fails closed.",
      code: "RESTREAM_UNREACHABLE",
    };
  }
}

export async function getRestreamAdapterState(): Promise<RestreamAdapterResult> {
  const token = process.env.RESTREAM_API_TOKEN?.trim();

  if (!token) {
    return { ok: true, state: markRestreamStale(mockRestreamState) };
  }

  return fetchLiveRestreamState(token);
}

export async function runRestreamAdapterCommand(
  command: RestreamCommand,
): Promise<RestreamAdapterResult> {
  const token = process.env.RESTREAM_API_TOKEN?.trim();

  if (!token) {
    const state = applyMockCommand(command);
    return { ok: true, state: markRestreamStale(state) };
  }

  if (command.type === "sync_metadata") {
    return fetchLiveRestreamState(token);
  }

  return fetchLiveRestreamState(token);
}

export function resetMockRestreamStateForTests(): void {
  mockRestreamState = disconnectedMockState();
}
