export type VmixConnectionStatus =
  | "connected"
  | "disconnected"
  | "stale"
  | "unreachable";

export type VmixCommandType =
  | "cut"
  | "fade"
  | "start_recording"
  | "stop_recording"
  | "start_streaming"
  | "stop_streaming"
  | "refresh_state";

export type VmixCommand = {
  type: VmixCommandType;
};

export type VmixState = {
  connectionStatus: VmixConnectionStatus;
  lastUpdatedAt: string | null;
  activeInput: string | null;
  previewInput: string | null;
  isRecording: boolean;
  isStreaming: boolean;
  audioMasterLevel: number;
  isStale: boolean;
  source: "mock" | "live";
};

export type VmixAdapterSuccess = {
  ok: true;
  state: VmixState;
};

export type VmixAdapterFailure = {
  ok: false;
  error: string;
  code: string;
};

export type VmixAdapterResult = VmixAdapterSuccess | VmixAdapterFailure;

export function isVmixAdapterFailure(
  result: VmixAdapterResult,
): result is VmixAdapterFailure {
  return result.ok === false;
}

export const VMIX_STALE_THRESHOLD_MS = 30_000;

export function markVmixStale(state: VmixState, nowMs = Date.now()): VmixState {
  if (!state.lastUpdatedAt) {
    return { ...state, isStale: true, connectionStatus: "stale" };
  }

  const ageMs = nowMs - new Date(state.lastUpdatedAt).getTime();
  const isStale = ageMs > VMIX_STALE_THRESHOLD_MS;

  return {
    ...state,
    isStale,
    connectionStatus: isStale ? "stale" : state.connectionStatus,
  };
}

export function isVmixReachable(state: VmixState | null): boolean {
  if (!state) return false;
  if (state.connectionStatus === "unreachable" || state.connectionStatus === "disconnected") {
    return false;
  }
  if (state.isStale) return false;
  return state.connectionStatus === "connected";
}
