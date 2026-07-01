import type { NextRequest } from "next/server";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type MemoryBucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, MemoryBucket>();

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

function getUpstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

async function upstashPipeline(
  commands: Array<[string, ...string[]]>,
): Promise<Array<{ result?: unknown; error?: string }>> {
  const config = getUpstashConfig();
  if (!config) return [];

  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash pipeline failed (${response.status}).`);
  }

  return (await response.json()) as Array<{ result?: unknown; error?: string }>;
}

async function consumeUpstashLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(windowMs / 1000);
  const results = await upstashPipeline([
    ["INCR", key],
    ["TTL", key],
  ]);

  const count = Number(results[0]?.result ?? 0);
  let ttl = Number(results[1]?.result ?? -1);

  if (count === 1 || ttl < 0) {
    await upstashPipeline([["EXPIRE", key, String(windowSeconds)]]);
    ttl = windowSeconds;
  }

  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);

  return {
    allowed,
    remaining,
    retryAfterSeconds: allowed ? 0 : Math.max(1, ttl),
  };
}

function consumeMemoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = memoryBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  memoryBuckets.set(key, existing);

  const allowed = existing.count <= limit;
  const remaining = Math.max(0, limit - existing.count);
  const retryAfterSeconds = allowed
    ? 0
    : Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return { allowed, remaining, retryAfterSeconds };
}

/** Resolve client IP for throttling — prefers trusted proxy headers. */
export function resolveClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

/** Fixed-window rate limiter — Upstash in production, in-memory fallback locally. */
export async function consumeRateLimit(
  bucket: string,
  identifier: string,
  options?: { limit?: number; windowMs?: number },
): Promise<RateLimitResult> {
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const key = `auth:rate:${bucket}:${identifier}`;

  try {
    if (getUpstashConfig()) {
      return await consumeUpstashLimit(key, limit, windowMs);
    }
  } catch (error) {
    console.error("[AUTH_RATE_LIMIT_ERR]: Upstash unavailable — using memory fallback.", error);
  }

  return consumeMemoryLimit(key, limit, windowMs);
}
