import { test, expect } from "@playwright/test";
import { LOCALES, withLocale } from "./_helpers/locale";
import { PAGES_TO_CHECK } from "./_helpers/pages";

function isInternal(href: string, base: string) {
  try {
    const u = new URL(href, base);
    const b = new URL(base);
    return u.host === b.host;
  } catch {
    return false;
  }
}

test.describe("Broken links + locale consistency", () => {
  for (const locale of LOCALES) {
    for (const p of PAGES_TO_CHECK) {
      test(`[${locale.name}] ${p.name} links ok + keep locale`, async ({ page }) => {
        const urlPath = withLocale(locale.prefix, p.path);
        await page.goto(urlPath, { waitUntil: "domcontentloaded" });

        const base = page.url();
        const links = page.locator("a[href]");
        const total = await links.count();
        const limit = Math.min(total, 50);

        for (let i = 0; i < limit; i++) {
          const href = await links.nth(i).getAttribute("href");
          if (!href) continue;
          if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;

          // Convert to absolute
          const abs = href.startsWith("http") ? href : new URL(href, base).toString();

          // Only validate internal links (external can be blocked/slow)
          if (!isInternal(abs, base)) continue;

          const res = await page.request.get(abs);
          expect(res.status(), `Broken: ${abs}`).toBeLessThan(400);

          // Locale rule: on Arabic pages, internal links should generally keep /ar
          if (locale.name === "ar") {
            const u = new URL(abs);
            const path = u.pathname;

            // Skip files/assets and Shopify checkout/cart edge paths
            if (path.includes("/cdn/") || path.includes("/checkout")) continue;

            // If your Arabic prefix is /ar, enforce it for internal navigational links
            // (If you have exceptions, tell me and I’ll add an allowlist)
            expect(
              path.startsWith("/ar") || path === "/" || path.startsWith("/cart"),
              `Locale dropped (expected /ar): ${abs}`
            ).toBeTruthy();
          }
        }
      });
    }
  }
});
