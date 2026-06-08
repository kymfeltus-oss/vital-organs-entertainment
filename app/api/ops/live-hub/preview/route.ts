import { NextResponse } from "next/server";
import { buildOpsLivePreviewPayload } from "@/lib/live-hub/preview";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("live_stream_state")
      .select(
        "is_live, active_source, primary_playback_url, backup_playback_url, updated_at",
      )
      .eq("id", LIVE_STREAM_STATE_ID)
      .maybeSingle();

    if (error) {
      console.error("[LIVE_HUB_PREVIEW_ERR]:", error);
      return NextResponse.json(
        buildOpsLivePreviewPayload(null, "Unable to load live stream state."),
        { status: 503 },
      );
    }

    return NextResponse.json(buildOpsLivePreviewPayload(data), {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (routeError) {
    console.error("[LIVE_HUB_PREVIEW_ERR]:", routeError);
    return NextResponse.json(
      buildOpsLivePreviewPayload(null, "Preview route failed."),
      { status: 500 },
    );
  }
}
