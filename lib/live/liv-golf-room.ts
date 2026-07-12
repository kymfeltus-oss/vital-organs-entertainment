import { normalizeEnvPlaybackString } from "@/lib/live/manifest-dev-fallback";
import { LIV_GOLF_TOUR_MAIN_ROOM, LIVE_STREAM_STATE_ID } from "@/lib/live/types";

const LIV_GOLF_ROOM_ALIASES = new Set([LIV_GOLF_TOUR_MAIN_ROOM, LIVE_STREAM_STATE_ID]);
const PLACEHOLDER_ROOM_IDS = new Set([
  "00000000-0000-0000-0000-000000000000",
  LIVE_STREAM_STATE_ID,
]);

/** Match LIV Golf viewer room scopes across legacy and enterprise room id strings. */
export function livGolfRoomIdsMatch(expected: string, received: string): boolean {
  if (expected === received) return true;
  return LIV_GOLF_ROOM_ALIASES.has(expected) && LIV_GOLF_ROOM_ALIASES.has(received);
}

/** Query param, then NEXT_PUBLIC_ROOM_ID (non-placeholder), then tour default. */
export function resolveLivGolfRoomId(roomId: string | null | undefined): string {
  const trimmed = roomId?.trim();
  if (trimmed && !PLACEHOLDER_ROOM_IDS.has(trimmed)) return trimmed;

  const fromEnv = normalizeEnvPlaybackString(process.env.NEXT_PUBLIC_ROOM_ID);
  if (fromEnv && !PLACEHOLDER_ROOM_IDS.has(fromEnv)) return fromEnv;

  return LIV_GOLF_TOUR_MAIN_ROOM;
}
