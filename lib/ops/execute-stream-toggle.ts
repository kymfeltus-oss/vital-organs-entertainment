import { isValidHlsUrl } from "@/lib/live/hls";
import {
  LIVE_ROOM_PLATFORM_CHANNEL,
  LIVE_STREAM_STATE_BROADCAST_EVENT,
  LIVE_STREAM_STATE_ID,
} from "@/lib/live/types";
import { ensureDevStreamPlaybackConfigured } from "@/lib/ops/ensure-dev-stream-playback";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const OPERATIONS_ACTOR = "operations_command_center";
const DEV_FALLBACK_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

export type LiveActiveSource = "primary" | "backup";

export type StreamToggleInput = {
  isLive: boolean;
  activeSource?: LiveActiveSource;
  primaryUrl?: string;
  backupUrl?: string;
};

export type StreamToggleState = {
  id: string;
  is_live: boolean;
  active_source: string;
  playback_url: string;
  primary_playback_url: string | null;
  backup_playback_url: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type StreamToggleResult =
  | { ok: true; state: StreamToggleState }
  | { ok: false; error: string; status: number };

type ToggleRow = {
  id: string;
  is_live: boolean;
  playback_url: string;
  primary_playback_url: string | null;
  backup_playback_url: string | null;
  active_source: string | null;
  updated_at: string | null;
  updated_by: string | null;
};

function resolveOptionalUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isMissingColumnError(message: string): boolean {
  return /column .+ does not exist/i.test(message) || message.includes("42703");
}

function resolvePrimaryPlaybackUrl(
  row: ToggleRow,
  primaryInput?: string,
): string | null {
  const candidates = [
    primaryInput,
    row.primary_playback_url,
    row.playback_url,
    process.env.NEXT_PUBLIC_HLS_STREAM_URL,
    process.env.NODE_ENV === "development" ? DEV_FALLBACK_HLS : null,
  ];

  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed && isValidHlsUrl(trimmed)) return trimmed;
  }

  return null;
}

async function broadcastStreamState(isLive: boolean): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const channel = supabaseAdmin.channel(LIVE_ROOM_PLATFORM_CHANNEL);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      void supabaseAdmin.removeChannel(channel);
      reject(new Error("Stream state broadcast timed out."));
    }, 5000);

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;

      const result = await channel.send({
        type: "broadcast",
        event: LIVE_STREAM_STATE_BROADCAST_EVENT,
        payload: { isLive },
      });

      clearTimeout(timeout);
      await supabaseAdmin.removeChannel(channel);

      if (result !== "ok") {
        reject(new Error(`Stream state broadcast failed: ${result}`));
        return;
      }

      resolve();
    });
  });
}

async function fetchToggleRow(
  admin: ReturnType<typeof getSupabaseAdmin>,
): Promise<ToggleRow | null> {
  const fullSelect =
    "id, is_live, playback_url, primary_playback_url, backup_playback_url, active_source, updated_at, updated_by";

  const fullResult = await admin
    .from("live_stream_state")
    .select(fullSelect)
    .eq("id", LIVE_STREAM_STATE_ID)
    .maybeSingle();

  if (!fullResult.error && fullResult.data) {
    return fullResult.data as ToggleRow;
  }

  if (fullResult.error && !isMissingColumnError(fullResult.error.message)) {
    throw new Error(fullResult.error.message);
  }

  const legacyResult = await admin
    .from("live_stream_state")
    .select("id, is_live, playback_url, updated_at, updated_by")
    .eq("id", LIVE_STREAM_STATE_ID)
    .maybeSingle();

  if (legacyResult.error) {
    throw new Error(legacyResult.error.message);
  }

  if (!legacyResult.data) return null;

  const legacy = legacyResult.data as ToggleRow;
  return {
    ...legacy,
    primary_playback_url: legacy.playback_url,
    backup_playback_url: null,
    active_source: legacy.is_live ? "primary" : "offline",
  };
}

async function persistToggleUpdate(
  admin: ReturnType<typeof getSupabaseAdmin>,
  payload: Record<string, unknown>,
): Promise<StreamToggleState> {
  const fullResult = await admin
    .from("live_stream_state")
    .update(payload)
    .eq("id", LIVE_STREAM_STATE_ID)
    .select(
      "id, is_live, active_source, playback_url, primary_playback_url, backup_playback_url, updated_at, updated_by",
    )
    .single();

  if (!fullResult.error && fullResult.data) {
    return fullResult.data as StreamToggleState;
  }

  if (fullResult.error && !isMissingColumnError(fullResult.error.message)) {
    throw new Error(fullResult.error.message);
  }

  const legacyPayload: Record<string, unknown> = {
    is_live: payload.is_live,
    playback_url: payload.playback_url,
    updated_at: payload.updated_at,
    updated_by: payload.updated_by,
  };

  const legacyResult = await admin
    .from("live_stream_state")
    .update(legacyPayload)
    .eq("id", LIVE_STREAM_STATE_ID)
    .select("id, is_live, playback_url, updated_at, updated_by")
    .single();

  if (legacyResult.error || !legacyResult.data) {
    throw new Error(legacyResult.error?.message ?? "Stream state row not found.");
  }

  const legacy = legacyResult.data as StreamToggleState;
  return {
    ...legacy,
    active_source:
      typeof payload.active_source === "string"
        ? payload.active_source
        : legacy.is_live
          ? "primary"
          : "offline",
    primary_playback_url:
      typeof payload.primary_playback_url === "string"
        ? payload.primary_playback_url
        : legacy.playback_url,
    backup_playback_url:
      typeof payload.backup_playback_url === "string" ? payload.backup_playback_url : null,
  };
}

/** Shared server-side stream toggle — avoids HTTP loopback from ops routes. */
export async function executeStreamToggle(input: StreamToggleInput): Promise<StreamToggleResult> {
  if (typeof input.isLive !== "boolean") {
    return { ok: false, error: "Invalid payload parameters.", status: 400 };
  }

  try {
    await ensureDevStreamPlaybackConfigured();

    const admin = getSupabaseAdmin();
    const current = await fetchToggleRow(admin);

    if (!current) {
      return { ok: false, error: "Stream state row not found.", status: 404 };
    }

    const updatedAt = new Date().toISOString();

    if (!input.isLive) {
      const state = await persistToggleUpdate(admin, {
        is_live: false,
        active_source: "offline",
        updated_at: updatedAt,
        updated_by: OPERATIONS_ACTOR,
      });

      try {
        await broadcastStreamState(false);
      } catch (broadcastError) {
        console.error("[STREAM_TOGGLE_BROADCAST_ERR]:", broadcastError);
      }

      return { ok: true, state };
    }

    const activeSource = input.activeSource;
    if (activeSource !== "primary" && activeSource !== "backup") {
      return {
        ok: false,
        error: "activeSource must be 'primary' or 'backup' when isLive is true.",
        status: 400,
      };
    }

    const primaryInput = resolveOptionalUrl(input.primaryUrl);
    const backupInput = resolveOptionalUrl(input.backupUrl);

    if (primaryInput && !isValidHlsUrl(primaryInput)) {
      return {
        ok: false,
        error: "primaryUrl must be a well-formed URL ending in .m3u8.",
        status: 400,
      };
    }

    if (backupInput && !isValidHlsUrl(backupInput)) {
      return {
        ok: false,
        error: "backupUrl must be a well-formed URL ending in .m3u8.",
        status: 400,
      };
    }

    const primaryPlaybackUrl = resolvePrimaryPlaybackUrl(current, primaryInput);
    const storedBackup = current.backup_playback_url?.trim() ?? "";
    const backupPlaybackUrl = backupInput ?? storedBackup;

    if (!primaryPlaybackUrl) {
      return {
        ok: false,
        error: "A valid primary HLS .m3u8 playback URL is required before going live.",
        status: 400,
      };
    }

    if (activeSource === "backup" && !isValidHlsUrl(backupPlaybackUrl)) {
      return {
        ok: false,
        error: "A valid backup HLS .m3u8 playback URL is required when active source is backup.",
        status: 400,
      };
    }

    const playbackUrl =
      activeSource === "backup" && isValidHlsUrl(backupPlaybackUrl)
        ? backupPlaybackUrl
        : primaryPlaybackUrl;

    const liveUpdatePayload: Record<string, unknown> = {
      is_live: true,
      active_source: activeSource,
      primary_playback_url: primaryPlaybackUrl,
      playback_url: playbackUrl,
      updated_at: updatedAt,
      updated_by: OPERATIONS_ACTOR,
    };

    if (isValidHlsUrl(backupPlaybackUrl)) {
      liveUpdatePayload.backup_playback_url = backupPlaybackUrl;
    }

    const state = await persistToggleUpdate(admin, liveUpdatePayload);

    try {
      await broadcastStreamState(true);
    } catch (broadcastError) {
      console.error("[STREAM_TOGGLE_BROADCAST_ERR]:", broadcastError);
    }

    return { ok: true, state };
  } catch (error) {
    console.error("[STREAM_TOGGLE_ERR]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server state update failed.";
    return {
      ok: false,
      error:
        process.env.NODE_ENV === "development"
          ? message
          : "Internal server state update failed.",
      status: 500,
    };
  }
}
