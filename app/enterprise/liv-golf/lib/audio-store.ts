import { getSupabaseAdmin } from "@/lib/supabase/server";
import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";
export type LivMasterOutputMode =
  | "WORLD_MIX"
  | "CLEAN_WORLD"
  | "ON_COURSE_AMBIENT"
  | "SPANISH_WORLD"
  | "AUGMENTED_IFB";

export type LivOnCourseSource = "ON_COURSE" | "LEADERBOARD" | "BOOTH" | "AMBIENT" | "REPLAY";

export type LivAudioBus = "MAIN" | "AUX" | "IFB" | "STREAM";

export type LivOnCourseMatrixChannel = {
  channelId: string;
  label: string;
  source: LivOnCourseSource;
  gainDb: number;
  muted: boolean;
  bus: LivAudioBus;
};

export type LivCommentaryTrack = {
  trackId: string;
  locale: string;
  label: string;
  active: boolean;
  gainDb: number;
};

export type LivBroadcastAudioRoutingRecord = {
  roomId: string;
  masterOutputMode: LivMasterOutputMode;
  onCourseMatrix: LivOnCourseMatrixChannel[];
  commentaryTracks: LivCommentaryTrack[];
  updatedAt: string;
  updatedBy: string | null;
};

const MASTER_OUTPUT_MODES = new Set<LivMasterOutputMode>([
  "WORLD_MIX",
  "CLEAN_WORLD",
  "ON_COURSE_AMBIENT",
  "SPANISH_WORLD",
  "AUGMENTED_IFB",
]);

const ON_COURSE_SOURCES = new Set<LivOnCourseSource>([
  "ON_COURSE",
  "LEADERBOARD",
  "BOOTH",
  "AMBIENT",
  "REPLAY",
]);

const AUDIO_BUSES = new Set<LivAudioBus>(["MAIN", "AUX", "IFB", "STREAM"]);

const DEFAULT_ON_COURSE_MATRIX: LivOnCourseMatrixChannel[] = [
  {
    channelId: "tee-1",
    label: "Hole 1 Tee Mic",
    source: "ON_COURSE",
    gainDb: 0,
    muted: false,
    bus: "MAIN",
  },
  {
    channelId: "fairway-18",
    label: "Championship Fairway",
    source: "ON_COURSE",
    gainDb: -2,
    muted: false,
    bus: "MAIN",
  },
  {
    channelId: "booth-a",
    label: "World Feed Booth",
    source: "BOOTH",
    gainDb: 0,
    muted: false,
    bus: "STREAM",
  },
];

const DEFAULT_COMMENTARY_TRACKS: LivCommentaryTrack[] = [
  {
    trackId: "en-world",
    locale: "en-US",
    label: "English World Feed",
    active: true,
    gainDb: 0,
  },
  {
    trackId: "es-world",
    locale: "es-MX",
    label: "Spanish World Feed",
    active: false,
    gainDb: 0,
  },
];

const AUDIO_ROUTING_TABLE = "LivBroadcastAudioRouting";

type LivBroadcastAudioRoutingRow = {
  roomId: string;
  masterOutputMode: string;
  onCourseMatrix: unknown;
  commentaryTracks: unknown;
  updatedAt: string;
  updatedBy: string | null;
};

function isMissingAudioRoutingTable(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /LivBroadcastAudioRouting|does not exist|schema cache|42P01|PGRST205/i.test(message);
}

async function fetchAudioRoutingRow(roomId: string): Promise<LivBroadcastAudioRoutingRow | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(AUDIO_ROUTING_TABLE)
    .select("*")
    .eq("roomId", roomId)
    .maybeSingle();

  if (error) {
    if (isMissingAudioRoutingTable(error)) return null;
    throw new Error(error.message);
  }

  return (data as LivBroadcastAudioRoutingRow | null) ?? null;
}

async function insertDefaultAudioRoutingRow(
  roomId: string,
): Promise<LivBroadcastAudioRoutingRow> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(AUDIO_ROUTING_TABLE)
    .insert({
      roomId,
      masterOutputMode: "WORLD_MIX",
      onCourseMatrix: DEFAULT_ON_COURSE_MATRIX,
      commentaryTracks: DEFAULT_COMMENTARY_TRACKS,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as LivBroadcastAudioRoutingRow;
}

export function resolveLivAudioRoomId(raw: string | null | undefined): string {
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : LIV_GOLF_TOUR_MAIN_ROOM;
}

function isOnCourseMatrixChannel(value: unknown): value is LivOnCourseMatrixChannel {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.channelId === "string" &&
    row.channelId.trim().length > 0 &&
    typeof row.label === "string" &&
    row.label.trim().length > 0 &&
    typeof row.source === "string" &&
    ON_COURSE_SOURCES.has(row.source as LivOnCourseSource) &&
    typeof row.gainDb === "number" &&
    Number.isFinite(row.gainDb) &&
    row.gainDb >= -60 &&
    row.gainDb <= 12 &&
    typeof row.muted === "boolean" &&
    typeof row.bus === "string" &&
    AUDIO_BUSES.has(row.bus as LivAudioBus)
  );
}

function isCommentaryTrack(value: unknown): value is LivCommentaryTrack {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.trackId === "string" &&
    row.trackId.trim().length > 0 &&
    typeof row.locale === "string" &&
    /^[a-z]{2}-[A-Z]{2}$/.test(row.locale.trim()) &&
    typeof row.label === "string" &&
    row.label.trim().length > 0 &&
    typeof row.active === "boolean" &&
    typeof row.gainDb === "number" &&
    Number.isFinite(row.gainDb) &&
    row.gainDb >= -60 &&
    row.gainDb <= 12
  );
}

export function validateLivAudioRoutingWrite(body: unknown):
  | {
      ok: true;
      value: {
        roomId: string;
        masterOutputMode?: LivMasterOutputMode;
        onCourseMatrix?: LivOnCourseMatrixChannel[];
        commentaryTracks?: LivCommentaryTrack[];
      };
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body is required." };
  }

  const record = body as Record<string, unknown>;
  const roomId = resolveLivAudioRoomId(
    typeof record.roomId === "string" ? record.roomId : undefined,
  );

  if (record.masterOutputMode !== undefined) {
    if (
      typeof record.masterOutputMode !== "string" ||
      !MASTER_OUTPUT_MODES.has(record.masterOutputMode as LivMasterOutputMode)
    ) {
      return { ok: false, error: "Invalid master output mode." };
    }
  }

  if (record.onCourseMatrix !== undefined) {
    if (!Array.isArray(record.onCourseMatrix) || record.onCourseMatrix.length > 32) {
      return { ok: false, error: "onCourseMatrix must be an array with at most 32 channels." };
    }
    if (!record.onCourseMatrix.every(isOnCourseMatrixChannel)) {
      return { ok: false, error: "Invalid on-course matrix channel payload." };
    }
  }

  if (record.commentaryTracks !== undefined) {
    if (!Array.isArray(record.commentaryTracks) || record.commentaryTracks.length > 16) {
      return { ok: false, error: "commentaryTracks must be an array with at most 16 tracks." };
    }
    if (!record.commentaryTracks.every(isCommentaryTrack)) {
      return { ok: false, error: "Invalid commentary track payload." };
    }
  }

  return {
    ok: true,
    value: {
      roomId,
      masterOutputMode: record.masterOutputMode as LivMasterOutputMode | undefined,
      onCourseMatrix: record.onCourseMatrix as LivOnCourseMatrixChannel[] | undefined,
      commentaryTracks: record.commentaryTracks as LivCommentaryTrack[] | undefined,
    },
  };
}

function serializeRow(row: {
  roomId: string;
  masterOutputMode: string;
  onCourseMatrix: unknown;
  commentaryTracks: unknown;
  updatedAt: string | Date;
  updatedBy: string | null;
}): LivBroadcastAudioRoutingRecord {
  const updatedAt =
    row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString();

  return {
    roomId: row.roomId,
    masterOutputMode: row.masterOutputMode as LivMasterOutputMode,
    onCourseMatrix: Array.isArray(row.onCourseMatrix)
      ? (row.onCourseMatrix as LivOnCourseMatrixChannel[])
      : [],
    commentaryTracks: Array.isArray(row.commentaryTracks)
      ? (row.commentaryTracks as LivCommentaryTrack[])
      : [],
    updatedAt,
    updatedBy: row.updatedBy,
  };
}

function buildInMemoryDefaultRouting(roomId: string): LivBroadcastAudioRoutingRecord {
  return {
    roomId,
    masterOutputMode: "WORLD_MIX",
    onCourseMatrix: DEFAULT_ON_COURSE_MATRIX,
    commentaryTracks: DEFAULT_COMMENTARY_TRACKS,
    updatedAt: new Date().toISOString(),
    updatedBy: null,
  };
}

export async function loadLivBroadcastAudioRouting(
  roomId?: string | null,
): Promise<LivBroadcastAudioRoutingRecord> {
  const resolvedRoomId = resolveLivAudioRoomId(roomId);

  const existing = await fetchAudioRoutingRow(resolvedRoomId);
  if (existing) {
    return serializeRow(existing);
  }

  try {
    const created = await insertDefaultAudioRoutingRow(resolvedRoomId);
    return serializeRow(created);
  } catch (error) {
    if (isMissingAudioRoutingTable(error)) {
      return buildInMemoryDefaultRouting(resolvedRoomId);
    }
    throw error;
  }
}

export async function upsertLivBroadcastAudioRouting(input: {
  roomId: string;
  masterOutputMode?: LivMasterOutputMode;
  onCourseMatrix?: LivOnCourseMatrixChannel[];
  commentaryTracks?: LivCommentaryTrack[];
  updatedBy: string;
}): Promise<LivBroadcastAudioRoutingRecord> {
  const existing = await fetchAudioRoutingRow(input.roomId);

  const nextMaster =
    input.masterOutputMode ??
    (existing?.masterOutputMode as LivMasterOutputMode | undefined) ??
    "WORLD_MIX";
  const nextMatrix =
    input.onCourseMatrix ??
    (Array.isArray(existing?.onCourseMatrix)
      ? (existing.onCourseMatrix as LivOnCourseMatrixChannel[])
      : DEFAULT_ON_COURSE_MATRIX);
  const nextTracks =
    input.commentaryTracks ??
    (Array.isArray(existing?.commentaryTracks)
      ? (existing.commentaryTracks as LivCommentaryTrack[])
      : DEFAULT_COMMENTARY_TRACKS);

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(AUDIO_ROUTING_TABLE)
    .upsert(
      {
        roomId: input.roomId,
        masterOutputMode: nextMaster,
        onCourseMatrix: nextMatrix,
        commentaryTracks: nextTracks,
        updatedBy: input.updatedBy,
      },
      { onConflict: "roomId" },
    )
    .select("*")
    .single();

  if (error) {
    if (isMissingAudioRoutingTable(error)) {
      return {
        ...buildInMemoryDefaultRouting(input.roomId),
        masterOutputMode: nextMaster,
        onCourseMatrix: nextMatrix,
        commentaryTracks: nextTracks,
        updatedBy: input.updatedBy,
      };
    }
    throw new Error(error.message);
  }

  return serializeRow(data as LivBroadcastAudioRoutingRow);
}
