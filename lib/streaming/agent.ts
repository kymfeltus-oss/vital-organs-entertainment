import { proxyAudioService } from "@/lib/audio/service-proxy";
import type {
  StreamingOAuthStartResult,
  StreamingTestResult,
  StreamingValidationResult,
} from "@/lib/streaming/types";
import { mapAgentValidation } from "@/lib/streaming/validation";

export type AgentBroadcastInput = {
  accessToken?: string | null;
  title?: string;
  description?: string;
  broadcastId?: string | null;
  settings?: Record<string, unknown> | null;
  streamUrl?: string | null;
  streamKey?: string | null;
  destinationId?: string | null;
};

function broadcastBody(input: AgentBroadcastInput) {
  return {
    access_token: input.accessToken ?? "",
    title: input.title ?? "",
    description: input.description ?? "",
    broadcast_id: input.broadcastId ?? null,
    settings: input.settings ?? null,
    stream_url: input.streamUrl ?? null,
    stream_key: input.streamKey ?? null,
    destination_id: input.destinationId ?? null,
  };
}

export async function agentProviderConfigured(providerId: string): Promise<boolean> {
  try {
    const raw = await proxyAudioService<{ configured: boolean }>(
      `/streaming/providers/${providerId}/configured`,
    );
    return raw.configured;
  } catch {
    return false;
  }
}

export async function agentOAuthStart(
  providerId: string,
  state: string,
  redirectUri: string,
): Promise<StreamingOAuthStartResult> {
  const raw = await proxyAudioService<{
    configured: boolean;
    authorizationUrl: string | null;
    developmentMessage: string | null;
  }>(`/streaming/providers/${providerId}/oauth/start`, {
    method: "POST",
    body: { state, redirect_uri: redirectUri },
  });
  return {
    configured: raw.configured,
    authorizationUrl: raw.authorizationUrl,
    developmentMessage: raw.developmentMessage,
  };
}

export async function agentOAuthCallback(
  providerId: string,
  code: string,
  redirectUri: string,
): Promise<{
  tokens: Record<string, unknown>;
  accountName: string;
  accountEmail?: string | null;
  channelId?: string | null;
  channelName?: string | null;
  profileImageUrl?: string | null;
  permissions?: string[];
}> {
  return proxyAudioService(`/streaming/providers/${providerId}/oauth/callback`, {
    method: "POST",
    body: { code, redirect_uri: redirectUri },
  });
}

export async function agentTestConnection(
  providerId: string,
  input: {
    accessToken?: string | null;
    refreshToken?: string | null;
    tokenExpiresAt?: string | null;
    streamUrl?: string | null;
    streamKey?: string | null;
    settings?: Record<string, unknown> | null;
    videoProfile?: Record<string, unknown> | null;
    audioProfile?: Record<string, unknown> | null;
    privacy?: string | null;
    scheduledStartAt?: string | null;
  },
): Promise<StreamingTestResult> {
  const validation = await agentValidateDestination(providerId, input);
  return {
    success: validation.ok,
    connectionStatus: validation.ok ? "ready" : validation.status === "error" ? "error" : "needs_attention",
    message: validation.safeUserMessage,
    steps: validation.checks.map((check) => ({
      key: check.key,
      label: check.label,
      ok: check.ok,
      message: check.message,
      severity: check.severity,
    })),
    validation,
  };
}

export async function agentValidateDestination(
  providerId: string,
  input: {
    accessToken?: string | null;
    refreshToken?: string | null;
    tokenExpiresAt?: string | null;
    streamUrl?: string | null;
    streamKey?: string | null;
    settings?: Record<string, unknown> | null;
    videoProfile?: Record<string, unknown> | null;
    audioProfile?: Record<string, unknown> | null;
    privacy?: string | null;
    scheduledStartAt?: string | null;
    developerMode?: boolean;
  },
): Promise<StreamingValidationResult> {
  const raw = await proxyAudioService<{
    ok: boolean;
    status: string;
    checks: Array<{
      key: string;
      label: string;
      ok: boolean;
      message: string;
      severity?: string;
    }>;
    safe_user_message: string;
    technical_error?: string;
    refreshed_tokens?: Record<string, unknown>;
  }>(`/streaming/providers/${providerId}/validate`, {
    method: "POST",
    body: {
      access_token: input.accessToken ?? null,
      refresh_token: input.refreshToken ?? null,
      token_expires_at: input.tokenExpiresAt ?? null,
      stream_url: input.streamUrl ?? null,
      stream_key: input.streamKey ?? null,
      settings: input.settings ?? null,
      video_profile: input.videoProfile ?? null,
      audio_profile: input.audioProfile ?? null,
      privacy: input.privacy ?? null,
      scheduled_start_at: input.scheduledStartAt ?? null,
      developer_mode: input.developerMode ?? false,
    },
  });
  return mapAgentValidation(raw);
}

export async function agentValidateRtmp(
  providerId: string,
  input: {
    accessToken?: string | null;
    streamUrl?: string | null;
    streamKey?: string | null;
    settings?: Record<string, unknown> | null;
    developerMode?: boolean;
  },
): Promise<StreamingValidationResult> {
  const raw = await proxyAudioService<{
    ok: boolean;
    status: string;
    checks: Array<{
      key: string;
      label: string;
      ok: boolean;
      message: string;
      severity?: string;
    }>;
    safe_user_message: string;
    technical_error?: string;
  }>(`/streaming/providers/${providerId}/validate-rtmp`, {
    method: "POST",
    body: {
      access_token: input.accessToken ?? null,
      stream_url: input.streamUrl ?? null,
      stream_key: input.streamKey ?? null,
      settings: input.settings ?? null,
      developer_mode: input.developerMode ?? false,
    },
  });
  return mapAgentValidation(raw);
}

export async function agentPrepareBroadcast(
  providerId: string,
  input: AgentBroadcastInput,
): Promise<Record<string, unknown>> {
  return proxyAudioService(`/streaming/providers/${providerId}/prepare`, {
    method: "POST",
    body: broadcastBody(input),
  });
}

export async function agentStartBroadcast(
  providerId: string,
  input: AgentBroadcastInput,
): Promise<Record<string, unknown>> {
  return proxyAudioService(`/streaming/providers/${providerId}/start`, {
    method: "POST",
    body: broadcastBody(input),
  });
}

export async function agentStopBroadcast(
  providerId: string,
  input: AgentBroadcastInput,
): Promise<Record<string, unknown>> {
  return proxyAudioService(`/streaming/providers/${providerId}/stop`, {
    method: "POST",
    body: broadcastBody(input),
  });
}

export async function agentRefreshOAuthToken(
  providerId: string,
  refreshToken: string,
): Promise<{ access_token: string; expires_in?: number; refresh_token?: string }> {
  return proxyAudioService(`/streaming/providers/${providerId}/oauth/refresh`, {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
}

export function isStreamingAgentConfigured(): boolean {
  return Boolean(process.env.AUDIO_SERVICE_URL || process.env.NEXT_PUBLIC_AUDIO_WS_URL);
}
