import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";
import { getVmixAdapterState, runVmixAdapterCommand } from "@/lib/live-hub/vmix/adapter";
import type { VmixCommand, VmixCommandType } from "@/lib/live-hub/vmix/types";

const CONFIRMATION_COMMANDS: VmixCommandType[] = [
  "stop_recording",
  "stop_streaming",
];

const READINESS_COMMANDS: VmixCommandType[] = ["start_streaming"];

function isVmixCommandType(value: unknown): value is VmixCommandType {
  return (
    value === "cut" ||
    value === "fade" ||
    value === "start_recording" ||
    value === "stop_recording" ||
    value === "start_streaming" ||
    value === "stop_streaming" ||
    value === "refresh_state"
  );
}

function parseCommand(body: unknown): VmixCommand | null {
  if (!body || typeof body !== "object") return null;
  const type = (body as { command?: { type?: unknown } }).command?.type;
  if (!isVmixCommandType(type)) return null;
  return { type };
}

export async function GET() {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  const result = await getVmixAdapterState();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}

export async function POST(request: NextRequest) {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  try {
    const body = await request.json();
    const command = parseCommand(body);

    if (!command) {
      return NextResponse.json(
        { ok: false, error: "Invalid vMix command.", code: "INVALID_COMMAND" },
        { status: 400 },
      );
    }

    const confirmed = (body as { confirmed?: boolean }).confirmed === true;
    const readinessReviewed =
      (body as { readinessReviewed?: boolean }).readinessReviewed === true;

    if (CONFIRMATION_COMMANDS.includes(command.type) && !confirmed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Confirmation required for this command.",
          code: "CONFIRMATION_REQUIRED",
        },
        { status: 409 },
      );
    }

    if (READINESS_COMMANDS.includes(command.type) && !readinessReviewed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Readiness review required before starting vMix streaming.",
          code: "READINESS_REQUIRED",
        },
        { status: 409 },
      );
    }

    const result = await runVmixAdapterCommand(command);
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    console.error("[LIVE_HUB_VMIX_ERR]:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to execute vMix command.", code: "VMIX_ROUTE_ERROR" },
      { status: 500 },
    );
  }
}
