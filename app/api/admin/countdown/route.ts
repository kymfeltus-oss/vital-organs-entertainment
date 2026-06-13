import { NextResponse } from "next/server";
import { validateCountdownConfigInput } from "@/lib/live/countdown-config";
import {
  loadAdminCountdownConfig,
  saveCountdownConfig,
} from "@/lib/live/fetch-countdown-config";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";

export async function GET() {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  try {
    const config = await loadAdminCountdownConfig();
    return NextResponse.json(config, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[COUNTDOWN_ADMIN_GET_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to load countdown configuration." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCountdownConfigInput(body);

    if (validation.ok === false) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const saved = await saveCountdownConfig(validation.config);
    return NextResponse.json(saved);
  } catch (error) {
    console.error("[COUNTDOWN_ADMIN_POST_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to save countdown configuration." },
      { status: 500 },
    );
  }
}
