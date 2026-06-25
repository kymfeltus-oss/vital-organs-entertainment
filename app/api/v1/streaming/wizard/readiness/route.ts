import { NextRequest } from "next/server";
import { getStreamingWizardReadiness } from "@/lib/streaming/wizard-readiness";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";

export async function GET(request: NextRequest) {
  return withServiceAuth(request, async () => getStreamingWizardReadiness());
}
