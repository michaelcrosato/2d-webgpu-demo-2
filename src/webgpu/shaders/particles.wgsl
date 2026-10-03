@group(1) @binding(0) var<storage, read> previous: array<Particle>;
@group(1) @binding(1) var<storage, read_write> next: array<Particle>;
@compute @workgroup_size(64) fn updateParticles(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x; let count = u32(g.extra.w); if (index >= count) { return; }
  let old = previous[index]; var pos = old.state.xy; var velocity = old.state.zw; let seed = old.extra.y;
  let dt = g.flags.w; let aspect = g.resolution.x / g.resolution.y; let e = g.config.x;
  let mouse = (g.pointer * 2.0 - vec2f(1)) * vec2f(aspect, 1);
  if (e == 9) { velocity = vec2f((g.params.w - 0.5) * 0.6, -0.25 - seed * 0.45); }
  else if(e==6 && g.config.y==1){let origin=vec2f(sin(g.time*0.8)*0.78-0.18,-0.29);pos=origin+vec2f(-seed*0.15,sin(seed*35.0)*0.025);velocity=vec2f(-0.25,0);}
  else if(e==5 && g.config.y==1){let d=mouse-pos;let radius=0.15+seed*0.4;let angle=g.time*(0.3+seed*0.25)+seed*37.0;let orbitPoint=mouse*0.65+vec2f(cos(angle)*radius,sin(angle)*radius*0.75);velocity=(orbitPoint-pos)*1.5;}
  else if (e == 43) {
    var center = vec2f(0); var alignment = vec2f(0); var separation = vec2f(0); var neighbors = 0.0;
    // Deterministic neighborhood sampling limits the cost to O(N * 64), rather than O(N^2).
    for (var j = 0u; j < 64u; j++) {
      let otherIndex = (index * 17u + j * max(1u, count / 64u)) % count;
      let other = previous[otherIndex]; let delta = other.state.xy - pos; let distance = length(delta);
      if (otherIndex != index && distance < 0.10 + g.params.y * 0.45) {
        center += other.state.xy; alignment += other.state.zw; separation -= delta / max(distance * distance, 0.01); neighbors += 1.0;
      }
    }
    var force = (mouse - pos) * 0.15;
    if (neighbors > 0.0) { force += (center / neighbors - pos) * 0.4 + (alignment / neighbors - velocity) * 0.7 + separation / neighbors * (0.01 + g.params.w * 0.10); }
    velocity += force * dt; let speed = length(velocity); velocity = normalize(velocity + vec2f(0.0001)) * clamp(speed, 0.08, 0.45);
  }
  else if (e == 44) {
    velocity.y -= dt * (0.25 + g.params.y * 0.9); velocity.x += sin(seed * 100.0) * dt * 0.07;
    var floorY = -0.88; if (g.config.y == 1) { floorY = -0.69; } if (g.config.y == 2) { floorY = -0.63; } let restitution = 0.3 + g.params.w * 0.65;
    if (pos.y < floorY) { pos.y = floorY + 0.008; velocity.y = abs(velocity.y) * restitution; }
    let distance = length(pos); if (distance < 0.30) { let normal = normalize(pos + vec2f(0.001)); pos = normal * 0.305; if (dot(velocity, normal) < 0.0) { velocity = reflect(velocity, normal) * restitution; } }
    let q = pos - vec2f(0.62, -0.48);
    if (abs(q.x) < 0.08 && abs(q.y) < 0.23) { let normal = select(vec2f(sign(q.x), 0), vec2f(0, sign(q.y)), abs(q.y) > 0.18); velocity = reflect(velocity, normal) * restitution; pos += normal * 0.03; }
    if (old.extra.x > 5.0 + seed * 4.0 || length(velocity) < 0.025) { pos = vec2f(mouse.x + (seed - 0.5) * 0.5, 0.85); velocity = vec2f(sin(seed * 13.0) * 0.4, 0); }
  }
  else {
    let d = mouse - pos; let scale = 2.0 + g.params.y * 5.0;
    let flow = vec2f(sin(pos.y * scale + g.time * 0.5 + seed * 2.0), cos(pos.x * scale - g.time * 0.3));
    let vortex = vec2f(-d.y, d.x) / (0.25 + dot(d, d));
    var force = flow * 0.22 + vortex * (0.12 + g.params.w * 0.45) + d * 0.09;
    if (e == 7) { force = flow * 0.5 + vortex * g.params.w * 0.45; }
    velocity = mix(velocity, force, min(dt * 2.0, 1.0));
  }
  pos += velocity * dt; pos.x = fm(pos.x + aspect, 2.0 * aspect) - aspect;
  if (e != 44) { pos.y = fm(pos.y + 1.0, 2.0) - 1.0; }
  var age = old.extra.x + dt; if (e == 44 && age > 5.0 + seed * 4.0) { age = 0.0; }
  next[index] = Particle(vec4f(pos, velocity), vec4f(age, seed, old.extra.zw));
}
