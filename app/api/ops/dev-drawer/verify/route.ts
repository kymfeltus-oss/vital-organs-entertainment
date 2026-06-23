import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";

type VerifyBody = {
  password?: unknown;
};

export async function POST(request: NextRequest) {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  const expected =
    process.env.OPS_DEV_DRAWER_PASSWORD?.trim() ||
    process.env.ADMIN_SECRET_KEY?.trim();

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Developer drawer is not configured on the server." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as VerifyBody;
    const password = typeof body.password === "string" ? body.password : "";

    if (password !== expected) {
      return NextResponse.json({ ok: false, error: "Invalid credential." }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
}
