import { NextResponse } from "next/server";
import { loadActiveStreamGraphic } from "@/lib/owner/load-active-stream-graphic";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Read-only active owner graphic for attendee /live in-app overlay. */
export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const payload = await loadActiveStreamGraphic(admin);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[access/live/stream-graphics] GET failed:", error);
    return NextResponse.json({ error: "Unable to load stream graphics." }, { status: 500 });
  }
}
