import { NextRequest, NextResponse } from "next/server";
import { DEV_MANIFEST_FALLBACK_HLS } from "@/lib/live/manifest-dev-fallback";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { broadcastOpsStreamStateSync } from "@/lib/ops/broadcast-stream-state-sync";
import { buildRtmpIngestFields } from "@/lib/ops/resolve-stream-rtmp-ingest";
import { requireOpsStreamMutationApiUser } from "@/lib/ops/require-ops-mutation";
import { isLiveStreamRtmpSchemaError } from "@/lib/ops/fetch-live-stream-state-row";
import {
  readPostgrestErrorMessage,
  STREAM_SCHEMA_MIGRATION_HINT,
} from "@/lib/ops/stream-state-schema-deferred";
import {
  buildPrimaryRtmpIngestUrl,
  resolveRtmpIngestServerBase,
} from "@/lib/stream-keys";
import { generateSecureStreamKey } from "@/lib/stream-keys-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type PersistedIngestRow = {
  primary_rtmp_ingest_url: string | null;
  backup_rtmp_ingest_url: string | null;
  updated_at: string | null;
  updated_by: string | null;
};

type PersistResult = {
  persisted: boolean;
  warning: string | null;
  data: PersistedIngestRow | null;
};

async function persistPrimaryRtmpIngestUrl(
  primaryRtmpIngestUrl: string,
  updatedBy: string,
): Promise<PersistResult> {
  const admin = getSupabaseAdmin();
  const patch = {
    primary_rtmp_ingest_url: primaryRtmpIngestUrl,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };

  const updateResult = await admin
    .from("live_stream_state")
    .update(patch)
    .eq("id", LIVE_STREAM_STATE_ID)
    .select("primary_rtmp_ingest_url, backup_rtmp_ingest_url, updated_at, updated_by")
    .maybeSingle();

  if (updateResult.error) {
    const message = readPostgrestErrorMessage(updateResult.error);
    if (isLiveStreamRtmpSchemaError(message)) {
      return {
        persisted: false,
        warning: STREAM_SCHEMA_MIGRATION_HINT,
        data: null,
      };
    }
    return { persisted: false, warning: message, data: null };
  }

  if (updateResult.data) {
    return {
      persisted: true,
      warning: null,
      data: updateResult.data as PersistedIngestRow,
    };
  }

  const upsertResult = await admin
    .from("live_stream_state")
    .upsert(
      {
        id: LIVE_STREAM_STATE_ID,
        is_live: false,
        playback_url: DEV_MANIFEST_FALLBACK_HLS,
        ...patch,
      },
      { onConflict: "id" },
    )
    .select("primary_rtmp_ingest_url, backup_rtmp_ingest_url, updated_at, updated_by")
    .single();

  if (upsertResult.error) {
    const message = readPostgrestErrorMessage(upsertResult.error);
    if (isLiveStreamRtmpSchemaError(message)) {
      return {
        persisted: false,
        warning: STREAM_SCHEMA_MIGRATION_HINT,
        data: null,
      };
    }
    return { persisted: false, warning: message, data: null };
  }

  return {
    persisted: true,
    warning: null,
    data: upsertResult.data as PersistedIngestRow,
  };
}

export async function POST(request: NextRequest) {
  const gate = await requireOpsStreamMutationApiUser(request);
  if (gate.response) return gate.response;

  try {
    const streamKey = generateSecureStreamKey();
    const serverUrl = resolveRtmpIngestServerBase();
    const primaryRtmpIngestUrl = buildPrimaryRtmpIngestUrl(streamKey, serverUrl);

    const persist = await persistPrimaryRtmpIngestUrl(
      primaryRtmpIngestUrl,
      gate.user.email ?? "ops_stream_ingest_generate",
    );

    if (persist.persisted) {
      try {
        await broadcastOpsStreamStateSync();
      } catch (syncError) {
        console.warn("[OPS_STREAM_INGEST_GENERATE_SYNC_WARN]:", syncError);
      }
    } else if (persist.warning) {
      console.warn("[OPS_STREAM_INGEST_GENERATE_PERSIST_WARN]:", persist.warning);
    }

    const storedPrimary = persist.data?.primary_rtmp_ingest_url ?? primaryRtmpIngestUrl;
    const storedBackup = persist.data?.backup_rtmp_ingest_url ?? null;
    const ingest = buildRtmpIngestFields(storedPrimary, storedBackup);

    return NextResponse.json({
      success: true,
      serverUrl,
      streamKey,
      primaryRtmpIngestUrl,
      persisted: persist.persisted,
      warning: persist.warning,
      ...ingest,
      updatedAt: persist.data?.updated_at ?? null,
      updatedBy: persist.data?.updated_by ?? null,
    });
  } catch (error) {
    console.error("[OPS_STREAM_INGEST_GENERATE_ERR]:", error);
    const message =
      error instanceof Error ? error.message : "Unable to generate camera stream key.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
