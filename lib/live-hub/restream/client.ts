import type {
  RestreamAdapterResult,
  RestreamCommand,
} from "@/lib/live-hub/restream/types";

async function parseJsonResponse(response: Response): Promise<RestreamAdapterResult> {
  const payload = (await response.json()) as RestreamAdapterResult;

  if (!response.ok && payload.ok !== true) {
    return {
      ok: false,
      error: payload.ok === false ? payload.error : "Restream request failed.",
      code: payload.ok === false ? payload.code : "RESTREAM_REQUEST_FAILED",
    };
  }

  return payload;
}

export async function fetchRestreamState(): Promise<RestreamAdapterResult> {
  const response = await fetch("/api/ops/live-hub/restream", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return parseJsonResponse(response);
}

export async function sendRestreamCommand(
  command: RestreamCommand,
): Promise<RestreamAdapterResult> {
  const response = await fetch("/api/ops/live-hub/restream", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
    cache: "no-store",
  });

  return parseJsonResponse(response);
}

export const RESTREAM_DASHBOARD_URL = "https://restream.io/dashboard";
