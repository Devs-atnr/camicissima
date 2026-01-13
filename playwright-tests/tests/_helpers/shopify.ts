import { Page } from "@playwright/test";
import { handleInitialPopups } from "./ui";

/**
 * Opens a page safely:
 * - navigates
 * - waits for DOM
 * - closes popups
 */
export async function gotoPage(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await handleInitialPopups(page);
}

/**
 * Shortcut for homepage
 */
export async function gotoHome(page: Page) {
  await gotoPage(page, "/");
}
