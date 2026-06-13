import { NextResponse } from "next/server";
import { toPublicCountdownConfig } from "@/lib/live/countdown-config";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";

export async function GET() {
  try {
    const config = await loadActiveCountdownConfig();
    return NextResponse.json(toPublicCountdownConfig(config), {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("[COUNTDOWN_PUBLIC_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to load countdown configuration." },
      { status: 500 },
    );
  }
}
