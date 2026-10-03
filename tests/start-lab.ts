import { expect, type Page } from "@playwright/test";

export async function enterLab(page: Page) {
  if (await page.locator("#boot-screen").isHidden()) return;
  await expect(page.locator("#boot-screen")).toHaveAttribute("data-status", "passed", { timeout: 120000 });
  await page.locator("#boot-proceed").click();
  await expect(page.locator("#boot-screen")).toBeHidden();
}
