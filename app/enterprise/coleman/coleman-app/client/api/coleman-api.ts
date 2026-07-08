import { COLEMAN_API } from "../config/environment";

export class ColemanApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ColemanApiError";
    this.status = status;
  }
}

function formatUserError(raw: string): string {
  if (/DATABASE_URL|PrismaClient|prisma|ECONNREFUSED/i.test(raw)) {
    return "Service setlist is temporarily unavailable. Check database configuration.";
  }
  if (raw.length > 160) return "Something went wrong. Please try again.";
  return raw;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json();

  if (!response.ok) {
    const errorBody = payload as { error?: string };
    throw new ColemanApiError(
      formatUserError(errorBody.error || `Request failed with status ${response.status}.`),
      response.status,
    );
  }

  return payload as T;
}

export type TrackItem = {
  id: string;
  title: string;
  musicalKey: string;
  bpm: number;
  duration: string;
  audioFiles: string[];
};

export type HistoryItem = {
  id: string;
  trackId: string;
  title: string;
  playedAt: string;
};

export type TheoryItem = {
  id: string;
  title: string;
  key: string;
  nashvilleNumbers: string;
  progressionLabel: string;
  churchMovement: string;
};

export async function fetchSetlist(): Promise<TrackItem[]> {
  const response = await fetch(COLEMAN_API.setlist);
  return parseResponse<TrackItem[]>(response);
}

export async function uploadStem(trackId: string, formData: FormData): Promise<TrackItem> {
  const response = await fetch(COLEMAN_API.uploadStem(trackId), {
    method: "POST",
    body: formData,
  });
  return parseResponse<TrackItem>(response);
}

export async function recordPlayback(trackId: string): Promise<HistoryItem> {
  const response = await fetch(COLEMAN_API.history, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trackId }),
  });
  return parseResponse<HistoryItem>(response);
}

export async function fetchHistory(): Promise<HistoryItem[]> {
  const response = await fetch(COLEMAN_API.history);
  return parseResponse<HistoryItem[]>(response);
}

export async function fetchTheoryCatalog(): Promise<TheoryItem[]> {
  const response = await fetch(COLEMAN_API.theory);
  return parseResponse<TheoryItem[]>(response);
}

export async function checkHealth(): Promise<{ ok: boolean }> {
  const response = await fetch(COLEMAN_API.health);
  return parseResponse<{ ok: boolean }>(response);
}
