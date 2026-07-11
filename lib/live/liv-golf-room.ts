import { LIV_GOLF_TOUR_MAIN_ROOM, LIVE_STREAM_STATE_ID } from "@/lib/live/types";

const LIV_GOLF_ROOM_ALIASES = new Set([LIV_GOLF_TOUR_MAIN_ROOM, LIVE_STREAM_STATE_ID]);

/** Match LIV Golf viewer room scopes across legacy and enterprise room id strings. */
export function livGolfRoomIdsMatch(expected: string, received: string): boolean {
  if (expected === received) return true;
  return LIV_GOLF_ROOM_ALIASES.has(expected) && LIV_GOLF_ROOM_ALIASES.has(received);
}

export function resolveLivGolfRoomId(roomId: string | null | undefined): string {
  const trimmed = roomId?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : LIV_GOLF_TOUR_MAIN_ROOM;
}
