import { NextResponse } from "next/server";
import { loadLivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";
import type { LivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";

export const dynamic = "force-dynamic";

/**
 * Read-only LIV Golf stream status gateway.
 * Aggregates live_stream_state row (id=current_event), event_countdown_config.start_time,
 * HLS manifest probe, and preflight blockers.
 *
 * Realtime client surfaces subscribe to stream-state-sync / stream-graphics-sync
 * and call this route on broadcast (no polling interval).
 *
 * Mutations: POST /api/owner/broadcast/preflight | master-go-live | broadcast-end
 */
export async function GET() {
  try {
    const status: LivStreamSetupStatus = await loadLivStreamSetupStatus();
    const response = NextResponse.json(status);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("[enterprise/liv-golf/stream-setup] GET failed:", error);
    return NextResponse.json({ error: "Unable to load stream setup status." }, { status: 500 });
  }
}
