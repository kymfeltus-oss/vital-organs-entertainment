import { isOwnerAuthed, ownerAuthFailureResponse, ownerJsonResponse } from "@/lib/owner/api-response";
import { requireOwnerUser } from "@/lib/owner/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function cleanText(value: unknown, fallback = "", max = 120): string {
  return typeof value === "string" && value.trim()
    ? value.trim().replace(/<[^>]*>/g, "").slice(0, max)
    : fallback;
}

function normalizeTransition(value: unknown): "CUT" | "AUTO_FADE" {
  return value === "AUTO_FADE" ? "AUTO_FADE" : "CUT";
}

export async function GET(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const eventId = new URL(request.url).searchParams.get("eventId") ?? "300-awakening";
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("owner_video_routing")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return ownerJsonResponse({ success: true, ok: true, routing: data });
  } catch (error) {
    console.error("[owner/video-routing] GET failed:", error);
    return ownerJsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Unable to load video routing." },
      500,
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const eventId = cleanText(body.event_id, "300-awakening", 80);
    const updatePayload: Record<string, unknown> = {
      event_id: eventId,
      updated_by: auth.email,
      updated_at: new Date().toISOString(),
    };

    if (typeof body.active_program_channel_id === "string") {
      updatePayload.active_program_channel_id = cleanText(body.active_program_channel_id, "", 160);
    }
    if (body.transition_type !== undefined) {
      updatePayload.transition_type = normalizeTransition(body.transition_type);
    }
    if (typeof body.twitch_restream_active === "boolean") {
      updatePayload.twitch_restream_active = body.twitch_restream_active;
    }
    if (typeof body.youtube_restream_active === "boolean") {
      updatePayload.youtube_restream_active = body.youtube_restream_active;
    }
    if (typeof body.facebook_restream_active === "boolean") {
      updatePayload.facebook_restream_active = body.facebook_restream_active;
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("owner_video_routing")
      .upsert(updatePayload, { onConflict: "event_id" })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return ownerJsonResponse({ success: true, ok: true, routing: data });
  } catch (error) {
    console.error("[owner/video-routing] PATCH failed:", error);
    return ownerJsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Unable to update video routing." },
      500,
    );
  }
}
