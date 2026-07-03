import { NextResponse } from "next/server";
import { evaluateLiveAccessFromFlags, parseAccessContext, type LivePublishMode } from "@/lib/access";
import { isLiveAccessDevBypassEnabled } from "@/lib/access/live-dev-bypass";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveAttendeeUiPhase } from "@/lib/live/attendee-ui-phase";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { probeHlsManifest } from "@/lib/owner/hls-readiness";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state";
import { resolveIvsChannelConfig } from "@/lib/owner/resolve-ivs-config";
import { resolveRestreamHlsUrl } from "@/lib/owner/restream-playback";
import { readEncoderConfigFromStreamPresets } from "@/lib/owner/resolve-show-encoder-config";

function normalizePublishMode(raw: unknown): LivePublishMode {
  if (
    raw === "external_hls" ||
    raw === "rtmp_encoder" ||
    raw === "browser_camera"
  ) {
    return raw;
  }
  return "none";
}

async function buildStreamFlags(streamRow: Awaited<ReturnType<typeof loadOwnerStreamState>>["row"]) {
  const streamIsLive = streamRow?.is_live === true;
  const publishMode = normalizePublishMode(streamRow?.publish_mode);

  // Resolve the attendee HLS URL from the row we already loaded (no extra query).
  // Informational only — the /live player sources playback from /api/stream/manifest;
  // this keeps the field truthful so it stops derailing debugging tools.
  const encoder = readEncoderConfigFromStreamPresets(streamRow?.audio_master_presets);
  const candidatePlaybackUrl = streamIsLive && publishMode !== "browser_camera"
    ? resolveRestreamHlsUrl({
        showSetupHlsUrl: encoder.hlsPlaybackUrl,
        primary_playback_url: streamRow?.primary_playback_url,
        playback_url: streamRow?.playback_url,
      }) ?? ""
    : "";
  const probe = candidatePlaybackUrl ? await probeHlsManifest(candidatePlaybackUrl) : null;
  const playbackUrl = probe?.manifestReachable ? candidatePlaybackUrl : "";
  const ivs = resolveIvsChannelConfig();

  console.info("[access/live] playback selection", {
    selectedShowId: streamRow?.id ?? LIVE_STREAM_STATE_ID,
    ivsChannelArn: ivs.channelArn,
    ivsPlaybackUrl: ivs.playbackUrl,
    streamStatus: streamIsLive ? "live" : "offline",
    publishMode,
    playbackUrl: candidatePlaybackUrl || null,
    playerMountStatus: playbackUrl ? "ready" : "waiting",
    probeDetail: probe?.detail ?? null,
  });

  return {
    streamIsLive,
    attendeeUiPhase: resolveAttendeeUiPhase(streamRow),
    publishMode,
    publisherChannel: streamRow?.publisher_channel ?? null,
    playbackUrl,
  };
}

export async function GET() {
  try {
    const streamStatePromise = loadOwnerStreamState(getSupabaseAdmin());
    const devBypassEnabled = isLiveAccessDevBypassEnabled();

    if (devBypassEnabled) {
      const { row: streamRow, error: streamError } = await streamStatePromise;

      if (streamError && !streamRow) {
        console.error("Live stream state load failed:", streamError);
        return NextResponse.json(
          { error: "Unable to evaluate live access." },
          { status: 500 },
        );
      }

      return NextResponse.json({
        authenticated: true,
        userId: "dev-live-bypass",
        email: "dev-live-bypass@awakening.local",
        isGuest: true,
        hasPaidPass: true,
        canViewStream: true,
        showStreamPaywall: false,
        showFullLockdown: false,
        ...(await buildStreamFlags(streamRow)),
      });
    }

    const supabase = await createServerSupabaseClient();
    const userPromise = supabase.auth.getUser();

    const [
      { row: streamRow, error: streamError },
      {
        data: { user },
        error: userError,
      },
    ] = await Promise.all([streamStatePromise, userPromise]);

    if (streamError && !streamRow) {
      console.error("Live stream state load failed:", streamError);
      return NextResponse.json(
        { error: "Unable to evaluate live access." },
        { status: 500 },
      );
    }

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const context = parseAccessContext(user);

    if (!context.email) {
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const evaluation = evaluateLiveAccessFromFlags(
      context.email,
      context.isGuest,
      false,
    );
    const streamFlags = await buildStreamFlags(streamRow);

    return NextResponse.json({
      ...evaluation,
      userId: context.userId,
      ...streamFlags,
    });
  } catch (error) {
    console.error("Live access route error:", error);
    return NextResponse.json(
      { error: "Unable to evaluate live access." },
      { status: 500 },
    );
  }
}
