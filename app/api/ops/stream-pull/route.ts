import { NextRequest, NextResponse } from "next/server";
import { isValidHlsUrl, HLS_PLAYBACK_REQUIREMENT } from "@/lib/live/hls";
import {
  isValidRtmpPullUrlLoose,
  RTMP_PULL_REQUIREMENT,
} from "@/lib/live/rtmp-pull";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { buildRtmpPullFields } from "@/lib/ops/resolve-stream-rtmp-pull";
import {
  requireOpsMetricsApiUser,
  requireOpsStreamMutationApiUser,
} from "@/lib/ops/require-ops-mutation";
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

    if (error) throw error;

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
      if (!isValidRtmpPullUrlLoose(primaryRtmpPullUrl)) {
        return NextResponse.json({ error: RTMP_PULL_REQUIREMENT }, { status: 400 });
      }
    }

    if (backupRtmpPullUrl !== undefined && backupRtmpPullUrl !== null) {
      if (!isValidRtmpPullUrlLoose(backupRtmpPullUrl)) {
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

    if (error || !data) throw error ?? new Error("Stream state row not found.");

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
    return NextResponse.json(
      { error: "Unable to update RTMP pull configuration." },
      { status: 500 },
    );
  }
}
