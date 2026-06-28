import { requireOwnerUser } from "@/lib/owner/auth";
import {
  applyOwnerAudioConfigPatch,
  getOwnerAudioWorkspaceState,
  parseOwnerAudioConfigPatch,
} from "@/lib/owner/audio-config-store";
import {
  ownerAuthFailureResponse,
  ownerJsonResponse,
  isOwnerAuthed,
} from "@/lib/owner/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  const state = getOwnerAudioWorkspaceState();
  return ownerJsonResponse({ ok: true, ...state });
}

export async function POST(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const patch = parseOwnerAudioConfigPatch(await request.json());
    if (!patch) {
      return ownerJsonResponse(
        {
          error:
            "Invalid body. Expected partial { aiGainGuardEnabled, whiteNoiseSuppressor, concertEqPreset, masterLimiterCompressor }.",
        },
        400,
      );
    }

    const state = applyOwnerAudioConfigPatch(patch);
    return ownerJsonResponse({
      ok: true,
      message: "Audio configuration forwarded to media services.",
      ...state,
    });
  } catch (error) {
    console.error("[owner/audio/config] POST failed:", error);
    return ownerJsonResponse({ error: "Unable to update audio configuration." }, 500);
  }
}
