import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";
import {
  executeGoLiveSequence,
  executeStopStreamSequence,
} from "@/lib/live-hub/go-live/execute";

type GoLiveAction = "go_live" | "stop_stream";

function parseAction(body: unknown): GoLiveAction | null {
  if (!body || typeof body !== "object") return null;
  const action = (body as { action?: unknown }).action;
  if (action === "go_live" || action === "stop_stream") return action;
  return null;
}

export async function POST(request: NextRequest) {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  try {
    const body = await request.json();
    const action = parseAction(body);

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "Invalid go-live action.", code: "INVALID_ACTION" },
        { status: 400 },
      );
    }

    if (action === "stop_stream") {
      const result = await executeStopStreamSequence();
      if (!result.ok) {
        return NextResponse.json(result, { status: 503 });
      }
      return NextResponse.json({ ok: true, action: "stop_stream" });
    }

    const result = await executeGoLiveSequence();
    if (!result.ok) {
      return NextResponse.json(result, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      action: "go_live",
      activatedChannelIds: result.activatedChannelIds,
      vmixStreaming: result.vmixStreaming,
      platformLive: result.platformLive,
    });
  } catch (error) {
    console.error("[LIVE_HUB_GO_LIVE_ERR]:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to execute go-live sequence.",
        code: "GO_LIVE_ROUTE_ERROR",
      },
      { status: 500 },
    );
  }
}
