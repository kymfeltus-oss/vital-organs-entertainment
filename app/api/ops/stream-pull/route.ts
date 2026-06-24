import { NextRequest, NextResponse } from "next/server";
import { isValidHlsUrl, HLS_PLAYBACK_REQUIREMENT } from "@/lib/live/hls";
import {
  classifyRtmpStreamLink,
  isValidRtmpPullUrl,
  RTMP_PULL_REQUIREMENT,
  RTMP_PUSH_IN_PULL_FIELD,
} from "@/lib/live/rtmp-pull";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { isLiveStreamRtmpSchemaError } from "@/lib/ops/fetch-live-stream-state-row";
import { buildRtmpPullFields } from "@/lib/ops/resolve-stream-rtmp-pull";
import {
  requireOpsMetricsApiUser,
  requireOpsStreamMutationApiUser,
} from "@/lib/ops/require-ops-mutation";
import {
  readPostgrestErrorMessage,
  shouldDeferStreamStateSchemaWrite,
  STREAM_SCHEMA_MIGRATION_HINT,
} from "@/lib/ops/stream-state-schema-deferred";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type StreamPullPatchBody = {
  primaryRtmpPullUrl?: unknown;
  backupRtmpPullUrl?: unknown;
  cameraPreviewHlsUrl?: unknown;
};

function normalizeOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildDeferredPullResponse(
  primaryRtmpPullUrl: string | null | undefined,
  backupRtmpPullUrl: string | null | undefined,
  cameraPreviewHlsUrl: string | null | undefined,
) {
  const pull = buildRtmpPullFields(
    primaryRtmpPullUrl !== undefined ? primaryRtmpPullUrl : null,
    backupRtmpPullUrl !== undefined ? backupRtmpPullUrl : null,
    cameraPreviewHlsUrl !== undefined ? cameraPreviewHlsUrl : null,
    null,
  );

  return NextResponse.json({
    success: true,
    schemaDeferred: true,
    warning: STREAM_SCHEMA_MIGRATION_HINT,
    ...pull,
    updatedAt: null,
    updatedBy: null,
  });
}

export async function GET(request: NextRequest) {
  const gate = await requireOpsMetricsApiUser(request);
  if (gate.response) return gate.response;

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("live_stream_state")
      .select(
        "primary_rtmp_pull_url, backup_rtmp_pull_url, camera_preview_hls_url, primary_playback_url, updated_at, updated_by",
      )
      .eq("id", LIVE_STREAM_STATE_ID)
      .maybeSingle();

    if (error) {
      if (shouldDeferStreamStateSchemaWrite(error)) {
        const pull = buildRtmpPullFields(null, null, null, null);
        return NextResponse.json(
          {
            ...pull,
            schemaDeferred: true,
            warning: STREAM_SCHEMA_MIGRATION_HINT,
            updatedAt: null,
            updatedBy: null,
          },
          { headers: { "Cache-Control": "private, no-store" } },
        );
      }
      throw error;
    }

    const pull = buildRtmpPullFields(
      data?.primary_rtmp_pull_url,
      data?.backup_rtmp_pull_url,
      data?.camera_preview_hls_url,
      data?.primary_playback_url,
    );

    return NextResponse.json(
      {
        ...pull,
        updatedAt: data?.updated_at ?? null,
        updatedBy: data?.updated_by ?? null,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[OPS_STREAM_PULL_GET_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to load RTMP pull configuration." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const gate = await requireOpsStreamMutationApiUser(request);
  if (gate.response) return gate.response;

  try {
    const body = (await request.json()) as StreamPullPatchBody;
    const primaryRtmpPullUrl = normalizeOptionalString(body.primaryRtmpPullUrl);
    const backupRtmpPullUrl = normalizeOptionalString(body.backupRtmpPullUrl);
    const cameraPreviewHlsUrl = normalizeOptionalString(body.cameraPreviewHlsUrl);

    if (primaryRtmpPullUrl !== undefined && primaryRtmpPullUrl !== null) {
      if (classifyRtmpStreamLink(primaryRtmpPullUrl) === "push") {
        return NextResponse.json(
          { error: RTMP_PUSH_IN_PULL_FIELD, code: "RTMP_PUSH_IN_PULL_FIELD" },
          { status: 400 },
        );
      }
      if (!isValidRtmpPullUrl(primaryRtmpPullUrl)) {
        return NextResponse.json({ error: RTMP_PULL_REQUIREMENT }, { status: 400 });
      }
    }

    if (backupRtmpPullUrl !== undefined && backupRtmpPullUrl !== null) {
      if (classifyRtmpStreamLink(backupRtmpPullUrl) === "push") {
        return NextResponse.json(
          { error: RTMP_PUSH_IN_PULL_FIELD, code: "RTMP_PUSH_IN_PULL_FIELD" },
          { status: 400 },
        );
      }
      if (!isValidRtmpPullUrl(backupRtmpPullUrl)) {
        return NextResponse.json({ error: RTMP_PULL_REQUIREMENT }, { status: 400 });
      }
    }

    if (cameraPreviewHlsUrl !== undefined && cameraPreviewHlsUrl !== null) {
      if (!isValidHlsUrl(cameraPreviewHlsUrl)) {
        return NextResponse.json({ error: HLS_PLAYBACK_REQUIREMENT }, { status: 400 });
      }
    }

    if (
      primaryRtmpPullUrl === undefined &&
      backupRtmpPullUrl === undefined &&
      cameraPreviewHlsUrl === undefined
    ) {
      return NextResponse.json({ error: "No RTMP pull fields provided." }, { status: 400 });
    }

    const patch: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
      updated_by: gate.user.email ?? "ops_stream_pull",
    };

    if (primaryRtmpPullUrl !== undefined) {
      patch.primary_rtmp_pull_url = primaryRtmpPullUrl;
    }
    if (backupRtmpPullUrl !== undefined) {
      patch.backup_rtmp_pull_url = backupRtmpPullUrl;
    }
    if (cameraPreviewHlsUrl !== undefined) {
      patch.camera_preview_hls_url = cameraPreviewHlsUrl;
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("live_stream_state")
      .update(patch)
      .eq("id", LIVE_STREAM_STATE_ID)
      .select(
        "primary_rtmp_pull_url, backup_rtmp_pull_url, camera_preview_hls_url, primary_playback_url, updated_at, updated_by",
      )
      .single();

    if (error) {
      if (shouldDeferStreamStateSchemaWrite(error)) {
        return buildDeferredPullResponse(
          primaryRtmpPullUrl,
          backupRtmpPullUrl,
          cameraPreviewHlsUrl,
        );
      }
      throw error;
    }

    if (!data) throw new Error("Stream state row not found.");

    const pull = buildRtmpPullFields(
      data.primary_rtmp_pull_url,
      data.backup_rtmp_pull_url,
      data.camera_preview_hls_url,
      data.primary_playback_url,
    );

    return NextResponse.json({
      success: true,
      ...pull,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    });
  } catch (error) {
    console.error("[OPS_STREAM_PULL_PATCH_ERR]:", error);
    const message = readPostgrestErrorMessage(error);
    const schemaError = isLiveStreamRtmpSchemaError(message);

    return NextResponse.json(
      {
        error: schemaError ? STREAM_SCHEMA_MIGRATION_HINT : message,
        code: schemaError ? "STREAM_PULL_SCHEMA_MISSING" : undefined,
      },
      { status: schemaError ? 503 : 500 },
    );
  }
}
