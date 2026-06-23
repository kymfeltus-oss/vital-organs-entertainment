import { NextRequest, NextResponse } from "next/server";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { broadcastOpsStreamStateSync } from "@/lib/ops/broadcast-stream-state-sync";
import { buildRtmpIngestFields } from "@/lib/ops/resolve-stream-rtmp-ingest";
import { requireOpsStreamMutationApiUser } from "@/lib/ops/require-ops-mutation";
import {
  buildPrimaryRtmpIngestUrl,
  generateSecureStreamKey,
  resolveRtmpIngestServerBase,
} from "@/lib/stream-keys";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const gate = await requireOpsStreamMutationApiUser(request);
  if (gate.response) return gate.response;

  try {
    const streamKey = generateSecureStreamKey();
    const serverUrl = resolveRtmpIngestServerBase();
    const primaryRtmpIngestUrl = buildPrimaryRtmpIngestUrl(streamKey, serverUrl);

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("live_stream_state")
      .update({
        primary_rtmp_ingest_url: primaryRtmpIngestUrl,
        updated_at: new Date().toISOString(),
        updated_by: gate.user.email ?? "ops_stream_ingest_generate",
      })
      .eq("id", LIVE_STREAM_STATE_ID)
      .select("primary_rtmp_ingest_url, backup_rtmp_ingest_url, updated_at, updated_by")
      .single();

    if (error || !data) {
      throw error ?? new Error("Stream state row not found.");
    }

    try {
      await broadcastOpsStreamStateSync();
    } catch (syncError) {
      console.warn("[OPS_STREAM_INGEST_GENERATE_SYNC_WARN]:", syncError);
    }

    const ingest = buildRtmpIngestFields(
      data.primary_rtmp_ingest_url,
      data.backup_rtmp_ingest_url,
    );

    return NextResponse.json({
      success: true,
      serverUrl,
      streamKey,
      ...ingest,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    });
  } catch (error) {
    console.error("[OPS_STREAM_INGEST_GENERATE_ERR]:", error);
    const message =
      error instanceof Error ? error.message : "Unable to generate camera stream key.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
