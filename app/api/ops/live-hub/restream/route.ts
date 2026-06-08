import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";
import {
  getRestreamAdapterState,
  runRestreamAdapterCommand,
} from "@/lib/live-hub/restream/adapter";
import type { RestreamCommandType } from "@/lib/live-hub/restream/types";

function isRestreamCommandType(value: unknown): value is RestreamCommandType {
  return value === "refresh_status" || value === "sync_metadata";
}

export async function GET() {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  const result = await getRestreamAdapterState();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}

export async function POST(request: NextRequest) {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  try {
    const body = await request.json();
    const type = (body as { command?: { type?: unknown } }).command?.type;

    if (!isRestreamCommandType(type)) {
      return NextResponse.json(
        { ok: false, error: "Invalid Restream command.", code: "INVALID_COMMAND" },
        { status: 400 },
      );
    }

    const result = await runRestreamAdapterCommand({ type });
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    console.error("[LIVE_HUB_RESTREAM_ERR]:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to execute Restream command.",
        code: "RESTREAM_ROUTE_ERROR",
      },
      { status: 500 },
    );
  }
}
