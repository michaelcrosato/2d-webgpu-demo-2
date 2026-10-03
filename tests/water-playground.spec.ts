import { expect, type Page, test } from "@playwright/test";
import { advanceWater, createWaterBody } from "../src/water-playground";
import { enterLab } from "./start-lab";

async function water(page: Page) {
  return page.evaluate(() => window.lab.stats().water!);
}
async function frames(page: Page, count = 3) {
  const before = Number(await page.locator("#canvas").getAttribute("data-frame"));
  await page.waitForFunction(
    ({ before, count }) =>
      Number(document.querySelector<HTMLCanvasElement>("#canvas")!.dataset.frame) > before + count,
    { before, count },
    { timeout: 60000 },
  );
}
async function image(page: Page) {
  return page.evaluate(async () => {
    const { data } = await window.lab.readPixels();
    let hash = 2166136261;
    let min = 255;
    let max = 0;
    for (let i = 0; i < data.length; i += 64) {
      const light = (data[i] + data[i + 1] + data[i + 2]) / 3;
      min = Math.min(min, light);
      max = Math.max(max, light);
      hash = Math.imul(hash ^ data[i], 16777619) >>> 0;
    }
    return { hash, range: max - min };
  });
}
async function open(page: Page, backend: string, view = 1) {
  await page.goto(`${backend === "webgl2" ? "/webgl2.html" : "/"}#effect=water&scene=1&view=${view}`);
  await enterLab(page);
  await expect(page.locator("#engine")).toHaveText(`${backend.toUpperCase()} ACTIVE`);
}

test("water interactions preserve bounded waves, coasting, buoyancy and world limits", () => {
  for (const view of [1, 2, 3]) {
    const body = createWaterBody(view);
    for (let i = 0; i < 240; i++) advanceWater(body, view, 1 / 60, [1, 0]);
    expect(body.impulses).toHaveLength(8);
    expect(body.impulses.some((impulse) => impulse[3] > 0)).toBe(true);
    const position = body.position[0];
    advanceWater(body, view, 1 / 60, [0, 0]);
    if (view === 3) expect(body.position[0]).toBeGreaterThan(position);
    expect(body.position.every(Number.isFinite)).toBe(true);
    if (view !== 3) expect(Math.abs(body.position[0])).toBeLessThanOrEqual(view === 2 ? 0.72 : 0.94);
    const paused = structuredClone(body);
    advanceWater(body, view, 0, [1, 1]);
    expect(body).toEqual(paused);
  }
  const body = createWaterBody(3);
  for (let i = 0; i < 150; i++) advanceWater(body, 3, 1 / 60, [0, 1]);
  expect(body.impulses.some((impulse) => impulse[3] > 2)).toBe(true);
  for (let i = 0; i < 300; i++) advanceWater(body, 3, 1 / 60, [0, -1]);
  expect(body.position[1]).toBeGreaterThanOrEqual(-0.65);
});

test("all three water perspectives render, steer, create wakes, pause, and export pixels", async ({
  page,
}, testInfo) => {
  test.setTimeout(600000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (entry) => {
    if (entry.type() === "error") errors.push(entry.text());
  });
  await open(page, testInfo.project.name);
  const images = new Set<number>();
  for (const view of [1, 2, 3]) {
    await page.locator(`[data-water-view="${view}"]`).click();
    await expect(page.locator(`[data-water-view="${view}"]`)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#water-drive")).toBeVisible();
    await expect(page.locator(".scene-tabs")).toBeHidden();
    await frames(page);
    const before = await water(page);
    const initial = await image(page);
    expect(initial.range).toBeGreaterThan(25);
    images.add(initial.hash);
    await page.locator("#canvas").focus();
    await page.keyboard.down("ArrowRight");
    await expect
      .poll(async () => (await water(page)).position[0], { timeout: 60000 })
      .toBeGreaterThan(before.position[0] + 0.23);
    await page.keyboard.up("ArrowRight");
    expect((await water(page)).wakes).toBeGreaterThan(0);
    expect(page.url()).toContain("effect=water");
    await page.locator("#pause").click();
    await frames(page);
    const frozen = await water(page);
    const frozenImage = await image(page);
    await frames(page);
    expect(await water(page)).toEqual(frozen);
    expect((await image(page)).hash).toBe(frozenImage.hash);
    expect(frozenImage.hash).not.toBe(initial.hash);
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#capture").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(
      `2d-lab-water-${["", "top-down", "isometric", "side-scrolling"][view]}.png`,
    );
    await page.locator("#pause").click();
  }
  expect(images.size).toBe(3);
  await page.locator('[data-water-view="0"]').click();
  await expect(page.locator("#water-drive")).toBeHidden();
  await expect(page.locator("#water-presets")).toBeVisible();
  await expect(page.locator(".scene-tabs")).toBeVisible();
  await page.locator('button[data-effect="bloom"]').click();
  await frames(page);
  await expect(page.locator("#effect-title")).toHaveText("Bloom & glow");
  expect(errors).toEqual([]);
});

test("water dragging, diving, camera following, reset, saved links, and mobile steering work", async ({
  page,
}, testInfo) => {
  test.setTimeout(600000);
  await open(page, testInfo.project.name, 3);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.locator('[data-lesson="prompt"]').click();
  const prompt = await page.locator("#lesson-content blockquote").textContent();
  expect(prompt).toContain("side-scrolling 2d");
  expect(prompt).toContain("submarine");
  await page.locator("#copy-prompt").click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(prompt);
  await page.locator("#canvas").focus();
  await page.keyboard.down("d");
  await expect.poll(async () => (await water(page)).position[0], { timeout: 60000 }).toBeGreaterThan(0.45);
  await page.keyboard.up("d");
  expect((await water(page)).camera).toBeGreaterThan(0);
  await page.locator("#canvas").focus();
  await page.keyboard.down("s");
  await expect.poll(async () => (await water(page)).position[1], { timeout: 60000 }).toBeLessThan(-0.42);
  await page.keyboard.up("s");
  await page.keyboard.down("w");
  await expect.poll(async () => (await water(page)).position[1], { timeout: 60000 }).toBeGreaterThan(0.14);
  await page.keyboard.up("w");
  await page.locator("#water-object-reset").click();
  expect((await water(page)).position[0]).toBeCloseTo(-0.3, 2);
  expect((await water(page)).position[1]).toBeCloseTo(-0.2, 2);
  await page.locator('[data-water-view="2"]').click();
  const bounds = (await page.locator("#canvas").boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * 0.45, bounds.y + bounds.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.65, bounds.y + bounds.height * 0.4, { steps: 6 });
  await expect.poll(async () => (await water(page)).position[0], { timeout: 60000 }).toBeGreaterThan(0.05);
  await page.mouse.up();
  await page.locator("#share").click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("view=2");
  const address = await page.evaluate(() => navigator.clipboard.readText());
  expect(address).toContain("view=2");
  expect(address).toContain("object=");
  const position = new URLSearchParams(new URL(address).hash.slice(1)).get("object")!.split(",").map(Number);
  await page.goto(address);
  await page.reload();
  await enterLab(page);
  expect((await water(page)).view).toBe(2);
  expect((await water(page)).position[0]).toBeCloseTo(position[0], 2);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-water-view="1"]').click();
  await expect(page.locator("#water-drive")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const button = page.locator('[data-water-direction="right"]');
  await button.scrollIntoViewIfNeeded();
  const rect = (await button.boundingBox())!;
  const before = (await water(page)).position[0];
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await expect
    .poll(async () => (await water(page)).position[0], { timeout: 60000 })
    .toBeGreaterThan(before + 0.18);
  await page.mouse.up();
  expect((await water(page)).wakes).toBeGreaterThan(0);
  expect((await water(page)).wakes).toBeLessThanOrEqual(8);
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  const touchBefore = (await water(page)).position[0];
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }],
  });
  await expect
    .poll(async () => (await water(page)).position[0], { timeout: 60000 })
    .toBeGreaterThan(touchBefore + 0.18);
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
});
