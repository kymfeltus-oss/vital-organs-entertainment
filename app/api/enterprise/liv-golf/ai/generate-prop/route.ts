import { NextResponse } from "next/server";
import {
  AiPropQueueUnavailableError,
  enqueueAiPropSuggestion,
} from "@/lib/enterprise/liv-golf/ai-prop-queue";
import { emitAiPropSuggested } from "@/lib/enterprise/liv-golf/emit-ai-prop-suggested";
import {
  computeAiPropPayout,
  generateAiPropQuestion,
} from "@/lib/enterprise/liv-golf/generate-ai-prop-question";
import type { AiPropGenerationInput } from "@/lib/enterprise/liv-golf/map-sportradar-shot-feed";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isPipelineAuthorized(request: Request): boolean {
  const pipelineSecret = process.env.LIV_AI_PIPELINE_SECRET?.trim();
  if (!pipelineSecret) return true;

  return request.headers.get("x-liv-pipeline-secret")?.trim() === pipelineSecret;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "AI generation pipeline fault.";
}

/** OpenAI auto-prop generator — writes suggestions to the director review queue. */
export async function POST(request: Request) {
  if (!isPipelineAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized pipeline access." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<AiPropGenerationInput>;
    const roomId = typeof body.room_id === "string" ? body.room_id.trim() : "";
    const playerName = typeof body.player_name === "string" ? body.player_name.trim() : "";
    const lieType = typeof body.lie_type === "string" ? body.lie_type.trim().toLowerCase() : "";

    if (!roomId || !playerName || (lieType !== "bunker" && lieType !== "rough")) {
      return NextResponse.json({ error: "Invalid AI generation payload." }, { status: 400 });
    }

    const telemetry: AiPropGenerationInput = {
      room_id: roomId,
      player_name: playerName,
      lie_type: lieType,
      distance_to_hole:
        typeof body.distance_to_hole === "number" ? body.distance_to_hole : undefined,
      hole_number: typeof body.hole_number === "number" ? body.hole_number : undefined,
    };

    const formulatedQuestion = await generateAiPropQuestion(telemetry);
    const baseStake = 10;
    const computedPayout = computeAiPropPayout(lieType, baseStake);
    const suggestedBetId = `ai-${Date.now()}`;

    const admin = getSupabaseAdmin();
    const queued = await enqueueAiPropSuggestion(admin, {
      telemetry,
      question: formulatedQuestion,
      stakeAmount: baseStake,
      payoutAmount: computedPayout,
      suggestedBetId,
    });

    await emitAiPropSuggested(queued);

    return NextResponse.json({ success: true, ai_suggested_bet: queued });
  } catch (error) {
    if (error instanceof AiPropQueueUnavailableError) {
      return NextResponse.json(
        {
          error:
            "AI suggestion queue table is unavailable. Apply migration 20260711220000_live_micro_bets_ai_queue.sql.",
        },
        { status: 503 },
      );
    }

    console.error("[AI Generation Error]:", errorMessage(error));
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
