import { NextResponse } from "next/server";
import { evaluateLiveAccessFromFlags, parseAccessContext, type LivePublishMode } from "@/lib/access";
import { isLiveAccessDevBypassEnabled } from "@/lib/access/live-dev-bypass";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveAttendeeUiPhase } from "@/lib/live/attendee-ui-phase";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state";
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

function buildStreamFlags(streamRow: Awaited<ReturnType<typeof loadOwnerStreamState>>["row"]) {
  const streamIsLive = streamRow?.is_live === true;

  // Resolve the attendee HLS URL from the row we already loaded (no extra query).
  // Informational only — the /live player sources playback from /api/stream/manifest;
  // this keeps the field truthful so it stops derailing debugging tools.
  const encoder = readEncoderConfigFromStreamPresets(streamRow?.audio_master_presets);
  const playbackUrl = streamIsLive
    ? resolveRestreamHlsUrl({
        showSetupHlsUrl: encoder.hlsPlaybackUrl,
        primary_playback_url: streamRow?.primary_playback_url,
        playback_url: streamRow?.playback_url,
      }) ?? ""
    : "";

  return {
    streamIsLive,
    attendeeUiPhase: resolveAttendeeUiPhase(streamRow),
    publishMode: normalizePublishMode(streamRow?.publish_mode),
    publisherChannel: streamRow?.publisher_channel ?? null,
    playbackUrl,
  };
}

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { row: streamRow, error: streamError } = await loadOwnerStreamState(admin);

    if (streamError && !streamRow) {
      console.error("Live stream state load failed:", streamError);
      return NextResponse.json(
        { error: "Unable to evaluate live access." },
        { status: 500 },
      );
    }

    const streamFlags = buildStreamFlags(streamRow);

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      if (isLiveAccessDevBypassEnabled()) {
        return NextResponse.json({
          authenticated: true,
          userId: "dev-live-bypass",
          email: "dev-live-bypass@awakening.local",
          isGuest: true,
          hasPaidPass: true,
          canViewStream: true,
          showStreamPaywall: false,
          showFullLockdown: false,
          ...streamFlags,
        });
      }
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const context = parseAccessContext(user);

    if (!context.email) {
      if (isLiveAccessDevBypassEnabled()) {
        return NextResponse.json({
          authenticated: true,
          userId: context.userId ?? "dev-live-bypass",
          email: "dev-live-bypass@awakening.local",
          isGuest: true,
          hasPaidPass: true,
          canViewStream: true,
          showStreamPaywall: false,
          showFullLockdown: false,
          ...streamFlags,
        });
      }
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const evaluation = evaluateLiveAccessFromFlags(
      context.email,
      context.isGuest,
      false,
    );

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
