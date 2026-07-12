import { NextResponse } from "next/server";
import {
  buildLivMetricsGatewayEnvelope,
  buildLivMetricsGatewayFallbackResponse,
  type LivPublicMetricsApiResponse,
} from "@/lib/enterprise/liv-golf/metrics-gateway";
import { countLivMicroBetPlacements } from "@/lib/enterprise/liv-golf/live-micro-bets-session";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";

export const dynamic = "force-dynamic";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown metrics gateway error";
}

function isMissingTicketsTable(error: unknown): boolean {
  const message = errorMessage(error);
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  return (
    code === "PGRST205" ||
    /fan_bet_tickets|does not exist|Could not find the table|schema cache|42P01|PGRST205/i.test(
      message,
    )
  );
}

async function countLedgerBets(): Promise<number> {
  const supabase = await createServerSupabaseClient();

  const { count, error } = await supabase
    .from("fan_bet_tickets")
    .select("*", { count: "exact", head: true });

  if (!error) {
    return count ?? 0;
  }

  if (isMissingTicketsTable(error)) {
    return countLivMicroBetPlacements();
  }

  throw error;
}

/** Public production metrics gateway — ledger counts with structural fallbacks. */
export async function GET() {
  try {
    const totalBetsPlaced = await countLedgerBets();

    // Presence is tracked client-side; server returns stable baseline when channels are empty.
    const metrics = buildLivMetricsGatewayEnvelope(totalBetsPlaced);

    const response: LivPublicMetricsApiResponse = {
      success: true,
      metrics,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Metrics Database Error Handled]:", errorMessage(error));

    return NextResponse.json(buildLivMetricsGatewayFallbackResponse(), { status: 200 });
  }
}
