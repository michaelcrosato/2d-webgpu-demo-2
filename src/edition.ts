import { categories as originalCategories, effects as originalEffects } from "./catalog";
import { computeEffects } from "./webgpu/catalog";
export const isWebGPU = !location.pathname.endsWith("webgl2.html");
export const edition = isWebGPU ? "WebGPU" : "WebGL2";
export const categories = isWebGPU
  ? [...originalCategories, "Compute playground" as const]
  : [...originalCategories];
export const effects = originalEffects.map((effect) => {
  if (!isWebGPU) return effect;
  const copy = { ...effect };
  copy.technique = copy.technique
    .replaceAll("WebGL2 transform feedback", "A WebGPU compute dispatch")
    .replaceAll("Transform feedback", "A compute shader")
    .replaceAll("transform feedback", "compute storage buffers")
    .replaceAll("into a second buffer", "into a second storage buffer")
    .replaceAll("WebGL2 drawArraysInstanced", "WebGPU instanced draws");
  if (effect.id === "bloom")
    copy.technique =
      "The renderer extracts highlights into an rgba16float texture, runs horizontal and vertical WGSL blur render passes, then composites the result. WebGPU supports this floating-point render-target format in its core API. The compute-bloom experiment demonstrates an alternative using shared workgroup memory.";
  if (effect.id === "particles")
    copy.technique =
      "A native WGSL compute shader updates particle position, velocity, age, and seed in storage buffers, 64 agents per workgroup. Two state buffers alternate. A vertex shader reads the resulting storage buffer directly and draws instanced quads without per-particle JavaScript updates.";
  if (effect.id === "instancing") {
    copy.technique =
      "A vertex shader indexes a read-only storage buffer by instance_index. WebGPU repeats one quad across the crowd with a single draw call, and the fragment shader samples animated atlas cells. A compute pass updates the same agent data before rendering.";
    copy.code =
      "@vertex fn spriteVertex(@builtin(instance_index) id: u32) {\n  let position = agents[id].state.xy;\n  // Share the quad and atlas across all instances.\n}";
  }
  if (effect.category === "Particles & motion")
    copy.code = copy.code.replace(
      "// Capture results with transform feedback.",
      "// A compute workgroup writes the next storage buffer.",
    );
  return copy;
});
if (isWebGPU) effects.push(...computeEffects);
