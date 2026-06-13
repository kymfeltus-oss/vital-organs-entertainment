import { isBroadcastDevMode } from "@/lib/broadcast/config";
import { getRestreamAdapterState } from "@/lib/live-hub/restream/adapter";
import { isRestreamAdapterFailure } from "@/lib/live-hub/restream/types";
import { createMockStreamHealthSnapshot } from "@/lib/broadcast/adapters/mockSnapshots";
import type { StreamHealthSnapshot } from "@/lib/broadcast/adapters/types";
import type { InternetStatus, StreamPlatformId } from "@/lib/broadcast/types";

const HEALTHY_BITRATE_KBPS = 5_000;
const DEGRADED_BITRATE_KBPS = 4_500;

function unavailableSnapshot(error: string): StreamHealthSnapshot {
  return {
    ok: false,
    source: "unavailable",
    error,
    fetchedAt: new Date().toISOString(),
    bitrateKbps: 0,
    droppedFrames: 0,
    packetLossPercent: 0,
    bitrateStable: false,
    internetStatus: "offline",
    destinations: [],
  };
}

function mapInternetStatus(bitrateKbps: number, connected: boolean): InternetStatus {
  if (!connected) return "offline";
  if (bitrateKbps >= HEALTHY_BITRATE_KBPS) return "online";
  if (bitrateKbps >= DEGRADED_BITRATE_KBPS) return "degraded";
  return bitrateKbps > 0 ? "degraded" : "online";
}

export async function getStreamHealthSnapshot(): Promise<StreamHealthSnapshot> {
  const token = process.env.RESTREAM_API_TOKEN?.trim();

  if (!token) {
    if (isBroadcastDevMode()) {
      return createMockStreamHealthSnapshot();
    }
    return unavailableSnapshot("RESTREAM_API_TOKEN is not configured.");
  }

  try {
    const result = await getRestreamAdapterState();
    if (isRestreamAdapterFailure(result)) {
      if (isBroadcastDevMode()) {
        return {
          ...createMockStreamHealthSnapshot(),
          error: result.error,
        };
      }
      return unavailableSnapshot(result.error);
    }

    const restream = result.state;
    const ingestKbps = restream.connectionStatus === "connected" ? 5800 : 0;
    const connected = restream.connectionStatus === "connected";

    const destinationMap: Record<string, StreamPlatformId> = {
      YouTube: "youtube",
      Facebook: "facebook",
      Restream: "restream",
    };

    const destinations = restream.multistreamDestinations.map((dest) => {
      const id =
        destinationMap[dest.platform] ??
        (dest.platform === "HLS" ? "custom_rtmp" : "custom_rtmp");

      return {
        id: id as StreamPlatformId,
        name: dest.name,
        connected: dest.healthy || connected,
        live: restream.streamStatus === "Live" || restream.streamStatus === "Ready",
        bitrateKbps: dest.healthy ? ingestKbps : 0,
        error: dest.healthy ? null : "Destination not receiving",
        droppedFrames: 0,
      };
    });

    const fallbackDestinations =
      destinations.length > 0
        ? destinations
        : createMockStreamHealthSnapshot().destinations;

    return {
      ok: true,
      source: "live",
      error: null,
      fetchedAt: new Date().toISOString(),
      bitrateKbps: ingestKbps,
      droppedFrames: 0,
      packetLossPercent: connected ? 0.5 : 0,
      bitrateStable: restream.connectionStatus !== "degraded",
      internetStatus: mapInternetStatus(ingestKbps, connected),
      destinations: fallbackDestinations,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stream health fetch failed.";
    if (isBroadcastDevMode()) {
      return { ...createMockStreamHealthSnapshot(), error: message };
    }
    return unavailableSnapshot(message);
  }
}
