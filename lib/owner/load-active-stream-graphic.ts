import {
  mapOwnerPresetToLiveStreamGraphic,
  type LiveStreamGraphicPayload,
} from "@/lib/live/stream-graphics";
import { OWNER_GRAPHICS_EVENT_ID, type OwnerGraphicsPreset } from "@/lib/owner/graphics-data-plane";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state";
import type { SupabaseClient } from "@supabase/supabase-js";

function isMissingGraphicsTable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /owner_graphics_presets|does not exist|schema cache|42P01|PGRST205/i.test(message);
}

export async function loadActiveStreamGraphic(
  admin: SupabaseClient,
): Promise<{ isLive: boolean; active: LiveStreamGraphicPayload | null }> {
  const { row } = await loadOwnerStreamState(admin);
  const isLive = row?.is_live === true;

  if (!isLive) {
    return { isLive: false, active: null };
  }

  const { data, error } = await admin
    .from("owner_graphics_presets")
    .select("*")
    .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
    .eq("is_active_on_stream", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingGraphicsTable(error)) {
      return { isLive: true, active: null };
    }
    throw new Error(error.message);
  }

  if (!data) {
    return { isLive: true, active: null };
  }

  return {
    isLive: true,
    active: mapOwnerPresetToLiveStreamGraphic(data as OwnerGraphicsPreset),
  };
}
