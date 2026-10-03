struct ParticleOutput { @builtin(position) position: vec4f, @location(0) local: vec2f, @location(1) seed: f32 }
@vertex fn particleVertex(@builtin(vertex_index) vertex: u32, @builtin(instance_index) index: u32) -> ParticleOutput {
  var corners = array<vec2f, 4>(vec2f(-1, -1), vec2f(1, -1), vec2f(-1, 1), vec2f(1, 1));
  let state = agents[index]; var corner = corners[vertex]; let e = g.config.x;
  var size = 0.0018 + g.params.y * 0.012; if (e == 39) { size = 0.018 + g.params.y * 0.045; } if (e == 43) { size = 0.016; } if (e == 44) { size = 0.008; }
  var dimensions = vec2f(size); if (e == 9 && g.config.y == 2) { dimensions *= vec2f(0.3, 4); }
  if (e == 43) { let angle = atan2(state.state.w, state.state.z); corner = vec2f(corner.x * cos(angle) - corner.y * sin(angle), corner.x * sin(angle) + corner.y * cos(angle)); }
  let p = state.state.xy + corner * dimensions;
  return ParticleOutput(vec4f(p.x / (g.resolution.x / g.resolution.y), p.y, 0, 1), corners[vertex], state.extra.y);
}
@fragment fn particleFragment(input: ParticleOutput) -> @location(0) vec4f {
  let e = g.config.x;
  if (e == 39) { return sprite(input.local * 0.5 + vec2f(0.5), i32(fm(floor(g.time * 6.0 + input.seed * 4.0), 4.0))); }
  let radial = length(input.local); var alpha = exp(-radial * radial * 3.5) * (1.0 - smoothstep(0.7, 1.0, radial));
  var color = hue(input.seed * 0.45 + g.time * 0.02);
  if (e == 9) { color = select(vec3f(0.8, 0.9, 1), vec3f(0.25, 0.45, 0.62), g.config.y == 2); }
  if (e == 43) { alpha = mask(max(abs(input.local.y) * 0.75 + input.local.x * 0.5 - 0.3, -input.local.x - 0.75)); }
  return vec4f(color * 0.7, alpha * select(0.55, 0.95, e == 43 || e == 44));
}
