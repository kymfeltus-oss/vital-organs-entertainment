import { isOwnerAuthed, ownerAuthFailureResponse, ownerJsonResponse } from "@/lib/owner/api-response";
import { requireOwnerUser } from "@/lib/owner/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LowerThirdThemeStyle = "NEON_PURPLE_SLIDE" | "MINIMAL_GLASS_FADE" | "CYAN_GLOW";

type LowerThirdRequestBody = {
  id?: unknown;
  speakerName?: unknown;
  speakerRole?: unknown;
  themeStyle?: unknown;
  displayOrder?: unknown;
  isActiveOnStream?: unknown;
};

const EVENT_ID = "300-awakening";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function normalizeTheme(value: unknown): LowerThirdThemeStyle {
  if (
    value === "NEON_PURPLE_SLIDE" ||
    value === "MINIMAL_GLASS_FADE" ||
    value === "CYAN_GLOW"
  ) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "neon purple slide") return "NEON_PURPLE_SLIDE";
    if (normalized === "minimal glass fade") return "MINIMAL_GLASS_FADE";
    if (normalized === "cyan glow") return "CYAN_GLOW";
  }

  return "CYAN_GLOW";
}

function normalizeDisplayOrder(value: unknown): number {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : 0;
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(999, Math.trunc(parsed)));
}

function cleanUuid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return UUID_PATTERN.test(cleaned) ? cleaned : null;
}

export async function GET() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("owner_lower_thirds")
      .select("*")
      .eq("event_id", EVENT_ID)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    return ownerJsonResponse({ success: true, assets: data ?? [] });
  } catch (error) {
    return ownerJsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to load lower-thirds assets.",
      },
      500,
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as LowerThirdRequestBody;
    const speakerName = cleanText(body.speakerName, "", 120);
    const speakerRole = cleanText(body.speakerRole, "", 120);

    if (!speakerName || !speakerRole) {
      return ownerJsonResponse(
        {
          success: false,
          error: "Speaker credentials missing data validation bounds.",
        },
        400,
      );
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("owner_lower_thirds")
      .insert({
        event_id: EVENT_ID,
        speaker_name: speakerName,
        speaker_role: speakerRole,
        theme_style: normalizeTheme(body.themeStyle),
        display_order: normalizeDisplayOrder(body.displayOrder),
        is_active_on_stream: false,
        updated_by: auth.email,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return ownerJsonResponse({ success: true, asset: data }, 201);
  } catch (error) {
    return ownerJsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to create lower-third asset.",
      },
      500,
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as LowerThirdRequestBody;
    const id = cleanUuid(body.id);

    if (!id) {
      return ownerJsonResponse(
        { success: false, error: "Target asset ID identifier required." },
        400,
      );
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: auth.email,
    };

    if (body.speakerName !== undefined) {
      const speakerName = cleanText(body.speakerName, "", 120);
      if (!speakerName) {
        return ownerJsonResponse({ success: false, error: "Speaker name cannot be empty." }, 400);
      }
      updatePayload.speaker_name = speakerName;
    }

    if (body.speakerRole !== undefined) {
      const speakerRole = cleanText(body.speakerRole, "", 120);
      if (!speakerRole) {
        return ownerJsonResponse({ success: false, error: "Speaker role cannot be empty." }, 400);
      }
      updatePayload.speaker_role = speakerRole;
    }

    if (body.themeStyle !== undefined) {
      updatePayload.theme_style = normalizeTheme(body.themeStyle);
    }

    if (body.displayOrder !== undefined) {
      updatePayload.display_order = normalizeDisplayOrder(body.displayOrder);
    }

    if (typeof body.isActiveOnStream === "boolean") {
      updatePayload.is_active_on_stream = body.isActiveOnStream;
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("owner_lower_thirds")
      .update(updatePayload)
      .eq("event_id", EVENT_ID)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      return ownerJsonResponse({ success: false, error: "Lower-third asset not found." }, 404);
    }

    return ownerJsonResponse({ success: true, asset: data });
  } catch (error) {
    return ownerJsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to update lower-third asset.",
      },
      500,
    );
  }
}
