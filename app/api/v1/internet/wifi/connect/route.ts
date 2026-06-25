import { NextRequest } from "next/server";
import { parseJsonBody, withInternetAuth } from "@/lib/internet/route-handlers";
import { connectWifiNetwork } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withInternetAuth(
    request,
    async () => {
      const body = await parseJsonBody<{ ssid: string; password?: string }>(request);
      if (!body.ssid?.trim()) throw new Error("Network name is required.");
      return connectWifiNetwork(body.ssid.trim(), body.password ?? "");
    },
    { requireEdit: true },
  );
}
