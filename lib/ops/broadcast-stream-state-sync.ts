import {
  LIVE_ROOM_PLATFORM_CHANNEL,
  LIVE_STREAM_STATE_BROADCAST_EVENT,
} from "@/lib/live/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Notify connected clients to refetch ops stream state (non-destructive sync ping). */
export async function broadcastOpsStreamStateSync(): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const channel = supabaseAdmin.channel(LIVE_ROOM_PLATFORM_CHANNEL);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      void supabaseAdmin.removeChannel(channel);
      reject(new Error("Ops stream state broadcast timed out."));
    }, 5000);

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;

      const result = await channel.send({
        type: "broadcast",
        event: LIVE_STREAM_STATE_BROADCAST_EVENT,
        payload: { sync: true },
      });

      clearTimeout(timeout);
      await supabaseAdmin.removeChannel(channel);

      if (result !== "ok") {
        reject(new Error(`Ops stream state broadcast failed: ${result}`));
        return;
      }

      resolve();
    });
  });
}
