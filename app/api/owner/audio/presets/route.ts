import { requireOwnerUser } from "@/lib/owner/auth";
import {
  loadOwnerAudioMasterPresets,
  parseOwnerAudioMasterPresetsBody,
  saveOwnerAudioMasterPresets,
} from "@/lib/owner/audio-master-presets";
import {
  ownerAuthFailureResponse,
  ownerJsonResponse,
  isOwnerAuthed,
} from "@/lib/owner/api-response";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  const admin = getSupabaseAdmin();
  const { presets, error } = await loadOwnerAudioMasterPresets(admin);

  if (error) {
    console.error("[owner/audio/presets] GET failed:", error);
    return ownerJsonResponse({ error: "Unable to load audio master presets." }, 500);
  }

  return ownerJsonResponse({ ok: true, presets, config: presets.config });
}

export async function POST(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const config = parseOwnerAudioMasterPresetsBody(await request.json());
    if (!config) {
      return ownerJsonResponse(
        {
          error:
            "Invalid body. Expected { config: { aiGainGuardEnabled, whiteNoiseSuppressor, concertEqPreset, masterLimiterCompressor } }.",
        },
        400,
      );
    }

    const admin = getSupabaseAdmin();
    const { presets, error } = await saveOwnerAudioMasterPresets(admin, config, auth.email);

    if (error) {
      console.error("[owner/audio/presets] POST failed:", error);
      return ownerJsonResponse({ error: "Unable to save audio master presets." }, 500);
    }

    return ownerJsonResponse({
      ok: true,
      message: "Mastering desk presets committed to live session.",
      presets,
      config: presets.config,
    });
  } catch (error) {
    console.error("[owner/audio/presets] POST failed:", error);
    return ownerJsonResponse({ error: "Unable to save audio master presets." }, 500);
  }
}
