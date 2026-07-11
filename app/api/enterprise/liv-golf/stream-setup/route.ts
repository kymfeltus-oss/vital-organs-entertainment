import { NextResponse } from "next/server";
import { loadLivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";

export const dynamic = "force-dynamic";

/** Read-only stream status for LIV Golf surfaces (studio, command center). */
export async function GET() {
  try {
    const status = await loadLivStreamSetupStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("[enterprise/liv-golf/stream-setup] GET failed:", error);
    return NextResponse.json({ error: "Unable to load stream setup status." }, { status: 500 });
  }
}
