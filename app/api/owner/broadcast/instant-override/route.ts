import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireOwnerUser } from "@/lib/owner/auth";
import { runOwnerInstantOverride } from "@/lib/owner/broadcast-mutations";
import {
  ownerAuthFailureResponse,
  ownerJsonResponse,
  isOwnerAuthed,
} from "@/lib/owner/api-response";

export const dynamic = "force-dynamic";

/** Drop Curtain — bypass schedule preflight; set imminent_live and notify attendees. */
export async function POST() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const admin = getSupabaseAdmin();
    const result = await runOwnerInstantOverride(admin, auth.email);
    return ownerJsonResponse(
      {
        ok: result.ok,
        snapshot: result.snapshot,
        message: result.message,
        currentState: result.currentState,
        dropStartedAt: result.dropStartedAt,
        durationSeconds: result.durationSeconds,
      },
      result.ok ? 200 : 409,
    );
  } catch (error) {
    console.error("[owner/broadcast/instant-override] POST failed:", error);
    return ownerJsonResponse({ error: "Instant override failed." }, 500);
  }
}
