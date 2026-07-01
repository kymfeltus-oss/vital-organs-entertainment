import { test, expect } from "@playwright/test";
import {
  assertNoBlockedConsoleErrors,
  attachConsoleGuard,
  expectLiveEntrySurface,
} from "./helpers/e2e-api";

test.describe("Attendee Live Stream Room - Stability & Sanity Checks", () => {
  test("loads /live without runtime crashes and reports holding room or live player state", async ({
    page,
    request,
  }) => {
    const consoleErrors = attachConsoleGuard(page);

    await page.goto("/live");
    await expect(page).toHaveURL(/\/live/, { timeout: 10_000 });

    await expectLiveEntrySurface(page, request);

    assertNoBlockedConsoleErrors(consoleErrors, "Attendee /live");
  });
});
