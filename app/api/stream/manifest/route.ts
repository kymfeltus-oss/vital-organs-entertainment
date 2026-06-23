import { NextRequest, NextResponse } from "next/server";
import { fetchManifestStreamConfig } from "@/lib/live/fetch-manifest-stream-config";
import {
  buildDevManifestFallbackPayload,
  isDevManifestFallbackEnabled,
  type ManifestExperienceKey,
  type ManifestSuccessPayload,
} from "@/lib/live/manifest-dev-fallback";
import { isValidHlsUrl } from "@/lib/live/hls";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { parseAccessContext } from "@/lib/access";
import { ensureDevStreamPlaybackConfigured } from "@/lib/ops/ensure-dev-stream-playback";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type StreamSource = "primary" | "backup" | "offline";

const EXPERIENCE_KEYS: readonly ManifestExperienceKey[] = [
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
  camera_preview_hls_url: string | null;
};

type MainStageResolution = {
  playbackUrl: string;
  activeSource: "primary" | "backup";
};

function parseExperience(request: NextRequest): ManifestExperienceKey | null {
  const raw = request.nextUrl.searchParams.get("experience");

  if (raw === null || raw.trim() === "") {
    return "main_stage";
  }

  const trimmed = raw.trim() as ManifestExperienceKey;
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

function manifestJsonResponse(
  body: ManifestSuccessPayload | { error: string; success?: false },
  status = 200,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, max-age=30",
    },
  });
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

    if (isValidHlsUrl(config.camera_preview_hls_url)) {
      return {
        playbackUrl: config.camera_preview_hls_url.trim(),
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
  try {
    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from("stream_feeds")
      .select("playback_url")
      .eq("event_id", LIVE_STREAM_STATE_ID)
      .eq("feed_key", feedKey)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.warn("Experience feed lookup failed:", error.message);
      return null;
    }

    if (!isValidHlsUrl(data?.playback_url)) {
      return null;
    }

    return data.playback_url.trim();
  } catch (error) {
    console.warn("Experience feed lookup threw:", error);
    return null;
  }
}

async function loadManifestStreamConfig(): Promise<{
  config: LiveStreamConfigRow | null;
  error: string | null;
  selectUsed: string | null;
}> {
  try {
    if (process.env.NODE_ENV === "development") {
      try {
        await ensureDevStreamPlaybackConfigured();
      } catch (error) {
        console.warn("[stream/manifest] ensureDevStreamPlaybackConfigured failed:", error);
      }
    }

    const admin = getSupabaseAdmin();
    const result = await fetchManifestStreamConfig(admin);

    if (result.error || !result.config) {
      return {
        config: null,
        error: result.error ?? "Stream configuration row missing.",
        selectUsed: result.selectUsed,
      };
    }

    return {
      config: result.config as LiveStreamConfigRow,
      error: null,
      selectUsed: result.selectUsed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[stream/manifest] Configuration lookup failed:", message);
    return { config: null, error: message, selectUsed: null };
  }
}

async function respondWithDevFallback(
  userId: string,
  experience: ManifestExperienceKey,
  reason: string,
  clientIp: string,
  userAgent: string,
): Promise<NextResponse> {
  await logStreamAccess(userId, "allowed", `DEV_FALLBACK:${reason}`, clientIp, userAgent);
  return manifestJsonResponse(buildDevManifestFallbackPayload(experience, reason));
}

/**
 * Read-only manifest firewall — ticket-gated, HLS-validated upstream URL only.
 * In development, returns a public Mux test manifest when configuration is unavailable.
 */
export async function GET(request: NextRequest) {
  const clientIp = extractClientIp(request);
  const userAgent = extractUserAgent(request);
  let authenticatedUserId: string | null = null;
  let resolvedExperience: ManifestExperienceKey = "main_stage";

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

    authenticatedUserId = user.id;

    const context = parseAccessContext(user);

    if (!context.email) {
      await logStreamAccess(null, "denied", "UNAUTHENTICATED", clientIp, userAgent);
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const experience = parseExperience(request);
    resolvedExperience = experience ?? "main_stage";

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

    const { config, error: configError, selectUsed } = await loadManifestStreamConfig();

    if (configError || !config) {
      if (isDevManifestFallbackEnabled()) {
        return respondWithDevFallback(
          user.id,
          experience,
          configError ?? "config_unavailable",
          clientIp,
          userAgent,
        );
      }

      await logStreamAccess(
        user.id,
        "denied",
        "CONFIG_UNAVAILABLE",
        clientIp,
        userAgent,
      );
      return manifestJsonResponse(
        { error: "Stream manifest is temporarily unavailable." },
        503,
      );
    }

    if (!config.is_live || config.active_source === "offline") {
      if (isDevManifestFallbackEnabled()) {
        return respondWithDevFallback(user.id, experience, "not_live", clientIp, userAgent);
      }

      return manifestJsonResponse({ error: "The show is not live." }, 404);
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
        activeSource = config.active_source === "backup" ? "backup" : "primary";
      } else if (mainStage) {
        playbackUrl = mainStage.playbackUrl;
        activeSource = mainStage.activeSource;
      }
    }

    if (!playbackUrl || !activeSource) {
      if (isDevManifestFallbackEnabled()) {
        return respondWithDevFallback(
          user.id,
          experience,
          "source_unavailable",
          clientIp,
          userAgent,
        );
      }

      await logStreamAccess(
        user.id,
        "denied",
        "STREAM_SOURCE_UNAVAILABLE",
        clientIp,
        userAgent,
      );
      return manifestJsonResponse(
        { error: "Stream manifest is temporarily unavailable." },
        503,
      );
    }

    await logStreamAccess(user.id, "allowed", "SUCCESS", clientIp, userAgent);

    return manifestJsonResponse({
      success: true,
      playbackUrl,
      activeExperience: experience,
      activeSource,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Manifest proxy route error:", message);

    if (isDevManifestFallbackEnabled() && authenticatedUserId) {
      return respondWithDevFallback(
        authenticatedUserId,
        resolvedExperience,
        "unhandled_error",
        clientIp,
        userAgent,
      );
    }

    return manifestJsonResponse(
      { error: "Stream manifest is temporarily unavailable." },
      503,
    );
  }
}
