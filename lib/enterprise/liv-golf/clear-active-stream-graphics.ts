import type { SupabaseClient } from "@supabase/supabase-js";
import { OWNER_GRAPHICS_EVENT_ID } from "@/lib/owner/graphics-data-plane";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

function isMissingGraphicsTable(error: unknown): boolean {
  const message = errorMessage(error);
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  return (
    code === "PGRST205" ||
    /owner_graphics_presets|does not exist|Could not find the table|schema cache|42P01|PGRST205/i.test(
      message,
    )
  );
}

/** Deactivate all active stream graphics before launching a micro-bet (mutual exclusivity). */
export async function clearActiveStreamGraphics(admin: SupabaseClient): Promise<number> {
  const { data, error } = await admin
    .from("owner_graphics_presets")
    .update({ is_active_on_stream: false })
    .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
    .eq("is_active_on_stream", true)
    .select("id");

  if (error) {
    if (isMissingGraphicsTable(error)) return 0;
    throw new Error(errorMessage(error));
  }

  return data?.length ?? 0;
}
