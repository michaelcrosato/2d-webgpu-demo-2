import { createAtlas } from "../atlas";
import { deadline, diagnosticCheck } from "../diagnostics";
import { gameSceneShader } from "../game-scenes";
import type { RenderState } from "../renderer";
import { waterDefault, waterShader } from "../water";
import bindings from "./shaders/bindings.wgsl?raw";
import common from "./shaders/common.wgsl?raw";
import fieldCode from "./shaders/field-compute.wgsl?raw";
import particleCode from "./shaders/particle-draw.wgsl?raw";
import updateCode from "./shaders/particles.wgsl?raw";
import postCode from "./shaders/post.wgsl?raw";
import sceneCode from "./shaders/scene.wgsl?raw";
import tiledBlurCode from "./shaders/tiled-blur.wgsl?raw";

type Target = { texture: GPUTexture; view: GPUTextureView; width: number; height: number };
export class WebGPURenderer {
  readonly hdr = true;
  readonly backend = "webgpu";
  drawCalls = 0;
  computePasses = 0;
  particleCount = 0;
  private context: GPUCanvasContext;
  private uniformBuffer: GPUBuffer;
  private uniformLayout: GPUBindGroupLayout;
  private uniformGroup: GPUBindGroup;
  private resourcesLayout: GPUBindGroupLayout;
  private computeLayout: GPUBindGroupLayout;
  private linear: GPUSampler;
  private nearest: GPUSampler;
  private atlas: GPUTexture;
  private dummy: Target;
  private targets: Target[] = [];
  private buffers: GPUBuffer[] = [];
  private fieldBuffers: GPUBuffer[] = [];
  private pipelines = new Map<string, GPURenderPipeline>();
  private renderLayout!: GPUPipelineLayout;
  private sceneModule!: GPUShaderModule;
  private postModule!: GPUShaderModule;
  private effectPromises = new Map<number, Promise<void>>();
  private compilationTail: Promise<void> = Promise.resolve();
  private cachedEffects = new Map<number, true>();
  private compilingEffect: number | null = null;
  private completedFrames = 0;
  private lastCompletion = 0;
  private pipelineError: unknown;
  private update!: GPUComputePipeline;
  private fieldUpdate!: GPUComputePipeline;
  private tiledBlur!: GPUComputePipeline;
  private blurComputeLayout!: GPUBindGroupLayout;
  private fieldReset = true;
  private fieldAccumulator = 0;
  private previousParams = "";
  private previousPointer = "";
  private slot = 0;
  private particleIndex = 0;
  private historyIndex = 0;
  private fieldIndex = 0;
  private historyReset = true;
  private previousTime = 0;
  private previousEffect = -1;
  private previousContext = -1;
  private closed = false;
  private inFlight = 0;
  private initialParticles!: Float32Array<ArrayBuffer>;
  private particleReset = false;
  get busy() {
    if (this.pipelineError) throw this.pipelineError;
    return this.inFlight >= 2;
  }
  health() {
    return {
      inFlight: this.inFlight,
      cachedEffects: this.cachedEffects.size,
      compilingEffect: this.compilingEffect,
      completedFrames: this.completedFrames,
      lastCompletionMs: Math.round(this.lastCompletion),
    };
  }
  async waitForIdle() {
    await deadline(this.device.queue.onSubmittedWorkDone(), "WebGPU queue completion");
    if (this.pipelineError) throw this.pipelineError;
  }
  private readonly gridWidth = 256;
  private readonly gridHeight = 160;

  static async create(
    canvas: HTMLCanvasElement,
    onLost: (message: string) => void,
    onError: (error: unknown) => void,
    initialEffect = 0,
  ) {
    await diagnosticCheck("webgpu-api", "Secure context and WebGPU API", () => {
      if (!window.isSecureContext)
        throw new Error("WebGPU requires HTTPS or localhost; this page is not a secure context.");
      if (!navigator.gpu)
        throw new Error(
          "WebGPU is unavailable in this browser. Check graphics acceleration or open the separate WebGL2 diagnostics.",
        );
    });
    const adapter = await diagnosticCheck("adapter", "WebGPU adapter request", async () => {
      const selected = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
      if (!selected)
        throw new Error(
          "This browser did not provide a WebGPU adapter. Check browser graphics settings or open the separate WebGL2 edition.",
        );
      return selected;
    });
    window.boot.detail(
      "GPU",
      `${adapter.info.vendor || "vendor hidden"} / ${adapter.info.architecture || "architecture hidden"} / ${adapter.info.device || "device hidden"} / ${adapter.info.description || "description hidden"}`,
    );
    window.boot.detail("Software adapter", adapter.info.isFallbackAdapter);
    window.boot.step(
      "adapter-mode",
      "Adapter acceleration",
      adapter.info.isFallbackAdapter ? "warning" : "passed",
      adapter.info.isFallbackAdapter
        ? "Software GPU: rendering may be slow. Check browser graphics acceleration."
        : "Adapter is not marked as fallback",
    );
    window.boot.detail(
      "Adapter capabilities",
      `max texture ${adapter.limits.maxTextureDimension2D}; storage ${adapter.limits.maxStorageBufferBindingSize}; workgroup ${adapter.limits.maxComputeInvocationsPerWorkgroup}`,
    );
    window.boot.detail("Adapter features", [...adapter.features].join(", ") || "core only");
    const device = await diagnosticCheck("device", "WebGPU device request", () => adapter.requestDevice());
    let renderer: WebGPURenderer;
    try {
      renderer = await diagnosticCheck(
        "resources",
        "WebGPU canvas, buffers and generated atlas",
        () => new WebGPURenderer(canvas, device, adapter.info),
      );
    } catch (error) {
      device.destroy();
      throw error;
    }
    device.addEventListener("uncapturederror", (event) => {
      if (!renderer.closed) onError((event as GPUUncapturedErrorEvent).error);
    });
    device.lost.then((info) => {
      if (!renderer.closed) onLost(`WebGPU device lost: ${info.message || info.reason}`);
    });
    try {
      await diagnosticCheck("gpu-smoke", "Small native render + compute + mapped readback test", () =>
        renderer.smokeTest(),
      );
      await renderer.initialize(initialEffect);
    } catch (error) {
      renderer.dispose();
      throw error;
    }
    return renderer;
  }
  private async smokeTest() {
    const device = this.device;
    device.pushErrorScope("validation");
    const texture = device.createTexture({
      size: [16, 16],
      format: "rgba8unorm",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });
    const pixels = device.createBuffer({
      size: 256 * 16,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    const output = device.createBuffer({ size: 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
    const readback = device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    let smokeError: unknown;
    try {
      const module = device.createShaderModule({
        label: "Diagnostic smoke test",
        code: `
        @group(0) @binding(0) var<storage, read_write> result: array<u32>;
        @compute @workgroup_size(1) fn computeTest() { result[0] = 42u; }
        @vertex fn vertexTest(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
          let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u)); return vec4f(p * 2.0 - vec2f(1), 0, 1);
        }
        @fragment fn fragmentTest() -> @location(0) vec4f { return vec4f(0.2, 0.4, 0.8, 1); }
      `,
      });
      const renderPipeline = await deadline(
        device.createRenderPipelineAsync({
          layout: "auto",
          vertex: { module, entryPoint: "vertexTest" },
          fragment: { module, entryPoint: "fragmentTest", targets: [{ format: "rgba8unorm" }] },
        }),
        "Diagnostic render pipeline",
      );
      const computePipeline = await deadline(
        device.createComputePipelineAsync({ layout: "auto", compute: { module, entryPoint: "computeTest" } }),
        "Diagnostic compute pipeline",
      );
      const encoder = device.createCommandEncoder();
      const render = encoder.beginRenderPass({
        colorAttachments: [{ view: texture.createView(), loadOp: "clear", storeOp: "store" }],
      });
      render.setPipeline(renderPipeline);
      render.draw(3);
      render.end();
      const compute = encoder.beginComputePass();
      compute.setPipeline(computePipeline);
      compute.setBindGroup(
        0,
        device.createBindGroup({
          layout: computePipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: output } }],
        }),
      );
      compute.dispatchWorkgroups(1);
      compute.end();
      encoder.copyTextureToBuffer({ texture }, { buffer: pixels, bytesPerRow: 256 }, [16, 16]);
      encoder.copyBufferToBuffer(output, 0, readback, 0, 4);
      device.queue.submit([encoder.finish()]);
      await deadline(
        Promise.all([pixels.mapAsync(GPUMapMode.READ), readback.mapAsync(GPUMapMode.READ)]),
        "Diagnostic GPU readback",
      );
      const rgba = new Uint8Array(pixels.getMappedRange()).slice(0, 4);
      const answer = new Uint32Array(readback.getMappedRange())[0];
      if (
        answer !== 42 ||
        Math.abs(rgba[0] - 51) > 1 ||
        Math.abs(rgba[1] - 102) > 1 ||
        Math.abs(rgba[2] - 204) > 1 ||
        rgba[3] !== 255
      )
        throw new Error(
          `GPU smoke test returned incorrect bytes: RGBA ${rgba.join(",")}; compute ${answer}.`,
        );
      window.boot.detail("GPU smoke result", `RGBA ${rgba.join(",")}; compute ${answer} (expected 42)`);
    } catch (error) {
      smokeError = error;
    } finally {
      texture.destroy();
      pixels.destroy();
      output.destroy();
      readback.destroy();
    }
    const validation = await deadline(device.popErrorScope(), "Diagnostic validation result").catch(
      (error: unknown) => {
        smokeError ??= error;
        return null;
      },
    );
    if (smokeError) throw smokeError;
    if (validation) throw new Error(`GPU smoke-test validation: ${validation.message}`);
  }
  private constructor(
    readonly canvas: HTMLCanvasElement,
    readonly device: GPUDevice,
    readonly adapterInfo: GPUAdapterInfo,
  ) {
    const context = canvas.getContext("webgpu");
    if (!context) throw new Error("Could not create a WebGPU canvas context.");
    this.context = context;
    this.uniformBuffer = device.createBuffer({
      label: "Per-pass uniforms",
      size: 256 * 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.uniformLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
          buffer: { type: "uniform", hasDynamicOffset: true, minBindingSize: 144 },
        },
      ],
    });
    this.uniformGroup = device.createBindGroup({
      layout: this.uniformLayout,
      entries: [{ binding: 0, resource: { buffer: this.uniformBuffer, size: 144 } }],
    });
    this.resourcesLayout = device.createBindGroupLayout({
      entries: [
        ...[0, 1, 2, 3, 8].map((binding) => ({
          binding,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float" as const },
        })),
        ...[4, 5].map((binding) => ({
          binding,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" as const },
        })),
        ...[6, 7].map((binding) => ({
          binding,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "read-only-storage" as const },
        })),
      ],
    });
    this.computeLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
      ],
    });
    this.linear = device.createSampler({ minFilter: "linear", magFilter: "linear" });
    this.nearest = device.createSampler();
    this.atlas = device.createTexture({
      label: "Pixel sprite atlas",
      size: [128, 16],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture({ source: createAtlas() }, { texture: this.atlas }, [128, 16]);
    this.dummy = this.target(1, 1, "rgba8unorm");
    device.queue.writeTexture(
      { texture: this.dummy.texture },
      new Uint8Array([0, 0, 0, 255]),
      { bytesPerRow: 4 },
      [1, 1],
    );
    this.initParticles();
    for (let i = 0; i < 2; i++)
      this.fieldBuffers.push(
        device.createBuffer({
          label: `Simulation field ${i}`,
          size: this.gridWidth * this.gridHeight * 8,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        }),
      );
  }
  private async module(label: string, code: string) {
    return diagnosticCheck(`shader:${label}`, label, async () => {
      const module = this.device.createShaderModule({ label, code });
      const info = await module.getCompilationInfo();
      const errors = info.messages.filter((message) => message.type === "error");
      if (errors.length)
        throw new Error(`${label}: ${errors.map((e) => `line ${e.lineNum}: ${e.message}`).join("\n")}`);
      return module;
    });
  }
  private async initialize(initialEffect: number) {
    const layout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.uniformLayout, this.resourcesLayout],
    });
    this.renderLayout = layout;
    this.sceneModule = await this.module(
      "Native WGSL scene",
      common + bindings + gameSceneShader(true) + waterShader(true) + sceneCode,
    );
    const post = await this.module(
      "Native WGSL post processing",
      common + bindings + gameSceneShader(true) + waterShader(true, true) + postCode,
    );
    this.postModule = post;
    const particle = await this.module("Instanced WGSL particles", common + bindings + particleCode);
    const update = await this.module("Particle compute simulation", common + updateCode);
    const fieldModule = await this.module("Storage-buffer grid simulation", common + fieldCode);
    const blurModule = await this.module("Shared-memory tiled convolution", common + tiledBlurCode);
    for (const [name, module, entry, format] of [
      ["blur", post, "blur", "rgba16float"],
      ["feedback", post, "feedback", "rgba16float"],
      ["present", post, "present", navigator.gpu.getPreferredCanvasFormat()],
    ] as const)
      this.pipelines.set(
        name,
        await diagnosticCheck(`pipeline:${name}`, `${name} render pipeline`, () =>
          this.device.createRenderPipelineAsync({
            label: name,
            layout,
            vertex: { module, entryPoint: "fullscreen" },
            fragment: { module, entryPoint: entry, targets: [{ format }] },
            primitive: { topology: "triangle-list" },
          }),
        ),
      );
    for (const alpha of [false, true])
      this.pipelines.set(
        alpha ? "sprites" : "particles",
        await diagnosticCheck(
          `pipeline:${alpha ? "sprites" : "particles"}`,
          `Instanced ${alpha ? "sprite" : "particle"} pipeline`,
          () =>
            this.device.createRenderPipelineAsync({
              label: "Instanced particle quads",
              layout,
              vertex: { module: particle, entryPoint: "particleVertex" },
              fragment: {
                module: particle,
                entryPoint: "particleFragment",
                targets: [
                  {
                    format: "rgba16float",
                    blend: {
                      color: {
                        srcFactor: "src-alpha",
                        dstFactor: alpha ? "one-minus-src-alpha" : "one",
                        operation: "add",
                      },
                      alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
                    },
                  },
                ],
              },
              primitive: { topology: "triangle-strip" },
            }),
        ),
      );
    this.update = await diagnosticCheck("particle-compute", "Agent simulation pipeline", () =>
      this.device.createComputePipelineAsync({
        label: "64 agents per workgroup",
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.uniformLayout, this.computeLayout],
        }),
        compute: { module: update, entryPoint: "updateParticles" },
      }),
    );
    this.fieldUpdate = await diagnosticCheck("field-compute", "Grid simulation pipeline", () =>
      this.device.createComputePipelineAsync({
        label: "8 × 8 field workgroups",
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.uniformLayout, this.computeLayout],
        }),
        compute: { module: fieldModule, entryPoint: "updateField" },
      }),
    );
    this.blurComputeLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: "unfilterable-float" } },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: { access: "write-only", format: "rgba16float" },
        },
      ],
    });
    this.tiledBlur = await diagnosticCheck("blur-compute", "Tiled compute blur pipeline", () =>
      this.device.createComputePipelineAsync({
        label: "Tiled Gaussian compute blur",
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.uniformLayout, this.blurComputeLayout],
        }),
        compute: { module: blurModule, entryPoint: "tiledBlur" },
      }),
    );
    await this.prepareEffect(initialEffect);
    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: "opaque",
    });
  }
  private prepareEffect(effect: number): Promise<void> {
    if (this.pipelines.has(`scene:${effect}`)) return Promise.resolve();
    const existing = this.effectPromises.get(effect);
    if (existing) return existing;
    // Compile only effects the visitor opens. Cache by effect, rather than replacing
    // the active pipeline when an asynchronous compilation happens to finish.
    const pending = this.compilationTail
      .then(async () => {
        if (this.closed) throw new Error("Renderer was closed before compilation.");
        this.compilingEffect = effect;
        const pipelines: Array<readonly [string, GPURenderPipeline]> = [];
        for (const [name, module, entryPoint, format] of [
          ["scene", this.sceneModule, "scene", "rgba16float"],
          ["post-hdr", this.postModule, "post", "rgba16float"],
          ["post", this.postModule, "post", "rgba8unorm"],
        ] as const) {
          const key = `${name}:${effect}`;
          const pipeline = await diagnosticCheck(
            `effect:${effect}:${name}`,
            `Effect ${effect + 1}: ${name} pipeline`,
            () =>
              this.device.createRenderPipelineAsync({
                label: key,
                layout: this.renderLayout,
                vertex: { module, entryPoint: "fullscreen" },
                fragment: { module, entryPoint, constants: { effectId: effect }, targets: [{ format }] },
                primitive: { topology: "triangle-list" },
              }),
          );
          if (this.closed) throw new Error("Renderer was closed during compilation.");
          pipelines.push([key, pipeline]);
        }
        if (!this.closed) {
          for (const [key, pipeline] of pipelines) this.pipelines.set(key, pipeline);
          this.cachedEffects.set(effect, true);
          while (this.cachedEffects.size > 8) {
            const oldest = [...this.cachedEffects.keys()].find(
              (key) => key !== this.previousEffect && key !== effect,
            )!;
            this.cachedEffects.delete(oldest);
            for (const name of ["scene", "post", "post-hdr"]) this.pipelines.delete(`${name}:${oldest}`);
          }
          window.boot.detail(
            "Pipeline cache",
            `${this.cachedEffects.size}/8 effects; one compilation at a time`,
          );
        }
      })
      .catch((error: unknown) => {
        if (!this.closed) this.pipelineError = error;
        throw error;
      })
      .finally(() => {
        this.effectPromises.delete(effect);
        this.compilingEffect = null;
      });
    this.effectPromises.set(effect, pending);
    this.compilationTail = pending.catch(() => {});
    return pending;
  }
  private target(width: number, height: number, format: GPUTextureFormat = "rgba16float"): Target {
    const texture = this.device.createTexture({
      label: `${format} render target`,
      size: [width, height],
      format,
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_SRC |
        GPUTextureUsage.COPY_DST |
        (format === "rgba16float" ? GPUTextureUsage.STORAGE_BINDING : 0),
    });
    return { texture, view: texture.createView(), width, height };
  }
  private initParticles() {
    let seed = 42;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const data = new Float32Array(10000 * 8);
    for (let i = 0; i < 10000; i++)
      data.set(
        [
          (random() * 2 - 1) * 1.8,
          random() * 2 - 1,
          (random() - 0.5) * 0.25,
          (random() - 0.5) * 0.25,
          random() * 4,
          random(),
          0,
          0,
        ],
        i * 8,
      );
    this.initialParticles = data;
    for (let i = 0; i < 2; i++) {
      const buffer = this.device.createBuffer({
        label: `Agent storage ${i}`,
        size: data.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      });
      this.device.queue.writeBuffer(buffer, 0, data);
      this.buffers.push(buffer);
    }
  }
  private resize(quality: number) {
    const bounds = this.canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, quality === 0 ? 1 : quality === 1 ? 1.5 : 2);
    const width = Math.max(
      2,
      Math.min(quality === 0 ? 800 : quality === 1 ? 1280 : 1920, Math.round(bounds.width * ratio)),
    );
    const height = Math.max(2, Math.round((width * bounds.height) / Math.max(bounds.width, 1)));
    if (width === this.canvas.width && height === this.canvas.height && this.targets.length) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.targets.forEach((t) => {
      t.texture.destroy();
    });
    this.targets = [
      this.target(width, height),
      this.target(width, height),
      this.target(width, height),
      this.target(Math.ceil(width / 2), Math.ceil(height / 2)),
      this.target(Math.ceil(width / 2), Math.ceil(height / 2)),
      this.target(width, height),
      this.target(width, height),
      this.target(width, height, "rgba8unorm"),
      this.target(width, height),
    ];
    this.historyReset = true;
  }
  private uniform(
    state: RenderState,
    patch: {
      enabled?: number;
      style?: number;
      compare?: number;
      finish?: number;
      styleOnly?: number;
      dt?: number;
      direction?: [number, number];
      threshold?: number;
      reset?: boolean;
      jump?: number;
    } = {},
  ) {
    const bytes = new ArrayBuffer(144);
    const floats = new Float32Array(bytes);
    const ints = new Int32Array(bytes);
    floats.set([
      this.canvas.width,
      this.canvas.height,
      ...state.pointer,
      ...state.origin,
      state.time,
      state.impact,
    ]);
    floats.set(state.params, 8);
    ints.set([state.effect, state.context, patch.enabled ?? 1, patch.style ?? 0], 12);
    floats.set([patch.compare ?? -1, patch.finish ?? 0, patch.styleOnly ?? 0, patch.dt ?? 0], 16);
    floats.set([...(patch.direction ?? [0, 0]), patch.threshold ?? 0, this.particleCount], 20);
    floats.set([this.gridWidth, this.gridHeight, patch.reset ? 1 : 0, patch.jump ?? 0], 24);
    const water = state.water ?? waterDefault;
    floats.set(water.slice(0, 4), 28);
    floats.set([water[4], state.waterPreset ?? 0, 0, 0], 32);
    const offset = this.slot++ * 256;
    this.device.queue.writeBuffer(this.uniformBuffer, offset, bytes);
    return offset;
  }
  private resources(
    input: GPUTextureView = this.dummy.view,
    blur: GPUTextureView = this.dummy.view,
    baseline: GPUTextureView = this.dummy.view,
    backdrop: GPUTextureView = this.dummy.view,
  ) {
    return this.device.createBindGroup({
      layout: this.resourcesLayout,
      entries: [
        { binding: 0, resource: input },
        { binding: 1, resource: blur },
        { binding: 2, resource: baseline },
        { binding: 3, resource: this.atlas.createView() },
        { binding: 4, resource: this.linear },
        { binding: 5, resource: this.nearest },
        { binding: 6, resource: { buffer: this.fieldBuffers[this.fieldIndex] } },
        { binding: 7, resource: { buffer: this.buffers[this.particleIndex] } },
        { binding: 8, resource: backdrop },
      ],
    });
  }
  private pass(
    encoder: GPUCommandEncoder,
    target: GPUTextureView,
    name: string,
    uniform: number,
    resources: GPUBindGroup,
    load = false,
    instances = 1,
  ) {
    const pass = encoder.beginRenderPass({
      label: name,
      colorAttachments: [
        {
          view: target,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: load ? "load" : "clear",
          storeOp: "store",
        },
      ],
    });
    const key = ["scene", "post", "post-hdr"].includes(name) ? `${name}:${this.previousEffect}` : name;
    pass.setPipeline(this.pipelines.get(key)!);
    pass.setBindGroup(0, this.uniformGroup, [uniform]);
    pass.setBindGroup(1, resources);
    pass.draw(name === "particles" || name === "sprites" ? 4 : 3, instances);
    pass.end();
    this.drawCalls++;
  }
  reset() {
    this.historyReset = true;
    this.fieldReset = true;
    this.particleReset = true;
  }
  render(state: RenderState) {
    if (this.closed) return false;
    if (this.pipelineError) throw this.pipelineError;
    if (!this.pipelines.has(`scene:${state.effect}`)) {
      // A rapid click only changes the next requested effect. Do not enqueue
      // dozens of obsolete compilations while the GPU driver is still working.
      if (!this.effectPromises.size) void this.prepareEffect(state.effect).catch(() => {});
      return false;
    }
    this.resize(state.quality);
    this.slot = 0;
    this.drawCalls = 0;
    this.computePasses = 0;
    const dt = Math.max(0, Math.min(0.05, state.time - this.previousTime));
    this.previousTime = state.time;
    this.cachedEffects.delete(state.effect);
    this.cachedEffects.set(state.effect, true);
    if (state.effect !== this.previousEffect || state.context !== this.previousContext) {
      this.historyReset = true;
      this.fieldReset = true;
      this.previousEffect = state.effect;
      this.previousContext = state.context;
    }
    const parameterKey = state.params.join(",");
    const pointerKey = state.pointer.join(",");
    if (parameterKey !== this.previousParams) this.fieldReset = true;
    if (state.effect === 46 && pointerKey !== this.previousPointer) this.fieldReset = true;
    this.previousParams = parameterKey;
    this.previousPointer = pointerKey;
    const [scene, baseline, processed, blurX, blurY, historyA, historyB, output, backdrop] = this.targets;
    const encoder = this.device.createCommandEncoder({ label: "2D WebGPU frame" });
    const fieldEffects = [40, 41, 42, 45, 46];
    if (fieldEffects.includes(state.effect)) {
      const dispatchField = (offset: number) => {
        const next = 1 - this.fieldIndex;
        const pass = encoder.beginComputePass({ label: "Grid simulation step" });
        pass.setPipeline(this.fieldUpdate);
        pass.setBindGroup(0, this.uniformGroup, [offset]);
        pass.setBindGroup(
          1,
          this.device.createBindGroup({
            layout: this.computeLayout,
            entries: [
              { binding: 0, resource: { buffer: this.fieldBuffers[this.fieldIndex] } },
              { binding: 1, resource: { buffer: this.fieldBuffers[next] } },
            ],
          }),
        );
        pass.dispatchWorkgroups(Math.ceil(this.gridWidth / 8), Math.ceil(this.gridHeight / 8));
        pass.end();
        this.fieldIndex = next;
        this.computePasses++;
      };
      if (this.fieldReset || (state.effect === 46 && dt > 0)) {
        dispatchField(this.uniform(state, { reset: true }));
        this.fieldAccumulator = 0;
        if (state.effect === 40) {
          const offset = this.uniform(state, { dt });
          for (let i = 0; i < 32; i++) dispatchField(offset);
        }
        if (state.effect === 46)
          for (let jump = 128; jump >= 1; jump /= 2) dispatchField(this.uniform(state, { jump }));
        this.fieldReset = false;
      } else if (dt > 0 && state.effect !== 46) {
        this.fieldAccumulator += dt;
        const tick = state.effect === 45 ? 0.1 : 1 / 60;
        const steps = Math.min(8, Math.floor(this.fieldAccumulator / tick));
        this.fieldAccumulator -= steps * tick;
        const offset = this.uniform(state, { dt });
        for (let i = 0; i < steps * (state.effect === 40 ? 4 : 1); i++) dispatchField(offset);
      }
    }
    const hasParticles = [5, 6, 7, 9, 39, 43, 44].includes(state.effect);
    if (hasParticles && this.particleReset) {
      for (const buffer of this.buffers) this.device.queue.writeBuffer(buffer, 0, this.initialParticles);
      this.particleReset = false;
    }
    this.particleCount = hasParticles
      ? Math.round(state.effect === 39 ? 100 + state.params[0] * 3900 : 300 + state.params[0] * 9700)
      : 0;
    if (hasParticles && dt > 0) {
      const next = 1 - this.particleIndex;
      const pass = encoder.beginComputePass({ label: "Agent simulation" });
      pass.setPipeline(this.update);
      pass.setBindGroup(0, this.uniformGroup, [this.uniform(state, { dt })]);
      pass.setBindGroup(
        1,
        this.device.createBindGroup({
          layout: this.computeLayout,
          entries: [
            { binding: 0, resource: { buffer: this.buffers[this.particleIndex] } },
            { binding: 1, resource: { buffer: this.buffers[next] } },
          ],
        }),
      );
      pass.dispatchWorkgroups(Math.ceil(this.particleCount / 64));
      pass.end();
      this.particleIndex = next;
      this.computePasses++;
    }
    this.pass(encoder, scene.view, "scene", this.uniform(state), this.resources());
    if (hasParticles)
      this.pass(
        encoder,
        scene.view,
        state.effect === 39 || (state.effect === 43 && state.context === 1) ? "sprites" : "particles",
        this.uniform(state),
        this.resources(),
        true,
        this.particleCount,
      );
    if (state.compare >= 0)
      this.pass(encoder, baseline.view, "scene", this.uniform(state, { enabled: 0 }), this.resources());
    if (state.context === 1 && [14, 15].includes(state.effect))
      this.pass(encoder, backdrop.view, "scene", this.uniform(state, { enabled: 2 }), this.resources());
    let input = scene;
    if (state.effect === 6 || state.effect === 7) {
      const previous = this.historyIndex === 0 ? historyA : historyB,
        next = this.historyIndex === 0 ? historyB : historyA;
      this.pass(
        encoder,
        next.view,
        "feedback",
        this.uniform(state, {
          threshold: this.historyReset ? 0 : (0.8 + state.params[3] * 0.195) ** (dt * 60),
        }),
        this.resources(input.view, previous.view),
      );
      input = next;
      this.historyIndex = 1 - this.historyIndex;
    }
    const blurInput = (source: Target, threshold: number) => {
      const radius = 1 + state.params[1] * 9;
      this.pass(
        encoder,
        blurX.view,
        "blur",
        this.uniform(state, { direction: [radius / scene.width, 0], threshold }),
        this.resources(source.view),
      );
      this.pass(
        encoder,
        blurY.view,
        "blur",
        this.uniform(state, { direction: [0, radius / scene.height] }),
        this.resources(blurX.view),
      );
    };
    const needsBlur = [2, 10, 11, 13, 15, 24, 30, 33, 35, 41, 47].includes(state.effect);
    if (state.effect === 47) {
      const computeBlur = (source: Target, target: Target, horizontal: boolean, threshold: number) => {
        const pass = encoder.beginComputePass({ label: "Shared workgroup Gaussian blur" });
        pass.setPipeline(this.tiledBlur);
        pass.setBindGroup(0, this.uniformGroup, [
          this.uniform(state, { direction: horizontal ? [1, 0] : [0, 1], threshold }),
        ]);
        pass.setBindGroup(
          1,
          this.device.createBindGroup({
            layout: this.blurComputeLayout,
            entries: [
              { binding: 0, resource: source.view },
              { binding: 1, resource: target.view },
            ],
          }),
        );
        pass.dispatchWorkgroups(
          Math.ceil((horizontal ? target.width : target.height) / 64),
          horizontal ? target.height : target.width,
        );
        pass.end();
        this.computePasses++;
      };
      computeBlur(input, blurX, true, state.params[3] * 1.2);
      computeBlur(blurX, blurY, false, 0);
    } else if (needsBlur) blurInput(input, state.effect === 2 ? state.params[3] * 1.2 : 0);
    this.pass(
      encoder,
      state.style > 0 ? processed.view : output.view,
      state.style > 0 ? "post-hdr" : "post",
      this.uniform(state, { compare: state.style > 0 ? -1 : state.compare, finish: state.style > 0 ? 0 : 1 }),
      this.resources(input.view, needsBlur ? blurY.view : input.view, baseline.view, backdrop.view),
    );
    if (state.style > 0) {
      const needsStyleBlur = [3, 6, 8].includes(state.style);
      if (needsStyleBlur) blurInput(processed, 0);
      this.pass(
        encoder,
        output.view,
        "post",
        this.uniform(state, { style: state.style, styleOnly: 1, finish: 1, compare: state.compare }),
        this.resources(processed.view, needsStyleBlur ? blurY.view : processed.view, baseline.view),
      );
    }
    this.pass(
      encoder,
      this.context.getCurrentTexture().createView(),
      "present",
      this.uniform(state),
      this.resources(output.view),
    );
    this.device.queue.submit([encoder.finish()]);
    this.inFlight++;
    deadline(
      this.device.queue.onSubmittedWorkDone(),
      `GPU frame completion for effect ${state.effect + 1}, context ${state.context}`,
    )
      .then(() => {
        this.inFlight = Math.max(0, this.inFlight - 1);
        this.completedFrames++;
        this.lastCompletion = performance.now();
      })
      .catch((error: unknown) => {
        if (!this.closed) this.pipelineError = error;
      });
    this.historyReset = false;
    return true;
  }
  async readPixels() {
    const output = this.targets[7];
    if (!output) throw new Error("No WebGPU frame has been rendered yet.");
    const bytesPerRow = Math.ceil((output.width * 4) / 256) * 256;
    const buffer = this.device.createBuffer({
      label: "Pixel readback",
      size: bytesPerRow * output.height,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    const encoder = this.device.createCommandEncoder();
    encoder.copyTextureToBuffer({ texture: output.texture }, { buffer, bytesPerRow }, [
      output.width,
      output.height,
    ]);
    this.device.queue.submit([encoder.finish()]);
    try {
      await deadline(buffer.mapAsync(GPUMapMode.READ), "WebGPU output pixel readback");
      const mapped = new Uint8Array(buffer.getMappedRange());
      const data = new Uint8Array(output.width * output.height * 4);
      for (let row = 0; row < output.height; row++)
        data.set(
          mapped.subarray(row * bytesPerRow, row * bytesPerRow + output.width * 4),
          row * output.width * 4,
        );
      buffer.unmap();
      return { data, width: output.width, height: output.height };
    } finally {
      buffer.destroy();
    }
  }
  async capture(state: RenderState) {
    await this.prepareEffect(state.effect);
    if (this.closed) throw new Error("Renderer unavailable");
    this.render(state);
    const pixels = await this.readPixels();
    const snapshot = document.createElement("canvas");
    snapshot.width = pixels.width;
    snapshot.height = pixels.height;
    snapshot
      .getContext("2d")!
      .putImageData(new ImageData(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height), 0, 0);
    return new Promise<Blob>((resolve, reject) =>
      snapshot.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed")))),
    );
  }
  loseDevice() {
    this.device.destroy();
  }
  dispose() {
    this.closed = true;
    this.pipelines.clear();
    this.effectPromises.clear();
    this.cachedEffects.clear();
    this.targets.forEach((t) => {
      t.texture.destroy();
    });
    this.dummy.texture.destroy();
    this.atlas.destroy();
    [...this.buffers, ...this.fieldBuffers, this.uniformBuffer].forEach((b) => {
      b.destroy();
    });
    this.context.unconfigure();
    this.device.destroy();
  }
}
