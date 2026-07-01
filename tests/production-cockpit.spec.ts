import { test, expect } from "@playwright/test";

test.describe("Production Cockpit - Countdown & Go Live Flow", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (error) => console.error("❌ CLIENT CRASH:", error.message));

    await page.goto("/owner/cockpit");
    await expect(page).toHaveURL(/\/owner\/cockpit/, { timeout: 15000 });
  });

  test("Task 1: Should successfully update countdown with date/time and timezone only", async ({
    page,
  }) => {
    await expect(page.getByTestId("go-live-button")).toBeEnabled({ timeout: 20_000 });

    await page.getByRole("button", { name: /edit schedule/i }).click();
    await expect(page.getByTestId("countdown-editor")).toBeVisible({ timeout: 10000 });

    await page.getByTestId("schedule-timezone").selectOption({ index: 1 });
    await page.getByTestId("schedule-datetime").fill("2026-12-31T20:00");

    await page.getByTestId("save-countdown").click();

    await expect(page.getByTestId("success-badge")).toBeVisible({ timeout: 15000 });
  });

  test("Task 2: Should execute master Go Live override, trigger modal, and update state immediately", async ({
    page,
    request,
  }) => {
    await request.post("/api/owner/broadcast/end");

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

    const confirmationModal = page.getByTestId("override-modal");
    await expect(confirmationModal).toBeVisible();

    await confirmationModal
      .locator('button:has-text("Confirm Go Live"), button:has-text("Confirm")')
      .first()
      .click();

    await masterGoLivePromise;

    const countdownDisplay = page.getByTestId("countdown-timer");
    await expect(countdownDisplay).toBeVisible();
    await expect(countdownDisplay).toHaveText(/^00:00:00:\d{2}$/);
  });
});
