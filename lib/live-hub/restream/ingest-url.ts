const RESTREAM_API_BASE = "https://api.restream.io";
const RESTREAM_FETCH_TIMEOUT_MS = 4_000;

const DEFAULT_RTMP_INGEST_BASE = "rtmp://live.restream.io/live";

type RestreamStreamKeyResponse = {
  streamKey?: string;
};

type RestreamIngestResponse = {
  ingestId?: number;
};

type RestreamIngestServer = {
  id: number;
  name: string;
  rtmpUrl: string;
};

export type RestreamIngestProvisionResult =
  | {
      ok: true;
      primaryRtmpIngestUrl: string;
      streamKey: string;
      ingestServerName: string;
    }
  | { ok: false; error: string; code: string };

async function restreamFetch<T>(
  path: string,
  token?: string,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RESTREAM_FETCH_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${RESTREAM_API_BASE}${path}`, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Restream API ${path} returned ${response.status}.`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildRtmpIngestUrl(rtmpBase: string, streamKey: string): string {
  const base = rtmpBase.trim().replace(/\/$/, "");
  const key = streamKey.trim();
  return `${base}/${key}`;
}

function resolveIngestServer(
  servers: RestreamIngestServer[],
  ingestId: number | undefined,
): RestreamIngestServer | null {
  if (servers.length === 0) return null;

  if (typeof ingestId === "number") {
    const matched = servers.find((server) => server.id === ingestId);
    if (matched) return matched;
  }

  return (
    servers.find((server) => server.name.toLowerCase().includes("autodetect")) ??
    servers[0] ??
    null
  );
}

/**
 * Build primary RTMP ingest URL from Restream account stream key + ingest server.
 * Requires RESTREAM_API_TOKEN with stream.read (and channels.read for ingest id).
 */
export async function provisionRestreamRtmpIngestUrl(): Promise<RestreamIngestProvisionResult> {
  const token = process.env.RESTREAM_API_TOKEN?.trim();
  if (!token) {
    return {
      ok: false,
      error: "RESTREAM_API_TOKEN is not configured in server environment.",
      code: "RESTREAM_TOKEN_MISSING",
    };
  }

  try {
    const [streamKeyPayload, ingestPayload, servers] = await Promise.all([
      restreamFetch<RestreamStreamKeyResponse>("/v2/user/streamKey", token),
      restreamFetch<RestreamIngestResponse>("/v2/user/ingest", token).catch(() => ({
        ingestId: undefined,
      })),
      restreamFetch<RestreamIngestServer[]>("/v2/server/all"),
    ]);

    const streamKey = streamKeyPayload.streamKey?.trim();
    if (!streamKey) {
      return {
        ok: false,
        error: "Restream did not return a stream key for this account.",
        code: "RESTREAM_STREAM_KEY_MISSING",
      };
    }

    const ingestServer = resolveIngestServer(
      Array.isArray(servers) ? servers : [],
      ingestPayload.ingestId,
    );

    const rtmpBase = ingestServer?.rtmpUrl?.trim() || DEFAULT_RTMP_INGEST_BASE;
    const primaryRtmpIngestUrl = buildRtmpIngestUrl(rtmpBase, streamKey);

    return {
      ok: true,
      primaryRtmpIngestUrl,
      streamKey,
      ingestServerName: ingestServer?.name ?? "Autodetect",
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to provision RTMP ingest URL from Restream.",
      code: "RESTREAM_PROVISION_FAILED",
    };
  }
}
