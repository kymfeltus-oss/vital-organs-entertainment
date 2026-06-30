/** Client-side probe for dev HLS relay offline/upstream failures. */
export type RelayPlaybackProbeState = "ready" | "offline" | "upstream_error" | "skipped";

export async function probeRelayPlaybackState(
  playbackUrl: string,
): Promise<RelayPlaybackProbeState> {
  if (!playbackUrl.includes("/api/stream/relay")) {
    return "skipped";
  }

  try {
    const response = await fetch(playbackUrl, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (response.ok) {
      return "ready";
    }

    const playbackState = response.headers.get("X-Relay-Playback-State")?.trim();
    if (playbackState === "offline") {
      return "offline";
    }

    return "upstream_error";
  } catch {
    return "upstream_error";
  }
}

export function relayOfflineUserMessage(): string {
  return "The backup live stream is offline or still starting. Waiting for the broadcast signal...";
}
