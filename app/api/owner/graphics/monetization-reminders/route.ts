import { requireOwnerUser } from "@/lib/owner/auth";
import { ownerAuthFailureResponse, ownerJsonResponse, isOwnerAuthed } from "@/lib/owner/api-response";
import {
  armMonetizationReminderSchedule,
  computeNextMonetizationReminderAt,
  loadGraphicsMonetizationReminders,
  resolveActiveMonetizationReminder,
  saveGraphicsMonetizationReminders,
} from "@/lib/owner/graphics-monetization-reminders";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const admin = getSupabaseAdmin();
    const [{ row }, schedule] = await Promise.all([
      loadOwnerStreamState(admin),
      loadGraphicsMonetizationReminders(admin),
    ]);
    const isLive = row?.is_live === true;
    const active = resolveActiveMonetizationReminder(schedule, { isLive });
    const nextAt = computeNextMonetizationReminderAt(schedule, { isLive });

    return ownerJsonResponse({
      success: true,
      schedule,
      isLive,
      active,
      nextAt,
    });
  } catch (error) {
    console.error("[owner/graphics/monetization-reminders] GET failed:", error);
    return ownerJsonResponse(
      { success: false, error: "Unable to load monetization reminder schedule." },
      500,
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const admin = getSupabaseAdmin();

    if (body.action === "reset_clock") {
      const schedule = await armMonetizationReminderSchedule(auth.email, admin);
      const { row } = await loadOwnerStreamState(admin);
      const isLive = row?.is_live === true;
      return ownerJsonResponse({
        success: true,
        schedule,
        isLive,
        active: resolveActiveMonetizationReminder(schedule, { isLive }),
        nextAt: computeNextMonetizationReminderAt(schedule, { isLive }),
        message: "Monetization reminder clock reset.",
      });
    }

    const schedule = await saveGraphicsMonetizationReminders(body, auth.email, admin);
    const { row } = await loadOwnerStreamState(admin);
    const isLive = row?.is_live === true;

    return ownerJsonResponse({
      success: true,
      schedule,
      isLive,
      active: resolveActiveMonetizationReminder(schedule, { isLive }),
      nextAt: computeNextMonetizationReminderAt(schedule, { isLive }),
      message: "Monetization reminder schedule saved.",
    });
  } catch (error) {
    console.error("[owner/graphics/monetization-reminders] PATCH failed:", error);
    return ownerJsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to save monetization reminders.",
      },
      400,
    );
  }
}
