import { test, expect } from "@playwright/test";
import { LOCALES, withLocale } from "./_helpers/locale";
import { PAGES_TO_CHECK } from "./_helpers/pages";
import { gotoPage } from "./_helpers/shopify";

test.describe("Core page health (EN + AR)", () => {
  for (const locale of LOCALES) {
    for (const p of PAGES_TO_CHECK) {
      test(`[${locale.name}] ${p.name} loads cleanly`, async ({ page }) => {
        const urlPath = withLocale(locale.prefix, p.path);
        await gotoPage(page, urlPath);

        await expect(page.locator("body")).toBeVisible();
        expect((await page.locator("body").innerText()).length).toBeGreaterThan(50);

        if (locale.name === "ar") {
          const dir = await page.locator("html").getAttribute("dir");
          expect(dir === "rtl" || dir === null).toBeTruthy();
        }
      });
    }
  }
});
