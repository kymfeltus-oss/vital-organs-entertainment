import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth/session";
import { getProductionBrain } from "@/services/broadcast/ProductionBrain";

export async function GET(request: NextRequest) {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }

  const supervisorOverride =
    request.nextUrl.searchParams.get("supervisorOverride") === "true";
  const supervisorReason =
    request.nextUrl.searchParams.get("supervisorReason")?.trim() ?? "";
  const rehearsalMode = request.nextUrl.searchParams.get("rehearsalMode") === "true";
  const mitigationCheckId =
    request.nextUrl.searchParams.get("mitigationCheckId")?.trim() ?? undefined;

  try {
    const brain = getProductionBrain();
    const uiOverrides = { supervisorOverride, supervisorReason, rehearsalMode };

    const store = mitigationCheckId
      ? await brain.recordMitigationIntent(mitigationCheckId, uiOverrides)
      : await brain.hydrateStore(uiOverrides);

    return NextResponse.json(store, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[BROADCAST_SNAPSHOT_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to hydrate production store." },
      { status: 500 },
    );
  }
}
