import { NextRequest, NextResponse } from "next/server";
import { executeStreamToggle } from "@/lib/ops/execute-stream-toggle";

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET_KEY;

  if (!adminSecret) {
    console.error("[STREAM_TOGGLE_ERR]: ADMIN_SECRET_KEY is not configured.");
    return NextResponse.json(
      { error: "Stream toggle is not configured." },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("X-Admin-Secret-Key");

  if (!authHeader || authHeader !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    isLive?: boolean;
    primaryUrl?: string;
    backupUrl?: string;
    activeSource?: string;
  };

  const result = await executeStreamToggle({
    isLive: body.isLive === true,
    activeSource:
      body.activeSource === "primary" || body.activeSource === "backup"
        ? body.activeSource
        : undefined,
    primaryUrl: body.primaryUrl,
    backupUrl: body.backupUrl,
  });

  if (result.ok === false) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, state: result.state });
}
