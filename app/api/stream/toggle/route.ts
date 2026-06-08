import { NextRequest, NextResponse } from "next/server";
import { isValidHlsUrl } from "@/lib/live/hls";
import {
  LIVE_ROOM_PLATFORM_CHANNEL,
  LIVE_STREAM_STATE_BROADCAST_EVENT,
  LIVE_STREAM_STATE_ID,
} from "@/lib/live/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const OPERATIONS_ACTOR = "operations_command_center";

type LiveActiveSource = "primary" | "backup";

type StreamToggleBody = {
  isLive?: boolean;
  primaryUrl?: string;
  backupUrl?: string;
  activeSource?: string;
};

type LiveStreamStateRow = {
  id: string;
  is_live: boolean;
  playback_url: string;
  primary_playback_url: string | null;
  backup_playback_url: string | null;
  active_source: string;
  updated_at: string;
  updated_by: string | null;
};

function resolveOptionalUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET_KEY;

  if (!adminSecret) {
    console.error("[STREAM_TOGGLE_ERR]: ADMIN_SECRET_KEY is not configured.");
    return NextResponse.json(
      { error: "Stream toggle is not configured." },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("X-Admin-Secret-Key");

  if (!authHeader || authHeader !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as StreamToggleBody;
    const isLive = body.isLive;

    if (typeof isLive !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload parameters." },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: currentRow, error: fetchError } = await supabaseAdmin
      .from("live_stream_state")
      .select(
        "id, is_live, playback_url, primary_playback_url, backup_playback_url, active_source, updated_at, updated_by",
      )
      .eq("id", LIVE_STREAM_STATE_ID)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!currentRow) {
      return NextResponse.json(
        { error: "Stream state row not found." },
        { status: 404 },
      );
    }

    const current = currentRow as LiveStreamStateRow;
    const updatedAt = new Date().toISOString();

    if (!isLive) {
      const { data, error } = await supabaseAdmin
        .from("live_stream_state")
        .update({
          is_live: false,
          active_source: "offline",
          updated_at: updatedAt,
          updated_by: OPERATIONS_ACTOR,
        })
        .eq("id", LIVE_STREAM_STATE_ID)
        .select(
          "id, is_live, active_source, playback_url, primary_playback_url, backup_playback_url, updated_at, updated_by",
        )
        .single();

      if (error || !data) {
        throw error ?? new Error("Stream state row not found.");
      }

      try {
        await broadcastStreamState(false);
      } catch (broadcastError) {
        console.error("[STREAM_TOGGLE_BROADCAST_ERR]:", broadcastError);
      }

      console.info("[STREAM_TOGGLE_OK]:", {
        isLive: false,
        activeSource: "offline",
        updatedAt: data.updated_at,
      });

      return NextResponse.json({ success: true, state: data });
    }

    const primaryInput = resolveOptionalUrl(body.primaryUrl);
    const backupInput = resolveOptionalUrl(body.backupUrl);
    const activeSource = body.activeSource?.trim();

    if (
      activeSource !== "primary" &&
      activeSource !== "backup"
    ) {
      return NextResponse.json(
        { error: "activeSource must be 'primary' or 'backup' when isLive is true." },
        { status: 400 },
      );
    }

    if (primaryInput && !isValidHlsUrl(primaryInput)) {
      return NextResponse.json(
        { error: "primaryUrl must be a well-formed URL ending in .m3u8." },
        { status: 400 },
      );
    }

    if (backupInput && !isValidHlsUrl(backupInput)) {
      return NextResponse.json(
        { error: "backupUrl must be a well-formed URL ending in .m3u8." },
        { status: 400 },
      );
    }

    const storedPrimary = current.primary_playback_url?.trim() ?? "";
    const storedBackup = current.backup_playback_url?.trim() ?? "";
    const primaryPlaybackUrl = primaryInput ?? storedPrimary;
    const backupPlaybackUrl = backupInput ?? storedBackup;

    if (!isValidHlsUrl(primaryPlaybackUrl)) {
      return NextResponse.json(
        {
          error:
            "A valid primary HLS .m3u8 playback URL is required before going live.",
        },
        { status: 400 },
      );
    }

    if (activeSource === "backup" && !isValidHlsUrl(backupPlaybackUrl)) {
      return NextResponse.json(
        {
          error:
            "A valid backup HLS .m3u8 playback URL is required when active source is backup.",
        },
        { status: 400 },
      );
    }

    const playbackUrl =
      activeSource === "backup" && isValidHlsUrl(backupPlaybackUrl)
        ? backupPlaybackUrl
        : primaryPlaybackUrl;

    const { data, error } = await supabaseAdmin
      .from("live_stream_state")
      .update({
        is_live: true,
        active_source: activeSource as LiveActiveSource,
        primary_playback_url: primaryPlaybackUrl,
        backup_playback_url: isValidHlsUrl(backupPlaybackUrl)
          ? backupPlaybackUrl
          : null,
        playback_url: playbackUrl,
        updated_at: updatedAt,
        updated_by: OPERATIONS_ACTOR,
      })
      .eq("id", LIVE_STREAM_STATE_ID)
      .select(
        "id, is_live, active_source, playback_url, primary_playback_url, backup_playback_url, updated_at, updated_by",
      )
      .single();

    if (error || !data) {
      throw error ?? new Error("Stream state row not found.");
    }

    try {
      await broadcastStreamState(true);
    } catch (broadcastError) {
      console.error("[STREAM_TOGGLE_BROADCAST_ERR]:", broadcastError);
    }

    console.info("[STREAM_TOGGLE_OK]:", {
      isLive: true,
      activeSource,
      updatedAt: data.updated_at,
    });

    return NextResponse.json({ success: true, state: data });
  } catch (error) {
    console.error("[STREAM_TOGGLE_ERR]:", error);
    return NextResponse.json(
      { error: "Internal server state update failed." },
      { status: 500 },
    );
  }
}
