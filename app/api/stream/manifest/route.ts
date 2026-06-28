import { NextRequest, NextResponse } from "next/server";
import type { ManifestExperienceKey } from "@/lib/live/manifest-dev-fallback";
import { buildProductionEnvManifestPayload } from "@/lib/live/manifest-dev-fallback";
import {
  manifestCorsHeaderRecord,
  resolveClientPlaybackUrl,
  shouldUseLocalHlsRelay,
} from "@/lib/live/manifest-env-fast-path";
import { logManifestResolution } from "@/lib/live/manifest-logging";
import { resolveLiveManifestPlayback } from "@/lib/live/resolve-manifest-playback";

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
      "Cache-Control": "no-store, max-age=0",
    },
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

  if (resolved.playbackUrl) {
    const clientPlaybackUrl = await resolveClientPlaybackUrl(request, resolved.playbackUrl);
    const usedRelay = shouldUseLocalHlsRelay(request, resolved.playbackUrl);

    logManifestResolution({
      source: resolved.resolutionSource,
      isLive: resolved.isLive,
      activeSource: resolved.activeSource,
      upstreamUrl: resolved.playbackUrl,
      clientPlaybackUrl,
      usedRelay,
      fromDatabase: resolved.fromDatabase,
    });

    return jsonResponse(request, {
      success: true,
      activeExperience: experience,
      activeSource: resolved.activeSource,
      fallback: false,
      playbackUrl: clientPlaybackUrl,
      resolutionSource: resolved.resolutionSource,
      isLive: resolved.isLive,
    });
  }

  const envPayload = buildProductionEnvManifestPayload(experience);
  if (envPayload?.playbackUrl) {
    const clientPlaybackUrl = await resolveClientPlaybackUrl(request, envPayload.playbackUrl);
    const usedRelay = shouldUseLocalHlsRelay(request, envPayload.playbackUrl);

    logManifestResolution({
      source: "env",
      isLive: resolved.isLive,
      activeSource: envPayload.activeSource,
      upstreamUrl: envPayload.playbackUrl,
      clientPlaybackUrl,
      usedRelay,
      fromDatabase: false,
    });

    return jsonResponse(request, {
      ...envPayload,
      playbackUrl: clientPlaybackUrl,
      resolutionSource: "env",
      isLive: resolved.isLive,
    });
  }

  logManifestResolution({
    source: "none",
    isLive: resolved.isLive,
    activeSource: resolved.activeSource,
    upstreamUrl: null,
    clientPlaybackUrl: null,
    usedRelay: false,
    fromDatabase: false,
  });

  return jsonResponse(
    request,
    {
      success: false,
      error:
        "Live is open, but no valid HLS playback URL is configured. Set ATTENDEE_PLAYBACK_HLS_URL to your Restream .m3u8 (restart dev server) or go live with primary_playback_url in Supabase.",
    },
    404,
  );
}
