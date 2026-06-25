const AUDIO_SERVICE_URL = process.env.AUDIO_SERVICE_URL ?? "http://127.0.0.1:8000";
const AUDIO_SERVICE_TOKEN = process.env.AUDIO_SERVICE_TOKEN ?? "";

export class AudioServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ProxyOptions = {
  method?: string;
  body?: unknown;
  tenantId?: string;
  userId?: string;
  userEmail?: string | null;
};

export async function proxyAudioService<T>(
  path: string,
  options: ProxyOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Internal-Token": AUDIO_SERVICE_TOKEN,
  };

  if (options.tenantId) headers["X-Tenant-Id"] = options.tenantId;
  if (options.userId) headers["X-User-Id"] = options.userId;
  if (options.userEmail) headers["X-User-Email"] = options.userEmail;

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
    cache: "no-store",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${AUDIO_SERVICE_URL}${path}`, init);
  const text = await response.text();

  let payload: T & { detail?: string; error?: string };
  try {
    payload = text ? (JSON.parse(text) as T & { detail?: string; error?: string }) : ({} as T);
  } catch {
    throw new AudioServiceError(text || "Invalid audio service response", response.status);
  }

  if (!response.ok) {
    throw new AudioServiceError(
      payload.detail ?? payload.error ?? "Audio service request failed",
      response.status,
    );
  }

  return payload;
}

export function buildAudioLiveWsUrl(token?: string): string {
  const base =
    process.env.NEXT_PUBLIC_AUDIO_WS_URL ??
    process.env.AUDIO_WS_PUBLIC_URL ??
    "ws://127.0.0.1:8000/ws/live";

  if (!token) return base;
  const url = new URL(base);
  url.searchParams.set("token", token);
  return url.toString();
}

export function isAudioServiceConfigured(): boolean {
  return Boolean(process.env.AUDIO_SERVICE_URL || process.env.NEXT_PUBLIC_AUDIO_WS_URL);
}
