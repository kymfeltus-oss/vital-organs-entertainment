import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiPropGenerationInput } from "@/lib/enterprise/liv-golf/map-sportradar-shot-feed";
import type { AiPropQueueRow } from "@/lib/enterprise/liv-golf/emit-ai-prop-suggested";

export class AiPropQueueUnavailableError extends Error {
  constructor(message = "live_micro_bets_ai_queue table is unavailable.") {
    super(message);
    this.name = "AiPropQueueUnavailableError";
  }
}

function isMissingQueueTable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  return (
    code === "PGRST205" ||
    /live_micro_bets_ai_queue|does not exist|Could not find the table|schema cache|42P01|PGRST205/i.test(
      message,
    )
  );
}

export async function enqueueAiPropSuggestion(
  admin: SupabaseClient,
  input: {
    telemetry: AiPropGenerationInput;
    question: string;
    stakeAmount: number;
    payoutAmount: number;
    suggestedBetId: string;
  },
): Promise<AiPropQueueRow> {
  const { data, error } = await admin
    .from("live_micro_bets_ai_queue")
    .insert({
      room_id: input.telemetry.room_id,
      suggested_bet_id: input.suggestedBetId,
      question: input.question,
      stake_amount: input.stakeAmount,
      payout_amount: input.payoutAmount,
      player_name: input.telemetry.player_name,
      lie_type: input.telemetry.lie_type,
      hole_number: input.telemetry.hole_number ?? null,
      distance_to_hole: input.telemetry.distance_to_hole ?? null,
      status: "pending_review",
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingQueueTable(error)) {
      throw new AiPropQueueUnavailableError();
    }
    throw new Error(error.message);
  }

  return data as AiPropQueueRow;
}
