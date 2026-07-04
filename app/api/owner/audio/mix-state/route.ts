import { requireOwnerUser } from "@/lib/owner/auth";
import { ownerAuthFailureResponse, ownerJsonResponse, isOwnerAuthed } from "@/lib/owner/api-response";
import { fetchOwnerAudioMixTelemetry } from "@/lib/owner/fetch-audio-mix-telemetry";
import { loadShowSetupState } from "@/lib/owner/show-setup-state";
import {
  applyAudioPreset,
  AudioPresetControlError,
  buildAudioPresetStatuses,
  parseAudioPresetId,
} from "@/lib/owner/audio-service/presets";
import {
  AudioBusControlError,
  parseOwnerAudioBusKey,
  setOwnerAudioBusMute,
} from "@/lib/owner/audio-service/buses";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireOwnerUser();
    if (!isOwnerAuthed(auth)) {
      return ownerAuthFailureResponse(auth);
    }

    const [telemetry, showSetup] = await Promise.all([
      fetchOwnerAudioMixTelemetry(),
      loadShowSetupState().catch(() => null),
    ]);
    const presets = buildAudioPresetStatuses(telemetry.consoleScene.index);
    return ownerJsonResponse({
      ok: true,
      success: true,
      telemetry,
      presets,
      operatorEmail: auth.email,
      showTitle: showSetup?.showTitle ?? null,
    });
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

export async function POST(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as {
      command?: unknown;
      presetId?: unknown;
      busKey?: unknown;
      muted?: unknown;
    };
    let message: string;

    if (body.command === "apply_preset") {
      const presetId = parseAudioPresetId(body.presetId);
      if (!presetId) {
        return ownerJsonResponse({ error: "Invalid audio preset command." }, 400);
      }

      await applyAudioPreset(presetId);
      console.info("[owner/audio/mix-state] preset recalled", {
        presetId,
        ownerEmail: auth.email,
      });
      message = "Audio preset recall acknowledged by the edge service.";
    } else if (body.command === "set_bus_mute") {
      const busKey = parseOwnerAudioBusKey(body.busKey);
      if (!busKey || typeof body.muted !== "boolean") {
        return ownerJsonResponse({ error: "Invalid audio bus mute command." }, 400);
      }

      await setOwnerAudioBusMute(busKey, body.muted);
      console.info("[owner/audio/mix-state] bus mute changed", {
        busKey,
        muted: body.muted,
        ownerEmail: auth.email,
      });
      message = `${busKey} ${body.muted ? "muted" : "unmuted"}.`;
    } else {
      return ownerJsonResponse({ error: "Invalid audio control command." }, 400);
    }

    const telemetry = await fetchOwnerAudioMixTelemetry();
    const presets = buildAudioPresetStatuses(telemetry.consoleScene.index);
    return ownerJsonResponse({
      ok: true,
      success: true,
      message,
      telemetry,
      presets,
    });
  } catch (error) {
    const status =
      error instanceof AudioPresetControlError || error instanceof AudioBusControlError
        ? error.status
        : 500;
    const message =
      error instanceof AudioPresetControlError || error instanceof AudioBusControlError
        ? error.message
        : "Unable to apply audio control command.";
    console.error("[owner/audio/mix-state] POST failed:", error);
    return ownerJsonResponse({ error: message }, status);
  }
}
