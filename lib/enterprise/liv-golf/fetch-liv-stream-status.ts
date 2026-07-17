import { getClientAppUrl } from "@/lib/client-api";
import type { LivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";
import { parableFetch } from "@/lib/parable/resilient-fetch";

type StatusApiError = {
  error?: string;
};

function isNetworkFetchFailure(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false;
  const message = error.message.toLowerCase();
  return message.includes("failed to fetch") || message.includes("networkerror");
}

async function fetchStreamSetupOnce(baseUrl: string, signal?: AbortSignal): Promise<Response> {
  const prefix = baseUrl.replace(/\/$/, "");
  const { response } = await parableFetch(
    `${prefix}/api/enterprise/liv-golf/stream-setup`,
    {
      cache: "no-store",
      credentials: "include",
      signal,
    },
    { timeoutMs: 12_000, subsystem: "stream" },
  );

  return response;
}

/** Fetch LIV stream status from the production gateway (live_stream_state id=current_event). */
export async function fetchLivStreamStatus(
  baseUrl = getClientAppUrl(),
  signal?: AbortSignal,
): Promise<LivStreamSetupStatus> {
  let response: Response;

  try {
    response = await fetchStreamSetupOnce(baseUrl, signal);
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    if (isNetworkFetchFailure(error)) {
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      response = await fetchStreamSetupOnce(baseUrl, signal);
    } else {
      throw error;
    }
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as StatusApiError;
    throw new Error(payload.error ?? `Unable to load stream status (${response.status}).`);
  }

  return (await response.json()) as LivStreamSetupStatus;
}
