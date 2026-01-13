import { test, expect } from "@playwright/test";
import { LOCALES, withLocale } from "./_helpers/locale";

test.describe("Basic performance timing", () => {
  for (const locale of LOCALES) {
    test(`[${locale.name}] homepage timing`, async ({ page }) => {
      const urlPath = withLocale(locale.prefix, "/");
      await page.goto(urlPath, { waitUntil: "load" });

      const timing = await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        if (!nav) return null;
        return {
          ttfb: nav.responseStart - nav.requestStart,
          domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
          load: nav.loadEventEnd - nav.startTime,
        };
      });

      expect(timing, "No navigation timing found").not.toBeNull();

      // Adjust thresholds based on your site reality
      expect(timing!.ttfb).toBeLessThan(2500);
      expect(timing!.domContentLoaded).toBeLessThan(6000);
      expect(timing!.load).toBeLessThan(12000);
    });
  }
});
