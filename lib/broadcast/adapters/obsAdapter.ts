/**
 * OBS WebSocket adapter — backup production path.
 * Live connection is prepared but not enabled until OBS_WEBSOCKET_URL is configured
 * and obs-websocket-js (or equivalent) is wired in a follow-up pass.
 */

import {
  getObsWebSocketPassword,
  getObsWebSocketUrl,
  isBroadcastDevMode,
} from "@/lib/broadcast/config";
import { createMockObsSnapshot } from "@/lib/broadcast/adapters/mockSnapshots";
import type { ObsAdapterSnapshot } from "@/lib/broadcast/adapters/types";

function unavailableSnapshot(error: string): ObsAdapterSnapshot {
  return {
    ok: false,
    source: "unavailable",
    connected: false,
    error,
    fetchedAt: new Date().toISOString(),
    scenes: [],
    currentScene: null,
    previewScene: null,
    streaming: false,
    recording: false,
  };
}

/**
 * Future: connect via obs-websocket-js using getObsWebSocketUrl().
 * For now returns structured unavailable/live-placeholder based on env.
 */
export async function getObsAdapterSnapshot(): Promise<ObsAdapterSnapshot> {
  const url = getObsWebSocketUrl();
  const password = getObsWebSocketPassword();

  if (!url) {
    if (isBroadcastDevMode()) {
      return createMockObsSnapshot();
    }
    return unavailableSnapshot("OBS_WEBSOCKET_URL is not configured.");
  }

  // Prepared hook — real WebSocket session lands here.
  void password;

  if (isBroadcastDevMode()) {
    return {
      ...createMockObsSnapshot(),
      source: "mock",
      error: "OBS WebSocket live bridge pending — showing dev snapshot.",
    };
  }

  return unavailableSnapshot(
    "OBS WebSocket bridge not connected yet. Set OBS_WEBSOCKET_URL and enable the OBS adapter client.",
  );
}

export type ObsCommandRequest =
  | { action: "set_preview_scene"; sceneName: string }
  | { action: "set_program_scene"; sceneName: string }
  | { action: "toggle_stream" }
  | { action: "toggle_record" };

export async function runObsBroadcastCommand(
  _request: ObsCommandRequest,
): Promise<ObsAdapterSnapshot> {
  return getObsAdapterSnapshot();
}
