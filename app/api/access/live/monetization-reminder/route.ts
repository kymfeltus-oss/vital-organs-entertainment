import { NextResponse } from "next/server";
import {
  computeNextMonetizationReminderAt,
  loadGraphicsMonetizationReminders,
  resolveActiveMonetizationReminder,
} from "@/lib/owner/graphics-monetization-reminders";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const [{ row }, schedule] = await Promise.all([
      loadOwnerStreamState(admin),
      loadGraphicsMonetizationReminders(admin),
    ]);

    const isLive = row?.is_live === true;
    const active = resolveActiveMonetizationReminder(schedule, { isLive });
    const nextAt = computeNextMonetizationReminderAt(schedule, { isLive });

    return NextResponse.json({
      enabled: schedule.enabled,
      isLive,
      intervalMinutes: schedule.intervalMinutes,
      displaySeconds: schedule.displaySeconds,
      active,
      nextAt,
    });
  } catch (error) {
    console.error("[access/live/monetization-reminder] GET failed:", error);
    return NextResponse.json({ error: "Unable to load monetization reminder." }, { status: 500 });
  }
}
