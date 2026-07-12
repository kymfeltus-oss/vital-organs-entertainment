import { LIVE_ROOM_PLATFORM_CHANNEL, AI_PROP_SUGGESTED_EVENT } from "@/lib/live/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type AiPropQueueRow = {
  id: string;
  room_id: string;
  suggested_bet_id: string;
  question: string;
  stake_amount: number;
  payout_amount: number;
  player_name: string | null;
  lie_type: string | null;
  hole_number: number | null;
  distance_to_hole: number | null;
  status: string;
  created_at: string;
};

const BROADCAST_TIMEOUT_MS = 5_000;

/** Notify production dashboards that a new AI prop suggestion is pending review. */
export async function emitAiPropSuggested(payload: AiPropQueueRow): Promise<void> {
  const supabase = getSupabaseAdmin();
  const channel = supabase.channel(LIVE_ROOM_PLATFORM_CHANNEL);

  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      void supabase.removeChannel(channel);
      if (error) reject(error);
      else resolve();
    };

    const timeoutId = setTimeout(() => {
      finish(new Error("Timed out broadcasting ai-prop-suggested."));
    }, BROADCAST_TIMEOUT_MS);

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;

      try {
        const result = await channel.send({
          type: "broadcast",
          event: AI_PROP_SUGGESTED_EVENT,
          payload,
        });

        if (result !== "ok") {
          finish(new Error(`ai-prop-suggested broadcast rejected: ${result}`));
          return;
        }

        clearTimeout(timeoutId);
        finish();
      } catch (error) {
        clearTimeout(timeoutId);
        finish(error instanceof Error ? error : new Error("ai-prop-suggested broadcast failed."));
      }
    });
  });
}
