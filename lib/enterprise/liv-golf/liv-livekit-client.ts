import { getClientAppUrl } from "@/lib/client-api";

export type LivLiveKitTokenResponse = {
  success?: boolean;
  error?: string;
  token?: string;
  url?: string;
  roomName?: string;
  participantIdentity?: string;
};

export type LivLiveKitEgressStartResponse = {
  success?: boolean;
  error?: string;
  egressId?: string;
  roomName?: string;
  hlsManifestUrl?: string;
  publishStatus?: string;
  isLive?: boolean;
  alreadyLive?: boolean;
  message?: string;
};

export type LivLiveKitEgressStopResponse = {
  success?: boolean;
  error?: string;
  egressId?: string | null;
  clearedEgressIds?: string[];
  remainingActiveEgressIds?: string[];
  publishStatus?: string;
  attendeeUiPhase?: string;
  egressAlreadyTerminal?: boolean;
  message?: string;
};

export type LivLiveKitEgressReadinessResponse = {
  success?: boolean;
  ready?: boolean;
  blockers?: string[];
  error?: string;
};

export async function fetchLivLiveKitPublisherToken(input?: {
  roomName?: string;
  participantIdentity?: string;
  displayName?: string;
}): Promise<LivLiveKitTokenResponse> {
  const response = await fetch(`${getClientAppUrl()}/api/enterprise/liv-golf/livekit/token`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? {}),
  });

  return (await response.json()) as LivLiveKitTokenResponse;
}

export async function startLivLiveKitEgress(input: {
  roomName: string;
  participantIdentity: string;
}): Promise<LivLiveKitEgressStartResponse> {
  const response = await fetch(
    `${getClientAppUrl()}/api/enterprise/liv-golf/livekit/egress/start`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomName: input.roomName,
        participantIdentity: input.participantIdentity,
        confirm: true,
      }),
    },
  );

  return (await response.json()) as LivLiveKitEgressStartResponse;
}

export async function stopLivLiveKitEgress(egressId?: string | null): Promise<LivLiveKitEgressStopResponse> {
  const response = await fetch(
    `${getClientAppUrl()}/api/enterprise/liv-golf/livekit/egress/stop`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        egressId: egressId ?? undefined,
        confirm: true,
      }),
    },
  );

  return (await response.json()) as LivLiveKitEgressStopResponse;
}

export async function fetchLivLiveKitEgressReadiness(): Promise<LivLiveKitEgressReadinessResponse> {
  const response = await fetch(
    `${getClientAppUrl()}/api/enterprise/liv-golf/livekit/egress/readiness`,
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  return (await response.json()) as LivLiveKitEgressReadinessResponse;
}
