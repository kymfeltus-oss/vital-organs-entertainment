import { getClientAppUrl } from "@/lib/client-api";
import type {
  GoLiveRequestBody,
  OwnerBroadcastSnapshot,
} from "@/lib/owner/contracts";

type ApiErrorBody = {
  error?: string;
  message?: string;
  ok?: boolean;
};

function parseApiError(
  response: Response,
  json: ApiErrorBody,
  fallback: string,
): string {
  return json.error || json.message || `${fallback} (HTTP ${response.status}).`;
}

export type OwnerPreflightResult = {
  ok: boolean;
  snapshot: OwnerBroadcastSnapshot | null;
  blocked: boolean;
  error: string | null;
};

export type OwnerBroadcastMutationResult = {
  ok: boolean;
  snapshot: OwnerBroadcastSnapshot | null;
  message: string | null;
  error: string | null;
};

const MASTER_GO_LIVE_BODY: GoLiveRequestBody = {
  mode: "external_hls",
  confirm: true,
  masterOverride: true,
};

/** POST /api/owner/broadcast/preflight — live_stream_state + IVS/HLS probe (no simulated delay). */
export async function postOwnerPreflight(
  mode: GoLiveRequestBody["mode"] = "external_hls",
): Promise<OwnerPreflightResult> {
  const response = await fetch(`${getClientAppUrl()}/api/owner/broadcast/preflight`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });

  const json = (await response.json()) as ApiErrorBody & {
    snapshot?: OwnerBroadcastSnapshot;
    blocked?: boolean;
  };

  if (!response.ok) {
    return {
      ok: false,
      snapshot: json.snapshot ?? null,
      blocked: true,
      error: parseApiError(response, json, "Preflight failed"),
    };
  }

  return {
    ok: true,
    snapshot: json.snapshot ?? null,
    blocked: Boolean(json.blocked),
    error: null,
  };
}

/** POST /api/owner/master-go-live — atomic publish on live_stream_state (id=current_event). */
export async function postOwnerMasterGoLive(
  body: GoLiveRequestBody = MASTER_GO_LIVE_BODY,
): Promise<OwnerBroadcastMutationResult> {
  const response = await fetch(`${getClientAppUrl()}/api/owner/master-go-live`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as ApiErrorBody & {
    snapshot?: OwnerBroadcastSnapshot;
    message?: string;
  };

  if (!response.ok || json.ok === false) {
    return {
      ok: false,
      snapshot: json.snapshot ?? null,
      message: json.message ?? null,
      error: parseApiError(response, json, "Master go-live failed"),
    };
  }

  return {
    ok: true,
    snapshot: json.snapshot ?? null,
    message: json.message ?? "Stream is live on platform.",
    error: null,
  };
}

/** POST /api/owner/broadcast-end — fail-closed stop; resets is_live and attendee_ui_phase. */
export async function postOwnerBroadcastEnd(): Promise<OwnerBroadcastMutationResult> {
  const response = await fetch(`${getClientAppUrl()}/api/owner/broadcast-end`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  const json = (await response.json()) as ApiErrorBody & {
    snapshot?: OwnerBroadcastSnapshot;
    message?: string;
  };

  if (!response.ok || json.ok === false) {
    return {
      ok: false,
      snapshot: json.snapshot ?? null,
      message: json.message ?? null,
      error: parseApiError(response, json, "Stop broadcast failed"),
    };
  }

  return {
    ok: true,
    snapshot: json.snapshot ?? null,
    message: json.message ?? "Broadcast ended.",
    error: null,
  };
}
