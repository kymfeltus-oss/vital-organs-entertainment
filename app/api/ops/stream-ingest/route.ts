import { NextRequest, NextResponse } from "next/server";
import { provisionRestreamRtmpIngestUrl } from "@/lib/live-hub/restream/ingest-url";
import { isValidRtmpUrl, normalizeRtmpUrl, RTMP_INGEST_REQUIREMENT } from "@/lib/live/rtmp";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { buildRtmpIngestFields } from "@/lib/ops/resolve-stream-rtmp-ingest";
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

type StreamIngestPatchBody = {
  primaryRtmpIngestUrl?: unknown;
  backupRtmpIngestUrl?: unknown;
};

function normalizeOptionalRtmp(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return normalizeRtmpUrl(trimmed);
}

export async function GET(request: NextRequest) {
  const gate = await requireOpsMetricsApiUser(request);
  if (gate.response) return gate.response;

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("live_stream_state")
      .select("primary_rtmp_ingest_url, backup_rtmp_ingest_url, updated_at, updated_by")
      .eq("id", LIVE_STREAM_STATE_ID)
      .maybeSingle();

    if (error) {
      if (shouldDeferStreamStateSchemaWrite(error)) {
        const ingest = buildRtmpIngestFields(null, null);
        return NextResponse.json(
          {
            ...ingest,
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

    const ingest = buildRtmpIngestFields(
      data?.primary_rtmp_ingest_url,
      data?.backup_rtmp_ingest_url,
    );

    return NextResponse.json(
      {
        ...ingest,
        updatedAt: data?.updated_at ?? null,
        updatedBy: data?.updated_by ?? null,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[OPS_STREAM_INGEST_GET_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to load RTMP ingest configuration." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireOpsStreamMutationApiUser(request);
  if (gate.response) return gate.response;

  try {
    const provision = await provisionRestreamRtmpIngestUrl();
    if (provision.ok === false) {
      const status = provision.code === "RESTREAM_TOKEN_MISSING" ? 503 : 502;
      return NextResponse.json({ error: provision.error, code: provision.code }, { status });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("live_stream_state")
      .update({
        primary_rtmp_ingest_url: provision.primaryRtmpIngestUrl,
        updated_at: new Date().toISOString(),
        updated_by: gate.user.email ?? "ops_stream_ingest_provision",
      })
      .eq("id", LIVE_STREAM_STATE_ID)
      .select("primary_rtmp_ingest_url, backup_rtmp_ingest_url, updated_at, updated_by")
      .single();

    if (error || !data) throw error ?? new Error("Stream state row not found.");

    const ingest = buildRtmpIngestFields(
      data.primary_rtmp_ingest_url,
      data.backup_rtmp_ingest_url,
    );

    return NextResponse.json({
      success: true,
      provisioned: true,
      ingestServerName: provision.ingestServerName,
      streamKey: provision.streamKey,
      ...ingest,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    });
  } catch (error) {
    console.error("[OPS_STREAM_INGEST_POST_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to provision RTMP ingest URL from Restream." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const gate = await requireOpsStreamMutationApiUser(request);
  if (gate.response) return gate.response;

  try {
    const body = (await request.json()) as StreamIngestPatchBody;
    const primaryRtmpIngestUrl = normalizeOptionalRtmp(body.primaryRtmpIngestUrl);
    const backupRtmpIngestUrl = normalizeOptionalRtmp(body.backupRtmpIngestUrl);

    if (primaryRtmpIngestUrl !== undefined && primaryRtmpIngestUrl !== null) {
      if (!isValidRtmpUrl(primaryRtmpIngestUrl)) {
        return NextResponse.json({ error: RTMP_INGEST_REQUIREMENT }, { status: 400 });
      }
    }

    if (backupRtmpIngestUrl !== undefined && backupRtmpIngestUrl !== null) {
      if (!isValidRtmpUrl(backupRtmpIngestUrl)) {
        return NextResponse.json({ error: RTMP_INGEST_REQUIREMENT }, { status: 400 });
      }
    }

    if (primaryRtmpIngestUrl === undefined && backupRtmpIngestUrl === undefined) {
      return NextResponse.json({ error: "No RTMP ingest fields provided." }, { status: 400 });
    }

    const patch: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
      updated_by: gate.user.email ?? "ops_stream_ingest",
    };

    if (primaryRtmpIngestUrl !== undefined) {
      patch.primary_rtmp_ingest_url = primaryRtmpIngestUrl;
    }
    if (backupRtmpIngestUrl !== undefined) {
      patch.backup_rtmp_ingest_url = backupRtmpIngestUrl;
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("live_stream_state")
      .update(patch)
      .eq("id", LIVE_STREAM_STATE_ID)
      .select("primary_rtmp_ingest_url, backup_rtmp_ingest_url, updated_at, updated_by")
      .single();

    if (error) {
      if (shouldDeferStreamStateSchemaWrite(error)) {
        const ingest = buildRtmpIngestFields(
          primaryRtmpIngestUrl !== undefined ? primaryRtmpIngestUrl : null,
          backupRtmpIngestUrl !== undefined ? backupRtmpIngestUrl : null,
        );
        return NextResponse.json({
          success: true,
          schemaDeferred: true,
          warning: STREAM_SCHEMA_MIGRATION_HINT,
          ...ingest,
          updatedAt: null,
          updatedBy: null,
        });
      }
      throw error;
    }

    if (!data) throw new Error("Stream state row not found.");

    const ingest = buildRtmpIngestFields(
      data.primary_rtmp_ingest_url,
      data.backup_rtmp_ingest_url,
    );

    return NextResponse.json({
      success: true,
      ...ingest,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    });
  } catch (error) {
    console.error("[OPS_STREAM_INGEST_PATCH_ERR]:", error);
    return NextResponse.json(
      {
        error:
          readPostgrestErrorMessage(error) === "Unknown database error."
            ? "Unable to update RTMP ingest configuration."
            : readPostgrestErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
