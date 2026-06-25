import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { agentValidateRtmp } from "@/lib/streaming/agent";
import { ensureFreshAccessToken } from "@/lib/streaming/token";
import { getStreamingDestinationForTenant } from "@/lib/streaming/service";
import { normalizePlatform } from "@/lib/streaming/platforms";
import { getStreamingDestinationSecrets } from "@/lib/todays-service/repository";

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
      const validation = await agentValidateRtmp(String(platform), {
        accessToken,
        streamUrl: secrets?.streamUrl,
        streamKey: secrets?.streamKey,
        settings: dest.settingsJson,
      });
      return { success: validation.ok, message: validation.safeUserMessage, validation };
    },
    { requireTest: true },
  );
}
