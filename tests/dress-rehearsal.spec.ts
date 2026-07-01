import { test, expect, type Browser } from "@playwright/test";
import {
  assertNoBlockedConsoleErrors,
  attachConsoleGuard,
  expectAttendeeStreamUiState,
  expectHoldingRoomSurface,
  expectJsonRoute,
  expectLivePlayerSurface,
  formatLocalDateTimeInput,
  tryEndBroadcast,
} from "./helpers/e2e-api";

async function openAttendeeLiveContext(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = attachConsoleGuard(page);
  await page.goto("/live");
  await expect(page).toHaveURL(/\/live/, { timeout: 15_000 });
  return { context, page, consoleErrors };
}

test.describe("Dress rehearsal - owner to attendee live readiness", () => {
  test("save countdown, go live from cockpit, and verify attendee live UI state", async ({
    browser,
    request,
  }) => {
    test.setTimeout(120_000);
    await tryEndBroadcast(request);

    const cockpitContext = await browser.newContext();
    const cockpit = await cockpitContext.newPage();
    const cockpitErrors = attachConsoleGuard(cockpit);

    await cockpit.goto("/owner/cockpit");
    await expect(cockpit).toHaveURL(/\/owner\/cockpit/, { timeout: 15_000 });
    await expect(cockpit.getByTestId("go-live-button")).toBeEnabled({ timeout: 20_000 });

    const target = new Date(Date.now() + 2 * 60_000);
    const localValue = formatLocalDateTimeInput(target);

    await cockpit.getByRole("button", { name: /edit schedule/i }).click();
    await cockpit.getByTestId("schedule-timezone").selectOption({ index: 1 });
    await cockpit.getByTestId("schedule-datetime").fill(localValue);
    await cockpit.getByTestId("save-countdown").click();
    await expect(cockpit.getByTestId("success-badge")).toBeVisible({ timeout: 15_000 });

    await cockpit.reload();
    await cockpit.getByRole("button", { name: /edit schedule/i }).click();
    await expect(cockpit.getByTestId("schedule-datetime")).toHaveValue(localValue);

    const { context: attendeeContext, page: attendee, consoleErrors: attendeeErrors } =
      await openAttendeeLiveContext(browser);

    await expectHoldingRoomSurface(attendee);

    const masterGoLivePromise = cockpit.waitForResponse(
      (response) =>
        response.url().includes("/api/owner/broadcast/master-go-live") &&
        response.status() === 200,
    );

    await cockpit.getByTestId("go-live-button").click();
    await cockpit.getByTestId("override-modal").locator('button:has-text("Confirm Go Live")').click();
    await masterGoLivePromise;

    await expect
      .poll(async () => {
        const access = await expectJsonRoute(request, "/api/access/live");
        return access.streamIsLive === true;
      }, { timeout: 20_000 })
      .toBe(true);

    await attendee.reload();
    await expectLivePlayerSurface(attendee);

    await expectAttendeeStreamUiState(attendee, request);

    assertNoBlockedConsoleErrors(cockpitErrors, "Cockpit dress rehearsal");
    assertNoBlockedConsoleErrors(attendeeErrors, "Attendee dress rehearsal");

    await attendeeContext.close();
    await cockpitContext.close();
  });
});
