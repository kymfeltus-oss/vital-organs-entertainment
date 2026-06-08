export type RestreamConnectionStatus =
  | "connected"
  | "disconnected"
  | "degraded"
  | "stale";

export type RestreamDestination = {
  id: string;
  name: string;
  platform: string;
  healthy: boolean;
};

export type RestreamState = {
  connectionStatus: RestreamConnectionStatus;
  lastUpdatedAt: string | null;
  streamTitle: string;
  streamStatus: string;
  multistreamDestinations: RestreamDestination[];
  chatConnected: boolean;
  isStale: boolean;
  source: "mock" | "live";
};

export type RestreamCommandType = "refresh_status" | "sync_metadata";

export type RestreamCommand = {
  type: RestreamCommandType;
};

export type RestreamAdapterSuccess = {
  ok: true;
  state: RestreamState;
};

export type RestreamAdapterFailure = {
  ok: false;
  error: string;
  code: string;
};

export type RestreamAdapterResult = RestreamAdapterSuccess | RestreamAdapterFailure;

export function isRestreamAdapterFailure(
  result: RestreamAdapterResult,
): result is RestreamAdapterFailure {
  return result.ok === false;
}

export const RESTREAM_STALE_THRESHOLD_MS = 45_000;

export function markRestreamStale(state: RestreamState, nowMs = Date.now()): RestreamState {
  if (!state.lastUpdatedAt) {
    return { ...state, isStale: true, connectionStatus: "stale" };
  }

  const ageMs = nowMs - new Date(state.lastUpdatedAt).getTime();
  const isStale = ageMs > RESTREAM_STALE_THRESHOLD_MS;

  return {
    ...state,
    isStale,
    connectionStatus: isStale ? "stale" : state.connectionStatus,
  };
}

export function isRestreamHealthy(state: RestreamState | null): boolean {
  if (!state) return false;
  if (state.isStale || state.connectionStatus === "disconnected") return false;
  return state.connectionStatus === "connected" || state.connectionStatus === "degraded";
}
