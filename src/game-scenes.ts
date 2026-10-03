/** Authored 2D vignette geometry, emitted as native WGSL or GLSL for the two editions. */
export interface GameStudy {
  title: string;
  story: string;
  watch: string;
}
export const gameStudies: GameStudy[] = [
  {
    title: "Lantern heist",
    story: "A thief crosses a warehouse of crates and pillars with a movable lantern.",
    watch: "Move the light around the crates. Their silhouettes block it and soften with distance.",
  },
  {
    title: "The brass guardian",
    story: "A polished suit of armor stands in a steampunk workshop.",
    watch: "Sweep the pointer across the breastplate and shield to reveal relief and specular highlights.",
  },
  {
    title: "Crystal cavern",
    story: "An explorer discovers luminous crystals in a dark cave.",
    watch: "Raise bloom to make the crystals bleed light into the surrounding rock.",
  },
  {
    title: "Sunken temple",
    story: "Sunlight enters a ruined temple through broken roof openings.",
    watch: "The shafts reveal dusty air between the columns; move the pointer to redirect the source.",
  },
  {
    title: "The prop room",
    story: "Stacked barrels, stone blocks, and a treasure chest fill a dungeon room.",
    watch: "Contact shadows anchor the props and separate surfaces where they nearly touch.",
  },
  {
    title: "Arcane familiar",
    story: "A mage gathers a swarm of magical motes around a spell circle.",
    watch:
      "Guide the motes with your pointer and change their population without per-particle JavaScript updates.",
  },
  {
    title: "Lightcycle circuit",
    story: "A futuristic bike races through a dark geometric track.",
    watch:
      "The moving lights leave history-buffer trails; persistence changes how much motion the image remembers.",
  },
  {
    title: "Desert spirit current",
    story: "A stream of spirits follows a swirling current through desert ruins.",
    watch:
      "Bend the current with your pointer; broad fields create ribbons and fine fields create turbulence.",
  },
  {
    title: "Camp under the pines",
    story: "An adventurer rests beside a campfire, tent, and fallen logs.",
    watch:
      "Flame shape and smoke come from rising layered noise. Adjust height and turbulence independently.",
  },
  {
    title: "Rain on the rooftops",
    story: "A courier waits on a wet rooftop above a neon street.",
    watch:
      "Rain streaks cross the whole view while the skyline and roof give their scale and wind a clear reference.",
  },
  {
    title: "Lagoon ferry",
    story: "A small boat passes a lantern-lit island settlement reflected in the lagoon.",
    watch:
      "Explore the water studio: reflection, refraction, depth color, foam, glints, and moving caustics all contribute.",
  },
  {
    title: "Lily-pond footsteps",
    story: "A traveler crosses stepping stones in a shallow lily pond.",
    watch: "Click the water to send rings through reflections and refracted stones.",
  },
  {
    title: "Lava foundry",
    story: "A forge corridor hangs above a molten lava channel.",
    watch:
      "Hot air distorts the machinery immediately above the lava; raise the strength to see the heat mask.",
  },
  {
    title: "Frost shield",
    story: "A knight raises a frosted ice shield against a snowy fortress.",
    watch:
      "Move the shield over scenery. The material blurs and refracts what is behind it while its rim catches light.",
  },
  {
    title: "Teleport departure",
    story: "An adventurer disappears from a glowing teleport platform.",
    watch:
      "The noise threshold removes the character, revealing the unchanged room behind it; the burn rim follows the silhouette.",
  },
  {
    title: "Projected companion",
    story: "A little holographic robot appears above a projector in a spacecraft bay.",
    watch: "Scan bands and interference affect the projected companion while the bay remains solid.",
  },
  {
    title: "Sky-island voyage",
    story: "An airship travels between floating islands and distant mountains.",
    watch: "Near islands move farther than distant ridges. Pointer movement reveals the layer separation.",
  },
  {
    title: "Wind through the wheat",
    story: "A farmhouse and windmill overlook a field of rooted wheat.",
    watch:
      "Gusts bend the blade tips while their bases stay fixed; changing frequency alters the traveling waves.",
  },
  {
    title: "Spelunker’s passage",
    story: "A climber descends through a layered rock cave with an evolving floor.",
    watch:
      "The distance-field contour defines the rock boundary. The visible terrain is procedural, not a tile silhouette.",
  },
  {
    title: "Dungeon map editor",
    story: "A top-down dungeon assembles stone floors, walls, and small props from reusable atlas cells.",
    watch: "Change tile density and variation to see one small texture cover an entire room.",
  },
  {
    title: "Ranger’s walk cycle",
    story: "A pixel ranger walks along a village path; the four source poses sit above the scene.",
    watch:
      "Scale the sprite and slow the frame stepping. Animation frames remain independent of the display refresh rate.",
  },
  {
    title: "Homestead hours",
    story: "A farm, orchard, and windmill pass from daylight into a star-lit night.",
    watch: "The sun, moon, sky, window light, and ambient tint share the same time-of-day cycle.",
  },
  {
    title: "Golem landing",
    story: "A heavy stone guardian lands in a circular boss arena.",
    watch: "Click at the impact to launch a radial distortion ring through the arena.",
  },
  {
    title: "Cockpit damage",
    story: "A starfighter cockpit looks out toward a planet and approaching debris.",
    watch: "RGB separation gives a readable damage-camera effect against bright cockpit edges and stars.",
  },
  {
    title: "Focus on the sentinel",
    story: "A guardian stands in front of a distant city and a foreground balcony.",
    watch: "Move the sharp focus band over the guardian; the other layers soften to direct attention.",
  },
  {
    title: "Alpine golden hour",
    story: "A mountain village sits between a warm sky and cool-shadowed pines.",
    watch: "Compare the grade to the clean scene, then tune saturation and contrast to change the mood.",
  },
  {
    title: "Haunted manor",
    story: "A tiny visitor approaches an old house at the end of a dark path.",
    watch: "The vignette directs attention toward the entrance while grain adds texture to the camera image.",
  },
  {
    title: "Corrupted control room",
    story: "A spaceship console loses its digital signal.",
    watch: "Horizontal errors and separated color channels break the display into unstable bands.",
  },
  {
    title: "Eight-bit treasure run",
    story: "A pixel adventurer explores a compact dungeon of platforms, ladders, and coins.",
    watch: "Virtual resolution and palette reduction turn the whole composition into coherent pixel art.",
  },
  {
    title: "Cartoon pirate cove",
    story: "A pirate captain stands among palms, a treasure chest, and a bright island sky.",
    watch: "Color bands and dark contours simplify the art into a cartoon game look.",
  },
  {
    title: "Painted storybook town",
    story: "Rounded cottages and a winding path sit in a soft meadow.",
    watch: "Pigment spread and paper grain give the same scene an illustrated watercolor treatment.",
  },
  {
    title: "Detective’s alley",
    story: "A detective follows a lamplit alley between tall brick buildings.",
    watch: "Edges become ink contours and darker surfaces receive crosshatching.",
  },
  {
    title: "Paper forest theater",
    story: "Layered paper hills, trees, and a small cabin form a miniature stage.",
    watch: "Flat colors, offset layer shadows, and paper texture make the scene look assembled by hand.",
  },
  {
    title: "Arcade star patrol",
    story: "A little spacecraft faces rows of enemies on an arcade screen.",
    watch: "Curvature, scan lines, phosphor stripes, and glow make the display itself part of the style.",
  },
  {
    title: "Comic rooftop rescue",
    story: "A caped hero stands above a city beside a graphic burst of light.",
    watch: "Dot radius follows brightness, turning surfaces into comic-print tones.",
  },
  {
    title: "Neon racer",
    story: "A glowing vehicle races along a cyberpunk street toward a luminous skyline.",
    watch: "Edges become emissive contours; the glow distinguishes them from ordinary thin outlines.",
  },
  {
    title: "Slime in the crypt",
    story: "A merging slime creature waits between cracked dungeon pillars.",
    watch: "Bring the pointer blob near the creature and watch the implicit surfaces join into one body.",
  },
  {
    title: "Two-realm portal",
    story: "A portal opens between a cool forest and a warm desert ruin.",
    watch: "Move the portal mask to expose the alternate image and examine the feathered boundary.",
  },
  {
    title: "Handheld ruins",
    story: "A small explorer crosses mossy stone ruins in a limited-color adventure.",
    watch: "Ordered dithering creates apparent extra tones while the underlying palette stays small.",
  },
  {
    title: "Crowded dungeon",
    story: "A crowd of animated adventurers moves through a top-down dungeon room.",
    watch:
      "Thousands of agents share one quad and one atlas; the population slider changes the actual instance count.",
  },
  {
    title: "Alien growth chamber",
    story: "A damaged research bay is being overtaken by a living chemical growth.",
    watch: "Feed and removal rates change the persistent reaction pattern spreading over the chamber floor.",
  },
  {
    title: "Disturbed cavern pool",
    story: "A subterranean pool carries persistent waves beneath a waterfall.",
    watch:
      "Click the pool. The water material reads the evolving height grid to bend reflections and lighting.",
  },
  {
    title: "Gas-trap laboratory",
    story: "Colored vapor escapes a vent into a laboratory passage.",
    watch:
      "The dye is transported through a persistent field; injection and fade change the visible gas plume.",
  },
  {
    title: "School over the reef",
    story: "A school of small fish navigates a coral reef.",
    watch:
      "Guide the school with the pointer; neighbor alignment, cohesion, and separation change its collective motion.",
  },
  {
    title: "Bouncing mine loot",
    story: "Glowing fragments tumble onto a mine floor, boulder, and crate.",
    watch:
      "Particles reflect from the shown colliders. Restitution controls their bounce instead of merely changing their color.",
  },
  {
    title: "Automaton garden",
    story: "A robot gardener tends plots of glowing, rule-driven colonies.",
    watch: "The garden advances whole generations together; afterglow exposes recently living cells.",
  },
  {
    title: "Strategy territories",
    story: "Control beacons partition a tactical landscape into colored territories.",
    watch:
      "The nearest-seed field comes from successive jump passes; moving the pointer adds a competing beacon.",
  },
  {
    title: "Lantern shrine",
    story: "A ceremonial hall is lit by luminous braziers and a central relic.",
    watch:
      "The glow uses the compute tile-and-halo convolution, making the implementation visible through the same useful game lighting effect.",
  },
];

const helperSource = `
fn artEllipse(p: vec2f, size: vec2f) -> f32 { return (length(p / size) - 1.0) * min(size.x, size.y); }
fn artLine(p: vec2f, a: vec2f, b: vec2f, width: f32) -> f32 { var delta: vec2f = b - a; var h: f32 = clamp(dot(p-a,delta)/max(dot(delta,delta),0.00001),0.0,1.0); return length(p-a-delta*h)-width; }
fn artTriangle(p: vec2f, width: f32, height: f32) -> f32 { return max(abs(p.x) - width*(0.5-p.y/height), max(-p.y-height*0.5,p.y-height*0.5)); }
fn artPaint(c: vec3f, d: f32, ink: vec3f) -> vec3f { return mix(c, ink, 1.0-smoothstep(-0.003,0.003,d)); }
fn artShade(p: vec2f, ink: vec3f) -> vec3f { return ink*(0.82+noise(p*38.0)*0.13+clamp(p.y*0.1,-0.1,0.1)); }
fn artRock(c0: vec3f, p: vec2f, center: vec2f, size: vec2f, ink: vec3f) -> vec3f { var q: vec2f = p-center; var d: f32 = artEllipse(q,size)+noise(q*12.0)*0.016; var c: vec3f = artPaint(c0,d,artShade(q,ink)); return c + ink*exp(-abs(d)*160.0)*0.1; }
fn artPine(c0: vec3f, p: vec2f, center: vec2f, size: f32, ink: vec3f) -> vec3f { var q: vec2f = (p-center)/size; var c: vec3f = artPaint(c0,box(q-vec2f(0,-0.24),vec2f(0.032,0.28)),ink*0.55); for(var i: i32=0;i<3;i++){ var k: f32=f32(i); c=artPaint(c,artTriangle(q-vec2f(0,k*0.17),0.33-k*0.055,0.43),ink*(0.8+k*0.15)); } return c; }
fn artWindow(c0: vec3f, p: vec2f, center: vec2f, size: vec2f, ink: vec3f) -> vec3f { var q: vec2f = p-center; var c: vec3f = artPaint(c0,box(q,size+vec2f(0.012)),vec3f(0.06,0.09,0.13)); c=artPaint(c,box(q,size),ink); c=artPaint(c,box(q,vec2f(0.005,size.y)),vec3f(0.06,0.09,0.13)); return artPaint(c,box(q,vec2f(size.x,0.005)),vec3f(0.06,0.09,0.13)); }
fn artHouse(c0: vec3f, p: vec2f, center: vec2f, size: f32, ink: vec3f, roof: vec3f, light: f32) -> vec3f { var q: vec2f = (p-center)/size; var c: vec3f = artPaint(c0,box(q,vec2f(0.24,0.20)),artShade(q,ink)); c=artPaint(c,artTriangle(q-vec2f(0,0.25),0.32,0.25),roof); c=artPaint(c,box(q-vec2f(0.04,-0.10),vec2f(0.055,0.10)),vec3f(0.10,0.14,0.16)); c=artWindow(c,q,vec2f(-0.12,0.045),vec2f(0.055,0.055),vec3f(1.2,0.72,0.27)*light); return c; }
fn artHero(c0: vec3f, p: vec2f, center: vec2f, size: f32) -> vec3f { var local: vec2f = (p-center)/vec2f(size,size*1.25)+vec2f(0.5); var actor: vec4f = sprite(local,i32(fm(floor(_TIME_*6.0),4.0))); return mix(c0,actor.rgb,actor.a); }
fn artKnight(c0: vec3f, p: vec2f, center: vec2f, scale: f32, cloth: vec3f, metal: vec3f) -> vec3f { var q: vec2f=(p-center)/scale; var c: vec3f=c0; c=artPaint(c,artTriangle(q-vec2f(-0.08,-0.19),0.26,0.42),cloth); c=artPaint(c,artLine(q,vec2f(-0.06,-0.16),vec2f(-0.11,-0.44),0.045),metal*0.45); c=artPaint(c,artLine(q,vec2f(0.07,-0.16),vec2f(0.12,-0.44),0.045),metal*0.45); c=artPaint(c,artEllipse(q,vec2f(0.14,0.21)),artShade(q,metal)); c=artPaint(c,circle(q-vec2f(0,0.28),0.105),metal); c=artPaint(c,box(q-vec2f(0.03,0.28),vec2f(0.072,0.018)),vec3f(0.025,0.035,0.06)); c=artPaint(c,artLine(q,vec2f(-0.12,0.08),vec2f(-0.25,-0.05),0.045),metal); c=artPaint(c,artEllipse(q-vec2f(0.22,-0.03),vec2f(0.12,0.18)),metal*0.8); return c; }
fn artShip(c0: vec3f, p: vec2f, center: vec2f, scale: f32, ink: vec3f) -> vec3f { var q: vec2f=(p-center)/scale; var c: vec3f=artPaint(c0,artTriangle(q,0.22,0.35),ink); c=artPaint(c,artTriangle(q-vec2f(0,-0.11),0.36,0.10),ink*0.65); c=artPaint(c,artEllipse(q-vec2f(0,0.03),vec2f(0.045,0.09)),vec3f(0.16,0.68,0.9)); return c; }
fn artRobot(c0: vec3f, p: vec2f, center: vec2f, scale: f32) -> vec3f { var q: vec2f=(p-center)/scale; var c: vec3f=artPaint(c0,box(q,vec2f(0.14,0.18))-0.025,vec3f(0.16,0.68,0.85)); c=artPaint(c,box(q-vec2f(0,0.29),vec2f(0.19,0.105))-0.035,vec3f(0.48,0.87,0.91)); c=artPaint(c,box(q-vec2f(0,0.29),vec2f(0.13,0.035)),vec3f(0.025,0.065,0.11)); c+=vec3f(0.2,1.4,1.8)*mask(circle(q-vec2f(-0.065,0.29),0.017)); c+=vec3f(0.2,1.4,1.8)*mask(circle(q-vec2f(0.065,0.29),0.017)); c=artPaint(c,artLine(q,vec2f(-0.12,0.08),vec2f(-0.27,-0.04),0.033),vec3f(0.22,0.64,0.71)); c=artPaint(c,artLine(q,vec2f(0.12,0.08),vec2f(0.27,-0.04),0.033),vec3f(0.22,0.64,0.71)); c=artPaint(c,box(q-vec2f(-0.09,-0.23),vec2f(0.05,0.09)),vec3f(0.09,0.28,0.4)); return artPaint(c,box(q-vec2f(0.09,-0.23),vec2f(0.05,0.09)),vec3f(0.09,0.28,0.4)); }
fn artBrick(p: vec2f, ink: vec3f, scale: f32) -> vec3f { var row: f32=floor(p.y*scale); var uv: vec2f=fract(p*vec2f(scale*0.65,scale)+vec2f(fm(row,2.0)*0.5,0)); var edge: f32=smoothstep(0.025,0.06,min(min(uv.x,uv.y),min(1.0-uv.x,1.0-uv.y))); return artShade(p,ink)*(0.45+0.55*edge); }
fn artStars(c0: vec3f, p: vec2f, brightness: f32) -> vec3f { var cell: vec2f=floor(p*42.0); var star: f32=step(0.975,hash(cell))*exp(-length(fract(p*42.0)-vec2f(0.5))*18.0); return c0 + vec3f(star*brightness); }
`;

const scalar = (value: number) => (Number.isInteger(value) ? `${value}.0` : String(value));
const vector = (values: number[]) =>
  `vec${values.length}f(${values.map((n) => (Number.isInteger(n) ? `${n}.0` : String(n))).join(",")})`;
const color = (hex: string, emission = 1) =>
  vector([0, 2, 4].map((i) => (parseInt(hex.replace("#", "").slice(i, i + 2), 16) / 255) * emission));
class Scene {
  code: string[] = [];
  obstacles: string[] = [];
  constructor(top: string, bottom: string) {
    this.code.push(`var c: vec3f=mix(${color(bottom)},${color(top)},clamp(p.y*0.5+0.5,0.0,1.0));`);
  }
  raw(s: string) {
    this.code.push(s);
    return this;
  }
  paint(distance: string, ink: string) {
    return this.raw(`c=artPaint(c,${distance},${ink});`);
  }
  rect(x: number, y: number, w: number, h: number, hex: string, obstacle = false) {
    const d = `box(p-${vector([x, y])},${vector([w, h])})`;
    if (obstacle) this.obstacles.push(d);
    return this.paint(d, `artShade(p,${color(hex)})`);
  }
  disk(x: number, y: number, r: number, hex: string, emission = 1, obstacle = false) {
    const d = `circle(p-${vector([x, y])},${scalar(r)})`;
    if (obstacle) this.obstacles.push(d);
    return this.paint(d, color(hex, emission));
  }
  ellipse(x: number, y: number, rx: number, ry: number, hex: string) {
    return this.paint(`artEllipse(p-${vector([x, y])},${vector([rx, ry])})`, color(hex));
  }
  triangle(x: number, y: number, w: number, h: number, hex: string) {
    return this.paint(`artTriangle(p-${vector([x, y])},${scalar(w)},${scalar(h)})`, color(hex));
  }
  line(ax: number, ay: number, bx: number, by: number, width: number, hex: string) {
    return this.paint(`artLine(p,${vector([ax, ay])},${vector([bx, by])},${scalar(width)})`, color(hex));
  }
  glow(x: number, y: number, rx: number, ry: number, hex: string, power = 0.3) {
    return this.raw(
      `c+=${color(hex, power)}*exp(-dot((p-${vector([x, y])})/${vector([rx, ry])},(p-${vector([x, y])})/${vector([rx, ry])}));`,
    );
  }
  floor(y: number, hex: string) {
    return this.paint(`p.y-(${y})`, `artShade(p,${color(hex)})`);
  }
  pine(x: number, y: number, size: number, hex: string) {
    return this.raw(`c=artPine(c,p,${vector([x, y])},${scalar(size)},${color(hex)});`);
  }
  house(x: number, y: number, size: number, hex: string, roof: string, light = 1) {
    return this.raw(
      `c=artHouse(c,p,${vector([x, y])},${scalar(size)},${color(hex)},${color(roof)},${scalar(light)});`,
    );
  }
  hero(x: number, y: number, size = 0.2) {
    return this.raw(`c=artHero(c,p,${vector([x, y])},${scalar(size)});`);
  }
  knight(x: number, y: number, size: number, cloth: string, metal: string) {
    return this.raw(`c=artKnight(c,p,${vector([x, y])},${scalar(size)},${color(cloth)},${color(metal)});`);
  }
  stars(brightness = 0.6) {
    return this.raw(`c=artStars(c,p,${scalar(brightness)});`);
  }
  brick(hex: string, scale = 11) {
    return this.raw(`c=artBrick(p,${color(hex)},${scalar(scale)});`);
  }
  rock(x: number, y: number, w: number, h: number, hex: string) {
    return this.raw(`c=artRock(c,p,${vector([x, y])},${vector([w, h])},${color(hex)});`);
  }
  window(x: number, y: number, w: number, h: number, hex: string, emission = 1) {
    return this.raw(`c=artWindow(c,p,${vector([x, y])},${vector([w, h])},${color(hex, emission)});`);
  }
}

function scenes(): Scene[] {
  const a: Scene[] = [];
  const room = (hex = "25354a") => new Scene("182433", "07121e").brick(hex).floor(-0.72, "192a31");
  const meadow = (sky = "80bfc2", grass = "638c51") =>
    new Scene(sky, "d0d4a6")
      .raw(`c=artPaint(c,p.y-(-0.25+sin(p.x*2.0)*0.12),${color("749e79")});`)
      .floor(-0.64, grass);
  const cave = () =>
    new Scene("07111c", "18262b")
      .raw(`c=artPaint(c,-p.y-0.78+noise(vec2f(p.x*4.0,0))*0.20,${color("223743")});`)
      .floor(-0.73, "243540");
  const city = (sky = "142945") =>
    new Scene(sky, "463c58")
      .stars(0.25)
      .raw(
        `for(var i:i32=0;i<12;i++){var x:f32=-1.9+f32(i)*0.34;var h:f32=0.25+hash(vec2f(f32(i),2))*0.7;c=artPaint(c,box(p-vec2f(x,-0.5+h*0.5),vec2f(0.14,h*0.5)),${color("253546")});for(var j:i32=0;j<6;j++){c=artWindow(c,p,vec2f(x,-0.38+f32(j)*0.13),vec2f(0.045,0.025),${color("ffca7d", 1.4)});}}`,
      )
      .floor(-0.72, "172c3c");
  const s0 = room("323b41");
  for (const [x, y, w, h] of [
    [-0.85, -0.47, 0.26, 0.25],
    [-0.34, -0.61, 0.22, 0.11],
    [0.57, -0.48, 0.32, 0.24],
    [1.22, -0.34, 0.07, 0.38],
  ]) {
    s0.rect(x, y, w, h, "876240", true)
      .rect(x, y, w * 0.83, h * 0.83, "9e794e")
      .line(x - w * 0.8, y - h * 0.8, x + w * 0.8, y + h * 0.8, 0.012, "533f2a");
  }
  s0.hero(0.15, -0.6, 0.21).rect(-1.5, -0.4, 0.07, 0.32, "4c5554", true);
  a.push(s0);
  a.push(
    room("38434a")
      .window(-0.9, 0.35, 0.25, 0.3, "4c6b72")
      .rect(0.75, -0.4, 0.32, 0.1, "704d35")
      .disk(0.75, -0.16, 0.19, "be8c46")
      .knight(0, -0.06, 1.18, "9b4434", "d1b17c")
      .rect(-1.15, -0.54, 0.22, 0.14, "684737"),
  );
  const s2 = cave();
  for (let i = 0; i < 6; i++) {
    const x = -1.25 + i * 0.49;
    s2.rock(x, -0.62, 0.28, 0.17, "334858")
      .triangle(x, -0.2 + (i % 3) * 0.16, 0.12, 0.54, "6ee3eb")
      .glow(x, 0.02, 0.25, 0.55, "59bcdf", 0.24);
  }
  s2.hero(-0.25, -0.61, 0.19);
  a.push(s2);
  const s3 = new Scene("baae79", "323f46").raw(`c=artBrick(p,${color("798679")},6.0);`);
  for (const x of [-1.2, -0.6, 0.6, 1.2])
    s3.rect(x, -0.09, 0.07, 0.6, "4e6662", true)
      .rect(x, 0.5, 0.14, 0.045, "a0ac84")
      .rect(x, -0.68, 0.14, 0.06, "596963");
  s3.floor(-0.72, "596354").rect(0, 0.62, 0.37, 0.05, "253d43").hero(0, -0.6, 0.19);
  a.push(s3);
  const s4 = room("414c52");
  for (const [x, y, r] of [
    [-0.9, -0.48, 0.2],
    [-0.51, -0.5, 0.18],
    [0.78, -0.46, 0.23],
  ])
    s4.disk(x, y, r, "ac7947", 1, true)
      .ellipse(x, y + 0.07, r * 0.9, 0.055, "c19759")
      .line(x - r, y, x + r, y, 0.018, "4a4032");
  s4.rect(0.08, -0.53, 0.27, 0.16, "704f35", true)
    .rect(0.08, -0.38, 0.27, 0.03, "c1a34a")
    .rect(0.08, -0.51, 0.03, 0.035, "e6c865");
  a.push(s4);
  a.push(
    new Scene("18203e", "38234c")
      .stars(0.7)
      .floor(-0.7, "23283c")
      .ellipse(0, -0.6, 0.58, 0.075, "774ac3")
      .ellipse(0, -0.6, 0.48, 0.042, "282138")
      .knight(0, -0.19, 0.72, "7145c0", "d6b49d")
      .line(-0.21, -0.2, -0.38, 0.4, 0.018, "d8af60")
      .disk(-0.38, 0.44, 0.05, "c0f8ef", 2)
      .glow(0, 0.17, 0.85, 0.7, "944edd", 0.18),
  );
  a.push(
    new Scene("0b1230", "132344")
      .raw(`c=artPaint(c,abs(p.y+0.45)-0.08,${color("32537a")});`)
      .raw(
        `c+=${color("21e5ce", 0.7)}*exp(-abs(p.y+0.34)*130.0)+${color("bf52ee", 0.7)}*exp(-abs(p.y+0.56)*130.0);`,
      )
      .disk(-0.2, -0.37, 0.08, "33e7db")
      .disk(0.12, -0.37, 0.08, "33e7db")
      .rect(-0.03, -0.27, 0.18, 0.065, "146b89")
      .line(-0.08, -0.2, 0.02, -0.08, 0.025, "cc85ed"),
  );
  a.push(
    new Scene("252049", "c47c53")
      .stars(0.4)
      .raw(`c=artPaint(c,p.y-(-0.57+sin(p.x*2.0)*0.1),${color("cd9856")});`)
      .rect(-1, 0.04, 0.1, 0.47, "967552")
      .rect(-0.62, 0.04, 0.1, 0.47, "967552")
      .rect(-0.81, 0.47, 0.3, 0.06, "ad8556")
      .rock(0.85, -0.55, 0.37, 0.18, "88674a")
      .hero(0.07, -0.43, 0.18),
  );
  const s8 = new Scene("0c1e36", "243d45").stars(0.8);
  for (let i = 0; i < 8; i++) s8.pine(-1.8 + i * 0.47, -0.31, 1.2 + (i % 2) * 0.2, "183e3d");
  s8.floor(-0.68, "273c31")
    .triangle(0.91, -0.3, 0.39, 0.64, "a66643")
    .triangle(0.91, -0.35, 0.21, 0.42, "253534")
    .line(-0.25, -0.61, 0.22, -0.67, 0.045, "75513b")
    .line(-0.22, -0.68, 0.23, -0.6, 0.043, "896746")
    .hero(-0.66, -0.58, 0.25);
  a.push(s8);
  a.push(
    city()
      .rect(0, -0.49, 1.7, 0.04, "718396")
      .rect(-0.92, -0.26, 0.23, 0.25, "2c3b4a")
      .rect(0.95, -0.19, 0.25, 0.32, "3c4652")
      .window(0.95, -0.1, 0.14, 0.18, "f4b067")
      .hero(0.02, -0.38, 0.21)
      .glow(0.5, 0.3, 0.6, 0.5, "8934af", 0.13),
  );
  a.push(new Scene("122b4d", "285253")); // Water uses the dedicated environment.
  a.push(
    new Scene("35696a", "8bb4a2")
      .ellipse(-0.73, -0.14, 0.32, 0.21, "a3ba80")
      .ellipse(0.78, 0.14, 0.3, 0.22, "839966")
      .disk(-0.71, -0.14, 0.21, "678d57")
      .disk(0.75, 0.12, 0.19, "63905b")
      .disk(-0.72, -0.12, 0.035, "f3c7b3")
      .rock(-0.05, -0.35, 0.14, 0.1, "afb39c")
      .rock(0.2, -0.11, 0.14, 0.1, "c6c0a4")
      .rock(0.06, 0.14, 0.14, 0.1, "aeaf91")
      .rock(-0.17, 0.38, 0.14, 0.1, "a9aa91")
      .hero(0.2, -0.1, 0.15),
  );
  a.push(
    room("283239")
      .floor(-0.6, "b53520")
      .raw(`c+=${color("ff6b18", 0.9)}*exp(-abs(p.y+0.58)*25.0);`)
      .rect(-0.77, -0.08, 0.09, 0.52, "52656d")
      .rect(0.71, -0.04, 0.09, 0.57, "586976")
      .rect(0, 0.33, 0.64, 0.06, "a1854d")
      .line(-0.8, 0.7, -0.8, 0.23, 0.018, "a28967")
      .disk(-0.8, 0.2, 0.09, "cc713b")
      .hero(0.0, -0.5, 0.18),
  );
  a.push(
    new Scene("9ab7c7", "d3ddcf")
      .raw(`c=artBrick(p,${color("7990a3")},7.0);`)
      .rect(-1.1, 0.17, 0.19, 0.64, "617893")
      .rect(1.1, 0.17, 0.19, 0.64, "617893")
      .triangle(-1.1, 0.86, 0.27, 0.22, "dbe3d3")
      .triangle(1.1, 0.86, 0.27, 0.22, "dbe3d3")
      .floor(-0.71, "c1d2d0")
      .knight(0, -0.2, 0.8, "785589", "a4c5d0"),
  );
  a.push(
    room("203c51")
      .floor(-0.7, "222b4a")
      .ellipse(0, -0.58, 0.47, 0.09, "626edd")
      .ellipse(0, -0.58, 0.37, 0.055, "8bcfe9")
      .glow(0, -0.06, 0.44, 0.74, "8070dd", 0.18)
      .raw(`if(layer!=2){c=artKnight(c,p,vec2f(0,-0.07),0.96,${color("b45764")},${color("c6ac7c")});}`),
  );
  a.push(
    room("243c55")
      .rect(-0.9, 0.2, 0.23, 0.48, "344e68")
      .rect(0.9, 0.2, 0.23, 0.48, "344e68")
      .window(-0.9, 0.32, 0.16, 0.11, "347292")
      .window(0.9, 0.32, 0.16, 0.11, "37657a")
      .ellipse(0, -0.55, 0.38, 0.09, "7598b9")
      .glow(0, -0.1, 0.45, 0.55, "39bdd0", 0.15)
      .raw(`if(layer!=2){c=artRobot(c,p,vec2f(0,-0.04+sin(_TIME_)*0.035),0.85);}`),
  );
  a.push(
    new Scene("587dba", "d7a194")
      .raw(
        `for(var i:i32=0;i<5;i++){var k:f32=f32(i);var x:f32=p.x+(_TIME_*0.1+(_POINTER_.x-0.5)*2.0)*_PARAMS_.x*(0.1+k*0.18);var h:f32=-0.25+k*0.03+sin(x*(1.5+k*0.4)+k)*0.12;c=artPaint(c,p.y-h, mix(${color("a3abc0")},${color("315674")},k*0.16));}`,
      )
      .rock(-0.72, -0.53, 0.45, 0.19, "46716d")
      .pine(-0.83, -0.2, 0.9, "2d685a")
      .rock(0.95, -0.23, 0.37, 0.12, "62866e")
      .ellipse(0.05, 0.25, 0.32, 0.08, "a05e40")
      .ellipse(0.05, 0.49, 0.25, 0.16, "ddae69")
      .line(-0.12, 0.44, -0.2, 0.29, 0.009, "c9a067")
      .line(0.22, 0.44, 0.25, 0.29, 0.009, "c9a067"),
  );
  a.push(
    meadow("87b4c1", "89754a")
      .house(-0.72, -0.24, 0.75, "e0cf9b", "a9795e", 0.35)
      .rect(0.88, 0.1, 0.1, 0.43, "b9aa83")
      .triangle(0.88, 0.63, 0.18, 0.18, "8a5c47")
      .raw(
        `var q:vec2f=p-vec2f(0.88,0.28);var ang:f32=_TIME_*0.7;var rot:vec2f=vec2f(q.x*cos(ang)+q.y*sin(ang),-q.x*sin(ang)+q.y*cos(ang));c=artPaint(c,box(rot,vec2f(0.39,0.02)),${color("e8dcc1")});c=artPaint(c,box(rot,vec2f(0.02,0.39)),${color("e8dcc1")});`,
      ),
  );
  a.push(
    cave()
      .raw(`c=artPaint(c,0.35-p.y+noise(vec2f(p.x*4.0,0))*0.15,artBrick(p,${color("615452")},9.0));`)
      .line(-0.53, 0.5, -0.1, -0.43, 0.007, "c5b99f")
      .hero(-0.1, -0.4, 0.18)
      .disk(0.27, -0.56, 0.06, "84daf1", 1.8),
  );
  a.push(
    new Scene("152c32", "293c37")
      .brick("344b4e", 8)
      .rect(-0.8, 0.0, 0.04, 0.64, "98a08e")
      .rect(0.8, 0.0, 0.04, 0.64, "98a08e")
      .rect(0, 0.58, 0.83, 0.04, "98a08e")
      .rect(0, -0.58, 0.83, 0.04, "98a08e")
      .rect(-0.1, 0.19, 0.28, 0.025, "798779")
      .rect(0.16, -0.25, 0.025, 0.26, "798779")
      .disk(-0.55, 0.34, 0.07, "d1a958")
      .hero(0.52, -0.27, 0.18),
  );
  a.push(
    meadow()
      .house(-0.86, 0.0, 1.0, "d6c398", "976456")
      .house(0.91, 0.1, 0.8, "b9c7ab", "5d7773")
      .floor(-0.64, "b8a476")
      .line(-1.4, -0.37, 1.4, -0.37, 0.012, "dbc6a0"),
  );
  a.push(
    meadow("70b9ce", "3a7a57")
      .raw(
        `var day:f32=0.5+0.5*sin(_PARAMS_.x*6.28318+_TIME_*0.12);c=mix(${color("162240")},c,day);c=artStars(c,p,(1.0-day)*_PARAMS_.w);c+=${color("f1e3a4")}*mask(circle(p-vec2f(cos(_PARAMS_.x*6.28318+_TIME_*0.12),0.5),0.11));`,
      )
      .house(-0.67, -0.15, 0.94, "cbc69f", "966d55")
      .house(0.75, -0.08, 0.72, "b8bb95", "657558")
      .pine(1.3, -0.1, 1, "345e41")
      .pine(-1.3, -0.07, 0.9, "416d46"),
  );
  a.push(
    room("313745")
      .ellipse(0, -0.44, 0.92, 0.26, "786951")
      .ellipse(0, -0.43, 0.7, 0.18, "a09270")
      .knight(0, -0.04, 1.5, "5e537c", "8e9698")
      .line(-0.25, 0.12, -0.5, 0.36, 0.065, "827f8b")
      .rect(-0.55, 0.4, 0.14, 0.11, "9ea5a0")
      .hero(-0.83, -0.4, 0.19),
  );
  a.push(
    new Scene("07142e", "162944")
      .stars(1.3)
      .disk(0.72, 0.35, 0.33, "779fbb")
      .disk(0.58, 0.42, 0.23, "354b75")
      .rect(0, -0.64, 1.7, 0.16, "142733")
      .line(-1.5, -0.7, -1.0, 0.76, 0.055, "375066")
      .line(1.5, -0.7, 1.0, 0.76, 0.055, "375066")
      .window(-0.55, -0.57, 0.27, 0.055, "d16748", 1.3)
      .window(0.38, -0.57, 0.24, 0.055, "4dadce", 1.3)
      .raw(`c=artShip(c,p,vec2f(-0.4,0.3),0.45,${color("b69a8a")});`),
  );
  a.push(
    city("3c6684")
      .rect(0, -0.6, 1.8, 0.05, "9f9b84")
      .knight(0, -0.12, 0.92, "ac694d", "e0cd9b")
      .line(-1.45, -0.48, 1.45, -0.48, 0.012, "c5b8a2")
      .rect(-1.1, -0.32, 0.018, 0.25, "bba886")
      .rect(1.1, -0.32, 0.018, 0.25, "bba886"),
  );
  const s25 = meadow("edc79d", "517d70");
  s25.raw(`c=artPaint(c,p.y-(0.72-abs(p.x+0.8)*0.4),${color("9caaaf")});`).floor(-0.64, "517d70");
  for (let i = 0; i < 5; i++)
    s25.house(-1.2 + i * 0.6, -0.1 + (i % 2) * 0.1, 0.65, "c9b88f", i % 2 ? "536976" : "aa725b", 0.5);
  s25.pine(-1.5, -0.36, 1.1, "285047").pine(1.42, -0.22, 1.1, "3a6354").hero(0, -0.53, 0.18);
  a.push(s25);
  a.push(
    new Scene("192339", "122630")
      .stars(0.4)
      .floor(-0.74, "233829")
      .house(0, -0.12, 1.6, "485567", "2d394c", 0.75)
      .rect(0, 0.46, 0.37, 0.26, "434f61")
      .triangle(0, 0.81, 0.48, 0.3, "253043")
      .window(0, 0.48, 0.075, 0.14, "f3c783", 1.2)
      .pine(-1.25, -0.2, 1.1, "142d31")
      .pine(1.3, -0.14, 1.2, "162d34")
      .hero(-0.12, -0.6, 0.16),
  );
  a.push(
    room("152b3a")
      .rect(0, 0.1, 1.04, 0.53, "233a4b")
      .rect(0, 0.1, 0.96, 0.46, "246a78")
      .raw(`c=artPaint(c,abs(p.y-(0.12+sin(p.x*8.0)*0.14))-0.012,${color("a3e5bc", 1.5)});`)
      .rect(0, -0.63, 1.24, 0.16, "304856")
      .disk(-0.5, -0.56, 0.065, "df804d", 1.5)
      .disk(-0.25, -0.56, 0.065, "71ba88")
      .window(0.48, -0.55, 0.25, 0.05, "c7c478"),
  );
  a.push(
    room("384244")
      .rect(-0.98, -0.42, 0.31, 0.05, "7f9076")
      .rect(-0.25, -0.1, 0.3, 0.05, "7b907b")
      .rect(0.69, 0.17, 0.31, 0.05, "78997e")
      .line(-0.35, -0.54, -0.35, -0.15, 0.015, "c3a779")
      .line(-0.1, -0.54, -0.1, -0.15, 0.015, "c3a779")
      .disk(0.61, 0.32, 0.035, "e5ba42", 1.6)
      .disk(0.78, 0.32, 0.035, "e5ba42", 1.6)
      .hero(-0.94, -0.3, 0.17),
  );
  a.push(
    meadow("8bcde0", "75b677")
      .disk(0.8, 0.63, 0.13, "ffe1a4")
      .house(-0.9, -0.18, 0.7, "dcb76c", "a76743")
      .knight(0, -0.11, 0.95, "d98346", "e5ba74")
      .rect(0.67, -0.51, 0.22, 0.14, "91623e")
      .rect(0.67, -0.36, 0.22, 0.025, "d8b855")
      .line(1.18, -0.61, 1.1, 0.35, 0.027, "9c7244")
      .raw(`c=artPaint(c,artEllipse(p-vec2f(1.08,0.34),vec2f(0.37,0.065)),${color("3f8e65")});`),
  );
  const s30 = meadow("b6d3d0", "90aa7a");
  for (let i = 0; i < 4; i++)
    s30.house(-1.08 + i * 0.71, -0.1 + (i % 2) * 0.16, 0.69, "dac6a8", i % 2 ? "8b9c9b" : "b88882", 0.5);
  s30
    .raw(`c=artPaint(c,abs(p.x+sin(p.y*3.0)*0.12)-(0.13-p.y*0.10),${color("d9cbaa")});`)
    .pine(-1.5, -0.2, 1.1, "668b78")
    .hero(0.03, -0.52, 0.18);
  a.push(s30);
  a.push(
    new Scene("6d7785", "2c3c49")
      .brick("4a5662", 11)
      .rect(-1.3, 0.02, 0.39, 0.9, "323e49")
      .rect(1.18, 0.04, 0.43, 0.9, "3b4855")
      .floor(-0.75, "586164")
      .line(0.48, -0.62, 0.48, 0.56, 0.014, "a6a487")
      .disk(0.48, 0.6, 0.052, "f4df9e", 1.7)
      .glow(0.48, 0.25, 0.35, 0.6, "d9c787", 0.18)
      .knight(-0.13, -0.25, 0.62, "445365", "a9ac9c"),
  );
  a.push(
    meadow("9cbfb4", "849b6c")
      .raw(
        `for(var i:i32=0;i<4;i++){var k:f32=f32(i);c=artPaint(c,p.y-(-0.22-k*0.12+sin(p.x*(1.4+k*0.4)+k)*0.16),mix(${color("9ab7a0")},${color("527964")},k*0.22));}`,
      )
      .house(0.35, -0.21, 0.74, "c3bc94", "82745e", 0.5)
      .pine(-0.75, -0.2, 0.85, "4d7965")
      .pine(1.2, -0.3, 1.2, "315c4a")
      .hero(-0.2, -0.54, 0.16),
  );
  const s33 = new Scene("091a36", "172c4c").stars(1);
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 6; col++) {
      const x = -0.95 + col * 0.38,
        y = 0.55 - row * 0.24;
      s33
        .rect(x, y, 0.085, 0.045, row % 2 ? "73cfaf" : "cea3d8")
        .disk(x - 0.055, y + 0.055, 0.04, "cea3d8")
        .disk(x + 0.055, y + 0.055, 0.04, "cea3d8");
    }
  s33
    .raw(`c=artShip(c,p,vec2f(sin(_TIME_*.7)*0.40,-0.61),0.55,${color("9ed6ec")});`)
    .line(-1.1, -0.84, 1.1, -0.84, 0.012, "728aba");
  a.push(s33);
  a.push(
    city("bd9a96")
      .floor(-0.64, "41445a")
      .knight(0, -0.06, 1.1, "b44053", "d1b990")
      .disk(-0.04, 0.52, 0.09, "e4c3a0")
      .triangle(-0.31, -0.08, 0.39, 0.66, "aa3953")
      .glow(0.99, 0.59, 0.35, 0.3, "efe3a4", 0.25)
      .raw(`c=artPaint(c,abs(length(p-vec2f(0.99,0.59))-0.2)-0.017,${color("f0d893")});`),
  );
  a.push(
    city("1b1640")
      .floor(-0.61, "182546")
      .raw(
        `for(var i:i32=0;i<5;i++){var x:f32=-1.4+f32(i)*0.7;c+=${color("439bec", 0.6)}*exp(-abs(p.x-x)*90.0)*step(-0.60,p.y)*step(p.y,-0.40);}`,
      )
      .ellipse(0, -0.48, 0.37, 0.13, "8550b0")
      .rect(0, -0.28, 0.21, 0.1, "487ca5")
      .line(-0.3, -0.45, 0.3, -0.45, 0.018, "79e8e8")
      .disk(-0.22, -0.57, 0.08, "435679")
      .disk(0.22, -0.57, 0.08, "435679"),
  );
  a.push(
    cave()
      .brick("2a404a", 7)
      .rect(-1.02, -0.1, 0.08, 0.58, "60746a", true)
      .rect(1.06, -0.1, 0.08, 0.58, "60746a", true)
      .rect(0, -0.72, 0.6, 0.04, "80907a")
      .disk(-0.12, 0.19, 0.036, "ceefa4")
      .disk(0.12, 0.19, 0.036, "ceefa4"),
  );
  a.push(
    new Scene("607c88", "294d58")
      .pine(-0.9, -0.11, 1.2, "305d51")
      .pine(-1.35, -0.2, 0.96, "477d65")
      .floor(-0.69, "527663")
      .rect(0.93, -0.18, 0.1, 0.47, "b99a69")
      .rect(1.3, -0.18, 0.1, 0.47, "b99a69")
      .rect(1.12, 0.25, 0.34, 0.07, "bba47a")
      .ellipse(0.02, -0.6, 0.44, 0.07, "71adc3")
      .hero(-0.4, -0.54, 0.2),
  );
  a.push(
    room("4e6a65")
      .rect(-0.92, -0.46, 0.31, 0.09, "90a38a")
      .rect(0.09, -0.16, 0.3, 0.085, "849a84")
      .rect(0.92, 0.17, 0.24, 0.085, "90a587")
      .pine(-1.3, -0.16, 0.8, "557e6d")
      .hero(0.1, -0.04, 0.16),
  );
  a.push(
    new Scene("162b39", "3c5146")
      .brick("43564a", 9)
      .rect(0, 0.57, 1.3, 0.035, "b2b694")
      .rect(-1.27, -0.04, 0.035, 0.62, "8f9b7a")
      .rect(1.27, -0.04, 0.035, 0.62, "8f9b7a")
      .rect(0, -0.65, 1.3, 0.04, "a7b38a")
      .rect(0, 0, 0.26, 0.12, "859369")
      .rect(-0.74, 0.18, 0.18, 0.07, "ad926b")
      .rect(0.7, -0.2, 0.19, 0.06, "a09163"),
  );
  a.push(
    room("283947")
      .window(-0.9, 0.4, 0.23, 0.19, "488598")
      .window(0.9, 0.4, 0.23, 0.19, "5f81a0")
      .rect(0, -0.39, 1.4, 0.1, "466251")
      .line(-1.1, -0.5, 1.1, -0.6, 0.026, "5c884d")
      .line(-0.6, -0.32, -0.3, 0.31, 0.035, "667c4d")
      .disk(-0.28, 0.31, 0.11, "aac966")
      .raw(`c=artPaint(c,box(p-vec2f(0,-0.53),vec2f(1.4,0.16)),${color("34464b")});`),
  );
  a.push(
    cave()
      .rock(-1.05, 0.0, 0.5, 0.82, "273d45")
      .rock(1.15, -0.11, 0.47, 0.73, "385154")
      .line(-0.82, -0.22, 0.8, -0.19, 0.025, "99764f")
      .line(-0.78, -0.48, -0.78, -0.14, 0.019, "8e7250")
      .line(0.8, -0.45, 0.8, -0.13, 0.019, "8e7250"),
  );
  a.push(
    room("253e4a")
      .rect(-0.9, 0.3, 0.14, 0.3, "789394")
      .rect(0.88, 0.3, 0.14, 0.3, "6f888f")
      .window(-0.9, 0.33, 0.08, 0.11, "dc6460")
      .window(0.88, 0.33, 0.08, 0.11, "c36464")
      .rect(-0.12, -0.36, 0.22, 0.07, "56797a")
      .line(-0.14, -0.32, -0.14, 0.06, 0.03, "3e5e67")
      .rect(-0.14, 0.1, 0.15, 0.065, "618d87")
      .glow(-0.14, 0.01, 0.33, 0.6, "708bdd", 0.13),
  );
  a.push(
    new Scene("287997", "124e6a")
      .raw(`c+=${color("65bdc8", 0.15)}*pow(max(sin(p.x*9.0+sin(p.y*6.0)),0.0),7.0);`)
      .floor(-0.73, "496f69")
      .rock(-0.93, -0.59, 0.42, 0.19, "6c7f70")
      .rock(0.92, -0.63, 0.32, 0.2, "617e70")
      .line(-0.65, -0.69, -0.79, -0.28, 0.033, "d2929b")
      .line(-0.74, -0.43, -0.95, -0.22, 0.018, "bf7e93")
      .line(0.68, -0.72, 0.73, -0.3, 0.04, "da9e74")
      .line(0.72, -0.48, 0.92, -0.28, 0.02, "cc957e"),
  );
  a.push(
    cave()
      .floor(-0.69, "76613f")
      .disk(0, 0, 0.3, "78867e", 1, true)
      .rect(0.62, -0.48, 0.07, 0.22, "a37e4f", true)
      .line(-1.4, 0.8, -1.4, -0.55, 0.025, "806b4d")
      .line(1.4, 0.8, 1.4, -0.55, 0.025, "806b4d")
      .line(-1.4, 0.8, 1.4, 0.8, 0.025, "846b4c"),
  );
  a.push(
    meadow("9bbfc1", "58725e")
      .raw(
        `for(var i:i32=0;i<4;i++){var x:f32=-1.0+f32(i)*0.66;c=artPaint(c,box(p-vec2f(x,-0.22),vec2f(0.27,0.28)),${color("314a39")});}`,
      )
      .raw(`c=artRobot(c,p,vec2f(1.13,0.4),0.48);`)
      .line(-1.5, 0.7, 1.5, 0.7, 0.012, "a9b99e"),
  );
  a.push(
    new Scene("c9c397", "668b75")
      .raw(
        `c=artPaint(c,p.y-(sin(p.x*3.0)*0.18),${color("83a788")});c=artPaint(c,abs(p.x+sin(p.y*4.0)*0.16)-0.06,${color("77b4bd")});`,
      )
      .house(-0.62, 0.23, 0.4, "9d936b", "5d766e", 0.4)
      .house(0.74, -0.18, 0.35, "ada176", "6c7b63", 0.4)
      .line(-1.45, -0.71, 1.45, -0.71, 0.017, "c1bd93"),
  );
  const s47 = room("414054").floor(-0.72, "695e66");
  for (const x of [-1.13, -0.6, 0.6, 1.13])
    s47
      .rect(x, -0.03, 0.08, 0.56, "928486")
      .disk(x, 0.37, 0.08, "f6d4a2", 2)
      .glow(x, 0.36, 0.18, 0.4, "ffac68", 0.3);
  s47
    .rect(0, -0.41, 0.28, 0.12, "878095")
    .triangle(0, 0.0, 0.16, 0.28, "96d8e9")
    .glow(0, 0.0, 0.4, 0.5, "92b8ef", 0.3)
    .hero(-0.35, -0.6, 0.18);
  a.push(s47);
  if (a.length !== 48) throw new Error(`Expected 48 game vignettes, got ${a.length}`);
  a[6].code = a[6].code.map((line) =>
    line.includes("circle(p-") || line.includes("box(p-") || line.includes("artLine(p,")
      ? line
          .replaceAll("p-", "(p-vec2f(sin(_TIME_*0.8)*0.78,0))- ")
          .replaceAll("artLine(p,", "artLine(p-vec2f(sin(_TIME_*0.8)*0.78,0),")
      : line,
  );
  a[21].raw(
    `c*=0.22+day*0.78;c=artWindow(c,p,vec2f(-0.78,-0.108),vec2f(0.045,0.045),vec3f(1.15,0.68,0.20)*(1.0-day)+vec3f(0.2));`,
  );
  return a;
}

export function emitArtShader(source: string, wgsl: boolean): string {
  const aliases: Record<string, string> = wgsl
    ? {
        _TIME_: "g.time",
        _PARAMS_: "g.params",
        _POINTER_: "g.pointer",
        _WATERA_: "g.waterA",
        _WATERB_: "g.waterB",
        _WATERBODY_: "g.waterBody",
        _WATERMOTION_: "g.waterMotion",
        _WATERTRAIL_: "g.waterTrail",
        _ORIGIN_: "g.origin",
        _IMPACT_: "g.impact",
        _EFFECT_: "effectId",
        _CONTEXT_: "g.config.y",
      }
    : {
        _TIME_: "u_time",
        _PARAMS_: "u_params",
        _POINTER_: "u_pointer",
        _WATERA_: "u_waterA",
        _WATERB_: "u_waterB",
        _WATERBODY_: "u_waterBody",
        _WATERMOTION_: "u_waterMotion",
        _WATERTRAIL_: "u_waterTrail",
        _ORIGIN_: "u_origin",
        _IMPACT_: "u_impact",
        _EFFECT_: "u_effect",
        _CONTEXT_: "u_context",
      };
  let result = source.replace(
    /_TIME_|_PARAMS_|_POINTER_|_WATERA_|_WATERB_|_WATERBODY_|_WATERMOTION_|_WATERTRAIL_|_ORIGIN_|_IMPACT_|_EFFECT_|_CONTEXT_/g,
    (token) => aliases[token],
  );
  if (wgsl) return result;
  result = result.replace(
    /fn\s+(\w+)\(([^)]*)\)\s*->\s*(\w+)\s*\{/g,
    (_all, name, args, returnType) =>
      `${returnType} ${name}(${args
        .split(",")
        .map((arg: string) => arg.trim().replace(/(\w+)\s*:\s*(\w+)/, "$2 $1"))
        .join(",")}) {`,
  );
  result = result.replace(/\b(?:var|let)\s+(\w+)\s*:\s*(\w+)\s*=/g, "$2 $1 =");
  for (const [a, b] of Object.entries({
    vec2f: "vec2",
    vec3f: "vec3",
    vec4f: "vec4",
    f32: "float",
    i32: "int",
  }))
    result = result.replace(new RegExp(`\\b${a}\\b`, "g"), b);
  return result;
}
export function gameSceneShader(wgsl: boolean): string {
  const list = scenes();
  const bodies = list.map((scene, i) => `if(e==${i}) { ${scene.code.join("\n")} return c; }`).join("\n");
  const obstacleBodies = list
    .map((scene, i) => {
      if (!scene.obstacles.length) return "";
      return `if(e==${i}) { return ${scene.obstacles.reduce((a, b) => `min(${a},${b})`, "10.0")}; }`;
    })
    .join("\n");
  const source =
    helperSource +
    `\nfn gameScene(p: vec2f,e: i32,layer: i32) -> vec3f { ${bodies} return vec3f(0.03,0.08,0.1); }\nfn gameObstacles(p: vec2f,e: i32) -> f32 { ${obstacleBodies} return 10.0; }\nfn gameSubject(p: vec2f,e: i32) -> f32 { if(e==14){return box(p-vec2f(0,0.0),vec2f(0.42,0.5));}if(e==15){return box(p-vec2f(0,0.04),vec2f(0.30,0.45));}if(e==1){return min(artEllipse(p-vec2f(0,-0.06),vec2f(0.19,0.29)),circle(p-vec2f(0,0.28),0.14));}return 10.0; }`;
  return (wgsl ? "" : "float fm(float a,float b){return mod(a,b);}\n") + emitArtShader(source, wgsl);
}
