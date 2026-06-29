import { NextResponse } from "next/server";
import { loadActiveProgramGraphic } from "@/lib/graphics/program-state";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const graphic = await loadActiveProgramGraphic();
    return NextResponse.json(
      { graphic },
      { headers: { "Cache-Control": "public, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("[graphics/program] GET failed:", error);
    return NextResponse.json({ error: "Unable to load program graphics." }, { status: 500 });
  }
}
