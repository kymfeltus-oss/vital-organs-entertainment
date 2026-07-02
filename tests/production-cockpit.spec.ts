import { test, expect } from "@playwright/test";
import {
  attachConsoleGuard,
  expectJsonRoute,
  formatLocalDateTimeInput,
  tryEndBroadcast,
} from "./helpers/e2e-api";

test.describe("Production Cockpit - Broadcast Flow", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (error) => console.error("❌ CLIENT CRASH:", error.message));

    await page.goto("/owner/cockpit");
    await expect(page).toHaveURL(/\/owner\/cockpit/, { timeout: 15_000 });
  });

  test("cockpit loads with go live controls and stream health status", async ({ page }) => {
    await expect(page.getByTestId("go-live-button")).toBeEnabled({ timeout: 20_000 });
    await expect(page.getByTestId("stream-health-status")).toContainText(/.+/, {
      timeout: 20_000,
    });
  });

  test("countdown schedule saves on dedicated countdown page", async ({ page, request }) => {
    await page.goto("/owner/countdown");
    await expect(page).toHaveURL(/\/owner\/countdown/, { timeout: 15_000 });

    const target = new Date(Date.now() + 12 * 60_000);
    const localValue = formatLocalDateTimeInput(target);

    await page.locator('input[type="datetime-local"]').fill(localValue);
    await page.getByRole("button", { name: /save & publish/i }).click();
    await expect(page.getByText(/countdown schedule/i)).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(page).toHaveURL(/\/owner\/countdown/, { timeout: 15_000 });

    const showSetup = await expectJsonRoute(request, "/api/owner/show-setup");
    expect(showSetup.state).toBeTruthy();
    await expect(page.locator('input[type="datetime-local"]')).toHaveValue(localValue);
  });

  test("Go Live opens modal, confirms API, and updates broadcast state", async ({ page, request }) => {
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

    const broadcast = (await expectJsonRoute(request, "/api/owner/broadcast")) as {
      snapshot?: { publish?: { status?: string } };
    };
    expect(broadcast.snapshot?.publish?.status).toBeTruthy();
  });
});
