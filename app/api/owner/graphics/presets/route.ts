import { isOwnerAuthed, ownerAuthFailureResponse, ownerJsonResponse } from "@/lib/owner/api-response";
import { requireOwnerUser } from "@/lib/owner/auth";
import {
  cleanGraphicsText,
  cleanGraphicsUuid,
  CreateGraphicsPresetPayload,
  normalizeDurationSeconds,
  normalizeGraphicsPresetType,
  OWNER_GRAPHICS_EVENT_ID,
  UpdateGraphicsPresetPayload,
} from "@/lib/owner/graphics-data-plane";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from("owner_graphics_presets")
      .select("*")
      .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("PRESETS GET DATABASE ERROR:", error);
      throw new Error(error.message);
    }

    return ownerJsonResponse({
      success: true,
      presets: data ?? [],
    });
  } catch (error) {
    console.error("GRAPHICS PRESETS GET ERROR:", error);

    return ownerJsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load graphics presets.",
      },
      500,
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as CreateGraphicsPresetPayload;

    const type = normalizeGraphicsPresetType(body.type);
    const contentPrimary = cleanGraphicsText(body.contentPrimary, 180);
    const contentSecondary = cleanGraphicsText(body.contentSecondary, 260);
    const durationSeconds = normalizeDurationSeconds(body.durationSeconds);

    if (!type) {
      return ownerJsonResponse(
        {
          success: false,
          error: "A valid graphic type is required.",
        },
        400,
      );
    }

    if (!contentPrimary) {
      return ownerJsonResponse(
        {
          success: false,
          error: "Primary graphic content is required.",
        },
        400,
      );
    }

    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from("owner_graphics_presets")
      .insert({
        event_id: OWNER_GRAPHICS_EVENT_ID,
        type,
        content_primary: contentPrimary,
        content_secondary: contentSecondary,
        duration_seconds: durationSeconds,
        is_active_on_stream: false,
      })
      .select("*")
      .single();

    if (error) {
      console.error("PRESETS INSERT ERROR:", error);
      throw new Error(error.message);
    }

    return ownerJsonResponse(
      {
        success: true,
        preset: data,
      },
      201,
    );
  } catch (error) {
    console.error("GRAPHICS PRESETS POST ERROR:", error);

    return ownerJsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to save graphics preset.",
      },
      500,
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as UpdateGraphicsPresetPayload;
    const id = cleanGraphicsUuid(body.id);

    if (!id) {
      return ownerJsonResponse(
        {
          success: false,
          error: "A valid preset ID is required.",
        },
        400,
      );
    }

    if (typeof body.isActiveOnStream !== "boolean") {
      return ownerJsonResponse(
        {
          success: false,
          error: "isActiveOnStream must be true or false.",
        },
        400,
      );
    }

    const admin = getSupabaseAdmin();

    if (body.isActiveOnStream) {
      const { error: clearError } = await admin
        .from("owner_graphics_presets")
        .update({ is_active_on_stream: false })
        .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
        .eq("is_active_on_stream", true)
        .neq("id", id);

      if (clearError) {
        console.error("PRESETS CLEAR ACTIVE ERROR:", clearError);
        throw new Error(clearError.message);
      }
    }

    const { data, error } = await admin
      .from("owner_graphics_presets")
      .update({
        is_active_on_stream: body.isActiveOnStream,
      })
      .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("PRESETS PATCH UPDATE ERROR:", error);
      throw new Error(error.message);
    }

    if (!data) {
      return ownerJsonResponse(
        {
          success: false,
          error: "Graphics preset not found.",
        },
        404,
      );
    }

    return ownerJsonResponse({
      success: true,
      preset: data,
    });
  } catch (error) {
    console.error("GRAPHICS PRESETS PATCH ERROR:", error);

    return ownerJsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update graphics preset.",
      },
      500,
    );
  }
}

export async function DELETE() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from("owner_graphics_presets")
      .update({
        is_active_on_stream: false,
      })
      .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
      .eq("is_active_on_stream", true)
      .select("id");

    if (error) {
      console.error("PRESETS DELETE ERROR:", error);
      throw new Error(error.message);
    }

    return ownerJsonResponse({
      success: true,
      clearedCount: data?.length ?? 0,
      message: "All graphics have been cleared from the live stream layer.",
    });
  } catch (error) {
    console.error("GRAPHICS PRESETS DELETE ERROR:", error);

    return ownerJsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to clear all graphics.",
      },
      500,
    );
  }
}