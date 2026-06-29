import { isOwnerAuthed, ownerAuthFailureResponse, ownerJsonResponse } from "@/lib/owner/api-response";
import { requireOwnerUser } from "@/lib/owner/auth";
import {
  cleanGraphicsText,
  normalizeBoundedInteger,
  normalizePlacementAnchor,
  OWNER_GRAPHICS_DEFAULT_THEME,
  OWNER_GRAPHICS_EVENT_ID,
  UpdateGraphicsThemePayload,
} from "@/lib/owner/graphics-data-plane";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function ensureThemeRow() {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("owner_graphics_global_theme")
    .upsert(
      {
        ...OWNER_GRAPHICS_DEFAULT_THEME,
        event_id: OWNER_GRAPHICS_EVENT_ID,
      },
      {
        onConflict: "event_id",
        ignoreDuplicates: true,
      },
    )
    .select("*")
    .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
    .maybeSingle();

  if (error) {
    console.error("ENSURE THEME UPSERT ERROR:", error);
    throw new Error(error.message);
  }

  if (data) return data;

  const { data: existing, error: readError } = await admin
    .from("owner_graphics_global_theme")
    .select("*")
    .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
    .maybeSingle();

  if (readError) {
    console.error("ENSURE THEME READ ERROR:", readError);
    throw new Error(readError.message);
  }

  return existing;
}

export async function GET() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const theme = await ensureThemeRow();

    return ownerJsonResponse({
      success: true,
      theme,
    });
  } catch (error) {
    console.error("GRAPHICS THEME API ERROR:", error);

    return ownerJsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to load graphics theme.",
      },
      500,
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as UpdateGraphicsThemePayload;
    const isReset = body.action === "reset";

    const updatePayload = isReset
      ? {
          corner_radius_px: OWNER_GRAPHICS_DEFAULT_THEME.corner_radius_px,
          padding_px: OWNER_GRAPHICS_DEFAULT_THEME.padding_px,
          background_opacity_percent: OWNER_GRAPHICS_DEFAULT_THEME.background_opacity_percent,
          placement_anchor: OWNER_GRAPHICS_DEFAULT_THEME.placement_anchor,
          custom_logo_url: OWNER_GRAPHICS_DEFAULT_THEME.custom_logo_url,
        }
      : {
          corner_radius_px: normalizeBoundedInteger(body.cornerRadiusPx, 8, 0, 24),
          padding_px: normalizeBoundedInteger(body.paddingPx, 24, 4, 64),
          background_opacity_percent: normalizeBoundedInteger(
            body.backgroundOpacityPercent,
            80,
            0,
            100,
          ),
          placement_anchor: normalizePlacementAnchor(body.placementAnchor),
          custom_logo_url: cleanGraphicsText(body.customLogoUrl, 500) || null,
        };

    await ensureThemeRow();

    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from("owner_graphics_global_theme")
      .update(updatePayload)
      .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("GRAPHICS THEME PATCH UPDATE ERROR:", error);
      throw new Error(error.message);
    }

    if (!data) {
      return ownerJsonResponse(
        {
          success: false,
          error: "Graphics theme row not found.",
        },
        404,
      );
    }

    return ownerJsonResponse({
      success: true,
      theme: data,
    });
  } catch (error) {
    console.error("GRAPHICS THEME PATCH API ERROR:", error);

    return ownerJsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to update graphics theme.",
      },
      500,
    );
  }
}