import { NextRequest, NextResponse } from "next/server";
import { syncPastBroadcastRecording } from "@/lib/ops/past-broadcast-recordings";
import { requireOpsStreamMutationApiUser } from "@/lib/ops/require-ops-mutation";

type SyncRecordingBody = {
  eventId?: unknown;
  streamTitle?: unknown;
};

export async function POST(request: NextRequest) {
  const gate = await requireOpsStreamMutationApiUser(request);
  if (gate.response) return gate.response;

  try {
    const body = (await request.json().catch(() => ({}))) as SyncRecordingBody;

    const eventId =
      typeof body.eventId === "string" && body.eventId.trim().length > 0
        ? body.eventId.trim()
        : undefined;

    const streamTitle =
      typeof body.streamTitle === "string" && body.streamTitle.trim().length > 0
        ? body.streamTitle.trim()
        : undefined;

    const result = await syncPastBroadcastRecording({ eventId, streamTitle });

    if (result.ok === false) {
      const status =
        result.code === "RESTREAM_TOKEN_MISSING" || result.code === "MIGRATION_REQUIRED"
          ? 503
          : result.code === "RECORDINGS_NOT_READY" || result.code === "RESTREAM_EVENT_NOT_FOUND"
            ? 409
            : 502;

      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status },
      );
    }

    return NextResponse.json({
      success: true,
      created: result.created,
      savedRecording: result.savedRecording,
    });
  } catch (error) {
    console.error("[OPS_RECORDINGS_SYNC_ERR]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to sync recordings.",
      },
      { status: 500 },
    );
  }
}
