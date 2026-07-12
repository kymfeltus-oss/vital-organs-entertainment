import type { LivMicroBetLaunchPayload } from "@/lib/liv-micro-bets";
import {
  LIVE_ROOM_PLATFORM_CHANNEL,
  LIV_MICRO_BET_LAUNCH_EVENT,
} from "@/lib/live/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const BROADCAST_TIMEOUT_MS = 5_000;

export type LivMicroBetResolvePayload = LivMicroBetLaunchPayload & {
  resolved_winner: "Yes" | "No";
};

/** Broadcast resolved micro-bet closure to all connected LIV Golf live surfaces. */
export async function emitLivMicroBetResolve(payload: LivMicroBetResolvePayload): Promise<void> {
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
      finish(new Error("Timed out broadcasting liv-micro-bet resolve."));
    }, BROADCAST_TIMEOUT_MS);

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;

      try {
        const result = await channel.send({
          type: "broadcast",
          event: LIV_MICRO_BET_LAUNCH_EVENT,
          payload,
        });

        if (result !== "ok") {
          finish(new Error(`liv-micro-bet resolve broadcast rejected: ${result}`));
          return;
        }

        clearTimeout(timeoutId);
        finish();
      } catch (error) {
        clearTimeout(timeoutId);
        finish(error instanceof Error ? error : new Error("liv-micro-bet resolve broadcast failed."));
      }
    });
  });
}
