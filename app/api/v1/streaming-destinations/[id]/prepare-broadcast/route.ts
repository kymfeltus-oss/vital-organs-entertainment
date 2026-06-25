import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { agentPrepareBroadcast } from "@/lib/streaming/agent";
import { ensureFreshAccessToken } from "@/lib/streaming/token";
import { getStreamingDestinationForTenant } from "@/lib/streaming/service";
import { normalizePlatform } from "@/lib/streaming/platforms";
import { getStreamingDestinationSecrets, updateStreamingDestination } from "@/lib/todays-service/repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      const dest = await getStreamingDestinationForTenant(id, ctx.tenantId);
      if (!dest) throw new Error("Destination not found.");
      const secrets = await getStreamingDestinationSecrets(id);
      const platform = normalizePlatform(dest.platform);
      const accessToken =
        platform === "custom_rtmp" || platform === "church_website"
          ? null
          : secrets
            ? await ensureFreshAccessToken(id, String(platform), secrets)
            : null;
      const prepared = await agentPrepareBroadcast(String(platform), {
        accessToken,
        title: dest.streamTitle,
        description: dest.streamDescription,
        settings: dest.settingsJson,
        streamUrl: secrets?.streamUrl,
        streamKey: secrets?.streamKey,
        destinationId: dest.id,
        broadcastId: dest.broadcastExternalId,
      });
      const broadcastId =
        typeof prepared.broadcastId === "string"
          ? prepared.broadcastId
          : typeof prepared.broadcast_id === "string"
            ? prepared.broadcast_id
            : dest.broadcastExternalId;
      if (broadcastId) {
        await updateStreamingDestination(id, {
          broadcastExternalId: broadcastId,
          liveStatus: "preparing",
          destinationStatus: "ready",
        });
      }
      return { success: true, message: "Broadcast prepared.", prepared };
    },
    { requireEdit: true },
  );
}
