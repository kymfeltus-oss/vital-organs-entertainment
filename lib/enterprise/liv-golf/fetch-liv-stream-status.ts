import { getClientAppUrl } from "@/lib/client-api";
import type { LivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";

type StatusApiError = {
  error?: string;
};

/** Fetch LIV stream status from the production gateway (live_stream_state id=current_event). */
export async function fetchLivStreamStatus(
  baseUrl = getClientAppUrl(),
): Promise<LivStreamSetupStatus> {
  const prefix = baseUrl.replace(/\/$/, "");
  const response = await fetch(`${prefix}/api/enterprise/liv-golf/stream-setup`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as StatusApiError;
    throw new Error(payload.error ?? `Unable to load stream status (${response.status}).`);
  }

  return (await response.json()) as LivStreamSetupStatus;
}
