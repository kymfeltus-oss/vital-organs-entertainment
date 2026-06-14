import { NextResponse } from "next/server";
import { loadExperienceHubPayload } from "@/lib/experience/load-experience-hub-payload";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await loadExperienceHubPayload();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[experience/hub] payload load failed:", error);
    return NextResponse.json({ error: "Unable to load experience hub." }, { status: 500 });
  }
}
