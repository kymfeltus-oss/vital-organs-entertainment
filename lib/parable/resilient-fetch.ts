import type { SubsystemId } from "@/lib/parable/health-types";

export type ParableFetchResult = {
  response: Response;
  latencyMs: number;
};

export type ParableFetchOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
  subsystem?: SubsystemId;
};

export async function parableFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: ParableFetchOptions = {},
): Promise<ParableFetchResult> {
  const timeoutMs = options.timeoutMs ?? 12_000;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const signals = [controller.signal];
  if (options.signal) signals.push(options.signal);
  if (init.signal) signals.push(init.signal);

  const onAbort = () => controller.abort();
  for (const signal of signals) {
    if (signal.aborted) controller.abort();
    signal.addEventListener("abort", onAbort, { once: true });
  }

  const startedAt = performance.now();

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return {
      response,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } finally {
    window.clearTimeout(timeoutId);
    for (const signal of signals) {
      signal.removeEventListener("abort", onAbort);
    }
  }
}
