import { NextResponse } from "next/server";
import { LiveMicroBetsSessionUnavailableError } from "@/lib/enterprise/liv-golf/live-micro-bets-session";
import {
  type OddsFeedPayload,
  processOddsFeedPayload,
} from "@/lib/enterprise/liv-golf/process-odds-feed";
import { timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

function verifyOddsFeedSignature(request: Request): boolean {
  const configured =
    process.env.SPORTRADAR_SIGNATURE_KEY?.trim() ||
    process.env.LIV_ODDS_WEBHOOK_SECRET?.trim();

  if (!configured) return false;

  const signature =
    request.headers.get("X-Sportradar-Signature")?.trim() ||
    request.headers.get("X-LIV-Odds-Webhook-Secret")?.trim();

  if (!signature) return false;

  try {
    const expected = Buffer.from(configured, "utf8");
    const received = Buffer.from(signature, "utf8");
    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  } catch {
    return signature === configured;
  }
}

export async function POST(request: Request) {
  if (!verifyOddsFeedSignature(request)) {
    return NextResponse.json({ error: "Invalid signature packet." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as OddsFeedPayload;
    const result = await processOddsFeedPayload(payload);

    if (result.status === "ignored") {
      return NextResponse.json(result);
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
