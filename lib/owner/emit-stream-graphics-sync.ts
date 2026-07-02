import {
  LIVE_ROOM_PLATFORM_CHANNEL,
  STREAM_GRAPHICS_SYNC_EVENT,
} from "@/lib/live/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const SYNC_TIMEOUT_MS = 5_000;

/** Notify attendee /live clients to refresh active stream graphics from the app. */
export async function emitStreamGraphicsSync(): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const channel = supabase.channel(LIVE_ROOM_PLATFORM_CHANNEL);

    await new Promise<void>((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        void supabase.removeChannel(channel);
        resolve();
      };

      const timeoutId = setTimeout(finish, SYNC_TIMEOUT_MS);

      channel.subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;

        try {
          await channel.send({
            type: "broadcast",
            event: STREAM_GRAPHICS_SYNC_EVENT,
            payload: { at: new Date().toISOString() },
          });
        } catch (error) {
          console.error("[owner] stream-graphics-sync broadcast failed:", error);
        } finally {
          clearTimeout(timeoutId);
          finish();
        }
      });
    });
  } catch (error) {
    console.error("[owner] emitStreamGraphicsSync failed:", error);
  }
}
