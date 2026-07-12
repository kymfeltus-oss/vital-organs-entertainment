import { randomUUID } from "node:crypto";
import {
  AccessToken,
  EgressClient,
  EgressStatus,
  RoomServiceClient,
  SegmentedFileOutput,
  S3Upload,
} from "livekit-server-sdk";
import {
  buildEgressFilenamePrefix,
  buildHlsManifestUrl,
  LiveKitConfigError,
  resolveLiveKitCoreConfig,
  resolveLiveKitServerConfig,
  resolveLivGolfLiveKitRoomName,
  resolvePublicLiveKitWsUrl,
} from "@/lib/enterprise/liv-golf/livekit-config";

export const LIV_LIVEKIT_PRESET_KEY = "liv_livekit_broadcast";

export type LivLiveKitBroadcastState = {
  egressId: string | null;
  roomName: string;
  hlsManifestUrl: string | null;
  filenamePrefix: string | null;
  participantIdentity: string | null;
  startedAt: string | null;
  endedAt: string | null;
};

export type LivLiveKitPublisherToken = {
  token: string;
  url: string;
  roomName: string;
  participantIdentity: string;
};

export type LivLiveKitEgressStartResult = {
  egressId: string;
  roomName: string;
  hlsManifestUrl: string;
  filenamePrefix: string;
};

function createRoomService(): RoomServiceClient {
  const config = resolveLiveKitCoreConfig();
  return new RoomServiceClient(config.url, config.apiKey, config.apiSecret);
}

function createEgressClient(): EgressClient {
  const config = resolveLiveKitCoreConfig();
  return new EgressClient(config.url, config.apiKey, config.apiSecret);
}

export async function ensureLiveKitRoom(roomName: string): Promise<void> {
  const rooms = createRoomService();
  try {
    await rooms.createRoom({
      name: roomName,
      emptyTimeout: 10 * 60,
      departureTimeout: 30,
      maxParticipants: 24,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(message)) {
      throw error;
    }
  }
}

export async function mintLivPublisherToken(input: {
  roomName?: string;
  participantIdentity?: string;
  displayName?: string;
}): Promise<LivLiveKitPublisherToken> {
  const config = resolveLiveKitCoreConfig();
  const roomName = resolveLivGolfLiveKitRoomName(input.roomName);
  const participantIdentity =
    input.participantIdentity?.trim() || `liv-publisher-${randomUUID()}`;

  await ensureLiveKitRoom(roomName);

  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity: participantIdentity,
    name: input.displayName?.trim() || "LIV Golf Producer",
    ttl: "4h",
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: false,
    canPublishData: false,
  });

  const jwt = await token.toJwt();
  const publicUrl = resolvePublicLiveKitWsUrl(config);

  return {
    token: jwt,
    url: publicUrl,
    roomName,
    participantIdentity,
  };
}

const ACTIVE_EGRESS_STATUSES = new Set<EgressStatus>([
  EgressStatus.EGRESS_STARTING,
  EgressStatus.EGRESS_ACTIVE,
  EgressStatus.EGRESS_ENDING,
]);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function egressStatusLabel(status: EgressStatus): string {
  return EgressStatus[status] ?? String(status);
}

async function listActiveLiveKitEgress(input?: {
  roomName?: string;
}): Promise<Array<{ egressId: string; status: EgressStatus; roomName: string }>> {
  const egress = createEgressClient();
  const roomName = input?.roomName?.trim();
  const queries = roomName
    ? [{ active: true, roomName }, { active: true }]
    : [{ active: true }];

  const seen = new Set<string>();
  const items: Array<{ egressId: string; status: EgressStatus; roomName: string }> = [];

  for (const query of queries) {
    try {
      const rows = await egress.listEgress(query);
      for (const row of rows) {
        const egressId = row.egressId?.trim();
        if (!egressId || seen.has(egressId)) continue;
        if (!ACTIVE_EGRESS_STATUSES.has(row.status)) continue;
        seen.add(egressId);
        items.push({
          egressId,
          status: row.status,
          roomName: row.roomName ?? "",
        });
      }
    } catch (error) {
      console.warn("[liv-golf/livekit] listEgress failed:", error);
    }
  }

  return items;
}

/** Wait until LiveKit reports no active egress slots (or timeout). */
export async function waitForLiveKitEgressSlots(input?: {
  roomName?: string;
  timeoutMs?: number;
  pollMs?: number;
}): Promise<{ activeCount: number; activeIds: string[]; timedOut: boolean }> {
  const timeoutMs = input?.timeoutMs ?? 45_000;
  const pollMs = input?.pollMs ?? 2_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const active = await listActiveLiveKitEgress({ roomName: input?.roomName });
    if (active.length === 0) {
      return { activeCount: 0, activeIds: [], timedOut: false };
    }
    await delay(pollMs);
  }

  const active = await listActiveLiveKitEgress({ roomName: input?.roomName });
  return {
    activeCount: active.length,
    activeIds: active.map((item) => item.egressId),
    timedOut: true,
  };
}

/** Stop active LiveKit egress jobs so a new room composite session can start. */
export async function clearActiveLiveKitEgressSessions(input?: {
  roomName?: string;
  knownEgressIds?: string[];
  waitForSlots?: boolean;
}): Promise<{
  stoppedIds: string[];
  failures: string[];
  remainingActiveIds: string[];
  waitTimedOut: boolean;
}> {
  const egress = createEgressClient();
  const stoppedIds: string[] = [];
  const failures: string[] = [];
  const idsToStop = new Set<string>();

  for (const id of input?.knownEgressIds ?? []) {
    const trimmed = id.trim();
    if (trimmed) idsToStop.add(trimmed);
  }

  const active = await listActiveLiveKitEgress({ roomName: input?.roomName });
  for (const item of active) {
    idsToStop.add(item.egressId);
    console.info(
      `[liv-golf/livekit] active egress ${item.egressId} (${egressStatusLabel(item.status)}) room=${item.roomName}`,
    );
  }

  for (const egressId of idsToStop) {
    try {
      await egress.stopEgress(egressId);
      stoppedIds.push(egressId);
    } catch (error) {
      if (isLiveKitEgressAlreadyTerminalError(error)) {
        stoppedIds.push(egressId);
      } else {
        failures.push(egressId);
        console.warn(`[liv-golf/livekit] stopEgress(${egressId}) failed:`, error);
      }
    }
  }

  let remainingActiveIds: string[] = [];
  let waitTimedOut = false;

  if (input?.waitForSlots !== false) {
    const wait = await waitForLiveKitEgressSlots({
      roomName: input?.roomName,
      timeoutMs: 45_000,
      pollMs: 2_000,
    });
    remainingActiveIds = wait.activeIds;
    waitTimedOut = wait.timedOut;
  }

  return { stoppedIds, failures, remainingActiveIds, waitTimedOut };
}

export function isLiveKitConcurrentEgressLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /concurrent egress sessions limit exceeded|egress.*limit.*exceeded|EGRESS_LIMIT_REACHED/i.test(
    message,
  );
}

export async function startLivRoomCompositeHlsEgress(input: {
  roomName?: string;
  sessionStamp?: string;
  knownEgressIds?: string[];
}): Promise<LivLiveKitEgressStartResult> {
  const config = resolveLiveKitServerConfig();
  const roomName = resolveLivGolfLiveKitRoomName(input.roomName);

  const cleared = await clearActiveLiveKitEgressSessions({
    roomName,
    knownEgressIds: input.knownEgressIds,
  });

  if (cleared.remainingActiveIds.length > 0) {
    throw new LiveKitConfigError(
      `LiveKit egress slots still in use (${cleared.remainingActiveIds.join(", ")}). Wait about 30 seconds after End Broadcast, then try Open to Fans again.`,
    );
  }

  const sessionStamp = input.sessionStamp?.trim() || new Date().toISOString().replace(/[:.]/g, "-");
  const filenamePrefix = buildEgressFilenamePrefix(roomName, sessionStamp);
  const hlsManifestUrl = buildHlsManifestUrl(filenamePrefix, config);

  const output = new SegmentedFileOutput({
    filenamePrefix,
    playlistName: "playlist.m3u8",
    livePlaylistName: "live-playlist.m3u8",
    segmentDuration: 2,
    output: {
      case: "s3",
      value: new S3Upload({
        accessKey: config.awsAccessKey,
        secret: config.awsSecretKey,
        bucket: config.bucket,
        region: config.region,
      }),
    },
  });

  const egress = createEgressClient();
  const info = await egress.startRoomCompositeEgress(roomName, output, {
    layout: "speaker",
    audioOnly: false,
  });

  const egressId = info.egressId?.trim();
  if (!egressId) {
    throw new LiveKitConfigError("LiveKit egress started without an egress id.");
  }

  return {
    egressId,
    roomName,
    hlsManifestUrl,
    filenamePrefix,
  };
}

export async function stopLivLiveKitEgress(egressId: string): Promise<{
  stopped: boolean;
  alreadyTerminal: boolean;
}> {
  const trimmed = egressId.trim();
  if (!trimmed) {
    throw new LiveKitConfigError("egressId is required to stop LiveKit egress.");
  }

  const egress = createEgressClient();
  try {
    await egress.stopEgress(trimmed);
    return { stopped: true, alreadyTerminal: false };
  } catch (error) {
    if (isLiveKitEgressAlreadyTerminalError(error)) {
      return { stopped: false, alreadyTerminal: true };
    }
    throw error;
  }
}

export function isLiveKitEgressAlreadyTerminalError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /EGRESS_FAILED|EGRESS_COMPLETE|EGRESS_ABORTED|EGRESS_LIMIT_REACHED|cannot be stopped|not found/i.test(
    message,
  );
}

export function readLivLiveKitBroadcastState(
  presets: Record<string, unknown> | null | undefined,
): LivLiveKitBroadcastState | null {
  if (!presets || typeof presets !== "object") return null;
  const raw = presets[LIV_LIVEKIT_PRESET_KEY];
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  return {
    egressId: typeof record.egressId === "string" ? record.egressId : null,
    roomName:
      typeof record.roomName === "string"
        ? record.roomName
        : resolveLivGolfLiveKitRoomName(null),
    hlsManifestUrl:
      typeof record.hlsManifestUrl === "string" ? record.hlsManifestUrl : null,
    filenamePrefix:
      typeof record.filenamePrefix === "string" ? record.filenamePrefix : null,
    participantIdentity:
      typeof record.participantIdentity === "string" ? record.participantIdentity : null,
    startedAt: typeof record.startedAt === "string" ? record.startedAt : null,
    endedAt: typeof record.endedAt === "string" ? record.endedAt : null,
  };
}

export function mergeLivLiveKitBroadcastPreset(
  presets: Record<string, unknown> | null | undefined,
  patch: Partial<LivLiveKitBroadcastState>,
): Record<string, unknown> {
  const base = presets && typeof presets === "object" ? { ...presets } : {};
  const current = readLivLiveKitBroadcastState(base) ?? {
    egressId: null,
    roomName: resolveLivGolfLiveKitRoomName(null),
    hlsManifestUrl: null,
    filenamePrefix: null,
    participantIdentity: null,
    startedAt: null,
    endedAt: null,
  };

  return {
    ...base,
    [LIV_LIVEKIT_PRESET_KEY]: {
      ...current,
      ...patch,
    },
  };
}
