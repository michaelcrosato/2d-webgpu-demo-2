import { categories as originalCategories, effects as originalEffects } from "./catalog";
import { gameStudies } from "./game-scenes";
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
effects.forEach((effect, index) => {
  effect.game = [gameStudies[index].title, `${gameStudies[index].story} ${gameStudies[index].watch}`];
});
const water = effects.find((effect) => effect.id === "water")!;
water.description =
  "Water becomes convincing when several cues work together: layered waves bend reflections and the seabed, depth absorbs color, caustics move beneath the surface, and foam and bright glints mark the edges and crests. Explore four individually composed settings in the water studio. Click the surface to send a ripple through it.";
water.technique =
  "The material evaluates multi-direction wave height and gradients, displaces reflection and refraction samples, mixes them with a Schlick-style view-angle term, and applies exponential depth absorption. Animated caustic bands, shoreline foam, crest foam, and normal-based highlights finish the surface. These are artistic 2D depth/view proxies rather than ray-traced optics. The simulated-wave game scene additionally derives its normal perturbation from the persistent compute height grid.";
water.prompt =
  "Create attractive 2D water with layered wave normals, depth-tinted refraction, Fresnel-style reflections, animated caustics, foam, surface glints, and pointer-triggered ripples. Expose each contribution as a control.";
water.world = [
  "Water material study",
  "Compare a moonlit lagoon, clear tropical shallows, a storm coast, and a cavern waterfall pool. Each has its own environment, seabed, and lighting.",
];
effects.find((effect) => effect.id === "instancing")!.defaults = [0.12, 0.1, 0.5, 0.55];
effects.find((effect) => effect.id === "particles")!.defaults = [0.25, 0.4, 0.5, 0.55];
if (isWebGPU) effects.find((effect) => effect.id === "flocking")!.defaults = [0.08, 0.55, 0.5, 0.6];
effects.find((effect) => effect.id === "weather")!.description =
  "Snow in the abstract study and rain over the courier’s rooftop demonstrate the same GPU particle system with different billboard shapes. Density, wind, size, and fall speed change the mood of the game scene.";
