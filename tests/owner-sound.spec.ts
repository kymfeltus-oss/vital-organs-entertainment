import { expect, test } from "@playwright/test";

test.describe("Owner sound control", () => {
  test("renders the dedicated operational sound surface", async ({ page }) => {
    await page.goto("/owner/sound");

    await expect(page.getByTestId("sound-control-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sound Control & Monitor" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to production cockpit" })).toHaveAttribute(
      "href",
      "/owner/cockpit",
    );
    await expect(page.getByText("X32 Live Bus Matrix (5 CH)")).toBeVisible();
    await expect(page.getByTestId("sound-bus-matrix").locator("article")).toHaveCount(5);
    await expect(page.getByText("Edge Audio Remains Authoritative")).toBeVisible();
  });

  test("fits the mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/owner/sound");

    await expect(page.getByTestId("sound-control-page")).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  });
});
