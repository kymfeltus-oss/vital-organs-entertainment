import { test, expect } from "@playwright/test";
import { expectJsonRoute } from "./helpers/e2e-api";

test.describe("Owner production API health", () => {
  test("owner and manifest routes return JSON during E2E bypass", async ({ request }) => {
    const showSetup = await expectJsonRoute(request, "/api/owner/show-setup");
    expect(showSetup.ok).toBe(true);

    const countdown = await expectJsonRoute(request, "/api/owner/countdown", {
      method: "PATCH",
      body: { offsetSeconds: 0 },
      allowedStatuses: [200, 400, 409],
    });
    expect(countdown).toBeTruthy();

    const broadcast = await expectJsonRoute(request, "/api/owner/broadcast");
    expect(broadcast.snapshot).toBeTruthy();

    const streamHealth = await expectJsonRoute(request, "/api/owner/stream-health");
    expect(typeof streamHealth.statusMessage).toBe("string");
    expect(typeof streamHealth.dressRehearsalReady).toBe("boolean");
    expect(typeof streamHealth.encoderStreamLive).toBe("boolean");

    const manifest = await expectJsonRoute(request, "/api/stream/manifest?experience=main_stage", {
      allowedStatuses: [200, 404],
    });
    expect(manifest).toBeTruthy();
  });

  test("countdown update route accepts schedule payload and returns JSON", async ({ request }) => {
    const targetDateTime = new Date(Date.now() + 10 * 60_000).toISOString();

    const updated = await expectJsonRoute(request, "/api/owner/countdown/update", {
      method: "POST",
      body: {
        targetDateTime,
        schedule_timezone: "America/Chicago",
      },
    });

    expect(updated.ok).toBe(true);
    expect(updated.state).toBeTruthy();
  });

  test("master go-live route validates JSON error handling without forcing live", async ({ request }) => {
    const result = await expectJsonRoute(request, "/api/owner/broadcast/master-go-live", {
      method: "POST",
      body: {
        mode: "rtmp_encoder",
        confirm: false,
        masterOverride: true,
      },
      allowedStatuses: [400],
    });

    expect(result.error).toBeTruthy();
  });
});
