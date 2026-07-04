import { expect, test } from "@playwright/test";
import { expectJsonRoute } from "./helpers/e2e-api";

test.describe("Owner sound control API", () => {
  test("returns fail-closed preset status without exposing edge configuration", async ({ request }) => {
    const response = await expectJsonRoute(request, "/api/owner/audio/mix-state");
    const telemetry = response.telemetry as { buses?: unknown[]; console?: unknown };

    expect(response.ok).toBe(true);
    expect(telemetry).toBeTruthy();
    expect(telemetry.buses).toHaveLength(5);
    expect(telemetry.console).toBeTruthy();
    expect(response.presets).toHaveLength(3);
    expect(response.operatorEmail).toBeTruthy();
    expect(JSON.stringify(response)).not.toContain("AUDIO_SERVICE_TOKEN");
    expect(JSON.stringify(response)).not.toContain("sceneIndex");
  });

  test("rejects unknown preset commands before contacting the edge service", async ({ request }) => {
    const response = await expectJsonRoute(request, "/api/owner/audio/mix-state", {
      method: "POST",
      body: { command: "apply_preset", presetId: "untrusted_scene" },
      allowedStatuses: [400],
    });

    expect(response.error).toBe("Invalid audio preset command.");
  });

  test("rejects unknown bus controls before contacting the edge service", async ({ request }) => {
    const response = await expectJsonRoute(request, "/api/owner/audio/mix-state", {
      method: "POST",
      body: { command: "set_bus_mute", busKey: "untrusted_bus", muted: true },
      allowedStatuses: [400],
    });

    expect(response.error).toBe("Invalid audio bus mute command.");
  });
});
