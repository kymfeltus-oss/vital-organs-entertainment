import type {
  RestreamAdapterResult,
  RestreamCommand,
  RestreamState,
} from "@/lib/live-hub/restream/types";
import { markRestreamStale } from "@/lib/live-hub/restream/types";

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

export async function getRestreamAdapterState(): Promise<RestreamAdapterResult> {
  const token = process.env.RESTREAM_API_TOKEN?.trim();

  if (!token) {
    return { ok: true, state: markRestreamStale(mockRestreamState) };
  }

  // Live Restream API integration placeholder — fail closed until implemented.
  return {
    ok: false,
    error: "Restream live adapter not configured on server.",
    code: "RESTREAM_NOT_IMPLEMENTED",
  };
}

export async function runRestreamAdapterCommand(
  command: RestreamCommand,
): Promise<RestreamAdapterResult> {
  const token = process.env.RESTREAM_API_TOKEN?.trim();

  if (!token) {
    const state = applyMockCommand(command);
    return { ok: true, state: markRestreamStale(state) };
  }

  return {
    ok: false,
    error: "Restream live adapter not configured on server.",
    code: "RESTREAM_NOT_IMPLEMENTED",
  };
}

export function resetMockRestreamStateForTests(): void {
  mockRestreamState = disconnectedMockState();
}
