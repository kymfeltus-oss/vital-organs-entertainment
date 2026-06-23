import {
  fetchLatestFinishedRestreamEvent,
  fetchRestreamEventRecordings,
  resolveRestreamRecordingDownloadLinks,
} from "@/lib/live-hub/restream/recordings";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type PastBroadcastRecording = {
  id: string;
  streamTitle: string;
  restreamEventId: string;
  recordingUrl: string | null;
  audioOnlyUrl: string | null;
  broadcastDate: string;
  linkExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SyncPastBroadcastInput = {
  eventId?: string;
  streamTitle?: string;
};

export type SyncPastBroadcastResult =
  | { ok: true; savedRecording: PastBroadcastRecording; created: boolean }
  | { ok: false; error: string; code: string };

type PastBroadcastRow = {
  id: string;
  stream_title: string;
  restream_event_id: string;
  recording_url: string | null;
  audio_only_url: string | null;
  broadcast_date: string;
  link_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: PastBroadcastRow): PastBroadcastRecording {
  return {
    id: row.id,
    streamTitle: row.stream_title,
    restreamEventId: row.restream_event_id,
    recordingUrl: row.recording_url,
    audioOnlyUrl: row.audio_only_url,
    broadcastDate: row.broadcast_date,
    linkExpiresAt: row.link_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function resolveBroadcastDate(finishedAt: number | null | undefined): string {
  if (finishedAt != null && finishedAt > 0) {
    return new Date(finishedAt * 1000).toISOString();
  }
  return new Date().toISOString();
}

export async function listPastBroadcastRecordings(
  limit = 24,
): Promise<PastBroadcastRecording[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("past_broadcast_recordings")
    .select("*")
    .order("broadcast_date", { ascending: false })
    .limit(limit);

  if (error) {
    if (/relation .+ does not exist/i.test(error.message)) {
      return [];
    }
    throw error;
  }

  return (data as PastBroadcastRow[]).map(mapRow);
}

export async function syncPastBroadcastRecording(
  input: SyncPastBroadcastInput = {},
): Promise<SyncPastBroadcastResult> {
  let eventId = input.eventId?.trim();
  let streamTitle = input.streamTitle?.trim();
  let broadcastDate = new Date().toISOString();

  if (!eventId) {
    const latestEvent = await fetchLatestFinishedRestreamEvent();
    if (!latestEvent.ok) return latestEvent;
    eventId = latestEvent.event.id;
    streamTitle = streamTitle || latestEvent.event.title?.trim() || "300 Awakening Broadcast";
    broadcastDate = resolveBroadcastDate(latestEvent.event.finishedAt);
  } else {
    streamTitle = streamTitle || "300 Awakening Broadcast";
  }

  const recordingsResult = await fetchRestreamEventRecordings(eventId);
  if (!recordingsResult.ok) return recordingsResult;

  const linksResult = await resolveRestreamRecordingDownloadLinks(
    eventId,
    recordingsResult.recordings,
  );
  if (!linksResult.ok) return linksResult;

  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const payload = {
    stream_title: streamTitle,
    restream_event_id: eventId,
    recording_url: linksResult.recordingUrl,
    audio_only_url: linksResult.audioOnlyUrl,
    broadcast_date: broadcastDate,
    link_expires_at: linksResult.linkExpiresAt,
    updated_at: now,
  };

  const { data: existing } = await admin
    .from("past_broadcast_recordings")
    .select("id")
    .eq("restream_event_id", eventId)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await admin
      .from("past_broadcast_recordings")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      if (/relation .+ does not exist/i.test(error.message)) {
        return {
          ok: false,
          error:
            "past_broadcast_recordings table is not applied. Run migration 0016_past_broadcast_recordings.sql.",
          code: "MIGRATION_REQUIRED",
        };
      }
      return { ok: false, error: error.message, code: "DB_UPDATE_FAILED" };
    }

    return {
      ok: true,
      savedRecording: mapRow(data as PastBroadcastRow),
      created: false,
    };
  }

  const { data, error } = await admin
    .from("past_broadcast_recordings")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    if (/relation .+ does not exist/i.test(error.message)) {
      return {
        ok: false,
        error:
          "past_broadcast_recordings table is not applied. Run migration 0016_past_broadcast_recordings.sql.",
        code: "MIGRATION_REQUIRED",
      };
    }
    return { ok: false, error: error.message, code: "DB_INSERT_FAILED" };
  }

  return {
    ok: true,
    savedRecording: mapRow(data as PastBroadcastRow),
    created: true,
  };
}

/** Non-blocking post-show sync — recordings may need a few minutes to appear. */
export function schedulePastBroadcastRecordingSync(
  input: SyncPastBroadcastInput = {},
): void {
  void syncPastBroadcastRecording(input).catch((error) => {
    console.error("[PAST_BROADCAST_SYNC_ERR]:", error);
  });
}
