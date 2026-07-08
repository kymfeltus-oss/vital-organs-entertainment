import { COLEMAN_API } from "./routes";
import type {
  ApiErrorBody,
  PlaybackHistoryEntry,
  TheoryEntry,
  TrackData,
} from "./types";
import { formatColemanUserError } from "./user-facing-error";
export class ColemanApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ColemanApiError";
    this.status = status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json();

  if (!response.ok) {
    const errorBody = payload as ApiErrorBody;
    throw new ColemanApiError(
      formatColemanUserError(
        errorBody.error || `Request failed with status ${response.status}.`,
      ),
      response.status,
    );  }

  return payload as T;
}

export async function fetchSetlist(): Promise<TrackData[]> {
  const response = await fetch(COLEMAN_API.setlist, { cache: "no-store" });
  return parseResponse<TrackData[]>(response);
}

export async function createTrack(input: {
  title: string;
  musicalKey: string;
  bpm: number | string;
  duration?: string;
}): Promise<TrackData> {
  const response = await fetch(COLEMAN_API.createTrack, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseResponse<TrackData>(response);
}

export async function uploadStem(trackId: string, file: File): Promise<TrackData> {
  const formData = new FormData();
  formData.append("stem", file);

  const response = await fetch(COLEMAN_API.uploadStem(trackId), {
    method: "POST",
    body: formData,
  });

  return parseResponse<TrackData>(response);
}

export async function removeStem(stemId: string): Promise<{ ok: true; id: string }> {
  const response = await fetch(COLEMAN_API.removeStem(stemId), {
    method: "DELETE",
  });
  return parseResponse<{ ok: true; id: string }>(response);
}

export async function recordPlayback(trackId: string): Promise<PlaybackHistoryEntry> {
  const response = await fetch(COLEMAN_API.history, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trackId }),
  });
  return parseResponse<PlaybackHistoryEntry>(response);
}

export async function fetchHistory(): Promise<PlaybackHistoryEntry[]> {
  const response = await fetch(COLEMAN_API.history, { cache: "no-store" });
  return parseResponse<PlaybackHistoryEntry[]>(response);
}

export async function fetchTheoryCatalog(): Promise<TheoryEntry[]> {
  const response = await fetch(COLEMAN_API.theory, { cache: "no-store" });
  return parseResponse<TheoryEntry[]>(response);
}

export function audioStreamUrl(filename: string): string {
  return COLEMAN_API.audioStream(filename);
}

export async function fetchRoutingConfig(userId: string) {
  const response = await fetch(
    `${COLEMAN_API.routing}?userId=${encodeURIComponent(userId)}`,
    { cache: "no-store" },
  );
  return parseResponse<import("./routing-persistence").AudioRoutingConfigRecord>(response);
}

export async function saveRoutingConfig(
  payload: import("./routing-persistence").AudioRoutingConfigWrite,
) {
  const response = await fetch(COLEMAN_API.routing, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<import("./routing-persistence").AudioRoutingConfigRecord>(response);
}
