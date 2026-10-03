import { readFile } from "node:fs/promises";
import { expect, type Page, test } from "@playwright/test";
import { effects } from "../src/catalog";
import type { LabDiagnostics } from "../src/diagnostics";
import { computeEffects } from "../src/webgpu/catalog";

async function ready(page: Page) {
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true", { timeout: 30000 });
  await expect(page.locator("#engine")).toHaveText("WEBGPU ACTIVE");
}
async function settle(page: Page, frames = 2) {
  const before = Number(await page.locator("canvas").getAttribute("data-frame"));
  await page.waitForFunction(
    ({ before, frames }) =>
      Number(document.querySelector<HTMLCanvasElement>("canvas")?.dataset.frame) > before + frames,
    { before, frames },
  );
}
async function pixels(page: Page) {
  return page.evaluate(async () => {
    const { data, width, height } = await (window.lab as LabDiagnostics).readPixels();
    let min = 255,
      max = 0,
      hash = 2166136261;
    for (let i = 0; i < data.length; i += 64) {
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      min = Math.min(min, lum);
      max = Math.max(max, lum);
      hash = Math.imul(hash ^ data[i], 16777619) >>> 0;
    }
    return { range: max - min, hash, width, height, backend: window.lab.backend };
  });
}

test("all 48 native WebGPU techniques render all 144 contexts without validation errors", async ({
  page,
}) => {
  test.setTimeout(600000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error" || /GPUValidationError|invalid command|Error while validating/.test(e.text()))
      errors.push(e.text());
  });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl" || type === "webgl2")
        throw new Error("WebGPU edition must never fall back to WebGL");
      return getContext.apply(this, [type, ...args] as Parameters<typeof getContext>);
    } as typeof getContext;
  });
  await page.goto("/");
  await ready(page);
  await page.selectOption("#quality", "0");
  const hashes = new Set<number>();
  for (const effect of [...effects, ...computeEffects]) {
    await page.locator(`button[data-effect="${effect.id}"]`).click();
    for (let context = 0; context < 3; context++) {
      await page.locator(`#tab-${context}`).click();
      if (["ripples", "shockwave", "wave-grid"].includes(effect.id))
        await page.locator("canvas").click({ position: { x: 160, y: 100 } });
      await settle(page);
      const image = await pixels(page);
      expect(image.backend).toBe("webgpu");
      expect(image.range, `${effect.id} context ${context} must draw a real image`).toBeGreaterThan(12);
      hashes.add(image.hash);
      await expect(page.locator("#render-error")).toBeHidden();
    }
  }
  expect(hashes.size).toBeGreaterThan(130);
  expect(errors).toEqual([]);
});

test("compute kernels update state, control populations, and freeze when paused", async ({ page }) => {
  test.setTimeout(180000);
  await page.goto("/");
  await ready(page);
  for (const id of [
    "particles",
    "reaction-diffusion",
    "wave-grid",
    "ink-advection",
    "flocking",
    "compute-collisions",
    "cellular-automata",
  ]) {
    await page.locator(`button[data-effect="${id}"]`).click();
    await settle(page, 4);
    const before = await pixels(page);
    await settle(page, 10);
    const after = await pixels(page);
    expect(after.hash, `${id} must evolve`).not.toBe(before.hash);
    await page.locator("#pause").click();
    await settle(page);
    const frozen = await pixels(page);
    await settle(page);
    expect((await pixels(page)).hash, `${id} must pause`).toBe(frozen.hash);
    await page.locator("#pause").click();
  }
  await page.locator('button[data-effect="flocking"]').click();
  await page.locator("#parameter-0").fill("10");
  await settle(page);
  expect(await page.evaluate(() => window.lab.stats().instances)).toBe(1270);
  await page.locator('button[data-effect="compute-bloom"]').click();
  await settle(page);
  expect(await page.evaluate(() => window.lab.stats().computePasses)).toBe(2);
  await page.locator('button[data-effect="jump-flood"]').click();
  await settle(page);
  expect(await page.evaluate(() => window.lab.stats().computePasses)).toBe(9);
});

test("native sliders, art composition, comparisons, links, and real PNG readback work", async ({
  page,
  context,
}) => {
  test.setTimeout(180000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await ready(page);
  await page.locator("#pause").click();
  for (const id of [
    "soft-shadows",
    "bloom",
    "water",
    "dissolve",
    "normal-lighting",
    "ink",
    "compute-bloom",
    "reaction-diffusion",
    "cellular-automata",
    "jump-flood",
  ]) {
    await page.locator(`button[data-effect="${id}"]`).click();
    await page.locator("#parameter-0").fill("10");
    await settle(page);
    const low = await pixels(page);
    await page.locator("#parameter-0").fill("90");
    await settle(page);
    expect((await pixels(page)).hash, id).not.toBe(low.hash);
  }
  await page.locator('button[data-effect="dissolve"]').click();
  await page.locator("#parameter-0").fill("100");
  await page.selectOption("#art-style", "1");
  await settle(page);
  expect((await pixels(page)).range).toBeLessThan(3);
  await page.locator('button[data-effect="water"]').click();
  await page.locator("#tab-1").click();
  const styleHashes = new Set<number>();
  for (let style = 0; style < 10; style++) {
    await page.selectOption("#art-style", String(style));
    await settle(page);
    styleHashes.add((await pixels(page)).hash);
  }
  expect(styleHashes.size).toBe(10);
  await page.locator("#compare").click();
  await settle(page);
  await expect(page.locator("#compare-divider")).toBeVisible();
  await page.locator("#parameter-1").fill("77");
  await page.locator("#share").click();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  expect(shared).toContain("effect=water");
  await page.goto(shared);
  await ready(page);
  await expect(page.locator("#parameter-1")).toHaveValue("77");
  await expect(page.locator("#art-style")).toHaveValue("9");
  const promise = page.waitForEvent("download");
  await page.locator("#capture").click();
  const download = await promise;
  const file = await readFile((await download.path())!);
  expect([...file.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(file.length).toBeGreaterThan(2000);
  await page.locator('[data-lesson="technique"]').click();
  await expect(page.locator("#lesson-content")).toContainText(
    "WebGPU uses explicit render and compute pipelines",
  );
});

test("mobile, device recovery, unavailable WebGPU, and the independent WebGL2 edition", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await ready(page);
  await expect(page.locator("#pause")).toHaveAttribute("aria-label", "Play animation");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#menu").click();
  await page.locator('button[data-effect="wave-grid"]').click();
  await settle(page);
  expect((await pixels(page)).range).toBeGreaterThan(12);
  await page.evaluate(() => window.lab.loseDevice());
  await page.waitForTimeout(100);
  await ready(page);
  await settle(page);
  expect((await pixels(page)).backend).toBe("webgpu");
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "gpu", { value: undefined, configurable: true }),
  );
  await page.reload();
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "error");
  await expect(page.locator("#render-error")).toContainText("WebGPU is unavailable");
  await page.locator(".edition-link").click();
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#engine")).toHaveText("WEBGL2 ACTIVE");
  expect(await page.locator("button[data-effect]").count()).toBe(40);
});

test("WebGPU quality, fullscreen, and counterpart settings survive transitions", async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await page.goto("/#effect=compute-bloom");
  await ready(page);
  await page.selectOption("#quality", "0");
  await settle(page);
  expect((await pixels(page)).width).toBe(800);
  await page.selectOption("#quality", "2");
  await settle(page);
  expect((await pixels(page)).width).toBeGreaterThan(800);
  await page.locator("#fullscreen").click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe("stage");
  await settle(page);
  expect((await pixels(page)).range).toBeGreaterThan(12);
  await page.locator("#fullscreen").click();
  await page.locator('button[data-effect="water"]').click();
  await page.locator("#tab-1").click();
  await page.locator("#parameter-1").fill("77");
  await page.selectOption("#art-style", "2");
  await page.locator(".edition-link").click();
  await expect(page.locator("#engine")).toHaveText("WEBGL2 ACTIVE");
  await expect(page.locator("h1")).toHaveText("Water & refraction");
  await expect(page.locator("#parameter-1")).toHaveValue("77");
  await expect(page.locator("#art-style")).toHaveValue("2");
  await page.locator(".edition-link").click();
  await ready(page);
  await expect(page.locator("h1")).toHaveText("Water & refraction");
  await expect(page.locator("#parameter-1")).toHaveValue("77");
});
