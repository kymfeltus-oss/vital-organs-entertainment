import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { ensureFreshAccessToken } from "@/lib/streaming/token";
import { getStreamingDestinationForTenant } from "@/lib/streaming/service";
import { normalizePlatform } from "@/lib/streaming/platforms";
import { agentRefreshOAuthToken } from "@/lib/streaming/agent";
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
      if (!secrets?.oauthRefreshToken) throw new Error("No refresh token available for this destination.");
      const platform = normalizePlatform(dest.platform);
      const tokens = await agentRefreshOAuthToken(String(platform), secrets.oauthRefreshToken);
      const expiresIn = typeof tokens.expires_in === "number" ? tokens.expires_in : 3600;
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
      await updateStreamingDestination(id, {
        oauthAccessToken: tokens.access_token,
        oauthRefreshToken: tokens.refresh_token ?? secrets.oauthRefreshToken,
        oauthExpiresAt: expiresAt,
        oauthStatus: "connected",
        lastAuthenticatedAt: new Date().toISOString(),
      });
      await ensureFreshAccessToken(id, String(platform), {
        ...secrets,
        oauthAccessToken: tokens.access_token,
        oauthRefreshToken: tokens.refresh_token ?? secrets.oauthRefreshToken,
        oauthExpiresAt: expiresAt,
      });
      return { success: true, message: "Token refreshed.", expiresAt };
    },
    { requireEdit: true },
  );
}
