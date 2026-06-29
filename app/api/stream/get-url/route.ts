import { NextResponse } from "next/server";
import { resolveIvsChannelPlaybackUrl } from "@/lib/live/resolve-ivs-channel-playback";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const result = await resolveIvsChannelPlaybackUrl();

  if (!result.playbackUrl) {
    return NextResponse.json(
      {
        success: false,
        playbackUrl: null,
        source: result.source,
        region: result.region,
        streamState: result.streamState,
        error: result.error ?? "Failed to fetch stream playback URL.",
        performanceMetricMs: Date.now() - startedAt,
      },
      { status: result.streamState === "offline" ? 409 : result.source === "unconfigured" ? 503 : 502 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      playbackUrl: result.playbackUrl,
      source: result.source,
      region: result.region,
      streamState: result.streamState,
      performanceMetricMs: Date.now() - startedAt,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
