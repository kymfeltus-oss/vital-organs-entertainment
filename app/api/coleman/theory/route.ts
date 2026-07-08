import { NextResponse } from "next/server";

import { toTheoryEntry } from "@/app/enterprise/coleman/lib/db-mappers";
import { prisma } from "@/app/enterprise/coleman/lib/prisma";

export async function GET() {
  try {
    const catalog = await prisma.theoryProgression.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(catalog.map(toTheoryEntry));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load theory catalog.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
