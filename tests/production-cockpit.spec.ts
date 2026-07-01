import { test, expect } from "@playwright/test";
import {
  attachConsoleGuard,
  expectJsonRoute,
  formatLocalDateTimeInput,
  tryEndBroadcast,
} from "./helpers/e2e-api";

test.describe("Production Cockpit - Countdown & Go Live Flow", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (error) => console.error("❌ CLIENT CRASH:", error.message));

    await page.goto("/owner/cockpit");
    await expect(page).toHaveURL(/\/owner\/cockpit/, { timeout: 15_000 });
  });

  test("cockpit loads with countdown editor and stream health status", async ({ page }) => {
    await expect(page.getByTestId("go-live-button")).toBeEnabled({ timeout: 20_000 });
    await expect(page.getByTestId("countdown-editor")).toBeVisible();
    await expect(page.getByTestId("stream-health-status")).toContainText(/.+/, {
      timeout: 20_000,
    });
  });

  test("countdown datetime and timezone save and persist after reload", async ({ page, request }) => {
    await expect(page.getByTestId("go-live-button")).toBeEnabled({ timeout: 20_000 });

    const target = new Date(Date.now() + 12 * 60_000);
    const localValue = formatLocalDateTimeInput(target);

    await page.getByRole("button", { name: /edit schedule/i }).click();
    await expect(page.getByTestId("countdown-editor")).toBeVisible({ timeout: 10_000 });

    await page.getByTestId("schedule-timezone").selectOption({ index: 1 });
    await page.getByTestId("schedule-datetime").fill(localValue);
    await page.getByTestId("save-countdown").click();
    await expect(page.getByTestId("success-badge")).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(page).toHaveURL(/\/owner\/cockpit/, { timeout: 15_000 });

    const showSetup = await expectJsonRoute(request, "/api/owner/show-setup");
    expect(showSetup.state).toBeTruthy();

    await page.getByRole("button", { name: /edit schedule/i }).click();
    await expect(page.getByTestId("schedule-datetime")).toHaveValue(localValue);
  });

  test("Go Live opens modal, confirms API, and updates countdown state", async ({ page, request }) => {
    await tryEndBroadcast(request);
    await page.reload();
    await expect(page).toHaveURL(/\/owner\/cockpit/, { timeout: 15_000 });

    const goLiveButton = page.getByTestId("go-live-button");
    await expect(goLiveButton).toBeEnabled({ timeout: 20_000 });

    const masterGoLivePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/owner/broadcast/master-go-live") &&
        response.status() === 200,
    );

    await goLiveButton.click();
    await expect(page.getByTestId("override-modal")).toBeVisible();

    await page
      .getByTestId("override-modal")
      .locator('button:has-text("Confirm Go Live")')
      .click();

    await masterGoLivePromise;

    await expect(page.getByTestId("countdown-timer")).toHaveText(/^00:00:00:\d{2}$/);
  });
});
