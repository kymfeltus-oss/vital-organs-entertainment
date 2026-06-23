import { NextRequest, NextResponse } from "next/server";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { broadcastOpsStreamStateSync } from "@/lib/ops/broadcast-stream-state-sync";
import { getCrewRoleFromRequest } from "@/lib/ops/crew-role-auth";
import {
  fetchLiveStreamStateRow,
  isLiveStreamRtmpSchemaError,
} from "@/lib/ops/fetch-live-stream-state-row";
import { generateDeviceStreamKey } from "@/lib/ops/generate-device-key";
import { requireOpsMetricsApiUser } from "@/lib/ops/require-ops-mutation";
import { canAccessModule } from "@/lib/ops/team-roles";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type SessionBody = {
  operatorName?: unknown;
  pingOnly?: unknown;
};

const SESSION_SELECT =
  "active_mobile_stream_key, connected_phone_clients_count, last_mobile_ping_at, updated_at, updated_by";

const EMPTY_SESSION_RESPONSE = {
  success: true as const,
  streamKey: null,
  connectedPhoneClientsCount: 0,
  lastMobilePingAt: null,
  updatedAt: null,
  updatedBy: null,
};

function resolveOperatorName(value: unknown, fallback = "phone_operator"): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function isSchemaMigrationError(error: unknown): boolean {
  return error instanceof Error && isLiveStreamRtmpSchemaError(error.message);
}

async function authorizeCameraDeskSession(
  request: NextRequest,
): Promise<Response | NextResponse | null> {
  const metricsGate = await requireOpsMetricsApiUser(request);
  if (metricsGate.response) return metricsGate.response;

  const { role } = await getCrewRoleFromRequest(request);
  if (!canAccessModule(role, "camera_desk")) {
    return NextResponse.json(
      { success: false, error: "Forbidden: camera desk access required." },
      { status: 403 },
    );
  }

  return null;
}

function formatSessionResponse(data: {
  active_mobile_stream_key: string | null;
  connected_phone_clients_count?: number | null;
  last_mobile_ping_at?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
}) {
  const streamKey = data.active_mobile_stream_key?.trim() ?? null;

  return {
    success: true as const,
    streamKey,
    connectedPhoneClientsCount: data.connected_phone_clients_count ?? 0,
    lastMobilePingAt: data.last_mobile_ping_at ?? null,
    updatedAt: data.updated_at ?? null,
    updatedBy: data.updated_by ?? null,
  };
}

async function registerMobileSession(
  operatorName: string,
  options: { incrementClients?: boolean } = {},
): Promise<ReturnType<typeof formatSessionResponse>> {
  const mobileSessionKey = generateDeviceStreamKey(operatorName);
  const now = new Date().toISOString();
  const admin = getSupabaseAdmin();

  const { data: existing, error: loadError } = await admin
    .from("live_stream_state")
    .select("connected_phone_clients_count")
    .eq("id", LIVE_STREAM_STATE_ID)
    .maybeSingle();

  if (loadError) {
    if (isSchemaMigrationError(loadError)) {
      throw new Error("SCHEMA_MIGRATION_REQUIRED");
    }
    throw loadError;
  }

  const nextClientCount =
    (existing?.connected_phone_clients_count ?? 0) + (options.incrementClients ? 1 : 0);

  const { data, error } = await admin
    .from("live_stream_state")
    .update({
      active_mobile_stream_key: mobileSessionKey,
      connected_phone_clients_count: Math.max(1, nextClientCount),
      last_mobile_ping_at: now,
      updated_at: now,
      updated_by: "camera_desk_session",
    })
    .eq("id", LIVE_STREAM_STATE_ID)
    .select(SESSION_SELECT)
    .single();

  if (error) {
    if (isSchemaMigrationError(error)) {
      throw new Error("SCHEMA_MIGRATION_REQUIRED");
    }
    throw error ?? new Error("Stream state row not found.");
  }

  if (!data) {
    throw new Error("Stream state row not found.");
  }

  try {
    await broadcastOpsStreamStateSync();
  } catch (syncError) {
    console.warn("[OPS_CAMERA_DESK_SESSION_SYNC_WARN]:", syncError);
  }

  return formatSessionResponse(data);
}

async function pingMobileSession(): Promise<ReturnType<typeof formatSessionResponse>> {
  const now = new Date().toISOString();
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("live_stream_state")
    .update({
      last_mobile_ping_at: now,
      updated_at: now,
      updated_by: "camera_desk_ping",
    })
    .eq("id", LIVE_STREAM_STATE_ID)
    .select(SESSION_SELECT)
    .single();

  if (error) {
    if (isSchemaMigrationError(error)) {
      throw new Error("SCHEMA_MIGRATION_REQUIRED");
    }
    throw error ?? new Error("Stream state row not found.");
  }

  if (!data) {
    throw new Error("Stream state row not found.");
  }

  return formatSessionResponse(data);
}

export async function GET(request: NextRequest) {
  const denied = await authorizeCameraDeskSession(request);
  if (denied) return denied;

  try {
    const admin = getSupabaseAdmin();
    const row = await fetchLiveStreamStateRow(admin);

    if (!row) {
      return NextResponse.json(EMPTY_SESSION_RESPONSE, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    return NextResponse.json(
      formatSessionResponse({
        active_mobile_stream_key: row.active_mobile_stream_key,
        connected_phone_clients_count: row.connected_phone_clients_count,
        last_mobile_ping_at: row.last_mobile_ping_at,
        updated_at: row.updated_at,
        updated_by: row.updated_by,
      }),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[OPS_CAMERA_DESK_SESSION_GET_ERR]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load camera desk session." },
      { status: 500 },
    );
  }
}

/** Register a fresh mobile stream key on phone login (legacy alias for PATCH). */
export async function POST(request: NextRequest) {
  return PATCH(request);
}

/** Primary mobile handshake — generate key and lock it on current_event. */
export async function PATCH(request: NextRequest) {
  const denied = await authorizeCameraDeskSession(request);
  if (denied) return denied;

  try {
    let body: SessionBody = {};
    try {
      body = (await request.json()) as SessionBody;
    } catch {
      // Empty body registers a fresh session with defaults.
    }

    if (body.pingOnly === true) {
      const pingResult = await pingMobileSession();
      return NextResponse.json(pingResult, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const operatorName = resolveOperatorName(body.operatorName, "phone_operator");
    const result = await registerMobileSession(operatorName, { incrementClients: true });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SCHEMA_MIGRATION_REQUIRED") {
      return NextResponse.json(
        {
          ...EMPTY_SESSION_RESPONSE,
          schemaMigrationRequired: true,
          error:
            "Mobile session columns are not migrated yet. Apply migration 0018_active_mobile_stream_session.sql.",
        },
        { status: 503, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    console.error("[OPS_CAMERA_DESK_SESSION_PATCH_ERR]:", error);
    const message =
      error instanceof Error ? error.message : "Unable to register camera desk session.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
