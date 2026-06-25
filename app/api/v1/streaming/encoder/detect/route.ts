import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { detectEncoders } from "@/lib/streaming/encoder";

export async function GET(request: NextRequest) {
  return withServiceAuth(request, async () => {
    const result = await detectEncoders();
    return { result };
  });
}
