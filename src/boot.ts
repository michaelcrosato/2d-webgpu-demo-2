import { diagnosticCheck } from "./diagnostics";

try {
  const lab = await diagnosticCheck(
    "assets",
    "Application assets, styles, shaders and catalog",
    () => import("./main"),
  );
  await lab.runStartupDiagnostics();
} catch (error) {
  window.boot.fail(error);
}
