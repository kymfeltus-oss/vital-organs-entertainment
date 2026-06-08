import { NextRequest, NextResponse } from "next/server";
import { isValidHlsUrl } from "@/lib/live/hls";
import { LIVE_STREAM_ACCESS_PRODUCT_IDS } from "@/lib/merch/catalog";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { parseAccessContext } from "@/lib/access";
import { isLiveAccessDevBypassEnabled } from "@/lib/access/live-dev-bypass";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type StreamSource = "primary" | "backup" | "offline";

type ExperienceKey = "main_stage" | "crowd_xp" | "musician_xp" | "prayer_layer";

const EXPERIENCE_KEYS: readonly ExperienceKey[] = [
  "main_stage",
  "crowd_xp",
  "musician_xp",
  "prayer_layer",
];

type LiveStreamConfigRow = {
  is_live: boolean;
  active_source: StreamSource;
  playback_url: string | null;
  primary_playback_url: string | null;
  backup_playback_url: string | null;
};

type MainStageResolution = {
  playbackUrl: string;
  activeSource: "primary" | "backup";
};

function parseExperience(request: NextRequest): ExperienceKey | null {
  const raw = request.nextUrl.searchParams.get("experience");

  if (raw === null || raw.trim() === "") {
    return "main_stage";
  }

  const trimmed = raw.trim() as ExperienceKey;
  return EXPERIENCE_KEYS.includes(trimmed) ? trimmed : null;
}

function extractClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

function extractUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent")?.trim() ?? "unknown";
}

async function logStreamAccess(
  userId: string | null,
  outcome: "allowed" | "denied",
  reason: string,
  clientIp: string,
  userAgent: string,
): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    await admin.rpc("log_stream_access", {
      p_user_id: userId,
      p_result: outcome,
      p_reason: reason,
      p_ip: clientIp,
      p_user_agent: userAgent,
    });
  } catch (error) {
    console.error("log_stream_access failed:", error);
  }
}

function resolveMainStagePlaybackUrl(
  config: LiveStreamConfigRow,
): MainStageResolution | null {
  if (config.active_source === "primary") {
    if (isValidHlsUrl(config.primary_playback_url)) {
      return {
        playbackUrl: config.primary_playback_url.trim(),
        activeSource: "primary",
      };
    }

    if (isValidHlsUrl(config.playback_url)) {
      return {
        playbackUrl: config.playback_url.trim(),
        activeSource: "primary",
      };
    }

    return null;
  }

  if (config.active_source === "backup") {
    if (isValidHlsUrl(config.backup_playback_url)) {
      return {
        playbackUrl: config.backup_playback_url.trim(),
        activeSource: "backup",
      };
    }

    if (isValidHlsUrl(config.playback_url)) {
      return {
        playbackUrl: config.playback_url.trim(),
        activeSource: "backup",
      };
    }

    return null;
  }

  return null;
}

async function resolveExperienceFeedPlaybackUrl(
  feedKey: "crowd_xp" | "musician_xp" | "prayer_layer",
): Promise<string | null> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("stream_feeds")
    .select("playback_url")
    .eq("event_id", LIVE_STREAM_STATE_ID)
    .eq("feed_key", feedKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Experience feed lookup failed:", error.message);
    return null;
  }

  if (!isValidHlsUrl(data?.playback_url)) {
    return null;
  }

  return data.playback_url.trim();
}

/**
 * Read-only manifest firewall — ticket-gated, HLS-validated upstream URL only.
 */
export async function GET(request: NextRequest) {
  const clientIp = extractClientIp(request);
  const userAgent = extractUserAgent(request);

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      await logStreamAccess(null, "denied", "UNAUTHENTICATED", clientIp, userAgent);
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const context = parseAccessContext(user);

    if (!context.email) {
      await logStreamAccess(null, "denied", "UNAUTHENTICATED", clientIp, userAgent);
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const normalizedEmail = context.email.trim().toLowerCase();

    const devBypass = isLiveAccessDevBypassEnabled();

    if (!devBypass) {
      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select("id, status, product_type")
        .eq("email", normalizedEmail)
        .eq("status", "paid")
        .in("product_type", [...LIVE_STREAM_ACCESS_PRODUCT_IDS])
        .limit(1);

      if (orderError) {
        console.error("Manifest paywall verification failed:", orderError.message);
        return NextResponse.json(
          { error: "Unable to verify stream access." },
          { status: 500 },
        );
      }

      if (!Array.isArray(orders) || orders.length === 0) {
        await logStreamAccess(user.id, "denied", "NO_PAID_TICKET", clientIp, userAgent);
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
    }

    const experience = parseExperience(request);

    if (!experience) {
      await logStreamAccess(
        user.id,
        "denied",
        "INVALID_EXPERIENCE",
        clientIp,
        userAgent,
      );
      return NextResponse.json(
        { success: false, error: "INVALID_EXPERIENCE" },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();

    const { data: streamState, error: streamError } = await admin
      .from("live_stream_state")
      .select(
        "is_live, active_source, playback_url, primary_playback_url, backup_playback_url",
      )
      .eq("id", LIVE_STREAM_STATE_ID)
      .maybeSingle();

    if (streamError) {
      console.error("Manifest stream config load failed:", streamError.message);
      return NextResponse.json(
        { error: "Unable to load stream configuration." },
        { status: 500 },
      );
    }

    const config = streamState as LiveStreamConfigRow | null;

    if (!config?.is_live || config.active_source === "offline") {
      return NextResponse.json(
        { error: "The show is not live." },
        { status: 404 },
      );
    }

    const mainStage = resolveMainStagePlaybackUrl(config);

    let playbackUrl: string | null = null;
    let activeSource: "primary" | "backup" | null = null;

    if (experience === "main_stage") {
      if (mainStage) {
        playbackUrl = mainStage.playbackUrl;
        activeSource = mainStage.activeSource;
      }
    } else {
      const feedPlaybackUrl = await resolveExperienceFeedPlaybackUrl(experience);

      if (feedPlaybackUrl) {
        playbackUrl = feedPlaybackUrl;
        activeSource =
          config.active_source === "backup" ? "backup" : "primary";
      } else if (mainStage) {
        playbackUrl = mainStage.playbackUrl;
        activeSource = mainStage.activeSource;
      }
    }

    if (!playbackUrl || !activeSource) {
      await logStreamAccess(
        user.id,
        "denied",
        "STREAM_SOURCE_UNAVAILABLE",
        clientIp,
        userAgent,
      );
      return NextResponse.json(
        { error: "Stream manifest is temporarily unavailable." },
        { status: 503 },
      );
    }

    await logStreamAccess(user.id, "allowed", "SUCCESS", clientIp, userAgent);

    return NextResponse.json(
      {
        success: true,
        playbackUrl,
        activeExperience: experience,
        activeSource,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30",
        },
      },
    );
  } catch (error) {
    console.error("Manifest proxy route error:", error);
    return NextResponse.json(
      { error: "Unable to authorize stream manifest." },
      { status: 500 },
    );
  }
}
