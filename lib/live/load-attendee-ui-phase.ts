import { resolveAttendeeUiPhase, type AttendeeUiPhase } from "@/lib/live/attendee-ui-phase";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Server-side attendee surface phase from live_stream_state (single source of truth). */
export async function loadAttendeeUiPhase(): Promise<AttendeeUiPhase> {
  try {
    const admin = getSupabaseAdmin();
    const { row } = await loadOwnerStreamState(admin);
    return resolveAttendeeUiPhase(row);
  } catch {
    return "pre_show";
  }
}
