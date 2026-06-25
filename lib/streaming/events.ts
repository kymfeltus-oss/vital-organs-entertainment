import type { StreamingDestination } from "@/lib/todays-service/types";

const REDIS_KEY_PREFIX = "todays-service:streaming:";
const memoryListeners = new Map<string, Set<(payload: StreamingLiveEvent) => void>>();

export type StreamingLiveEvent = {
  tenantId: string;
  destinations: StreamingDestination[];
  at: string;
};

let redisClient: import("ioredis").default | null = null;
let redisInitAttempted = false;

async function getRedis(): Promise<import("ioredis").default | null> {
  if (redisInitAttempted) return redisClient;
  redisInitAttempted = true;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const Redis = (await import("ioredis")).default;
    redisClient = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true });
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error("[STREAMING_EVENTS_REDIS_INIT_ERR]:", error);
    redisClient = null;
    return null;
  }
}

export async function publishStreamingLiveUpdate(event: StreamingLiveEvent): Promise<void> {
  const key = `${REDIS_KEY_PREFIX}${event.tenantId}`;
  const payload = JSON.stringify(event);
  const redis = await getRedis();

  if (redis) {
    await redis.set(key, payload, "EX", 3600);
    await redis.publish(`${key}:channel`, payload);
    return;
  }

  const listeners = memoryListeners.get(event.tenantId);
  if (listeners) {
    for (const listener of listeners) listener(event);
  }
}

export async function getCachedStreamingLiveUpdate(tenantId: string): Promise<StreamingLiveEvent | null> {
  const key = `${REDIS_KEY_PREFIX}${tenantId}`;
  const redis = await getRedis();
  if (!redis) return null;
  const raw = await redis.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as StreamingLiveEvent;
}

export async function subscribeStreamingLiveUpdates(
  tenantId: string,
  onMessage: (event: StreamingLiveEvent) => void,
  signal?: AbortSignal,
): Promise<() => void> {
  const key = `${REDIS_KEY_PREFIX}${tenantId}`;
  const redis = await getRedis();

  if (!redis) {
    if (!memoryListeners.has(tenantId)) memoryListeners.set(tenantId, new Set());
    memoryListeners.get(tenantId)!.add(onMessage);
    const cleanup = () => {
      memoryListeners.get(tenantId)?.delete(onMessage);
    };
    signal?.addEventListener("abort", cleanup);
    return cleanup;
  }

  const subscriber = redis.duplicate();
  await subscriber.connect();
  const channel = `${key}:channel`;

  const handler = (receivedChannel: string, message: string) => {
    if (receivedChannel !== channel) return;
    try {
      onMessage(JSON.parse(message) as StreamingLiveEvent);
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
