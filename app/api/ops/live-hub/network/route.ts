import { NextResponse } from "next/server";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";

/** Lightweight connectivity probe for the Live Hub Internet Connection card. */
export async function GET() {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  return NextResponse.json(
    { ok: true, ts: Date.now() },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
