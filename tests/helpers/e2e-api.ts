import { expect, type APIRequestContext, type APIResponse, type Page } from "@playwright/test";

const HTML_SIGNATURE = /^\s*(<!doctype html|<html[\s>])/i;

const CONFIGURED_PLAYBACK_MESSAGE =
  /Connected|Live stream connected|Playing development test stream|Backup feed connected/i;

const FALLBACK_PLAYBACK_MESSAGE =
  /The broadcast is not live yet|Waiting for the live playback URL|Looking for the live playback URL|Live playback is unavailable|Could not load the live playback URL|Waiting for signal|Live playback failed|manifestLoadError/i;

export async function readResponseBody(response: APIResponse): Promise<string> {
  const contentType = response.headers()["content-type"] ?? "";
  if (contentType.includes("application/json")) {
    return JSON.stringify(await response.json());
  }
  return response.text();
}

export async function expectJsonRoute(
  request: APIRequestContext,
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH";
    body?: Record<string, unknown>;
    allowedStatuses?: number[];
  } = {},
): Promise<Record<string, unknown>> {
  const method = options.method ?? "GET";
  const allowedStatuses = options.allowedStatuses ?? [200];

  const response = await request.fetch(path, {
    method,
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    data: options.body,
  });

  const contentType = response.headers()["content-type"] ?? "";
  const rawBody = await response.text();

  expect(
    allowedStatuses,
    `${method} ${path} returned ${response.status()} with body: ${rawBody.slice(0, 240)}`,
  ).toContain(response.status());
  expect(contentType.toLowerCase(), `${path} should return JSON content-type`).toContain(
    "application/json",
  );
  expect(HTML_SIGNATURE.test(rawBody), `${path} returned HTML instead of JSON`).toBe(false);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    throw new Error(`${path} returned malformed JSON: ${rawBody.slice(0, 240)}`);
  }

  return parsed;
}

export function formatLocalDateTimeInput(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function attachConsoleGuard(page: import("@playwright/test").Page): string[] {
  const errors: string[] = [];
  const blockedPatterns = [
    /unexpected token '<'/i,
    /not valid json/i,
    /\b500\b/,
    /unhandled runtime error/i,
  ];

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (blockedPatterns.some((pattern) => pattern.test(text))) {
      errors.push(text);
    }
  });

  return errors;
}

export function assertNoBlockedConsoleErrors(errors: string[], label: string): void {
  expect(errors, `${label} console/page errors: ${errors.join(" | ")}`).toEqual([]);
}

/** Assert attendee playback UI without claiming real encoder readiness unless probes pass. */
export async function expectAttendeeStreamUiState(
  page: Page,
  request: APIRequestContext,
): Promise<{ encoderStreamLive: boolean; manifestSuccess: boolean }> {
  const manifest = await expectJsonRoute(request, "/api/stream/manifest?experience=main_stage", {
    allowedStatuses: [200, 404],
  });
  const streamHealth = await expectJsonRoute(request, "/api/owner/stream-health");

  const encoderStreamLive = streamHealth.encoderStreamLive === true;
  const manifestSuccess = manifest.success === true;
  const videoVisible = await page.locator("video").isVisible();

  if (encoderStreamLive && manifestSuccess) {
    await expect(page.locator("video")).toBeVisible({ timeout: 15_000 });
  } else if (videoVisible) {
    await expect(page.getByText(CONFIGURED_PLAYBACK_MESSAGE).first()).toBeVisible({ timeout: 15_000 });
  } else {
    await expect(page.getByText(FALLBACK_PLAYBACK_MESSAGE).first()).toBeVisible({ timeout: 15_000 });
  }

  return { encoderStreamLive, manifestSuccess };
}

export async function expectHoldingRoomSurface(page: Page): Promise<void> {
  await expect(page.getByAltText("300 Awakening holding room")).toBeVisible({ timeout: 15_000 });
}

export async function expectLivePlayerSurface(page: Page): Promise<void> {
  await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/^On Air$|^Standby$|^Direct Live$/)).toBeVisible({ timeout: 15_000 });
}

/** Accepts either pre-live holding room artboard or live player shell on /live. */
export async function expectLiveEntrySurface(
  page: Page,
  request: APIRequestContext,
): Promise<"holding" | "live"> {
  const holdingRoom = page.getByAltText("300 Awakening holding room");
  if (await holdingRoom.isVisible()) {
    await expect(holdingRoom).toBeVisible();
    return "holding";
  }

  await expectLivePlayerSurface(page);
  await expectAttendeeStreamUiState(page, request);
  return "live";
}

export async function tryEndBroadcast(request: APIRequestContext): Promise<boolean> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await request.post("/api/owner/broadcast/end");
    const access = await expectJsonRoute(request, "/api/access/live");
    if (access.streamIsLive !== true) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  return false;
}

/** @deprecated Prefer tryEndBroadcast when a test can continue in an already-live state. */
export async function ensureBroadcastOffline(request: APIRequestContext): Promise<void> {
  const offline = await tryEndBroadcast(request);
  if (!offline) {
    throw new Error("Broadcast remained live after repeated /api/owner/broadcast/end attempts.");
  }
}
