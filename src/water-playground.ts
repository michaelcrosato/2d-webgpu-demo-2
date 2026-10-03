export const waterViews = [
  {
    name: "Material study",
    title: "Water material studio",
    story: "Explore the four original water environments.",
    hint: "Click the surface to send a ripple through it.",
  },
  {
    name: "Top-down 2D",
    title: "Lagoon boat",
    story:
      "Steer a little boat around a shallow lagoon. The bow pushes water aside; rings spread and a foamy wake lingers behind it.",
    hint: "Drag the boat, or focus the scene and use WASD / arrow keys.",
  },
  {
    name: "Isometric 2D",
    title: "Canal diorama",
    story:
      "Move a boat across a raised, diamond-shaped canal. The water and wake live in the same ground plane; the boat sits above its reflection.",
    hint: "Drag the boat, or focus the scene and use WASD / arrow keys.",
  },
  {
    name: "Side-scrolling 2D",
    title: "Submarine crossing",
    story:
      "Pilot a submarine through a coastal cutaway. Dive below the surface or rise through it to make a splash. The camera follows as the seabed scrolls past.",
    hint: "Drag the submarine, or use WASD / arrow keys. Up rises; down dives.",
  },
] as const;

export type WaterImpulse = [number, number, number, number];
export interface WaterBody {
  position: [number, number];
  velocity: [number, number];
  heading: [number, number];
  clock: number;
  camera: number;
  impulses: WaterImpulse[];
  nextImpulse: number;
  lastEmission: number;
  lastWake: [number, number];
}
export function createWaterBody(view: number, position?: [number, number]): WaterBody {
  const limits = view === 3 ? [24, 0.65, 0.35] : view === 2 ? [0.72, 0.72, 0.72] : [0.94, 0.57, 0.57];
  const p: [number, number] = position ?? (view === 3 ? [-0.3, -0.2] : [-0.42, -0.12]);
  const bounded: [number, number] = [
    Math.max(-limits[0], Math.min(limits[0], p[0])),
    Math.max(-limits[1], Math.min(limits[2], p[1])),
  ];
  return {
    position: bounded,
    velocity: [0, 0],
    heading: [1, 0],
    clock: 0,
    camera: view === 3 ? bounded[0] : 0,
    impulses: Array.from({ length: 8 }, () => [0, 0, -100, 0]),
    nextImpulse: 0,
    lastEmission: -100,
    lastWake: [...bounded],
  };
}
export function waterWorldFromUV(
  view: number,
  uv: [number, number],
  aspect: number,
  camera = 0,
): [number, number] {
  const x = (uv[0] * 2 - 1) * aspect;
  const y = uv[1] * 2 - 1;
  if (view === 2) return [(x / 0.75 + (y - 0.06) / 0.375) * 0.5, ((y - 0.06) / 0.375 - x / 0.75) * 0.5];
  return [x + (view === 3 ? camera : 0), y];
}
export function waterScreenDirection(view: number, direction: [number, number]): [number, number] {
  let [x, y] = direction;
  if (view === 2) [x, y] = [x + y, y - x];
  const length = Math.hypot(x, y);
  return length > 0 ? [x / length, y / length] : [0, 0];
}
function emit(body: WaterBody, x: number, y: number, strength: number) {
  body.impulses[body.nextImpulse] = [x, y, body.clock, strength];
  body.nextImpulse = (body.nextImpulse + 1) % body.impulses.length;
  body.lastEmission = body.clock;
  body.lastWake = [...body.position];
}
export function advanceWater(
  body: WaterBody,
  view: number,
  dt: number,
  direction: [number, number],
  target?: [number, number],
) {
  if (view === 0 || dt <= 0) return;
  // Small bounded steps keep dragging, buoyancy and surface crossings stable at low FPS.
  const steps = Math.max(1, Math.ceil(Math.min(dt, 0.1) / (1 / 120)));
  const tick = Math.min(dt, 0.1) / steps;
  for (let step = 0; step < steps; step++) {
    const oldY = body.position[1];
    const desired = target
      ? [
          Math.max(-1, Math.min(1, (target[0] - body.position[0]) * 5)),
          Math.max(-1, Math.min(1, (target[1] - body.position[1]) * 5)),
        ]
      : direction;
    const thrust = view === 3 ? 3.2 : 3.8;
    for (let axis = 0; axis < 2; axis++) {
      body.velocity[axis] += (desired[axis] * thrust - body.velocity[axis] * 3.6) * tick;
      body.position[axis] += body.velocity[axis] * tick;
    }
    if (view === 3) {
      // Water resists motion; an emerged submarine falls back into the surface.
      if (body.position[1] > 0.14) body.velocity[1] -= 4.2 * tick;
      else if (!target && direction[1] === 0) body.velocity[1] += 0.18 * tick;
    }
    const bounds =
      view === 3
        ? [-24, 24, -0.65, 0.35]
        : view === 2
          ? [-0.72, 0.72, -0.72, 0.72]
          : [-0.94, 0.94, -0.57, 0.57];
    for (let axis = 0; axis < 2; axis++) {
      const clamped = Math.max(bounds[axis * 2], Math.min(bounds[axis * 2 + 1], body.position[axis]));
      if (clamped !== body.position[axis]) body.velocity[axis] *= -0.18;
      body.position[axis] = clamped;
    }
    const speed = Math.hypot(...body.velocity);
    if (speed > 0.035)
      body.heading =
        view === 3
          ? [body.velocity[0] >= 0 ? 1 : -1, 0]
          : [body.velocity[0] / speed, body.velocity[1] / speed];
    body.clock += tick;
    if (view === 3 && (oldY - 0.14) * (body.position[1] - 0.14) < 0)
      emit(body, body.position[0], 0.14, 2.2 + Math.abs(body.velocity[1]));
    else if (
      speed > 0.06 &&
      body.clock - body.lastEmission > 0.1 &&
      Math.hypot(body.position[0] - body.lastWake[0], body.position[1] - body.lastWake[1]) > 0.035
    )
      emit(
        body,
        body.position[0] - body.heading[0] * 0.1,
        body.position[1] - body.heading[1] * 0.1,
        Math.min(1.5, speed * 1.3),
      );
    if (view === 3) body.camera += (body.position[0] - body.camera) * Math.min(1, tick * 2.8);
  }
}

// Shared WGSL-shaped source is emitted as WGSL or GLSL by the existing art compiler.
export const waterPlaygroundBase = `
fn demoGround(p:vec2f) -> vec2f {
  if(_WATERB_.z==2.0){return vec2f(p.x/0.75+(p.y-0.06)/0.375,(p.y-0.06)/0.375-p.x/0.75)*0.5;}
  if(_WATERB_.z==3.0){return p+vec2f(_WATERMOTION_.w,0);}
  return p;
}
fn demoProject(p:vec2f) -> vec2f {
  if(_WATERB_.z==2.0){return vec2f((p.x-p.y)*0.75,(p.x+p.y)*0.375+0.06);}
  if(_WATERB_.z==3.0){return p-vec2f(_WATERMOTION_.w,0);}
  return p;
}
fn demoWet(p:vec2f) -> f32 {
  if(_WATERB_.z==3.0){return p.y-0.14;}
  if(_WATERB_.z==2.0){return box(p,vec2f(0.83));}
  return box(p,vec2f(1.08,0.71))-0.035;
}
fn demoWake(q:vec2f) -> vec4f {
  var sum:vec4f=vec4f(0);
  for(var i:i32=0;i<8;i++){
    var impulse:vec4f=_WATERTRAIL_[i];var age:f32=_WATERMOTION_.z-impulse.z;
    if(impulse.w>0.0 && age>=0.0 && age<4.0){
      var delta:vec2f=q-impulse.xy;var d:f32=max(length(delta),0.001);var radius:f32=age*0.33;
      var envelope:f32=exp(-pow((d-radius)/0.043,2.0))*exp(-age*1.05)*impulse.w*(0.25+_PARAMS_.x*1.4);
      var phase:f32=d*(35.0+_PARAMS_.y*65.0)-age*11.0;var h:f32=sin(phase)*envelope;
      sum+=vec4f(h*0.012,delta/d*cos(phase)*envelope*0.45,envelope);
    }
  }
  return sum;
}
fn demoBackdrop(p:vec2f) -> vec3f {
  var q:vec2f=demoGround(p);var view:i32=i32(_WATERB_.z);var c:vec3f=vec3f(0.075,0.13,0.16);
  if(view==3){
    c=mix(vec3f(0.97,0.77,0.48),vec3f(0.30,0.61,0.72),clamp(p.y*0.5+0.5,0.0,1.0));
    c=artPaint(c,circle(p-vec2f(0.93,0.57),0.115),vec3f(1.3,1.13,0.70));
    var distant:f32=0.24+sin((p.x+_WATERMOTION_.w*0.18)*1.6)*0.10+sin((p.x+_WATERMOTION_.w*0.18)*4.3)*0.05;
    c=artPaint(c,p.y-distant,vec3f(0.27,0.43,0.42));
    c=artPaint(c,p.y-0.14,vec3f(0.16,0.39,0.40)*(0.82+noise(q*13.0)*0.15));
    var floorY:f32=-0.88+sin(q.x*1.7)*0.06+sin(q.x*4.2)*0.025;
    c=artPaint(c,q.y-floorY,vec3f(0.55,0.46,0.29));
    var tile:f32=floor(q.x*2.3);var x:f32=tile/2.3;var size:f32=0.08+hash(vec2f(tile,3))*0.09;
    c=artRock(c,q,vec2f(x,-0.80),vec2f(size,size*0.7),vec3f(0.27,0.39,0.30));
    var reed:f32=q.x-x-0.21-sin(q.y*5.0+_WATERMOTION_.z)*0.018;
    c=artPaint(c,max(abs(reed)-0.013,max(-q.y-0.82,q.y+0.39+hash(vec2f(tile,0))*0.19)),vec3f(0.24,0.51,0.32));
  }else{
    var outer:f32=box(q,vec2f(0.98));if(view==1){outer=box(q,vec2f(1.29,0.90))-0.04;}
    var shadow:vec2f=demoGround(p+vec2f(0.04,0.10));c=artPaint(c,box(shadow,vec2f(1.0)),vec3f(0.035,0.07,0.09));
    if(view==2){var lower:vec2f=demoGround(p+vec2f(0,0.16));c=artPaint(c,box(lower,vec2f(0.98)),vec3f(0.33,0.29,0.25));}
    c=artPaint(c,outer,vec3f(0.53,0.65,0.34)*(0.86+noise(q*48.0)*0.14));
    c=artPaint(c,demoWet(q)-0.065,vec3f(0.91,0.80,0.53));
    c=artPaint(c,demoWet(q),vec3f(0.48,0.65,0.45)*(0.89+noise(q*40.0)*0.11));
    for(var i:i32=0;i<5;i++){var k:f32=f32(i);var center:vec2f=vec2f(-0.65+k*0.32,-0.36+sin(k*2.8)*0.12);c=artRock(c,q,center,vec2f(0.08,0.065),vec3f(0.50,0.55,0.36));}
    var dockX:f32=1.02;if(view==2){dockX=0.78;}var dock:vec2f=q-vec2f(dockX,0.26);c=artPaint(c,box(dock,vec2f(0.22,0.12)),vec3f(0.54,0.33,0.19));
    c=artPaint(c,max(box(dock,vec2f(0.22,0.12)),abs(sin(dock.x*80.0))-0.12),vec3f(0.76,0.54,0.30));
  }
  return c;
}
`;

export const waterPlaygroundMaterial = `
fn demoObject(c0:vec3f,p:vec2f) -> vec3f {
  var view:i32=i32(_WATERB_.z);var center:vec2f=demoProject(_WATERBODY_.xy);var c:vec3f=c0;
  if(view==3){
    var q:vec2f=(p-center)*vec2f(_WATERBODY_.z,1);var submerged:f32=1.0-smoothstep(0.03,0.21,_WATERBODY_.y);
    c=artPaint(c,artEllipse(q+vec2f(0.02,0.03),vec2f(0.25,0.105)),vec3f(0.035,0.17,0.20));
    c=artPaint(c,artEllipse(q,vec2f(0.23,0.085)),mix(vec3f(0.99,0.64,0.18),vec3f(0.75,0.60,0.23),submerged*0.35));
    c=artPaint(c,box(q-vec2f(-0.02,0.091),vec2f(0.047,0.032)),vec3f(0.72,0.40,0.13));
    c=artPaint(c,artLine(q,vec2f(0,0.10),vec2f(0,0.19),0.009),vec3f(0.88,0.64,0.29));
    c=artPaint(c,artLine(q,vec2f(0,0.19),vec2f(0.055,0.19),0.009),vec3f(0.88,0.64,0.29));
    for(var i:i32=0;i<3;i++){var x:f32=-0.11+f32(i)*0.095;c=artPaint(c,circle(q-vec2f(x,0.005),0.034),vec3f(0.20,0.27,0.26));c=artPaint(c,circle(q-vec2f(x,0.005),0.024),vec3f(0.25,0.83,0.93));}
    c=artPaint(c,artLine(q,vec2f(-0.245,-0.045),vec2f(-0.245,0.045),0.009),vec3f(0.64,0.80,0.74));
    return c;
  }
  var local:vec2f=demoGround(p)-_WATERBODY_.xy;var q:vec2f=vec2f(dot(local,_WATERBODY_.zw),dot(local,vec2f(-_WATERBODY_.w,_WATERBODY_.z)));
  c=mix(c,c*0.45,mask(artEllipse(q+vec2f(0.03,0.04),vec2f(0.22,0.09)))*0.48);
  if(view==2){local=demoGround(p-vec2f(0,0.052))-_WATERBODY_.xy;q=vec2f(dot(local,_WATERBODY_.zw),dot(local,vec2f(-_WATERBODY_.w,_WATERBODY_.z)));}
  var hull:f32=artEllipse(q,vec2f(0.19,0.079));c=artPaint(c,hull,vec3f(0.20,0.11,0.075));
  c=artPaint(c,artEllipse(q-vec2f(0.014,0),vec2f(0.165,0.062)),vec3f(0.85,0.39,0.21));
  c=artPaint(c,artEllipse(q+vec2f(0.019,0),vec2f(0.11,0.043)),vec3f(0.95,0.78,0.49));
  c=artPaint(c,box(q+vec2f(0.005,0),vec2f(0.029,0.058)),vec3f(0.31,0.43,0.40));
  c=artPaint(c,circle(q+vec2f(0.033,0),0.025),vec3f(1.09,0.93,0.70));
  return c;
}
fn demoMaterial(uv:vec2f) -> vec3f {
  var p:vec2f=coords(uv);var q:vec2f=demoGround(p);var view:i32=i32(_WATERB_.z);
  var wave:vec4f=demoWake(q);var t:f32=_WATERMOTION_.z;
  var scale:f32=0.65+_PARAMS_.y*1.6;var phase:vec2f=vec2f(q.x*17.0+q.y*8.0,q.x*29.0-q.y*13.0)*scale+vec2f(-t*1.2,t);
  var ambient:f32=sin(phase.x)*0.006+sin(phase.y)*0.003;
  var gradient:vec2f=wave.yz+vec2f(cos(phase.x)*0.10,cos(phase.y)*0.07);
  var wet:f32=mask(demoWet(q));var surface:f32=0.14;
  if(view==3){var surfaceWave:vec4f=demoWake(vec2f(q.x,0.14));surface+=sin(q.x*7.0-t*1.1)*0.012+surfaceWave.x;wet=mask(q.y-surface);}
  var offset:vec2f=gradient*(0.006+_PARAMS_.x*0.022);if(view==2){offset=vec2f((offset.x-offset.y)*0.75,(offset.x+offset.y)*0.375);}
  var refracted:vec3f=sampleScene(uv+offset);var depth:f32=0.28+noise(q*2.0)*0.12;if(view==3){depth=max(0.0,surface-q.y)*1.2;}
  var absorption:f32=1.0-exp(-depth*(1.0+_WATERB_.x*3.5)*(1.35-_WATERA_.x));
  var water:vec3f=mix(refracted*vec3f(0.60,0.93,0.83),vec3f(0.025,0.26,0.32),absorption);
  var cq:vec2f=q+vec2f(sin(q.y*7.0+t*0.6),cos(q.x*5.0-t*0.7))*0.065;
  var caustic:f32=pow(1.0-smoothstep(0.02,0.20,abs(sin(cq.x*24.0+gradient.x*1.8)*sin(cq.y*30.0+t*0.3+gradient.y*1.8))),2.0);
  water+=vec3f(0.17,0.33,0.18)*caustic*_WATERA_.x*_PARAMS_.w*1.8*exp(-depth*1.5);
  var glint:f32=pow(max(0.0,0.5+0.5*sin(q.x*41.0+q.y*16.0+gradient.x*3.0)),22.0);
  water+=vec3f(0.36,0.50,0.45)*glint*_WATERA_.w*(0.12+wave.w*0.24);
  water=mix(water,vec3f(0.32,0.61,0.65),_WATERA_.y*(0.08+max(0.0,ambient*5.0+gradient.y*0.05)));
  var foam:f32=wave.w*0.40+exp(-abs(demoWet(q))*75.0)*0.38;
  if(view==3){foam=wave.w*0.25+exp(-abs(q.y-surface)*100.0)*(0.40+wave.w*0.55);}
  water=mix(water,vec3f(0.92,1.06,0.96),clamp(foam*_WATERA_.z,0.0,0.8));
  var c:vec3f=mix(sampleScene(uv),water,wet);
  if(view==3){
    for(var i:i32=0;i<8;i++){var impulse:vec4f=_WATERTRAIL_[i];var age:f32=t-impulse.z;if(impulse.w>0.0 && age>=0.0 && age<3.0){
      var bubble:vec2f=impulse.xy+vec2f(sin(age*4.0+f32(i))*0.035,age*0.095);var ring:f32=abs(length(q-bubble)-(0.015+age*0.008))-0.002;
      c=mix(c,vec3f(0.60,0.89,0.85),mask(ring)*exp(-age)*wet*0.6);
      if(impulse.w>2.0){var drop:vec2f=impulse.xy+vec2f((f32(i%3)-1.0)*age*0.18,age*0.65-age*age*0.65);c=artPaint(c,circle(q-drop,0.015*exp(-age)),vec3f(0.78,0.96,0.91));}
    }}
  }
  return demoObject(c,p);
}
`;
