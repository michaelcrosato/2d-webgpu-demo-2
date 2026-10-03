@group(1) @binding(0) var<storage, read> previousField: array<vec2f>;
@group(1) @binding(1) var<storage, read_write> nextField: array<vec2f>;
fn cellAt(p: vec2i) -> vec2f {
  let size = vec2i(g.sim.xy); let q = (p % size + size) % size;
  return previousField[u32(q.y * size.x + q.x)];
}
fn bilinearCell(p: vec2f) -> vec2f {
  let base = vec2i(floor(p)); let f = fract(p);
  return mix(mix(cellAt(base), cellAt(base + vec2i(1, 0)), f.x), mix(cellAt(base + vec2i(0, 1)), cellAt(base + vec2i(1)), f.x), f.y);
}
@compute @workgroup_size(8, 8) fn updateField(@builtin(global_invocation_id) id: vec3u) {
  let size = vec2u(g.sim.xy); if (any(id.xy >= size)) { return; }
  let p = vec2i(id.xy); let index = id.y * size.x + id.x; let uv = vec2f(id.xy) / vec2f(size); let a = g.params; let e = g.config.x;
  let mouse = textureUV(g.pointer) * vec2f(size);
  if (g.sim.z > 0.5) {
    var initial = vec2f(0);
    if (e == 40) {
      let tile = floor(vec2f(p) / (8.0 + a.y * 24.0)); let local = fract(vec2f(p) / (8.0 + a.y * 24.0)) - vec2f(0.5);
      let seed = step(length(local), 0.18) * step(0.4, hash(tile)); initial = vec2f(1.0 - seed * 0.5, seed * 0.45);
    }
    if (e == 41) { let d = (vec2f(p) - mouse) / vec2f(size); let demo = uv - vec2f(0.5, 0.78); initial = vec2f((exp(-dot(d, d) * 600.0) + exp(-dot(demo, demo) * 700.0)) * a.x * 0.6 + sin(uv.x * 40.0) * sin(uv.y * 32.0) * a.x * 0.01, 0); }
    if (e == 42) { let pattern = fbm(uv * (3.0 + a.y * 8.0)); initial = vec2f(smoothstep(0.32, 0.68, pattern) * a.x, pattern); }
    if (e == 45) { let density = 0.05 + a.x * 0.3; let block = floor(vec2f(p) / (1.0 + floor(a.y * 3.0))); let alive = step(hash(block), density); initial = vec2f(alive, alive); }
    if (e == 46) {
      let spacing = 12.0 + (1.0 - a.x) * 60.0; let tile = floor(vec2f(p) / spacing);
      let jitter = vec2f(hash(tile), hash(tile + vec2f(7.3))) - vec2f(0.5) + vec2f(sin(g.time * 0.4 + hash(tile) * 6.0), cos(g.time * 0.3 + hash(tile) * 6.0)) * 0.2;
      let seed = floor((tile + vec2f(0.5) + jitter * a.y * 0.9) * spacing);
      initial = vec2f(-1); if (all(abs(vec2f(p) - seed) < vec2f(0.5))) { initial = seed; }
      if (length(vec2f(p) - floor(mouse)) < 0.5) { initial = floor(mouse); }
    }
    nextField[index] = initial; return;
  }
  let old = cellAt(p);
  if (e == 40) {
    let lap = (cellAt(p + vec2i(1, 0)) + cellAt(p - vec2i(1, 0)) + cellAt(p + vec2i(0, 1)) + cellAt(p - vec2i(0, 1))) * 0.2
      + (cellAt(p + vec2i(1, 1)) + cellAt(p + vec2i(1, -1)) + cellAt(p + vec2i(-1, 1)) + cellAt(p - vec2i(1, 1))) * 0.05 - old;
    let reaction = old.x * old.y * old.y; let feed = 0.020 + a.x * 0.045; let kill = 0.045 + a.w * 0.023;
    var update = old + vec2f(lap.x * 1.0 - reaction + feed * (1.0 - old.x), lap.y * 0.5 + reaction - (feed + kill) * old.y);
    if (length(vec2f(p) - mouse) < 4.0) { update = vec2f(0.5, 0.45); }
    nextField[index] = clamp(update, vec2f(0), vec2f(1));
  }
  if (e == 41) {
    let lap = cellAt(p + vec2i(1, 0)).x + cellAt(p - vec2i(1, 0)).x + cellAt(p + vec2i(0, 1)).x + cellAt(p - vec2i(0, 1)).x - 4.0 * old.x;
    let d = (vec2f(p) - mouse) / vec2f(size); let age = g.time - g.impact;
    let demo = uv - vec2f(0.5 + sin(g.time * 0.4) * 0.15, 0.78);
    var injection = (sin(g.time * 4.0) * exp(-dot(d, d) * 1800.0) + sin(g.time * 5.0) * exp(-dot(demo, demo) * 1800.0)) * a.x * 0.009;
    if (age >= 0.0 && age < 0.12) { let click = textureUV(g.origin) * vec2f(size); injection += exp(-dot(vec2f(p) - click, vec2f(p) - click) * 0.04) * a.x * 0.06; }
    let velocity = (old.y + lap * (0.08 + a.y * 0.14) + injection) * (0.94 + a.w * 0.055);
    nextField[index] = vec2f(clamp(old.x + velocity, -1.0, 1.0), clamp(velocity, -0.5, 0.5));
  }
  if (e == 42) {
    let delta = (vec2f(p) - mouse) / vec2f(size); let scale = 2.0 + a.y * 9.0;
    let flow = vec2f(sin(uv.y * scale + g.time * 0.25), cos(uv.x * scale - g.time * 0.2)) + vec2f(-delta.y, delta.x) / (0.03 + dot(delta, delta)) * 0.15;
    let sample = bilinearCell(vec2f(p) - flow * max(g.flags.w, 0.016) * 30.0);
    let injection = exp(-dot(delta, delta) * 1500.0) * a.x * 0.035;
    nextField[index] = vec2f(clamp(sample.x * (0.97 + a.w * 0.029) + injection, 0.0, 1.0), sample.y);
  }
  if (e == 45) {
    var neighbors = 0.0;
    for (var y = -1; y <= 1; y++) { for (var x = -1; x <= 1; x++) { if (x != 0 || y != 0) { neighbors += cellAt(p + vec2i(x, y)).x; } } }
    let alive = neighbors == 3.0 || (old.x > 0.5 && neighbors == 2.0);
    nextField[index] = vec2f(select(0.0, 1.0, alive), select(max(0.0, old.y - 0.06), min(1.0, old.y + 0.10), alive));
  }
  if (e == 46) {
    var best = old; var bestDistance = 1e20; if (best.x >= 0.0) { bestDistance = dot(vec2f(p) - best, vec2f(p) - best); }
    let jump = i32(g.sim.w);
    for (var y = -1; y <= 1; y++) { for (var x = -1; x <= 1; x++) {
      let neighbor = p + vec2i(x, y) * jump; if (any(neighbor < vec2i(0)) || any(neighbor >= vec2i(size))) { continue; }
      let candidate = previousField[u32(neighbor.y) * size.x + u32(neighbor.x)];
      if (candidate.x >= 0.0) { let delta = vec2f(p) - candidate; let distance = dot(delta, delta); if (distance < bestDistance) { best = candidate; bestDistance = distance; } }
    } }
    nextField[index] = best;
  }
}
