import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { getEncoderPreviewStats } from "@/lib/streaming/encoder";

export async function GET(request: NextRequest) {
  const destinationId = request.nextUrl.searchParams.get("destinationId");
  if (!destinationId) {
    return Response.json({ error: "destinationId is required." }, { status: 400 });
  }
  return withServiceAuth(request, async () => {
    const stats = await getEncoderPreviewStats(destinationId);
    return { stats };
  });
}
