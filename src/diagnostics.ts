export interface LabDiagnostics {
  backend: "webgpu" | "webgl2";
  readPixels(): Promise<{ data: Uint8Array; width: number; height: number }>;
  stats(): { renderPasses: number; computePasses: number; instances: number };
  loseDevice(): void;
}
declare global {
  interface Window {
    lab: LabDiagnostics;
  }
}
