import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { enterLab } from "./start-lab";

test("startup verifies real render and compute bytes and waits for Proceed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#boot-screen")).toHaveAttribute("data-status", "passed", { timeout: 120000 });
  await expect(page.locator("#app")).toHaveAttribute("inert", "");
  await expect(page.locator("#boot-environment")).toContainText("compute 42 (expected 42)");
  await expect(page.locator("#boot-preview")).toBeVisible();
  const frame = await page.locator("#canvas").getAttribute("data-frame");
  await page.waitForTimeout(1200);
  expect(await page.locator("#canvas").getAttribute("data-frame")).toBe(frame);
  await expect(page.locator("#quality")).toHaveValue("0");
  const address = page.url();
  await page.keyboard.press("ArrowRight");
  expect(page.url()).toBe(address);
  await expect(page.locator("#effect-title")).toHaveText("Soft shadows");
  await page.locator("#boot-proceed").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#boot-screen")).toBeHidden();
  await page.waitForFunction(
    (before) => Number(document.querySelector("#canvas")?.getAttribute("data-frame")) > Number(before) + 2,
    frame,
  );
  await page.locator("#open-diagnostics").click();
  await expect(page.locator("#boot-screen")).toBeVisible();
  const stopped = await page.locator("#canvas").getAttribute("data-frame");
  await page.waitForTimeout(1000);
  expect(await page.locator("#canvas").getAttribute("data-frame")).toBe(stopped);
  await enterLab(page);
});

test("missing WebGPU leaves a screenshot-ready report and permits reading the lab", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => Object.defineProperty(navigator, "gpu", { value: undefined }));
  await page.goto("/");
  await expect(page.locator("#boot-screen")).toHaveAttribute("data-status", "failed");
  await expect(page.locator("#boot-summary")).toContainText("WebGPU is unavailable");
  await expect(page.locator("#boot-environment")).toContainText("Browser:");
  await expect(page.locator("#boot-proceed")).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: ".cache/boot-review/unavailable-webgpu.png", fullPage: true });
  const pending = page.waitForEvent("download");
  await page.locator("#boot-download").click();
  const download = await pending;
  const report = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(report.status).toBe("failed");
  expect(report.environment.Build).toBeTruthy();
  expect(report.steps).toContainEqual(expect.objectContaining({ id: "webgpu-api", status: "failed" }));
  await page.locator("#boot-proceed").click();
  await expect(page.locator("#render-error")).toBeVisible();
  await expect(page.locator("#effect-title")).toHaveText("Soft shadows");
});

test("blocked application assets leave diagnostics available without loading the lab", async ({ page }) => {
  await page.route(/\/src\/main\.ts(?:\?|$)/, (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("#boot-screen")).toHaveAttribute("data-status", "failed");
  await expect(page.locator("#boot-steps")).toContainText("FAILED — Application assets");
  await expect(page.locator("#boot-proceed")).toBeDisabled();
  await expect(page.locator("#boot-download")).toBeEnabled();
  await expect(page.locator("#boot-environment")).toContainText("Browser:");
});

test("a missing adapter reports the exact failed stage", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.gpu, "requestAdapter", { value: async () => null });
  });
  await page.goto("/");
  await expect(page.locator("#boot-screen")).toHaveAttribute("data-status", "failed");
  await expect(page.locator("#boot-summary")).toContainText("did not provide a WebGPU adapter");
  await expect(page.locator("#boot-steps")).toContainText("FAILED — WebGPU adapter request");
});

test("a stalled adapter request times out instead of leaving a spinner", async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    Object.defineProperty(navigator.gpu, "requestAdapter", { value: () => new Promise(() => {}) });
  });
  await page.goto("/");
  await expect(page.locator("#boot-steps")).toContainText("RUNNING — WebGPU adapter request");
  await page.clock.fastForward(31000);
  await expect(page.locator("#boot-screen")).toHaveAttribute("data-status", "failed");
  await expect(page.locator("#boot-summary")).toContainText("WebGPU adapter request timed out");
});

test("startup compilation stalls produce an exact pipeline failure", async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const create = GPUDevice.prototype.createRenderPipelineAsync;
    GPUDevice.prototype.createRenderPipelineAsync = function (descriptor) {
      if (descriptor.label === "scene:0") return new Promise(() => {});
      return create.call(this, descriptor);
    };
  });
  await page.goto("/");
  await expect(page.locator("#boot-steps")).toContainText("RUNNING — Effect 1: scene pipeline", {
    timeout: 120000,
  });
  await page.clock.fastForward(31000);
  await expect(page.locator("#boot-screen")).toHaveAttribute("data-status", "failed");
  await expect(page.locator("#boot-summary")).toContainText("Effect 1: scene pipeline timed out");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "error");
});

test("startup GPU queue stalls are stopped and reported", async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    GPUQueue.prototype.onSubmittedWorkDone = () => new Promise(() => {});
  });
  await page.goto("/");
  await expect(page.locator("#boot-steps")).toContainText("RUNNING — Selected demo: render", {
    timeout: 120000,
  });
  await page.clock.fastForward(31000);
  await expect(page.locator("#boot-screen")).toHaveAttribute("data-status", "failed");
  await expect(page.locator("#boot-summary")).toContainText("timed out");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "error");
});

test("a runtime GPU queue stall reopens diagnostics with the current demo", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await enterLab(page);
  await page.evaluate(() => {
    GPUQueue.prototype.onSubmittedWorkDone = () => new Promise(() => {});
  });
  await page.clock.fastForward(1000);
  await page.clock.fastForward(31000);
  await expect(page.locator("#boot-screen")).toHaveAttribute("data-status", "failed");
  await expect(page.locator("#boot-summary")).toContainText("GPU frame completion");
  await expect(page.locator("#boot-environment")).toContainText("Demo at failure: soft-shadows");
  await page.screenshot({ path: ".cache/boot-review/runtime-gpu-stall.png", fullPage: true });
});

test("rapid demo switches serialize compilation and render the latest selection", async ({ page }) => {
  await page.addInitScript(() => {
    const create = GPUDevice.prototype.createRenderPipelineAsync;
    const counters = { active: 0, max: 0, effects: [] as string[] };
    Object.assign(window, { compilationCounters: counters });
    GPUDevice.prototype.createRenderPipelineAsync = async function (descriptor) {
      if (!/^(scene|post|post-hdr):/.test(descriptor.label ?? "")) return create.call(this, descriptor);
      counters.active++;
      counters.max = Math.max(counters.max, counters.active);
      counters.effects.push(descriptor.label!);
      try {
        if (descriptor.label === "scene:10") await new Promise((resolve) => setTimeout(resolve, 1500));
        return await create.call(this, descriptor);
      } finally {
        counters.active--;
      }
    };
  });
  await page.goto("/");
  await enterLab(page);
  await page.locator('button[data-effect="water"]').click();
  await expect(page.locator("#render-progress")).toBeVisible();
  await expect(page.locator("#render-progress")).toContainText("Preparing Water");
  await page.locator("#help").click();
  await expect(page.locator("#help-dialog")).toBeVisible();
  await page.locator("#close-help").click();
  await page.evaluate(() => {
    for (const button of [...document.querySelectorAll<HTMLButtonElement>("button[data-effect]")].slice(
      3,
      20,
    ))
      button.click();
    document.querySelector<HTMLButtonElement>('button[data-effect="bloom"]')!.click();
  });
  await expect(page.locator("#effect-title")).toHaveText("Bloom & glow");
  await expect(page.locator("#render-progress")).toBeHidden({ timeout: 60000 });
  await page.waitForFunction(() => window.lab.stats().compilingEffect === null);
  const counters = await page.evaluate(
    () =>
      (window as unknown as { compilationCounters: { max: number; effects: string[] } }).compilationCounters,
  );
  expect(counters.max).toBe(1);
  expect(new Set(counters.effects.map((label) => label.split(":")[1])).size).toBeLessThanOrEqual(3);
  const image = await page.evaluate(() => window.lab.readPixels());
  expect(image.width).toBeGreaterThan(100);
  await expect(page.locator("#boot-screen")).toBeHidden();
});

test("device allocation failures retain the request-device stage", async ({ page }) => {
  await page.addInitScript(() => {
    GPUAdapter.prototype.requestDevice = () =>
      Promise.reject(new Error("Simulated device allocation failure"));
  });
  await page.goto("/");
  await expect(page.locator("#boot-screen")).toHaveAttribute("data-status", "failed");
  await expect(page.locator("#boot-summary")).toContainText("Simulated device allocation failure");
  await expect(page.locator("#boot-steps")).toContainText("FAILED — WebGPU device request");
});

test("a runtime demo compilation stall identifies the requested demo", async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const create = GPUDevice.prototype.createRenderPipelineAsync;
    GPUDevice.prototype.createRenderPipelineAsync = function (descriptor) {
      if (descriptor.label === "scene:10") return new Promise(() => {});
      return create.call(this, descriptor);
    };
  });
  await page.goto("/");
  await enterLab(page);
  await page.locator('button[data-effect="water"]').click();
  await page.clock.fastForward(1000);
  await expect(page.locator("#boot-steps")).toContainText("RUNNING — Effect 11: scene pipeline");
  await page.clock.fastForward(31000);
  await expect(page.locator("#boot-screen")).toHaveAttribute("data-status", "failed");
  await expect(page.locator("#boot-summary")).toContainText("Effect 11: scene pipeline timed out");
  await expect(page.locator("#boot-environment")).toContainText("Demo at failure: water");
});
