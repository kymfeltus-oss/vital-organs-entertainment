import { NextResponse } from "next/server";

const DEPRECATED = {
  error: "Deprecated. Use POST /api/broadcast/command.",
};

/** Legacy route — use POST /api/broadcast/command instead. */
export async function GET() {
  return NextResponse.json(DEPRECATED, { status: 410 });
}

export async function POST() {
  return NextResponse.json(DEPRECATED, { status: 410 });
}
