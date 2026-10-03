import { createAtlas } from "../atlas";
import type { RenderState } from "../renderer";
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
    return this.inFlight >= 2;
  }
  private readonly gridWidth = 256;
  private readonly gridHeight = 160;

  static async create(
    canvas: HTMLCanvasElement,
    onLost: (message: string) => void,
    onError: (error: unknown) => void,
  ) {
    if (!navigator.gpu)
      throw new Error(
        "WebGPU is unavailable in this browser. Use a browser with WebGPU enabled on HTTPS or localhost. The separate WebGL2 edition remains available.",
      );
    let adapter: GPUAdapter | null = null;
    for (let i = 0; i < 3 && !adapter; i++) {
      adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
      if (!adapter) await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (!adapter)
      throw new Error(
        "This browser did not provide a WebGPU adapter. Check browser graphics settings or open the separate WebGL2 edition.",
      );
    const device = await adapter.requestDevice();
    const renderer = new WebGPURenderer(canvas, device, adapter.info);
    device.addEventListener("uncapturederror", (event) => {
      if (!renderer.closed) onError((event as GPUUncapturedErrorEvent).error);
    });
    device.lost.then((info) => {
      if (!renderer.closed) onLost(`WebGPU device lost: ${info.message || info.reason}`);
    });
    try {
      await renderer.initialize();
    } catch (error) {
      renderer.dispose();
      throw error;
    }
    return renderer;
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
          buffer: { type: "uniform", hasDynamicOffset: true, minBindingSize: 112 },
        },
      ],
    });
    this.uniformGroup = device.createBindGroup({
      layout: this.uniformLayout,
      entries: [{ binding: 0, resource: { buffer: this.uniformBuffer, size: 112 } }],
    });
    this.resourcesLayout = device.createBindGroupLayout({
      entries: [
        ...[0, 1, 2, 3].map((binding) => ({
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
    const module = this.device.createShaderModule({ label, code });
    const info = await module.getCompilationInfo();
    const errors = info.messages.filter((message) => message.type === "error");
    if (errors.length)
      throw new Error(`${label}: ${errors.map((e) => `line ${e.lineNum}: ${e.message}`).join("\n")}`);
    return module;
  }
  private async initialize() {
    const layout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.uniformLayout, this.resourcesLayout],
    });
    const scene = await this.module("Native WGSL scene", common + bindings + sceneCode);
    const post = await this.module("Native WGSL post processing", common + bindings + postCode);
    const particle = await this.module("Instanced WGSL particles", common + bindings + particleCode);
    const update = await this.module("Particle compute simulation", common + updateCode);
    const fieldModule = await this.module("Storage-buffer grid simulation", common + fieldCode);
    const blurModule = await this.module("Shared-memory tiled convolution", common + tiledBlurCode);
    for (const [name, module, entry, format] of [
      ["scene", scene, "scene", "rgba16float"],
      ["post-hdr", post, "post", "rgba16float"],
      ["post", post, "post", "rgba8unorm"],
      ["blur", post, "blur", "rgba16float"],
      ["feedback", post, "feedback", "rgba16float"],
      ["present", post, "present", navigator.gpu.getPreferredCanvasFormat()],
    ] as const)
      this.pipelines.set(
        name,
        await this.device.createRenderPipelineAsync({
          label: name,
          layout,
          vertex: { module, entryPoint: "fullscreen" },
          fragment: { module, entryPoint: entry, targets: [{ format }] },
          primitive: { topology: "triangle-list" },
        }),
      );
    for (const alpha of [false, true])
      this.pipelines.set(
        alpha ? "sprites" : "particles",
        await this.device.createRenderPipelineAsync({
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
      );
    this.update = await this.device.createComputePipelineAsync({
      label: "64 agents per workgroup",
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.uniformLayout, this.computeLayout],
      }),
      compute: { module: update, entryPoint: "updateParticles" },
    });
    this.fieldUpdate = await this.device.createComputePipelineAsync({
      label: "8 × 8 field workgroups",
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.uniformLayout, this.computeLayout],
      }),
      compute: { module: fieldModule, entryPoint: "updateField" },
    });
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
    this.tiledBlur = await this.device.createComputePipelineAsync({
      label: "Tiled Gaussian compute blur",
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.uniformLayout, this.blurComputeLayout],
      }),
      compute: { module: blurModule, entryPoint: "tiledBlur" },
    });
    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: "opaque",
    });
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
    const bytes = new ArrayBuffer(112);
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
    const offset = this.slot++ * 256;
    this.device.queue.writeBuffer(this.uniformBuffer, offset, bytes);
    return offset;
  }
  private resources(
    input: GPUTextureView = this.dummy.view,
    blur: GPUTextureView = this.dummy.view,
    baseline: GPUTextureView = this.dummy.view,
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
    pass.setPipeline(this.pipelines.get(name)!);
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
    if (this.closed) return;
    this.resize(state.quality);
    this.slot = 0;
    this.drawCalls = 0;
    this.computePasses = 0;
    const dt = Math.max(0, Math.min(0.05, state.time - this.previousTime));
    this.previousTime = state.time;
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
    const [scene, baseline, processed, blurX, blurY, historyA, historyB, output] = this.targets;
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
        state.effect === 39 ? "sprites" : "particles",
        this.uniform(state),
        this.resources(),
        true,
        this.particleCount,
      );
    if (state.compare >= 0)
      this.pass(encoder, baseline.view, "scene", this.uniform(state, { enabled: 0 }), this.resources());
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
    const needsBlur = [2, 13, 15, 24, 30, 33, 35, 47].includes(state.effect);
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
      this.resources(input.view, needsBlur ? blurY.view : input.view, baseline.view),
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
    this.device.queue
      .onSubmittedWorkDone()
      .then(() => {
        this.inFlight = Math.max(0, this.inFlight - 1);
      })
      .catch(() => {
        this.inFlight = 0;
      });
    this.historyReset = false;
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
    await buffer.mapAsync(GPUMapMode.READ);
    const mapped = new Uint8Array(buffer.getMappedRange());
    const data = new Uint8Array(output.width * output.height * 4);
    for (let row = 0; row < output.height; row++)
      data.set(
        mapped.subarray(row * bytesPerRow, row * bytesPerRow + output.width * 4),
        row * output.width * 4,
      );
    buffer.unmap();
    buffer.destroy();
    return { data, width: output.width, height: output.height };
  }
  async capture() {
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
