import {
  DEFAULT_ROUTING_USER_ID,
  lowPassForInputSource,
  type AudioRoutingConfigRecord,
  type RoutingInputSource,
  type RoutingSelectedMode,
} from "./routing-persistence";

const memoryStore = new Map<string, AudioRoutingConfigRecord>();

export function createDefaultRoutingConfig(
  userId: string = DEFAULT_ROUTING_USER_ID,
): AudioRoutingConfigRecord {
  const inputSource: RoutingInputSource = "ACOUSTIC_AIR";
  return {
    id: `dev-${userId}`,
    userId,
    selectedMode: "SPEAKER",
    inputSource,
    noiseGateDb: -45,
    lowPassCutoffHz: lowPassForInputSource(inputSource),
    latencyOffsetMs: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function readDevRoutingConfig(userId: string): AudioRoutingConfigRecord {
  const existing = memoryStore.get(userId);
  if (existing) {
    return existing;
  }

  const created = createDefaultRoutingConfig(userId);
  memoryStore.set(userId, created);
  return created;
}

export function writeDevRoutingConfig(
  userId: string,
  patch: Partial<{
    selectedMode: RoutingSelectedMode;
    inputSource: RoutingInputSource;
    noiseGateDb: number;
    lowPassCutoffHz: number;
    latencyOffsetMs: number;
  }>,
): AudioRoutingConfigRecord {
  const current = readDevRoutingConfig(userId);
  const nextInputSource = patch.inputSource ?? current.inputSource;
  const updated: AudioRoutingConfigRecord = {
    ...current,
    ...patch,
    inputSource: nextInputSource,
    lowPassCutoffHz: patch.lowPassCutoffHz ?? lowPassForInputSource(nextInputSource),
    updatedAt: new Date().toISOString(),
  };
  memoryStore.set(userId, updated);
  return updated;
}

export function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("database_url") ||
    message.includes("environment variable not found") ||
    message.includes("can't reach database") ||
    message.includes("connection") ||
    message.includes("p1001") ||
    message.includes("p1012") ||
    message.includes("does not exist")
  );
}
