import type {
  VmixAdapterResult,
  VmixCommand,
  VmixState,
} from "@/lib/live-hub/vmix/types";
import { markVmixStale, VMIX_STALE_THRESHOLD_MS } from "@/lib/live-hub/vmix/types";

const disconnectedMockState = (): VmixState => ({
  connectionStatus: "disconnected",
  lastUpdatedAt: null,
  activeInput: null,
  previewInput: null,
  isRecording: false,
  isStreaming: false,
  audioMasterLevel: 0,
  isStale: true,
  source: "mock",
});

function initialConnectedMockState(): VmixState {
  return {
    connectionStatus: "connected",
    lastUpdatedAt: new Date().toISOString(),
    activeInput: "Camera 1",
    previewInput: "Title / Lower Third",
    isRecording: false,
    isStreaming: false,
    audioMasterLevel: 72,
    isStale: false,
    source: "mock",
  };
}

let mockVmixState: VmixState = initialConnectedMockState();

function connectedMockState(): VmixState {
  return {
    connectionStatus: "connected",
    lastUpdatedAt: new Date().toISOString(),
    activeInput: "Camera 1",
    previewInput: "Title / Lower Third",
    isRecording: mockVmixState.isRecording,
    isStreaming: mockVmixState.isStreaming,
    audioMasterLevel: 72,
    isStale: false,
    source: "mock",
  };
}

function applyMockCommand(command: VmixCommand): VmixState {
  const base = mockVmixState.connectionStatus === "connected"
    ? { ...mockVmixState, lastUpdatedAt: new Date().toISOString(), isStale: false }
    : connectedMockState();

  switch (command.type) {
    case "refresh_state":
      mockVmixState = connectedMockState();
      return mockVmixState;
    case "cut":
    case "fade":
      mockVmixState = {
        ...base,
        activeInput: base.previewInput,
        previewInput: base.activeInput,
      };
      return mockVmixState;
    case "start_recording":
      mockVmixState = { ...base, isRecording: true };
      return mockVmixState;
    case "stop_recording":
      mockVmixState = { ...base, isRecording: false };
      return mockVmixState;
    case "start_streaming":
      mockVmixState = { ...base, isStreaming: true };
      return mockVmixState;
    case "stop_streaming":
      mockVmixState = { ...base, isStreaming: false };
      return mockVmixState;
    default:
      return base;
  }
}

/** vMix Web API must expose `<version>` or `<inputs>` in its XML state document. */
function isValidVmixResponse(xml: string): boolean {
  return /<version\b/i.test(xml) || /<inputs\b/i.test(xml);
}

function parseVmixXml(xml: string): Partial<VmixState> {
  const activeMatch = xml.match(/<active>([^<]*)<\/active>/i);
  const previewMatch = xml.match(/<preview>([^<]*)<\/preview>/i);
  const recordingMatch = xml.match(/<recording>True<\/recording>/i);
  const streamingMatch = xml.match(/<streaming>True<\/streaming>/i);

  return {
    activeInput: activeMatch?.[1]?.trim() || null,
    previewInput: previewMatch?.[1]?.trim() || null,
    isRecording: Boolean(recordingMatch),
    isStreaming: Boolean(streamingMatch),
    audioMasterLevel: 65,
  };
}

async function fetchLiveVmixState(baseUrl: string): Promise<VmixAdapterResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4_000);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `vMix API returned ${response.status}.`,
        code: "VMIX_HTTP_ERROR",
      };
    }

    const xml = await response.text();

    if (!isValidVmixResponse(xml)) {
      return {
        ok: false,
        error: "vMix response missing version or inputs — not a valid vMix instance.",
        code: "VMIX_INVALID_RESPONSE",
      };
    }

    const parsed = parseVmixXml(xml);
    const now = new Date().toISOString();

    const state: VmixState = markVmixStale({
      connectionStatus: "connected",
      lastUpdatedAt: now,
      activeInput: parsed.activeInput ?? null,
      previewInput: parsed.previewInput ?? null,
      isRecording: parsed.isRecording ?? false,
      isStreaming: parsed.isStreaming ?? false,
      audioMasterLevel: parsed.audioMasterLevel ?? 0,
      isStale: false,
      source: "live",
    });

    return { ok: true, state };
  } catch {
    return {
      ok: false,
      error: "vMix API unreachable.",
      code: "VMIX_UNREACHABLE",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function executeLiveVmixCommand(
  baseUrl: string,
  command: VmixCommand,
): Promise<VmixAdapterResult> {
  if (command.type === "refresh_state") {
    return fetchLiveVmixState(baseUrl);
  }

  const functionName = command.type === "start_recording"
    ? "StartRecording"
    : command.type === "stop_recording"
      ? "StopRecording"
      : command.type === "start_streaming"
        ? "StartStreaming"
        : command.type === "stop_streaming"
          ? "StopStreaming"
          : command.type === "cut"
            ? "Cut"
            : "Fade";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4_000);

  try {
    const url = new URL(`${baseUrl.replace(/\/$/, "")}/`);
    url.searchParams.set("Function", functionName);

    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `vMix command failed (${response.status}).`,
        code: "VMIX_COMMAND_FAILED",
      };
    }

    return fetchLiveVmixState(baseUrl);
  } catch {
    return {
      ok: false,
      error: "vMix command unreachable.",
      code: "VMIX_UNREACHABLE",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getVmixAdapterState(): Promise<VmixAdapterResult> {
  const baseUrl = process.env.VMIX_API_BASE_URL?.trim();

  if (!baseUrl) {
    const state = markVmixStale(mockVmixState);
    if (
      state.lastUpdatedAt &&
      Date.now() - new Date(state.lastUpdatedAt).getTime() > VMIX_STALE_THRESHOLD_MS
    ) {
      mockVmixState = { ...state, connectionStatus: "stale", isStale: true };
    }
    return { ok: true, state: mockVmixState };
  }

  return fetchLiveVmixState(baseUrl);
}

export async function runVmixAdapterCommand(
  command: VmixCommand,
): Promise<VmixAdapterResult> {
  const baseUrl = process.env.VMIX_API_BASE_URL?.trim();

  if (!baseUrl) {
    const state = applyMockCommand(command);
    return { ok: true, state: markVmixStale(state) };
  }

  return executeLiveVmixCommand(baseUrl, command);
}

export function resetMockVmixStateForTests(disconnected = false): void {
  mockVmixState = disconnected ? disconnectedMockState() : initialConnectedMockState();
}
