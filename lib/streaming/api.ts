import type {
  CreateStreamingDestinationInput,
  StreamingDestinationPublic,
  StreamingOAuthStartResult,
  StreamingTestResult,
} from "@/lib/streaming/types";

async function streamingFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((body as { error?: string }).error ?? "Request failed.");
  return body as T;
}

export async function fetchStreamingDestinationsPublic(): Promise<StreamingDestinationPublic[]> {
  return streamingFetch<{ items: StreamingDestinationPublic[] }>("/api/v1/streaming-destinations").then((r) => r.items);
}

export async function createStreamingDestinationApi(
  input: CreateStreamingDestinationInput,
): Promise<StreamingDestinationPublic> {
  return streamingFetch<{ item: StreamingDestinationPublic }>("/api/v1/streaming-destinations", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.item);
}

export async function validateStreamingDestinationApi(id: string): Promise<import("@/lib/streaming/types").StreamingTestResult> {
  const raw = await streamingFetch<{
    success: boolean;
    message: string;
    details: import("@/lib/streaming/types").StreamingTestResult;
  }>(`/api/v1/streaming-destinations/${id}/validate`, { method: "POST" });
  return raw.details ?? {
    success: raw.success,
    message: raw.message,
    connectionStatus: raw.success ? "ready" : "needs_attention",
    steps: [],
  };
}

export async function validateSelectedStreamingApi(): Promise<import("@/lib/streaming/types").StreamingGoLiveResult> {
  return streamingFetch("/api/v1/streaming/validate-selected", { method: "POST" });
}

export async function testStreamingDestinationApi(id: string): Promise<StreamingTestResult> {
  const raw = await streamingFetch<{ success: boolean; message: string; details?: { steps?: StreamingTestResult["steps"]; connectionStatus?: StreamingTestResult["connectionStatus"] } }>(
    `/api/v1/streaming-destinations/${id}/test`,
    { method: "POST" },
  );
  return {
    success: raw.success,
    message: raw.message,
    connectionStatus: raw.details?.connectionStatus ?? (raw.success ? "ready" : "needs_attention"),
    steps: raw.details?.steps ?? [],
  };
}

export async function disconnectStreamingApi(id: string): Promise<{ success: boolean; message: string }> {
  return streamingFetch(`/api/v1/streaming-destinations/${id}/disconnect`, { method: "POST" });
}

export async function useStreamingTodayApi(id: string): Promise<void> {
  await streamingFetch(`/api/v1/streaming-destinations/${id}/use-today`, { method: "POST" });
}

export async function skipStreamingTodayApi(id: string): Promise<void> {
  await streamingFetch(`/api/v1/streaming-destinations/${id}/do-not-use-today`, { method: "POST" });
}

export async function startStreamingOAuthApi(
  provider: string,
  destinationId: string,
): Promise<StreamingOAuthStartResult> {
  return streamingFetch(`/api/v1/streaming/oauth/${provider}/start?destinationId=${encodeURIComponent(destinationId)}`);
}

export async function deleteStreamingApi(id: string): Promise<void> {
  await streamingFetch(`/api/v1/streaming-destinations/${id}`, { method: "DELETE" });
}

export async function updateStreamingDestinationApi(
  id: string,
  patch: Record<string, unknown>,
): Promise<StreamingDestinationPublic> {
  return streamingFetch<{ item: StreamingDestinationPublic }>(`/api/v1/streaming-destinations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((r) => r.item);
}

export async function fetchStreamingBroadcastDestinationsApi(): Promise<{
  selections: import("@/lib/todays-service/types").ServiceBroadcastDestination[];
  cards: import("@/lib/todays-service/types").BroadcastDestinationCard[];
  recommendedPlatform: import("@/lib/streaming/types").StreamingPlatform;
}> {
  return streamingFetch("/api/v1/streaming/broadcast-destinations");
}

export async function saveStreamingBroadcastDestinationsApi(
  platforms: import("@/lib/streaming/types").StreamingPlatform[],
): Promise<{
  selections: import("@/lib/todays-service/types").ServiceBroadcastDestination[];
  cards: import("@/lib/todays-service/types").BroadcastDestinationCard[];
}> {
  return streamingFetch("/api/v1/streaming/broadcast-destinations", {
    method: "PUT",
    body: JSON.stringify({ platforms }),
  });
}

export async function fetchStreamingWizardDefaultsApi(): Promise<import("@/lib/streaming/types").StreamingWizardDefaults> {
  return streamingFetch<{ defaults: import("@/lib/streaming/types").StreamingWizardDefaults }>(
    "/api/v1/streaming/wizard/defaults",
  ).then((r) => r.defaults);
}

export async function saveStreamingWizardApi(
  input: import("@/lib/streaming/types").StreamingWizardSaveInput,
): Promise<StreamingDestinationPublic> {
  return streamingFetch<{ item: StreamingDestinationPublic }>("/api/v1/streaming/wizard/save", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.item);
}

export async function runStreamingNetworkTestApi(
  destinationId: string,
  videoProfile?: Record<string, unknown>,
): Promise<import("@/lib/streaming/setup").StreamingNetworkTest> {
  return streamingFetch<{ result: import("@/lib/streaming/setup").StreamingNetworkTest }>("/api/v1/streaming/network-test", {
    method: "POST",
    body: JSON.stringify({ destinationId, videoProfile }),
  }).then((r) => r.result);
}

export async function detectStreamingEncodersApi(): Promise<import("@/lib/streaming/types").StreamingEncoderDetectResult> {
  return streamingFetch<{ result: import("@/lib/streaming/types").StreamingEncoderDetectResult }>(
    "/api/v1/streaming/encoder/detect",
  ).then((r) => r.result);
}

export async function fetchStreamingPreviewStatsApi(
  destinationId: string,
): Promise<import("@/lib/streaming/types").StreamingPreviewStats> {
  return streamingFetch<{ stats: import("@/lib/streaming/types").StreamingPreviewStats }>(
    `/api/v1/streaming/encoder/preview?destinationId=${encodeURIComponent(destinationId)}`,
  ).then((r) => r.stats);
}

export async function prepareStreamingEncoderApi(destinationId: string): Promise<{ success: boolean; message: string }> {
  return streamingFetch("/api/v1/streaming/encoder/prepare", {
    method: "POST",
    body: JSON.stringify({ destinationId }),
  });
}
