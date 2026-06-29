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
import { isAmazonIvsPlaybackUrl } from "@/lib/live/ivs-playback-url";
import { resolveIvsChannelPlaybackUrl } from "@/lib/live/resolve-ivs-channel-playback";
import { parseAccessContext } from "@/lib/access";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const EXPERIENCE_KEYS: readonly ManifestExperienceKey[] = [
  "main_stage",
  "crowd_xp",
  "musician_xp",
  "prayer_layer",
];

type OwnerVideoRoutingManifestState = {
  eventId: string;
  activeProgramChannelId: string | null;
  transitionType: "CUT" | "AUTO_FADE";
  updatedAt: string | null;
  restreamTargets: {
    twitch: boolean;
    youtube: boolean;
    facebook: boolean;
  };
  configured: boolean;
};

type OwnerVideoRoutingRow = {
  event_id: string | null;
  active_program_channel_id: string | null;
  transition_type: string | null;
  twitch_restream_active: boolean | null;
  youtube_restream_active: boolean | null;
  facebook_restream_active: boolean | null;
  updated_at: string | null;
};

type ShowSetupAccessConfig = {
  preShowVipOnly: boolean;
  gateType: string | null;
  monetizationEnabled: boolean;
  allowedGateTypes: string[];
  warning: string | null;
};

type OwnerSessionManifestState = {
  id: string | null;
  isLive: boolean;
  currentState: "idle" | "offline" | "scheduled" | "imminent_live" | "live";
  publishMode: string;
  activeSource: "primary" | "backup" | "offline";
  imminentLiveStartedAt: string | null;
  updatedAt: string | null;
};

type OwnerSessionManifestRow = {
  id: string | null;
  is_live: boolean | null;
  current_state: string | null;
  studio_engine_mode: string | null;
  active_source: string | null;
  imminent_live_started_at: string | null;
  updated_at: string | null;
};

type ShowSetupStreamRow = {
  audio_master_presets: unknown;
};

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

function normalizeRouting(row: OwnerVideoRoutingRow | null): OwnerVideoRoutingManifestState {
  const activeProgramChannelId =
    typeof row?.active_program_channel_id === "string" && row.active_program_channel_id.trim()
      ? row.active_program_channel_id.trim()
      : null;
  const transitionType = row?.transition_type === "AUTO_FADE" ? "AUTO_FADE" : "CUT";

  return {
    eventId: row?.event_id?.trim() || "300-awakening",
    activeProgramChannelId,
    transitionType,
    updatedAt: typeof row?.updated_at === "string" ? row.updated_at : null,
    restreamTargets: {
      twitch: row?.twitch_restream_active === true,
      youtube: row?.youtube_restream_active === true,
      facebook: row?.facebook_restream_active === true,
    },
    configured: Boolean(activeProgramChannelId),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseBodyExperience(value: unknown): ManifestExperienceKey | null {
  if (typeof value !== "string" || value.trim() === "") return "main_stage";
  const trimmed = value.trim() as ManifestExperienceKey;
  return EXPERIENCE_KEYS.includes(trimmed) ? trimmed : null;
}

function parseEventId(value: unknown): string {
  if (typeof value !== "string") return "300-awakening";
  const cleaned = value.trim();
  if (!/^[a-zA-Z0-9_-]{3,80}$/.test(cleaned)) return "300-awakening";
  return cleaned;
}

function normalizeTicketTier(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return normalized ? normalized : null;
}

function isMissingTableError(message: string): boolean {
  return message.includes("42P01") || /relation .+ does not exist/i.test(message);
}

function deriveGateType(showSetup: Record<string, unknown>): string | null {
  const gateType = showSetup.gateType ?? showSetup.gate_type;
  return typeof gateType === "string" && gateType.trim() ? gateType.trim().toUpperCase() : null;
}

function deriveAllowedGateTypes(showSetup: Record<string, unknown>, gateType: string | null): string[] {
  const rawAccessTiers = showSetup.accessTiers ?? showSetup.access_tiers;
  if (Array.isArray(rawAccessTiers)) {
    return rawAccessTiers
      .map((tier) => (typeof tier === "string" ? tier.trim().toUpperCase() : ""))
      .filter(Boolean);
  }

  if (gateType) return [gateType];
  return [];
}

async function loadShowSetupAccessConfig(eventId: string): Promise<ShowSetupAccessConfig> {
  const admin = getSupabaseAdmin();
  const warnings: string[] = [];
  const [streamResult, presetResult] = await Promise.all([
    admin
      .from("live_stream_state")
      .select("audio_master_presets")
      .eq("id", "current_event")
      .maybeSingle(),
    admin
      .from("audio_master_presets")
      .select("show_setup")
      .eq("event_id", eventId)
      .maybeSingle(),
  ]);

  if (streamResult.error) warnings.push(streamResult.error.message);
  if (presetResult.error) warnings.push(presetResult.error.message);

  const streamRow = (streamResult.data ?? null) as ShowSetupStreamRow | null;
  const streamAudioPresets = asRecord(streamRow?.audio_master_presets);
  const streamSetup = asRecord(streamAudioPresets.show_setup);
  const audioPresetSetup = asRecord(
    (presetResult.data as { show_setup?: unknown } | null)?.show_setup,
  );
  const showSetup = {
    ...streamSetup,
    ...audioPresetSetup,
  };
  const gateType = deriveGateType(showSetup);
  return {
    preShowVipOnly: false,
    gateType,
    monetizationEnabled:
      showSetup.monetizationEnabled === true || showSetup.monetization_enabled === true,
    allowedGateTypes: deriveAllowedGateTypes(showSetup, gateType),
    warning: warnings.length > 0 ? warnings.join(" | ") : null,
  };
}

async function loadVerifiedTicketTier(
  eventId: string,
  userId: string,
  email: string | null,
): Promise<{ ticketTier: string | null; warning: string | null }> {
  const admin = getSupabaseAdmin();

  try {
    const { data, error } = await admin
      .from("attendee_registry")
      .select("ticket_tier")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error.message)) {
        return { ticketTier: null, warning: null };
      }
      return { ticketTier: null, warning: error.message };
    }

    const ticketTier = normalizeTicketTier((data as { ticket_tier?: unknown } | null)?.ticket_tier);
    if (ticketTier) return { ticketTier, warning: null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to inspect attendee ticket tier.";
    if (!isMissingTableError(message)) return { ticketTier: null, warning: message };
  }

  if (!email) return { ticketTier: null, warning: null };

  try {
    const { data, error } = await admin
      .from("attendee_registry")
      .select("ticket_tier")
      .eq("event_id", eventId)
      .eq("email", email)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error.message)) {
        return { ticketTier: null, warning: null };
      }
      return { ticketTier: null, warning: error.message };
    }

    return {
      ticketTier: normalizeTicketTier((data as { ticket_tier?: unknown } | null)?.ticket_tier),
      warning: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to inspect attendee ticket tier.";
    return {
      ticketTier: null,
      warning: isMissingTableError(message) ? null : message,
    };
  }
}

async function loadOwnerVideoRouting(eventId = "300-awakening"): Promise<{
  routing: OwnerVideoRoutingManifestState;
  warning: string | null;
}> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("owner_video_routing")
      .select(
        "event_id, active_program_channel_id, transition_type, twitch_restream_active, youtube_restream_active, facebook_restream_active, updated_at",
      )
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) {
      return {
        routing: normalizeRouting(null),
        warning: error.message,
      };
    }

    return {
      routing: normalizeRouting((data ?? null) as OwnerVideoRoutingRow | null),
      warning: null,
    };
  } catch (error) {
    return {
      routing: normalizeRouting(null),
      warning: error instanceof Error ? error.message : "Unable to load owner video routing.",
    };
  }
}

async function loadOwnerSessionManifestState(): Promise<{
  session: OwnerSessionManifestState;
  warning: string | null;
}> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("live_stream_state")
    .select("id, is_live, current_state, studio_engine_mode, active_source, imminent_live_started_at, updated_at")
    .eq("id", "current_event")
    .maybeSingle();

  const row = (data ?? null) as OwnerSessionManifestRow | null;

  return {
    session: {
      id: row?.id ?? null,
      isLive: row?.is_live === true,
      currentState:
        row?.current_state === "offline" ||
        row?.current_state === "scheduled" ||
        row?.current_state === "imminent_live" ||
        row?.current_state === "live"
          ? row.current_state
          : "idle",
      publishMode: row?.studio_engine_mode || "none",
      activeSource: row?.active_source === "backup" || row?.active_source === "primary"
        ? row.active_source
        : "offline",
      imminentLiveStartedAt: row?.imminent_live_started_at ?? null,
      updatedAt: row?.updated_at ?? null,
    },
    warning: error?.message ?? null,
  };
}

async function shouldRejectEnvPayload(playbackUrl: string): Promise<string | null> {
  if (!isAmazonIvsPlaybackUrl(playbackUrl)) return null;

  const ivsPlayback = await resolveIvsChannelPlaybackUrl();
  if (ivsPlayback.playbackUrl) return null;

  return null;
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

  const [{ routing, warning: routingWarning }, { session, warning: sessionWarning }, resolved] = await Promise.all([
    loadOwnerVideoRouting(),
    loadOwnerSessionManifestState(),
    resolveLiveManifestPlayback(),
  ]);

  if (resolved.playbackUrl) {
    const clientPlaybackUrl = await resolveClientPlaybackUrl(request, resolved.playbackUrl);
    const usedRelay = shouldUseLocalHlsRelay(request, resolved.playbackUrl);
    const isLive = resolved.isLive || session.isLive;

    logManifestResolution({
      source: resolved.resolutionSource,
      isLive,
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
      manifestUrl: clientPlaybackUrl,
      resolutionSource: resolved.resolutionSource,
      isLive,
      streamIsLive: isLive,
      broadcastCurrentState: session.currentState,
      publishMode: session.publishMode,
      playbackPending: false,
      ownerSession: session,
      ownerVideoRouting: routing,
      warnings: [routingWarning, sessionWarning].filter(
        (warning): warning is string => typeof warning === "string" && warning.trim().length > 0,
      ),
    });
  }

  const envPayload = buildProductionEnvManifestPayload(experience);
  if (envPayload?.playbackUrl) {
    const envRejectReason = await shouldRejectEnvPayload(envPayload.playbackUrl);
    if (envRejectReason) {
      return jsonResponse(
        request,
        {
          success: false,
          error: envRejectReason,
          isLive: false,
          playbackPending: false,
          activeExperience: experience,
          activeSource: "backup",
          broadcastCurrentState: session.currentState,
          publishMode: session.publishMode,
          ownerSession: session,
          ownerVideoRouting: routing,
          warnings: [routingWarning, sessionWarning, envRejectReason].filter(
            (warning): warning is string => typeof warning === "string" && warning.trim().length > 0,
          ),
        },
        409,
      );
    }

    const clientPlaybackUrl = await resolveClientPlaybackUrl(request, envPayload.playbackUrl);
    const usedRelay = shouldUseLocalHlsRelay(request, envPayload.playbackUrl);
    const isLive = resolved.isLive || session.isLive;

    logManifestResolution({
      source: "env",
      isLive,
      activeSource: envPayload.activeSource,
      upstreamUrl: envPayload.playbackUrl,
      clientPlaybackUrl,
      usedRelay,
      fromDatabase: false,
    });

    return jsonResponse(request, {
      ...envPayload,
      playbackUrl: clientPlaybackUrl,
      manifestUrl: clientPlaybackUrl,
      resolutionSource: "env",
      isLive,
      streamIsLive: isLive,
      broadcastCurrentState: session.currentState,
      publishMode: session.publishMode,
      playbackPending: false,
      ownerSession: session,
      ownerVideoRouting: routing,
      warnings: [routingWarning, sessionWarning].filter(
        (warning): warning is string => typeof warning === "string" && warning.trim().length > 0,
      ),
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
        routing.configured
          ? "A production camera route is selected, but no valid HLS playback URL is configured in live_stream_state or the environment."
          : "Live is open, but no valid HLS playback URL is configured. Set ATTENDEE_PLAYBACK_HLS_URL to your Restream .m3u8 (restart dev server) or go live with primary_playback_url in Supabase.",
      isLive: false,
      streamIsLive: false,
      broadcastCurrentState: session.currentState,
      publishMode: session.publishMode,
      playbackPending: routing.configured || session.currentState === "imminent_live",
      ownerSession: session,
      ownerVideoRouting: routing,
      warnings: [routingWarning, sessionWarning].filter(
        (warning): warning is string => typeof warning === "string" && warning.trim().length > 0,
      ),
    },
    404,
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const eventId = parseEventId(body.eventId);
  const experience = parseBodyExperience(body.experience);
  const requestedUserId = typeof body.userId === "string" ? body.userId.trim() : null;
  if (!experience) {
    return jsonResponse(request, { success: false, error: "Unknown stream experience." }, 400);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonResponse(
      request,
      {
        success: false,
        error: "Unauthenticated session token.",
        streamIsLive: false,
        canViewStream: false,
        broadcastCurrentState: "idle",
        performanceMetricMs: Date.now() - startTime,
      },
      401,
    );
  }

  const accessContext = parseAccessContext(user);
  const [
    { routing, warning: routingWarning },
    { session, warning: sessionWarning },
    resolved,
    accessConfig,
    ticketResult,
  ] =
    await Promise.all([
      loadOwnerVideoRouting(eventId),
      loadOwnerSessionManifestState(),
      resolveLiveManifestPlayback(),
      loadShowSetupAccessConfig(eventId),
      loadVerifiedTicketTier(eventId, user.id, accessContext.email),
    ]);

  const ticketTier = ticketResult.ticketTier;
  const isVip =
    accessContext.isVip ||
    ticketTier === "VIP" ||
    ticketTier === "STAFF" ||
    ticketTier === "OWNER";
  const hasResolvedPlaybackUrl = typeof resolved.playbackUrl === "string" && resolved.playbackUrl.trim() !== "";
  const activeRoutingReady = Boolean(routing.activeProgramChannelId);
  const streamIsLive = hasResolvedPlaybackUrl && (resolved.isLive || session.isLive);
  const broadcastCurrentState: "idle" | "imminent_live" | "live" | "ended" =
    streamIsLive
      ? "live"
      : session.currentState === "imminent_live"
        ? "imminent_live"
        : session.currentState === "live" && activeRoutingReady
          ? "imminent_live"
          : session.currentState === "offline"
            ? "ended"
            : "idle";
  const resolvedCountdownTimestamp =
    session.imminentLiveStartedAt ??
    routing.updatedAt ??
    (broadcastCurrentState !== "idle" ? new Date().toISOString() : null);

  let canViewStream = false;
  let systemMessage = "Stream is loading.";

  if (activeRoutingReady && !hasResolvedPlaybackUrl) {
    systemMessage =
      "Broadcast route is selected, but playback media is still loading. Waiting for a valid HLS URL.";
  } else if (!streamIsLive) {
    systemMessage = "Broadcast stream is currently offline.";
  } else {
    canViewStream = true;
    systemMessage = "Stream connection successfully authorized.";
  }

  const clientPlaybackUrl =
    canViewStream && hasResolvedPlaybackUrl
      ? await resolveClientPlaybackUrl(request, resolved.playbackUrl)
      : "";
  const usedRelay =
    canViewStream && hasResolvedPlaybackUrl
      ? shouldUseLocalHlsRelay(request, resolved.playbackUrl)
      : false;

  logManifestResolution({
    source: resolved.resolutionSource,
    isLive: streamIsLive,
    activeSource: resolved.activeSource,
    upstreamUrl: resolved.playbackUrl,
    clientPlaybackUrl: clientPlaybackUrl || null,
    usedRelay,
    fromDatabase: resolved.fromDatabase,
  });

  const warnings = [
    routingWarning,
    sessionWarning,
    accessConfig.warning,
    ticketResult.warning,
    requestedUserId && requestedUserId !== user.id
      ? "Posted userId did not match the authenticated Supabase session and was ignored."
      : null,
  ].filter(
    (warning): warning is string => typeof warning === "string" && warning.trim().length > 0,
  );
  const durationMs = Date.now() - startTime;

  return jsonResponse(request, {
    success: true,
    activeExperience: experience,
    activeSource: resolved.activeSource,
    streamIsLive,
    canViewStream,
    preShowVipOnly: accessConfig.preShowVipOnly,
    isVip,
    ticketTier,
    gateType: accessConfig.gateType,
    allowedGateTypes: accessConfig.allowedGateTypes,
    monetizationEnabled: accessConfig.monetizationEnabled,
    playbackUrl: clientPlaybackUrl,
    manifestUrl: clientPlaybackUrl,
    playbackPending: activeRoutingReady && !hasResolvedPlaybackUrl,
    publishMode: session.publishMode,
    publisherChannel: streamIsLive ? routing.activeProgramChannelId : null,
    broadcastCurrentState,
    imminentLiveStartedAt:
      broadcastCurrentState === "live" || broadcastCurrentState === "imminent_live"
        ? resolvedCountdownTimestamp
        : null,
    ownerVideoRouting: routing,
    ownerSession: session,
    resolutionSource: canViewStream ? resolved.resolutionSource : "none",
    systemMessage,
    warnings,
    performanceMetricMs: durationMs,
  });
}
