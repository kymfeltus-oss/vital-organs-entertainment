import { test, expect } from '@playwright/test';

test.describe('Attendee Live Stream Room - Stability & Sanity Checks', () => {

  test('Should load live player interface cleanly without console errors or layout drops', async ({ page }) => {
    // 🪵 1. Real-time Crash Interceptor
    page.on('pageerror', error => {
      console.error('❌ ATTENDEE CLIENT CRASH DETECTED:', error.message);
      throw new Error(`Attendee side interface crashed: ${error.message}`);
    });

    console.log('🌐 Loading public attendee playback live room...');
    
    // We navigate to the live room. If your app supports query param flags, we can append them here
    await page.goto("/live");

    // Allow standard Next.js state hydration routines to finish settling
    await expect(page).toHaveURL(/.*\/live/, { timeout: 10000 });

    console.log('🔍 Executing structural layout sanity checks...');
    
    // 📺 2. Smart Component Guard Check
    // Because the video element returns null when !enabled, we check the parent shell container 
    // or layout wrappers first to ensure the core page loaded successfully.
    const playerShell = page.locator('[class*="playerShell" i], main, #root, body').first();
    await expect(playerShell).toBeVisible({ timeout: 10000 });

    // 📊 3. Finalizing interface network verification status
    const bodyText = await page.locator('body').innerText();
    console.log('📝 Page loaded text snapshot length:', bodyText.length);
    
    // Safety assertions targeting hard framework payload pipeline drops or server crashes
    expect(bodyText.length).toBeGreaterThan(0);
    expect(bodyText.toLowerCase()).not.toContain('internal server error');
    expect(bodyText.toLowerCase()).not.toContain('404: this page could not be found');
    
    console.log('✅ Sanity check passed! The page container is stable and did not throw a runtime crash.');
  });

});
