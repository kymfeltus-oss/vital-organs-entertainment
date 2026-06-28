import { NextResponse } from "next/server";
import {
  evaluateLiveAccessFromFlags,
  parseAccessContext,
  type LiveBroadcastCurrentState,
  type LivePublishMode,
} from "@/lib/access";
import { isLiveAccessDevBypassEnabled } from "@/lib/access/live-dev-bypass";
import { IMMINENT_LIVE_DURATION_SEC } from "@/lib/live/types";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state";

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

function normalizeBroadcastCurrentState(
  raw: unknown,
  streamIsLive: boolean,
): LiveBroadcastCurrentState {
  if (raw === "scheduled" || raw === "imminent_live" || raw === "live" || raw === "offline") {
    return raw;
  }
  if (streamIsLive) return "live";
  return "offline";
}

function buildStreamFlags(streamRow: Awaited<ReturnType<typeof loadOwnerStreamState>>["row"]) {
  const streamIsLive = streamRow?.is_live === true;
  const broadcastCurrentState = normalizeBroadcastCurrentState(
    streamRow?.current_state,
    streamIsLive,
  );

  return {
    streamIsLive,
    publishMode: normalizePublishMode(streamRow?.publish_mode),
    publisherChannel: streamRow?.publisher_channel ?? null,
    broadcastCurrentState,
    imminentLiveStartedAt:
      broadcastCurrentState === "imminent_live" && streamRow?.imminent_live_started_at
        ? streamRow.imminent_live_started_at
        : null,
    imminentLiveDurationSeconds: IMMINENT_LIVE_DURATION_SEC,
    concertTitle: streamRow?.concert_title ?? "The Awakening Experience",
    headlinerName: streamRow?.headliner_name ?? "Pastor David Jenkins",
    gatesLocked: streamRow?.gates_locked ?? false,
    preShowVipOnly: streamRow?.pre_show_vip_only ?? true,
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
          playbackUrl: "",
          devPlaybackOverride: true,
          isVip: true,
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
          playbackUrl: "",
          devPlaybackOverride: true,
          isVip: true,
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
      isVip: context.isVip,
      playbackUrl: "",
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
