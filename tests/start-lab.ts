import { expect, type Page } from "@playwright/test";

export async function enterLab(page: Page) {
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true", { timeout: 120000 });
  if ((await page.locator("#boot-screen").getAttribute("data-status")) === "lab") return;
  await expect(page.locator("#boot-screen")).toHaveAttribute("data-status", "passed", { timeout: 120000 });
  await page.locator("#boot-proceed").click();
  await expect(page.locator("#boot-screen")).toBeHidden();
}
