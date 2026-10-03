import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 120000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1280, height: 1000 },
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "webgl2",
      testMatch: "lab.spec.ts",
      use: {
        launchOptions: {
          executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
          args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
        },
      },
    },
    {
      name: "webgpu",
      testMatch: "webgpu.spec.ts",
      use: {
        launchOptions: {
          headless: true,
          channel: "chromium",
          executablePath: process.env.CHROME_PATH || (process.env.CI ? undefined : "/usr/bin/google-chrome"),
          args: [
            "--disable-gpu-watchdog",
            "--enable-gpu",
            "--enable-unsafe-webgpu",
            "--enable-unsafe-swiftshader",
            "--ignore-gpu-blocklist",
            "--enable-features=Vulkan",
            "--use-angle=swiftshader",
            "--use-vulkan=swiftshader",
          ],
        },
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
