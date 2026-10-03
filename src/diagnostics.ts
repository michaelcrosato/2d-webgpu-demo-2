export interface BootScreen {
  readonly status: "running" | "passed" | "failed" | "lab";
  begin(): void;
  step(id: string, label: string, status: "running" | "passed" | "failed" | "warning", detail?: string): void;
  detail(key: string, value: unknown): void;
  complete(): void;
  fail(error: unknown): void;
  show(): void;
  record(message: string): void;
  report(): Record<string, unknown>;
  onProceed(callback: () => void): void;
  onShow(callback: () => void): void;
  preview(pixels: { data: Uint8Array; width: number; height: number }): void;
}

export async function deadline<T>(work: PromiseLike<T>, label: string, timeoutMs = 30000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                `${label} timed out after ${timeoutMs / 1000}s. The browser or GPU did not complete this operation.`,
              ),
            ),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function diagnosticCheck<T>(
  id: string,
  label: string,
  work: () => T | PromiseLike<T>,
  timeoutMs = 30000,
): Promise<T> {
  window.boot.step(id, label, "running");
  const start = performance.now();
  try {
    const value = await deadline(
      Promise.resolve().then(async () => {
        if (!document.hidden && !document.querySelector<HTMLElement>("#boot-screen")?.hidden) {
          await new Promise<void>((resolve) => {
            // Paint the current stage before a synchronous browser/driver call.
            // The fallback also lets startup continue if this tab becomes hidden.
            const timer = setTimeout(resolve, 100);
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                clearTimeout(timer);
                resolve();
              }),
            );
          });
        }
        return work();
      }),
      label,
      timeoutMs,
    );
    window.boot.step(id, label, "passed", `${Math.round(performance.now() - start)} ms`);
    return value;
  } catch (error) {
    window.boot.step(id, label, "failed", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export interface LabDiagnostics {
  backend: "webgpu" | "webgl2";
  readPixels(): Promise<{ data: Uint8Array; width: number; height: number }>;
  stats(): {
    renderPasses: number;
    computePasses: number;
    instances: number;
    cachedEffects?: number;
    compilingEffect?: number | null;
    inFlight?: number;
    completedFrames?: number;
  };
  loseDevice(): void;
}
declare global {
  interface Window {
    lab: LabDiagnostics;
    boot: BootScreen;
  }
}
