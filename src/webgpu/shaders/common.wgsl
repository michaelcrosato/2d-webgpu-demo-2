struct Globals {
  resolution: vec2f,
  pointer: vec2f,
  origin: vec2f,
  time: f32,
  impact: f32,
  params: vec4f,
  config: vec4i, // effect, context, enabled, art style
  flags: vec4f, // comparison divider, tone map, style only, simulation dt
  extra: vec4f, // blur direction xy, threshold, instance count
  sim: vec4f, // grid width, height, reset, jump distance
}
@group(0) @binding(0) var<uniform> g: Globals;
struct Particle { state: vec4f, extra: vec4f }
struct VertexOutput { @builtin(position) position: vec4f, @location(0) uv: vec2f }
@vertex fn fullscreen(@builtin(vertex_index) index: u32) -> VertexOutput {
  let p = vec2f(f32((index << 1u) & 2u), f32(index & 2u));
  return VertexOutput(vec4f(p * 2.0 - vec2f(1.0), 0.0, 1.0), p);
}
fn fm(a: f32, b: f32) -> f32 { return a - floor(a / b) * b; }
fn hash(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453); }
fn noise(p: vec2f) -> f32 {
  let i = floor(p); let f = fract(p); let u = f * f * (vec2f(3.0) - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2f(1, 0)), u.x), mix(hash(i + vec2f(0, 1)), hash(i + vec2f(1)), u.x), u.y);
}
fn fbm(p0: vec2f) -> f32 {
  var p = p0; var value = 0.0; var amplitude = 0.5;
  for (var i = 0; i < 4; i++) { value += amplitude * noise(p); p = p * 2.03 + vec2f(3.7); amplitude *= 0.5; }
  return value;
}
fn box(p: vec2f, size: vec2f) -> f32 { let q = abs(p) - size; return length(max(q, vec2f(0))) + min(max(q.x, q.y), 0.0); }
fn circle(p: vec2f, radius: f32) -> f32 { return length(p) - radius; }
fn mask(d: f32) -> f32 { return 1.0 - smoothstep(-0.003, 0.003, d); }
fn luma(c: vec3f) -> f32 { return dot(c, vec3f(0.2126, 0.7152, 0.0722)); }
fn coords(uv: vec2f) -> vec2f { return (uv * 2.0 - vec2f(1)) * vec2f(g.resolution.x / g.resolution.y, 1); }
fn hue(t: f32) -> vec3f { return vec3f(0.55) + 0.45 * cos(6.28318 * (vec3f(0, 0.33, 0.67) + vec3f(t))); }
fn textureUV(uv: vec2f) -> vec2f { return vec2f(uv.x, 1.0 - uv.y); }
