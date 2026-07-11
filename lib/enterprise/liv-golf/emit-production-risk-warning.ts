import type { RiskThresholdAlert } from "@/lib/enterprise/liv-golf/risk-threshold";
import {
  LIVE_ROOM_PLATFORM_CHANNEL,
  PRODUCTION_RISK_WARNING_EVENT,
} from "@/lib/live/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const BROADCAST_TIMEOUT_MS = 5_000;

/** Broadcast operator risk alert to production studio consoles. */
export async function emitProductionRiskWarning(alert: RiskThresholdAlert): Promise<void> {
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
      finish(new Error("Timed out broadcasting production-risk-warning."));
    }, BROADCAST_TIMEOUT_MS);

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;

      try {
        const result = await channel.send({
          type: "broadcast",
          event: PRODUCTION_RISK_WARNING_EVENT,
          payload: alert,
        });

        if (result !== "ok") {
          finish(new Error(`production-risk-warning broadcast rejected: ${result}`));
          return;
        }

        clearTimeout(timeoutId);
        finish();
      } catch (error) {
        clearTimeout(timeoutId);
        finish(
          error instanceof Error ? error : new Error("production-risk-warning broadcast failed."),
        );
      }
    });
  });
}
