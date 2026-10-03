import { createAtlas } from "./atlas";
import {
  blurFragment,
  feedbackFragment,
  fullscreenVertex,
  particleFragment,
  particleUpdateFragment,
  particleUpdateVertex,
  particleVertex,
  postFragment,
  sceneFragment,
} from "./shaders";

type Target = {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
};
type Program = {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
};
export interface RenderState {
  effect: number;
  context: number;
  params: number[];
  pointer: [number, number];
  origin: [number, number];
  time: number;
  impact: number;
  style: number;
  compare: number;
  quality: number;
}

export class Renderer {
  readonly gl: WebGL2RenderingContext;
  readonly hdr: boolean;
  private scene: Program;
  private blur: Program;
  private post: Program;
  private feedback: Program;
  private update: Program;
  private particle: Program;
  private atlas: WebGLTexture;
  private targets: Target[] = [];
  private particleBuffers: WebGLBuffer[] = [];
  private updateVaos: WebGLVertexArrayObject[] = [];
  private drawVaos: WebGLVertexArrayObject[] = [];
  private transform: WebGLTransformFeedback;
  private emptyVao: WebGLVertexArrayObject;
  private particleIndex = 0;
  private historyIndex = 0;
  private resetHistory = true;
  private lastEffect = -1;
  private lastContext = -1;
  private lastTime = 0;
  drawCalls = 0;
  particleCount = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    if (!gl)
      throw new Error(
        "WebGL2 is unavailable. Enable hardware acceleration or try a current Chrome, Edge, Firefox, or Safari browser.",
      );
    this.gl = gl;
    this.hdr = !!gl.getExtension("EXT_color_buffer_float");
    this.scene = this.program(fullscreenVertex, sceneFragment);
    this.blur = this.program(fullscreenVertex, blurFragment);
    this.post = this.program(fullscreenVertex, postFragment);
    this.feedback = this.program(fullscreenVertex, feedbackFragment);
    this.update = this.program(particleUpdateVertex, particleUpdateFragment, ["nextState", "nextExtra"]);
    this.particle = this.program(particleVertex, particleFragment);
    this.emptyVao = gl.createVertexArray()!;
    this.transform = gl.createTransformFeedback()!;
    this.atlas = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, createAtlas());
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.initParticles();
  }

  private program(vertex: string, fragment: string, varyings?: string[]): Program {
    const gl = this.gl;
    const compile = (source: string, kind: number) => {
      const shader = gl.createShader(kind)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compilation failed: ${info}`);
      }
      return shader;
    };
    const vert = compile(vertex, gl.VERTEX_SHADER),
      frag = compile(fragment, gl.FRAGMENT_SHADER);
    const program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    if (varyings) gl.transformFeedbackVaryings(program, varyings, gl.INTERLEAVED_ATTRIBS);
    gl.linkProgram(program);
    gl.deleteShader(vert);
    gl.deleteShader(frag);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(`Shader link failed: ${gl.getProgramInfoLog(program)}`);
    return { program, uniforms: new Map() };
  }

  private location(p: Program, name: string): WebGLUniformLocation | null {
    if (!p.uniforms.has(name)) p.uniforms.set(name, this.gl.getUniformLocation(p.program, name));
    return p.uniforms.get(name)!;
  }
  private float(p: Program, name: string, value: number) {
    this.gl.uniform1f(this.location(p, name), value);
  }
  private int(p: Program, name: string, value: number) {
    this.gl.uniform1i(this.location(p, name), value);
  }
  private vec2(p: Program, name: string, x: number, y: number) {
    this.gl.uniform2f(this.location(p, name), x, y);
  }
  private texture(p: Program, name: string, texture: WebGLTexture, unit: number) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    this.int(p, name, unit);
  }
  private uniforms(p: Program, state: RenderState) {
    this.vec2(p, "u_resolution", this.canvas.width, this.canvas.height);
    this.vec2(p, "u_pointer", ...state.pointer);
    this.vec2(p, "u_origin", ...state.origin);
    this.float(p, "u_time", state.time);
    this.float(p, "u_impact", state.impact);
    this.gl.uniform4fv(this.location(p, "u_params"), state.params);
    this.int(p, "u_effect", state.effect);
    this.int(p, "u_context", state.context);
    this.texture(p, "u_atlas", this.atlas, 5);
  }
  private target(width: number, height: number): Target {
    const gl = this.gl,
      texture = gl.createTexture()!,
      framebuffer = gl.createFramebuffer()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      this.hdr ? gl.RGBA16F : gl.RGBA8,
      width,
      height,
      0,
      gl.RGBA,
      this.hdr ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
      throw new Error("The GPU could not create a render target.");
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, framebuffer, width, height };
  }
  private resize(quality: number) {
    const bounds = this.canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, quality === 0 ? 1 : quality === 1 ? 1.5 : 2);
    const maxWidth = quality === 0 ? 800 : quality === 1 ? 1280 : 1920;
    const width = Math.max(2, Math.min(maxWidth, Math.round(bounds.width * ratio)));
    const height = Math.max(2, Math.round((width * bounds.height) / Math.max(bounds.width, 1)));
    if (width === this.canvas.width && height === this.canvas.height && this.targets.length) return;
    this.canvas.width = width;
    this.canvas.height = height;
    for (const t of this.targets) {
      this.gl.deleteTexture(t.texture);
      this.gl.deleteFramebuffer(t.framebuffer);
    }
    this.targets = [
      this.target(width, height),
      this.target(width, height),
      this.target(width, height),
      this.target(Math.ceil(width / 2), Math.ceil(height / 2)),
      this.target(Math.ceil(width / 2), Math.ceil(height / 2)),
      this.target(width, height),
      this.target(width, height),
    ];
    this.resetHistory = true;
  }
  private bind(target: Target | null) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target?.framebuffer ?? null);
    gl.viewport(0, 0, target?.width ?? this.canvas.width, target?.height ?? this.canvas.height);
  }
  private full() {
    this.gl.bindVertexArray(this.emptyVao);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    this.drawCalls++;
  }
  private initParticles() {
    const gl = this.gl,
      data = new Float32Array(10000 * 8);
    let seed = 42;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 10000; i++)
      data.set([(random() * 2 - 1) * 1.8, random() * 2 - 1, 0, 0, random() * 4, random(), 0, 0], i * 8);
    for (let i = 0; i < 2; i++) {
      const buffer = gl.createBuffer()!;
      this.particleBuffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_COPY);
      for (const instanced of [false, true]) {
        const vao = gl.createVertexArray()!;
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16);
        gl.vertexAttribDivisor(0, instanced ? 1 : 0);
        gl.vertexAttribDivisor(1, instanced ? 1 : 0);
        (instanced ? this.drawVaos : this.updateVaos).push(vao);
      }
    }
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
  private particles(state: RenderState, dt: number) {
    const gl = this.gl,
      source = this.particleIndex,
      dest = 1 - source;
    this.particleCount = Math.round(
      state.effect === 39 ? 100 + state.params[0] * 3900 : 300 + state.params[0] * 9700,
    );
    if (dt > 0) {
      gl.useProgram(this.update.program);
      this.uniforms(this.update, state);
      this.float(this.update, "u_dt", Math.min(dt, 0.05));
      this.float(this.update, "u_aspect", this.canvas.width / this.canvas.height);
      gl.bindVertexArray(this.updateVaos[source]);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.transform);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.particleBuffers[dest]);
      gl.enable(gl.RASTERIZER_DISCARD);
      gl.beginTransformFeedback(gl.POINTS);
      gl.drawArrays(gl.POINTS, 0, this.particleCount);
      gl.endTransformFeedback();
      gl.disable(gl.RASTERIZER_DISCARD);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
      this.particleIndex = dest;
      this.drawCalls++;
    }
    gl.useProgram(this.particle.program);
    this.uniforms(this.particle, state);
    this.float(this.particle, "u_aspect", this.canvas.width / this.canvas.height);
    gl.bindVertexArray(this.drawVaos[this.particleIndex]);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, state.effect === 39 ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.particleCount);
    gl.disable(gl.BLEND);
    this.drawCalls++;
  }
  reset() {
    this.resetHistory = true;
  }
  render(state: RenderState) {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    this.resize(state.quality);
    this.drawCalls = 0;
    this.particleCount = 0;
    if (this.lastEffect !== state.effect || this.lastContext !== state.context) {
      this.resetHistory = true;
      this.lastEffect = state.effect;
      this.lastContext = state.context;
    }
    const dt = Math.max(0, state.time - this.lastTime);
    this.lastTime = state.time;
    const [scene, baseline, processed, blurX, blurY, historyA, historyB] = this.targets;
    this.bind(scene);
    gl.useProgram(this.scene.program);
    this.uniforms(this.scene, state);
    this.int(this.scene, "u_enabled", 1);
    this.full();
    if ([5, 6, 7, 9, 39].includes(state.effect)) this.particles(state, dt);
    if (state.compare >= 0) {
      this.bind(baseline);
      gl.useProgram(this.scene.program);
      this.uniforms(this.scene, state);
      this.int(this.scene, "u_enabled", 0);
      this.full();
    }
    let input = scene.texture;
    if (state.effect === 6 || state.effect === 7) {
      const previous = this.historyIndex === 0 ? historyA : historyB,
        next = this.historyIndex === 0 ? historyB : historyA;
      this.bind(next);
      gl.useProgram(this.feedback.program);
      this.texture(this.feedback, "u_current", input, 0);
      this.texture(this.feedback, "u_previous", previous.texture, 1);
      this.float(
        this.feedback,
        "u_decay",
        this.resetHistory ? 0 : (0.8 + state.params[3] * 0.195) ** (dt * 60),
      );
      this.full();
      input = next.texture;
      this.historyIndex = 1 - this.historyIndex;
    }
    const blurInput = (texture: WebGLTexture, threshold: number) => {
      this.bind(blurX);
      gl.useProgram(this.blur.program);
      this.texture(this.blur, "u_input", texture, 0);
      const radius = 1.0 + state.params[1] * 9.0;
      this.vec2(this.blur, "u_direction", radius / scene.width, 0);
      this.float(this.blur, "u_threshold", threshold);
      this.full();
      this.bind(blurY);
      this.texture(this.blur, "u_input", blurX.texture, 0);
      this.vec2(this.blur, "u_direction", 0, radius / scene.height);
      this.float(this.blur, "u_threshold", 0);
      this.full();
    };
    const needsBlur = [2, 13, 15, 24, 30, 33, 35].includes(state.effect);
    if (needsBlur) blurInput(input, state.effect === 2 ? state.params[3] * 1.2 : 0);
    this.bind(state.style > 0 ? processed : null);
    gl.useProgram(this.post.program);
    this.uniforms(this.post, state);
    this.texture(this.post, "u_scene", input, 0);
    this.texture(this.post, "u_blur", needsBlur ? blurY.texture : input, 1);
    this.texture(this.post, "u_baseline", baseline.texture, 2);
    this.float(this.post, "u_compare", state.style > 0 ? -1 : state.compare);
    this.int(this.post, "u_style", 0);
    this.int(this.post, "u_styleOnly", 0);
    this.int(this.post, "u_finish", state.style > 0 ? 0 : 1);
    this.full();
    if (state.style > 0) {
      // Style the completed effect, so UV-based styles never bypass a material or transition.
      const styleNeedsBlur = [3, 6, 8].includes(state.style);
      if (styleNeedsBlur) blurInput(processed.texture, 0);
      this.bind(null);
      gl.useProgram(this.post.program);
      this.uniforms(this.post, state);
      this.texture(this.post, "u_scene", processed.texture, 0);
      this.texture(this.post, "u_blur", styleNeedsBlur ? blurY.texture : processed.texture, 1);
      this.texture(this.post, "u_baseline", baseline.texture, 2);
      this.float(this.post, "u_compare", state.compare);
      this.int(this.post, "u_style", state.style);
      this.int(this.post, "u_styleOnly", 1);
      this.int(this.post, "u_finish", 1);
      this.full();
    }
    this.resetHistory = false;
  }
  dispose() {
    const gl = this.gl;
    for (const t of this.targets) {
      gl.deleteTexture(t.texture);
      gl.deleteFramebuffer(t.framebuffer);
    }
    for (const b of this.particleBuffers) gl.deleteBuffer(b);
    for (const v of [...this.updateVaos, ...this.drawVaos, this.emptyVao]) gl.deleteVertexArray(v);
    for (const p of [this.scene, this.blur, this.post, this.feedback, this.update, this.particle])
      gl.deleteProgram(p.program);
    gl.deleteTexture(this.atlas);
    gl.deleteTransformFeedback(this.transform);
  }
}
