import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";
import type { OpsStreamAction } from "@/lib/ops/types";

type StreamActionBody = {
  action?: OpsStreamAction;
};

function resolveTogglePayload(action: OpsStreamAction): Record<string, unknown> {
  switch (action) {
    case "go_live":
      return { isLive: true, activeSource: "primary" };
    case "switch_backup":
      return { isLive: true, activeSource: "backup" };
    case "emergency_offline":
      return { isLive: false };
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  const adminSecret = process.env.ADMIN_SECRET_KEY;
  if (!adminSecret) {
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    const toggleResponse = await fetch(`${appUrl}/api/stream/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret-Key": adminSecret,
      },
      body: JSON.stringify(resolveTogglePayload(action)),
      cache: "no-store",
    });

    const toggleData = (await toggleResponse.json()) as {
      success?: boolean;
      state?: unknown;
      error?: string;
    };

    if (!toggleResponse.ok) {
      return NextResponse.json(
        { error: toggleData.error ?? "Stream action failed." },
        { status: toggleResponse.status },
      );
    }

    return NextResponse.json({
      success: true,
      action,
      state: toggleData.state ?? null,
    });
  } catch (error) {
    console.error("[OPS_STREAM_ACTION_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to execute stream action." },
      { status: 500 },
    );
  }
}
