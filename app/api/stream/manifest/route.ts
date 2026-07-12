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
      "Cache-Control": "public, max-age=2, stale-while-revalidate=5",
      Vary: "Origin",
    },
  });
}

type PlaybackCandidate = {
  source: "database" | "env";
  playbackUrl: string;
  activeSource: "primary";
};

type ManifestProbeFailure = {
  source: PlaybackCandidate["source"];
  playbackUrl: string;
  detail: string | null;
  invalidReason: string | null;
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

function buildManifestUnavailableError(
  streamIsLive: boolean,
  failures: ManifestProbeFailure[],
): string {
  if (!streamIsLive) {
    return "Stream not available yet.";
  }

  const primary = failures.find((failure) => failure.source === "database");
  if (primary?.detail) {
    return primary.detail;
  }

  if (failures.length > 0) {
    return failures[0]?.detail ?? "No validated HLS manifest candidate.";
  }

  return "Broadcast is live but no playback URL is configured.";
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
    resolved.streamIsLive &&
    experience === "main_stage" &&
    candidates.length === 0
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

  const streamStatus = resolved.streamIsLive ? "live" : "offline";
  const probeResults = await Promise.all(
    candidates.map(async (candidate) => ({
      candidate,
      probe: await probeHlsManifest(candidate.playbackUrl),
    })),
  );

  const failures: ManifestProbeFailure[] = [];

  for (const { candidate, probe } of probeResults) {
    const playerMountStatus = probe.manifestReachable ? "ready" : "waiting";

    logPlaybackSelection({
      selectedShowId: resolved.selectedShowId,
      candidate,
      streamStatus,
      playerMountStatus,
      probeDetail: probe.detail,
    });

    if (probe.manifestReachable) {
      return jsonResponse(request, {
        success: true,
        activeExperience: experience,
        activeSource: candidate.activeSource,
        carrier: resolveManifestCarrier(candidate.activeSource),
        fallback: false,
        playbackUrl: resolveClientPlaybackUrl(request, candidate.playbackUrl),
      });
    }

    failures.push({
      source: candidate.source,
      playbackUrl: candidate.playbackUrl,
      detail: probe.detail,
      invalidReason: probe.invalidReason,
    });
  }

  logPlaybackSelection({
    selectedShowId: resolved.selectedShowId || LIVE_STREAM_STATE_ID,
    candidate: null,
    streamStatus,
    playerMountStatus: "waiting",
    probeDetail: failures.length
      ? "No validated HLS manifest candidate."
      : "No playback URL candidate.",
  });

  return jsonResponse(
    request,
    {
      success: false,
      error: buildManifestUnavailableError(resolved.streamIsLive, failures),
      streamStatus,
      probeFailures: failures,
    },
    404,
  );
}
