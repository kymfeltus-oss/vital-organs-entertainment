import {
  ATTENDEE_CHAT_MESSAGE_EVENT,
  REALTIME_ATTENDEE_CHAT_CHANNEL,
  type AttendeeChatBroadcastPayload,
} from "@/lib/experience/attendee-chat-realtime";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Push a new chat row to all `realtime_attendee_chat` subscribers (countdown monitor, ops alerts). */
export async function broadcastAttendeeChatMessage(
  payload: AttendeeChatBroadcastPayload,
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const channel = supabaseAdmin.channel(REALTIME_ATTENDEE_CHAT_CHANNEL);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      void supabaseAdmin.removeChannel(channel);
      reject(new Error("Attendee chat broadcast timed out."));
    }, 5000);

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;

      const result = await channel.send({
        type: "broadcast",
        event: ATTENDEE_CHAT_MESSAGE_EVENT,
        payload,
      });

      clearTimeout(timeout);
      await supabaseAdmin.removeChannel(channel);

      if (result !== "ok") {
        reject(new Error(`Attendee chat broadcast failed: ${result}`));
        return;
      }

      resolve();
    });
  });
}
