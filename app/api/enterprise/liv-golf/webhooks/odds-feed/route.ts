import { NextResponse } from "next/server";
import { LiveMicroBetsSessionUnavailableError } from "@/lib/enterprise/liv-golf/live-micro-bets-session";
import {
  mapSportradarShotToAiInput,
  type SportradarShotFeedPayload,
} from "@/lib/enterprise/liv-golf/map-sportradar-shot-feed";
import {
  type OddsFeedPayload,
  processOddsFeedPayload,
} from "@/lib/enterprise/liv-golf/process-odds-feed";
import { verifySportradarWebhookSignature } from "@/lib/enterprise/liv-golf/verify-sportradar-signature";

export const dynamic = "force-dynamic";

async function forwardToAiPipeline(
  request: Request,
  input: {
    room_id: string;
    player_name: string;
    lie_type: string;
    distance_to_hole?: number;
    hole_number?: number;
  },
): Promise<Response> {
  const pipelineSecret = process.env.LIV_AI_PIPELINE_SECRET?.trim();
  const aiGenerationResponse = await fetch(
    `${new URL(request.url).origin}/api/enterprise/liv-golf/ai/generate-prop`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(pipelineSecret ? { "x-liv-pipeline-secret": pipelineSecret } : {}),
      },
      body: JSON.stringify(input),
    },
  );

  if (!aiGenerationResponse.ok) {
    const details = (await aiGenerationResponse.json().catch(() => ({}))) as { error?: string };
    throw new Error(details.error ?? "AI generation pipeline fault.");
  }

  const result = (await aiGenerationResponse.json()) as Record<string, unknown>;
  return NextResponse.json({
    success: true,
    status: "Forwarded to AI Pipeline",
    pipeline: result,
  });
}

/** Sportradar odds-feed webhook — HMAC verification + AI prop generation pipeline. */
export async function POST(request: Request) {
  const rawBody = await request.text();

  const signatureResult = verifySportradarWebhookSignature(request, rawBody);
  if (signatureResult.ok === false) {
    return NextResponse.json(
      { error: signatureResult.error },
      { status: signatureResult.status },
    );
  }

  let feedData: SportradarShotFeedPayload & OddsFeedPayload;
  try {
    feedData = JSON.parse(rawBody) as SportradarShotFeedPayload & OddsFeedPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const lieType = feedData.shot_data?.lie?.trim().toLowerCase();
  const isBunkerShot =
    feedData.event_type === "SHOT_RECORDED" && lieType === "bunker" && feedData.player?.name?.trim();

  if (signatureResult.mode === "dev-bypass" && isBunkerShot) {
    try {
      const playerName = feedData.player!.name!.trim();
      const holeNumber = feedData.shot_data?.hole_number;
      const result = await processOddsFeedPayload(
        {
          event_type: "PLAYER_SHOT_SITUATION",
          hole_context: {
            hole_number: holeNumber,
            associated_room_id: feedData.room_id,
          },
          event_details: {
            lie_type: "bunker",
            player_name: playerName,
          },
        },
        "sportradar-dev-bypass",
      );

      if (result.status === "processed") {
        return NextResponse.json({
          success: true,
          active_prop: "tyrell-sand-save",
          mode: "dev-bypass",
          ...result,
        });
      }

      return NextResponse.json({
        success: true,
        status: "Ignored event context parameters.",
        message: result.message,
        mode: "dev-bypass",
      });
    } catch (error) {
      if (error instanceof LiveMicroBetsSessionUnavailableError) {
        return NextResponse.json(
          {
            error:
              "Production micro-bet session table is unavailable. Apply migration 20260711161000_live_micro_bets_session.sql.",
          },
          { status: 503 },
        );
      }

      console.error("[enterprise/liv-golf/webhooks/odds-feed] dev bypass launch failed:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unable to launch dev bypass prop." },
        { status: 500 },
      );
    }
  }

  const aiInput = mapSportradarShotToAiInput(feedData);
  if (aiInput) {
    try {
      return await forwardToAiPipeline(request, aiInput);
    } catch (error) {
      console.error("[enterprise/liv-golf/webhooks/odds-feed] AI pipeline failed:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "AI generation pipeline fault." },
        { status: 500 },
      );
    }
  }

  try {
    const result = await processOddsFeedPayload(feedData);

    if (result.status === "ignored") {
      return NextResponse.json({
        success: true,
        status: "Ignored: Non-actionable shot lie context",
        message: result.message,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof LiveMicroBetsSessionUnavailableError) {
      return NextResponse.json(
        {
          error:
            "Production micro-bet session table is unavailable. Apply migration 20260711161000_live_micro_bets_session.sql.",
        },
        { status: 503 },
      );
    }

    console.error("[enterprise/liv-golf/webhooks/odds-feed] POST failed:", error);
    return NextResponse.json({ error: "Unable to process odds feed event." }, { status: 500 });
  }
}
