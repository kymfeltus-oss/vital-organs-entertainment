import { NextRequest, NextResponse } from "next/server";
import { syncCountdownScheduleForGoLive } from "@/lib/live-hub/go-live/sync-attendee-countdown";
import { executeStreamToggle } from "@/lib/ops/execute-stream-toggle";
import { schedulePastBroadcastRecordingSync } from "@/lib/ops/past-broadcast-recordings";
import { requireOpsStreamMutationApiUser } from "@/lib/ops/require-ops-mutation";
import type { OpsStreamAction } from "@/lib/ops/types";

type StreamActionBody = {
  action?: OpsStreamAction;
};

function resolveTogglePayload(action: OpsStreamAction) {
  switch (action) {
    case "go_live":
      return { isLive: true as const, activeSource: "primary" as const };
    case "switch_backup":
      return { isLive: true as const, activeSource: "backup" as const };
    case "emergency_offline":
      return { isLive: false as const };
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireOpsStreamMutationApiUser(request);
  if (gate.response) return gate.response;

  if (!process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stream controls are not configured." },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as StreamActionBody;
    const action = body.action;

    if (
      action !== "go_live" &&
      action !== "switch_backup" &&
      action !== "emergency_offline"
    ) {
      return NextResponse.json({ error: "Invalid stream action." }, { status: 400 });
    }

    const toggleResult = await executeStreamToggle(resolveTogglePayload(action));

    if (toggleResult.ok === false) {
      return NextResponse.json({ error: toggleResult.error }, { status: toggleResult.status });
    }

    let countdownSynced = false;

    if (action === "go_live" || action === "switch_backup") {
      try {
        const syncResult = await syncCountdownScheduleForGoLive();
        countdownSynced = syncResult.updated;
      } catch (error) {
        console.error("[OPS_STREAM_ACTION_COUNTDOWN_SYNC_ERR]:", error);
      }
    } else if (action === "emergency_offline") {
      schedulePastBroadcastRecordingSync({ streamTitle: "300 Awakening Broadcast" });
    }

    const streamState = toggleResult.state;

    return NextResponse.json({
      success: true,
      action,
      actionExecuted: action,
      state: streamState,
      isLive: streamState.is_live,
      useBackup: streamState.active_source === "backup",
      countdownSynced,
    });
  } catch (error) {
    console.error("[OPS_STREAM_ACTION_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to execute stream action." },
      { status: 500 },
    );
  }
}
