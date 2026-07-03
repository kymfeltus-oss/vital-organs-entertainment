import { NextRequest, NextResponse } from "next/server";
import {
  manifestCorsHeaderRecord,
  resolveClientPlaybackUrl,
} from "@/lib/live/manifest-env-fast-path";
import {
  resolveConfiguredAttendeePlaybackFromEnv,
  type ManifestExperienceKey,
} from "@/lib/live/manifest-dev-fallback";
import {
  resolveLiveManifestPlayback,
  resolveManifestCarrier,
} from "@/lib/live/resolve-manifest-playback";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { probeHlsManifest } from "@/lib/owner/hls-readiness";
import { resolveIvsChannelConfig } from "@/lib/owner/resolve-ivs-config";

const EXPERIENCE_KEYS: readonly ManifestExperienceKey[] = [
  "main_stage",
  "crowd_xp",
  "musician_xp",
  "prayer_layer",
];

function parseExperience(request: NextRequest): ManifestExperienceKey | null {
  const raw = request.nextUrl.searchParams.get("experience");
  if (!raw || raw.trim() === "") return "main_stage";

  const trimmed = raw.trim() as ManifestExperienceKey;
  return EXPERIENCE_KEYS.includes(trimmed) ? trimmed : null;
}

function jsonResponse(
  request: NextRequest,
  body: Record<string, unknown>,
  status = 200,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      ...manifestCorsHeaderRecord(request),
      // Short edge cache absorbs viewer-poll bursts (1 origin fetch per PoP per
      // few seconds instead of per-viewer) while keeping GO LIVE / STOP signals
      // fast to propagate. Kept short on purpose — a long TTL would delay the
      // live/offline transition for attendees. Vary: Origin so the reflected
      // CORS Allow-Origin header is cache-keyed per requesting origin.
      "Cache-Control": "public, max-age=0, s-maxage=3, stale-while-revalidate=12",
      Vary: "Origin",
    },
  });
}

type PlaybackCandidate = {
  source: "database" | "env";
  playbackUrl: string;
  activeSource: "primary";
};

function logPlaybackSelection(input: {
  selectedShowId: string;
  candidate: PlaybackCandidate | null;
  streamStatus: "offline" | "live";
  playerMountStatus: "ready" | "waiting";
  probeDetail?: string | null;
}): void {
  const ivs = resolveIvsChannelConfig();

  console.info("[stream/manifest] playback selection", {
    selectedShowId: input.selectedShowId,
    ivsChannelArn: ivs.channelArn,
    ivsPlaybackUrl: ivs.playbackUrl,
    streamStatus: input.streamStatus,
    candidateSource: input.candidate?.source ?? null,
    playbackUrl: input.candidate?.playbackUrl ?? null,
    playerMountStatus: input.playerMountStatus,
    probeDetail: input.probeDetail ?? null,
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: manifestCorsHeaderRecord(request),
  });
}

export async function GET(request: NextRequest) {
  const experience = parseExperience(request);
  if (!experience) {
    return jsonResponse(request, { success: false, error: "Unknown stream experience." }, 400);
  }

  const resolved = await resolveLiveManifestPlayback();
  const candidates: PlaybackCandidate[] = [];

  if (resolved.playbackUrl) {
    candidates.push({
      source: "database",
      playbackUrl: resolved.playbackUrl,
      activeSource: resolved.activeSource,
    });
  }

  const envPlaybackUrl =
    resolved.streamIsLive && experience === "main_stage"
      ? resolveConfiguredAttendeePlaybackFromEnv()
      : null;
  if (
    envPlaybackUrl &&
    !candidates.some((candidate) => candidate.playbackUrl === envPlaybackUrl)
  ) {
    candidates.push({
      source: "env",
      playbackUrl: envPlaybackUrl,
      activeSource: "primary",
    });
  }

  for (const candidate of candidates) {
    const probe = await probeHlsManifest(candidate.playbackUrl);
    const playerMountStatus = probe.manifestReachable ? "ready" : "waiting";

    logPlaybackSelection({
      selectedShowId: resolved.selectedShowId,
      candidate,
      streamStatus: resolved.streamIsLive ? "live" : "offline",
      playerMountStatus,
      probeDetail: probe.detail,
    });

    if (!probe.manifestReachable) {
      continue;
    }

    return jsonResponse(request, {
      success: true,
      activeExperience: experience,
      activeSource: candidate.activeSource,
      carrier: resolveManifestCarrier(candidate.activeSource),
      fallback: false,
      playbackUrl: resolveClientPlaybackUrl(request, candidate.playbackUrl),
    });
  }

  logPlaybackSelection({
    selectedShowId: resolved.selectedShowId || LIVE_STREAM_STATE_ID,
    candidate: null,
    streamStatus: resolved.streamIsLive ? "live" : "offline",
    playerMountStatus: "waiting",
    probeDetail: candidates.length ? "No validated HLS manifest candidate." : "No playback URL candidate.",
  });

  return jsonResponse(
    request,
    {
      success: false,
      error: "Stream not available yet.",
    },
    404,
  );
}
