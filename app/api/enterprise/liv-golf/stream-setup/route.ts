import { NextResponse } from "next/server";
import { loadLivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";
import type { LivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";

export const dynamic = "force-dynamic";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown error";
}

/**
 * Read-only LIV Golf stream status gateway.
 *
 * Data sources (production):
 * - live_stream_state singleton row id = current_event
 * - event_countdown_config.start_time for target air time
 * - HLS manifest probe + owner preflight blockers via loadLivStreamSetupStatus()
 *
 * Realtime clients subscribe to stream-state-sync / stream-graphics-sync (no polling).
 */
export async function GET() {
  try {
    const status: LivStreamSetupStatus = await loadLivStreamSetupStatus();

    return NextResponse.json(
      status,
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error: unknown) {
    const details = errorMessage(error);
    console.error("[enterprise/liv-golf/stream-setup] GET failed:", details);

    return NextResponse.json(
      {
        error: "Unable to load stream setup status.",
        details,
      },
      {
        status: 500,
      },
    );
  }
}
