import type { LiveReadinessState } from "@/lib/todays-service/types";

const REDIS_KEY_PREFIX = "todays-service:readiness:";

type MemoryEntry = { payload: LiveReadinessState; expiresAt: number };

const memoryCache = new Map<string, MemoryEntry>();

let redisClient: import("ioredis").default | null = null;
let redisInitAttempted = false;

async function getRedis(): Promise<import("ioredis").default | null> {
  if (redisInitAttempted) return redisClient;
  redisInitAttempted = true;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const Redis = (await import("ioredis")).default;
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 2_000,
      commandTimeout: 2_000,
      enableOfflineQueue: false,
    });
    await Promise.race([
      redisClient.connect(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Redis connect timeout")), 2_000);
      }),
    ]);
    return redisClient;
  } catch (error) {
    console.error("[TODAYS_SERVICE_REDIS_INIT_ERR]:", error);
    try {
      redisClient?.disconnect();
    } catch {
      /* ignore */
    }
    redisClient = null;
    return null;
  }
}

export async function setLiveReadinessState(state: LiveReadinessState): Promise<void> {
  const key = `${REDIS_KEY_PREFIX}${state.tenantId}`;
  const payload = JSON.stringify(state);
  const redis = await getRedis();

  if (redis) {
    try {
      await redis.set(key, payload, "EX", 3600);
      await redis.publish(`${key}:channel`, payload);
    } catch (error) {
      console.error("[TODAYS_SERVICE_REDIS_SET_ERR]:", error);
    }
    return;
  }

  memoryCache.set(key, {
    payload: state,
    expiresAt: Date.now() + 3600_000,
  });
}

/** Fire-and-forget readiness cache write — never blocks dashboard reads. */
export function scheduleLiveReadinessState(state: LiveReadinessState): void {
  void setLiveReadinessState(state).catch((error) => {
    console.error("[TODAYS_SERVICE_REDIS_SCHEDULE_ERR]:", error);
  });
}

export async function getLiveReadinessState(tenantId: string): Promise<LiveReadinessState | null> {
  const key = `${REDIS_KEY_PREFIX}${tenantId}`;
  const redis = await getRedis();

  if (redis) {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as LiveReadinessState;
  }

  const entry = memoryCache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.payload;
}

export async function subscribeLiveReadiness(
  tenantId: string,
  onMessage: (state: LiveReadinessState) => void,
  signal?: AbortSignal,
): Promise<() => void> {
  const key = `${REDIS_KEY_PREFIX}${tenantId}`;
  const redis = await getRedis();

  if (!redis) {
    return () => {};
  }

  const subscriber = redis.duplicate();
  await subscriber.connect();
  const channel = `${key}:channel`;

  const handler = (receivedChannel: string, message: string) => {
    if (receivedChannel !== channel) return;
    try {
      onMessage(JSON.parse(message) as LiveReadinessState);
    } catch {
      /* ignore malformed */
    }
  };

  subscriber.on("message", handler);
  await subscriber.subscribe(channel);

  const cleanup = () => {
    subscriber.off("message", handler);
    void subscriber.unsubscribe(channel);
    void subscriber.quit();
  };

  signal?.addEventListener("abort", cleanup);
  return cleanup;
}
