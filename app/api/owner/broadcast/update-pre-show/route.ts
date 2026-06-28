import { requireOwnerUser } from "@/lib/owner/auth";
import {
  isOwnerAuthed,
  ownerAuthFailureResponse,
  ownerJsonResponse,
} from "@/lib/owner/api-response";
import { buildOwnerBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot";
import { emitStreamStateSync } from "@/lib/owner/broadcast-stream-sync";
import { updateOwnerStreamState } from "@/lib/owner/load-owner-state";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type UpdatePreShowBody = {
  concertTitle?: unknown;
  headlinerName?: unknown;
  gatesLocked?: unknown;
  preShowVipOnly?: unknown;
};

function cleanText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 120) : fallback;
}

export async function POST(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as UpdatePreShowBody;
    const admin = getSupabaseAdmin();

    const concertTitle = cleanText(body.concertTitle, "The Awakening Experience");
    const headlinerName = cleanText(body.headlinerName, "Pastor David Jenkins");
    const gatesLocked = body.gatesLocked === true;
    const preShowVipOnly = body.preShowVipOnly !== false;

    const { error } = await updateOwnerStreamState(admin, {
      current_state: "scheduled",
      concert_title: concertTitle,
      headliner_name: headlinerName,
      gates_locked: gatesLocked,
      pre_show_vip_only: preShowVipOnly,
      publish_error_message: null,
      playback_error_message: null,
      updated_by: auth.email,
    });

    if (error) {
      return ownerJsonResponse({ error }, 500);
    }

    await emitStreamStateSync({ event: "pre_show_updated" });

    const { snapshot } = await buildOwnerBroadcastSnapshot();
    return ownerJsonResponse({
      ok: true,
      message: "Pre-show details saved and countdown clock is ready.",
      snapshot,
    });
  } catch (error) {
    console.error("[owner/broadcast/update-pre-show] POST failed:", error);
    return ownerJsonResponse({ error: "Unable to save pre-show details." }, 500);
  }
}
