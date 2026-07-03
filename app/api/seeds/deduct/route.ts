import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedBuyer } from "@/lib/checkout/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type SeedDeductRequestBody = {
  cost?: unknown;
  transactionType?: unknown;
  description?: unknown;
  referenceId?: unknown;
};

function cleanOptionalText(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  return trimmed || fallback;
}

function cleanOptionalReferenceId(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    trimmed,
  )
    ? trimmed
    : null;
}

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuthenticatedBuyer(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as SeedDeductRequestBody;
    const cost = parsePositiveInteger(body.cost);

    if (cost === null) {
      return auth.withSessionCookies(
        NextResponse.json(
          { success: false, message: "Invalid cost amount parameter" },
          { status: 400 },
        ),
      );
    }

    const transactionType = cleanOptionalText(body.transactionType, "live_interaction");
    const description = cleanOptionalText(
      body.description,
      `Live stream transaction cost: ${cost} seeds`,
    );
    const referenceId = cleanOptionalReferenceId(body.referenceId);

    const { data, error } = await getSupabaseAdmin().rpc("deduct_seed_wallet", {
      p_user_id: auth.buyer.userId,
      p_cost: cost,
      p_transaction_type: transactionType,
      p_description: description,
      p_reference_id: referenceId,
    });

    if (error) {
      if (error.message.toLowerCase().includes("insufficient seed balance")) {
        return auth.withSessionCookies(
          NextResponse.json(
            { success: false, message: "Insufficient Seed Balance" },
            { status: 400 },
          ),
        );
      }

      console.error("[SEED_DEDUCT_WRITE_ERROR]", error);
      return auth.withSessionCookies(
        NextResponse.json(
          { success: false, message: "Database wallet transaction failed" },
          { status: 500 },
        ),
      );
    }

    const result = data as { balance?: number } | null;

    return auth.withSessionCookies(
      NextResponse.json({
        success: true,
        newBalance: result?.balance ?? 0,
      }),
    );
  } catch (error) {
    console.error("[SEED_DEDUCT_CATCH_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
