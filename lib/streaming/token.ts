import { agentRefreshOAuthToken, isStreamingAgentConfigured } from "@/lib/streaming/agent";
import type { StreamingDestinationSecrets } from "@/lib/todays-service/repository";
import { updateStreamingDestination } from "@/lib/todays-service/repository";

export async function ensureFreshAccessToken(
  destinationId: string,
  providerId: string,
  secrets: StreamingDestinationSecrets,
): Promise<string | null> {
  if (!secrets.oauthAccessToken) return null;

  const expiresAt = secrets.oauthExpiresAt ? Date.parse(secrets.oauthExpiresAt) : 0;
  const stillValid = expiresAt > Date.now() + 60_000;
  if (stillValid) return secrets.oauthAccessToken;

  if (!secrets.oauthRefreshToken || !isStreamingAgentConfigured()) {
    return secrets.oauthAccessToken;
  }

  const raw = await agentRefreshOAuthToken(providerId, secrets.oauthRefreshToken);
  const expiresIn = typeof raw.expires_in === "number" ? raw.expires_in : 3600;
  const nextExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  await updateStreamingDestination(destinationId, {
    oauthAccessToken: raw.access_token,
    oauthRefreshToken: raw.refresh_token ?? secrets.oauthRefreshToken,
    oauthExpiresAt: nextExpiresAt,
  });

  return raw.access_token;
}
