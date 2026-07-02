import { requireOwnerUser } from "@/lib/owner/auth";
import { ownerAuthFailureResponse, ownerJsonResponse, isOwnerAuthed } from "@/lib/owner/api-response";
import { fetchOwnerAudioMixTelemetry } from "@/lib/owner/fetch-audio-mix-telemetry";

export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
  try {
    const auth = await requireOwnerUser();
    if (!isOwnerAuthed(auth)) {
      return ownerAuthFailureResponse(auth);
    }

    const telemetry = await fetchOwnerAudioMixTelemetry();
    return ownerJsonResponse({ ok: true, success: true, telemetry });
  } catch (error) {
    console.error("[owner/audio/mix-state] GET failed:", error);
    return ownerJsonResponse(
      {
        ok: false,
        success: false,
        error: error instanceof Error ? error.message : "Unable to load audio mix state.",
      },
      500,
    );
  }
}
