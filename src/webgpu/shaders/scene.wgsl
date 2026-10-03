fn shapeField(p: vec2f) -> f32 {
  if (g.config.y == 0) {
    return min(circle(p - vec2f(-0.64, 0.20), 0.28), min(box(p - vec2f(0.55, -0.12), vec2f(0.24)) - 0.03, circle(p - vec2f(0.05, 0.55), 0.19)));
  }
  if (g.config.y == 1) {
    return gameObstacles(p,effectId);
  }
  let q = vec2f(fm(p.x + 0.23, 0.46) - 0.23, p.y);
  return box(q - vec2f(0, -0.37), vec2f(0.17, 0.26));
}
fn softShadow(p: vec2f, light: vec2f, softness: f32) -> f32 {
  let delta = light - p; let maxDist = length(delta); let direction = delta / max(maxDist, 0.001);
  var result = 1.0; var t = 0.02;
  for (var i = 0; i < 32; i++) {
    let d = shapeField(p + direction * t);
    if (d < 0.001) { return 0.0; }
    result = min(result, softness * d / t); t += clamp(d, 0.009, 0.15);
    if (t > maxDist) { break; }
  }
  return clamp(result, 0.0, 1.0);
}
fn relief(p: vec2f) -> f32 { if(g.config.y==1 && effectId==1){return max(0.0,-gameSubject(p,1))*2.0+noise(p*(12.0+g.params.y*32.0))*0.06;}return 0.12 * sin(p.x * (5.0 + g.params.y * 22.0)) * cos(p.y * 11.0) + 0.35 * exp(-dot(p, p) * 5.0); }
fn abstractScene(p: vec2f, e: i32) -> vec3f {
  var color = vec3f(0.025, 0.065, 0.08) + vec3f(0.012, 0.022, 0.025) * p.y;
  let grid = abs(fract(p * 5.0) - vec2f(0.5));
  color += vec3f(0.023) * (1.0 - smoothstep(0.012, 0.028, min(grid.x, grid.y)));
  if (e == 5 || e == 6 || e == 7 || e == 9 || e == 39 || (e >= 40 && e != 47)) { return color * 0.6; }
  let d = circle(p - vec2f(-0.64, 0.20), 0.28);
  color = mix(color, vec3f(1, 0.35, 0.26) * (0.65 + 0.35 * smoothstep(-0.28, 0.0, d)), mask(d));
  let q = p - vec2f(0.55, -0.12); let b = box(q, vec2f(0.24)) - 0.03;
  color = mix(color, vec3f(0.46, 0.36, 0.85) * (0.65 + 0.4 * (q.y + 0.24)), mask(b));
  color = mix(color, vec3f(1, 0.82, 0.28), mask(circle(p - vec2f(0.05, 0.55), 0.19)));
  color += vec3f(0.25, 1.3, 1) * mask(abs(length(p - vec2f(-0.08, -0.40)) - 0.20) - 0.018);
  for (var i = 0; i < 7; i++) {
    let k = f32(i); let center = vec2f(-0.85 + k * 0.28, -0.76 + sin(k * 1.4 + g.time) * 0.04);
    color += hue(k / 7.0) * mask(circle(p - center, 0.025)) * 1.4;
  }
  return color;
}
fn landscape(p: vec2f, e: i32) -> vec3f {
  var daylight = 0.25;
  if (e == 21) { daylight = 0.5 + 0.5 * sin(g.params.x * 6.28318 + g.time * 0.12); }
  let sky = mix(vec3f(0.022, 0.075, 0.11), vec3f(0.36, 0.66, 0.72), daylight);
  var color = sky + vec3f(0.07, 0.11, 0.09) * (1.0 - p.y) * 0.35;
  if (e == 21) { color = (color - vec3f(0.25)) * (0.6 + g.params.y * 1.2) + vec3f(0.25); }
  var camera = 0.0;
  if (e == 16) { camera = (g.time * 0.18 + (g.pointer.x - 0.5) * 2.0) * g.params.x; }
  for (var i = 0; i < 4; i++) {
    let layer = f32(i); let x = p.x + camera * (0.12 + layer * (0.12 + g.params.w * 0.12));
    var scale = 1.0; if (e == 16) { scale = 0.6 + g.params.y * 1.4; }
    let h = -0.12 - layer * 0.13 + sin(x * (2.0 + layer) * scale + layer * 2.1) * 0.15 + sin(x * 7.0 * scale) * 0.04;
    let mountain = mix(sky, vec3f(0.02, 0.11 + layer * 0.027, 0.12), 0.35 + layer * 0.17);
    color = mix(color, mountain, mask(p.y - h));
  }
  var moon = vec2f(0.9, 0.65);
  if (e == 21) { let phase = g.params.x * 6.28318 + g.time * 0.12; moon = vec2f(cos(phase), 0.40 + sin(phase) * 0.35); }
  color += vec3f(0.9, 0.98, 0.78) * mask(circle(p - moon, 0.095)) * (0.7 + daylight);
  let starCell = floor(p * 55.0);
  let star = step(0.996, hash(starCell)) * exp(-length(fract(p * 55.0) - vec2f(0.5)) * 12.0);
  color += vec3f(star * (1.0 - daylight) * select(0.7, g.params.w * 2.0, e == 21));
  for (var i = 0; i < 8; i++) {
    let k = f32(i); let x = -1.8 + k * 0.49 + sin(k * 8.0) * 0.1 - camera * 0.5;
    var sway = 0.0; if (e == 17) { sway = sin(g.time + k) * g.params.x * 0.09; }
    let q = p - vec2f(x, -0.15);
    color = mix(color, vec3f(0.08, 0.14, 0.12), mask(box(q - vec2f(0, -0.28), vec2f(0.025, 0.38))));
    for (var j = 0; j < 3; j++) {
      let z = f32(j); let yy = q.y + 0.02 - z * 0.15;
      let tree = max(abs(q.x - sway * max(q.y + 0.5, 0.0)) - (0.31 - z * 0.05 - yy * 0.43), max(-yy - 0.03, yy - 0.43));
      color = mix(color, vec3f(0.04, 0.20 + z * 0.025, 0.18), mask(tree));
    }
  }
  let ground = -0.69 + sin(p.x * 3.0) * 0.035;
  color = mix(color, vec3f(0.035, 0.09, 0.095) + vec3f(fbm(p * 22.0) * 0.065), mask(p.y - ground));
  color += vec3f(0.09, 0.40, 0.22) * exp(-abs(p.y - ground) * 120.0);
  for (var i = 0; i < 3; i++) {
    let k = f32(i); let q = p - vec2f(-0.66 + k * 0.65, -0.43 + k * 0.10);
    let rock = box(q, vec2f(0.23, 0.047)) - 0.014;
    color = mix(color, vec3f(0.10, 0.24, 0.22) + vec3f(noise(p * 34.0) * 0.05), mask(rock));
    color += vec3f(0.12, 0.45, 0.26) * mask(rock) * smoothstep(0.018, 0.047, q.y);
    let gem = q - vec2f(0, 0.18 + sin(g.time * 1.4 + k) * 0.027);
    color += vec3f(0.4, 1.5, 0.95) * mask(abs(gem.x) + abs(gem.y) - 0.055);
  }
  let heroUV = (p - vec2f(-0.12, -0.62)) / vec2f(0.13, 0.19) + vec2f(0.5);
  let hero = sprite(heroUV, i32(fm(floor(g.time * 6.0), 4.0)));
  return mix(color, hero.rgb, hero.a);
}
fn city(p: vec2f, e: i32) -> vec3f {
  var day = 0.12; if (e == 21) { day = 0.5 + 0.5 * sin(g.params.x * 6.28318 + g.time * 0.12); }
  var color = mix(vec3f(0.035, 0.055, 0.12), vec3f(0.56, 0.61, 0.67), day) + vec3f(0.09, 0.07, 0.11) * (1.0 - p.y) * 0.3;
  if (e == 21) { color = (color - vec3f(0.25)) * (0.6 + g.params.y * 1.2) + vec3f(0.25); }
  for (var layer = 0; layer < 3; layer++) {
    let l = f32(layer); var cam = 0.0;
    if (e == 16) { cam = g.time * 0.12 * g.params.x * (0.2 + l * 0.3) + (g.pointer.x - 0.5) * l; }
    let column = floor((p.x + cam) * (3.0 + l)); let h = hash(vec2f(column, l)) * 0.6 + 0.15 - l * 0.15;
    let cell = vec2f(fract((p.x + cam) * (3.0 + l)) - 0.5, p.y);
    let building = max(abs(cell.x) - 0.44, p.y - h);
    color = mix(color, vec3f(0.045 + l * 0.014, 0.075 + l * 0.018, 0.12 + l * 0.02), mask(building));
    let win = fract(vec2f((p.x + cam) * (18.0 + l * 4.0), p.y * 20.0));
    let lit = step(0.50, hash(floor(vec2f((p.x + cam) * (18.0 + l * 4.0), p.y * 20.0))));
    let windows = step(0.25, win.x) * step(win.x, 0.70) * step(0.2, win.y) * step(win.y, 0.65) * lit * mask(building) * step(-0.58, p.y);
    color += vec3f(1.1, 0.68, 0.27) * windows * (1.0 - day * 0.75);
  }
  let tiles = abs(fract(p * vec2f(6, 9)) - vec2f(0.5));
  let floorColor = vec3f(0.13, 0.17, 0.21) * (0.7 + noise(p * 30.0) * 0.3) * smoothstep(0.01, 0.025, min(tiles.x, tiles.y));
  color = mix(color, floorColor, mask(p.y + 0.63));
  color += vec3f(0.15, 0.85, 1.6) * mask(box(p - vec2f(0.45, 0.10), vec2f(0.14, 0.035)));
  return color;
}
@fragment fn scene(input: VertexOutput) -> @location(0) vec4f {
  let uv = input.uv; let p = coords(uv); let a = g.params;
  let e = select(-1, effectId, g.config.z == 1);
  var color = abstractScene(p, effectId);
  if (g.config.y == 1) { color = gameScene(p,effectId,g.config.z); }
  if (g.config.y == 2) { color = city(p, e); }
  if ((effectId == 16 || effectId == 17 || effectId == 18 || effectId == 21) && g.config.y == 0) { color = landscape(p, e); }
  if(effectId==10 || (g.config.y==1 && effectId==41)){color=waterEnvironment(p,waterMode());}
  if (e == 0) {
    let light = coords(g.pointer); let dist = length(p - light);
    let shade = softShadow(p, light, mix(35.0, 3.0, a.w));
    color *= 0.24 + shade * exp(-dist * dist / (0.18 + a.y * 2.5)) * a.x * 2.5;
    color += vec3f(1, 0.82, 0.47) * exp(-dist * dist * 80.0) * 0.12 * a.x;
    color += vec3f(2, 1.5, 0.8) * mask(circle(p - light, 0.016));
  }
  if (e == 1) {
    let eps = 0.003; let dx = relief(p + vec2f(eps, 0)) - relief(p - vec2f(eps, 0)); let dy = relief(p + vec2f(0, eps)) - relief(p - vec2f(0, eps));
    let n = normalize(vec3f(-dx / (2.0 * eps) * a.w, -dy / (2.0 * eps) * a.w, 1));
    let light = normalize(vec3f(coords(g.pointer) - p, 0.55));
    let diffuse = max(dot(n, light), 0.0); let spec = pow(max(dot(reflect(-light, n), vec3f(0, 0, 1)), 0.0), 24.0);
    color = color * (0.25 + diffuse * a.x * 2.2) + vec3f(0.8, 0.9, 1) * spec * a.x;
  }
  if (e == 3) {
    let q = p - coords(g.pointer); let angle = atan2(q.y, q.x);
    let beams = pow(max(sin(angle * (12.0 + a.y * 50.0) + g.time * 0.05), 0.0), 8.0);
    let mist = 0.3 + fbm(p * 4.0 + vec2f(g.time * 0.10)) * a.w;
    color += vec3f(0.8, 0.72, 0.39) * beams * mist * exp(-length(q) * 0.7) * a.x;
  }
  if (e == 4) { let d = shapeField(p); let radius = 0.02 + a.y * 0.18; let ao = exp(-abs(d) / radius * (0.5 + a.w * 2.0)) * step(0.0, d); color *= 1.0 - ao * a.x * (0.4 + a.w * 0.6); }
  if (e == 8) {
    let q = p - vec2f(0, -0.66); let h = 0.25 + a.x * 1.15;
    let smokeNoise = fbm(vec2f(q.x * 5.0, q.y * 4.0 - g.time * 0.6));
    let smoke = exp(-pow((q.x - sin(q.y * 3.0 + g.time) * 0.11) / (0.08 + max(q.y, 0.0) * 0.25), 2.0)) * smoothstep(h * 0.4, h, q.y) * (1.0 - smoothstep(h, h + 0.65, q.y));
    color = mix(color, vec3f(0.26, 0.28, 0.29), smoke * smokeNoise * a.w * 0.7);
    let n = fbm(vec2f(q.x * (6.0 + a.y * 14.0), q.y * 6.0 - g.time * 2.0));
    let envelope = (1.0 - q.y / h) - abs(q.x) / (0.09 + max(0.0, h - q.y) * 0.17);
    let flame = smoothstep(n * 0.62, n * 0.62 + 0.16, envelope) * step(0.0, q.y) * step(q.y, h);
    color += mix(vec3f(1.2, 0.08, 0.005), vec3f(2.3, 1.5, 0.12), clamp(envelope - n, 0.0, 1.0)) * flame;
  }
  if (e == 17) {
    let bladeId = floor(p.x * (20.0 + a.y * 55.0)); let root = bladeId / (20.0 + a.y * 55.0);
    let height = 0.10 + hash(vec2f(bladeId, 0)) * a.w * 0.30; let y = p.y + 0.69;
    let bend = sin(g.time * 1.5 + root * (2.0 + a.y * 5.0)) * a.x * y * y * 4.0;
    let blade = abs(p.x - root - bend) - (1.0 - y / height) * 0.008;
    color = mix(color, vec3f(0.32, 0.64, 0.27), mask(blade) * step(0.0, y) * step(y, height));
  }
  if (e == 18) {
    let h = -0.45 + sin(p.x * (2.0 + a.y * 7.0) + g.time * 0.2) * a.x * 0.23 + fbm(vec2f(p.x * (2.0 + a.y * 5.0), g.time * 0.1)) * 0.26;
    let d = p.y - h; let layers = sin((p.y + fbm(p * 3.0) * 0.15) * (15.0 + a.w * 40.0));
    let rock = mix(vec3f(0.16, 0.12, 0.15), vec3f(0.36, 0.25, 0.22), layers * 0.5 + 0.5);
    color = mix(color, rock + vec3f(noise(p * 80.0) * 0.08), mask(d)); color += vec3f(0.4, 0.82, 0.46) * exp(-abs(d) * 150.0);
  }
  if (e == 19) {
    let density = 4.0 + a.y * 20.0; let tile = floor((p + vec2f(g.time * 0.05, 0)) * density);
    let frame = 4 + i32(fm(tile.x + tile.y + floor(hash(tile) * a.w * 5.0), 4.0));
    let texel = sprite(fract((p + vec2f(g.time * 0.05, 0)) * density), frame);
    var coverage = 1.0; if (g.config.y != 0) { coverage = 1.0 - smoothstep(-0.55, -0.55 + a.x * 0.6 + 0.001, p.y); }
    color = mix(color, texel.rgb, coverage * a.x);
  }
  if (e == 20) {
    let size = 0.16 + a.y * 0.45; let local = (p - vec2f(0, -0.15)) / vec2f(size, size * 1.25) + vec2f(0.5);
    let hero = sprite(local, i32(fm(floor(g.time * (2.0 + a.w * 10.0)), 4.0)));
    color = mix(color, hero.rgb, hero.a * a.x);
    for (var i = 0; i < 4; i++) { let q = (p - vec2f(-0.55 + f32(i) * 0.36, 0.55)) / vec2f(0.18, 0.22) + vec2f(0.5); let f = sprite(q, i); color = mix(color, f.rgb, f.a); }
  }
  if (e == 36) {
    var value = 0.0;
    for (var i = 0; i < 5; i++) { let k = f32(i); let center = vec2f(sin(g.time * 0.5 + k * 1.8), cos(g.time * 0.4 + k * 2.1)) * vec2f(0.20 + a.y * 0.6, 0.34); let d = p - center; value += (0.015 + a.x * 0.055) / max(dot(d, d), 0.002); }
    let mouse = p - coords(g.pointer); value += 0.024 / max(dot(mouse, mouse), 0.002);
    let blob = smoothstep(1.1, 1.15 + a.w * 0.25, value);
    color = mix(color, mix(vec3f(0.09, 0.4, 0.2), vec3f(0.68, 0.97, 0.32), smoothstep(1.1, 2.5, value)), blob);
    color += vec3f(0.65, 1, 0.5) * exp(-abs(value - 1.25) * 14.0) * 0.3;
  }
  if (e == 40 || (e == 41 && g.config.y!=1) || e == 42 || e == 45 || e == 46) {
    let cell = gridCell(uv); var simulationColor = vec3f(0);
    if (e == 40) { let pigment = clamp(cell.y * 2.2, 0.0, 1.0); simulationColor = mix(vec3f(0.015, 0.07, 0.13), vec3f(0.95, 0.55, 0.20), pigment); simulationColor += vec3f(0.15, 0.65, 0.60) * exp(-abs(cell.y - 0.24) * 25.0); }
    if (e == 41) { simulationColor = mix(vec3f(0.025, 0.10, 0.20), vec3f(0.18, 1.10, 1.25), clamp(cell.x * 3.0 + 0.4, 0.0, 1.0)); simulationColor *= 0.45 + 0.55 * cos(cell.x * 40.0); }
    if (e == 42) { simulationColor = mix(vec3f(0.01, 0.035, 0.075), hue(cell.y * 0.5 + g.time * 0.03) * 1.2, clamp(cell.x, 0.0, 1.0)); }
    if (e == 45) { let alive = cell.x; let local = fract(textureUV(uv) * g.sim.xy); let border = smoothstep(0.02, 0.12, min(min(local.x, local.y), min(1.0 - local.x, 1.0 - local.y))); simulationColor = vec3f(0.012, 0.035, 0.05) + vec3f(0.45, 1.1, 0.70) * (alive + cell.y * g.params.w * 0.4) * border; }
    if (e == 46) { let point = textureUV(uv) * g.sim.xy; let dist = length(point - cell); simulationColor = hue(hash(cell) * 0.8) * (0.4 + (0.2 + g.params.w * 0.6) * exp(-dist * 0.04)); simulationColor += vec3f(exp(-dist * 0.7)); }
    var coverage = 1.0; if (g.config.y == 1) { coverage = 1.0 - smoothstep(-0.50, 0.05, p.y);if(e==42){let q=(p-vec2f(-0.14,-0.03))/vec2f(0.68,0.68);coverage=exp(-dot(q,q))*0.75;}if(e==45){coverage=0.0;for(var i=0;i<4;i++){coverage=max(coverage,mask(box(p-vec2f(-1.0+f32(i)*0.66,-0.22),vec2f(0.25,0.26))));}}if(e==46){coverage=0.75;}} if (g.config.y == 2) { coverage = mask(box(p, vec2f(1.3, 0.65))); }
    color = mix(color, simulationColor, coverage);
  }
  if (e == 44) { color += vec3f(0.20, 0.65, 0.75) * exp(-abs(circle(p, 0.28)) * 120.0); color += vec3f(0.4, 0.5, 0.2) * mask(box(p - vec2f(0.62, -0.48), vec2f(0.07, 0.22))); }
  return vec4f(color, 1);
}
