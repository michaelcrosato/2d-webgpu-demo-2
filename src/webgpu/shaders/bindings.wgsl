@group(1) @binding(0) var source: texture_2d<f32>;
@group(1) @binding(1) var blurred: texture_2d<f32>;
@group(1) @binding(2) var baseline: texture_2d<f32>;
@group(1) @binding(3) var atlas: texture_2d<f32>;
@group(1) @binding(4) var linearSampler: sampler;
@group(1) @binding(5) var nearestSampler: sampler;
@group(1) @binding(6) var<storage, read> field: array<vec2f>;
@group(1) @binding(7) var<storage, read> agents: array<Particle>;
fn sampleScene(uv: vec2f) -> vec3f { return textureSampleLevel(source, linearSampler, textureUV(clamp(uv, vec2f(0.001), vec2f(0.999))), 0.0).rgb; }
fn sampleBlur(uv: vec2f) -> vec3f { return textureSampleLevel(blurred, linearSampler, textureUV(uv), 0.0).rgb; }
fn sprite(local: vec2f, frame: i32) -> vec4f {
  if (any(local < vec2f(0)) || any(local >= vec2f(1))) { return vec4f(0); }
  return textureSampleLevel(atlas, nearestSampler, vec2f((local.x + f32(frame)) / 8.0, 1.0 - local.y), 0.0);
}
fn gridCell(uv: vec2f) -> vec2f {
  let size = vec2u(g.sim.xy);
  let pos = min(vec2u(clamp(textureUV(uv), vec2f(0), vec2f(0.9999)) * vec2f(size)), size - vec2u(1));
  return field[pos.y * size.x + pos.x];
}
