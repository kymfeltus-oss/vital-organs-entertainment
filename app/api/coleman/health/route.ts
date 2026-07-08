import { NextResponse } from "next/server";

import { prisma } from "@/app/enterprise/coleman/lib/prisma";
import { initColemanStorage } from "@/app/enterprise/coleman/lib/storage";

export async function GET() {
  try {
    initColemanStorage();
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, service: "coleman-api", database: "connected" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Coleman API health check failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
