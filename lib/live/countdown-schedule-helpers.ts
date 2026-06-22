const HOLDING_STREAM_HOURS = 4;

/** Build a future pre-show window so /live routes to the holding room. */
export function buildFutureHoldingSchedule(nowMs = Date.now()): {
  start_time: string;
  end_time: string;
} {
  const start = new Date(nowMs);
  start.setDate(start.getDate() + 14);
  start.setHours(19, 30, 0, 0);

  const end = new Date(start);
  end.setHours(end.getHours() + HOLDING_STREAM_HOURS);

  return {
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  };
}

/**
 * When start is already past but end is still future, derive a future go-live
 * from the end time so /live returns to the holding room.
 */
export function alignStartForHoldingRoom(
  startIso: string,
  endIso: string,
  nowMs = Date.now(),
): string | null {
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= nowMs) return null;
  if (startMs >= nowMs) return null;

  const proposedStartMs = endMs - HOLDING_STREAM_HOURS * 60 * 60 * 1000;
  if (proposedStartMs > nowMs) {
    return new Date(proposedStartMs).toISOString();
  }

  const fallbackMs = nowMs + 5 * 60 * 1000;
  if (fallbackMs < endMs) {
    return new Date(fallbackMs).toISOString();
  }

  return null;
}
