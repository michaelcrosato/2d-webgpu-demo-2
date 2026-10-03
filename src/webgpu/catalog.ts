import type { Effect } from "../catalog";

export const computeEffects: Effect[] = [
  {
    id: "reaction-diffusion",
    name: "Reaction–diffusion",
    category: "Compute playground",
    tagline: "A pattern that grows instead of being drawn.",
    description:
      "Two chemical concentrations diffuse across a grid and react with each other. Small seed islands grow into spots, rings, and branching textures. Move your pointer to feed a new patch; change feed and removal rates to explore different patterns.",
    technique:
      "A WGSL compute kernel applies the Gray–Scott equations to neighboring cells in two storage buffers. Each 8 × 8 workgroup updates a grid region, then the buffers swap. The reaction starts with 32 warm-up steps and continues at fixed simulation ticks. This is a discrete reaction–diffusion model with periodic boundaries, not a video or noise-only shader.",
    game: [
      "Alien ground cover",
      "A living chemical texture spreads over the forest floor, suggesting alien growth or magical infection.",
    ],
    world: [
      "Pattern formation",
      "A colored display illustrates a model used to study self-organizing chemical patterns; it is an illustrative model, not a calibrated experiment.",
    ],
    controls: ["Feed rate", "Seed scale", "Simulation speed", "Removal rate"],
    defaults: [0.37, 0.5, 0.5, 0.86],
    prompt:
      "Create a WebGPU Gray–Scott reaction–diffusion texture for alien terrain, using ping-pong storage buffers and adjustable feed/removal rates.",
    cost: "A 256 × 160 grid; multiple compute dispatches per fixed simulation tick. Cost grows with grid size and solver steps, independently of display resolution.",
    code: "let reaction = u * v * v;\nnextU = u + diffusionU - reaction + feed * (1.0 - u);\nnextV = v + diffusionV + reaction - (feed + kill) * v;",
  },
  {
    id: "wave-grid",
    name: "Simulated wave grid",
    category: "Compute playground",
    tagline: "A ripple that remembers its neighbors.",
    description:
      "A height-and-velocity grid propagates disturbances from cell to cell. A demonstration source pulses in the lower part of the surface so waves are visible immediately. Move your pointer to add disturbances or click for a stronger impulse. Unlike the analytic ripple study, these waves interact with existing state.",
    technique:
      "A compute shader estimates the height Laplacian from four neighbors, updates velocity, applies damping, and integrates height. Ping-pong storage buffers preserve state. The shader visualizes that evolving height field. Periodic boundaries wrap waves; this is a damped wave equation, not a fluid-volume solver.",
    game: [
      "Interactive magic pond",
      "The forest floor becomes a wave surface that reacts to cursor disturbances and clicks.",
    ],
    world: [
      "Wave laboratory",
      "A colored height display makes wave propagation, interference, and damping visible.",
    ],
    controls: ["Impulse strength", "Propagation rate", "Simulation speed", "Wave persistence"],
    defaults: [0.65, 0.5, 0.5, 0.7],
    prompt:
      "Build a persistent WebGPU water-height grid with a damped wave equation, cursor disturbances, and click impulses.",
    cost: "One compute step reads four neighbors per cell. Higher propagation rates require care with numerical stability; the demo uses fixed, bounded time steps.",
    code: "let lap = left + right + up + down - 4.0 * height;\nvelocity = (velocity + lap * waveRate + impulse) * damping;\nnextHeight = height + velocity;",
  },
  {
    id: "ink-advection",
    name: "Compute ink advection",
    category: "Compute playground",
    tagline: "Let a current carry the color.",
    description:
      "A persistent dye field is carried by a changing current. Move your pointer to inject ink and bend the flow. The dye stretches into ribbons and gradually fades instead of being redrawn from scratch.",
    technique:
      "Each compute invocation traces backward along a prescribed velocity field and bilinearly samples the previous dye buffer. A pointer-centered source adds dye. This semi-Lagrangian advection demonstrates persistent GPU simulation, but the velocity is procedural: the demo does not perform a Navier–Stokes pressure solve.",
    game: ["Magic mist", "Colored mist travels across the forest floor and curls around the pointer."],
    world: [
      "Dye in a current",
      "An illustrative dye display reveals transport through a changing vector field.",
    ],
    controls: ["Dye injection", "Current scale", "Simulation speed", "Dye persistence"],
    defaults: [0.75, 0.5, 0.5, 0.8],
    prompt:
      "Use a WebGPU compute shader to advect a persistent dye field with bilinear backtracing, a cursor source, and adjustable fade.",
    cost: "Four storage-buffer samples per advected cell, plus field evaluation. This avoids the repeated pressure-solver passes required by a full incompressible fluid solver.",
    code: "let departure = cellPosition - velocity * dt;\nnextDye = bilinear(previousDye, departure) * persistence + source;",
  },
  {
    id: "flocking",
    name: "Compute flocking",
    category: "Compute playground",
    tagline: "A crowd that learns to move together.",
    description:
      "Individual agents steer toward neighbors, align their direction, and keep some distance from each other. The pointer gently guides the flock. Change neighborhood size and separation to move between loose swarms and coherent schools.",
    technique:
      "A compute kernel reads nearby agents from the previous storage buffer and writes new velocities to another. To bound cost, each agent samples 64 deterministic candidates rather than checking the entire population. Instanced triangle-shaped billboards visualize direction. A production flock can use a spatial grid for more accurate neighbor queries.",
    game: [
      "Forest flock",
      "A flock of luminous creatures responds collectively to the player’s guiding pointer.",
    ],
    world: [
      "Birds over the skyline",
      "A simplified flock demonstrates alignment, cohesion, and separation over a city.",
    ],
    controls: ["Agent population", "Neighbor radius", "Simulation speed", "Separation force"],
    defaults: [0.3, 0.55, 0.5, 0.6],
    prompt:
      "Implement WebGPU boids using storage-buffer neighbor reads, cohesion/alignment/separation forces, and instanced directional sprites.",
    cost: "O(agent count × 64) sampled-neighbor checks per update. The approximation keeps the showcase responsive but is not an exhaustive nearest-neighbor search.",
    code: "force = cohesion + alignment + separation;\nnextVelocity = velocity + force * dt;\nnextPosition = position + nextVelocity * dt;",
  },
  {
    id: "compute-collisions",
    name: "GPU particle collisions",
    category: "Compute playground",
    tagline: "The GPU can keep the little things off the floor.",
    description:
      "Particles fall under gravity and bounce off a circle, a small box, and a floor. Move your pointer to shift where particles respawn. Restitution controls how much speed they keep after a bounce.",
    technique:
      "A WGSL compute kernel integrates gravity and tests analytic colliders. Circle normals come from the center-to-particle direction; velocity reflects across the normal and loses energy according to restitution. The example is discrete point-particle collision, with no particle-to-particle interactions or continuous collision detection.",
    game: [
      "Bouncing loot sparks",
      "Small sparks fall and bounce through a forest scene without JavaScript updating each particle.",
    ],
    world: [
      "Bouncing bead study",
      "A city-backed experiment shows gravity and energy loss against simple obstacles.",
    ],
    controls: ["Particle population", "Gravity strength", "Simulation speed", "Restitution"],
    defaults: [0.35, 0.5, 0.5, 0.75],
    prompt:
      "Add GPU-simulated point particles that bounce against analytic 2D colliders, with gravity and adjustable restitution.",
    cost: "Constant collider checks per particle. Fast particles can tunnel because this demo uses discrete collision; a game needing reliable impacts should add swept tests.",
    code: "if (insideCollider) {\n  velocity = reflect(velocity, surfaceNormal) * restitution;\n}",
  },
  {
    id: "cellular-automata",
    name: "Cellular automata",
    category: "Compute playground",
    tagline: "Simple local rules. Unexpected worlds.",
    description:
      "Each cell lives or dies based on its eight neighbors. This is Conway’s Game of Life: three neighbors create life; two or three keep it alive. Change the starting population or colony scale to seed a new world. Afterglow helps you see the recent history.",
    technique:
      "A compute invocation reads the eight adjacent cells in the previous buffer, applies the life rule, and writes the next state. A fixed cadence advances whole generations together. Two buffers prevent cells from observing a partly updated generation. Edges wrap around the grid.",
    game: [
      "Living floor",
      "Glowing colonies form a changing pattern over a platformer’s ground, useful as a model for procedural growth.",
    ],
    world: [
      "Emergent systems",
      "A display of autonomous cells shows how local rules can create stable forms, oscillators, and moving patterns.",
    ],
    controls: ["Starting population", "Colony scale", "Generation speed", "Afterglow"],
    defaults: [0.6, 0.15, 0.5, 0.6],
    prompt:
      "Create a WebGPU cellular-automaton texture with simultaneous ping-pong updates, Conway rules, reseeding controls, and age-based glow.",
    cost: "Eight neighbor reads per cell, independent of how many cells are alive. Grid resolution and generation rate determine simulation cost.",
    code: "let alive = neighbors == 3 || (wasAlive && neighbors == 2);\nnext[cell] = select(0.0, 1.0, alive);",
  },
  {
    id: "jump-flood",
    name: "Jump-flood Voronoi",
    category: "Compute playground",
    tagline: "Find the nearest seed in a handful of jumps.",
    description:
      "Seeds divide the image into colored nearest-seed regions. Move the pointer to add a moving seed. The other seeds drift slowly as the animation plays. Density and jitter reveal regular territories or irregular cellular patterns.",
    technique:
      "A compute pass initializes seed coordinates. Successive passes examine neighbors 128, 64, 32, …, 1 cells away, keeping the closest candidate. This jump-flood algorithm approximates a nearest-seed field in logarithmic passes. It is useful for Voronoi territories, distance-field generation, and outlines; it is not an exact Euclidean-distance solver in every case.",
    game: [
      "Territory map",
      "Colored regions partition the forest floor into nearest-control-point territories.",
    ],
    world: ["Cellular material", "A Voronoi display suggests crystal grains or a cellular material pattern."],
    controls: ["Seed density", "Seed jitter", "Seed drift speed", "Distance shading"],
    defaults: [0.65, 0.65, 0.4, 0.6],
    prompt:
      "Generate a WebGPU nearest-seed field with jump flooding, then visualize Voronoi territories and distance-based shading.",
    cost: "One initialization plus eight jump passes on the 256 × 160 field. Each jump examines nine candidates per cell; cost scales with grid size and logarithmic pass count.",
    code: "for (var jump = 128; jump >= 1; jump /= 2) {\n  // Dispatch: keep the nearest seed among 3×3 jump-spaced candidates.\n}",
  },
  {
    id: "compute-bloom",
    name: "Tiled compute bloom",
    category: "Compute playground",
    tagline: "Share the pixels. Share the work.",
    description:
      "Bright parts of the image acquire a soft glow, just as in the bloom study. This version performs the blur in compute workgroups. It demonstrates a different implementation strategy rather than an entirely different visual effect.",
    technique:
      "Each 64-lane workgroup loads a line of pixels and an eight-pixel halo into workgroup memory. Every lane reaches a workgroupBarrier, then convolves 17 cached samples. Horizontal and vertical dispatches write rgba16float storage textures. The final render pass combines the glow with the scene. Workgroup tiling can reduce repeated global texture reads; this lab does not claim a measured speedup on every device.",
    game: [
      "Compute-lit gems",
      "Glowing collectibles illuminate the forest using a tiled compute convolution.",
    ],
    world: ["Compute neon lights", "City highlights bloom through the same compute blur implementation."],
    controls: ["Glow strength", "Kernel spread", "Animation speed", "Highlight threshold"],
    defaults: [0.65, 0.55, 0.5, 0.55],
    prompt:
      "Implement WebGPU bloom with separable compute convolution, shared workgroup tiles, halo loads, and floating-point storage textures.",
    cost: "Two compute dispatches plus composition. Shared memory trades additional coordination for fewer repeated source reads. Driver, resolution, and kernel size affect performance.",
    code: "var<workgroup> tile: array<vec4f, 80>;\n// Cooperatively load 64 pixels and a halo.\nworkgroupBarrier();\n// Each lane convolves its cached neighborhood.",
  },
];
