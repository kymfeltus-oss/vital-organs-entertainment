const RESTREAM_API_BASE = "https://api.restream.io";
const RESTREAM_FETCH_TIMEOUT_MS = 8_000;

export type RestreamRecordingFile = {
  fileName: string;
  expiresAt: string;
};

export type RestreamEventRecordings = {
  primaryVideos: RestreamRecordingFile[];
  secondaryVideos: RestreamRecordingFile[];
  audio: RestreamRecordingFile[];
};

export type RestreamHistoryEvent = {
  id: string;
  status: "finished" | "missed" | string;
  title: string;
  startedAt: number | null;
  finishedAt: number | null;
};

type RestreamHistoryResponse = {
  items?: RestreamHistoryEvent[];
};

function resolveRestreamToken(): string | null {
  return process.env.RESTREAM_API_TOKEN?.trim() || null;
}

async function restreamApiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: true; data: T } | { ok: false; error: string; code: string; status?: number }> {
  const token = resolveRestreamToken();
  if (!token) {
    return {
      ok: false,
      error: "RESTREAM_API_TOKEN is not configured on the server.",
      code: "RESTREAM_TOKEN_MISSING",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RESTREAM_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${RESTREAM_API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | T
      | { error?: { message?: string } }
      | null;

    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        payload.error?.message
          ? payload.error.message
          : `Restream API request failed (${response.status}).`;

      return {
        ok: false,
        error: message,
        code: "RESTREAM_API_ERROR",
        status: response.status,
      };
    }

    return { ok: true, data: payload as T };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Restream API request timed out."
        : error instanceof Error
          ? error.message
          : "Restream API request failed.";

    return { ok: false, error: message, code: "RESTREAM_UNREACHABLE" };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchRestreamEventRecordings(
  eventId: string,
): Promise<
  | { ok: true; recordings: RestreamEventRecordings }
  | { ok: false; error: string; code: string }
> {
  const result = await restreamApiFetch<Partial<RestreamEventRecordings>>(
    `/v2/user/events/${encodeURIComponent(eventId)}/recordings`,
  );

  if (result.ok === false) return result;

  return {
    ok: true,
    recordings: {
      primaryVideos: result.data.primaryVideos ?? [],
      secondaryVideos: result.data.secondaryVideos ?? [],
      audio: result.data.audio ?? [],
    },
  };
}

export async function fetchRestreamRecordingDownloadUrl(
  eventId: string,
  fileName: string,
): Promise<
  | { ok: true; downloadUrl: string }
  | { ok: false; error: string; code: string }
> {
  const result = await restreamApiFetch<{ downloadUrl?: string }>(
    `/v2/user/events/${encodeURIComponent(eventId)}/recordings/download-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName }),
    },
  );

  if (result.ok === false) return result;

  const downloadUrl = result.data.downloadUrl?.trim();
  if (!downloadUrl) {
    return {
      ok: false,
      error: "Restream did not return a recording download URL.",
      code: "RESTREAM_DOWNLOAD_URL_MISSING",
    };
  }

  return { ok: true, downloadUrl };
}

export async function fetchLatestFinishedRestreamEvent(): Promise<
  | { ok: true; event: RestreamHistoryEvent }
  | { ok: false; error: string; code: string }
> {
  const result = await restreamApiFetch<RestreamHistoryResponse>(
    "/v2/user/events/history?page=1&limit=5",
  );

  if (result.ok === false) return result;

  const event =
    result.data.items?.find((item) => item.status === "finished") ?? result.data.items?.[0];

  if (!event?.id) {
    return {
      ok: false,
      error: "No finished Restream events found in account history.",
      code: "RESTREAM_EVENT_NOT_FOUND",
    };
  }

  return { ok: true, event };
}

export async function resolveRestreamRecordingDownloadLinks(
  eventId: string,
  recordings: RestreamEventRecordings,
): Promise<
  | {
      ok: true;
      recordingUrl: string | null;
      audioOnlyUrl: string | null;
      linkExpiresAt: string | null;
    }
  | { ok: false; error: string; code: string }
> {
  const primaryFile = recordings.primaryVideos[0];
  const audioFile = recordings.audio[0];

  if (!primaryFile && !audioFile) {
    return {
      ok: false,
      error: "Restream has not finished processing recordings for this event yet.",
      code: "RECORDINGS_NOT_READY",
    };
  }

  let recordingUrl: string | null = null;
  let audioOnlyUrl: string | null = null;

  if (primaryFile) {
    const primaryDownload = await fetchRestreamRecordingDownloadUrl(
      eventId,
      primaryFile.fileName,
    );
    if (primaryDownload.ok === false) return primaryDownload;
    recordingUrl = primaryDownload.downloadUrl;
  }

  if (audioFile) {
    const audioDownload = await fetchRestreamRecordingDownloadUrl(
      eventId,
      audioFile.fileName,
    );
    if (audioDownload.ok === false) return audioDownload;
    audioOnlyUrl = audioDownload.downloadUrl;
  }

  const linkExpiresAt = primaryFile?.expiresAt ?? audioFile?.expiresAt ?? null;

  return {
    ok: true,
    recordingUrl,
    audioOnlyUrl,
    linkExpiresAt,
  };
}
