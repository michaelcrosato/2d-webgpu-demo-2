fn edgeAt(uv: vec2f, width: f32) -> f32 {
  let d = vec2f(width) / g.resolution;
  return length(sampleScene(uv + vec2f(d.x, 0)) - sampleScene(uv - vec2f(d.x, 0))) + length(sampleScene(uv + vec2f(0, d.y)) - sampleScene(uv - vec2f(0, d.y)));
}
fn artStyle(original: vec3f, uv: vec2f, s: i32, amount: f32, scale: f32, detail: f32) -> vec3f {
  var c = original; let lum = clamp(luma(c), 0.0, 1.0);
  if (s == 1) {
    let pixel = 2.0 + scale * 14.0; let grid = g.resolution / pixel; let q = (floor(uv * grid) + vec2f(0.5)) / grid;
    c = sampleScene(q); let levels = 3.0 + (1.0 - detail) * 9.0; c = floor(c * levels + vec3f(0.5)) / levels;
  }
  if (s == 2) { let bands = 2.0 + floor(scale * 7.0); c = floor(c * bands + vec3f(0.5)) / bands; c *= 1.0 - clamp(edgeAt(uv, 1.0 + detail * 2.0) * detail, 0.0, 0.85); }
  if (s == 3) {
    let offset = vec2f(noise(uv * 150.0), noise(uv * 150.0 + vec2f(17))) - vec2f(0.5);
    c = mix(sampleScene(uv + offset * 0.006), sampleBlur(uv), 0.2 + scale * 0.5);
    c = mix(c, vec3f(0.91, 0.89, 0.78), 0.20); c *= 0.90 + fbm(uv * g.resolution * 0.2) * detail * 0.3;
  }
  if (s == 4) {
    let edge = edgeAt(uv, 1.0 + detail * 2.0);
    var hatch = step(0.65, fract((uv.x + uv.y) * (70.0 + scale * 220.0))) * (1.0 - lum) * 0.5;
    hatch += step(0.76, fract((uv.x - uv.y) * (90.0 + scale * 220.0))) * max(0.0, 0.5 - lum);
    c = mix(vec3f(0.94, 0.91, 0.80), vec3f(0.08, 0.12, 0.13), clamp(edge * 2.0 + hatch + (1.0 - lum) * 0.28, 0.0, 1.0));
  }
  if (s == 5) {
    c = floor(c * 5.0 + vec3f(0.5)) / 5.0; let behind = sampleScene(uv + vec2f(0.003 + scale * 0.018, -0.003 - scale * 0.012));
    c -= vec3f(max(luma(behind) - lum, 0.0) * 0.7); c *= 0.92 + noise(uv * g.resolution) * detail * 0.15;
  }
  if (s == 6) {
    let p = uv - vec2f(0.5); let q = vec2f(0.5) + p * (1.0 + detail * 0.35 * dot(p, p)); c = sampleScene(q);
    let scan = 0.82 + 0.18 * sin(uv.y * g.resolution.y * (0.6 + scale * 2.0)); let column = i32(fm(floor(uv.x * g.resolution.x), 3.0));
    var phosphor = vec3f(0.78); phosphor[column] = 1.15; c *= scan * phosphor;
    if (any(q < vec2f(0)) || any(q > vec2f(1))) { c = vec3f(0.003); } c += sampleBlur(uv) * 0.2;
  }
  if (s == 7) {
    let cell = fract(uv * g.resolution / (3.0 + scale * 12.0)) - vec2f(0.5); let radius = sqrt(1.0 - lum) * (0.35 + detail * 0.35);
    let dotMask = 1.0 - smoothstep(radius - 0.045, radius + 0.045, length(cell)); c = mix(vec3f(0.96, 0.91, 0.76), vec3f(0.08, 0.12, 0.16), dotMask);
  }
  if (s == 8) { c = vec3f(0.012, 0.025, 0.045) + hue(uv.x * 0.3 + uv.y * 0.4 + g.time * 0.08) * edgeAt(uv, 1.0 + scale * 3.0) * 3.0 + sampleBlur(uv) * detail * 0.32; }
  if (s == 9) {
    var bayer = array<i32, 16>(0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
    let cell = vec2i(floor(uv * g.resolution / (1.0 + scale * 4.0))) % vec2i(4);
    let threshold = f32(bayer[cell.y * 4 + cell.x]) / 16.0;
    let level = i32(clamp(floor(clamp(lum * (0.6 + detail * 1.5), 0.0, 1.0) * 3.0 + threshold), 0.0, 3.0));
    var palette = array<vec3f, 4>(vec3f(0.07, 0.10, 0.22), vec3f(0.36, 0.24, 0.49), vec3f(0.91, 0.43, 0.43), vec3f(0.98, 0.91, 0.73)); c = palette[level];
  }
  return mix(original, c, amount);
}
@fragment fn post(input: VertexOutput) -> @location(0) vec4f {
  let uv = input.uv; let a = g.params; let e = select(g.config.x, -1, g.flags.z > 0.5); var c = sampleScene(uv);
  if (e == 10) {
    c=waterMaterial(uv,waterWaves(uv,waterMode()));
  }
  if((e==11 || e==41) && g.config.y==1){var wave=waterWaves(uv,waterMode());if(e==41){let cell=gridCell(uv);let dx=gridCell(uv+vec2f(1.0/g.sim.x,0)).x-gridCell(uv-vec2f(1.0/g.sim.x,0)).x;let dy=gridCell(uv+vec2f(0,1.0/g.sim.y)).x-gridCell(uv-vec2f(0,1.0/g.sim.y)).x;wave+=vec3f(cell.x*0.032,dx*2.4,dy*2.4);}c=waterMaterial(uv,wave);}
  if ((e == 11 && g.config.y!=1) || e == 22) {
    let delta = (uv - g.origin) * vec2f(g.resolution.x / g.resolution.y, 1); let dist = length(delta); let dir = normalize(delta + vec2f(0.0001));
    let age = g.time - g.impact; let activeWave = step(0.0, age) * exp(-age * 0.7); let radius = age * 0.35;
    var ring = exp(-pow((dist - radius) / (0.018 + select(a.w, a.y, e == 22) * 0.07), 2.0)) * activeWave;
    if (e == 11) { ring = sin(dist * (25.0 + a.y * 90.0) - g.time * 4.0) * exp(-dist * 2.0) * 0.25 + ring * sin(dist * 80.0 - age * 8.0); }
    var offset = dir * ring * a.x * select(0.025, 0.05, e == 22); offset.x *= g.resolution.y / g.resolution.x;
    c = sampleScene(uv + offset); if (e == 22) { c += vec3f(0.2, 0.7, 0.7) * ring * a.w; }
  }
  if (e == 12) { let heat = 1.0 - smoothstep(0.1, 0.35 + a.w * 0.5, uv.y); let n = vec2f(fbm(uv * (5.0 + a.y * 25.0) + vec2f(0, -g.time)), noise(uv * 35.0 - vec2f(g.time))) - vec2f(0.5); c = sampleScene(uv + n * heat * a.x * 0.07); }
  if (e == 13) {
    let p = coords(uv) - coords(g.pointer); var d = box(p, vec2f(0.35, 0.26)) - 0.045; if(g.config.y==1){d=circle(p,0.38);}let q = uv + normalize(p + vec2f(0.001)) * a.w * 0.025;
    var glass = sampleBlur(q) * 0.85 + vec3f(0.12, 0.17, 0.19) + vec3f(noise(uv * g.resolution) * 0.025); glass += vec3f(0.4, 0.7, 0.8) * exp(-abs(d) * 150.0); c = mix(c, glass, mask(d) * a.x);
  }
  if (e == 14) {
    let n = fbm(uv * (4.0 + a.y * 15.0) + vec2f(g.time * 0.035)); let d = n - (a.x * 1.1 - 0.05); let m = smoothstep(0.0, 0.018, d);
    let original=c;var background=vec3f(0.018,0.033,0.044);if(g.config.y==1){background=sampleBackdrop(uv);}c=mix(background,c,m);c+=vec3f(1.7,0.56,0.06)*(1.0-smoothstep(0.0,0.015+a.w*0.08,d))*m;
    if(g.config.y==1){c=mix(original,c,mask(gameSubject(coords(uv),e)));}
  }
  if (e == 15) {
    let band = floor(uv.y * 50.0); let interference = step(0.95, hash(vec2f(band, floor(g.time * 8.0)))); let q = uv + vec2f(interference * a.w * 0.04, 0);
    let scan = 0.6 + 0.4 * sin(uv.y * (150.0 + a.y * 600.0) - g.time * 3.0);let hologram=vec3f(0.1,0.95,1.4)*luma(sampleScene(q))*scan*(0.9+0.1*sin(g.time*12.0));var region=1.0;if(g.config.y==1){region=mask(gameSubject(coords(uv),e));}c=mix(c,hologram,a.x*region)+sampleBlur(uv)*0.2*region;
  }
  if (e == 23) { let d = uv - vec2f(0.5); let offset = d * pow(length(d), 0.5 + a.y * 2.0) * a.x * 0.08 * (1.0 + sin(g.time * 2.0) * a.w); c = vec3f(sampleScene(uv + offset).r, c.g, sampleScene(uv - offset).b); }
  if (e == 24) { let width = 0.02 + a.w * 0.25; c = mix(c, sampleBlur(uv), smoothstep(width, width * 2.0 + 0.01, abs(uv.y - g.pointer.y)) * a.x); }
  if (e == 25) { let lum = luma(c); var grade = mix(vec3f(lum), c, a.y * 2.0); grade = (grade - vec3f(0.5)) * (0.7 + a.w * 1.4) + vec3f(0.5); grade += mix(vec3f(-0.03, 0.03, 0.08), vec3f(0.1, 0.04, -0.05), clamp(lum, 0.0, 1.0)); c = mix(c, grade, a.x); }
  if (e == 26) { let radius = length((uv - vec2f(0.5)) * vec2f(1.1, 1)); c *= 1.0 - smoothstep(0.12 + a.y * 0.4, 0.8, radius) * a.x; c += vec3f((hash(uv * g.resolution + vec2f(fm(g.time * 31.0, 100.0))) - 0.5) * a.w * 0.10); }
  if (e == 27) {
    let band = floor(uv.y * (10.0 + a.y * 120.0)); let random = hash(vec2f(band, floor(g.time * 8.0))); let shift = (random - 0.5) * a.x * 0.24 * step(0.82 - a.x * 0.3, random); let q = uv + vec2f(shift, 0);
    let middle = sampleScene(q); c = vec3f(sampleScene(q + vec2f(a.w * 0.016, 0)).r, middle.g, sampleScene(q - vec2f(a.w * 0.016, 0)).b); c *= 0.9 + 0.1 * sin(uv.y * 600.0);
  }
  if (e == 37) {
    let d = coords(uv) - coords(g.pointer); let radius = 0.15 + a.y * 0.65; let m = 1.0 - smoothstep(radius, radius + 0.005 + a.w * 0.12, length(d));
    let inside = sampleScene(vec2f(1.0 - uv.x, uv.y)) * vec3f(0.5, 1.1, 1.3); c = mix(c, inside, m * a.x); c += vec3f(0.2, 0.95, 1.2) * exp(-abs(length(d) - radius) * 180.0) * a.x;
  }
  if (e == 2 || e == 47) { c += sampleBlur(uv) * a.x * 2.5; }
  var selectedStyle = 0; if (e >= 28 && e <= 35) { selectedStyle = e - 27; } if (e == 38) { selectedStyle = 9; }
  if (selectedStyle > 0) { c = artStyle(c, uv, selectedStyle, a.x, a.y, a.w); }
  if (g.config.w > 0) { c = artStyle(c, uv, g.config.w, 0.90, 0.45, 0.55); }
  if (g.flags.y > 0.5) { c = max(c, vec3f(0)); c = c / (vec3f(1) + c * 0.35); c = pow(c, vec3f(0.90)); }
  if (g.flags.x >= 0.0 && uv.x < g.flags.x) { c = textureSampleLevel(baseline, linearSampler, textureUV(uv), 0.0).rgb; c = max(c, vec3f(0)); c = pow(c / (vec3f(1) + c * 0.35), vec3f(0.90)); }
  return vec4f(c, 1);
}
@fragment fn blur(input: VertexOutput) -> @location(0) vec4f {
  let uv = input.uv; let d = g.extra.xy; let threshold = vec3f(g.extra.z);
  var c = max(sampleScene(uv) - threshold, vec3f(0)) * 0.227027;
  c += (max(sampleScene(uv + d * 1.384615) - threshold, vec3f(0)) + max(sampleScene(uv - d * 1.384615) - threshold, vec3f(0))) * 0.316216;
  c += (max(sampleScene(uv + d * 3.230769) - threshold, vec3f(0)) + max(sampleScene(uv - d * 3.230769) - threshold, vec3f(0))) * 0.070270;
  return vec4f(c, 1);
}
@fragment fn feedback(input: VertexOutput) -> @location(0) vec4f {
  return vec4f(max(sampleScene(input.uv), sampleBlur(input.uv) * g.extra.z), 1);
}
@fragment fn present(input: VertexOutput) -> @location(0) vec4f { return vec4f(sampleScene(input.uv), 1); }
