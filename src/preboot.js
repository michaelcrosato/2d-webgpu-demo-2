// Inlined into the HTML so this report survives failed application modules or styles.
(() => {
  const screen = document.querySelector("#boot-screen");
  const summary = document.querySelector("#boot-summary");
  const proceed = document.querySelector("#boot-proceed");
  const start = performance.now();
  const environment = {
    Build: "__BOOT_BUILD__",
    URL: location.href,
    Browser: navigator.userAgent,
    Platform: navigator.platform,
    "Secure context": String(window.isSecureContext),
    WebGPU: navigator.gpu ? "available" : "unavailable",
    "CPU cores / DPR": `${navigator.hardwareConcurrency ?? "unknown"} / ${devicePixelRatio}`,
  };
  const steps = new Map();
  const events = [];
  let status = "running";
  let appReady = false;
  let onProceed;
  let onShow;
  let failure = "";
  let lastTick = performance.now();
  const elapsed = () => `${((performance.now() - start) / 1000).toFixed(1)}s`;
  const record = (message) => {
    events.push(`${elapsed()} ${message}`);
    if (events.length > 200) events.shift();
  };
  const report = () => ({
    status,
    failure,
    timestamp: new Date().toISOString(),
    elapsed: elapsed(),
    environment: { ...environment },
    steps: [...steps.values()],
    events: [...events],
    resources: performance.getEntriesByType("resource").map((entry) => ({
      name: entry.name,
      durationMs: Math.round(entry.duration),
      type: entry.initiatorType,
    })),
  });
  const render = () => {
    screen.dataset.status = status;
    document.querySelector("#boot-environment").textContent = Object.entries(environment)
      .filter(([key]) => key !== "Adapter features")
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
    document.querySelector("#boot-events").textContent = events.slice(-8).join("\n");
    const list = document.querySelector("#boot-steps");
    list.replaceChildren();
    for (const step of [...steps.values()].slice(-12)) {
      const li = document.createElement("li");
      li.dataset.status = step.status;
      li.textContent = `${step.status.toUpperCase()} — ${step.label}${step.detail ? `: ${step.detail}` : ""}`;
      list.append(li);
    }
    proceed.disabled = !appReady || !["passed", "failed"].includes(status);
    proceed.textContent = status === "failed" ? "Proceed without GPU rendering" : "Proceed to lab";
  };
  const show = () => {
    if (status === "lab") status = "passed";
    screen.hidden = false;
    document.querySelector("#app")?.setAttribute("inert", "");
    onShow?.();
    render();
  };
  const fail = (error) => {
    if (status === "failed") {
      record(`Additional error: ${error instanceof Error ? error.message : error}`);
      render();
      return;
    }
    failure = error instanceof Error ? error.stack || error.message : String(error);
    status = "failed";
    summary.textContent = `FAIL — ${error instanceof Error ? error.message : error}\nRendering stopped. Screenshot this report or save it before reloading.`;
    record(failure);
    show();
  };
  window.boot = {
    get status() {
      return status;
    },
    begin() {
      status = "running";
      failure = "";
      const assets = steps.get("assets");
      steps.clear();
      if (assets?.status === "passed") steps.set("assets", assets);
      delete environment["Renderer state"];
      delete environment["Demo at failure"];
      show();
    },
    step(id, label, state, detail = "") {
      if (status === "failed" && state !== "failed") return;
      steps.set(id, { id, label, status: state, detail, at: elapsed() });
      record(`${state.toUpperCase()} ${label}${detail ? `: ${detail}` : ""}`);
      if (status === "running" && state === "running") summary.textContent = `RUNNING — ${label}`;
      render();
    },
    detail(key, value) {
      environment[key] = String(value);
      render();
    },
    complete() {
      if (status === "failed") return;
      status = "passed";
      summary.textContent =
        "PASS — assets loaded, graphics initialized, and a real rendered frame verified. Press Proceed when you are ready.";
      record("Diagnostics complete; waiting for your button press.");
      render();
    },
    fail,
    show,
    report,
    record,
    onProceed(callback) {
      appReady = true;
      onProceed = callback;
      render();
    },
    onShow(callback) {
      onShow = callback;
    },
    preview({ data, width, height }) {
      const source = document.createElement("canvas");
      source.width = width;
      source.height = height;
      source.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0);
      const preview = document.querySelector("#boot-preview");
      preview.src = source.toDataURL("image/png");
      preview.hidden = false;
    },
  };
  proceed.addEventListener("click", () => {
    if (proceed.disabled) return;
    screen.hidden = true;
    document.querySelector("#app").removeAttribute("inert");
    if (status === "passed") status = "lab";
    onProceed?.();
  });
  document.querySelector("#boot-retry").addEventListener("click", () => location.reload());
  document.querySelector("#boot-download").addEventListener("click", () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report(), null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "2d-lab-diagnostics.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.querySelector("#boot-copy").addEventListener("click", async () => {
    const content = JSON.stringify(report(), null, 2);
    try {
      await navigator.clipboard.writeText(content);
      document.querySelector("#boot-copy").textContent = "Report copied";
    } catch {
      const area = document.createElement("textarea");
      area.value = content;
      screen.append(area);
      area.select();
      document.querySelector("#boot-copy").textContent = "Select and copy the report below";
    }
  });
  if (location.pathname.endsWith("webgl2.html")) {
    const link = document.querySelector("#boot-other");
    link.href = `./index.html${location.hash}`;
    link.textContent = "Open WebGPU diagnostics";
  } else document.querySelector("#boot-other").href += location.hash;
  window.addEventListener(
    "error",
    (event) => {
      if (event.error) fail(event.error);
      else if (event.target instanceof HTMLScriptElement || event.target instanceof HTMLLinkElement)
        fail(new Error(`Asset failed to load: ${event.target.src || event.target.href}`));
    },
    true,
  );
  window.addEventListener("unhandledrejection", (event) => fail(event.reason));
  document.addEventListener("visibilitychange", () => {
    lastTick = performance.now();
  });
  setInterval(() => {
    const now = performance.now();
    if (!document.hidden && now - lastTick > 3000)
      record(`Main thread was unresponsive for ${Math.round(now - lastTick)} ms.`);
    lastTick = now;
    document.querySelector("#boot-heartbeat").textContent =
      `Elapsed: ${elapsed()} · diagnostic heartbeat: ${new Date().toLocaleTimeString()} · ${document.hidden ? "tab hidden" : "tab visible"}`;
  }, 1000);
  setTimeout(() => {
    if (status === "running" && !appReady)
      fail(
        new Error(
          "Application entry script did not load within 30 seconds. Check blocked requests or a stale page cache.",
        ),
      );
  }, 30000);
  render();
})();
