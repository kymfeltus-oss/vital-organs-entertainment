import { NextRequest, NextResponse } from "next/server";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { broadcastOpsStreamStateSync } from "@/lib/ops/broadcast-stream-state-sync";
import {
  requireOpsMetricsApiUser,
  requireOpsStreamMutationApiUser,
} from "@/lib/ops/require-ops-mutation";
import {
  isStudioEngineMode,
  normalizeStudioEngineMode,
  type StudioEngineMode,
} from "@/lib/ops/studio-engine-mode";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type StreamEnginePatchBody = {
  studioEngineMode?: unknown;
};

export async function GET(request: NextRequest) {
  const gate = await requireOpsMetricsApiUser(request);
  if (gate.response) return gate.response;

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("live_stream_state")
      .select("studio_engine_mode, updated_at, updated_by")
      .eq("id", LIVE_STREAM_STATE_ID)
      .maybeSingle();

    if (error) {
      if (/column .+ does not exist/i.test(error.message)) {
        return NextResponse.json(
          {
            studioEngineMode: normalizeStudioEngineMode(null),
            updatedAt: null,
            updatedBy: null,
          },
          { headers: { "Cache-Control": "private, no-store" } },
        );
      }
      throw error;
    }

    return NextResponse.json(
      {
        studioEngineMode: normalizeStudioEngineMode(data?.studio_engine_mode),
        updatedAt: data?.updated_at ?? null,
        updatedBy: data?.updated_by ?? null,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[OPS_STREAM_ENGINE_GET_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to load studio engine mode." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const gate = await requireOpsStreamMutationApiUser(request);
  if (gate.response) return gate.response;

  try {
    const body = (await request.json()) as StreamEnginePatchBody;

    if (!isStudioEngineMode(body.studioEngineMode)) {
      return NextResponse.json(
        {
          error:
            "studioEngineMode must be 'internal_studio' or 'restream_api'.",
        },
        { status: 400 },
      );
    }

    const studioEngineMode = body.studioEngineMode as StudioEngineMode;
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("live_stream_state")
      .update({
        studio_engine_mode: studioEngineMode,
        updated_at: new Date().toISOString(),
        updated_by: gate.user.email ?? "ops_stream_engine",
      })
      .eq("id", LIVE_STREAM_STATE_ID)
      .select("studio_engine_mode, updated_at, updated_by")
      .single();

    if (error) {
      if (/column .+ does not exist/i.test(error.message)) {
        return NextResponse.json(
          {
            error:
              "Studio engine mode column is not applied. Run migration 0015_add_studio_orchestration_mode.sql.",
          },
          { status: 503 },
        );
      }
      throw error ?? new Error("Stream state row not found.");
    }

    if (!data) {
      throw new Error("Stream state row not found.");
    }

    try {
      await broadcastOpsStreamStateSync();
    } catch (broadcastError) {
      console.error("[OPS_STREAM_ENGINE_BROADCAST_ERR]:", broadcastError);
    }

    return NextResponse.json({
      success: true,
      studioEngineMode: normalizeStudioEngineMode(data.studio_engine_mode),
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    });
  } catch (error) {
    console.error("[OPS_STREAM_ENGINE_PATCH_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to update studio engine mode." },
      { status: 500 },
    );
  }
}
