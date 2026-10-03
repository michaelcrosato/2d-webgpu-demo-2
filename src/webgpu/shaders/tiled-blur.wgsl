@group(1) @binding(0) var inputImage: texture_2d<f32>;
@group(1) @binding(1) var outputImage: texture_storage_2d<rgba16float, write>;
var<workgroup> tile: array<vec4f, 80>;
fn readScaled(p: vec2i) -> vec4f {
  let inputSize = vec2f(textureDimensions(inputImage)); let outputSize = vec2f(textureDimensions(outputImage));
  let q = vec2i((vec2f(p) + vec2f(0.5)) * inputSize / outputSize);
  let color = textureLoad(inputImage, clamp(q, vec2i(0), vec2i(inputSize) - vec2i(1)), 0);
  return vec4f(max(color.rgb - vec3f(g.extra.z), vec3f(0)), 1);
}
@compute @workgroup_size(64) fn tiledBlur(@builtin(workgroup_id) group: vec3u, @builtin(local_invocation_id) local: vec3u) {
  let horizontal = g.extra.x > 0.5; let axis = select(vec2i(0, 1), vec2i(1, 0), horizontal);
  let p = select(vec2i(i32(group.y), i32(group.x * 64u + local.x)), vec2i(i32(group.x * 64u + local.x), i32(group.y)), horizontal);
  tile[local.x + 8u] = readScaled(p);
  if (local.x < 8u) { tile[local.x] = readScaled(p - axis * 8); tile[local.x + 72u] = readScaled(p + axis * 64); }
  // Every invocation reaches this barrier, including lanes outside the image edge.
  workgroupBarrier();
  let size = vec2i(textureDimensions(outputImage)); if (any(p >= size)) { return; }
  var color = vec4f(0); var weightSum = 0.0; let sigma = 0.7 + g.params.y * 4.0;
  for (var k = -8; k <= 8; k++) { let weight = exp(-0.5 * f32(k * k) / (sigma * sigma)); color += tile[u32(i32(local.x) + 8 + k)] * weight; weightSum += weight; }
  textureStore(outputImage, p, vec4f((color / weightSum).rgb, 1));
}
