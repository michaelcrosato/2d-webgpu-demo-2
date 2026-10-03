import { expect, type Page, test } from "@playwright/test";
import { effects } from "../src/catalog";

async function settle(page: Page) {
  const before = await page.locator("#canvas").getAttribute("data-frame");
  await page.waitForFunction(
    (n) => Number(document.querySelector<HTMLCanvasElement>("#canvas")?.dataset.frame) > Number(n) + 1,
    before,
  );
}

async function pixels(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
    const gl = canvas.getContext("webgl2")!;
    const buffer = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
    let min = 255,
      max = 0,
      sum = 0,
      hash = 2166136261;
    for (let i = 0; i < buffer.length; i += 64) {
      const brightness = (buffer[i] + buffer[i + 1] + buffer[i + 2]) / 3;
      min = Math.min(min, brightness);
      max = Math.max(max, brightness);
      sum += brightness;
      hash = Math.imul(hash ^ buffer[i], 16777619) >>> 0;
    }
    return {
      range: max - min,
      sum,
      hash,
      error: gl.getError(),
      width: canvas.width,
      height: canvas.height,
    };
  });
}

test("all 40 effects render all 120 contexts without GPU errors", async ({ page }) => {
  // Software WebGL on shared CI runners needs longer than a local graphics workstation.
  test.setTimeout(1800000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error" || /GL_INVALID|GL ERROR|Feedback loop|INVALID_OPERATION/.test(e.text()))
      errors.push(e.text());
  });
  await page.goto("/webgl2.html");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await page.selectOption("#quality", "0");
  const hashes = new Set<number>();
  for (const effect of effects) {
    await page.locator(`button[data-effect="${effect.id}"]`).click();
    await expect(page.locator("h1")).toHaveText(effect.name);
    for (let scene = 0; scene < 3; scene++) {
      await page.locator(`button[data-context="${scene}"]`).click();
      if (effect.id === "shockwave" || effect.id === "ripples")
        await page.locator("canvas").click({ position: { x: 170, y: 100 } });
      await settle(page);
      const sample = await pixels(page);
      expect(sample.error, `${effect.id}, scene ${scene}`).toBe(0);
      expect(sample.range, `${effect.id}, scene ${scene} should contain a visible image`).toBeGreaterThan(12);
      hashes.add(sample.hash);
      await expect(page.locator("#render-error")).toBeHidden();
    }
  }
  expect(hashes.size).toBeGreaterThan(110);
  expect(errors).toEqual([]);
});

test("sliders affect rendered pixels, comparison works, and styles combine", async ({ page }) => {
  test.setTimeout(600000);
  await page.goto("/webgl2.html");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await page.locator("#pause").click();
  for (const effect of effects.filter(
    (e) =>
      ![
        "particles",
        "trails",
        "flow-field",
        "weather",
        "instancing",
        "shockwave",
        "ripples",
        "parallax",
        "wind",
        "sprites",
      ].includes(e.id),
  )) {
    await page.locator(`button[data-effect="${effect.id}"]`).click();
    await page.locator("#parameter-0").fill(effect.id === "day-night" ? "25" : "0");
    await settle(page);
    const low = await pixels(page);
    await page.locator("#parameter-0").fill(effect.id === "day-night" ? "75" : "100");
    await settle(page);
    const high = await pixels(page);
    expect(high.hash, `${effect.id}: primary slider must change the image`).not.toBe(low.hash);
  }
  await page.locator('button[data-effect="bloom"]').click();
  await page.locator("#compare").click();
  await settle(page);
  await expect(page.locator("#compare-divider")).toBeVisible();
  await expect(page.locator("#compare")).toHaveAttribute("aria-pressed", "true");
  expect((await pixels(page)).error).toBe(0);
  await page.locator("#compare").click();
  const styleHashes = new Set<number>();
  for (let style = 0; style < 10; style++) {
    await page.selectOption("#art-style", String(style));
    await settle(page);
    const sample = await pixels(page);
    expect(sample.error).toBe(0);
    styleHashes.add(sample.hash);
  }
  expect(styleHashes.size).toBe(10);
  // A fully dissolved image must stay dissolved when pixel sampling is added.
  await page.locator('button[data-effect="dissolve"]').click();
  await page.locator("#parameter-0").fill("100");
  await page.selectOption("#art-style", "1");
  await settle(page);
  expect((await pixels(page)).range).toBeLessThan(3);
});

test("pause freezes motion, pointer lights change pixels, reset and links restore controls", async ({
  page,
}) => {
  await page.goto("/webgl2.html");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await page.locator("#pause").click();
  await settle(page);
  const still = await pixels(page);
  await settle(page);
  expect((await pixels(page)).hash).toBe(still.hash);
  const bounds = (await page.locator("canvas").boundingBox())!;
  await page.mouse.move(bounds.x + 60, bounds.y + 80);
  await settle(page);
  expect((await pixels(page)).hash).not.toBe(still.hash);
  await page.locator("#parameter-0").fill("87");
  await page.selectOption("#art-style", "4");
  await page.locator('button[data-context="2"]').click();
  const url = page.url();
  await page.reload();
  await expect(page.locator("#parameter-0")).toHaveValue("87");
  await expect(page.locator("#art-style")).toHaveValue("4");
  await expect(page.locator("#tab-2")).toHaveAttribute("aria-selected", "true");
  expect(page.url()).toBe(url);
  await page.locator("#reset").click();
  await expect(page.locator("#parameter-0")).toHaveValue("65");
  await expect(page.locator("#art-style")).toHaveValue("0");
  await page.locator("#search").fill("water");
  await expect(page.locator('button[data-effect="water"]')).toBeVisible();
  await expect(page.locator('button[data-effect="soft-shadows"]')).toHaveCount(0);
  await page.locator("#search").fill("nothingwillmatch");
  await expect(page.locator(".empty-search")).toBeVisible();
});

test("lessons, prompt copy, PNG capture, and keyboard navigation work", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/webgl2.html");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await page.locator('[data-lesson="technique"]').click();
  await expect(page.locator("#code-snippet")).toContainText("softShadow");
  await page.locator('[data-lesson="prompt"]').click();
  await page.locator("#copy-prompt").click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("lantern");
  await page.locator("#share").click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("#effect=soft-shadows");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#capture").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("2d-lab-soft-shadows-abstract.png");
  await page.locator("canvas").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("h1")).toHaveText("Normal-map lighting");
  await page.locator("#tab-0").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#tab-1")).toHaveAttribute("aria-selected", "true");
  await page.locator("#help").click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
});

test("mobile, reduced motion, unsupported GPU, and context restoration", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/webgl2.html");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#pause")).toHaveAttribute("aria-label", "Play animation");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator("#sidebar")).toHaveAttribute("inert", "");
  await page.locator("#menu").click();
  await page.locator("#close-library").click();
  await expect(page.locator("#sidebar")).toHaveAttribute("inert", "");
  await page.locator("#menu").click();
  await page.locator('button[data-effect="water"]').click();
  await expect(page.locator("h1")).toHaveText("Water & refraction");
  await expect(page.locator("#menu")).toHaveAttribute("aria-expanded", "false");
  await page.locator("#parameter-0").fill("85");
  await settle(page);
  expect((await pixels(page)).error).toBe(0);
  await page.evaluate(() => {
    const gl = document.querySelector<HTMLCanvasElement>("canvas")!.getContext("webgl2")!;
    const extension = gl.getExtension("WEBGL_lose_context");
    extension?.loseContext();
    setTimeout(() => extension?.restoreContext(), 200);
  });
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await settle(page);
  expect((await pixels(page)).error).toBe(0);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl2") return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.reload();
  await expect(page.locator("#render-error")).toContainText("WebGL2 is unavailable");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "error");
  await expect(page.locator("h1")).toHaveText("Water & refraction");
});

test("RGBA8 fallback, quality controls, fullscreen, and tour work", async ({ page }) => {
  await page.addInitScript(() => {
    const getExtension = WebGL2RenderingContext.prototype.getExtension;
    WebGL2RenderingContext.prototype.getExtension = function (name: string) {
      return name === "EXT_color_buffer_float" ? null : getExtension.call(this, name);
    };
  });
  await page.goto("/webgl2.html#effect=bloom");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#precision")).toHaveText("RGBA8 / LDR");
  await settle(page);
  expect((await pixels(page)).error).toBe(0);
  await page.setViewportSize({ width: 2200, height: 1300 });
  await page.selectOption("#quality", "0");
  await settle(page);
  expect((await pixels(page)).width).toBe(800);
  await page.selectOption("#quality", "2");
  await settle(page);
  expect((await pixels(page)).width).toBeGreaterThan(800);
  await page.locator("#fullscreen").click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe("stage");
  await settle(page);
  expect((await pixels(page)).error).toBe(0);
  await page.locator("#fullscreen").click();
  await page.clock.install();
  await page.locator("#tour").click();
  await page.clock.fastForward(10001);
  await expect(page.locator("h1")).toHaveText("Light shafts");
  await expect(page.locator("#tab-1")).toHaveAttribute("aria-selected", "true");
  await page.locator("#tour").click();
  await page.clock.fastForward(20000);
  await expect(page.locator("h1")).toHaveText("Light shafts");
});
