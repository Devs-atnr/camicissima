import { Page } from "@playwright/test";

export async function handleInitialPopups(page: Page) {
  await page.waitForTimeout(800);

  const selectors = [
    // Cookie / consent
    'button:has-text("Accept")',
    'button:has-text("Accept all")',

    // Close buttons
    'button[aria-label="Close"]',
    'button:has-text("Close")',
    '.modal__close',
    '.popup__close',
    '.klaviyo-close-form',

    // Generic X
    'button:has-text("×")',
    'button:has-text("✕")',
  ];

  for (const selector of selectors) {
    const el = page.locator(selector).first();
    if (await el.count()) {
      try {
        await el.click({ timeout: 1000 });
        await page.waitForTimeout(300);
      } catch {}
    }
  }

  // Unlock scroll if modal locked it
  await page.evaluate(() => {
    document.body.style.overflow = "auto";
  });
}
