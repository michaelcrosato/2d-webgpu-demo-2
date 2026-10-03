import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const revision = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
const dirty = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()
  ? " (working tree)"
  : "";
const build = `${revision}${dirty} / ${new Date().toISOString()}`;

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "independent-startup-diagnostics",
      transformIndexHtml: {
        order: "pre",
        handler(html) {
          const screen = readFileSync(new URL("./src/preboot.html", import.meta.url), "utf8");
          const script = readFileSync(new URL("./src/preboot.js", import.meta.url), "utf8").replace(
            "__BOOT_BUILD__",
            build,
          );
          return html.replace("<!-- boot-screen -->", `${screen}<script>${script}</script>`);
        },
      },
    },
  ],
  build: { rollupOptions: { input: ["index.html", "webgl2.html"] } },
});
