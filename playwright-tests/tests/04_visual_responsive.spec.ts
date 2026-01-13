import { test, expect } from "@playwright/test";
import { LOCALES, withLocale } from "./_helpers/locale";
import { PAGES_TO_CHECK } from "./_helpers/pages";

test.describe("Visual snapshots (responsive)", () => {
  for (const locale of LOCALES) {
    for (const p of PAGES_TO_CHECK) {
      test(`[${locale.name}] ${p.name} snapshot`, async ({ page }) => {
        const urlPath = withLocale(locale.prefix, p.path);
        await page.goto(urlPath, { waitUntil: "networkidle" });

        await expect(page).toHaveScreenshot(`${locale.name}-${p.name}.png`, {
          fullPage: true,
        });
      });
    }
  }
});
