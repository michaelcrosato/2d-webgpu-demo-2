import { categories, type Effect, effects, styleOptions } from "./catalog";
import { Renderer, type RenderState } from "./renderer";
import "./style.css";

const icon = (name: string, size = 18) => {
  const paths: Record<string, string> = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    spark: '<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z"/>',
    drop: '<path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12Z"/>',
    layers: '<path d="m12 3 10 5-10 5L2 8Zm-10 10 10 5 10-5M2 18l10 5 10-5"/>',
    camera:
      '<rect x="3" y="6" width="18" height="15" rx="3"/><path d="m8 6 2-3h4l2 3"/><circle cx="12" cy="13" r="4"/>',
    palette:
      '<path d="M21 12a9 9 0 1 0-9 9h1a2 2 0 0 0 1-4 2 2 0 0 1 1-4h4a2 2 0 0 0 2-1Z"/><path d="M7 9h.01M11 6h.01M16 8h.01M6 14h.01"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    play: '<path d="m8 5 11 7-11 7Z"/>',
    pause: '<path d="M8 5v14m8-14v14"/>',
    reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
    compare: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 2v20"/>',
    expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    link: '<path d="m10 14 4-4m-5 7-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0-1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0"/>',
    github:
      '<path d="M9 19c-4 1-4-2-6-2m14 5v-4a4 4 0 0 0-1-3c3 0 6-1 6-5a4 4 0 0 0-1-3c0-1 0-2-1-3-2 0-3 1-3 1a12 12 0 0 0-6 0S9 4 7 4C6 5 6 6 6 7a4 4 0 0 0-1 3c0 4 3 5 6 5a4 4 0 0 0-1 3v4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>',
    code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
};
const groupIcons = ["sun", "spark", "drop", "layers", "camera", "palette"];
const app = document.querySelector<HTMLDivElement>("#app")!;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let selected = 0;
let paused = reducedMotion;
let tourTimer: ReturnType<typeof setInterval> | undefined;
let renderer: Renderer | undefined;
let previousFrame = performance.now();
let frameCounter = 0;
let fpsStart = previousFrame;
let fpsFrames = 0;
let lessonTab = "learn";
const state: RenderState = {
  effect: 0,
  context: 0,
  params: [...effects[0].defaults],
  pointer: [0.55, 0.64],
  origin: [0.5, 0.5],
  time: 0,
  impact: -100,
  style: 0,
  compare: -1,
  quality: 1,
};

app.innerHTML = `
  <a class="skip-link" href="#main">Skip to experiment</a>
  <aside class="sidebar" id="sidebar" aria-label="Effects library">
    <a class="brand" href="#"><span class="brand-mark"><i></i><b></b></span><span>2D<span class="brand-slash">/</span>LAB</span><span class="brand-dot"></span></a>
    <button class="icon-button sidebar-close" id="close-library" aria-label="Close effect library">${icon("close")}</button>
    <div class="sidebar-intro">A FIELD GUIDE TO<br>GPU GRAPHICS</div>
    <div class="library-heading">THE COLLECTION <span>40</span></div>
    <label class="search-box">${icon("search", 16)}<input id="search" type="search" placeholder="Find an effect…" aria-label="Search effects" autocomplete="off"><kbd>/</kbd></label>
    <nav id="effect-list" aria-label="Choose an effect"></nav>
    <div class="sidebar-footer"><span class="small-orbit">✳</span><p>Made for curious minds.<br><span>And the games you’ll make.</span></p></div>
  </aside>
  <div class="page">
    <header class="topbar"><button class="icon-button mobile-menu" id="menu" aria-label="Toggle effect library" aria-expanded="false">${icon("menu")}</button><span class="top-note">Big possibilities. Two dimensions.</span><div class="top-actions"><span class="engine-badge"><i></i><span id="engine">CONNECTING GPU</span></span><button class="icon-button" id="help" aria-label="About this lab">${icon("info")}</button><a class="icon-button" href="https://github.com/michaelcrosato/2d-webgpu-demo-2" target="_blank" rel="noopener" aria-label="View source on GitHub">${icon("github")}</a></div></header>
    <main id="main">
      <div class="collection-line"><span id="breadcrumb">LIGHT & SHADOW</span><span class="edition">INTERACTIVE EXPERIMENTS <span>VOL. 01</span></span></div>
      <div class="experiment-heading"><div><div class="title-line"><span id="effect-number">01</span><h1 id="effect-title">Soft shadows</h1></div><p id="tagline">A little light. A lot of atmosphere.</p></div><button id="tour" class="tour-button">${icon("play", 14)} Take a tour</button></div>
      <div class="workspace">
        <section class="experiment" aria-label="Interactive GPU experiment">
          <div class="scene-toolbar"><div class="scene-tabs" role="tablist" aria-label="Example context"><button role="tab" data-context="0" id="tab-0" aria-controls="stage" aria-selected="true">Abstract</button><button role="tab" data-context="1" id="tab-1" aria-controls="stage" aria-selected="false">In a game</button><button role="tab" data-context="2" id="tab-2" aria-controls="stage" aria-selected="false">In the world</button></div><span class="live-tag"><i></i>LIVE RENDER</span></div>
          <div class="stage" id="stage" role="tabpanel" aria-labelledby="tab-0"><canvas id="canvas" tabindex="0" aria-label="GPU rendered scene. Move the pointer to interact. Click or tap to trigger a wave."></canvas><div class="stage-label"><span class="stage-marker"></span><span id="scene-name">SHAPES IN A LIGHT FIELD</span></div><div id="render-error" role="alert" hidden></div><div class="interaction-hint" id="interaction-hint">Move your pointer to carry the light</div><div class="compare-labels" id="compare-labels" hidden><span>ORIGINAL</span><span>WITH EFFECT</span></div><div class="compare-divider" id="compare-divider" hidden></div><div class="canvas-actions"><button class="canvas-button" id="pause" aria-label="Pause animation">${icon("pause", 16)}</button><span class="canvas-separator"></span><button class="canvas-button" id="compare" aria-label="Compare before and after" aria-pressed="false">${icon("compare", 16)}<span>Compare</span></button><div class="canvas-actions-spacer"></div><button class="canvas-button" id="capture" aria-label="Save scene as PNG">${icon("download", 16)}</button><button class="canvas-button" id="fullscreen" aria-label="View scene fullscreen">${icon("expand", 16)}</button></div></div>
          <div class="render-stats"><span><i></i><b id="fps">—</b> FPS <span class="stats-divider">/</span> <span id="resolution">—</span></span><span><span id="draw-calls">—</span> passes <span class="stats-divider">/</span> <span id="precision">WebGL2</span></span></div>
        </section>
        <aside class="controls" aria-label="Experiment controls"><div class="controls-heading"><h2>Make it yours</h2><button id="reset" class="text-button" title="Reset controls (R)">${icon("reset", 13)} Reset</button></div><p class="controls-note">Change a little. See a lot.</p><div id="sliders"></div><div class="control-divider"></div><label class="select-label" for="art-style">ART DIRECTION</label><div class="select-wrapper"><select id="art-style">${styleOptions.map((s, i) => `<option value="${i}">${s}</option>`).join("")}</select>${icon("chevron", 14)}</div><label class="select-label quality-label" for="quality">RENDER QUALITY</label><div class="select-wrapper"><select id="quality"><option value="0">Economy</option><option value="1" selected>Balanced</option><option value="2">High detail</option></select>${icon("chevron", 14)}</div><div class="controls-tip">${icon("spark", 16)}<p>Try the same effect in a game.<br>Context changes everything.</p></div><button id="share" class="share-button">${icon("link", 15)} Copy experiment link</button></aside>
      </div>
      <section class="lesson" aria-label="Learn about this technique"><div class="lesson-top"><div class="lesson-tabs" role="tablist" aria-label="Lesson"><button role="tab" id="lesson-tab-learn" data-lesson="learn" aria-selected="true" aria-controls="lesson-content">The idea</button><button role="tab" id="lesson-tab-technique" data-lesson="technique" aria-selected="false" aria-controls="lesson-content">${icon("code", 15)} Under the hood</button><button role="tab" id="lesson-tab-prompt" data-lesson="prompt" aria-selected="false" aria-controls="lesson-content">${icon("spark", 15)} Ask your AI</button></div><span class="lesson-caption">PLAY → NOTICE → UNDERSTAND</span></div><div id="lesson-content" role="tabpanel" aria-labelledby="lesson-tab-learn"></div></section>
      <div class="next-row"><span>ONE IDEA LEADS TO ANOTHER.</span><button id="previous-effect" class="text-button" aria-label="Previous effect">← Previous</button><button id="next-effect" class="next-button">Next experiment ${icon("arrow", 17)}</button></div>
      <footer class="page-footer"><span>40 techniques · 120 contexts · endless combinations</span><span>Rendered on your GPU. Made for your imagination.</span></footer>
    </main>
  </div>
  <div class="toast" id="toast" role="status" hidden></div>
  <dialog id="help-dialog"><button class="icon-button dialog-close" id="close-help" aria-label="Close about dialog">${icon("close")}</button><span class="eyebrow">WELCOME TO THE LAB</span><h2>See it. Tweak it.<br>Make it your own.</h2><p>This is a hands-on guide to what GPU graphics can bring to a 2D game. Pick one of 40 techniques, then switch between an abstract study, a game scene, and an everyday context.</p><ul><li><strong>Move your pointer</strong> to guide lights, focus, portals, and particle currents.</li><li><strong>Click or tap</strong> to trigger a ripple or shockwave.</li><li><strong>Compare</strong> shows a clean scene beside the effect.</li><li><strong>Art direction</strong> combines the current technique with a style.</li><li><strong>Under the hood</strong> explains the algorithm and its practical limits.</li><li><strong>Ask your AI</strong> gives you a concrete starting prompt for your game.</li></ul><p class="keyboard-help"><kbd>Space</kbd> pause <kbd>←</kbd><kbd>→</kbd> browse <kbd>R</kbd> reset <kbd>/</kbd> search</p><p class="fine-print">Uses WebGL2 shaders, transform feedback, instanced draws, texture atlases, and framebuffer passes. Examples are procedural illustrations, not complete games or physical simulations. FPS measures delivered frames, not isolated GPU execution time. Motion starts paused when your device requests reduced motion.</p><a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext" target="_blank" rel="noopener">Explore the WebGL2 API ↗</a></dialog>
`;

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const canvas = $<HTMLCanvasElement>("#canvas");
const text = (selector: string, content: string) => {
  $(selector).textContent = content;
};
function toast(message: string) {
  const el = $("#toast");
  el.textContent = message;
  el.hidden = false;
  setTimeout(() => {
    el.hidden = true;
  }, 3000);
}
function renderLibrary() {
  const query = $<HTMLInputElement>("#search").value.toLowerCase().trim();
  const groups = categories
    .map((category, index) => {
      const members = effects.filter(
        (e) =>
          e.category === category &&
          `${e.name} ${e.category} ${e.tagline} ${e.technique} ${e.prompt}`.toLowerCase().includes(query),
      );
      if (!members.length) return "";
      return `<section class="effect-group"><h2>${icon(groupIcons[index], 16)}${category}<span>${members.length.toString().padStart(2, "0")}</span></h2>${members.map((e) => `<button class="effect-link ${e.id === effects[selected].id ? "active" : ""}" data-effect="${e.id}" ${e.id === effects[selected].id ? 'aria-current="true"' : ""}><span class="effect-dot"></span>${e.name}${e.id === effects[selected].id ? icon("arrow", 13) : ""}</button>`).join("")}</section>`;
    })
    .join("");
  $("#effect-list").innerHTML =
    groups || '<p class="empty-search">No effects found.<br>Try “water”, “light”, or “pixel”.</p>';
}
function formatControl(index: number, value: number) {
  if (index === 2) return `${(value * 2).toFixed(2)}×`;
  if (index === 0 && [5, 6, 7, 9, 39].includes(selected))
    return Math.round(selected === 39 ? 100 + value * 3900 : 300 + value * 9700).toLocaleString();
  return `${Math.round(value * 100)}%`;
}
function renderControls(effect: Effect) {
  $("#sliders").innerHTML = effect.controls
    .map(
      (label, i) =>
        `<div class="slider-control"><div class="slider-heading"><label for="parameter-${i}">${label}</label><output id="value-${i}" for="parameter-${i}">${formatControl(i, state.params[i])}</output></div><input id="parameter-${i}" type="range" min="0" max="100" step="1" value="${Math.round(state.params[i] * 100)}" data-parameter="${i}" style="--fill: ${state.params[i] * 100}%"><div class="range-labels"><span>${i === 2 ? "STILL" : "LESS"}</span><span>${i === 2 ? "2×" : "MORE"}</span></div></div>`,
    )
    .join("");
}
function renderLesson() {
  const e = effects[selected];
  const scene =
    state.context === 1 ? e.game : state.context === 2 ? e.world : ["Abstract study", e.description];
  if (lessonTab === "learn")
    $("#lesson-content").innerHTML =
      `<div class="lesson-grid"><div class="lesson-main"><span class="eyebrow">WHAT YOU’RE SEEING</span><h2>${state.context === 0 ? "Small changes. A new dimension." : scene[0]}</h2><p>${e.description}</p></div><div class="lesson-context"><span class="eyebrow">${state.context === 0 ? "PUT IT IN A GAME" : "THIS SCENE"}</span><h3>${state.context === 0 ? e.game[0] : scene[0]}</h3><p>${state.context === 0 ? e.game[1] : scene[1]}</p><button class="inline-link" id="context-jump">${state.context === 0 ? "See the game example" : "Try the other context"} ${icon("arrow", 14)}</button></div></div>`;
  if (lessonTab === "technique")
    $("#lesson-content").innerHTML =
      `<div class="lesson-grid"><div class="lesson-main"><span class="eyebrow">THE GPU RECIPE</span><h2>How the illusion works</h2><p>${e.technique}</p><pre><code id="code-snippet"></code></pre><p class="cost-note"><strong>Performance note.</strong> ${e.cost}</p></div><div class="lesson-context"><span class="eyebrow">LEARN THE BUILDING BLOCKS</span><h3>Pixels, passes, and buffers</h3><p>A shader is a small program run in parallel on the GPU. Fragment shaders choose pixel colors; vertex shaders position geometry and can update particle state.</p><a class="inline-link" href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext" target="_blank" rel="noopener">WebGL2 documentation ↗</a><a class="inline-link" href="https://github.com/michaelcrosato/2d-webgpu-demo-2/blob/main/src/shaders.ts" target="_blank" rel="noopener">Read the actual shaders ↗</a><p class="fine-print">The snippet is explanatory pseudocode. The repository contains the complete GLSL implementation.</p></div></div>`;
  if (lessonTab === "technique") text("#code-snippet", e.code);
  if (lessonTab === "prompt")
    $("#lesson-content").innerHTML =
      `<div class="lesson-grid"><div class="lesson-main"><span class="eyebrow">BRING THIS TO YOUR GAME</span><h2>You can ask for this.</h2><blockquote>${e.prompt}</blockquote><button class="copy-prompt" id="copy-prompt">${icon("copy", 15)} Copy starting prompt</button></div><div class="lesson-context"><span class="eyebrow">MAKE THE REQUEST SPECIFIC</span><h3>A useful next sentence</h3><p>“Use my game’s existing renderer. Expose ${e.controls[0].toLowerCase()} and ${e.controls[1].toLowerCase()} as controls, and show me the performance cost before and after.”</p><p class="fine-print">This lab shows the visual technique. Your game will also need its own art, collision, state, and integration.</p></div></div>`;
  $("#lesson-content").setAttribute("aria-labelledby", `lesson-tab-${lessonTab}`);
}
function syncScene() {
  document.querySelectorAll<HTMLButtonElement>("button[data-context]").forEach((b) => {
    const active = Number(b.dataset.context) === state.context;
    b.setAttribute("aria-selected", String(active));
    b.tabIndex = active ? 0 : -1;
  });
  $("#stage").setAttribute("aria-labelledby", `tab-${state.context}`);
  const e = effects[selected];
  text(
    "#scene-name",
    state.context === 1
      ? e.game[0].toUpperCase()
      : state.context === 2
        ? e.world[0].toUpperCase()
        : selected === 0
          ? "SHAPES IN A LIGHT FIELD"
          : `${e.name.toUpperCase()} / STUDY`,
  );
  text(
    "#interaction-hint",
    [11, 22].includes(selected)
      ? "Click or tap to send a wave"
      : selected === 0
        ? "Move your pointer to carry the light"
        : [5, 6, 7, 36, 39].includes(selected)
          ? "Move your pointer to shape the motion"
          : [13, 24, 37].includes(selected)
            ? "Move your pointer across the scene"
            : "Explore the controls. Change the feeling.",
  );
  app.dataset.effect = e.id;
  app.dataset.context = String(state.context);
  renderLesson();
}
function syncPlayback() {
  $("#pause").innerHTML = icon(paused ? "play" : "pause", 16);
  $("#pause").setAttribute("aria-label", paused ? "Play animation" : "Pause animation");
}
function syncCompare() {
  $("#compare").setAttribute("aria-pressed", String(state.compare >= 0));
  $("#compare-labels").hidden = state.compare < 0;
  $("#compare-divider").hidden = state.compare < 0;
  $("#compare-divider").style.left = `${Math.max(0, state.compare) * 100}%`;
}
function writeURL() {
  const params = new URLSearchParams({
    effect: effects[selected].id,
    scene: String(state.context),
    style: String(state.style),
    values: state.params.map((v) => v.toFixed(2)).join(","),
    quality: String(state.quality),
  });
  history.replaceState(null, "", `#${params}`);
}
function selectEffect(index: number, keepSettings = false) {
  selected = (index + effects.length) % effects.length;
  state.effect = selected;
  state.time = 0;
  state.impact = -100;
  if (!keepSettings) state.params = [...effects[selected].defaults];
  const e = effects[selected];
  text("#effect-title", e.name);
  text("#effect-number", String(selected + 1).padStart(2, "0"));
  text("#tagline", e.tagline);
  text("#breadcrumb", e.category.toUpperCase());
  document.title = `${e.name} — 2D / Lab`;
  renderLibrary();
  renderControls(e);
  syncScene();
  renderer?.reset();
  writeURL();
  text("#next-effect", "");
  $("#next-effect").innerHTML = `${effects[(selected + 1) % effects.length].name} ${icon("arrow", 17)}`;
}
function readURL() {
  const params = new URLSearchParams(location.hash.slice(1));
  const e = effects.findIndex((e) => e.id === params.get("effect"));
  state.context = Math.min(2, Math.max(0, Math.round(Number(params.get("scene")) || 0)));
  state.style = Math.min(9, Math.max(0, Math.round(Number(params.get("style")) || 0)));
  state.quality = params.has("quality")
    ? Math.min(2, Math.max(0, Math.round(Number(params.get("quality")) || 0)))
    : 1;
  const values = params.get("values")?.split(",").map(Number);
  if (values?.length === 4 && values.every((n) => Number.isFinite(n) && n >= 0 && n <= 1))
    state.params = values;
  else state.params = [...effects[e < 0 ? 0 : e].defaults];
  $<HTMLSelectElement>("#art-style").value = String(state.style);
  $<HTMLSelectElement>("#quality").value = String(state.quality);
  selectEffect(e < 0 ? 0 : e, true);
}

$("#search").addEventListener("input", renderLibrary);
$("#effect-list").addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-effect]");
  if (!target) return;
  stopTour();
  selectEffect(effects.findIndex((e) => e.id === target.dataset.effect));
  setLibrary(false);
});
$("#sliders").addEventListener("input", (event) => {
  const target = event.target as HTMLInputElement;
  const i = Number(target.dataset.parameter);
  if (!Number.isFinite(i)) return;
  state.params[i] = Number(target.value) / 100;
  target.style.setProperty("--fill", `${target.value}%`);
  text(`#value-${i}`, formatControl(i, state.params[i]));
  writeURL();
});
document.querySelectorAll<HTMLButtonElement>("button[data-context]").forEach((button) => {
  button.addEventListener("click", () => {
    state.context = Number(button.dataset.context);
    syncScene();
    writeURL();
  });
});
document.querySelectorAll<HTMLButtonElement>("button[data-lesson]").forEach((button) => {
  button.addEventListener("click", () => {
    lessonTab = button.dataset.lesson!;
    document.querySelectorAll<HTMLElement>("button[data-lesson]").forEach((b) => {
      b.setAttribute("aria-selected", String(b === button));
      b.tabIndex = b === button ? 0 : -1;
    });
    renderLesson();
  });
});
$("#lesson-content").addEventListener("click", async (event) => {
  const target = (event.target as HTMLElement).closest("button");
  if (target?.id === "context-jump") {
    state.context = state.context === 1 ? 2 : 1;
    syncScene();
    writeURL();
  }
  if (target?.id === "copy-prompt") await copy(effects[selected].prompt, "Game prompt copied");
});
$<HTMLSelectElement>("#art-style").addEventListener("change", (e) => {
  state.style = Number((e.target as HTMLSelectElement).value);
  renderer?.reset();
  writeURL();
});
$<HTMLSelectElement>("#quality").addEventListener("change", (e) => {
  state.quality = Number((e.target as HTMLSelectElement).value);
  writeURL();
});
$("#pause").addEventListener("click", () => {
  paused = !paused;
  syncPlayback();
});
$("#compare").addEventListener("click", () => {
  state.compare = state.compare < 0 ? 0.5 : -1;
  syncCompare();
});
$("#reset").addEventListener("click", () => {
  state.params = [...effects[selected].defaults];
  state.style = 0;
  state.time = 0;
  state.impact = -100;
  state.pointer = [0.55, 0.64];
  state.origin = [0.5, 0.5];
  $<HTMLSelectElement>("#art-style").value = "0";
  renderControls(effects[selected]);
  renderer?.reset();
  writeURL();
  toast("Back to the starting point");
});
$("#previous-effect").addEventListener("click", () => {
  stopTour();
  selectEffect(selected - 1);
});
$("#next-effect").addEventListener("click", () => {
  stopTour();
  selectEffect(selected + 1);
});
const mobileLayout = window.matchMedia("(max-width: 850px)");
function setLibrary(open: boolean) {
  $("#sidebar").classList.toggle("open", open);
  $("#sidebar").inert = mobileLayout.matches && !open;
  $("#menu").setAttribute("aria-expanded", String(open));
  if (mobileLayout.matches) $(open ? "#search" : "#menu").focus();
}
mobileLayout.addEventListener("change", () => setLibrary(false));
$("#sidebar").inert = mobileLayout.matches;
$("#menu").addEventListener("click", () => setLibrary(!$("#sidebar").classList.contains("open")));
$("#close-library").addEventListener("click", () => setLibrary(false));
document.addEventListener("pointerdown", (event) => {
  if (
    mobileLayout.matches &&
    $("#sidebar").classList.contains("open") &&
    !(event.target as HTMLElement).closest("#sidebar, #menu")
  )
    setLibrary(false);
});
$("#help").addEventListener("click", () => $<HTMLDialogElement>("#help-dialog").showModal());
$("#close-help").addEventListener("click", () => $<HTMLDialogElement>("#help-dialog").close());
$("#share").addEventListener("click", async () => {
  writeURL();
  await copy(location.href, "Experiment link copied, including your settings");
});
$("#fullscreen").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $("#stage").requestFullscreen();
  } catch {
    toast("Fullscreen is unavailable in this browser");
  }
});
$("#capture").addEventListener("click", () => {
  if (!renderer) {
    toast("The renderer is not available");
    return;
  }
  renderer.render(state);
  canvas.toBlob((blob) => {
    if (!blob) {
      toast("Could not capture the scene");
      return;
    }
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `2d-lab-${effects[selected].id}-${["abstract", "game", "world"][state.context]}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Scene saved as PNG");
  });
});
async function copy(content: string, success: string) {
  try {
    await navigator.clipboard.writeText(content);
    toast(success);
  } catch {
    const area = document.createElement("textarea");
    area.value = content;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    const done = document.execCommand("copy");
    area.remove();
    toast(done ? success : "Copy unavailable. You can select the text or copy the address bar.");
  }
}
function stopTour() {
  if (tourTimer) clearInterval(tourTimer);
  tourTimer = undefined;
  $("#tour").innerHTML = `${icon("play", 14)} Take a tour`;
  $("#tour").setAttribute("aria-pressed", "false");
}
$("#tour").addEventListener("click", () => {
  if (tourTimer) {
    stopTour();
    return;
  }
  $("#tour").innerHTML = `${icon("pause", 14)} Stop tour`;
  $("#tour").setAttribute("aria-pressed", "true");
  tourTimer = setInterval(() => {
    state.context = (state.context + 1) % 3;
    selectEffect(selected + 1);
  }, 10000);
  toast("Tour started. A new experiment every 10 seconds.");
});
function pointer(event: PointerEvent) {
  const bounds = canvas.getBoundingClientRect();
  state.pointer = [
    Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
    Math.min(1, Math.max(0, 1 - (event.clientY - bounds.top) / bounds.height)),
  ];
}
canvas.addEventListener("pointermove", pointer);
canvas.addEventListener("pointerdown", (event) => {
  pointer(event);
  state.origin = [...state.pointer];
  state.impact = state.time;
  if (paused && [11, 22].includes(selected)) {
    paused = false;
    syncPlayback();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$<HTMLDialogElement>("#help-dialog").open) {
    setLibrary(false);
    return;
  }
  if (
    $<HTMLDialogElement>("#help-dialog").open ||
    (event.target as HTMLElement).matches("input, select, textarea, button, a")
  )
    return;
  if (event.key === " ") {
    event.preventDefault();
    paused = !paused;
    syncPlayback();
  }
  if (event.key === "ArrowRight") {
    stopTour();
    selectEffect(selected + 1);
  }
  if (event.key === "ArrowLeft") {
    stopTour();
    selectEffect(selected - 1);
  }
  if (event.key.toLowerCase() === "r") $("#reset").click();
  if (event.key === "/") {
    event.preventDefault();
    setLibrary(true);
    $("#search").focus();
  }
});
function tabKeyboard(selector: string) {
  document.querySelectorAll<HTMLButtonElement>(selector).forEach((button, index, buttons) => {
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? buttons.length - 1
            : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
      buttons[next].click();
    });
  });
}
tabKeyboard("button[data-context]");
tabKeyboard("button[data-lesson]");
document.querySelectorAll<HTMLButtonElement>('button[data-lesson][aria-selected="false"]').forEach((b) => {
  b.tabIndex = -1;
});
window.addEventListener("hashchange", readURL);
function showError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  text("#render-error", message);
  $("#render-error").hidden = false;
  text("#engine", "GPU UNAVAILABLE");
  app.dataset.ready = "error";
  console.error(error);
}
function initialize() {
  try {
    renderer = new Renderer(canvas);
    $("#render-error").hidden = true;
    text("#engine", "WEBGL2 ACTIVE");
    text("#precision", renderer.hdr ? "RGBA16F / HDR" : "RGBA8 / LDR");
    app.dataset.ready = "true";
  } catch (error) {
    showError(error);
  }
}
canvas.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  renderer = undefined;
  showError(new Error("GPU context lost. Waiting for the browser to restore it…"));
});
canvas.addEventListener("webglcontextrestored", initialize);
readURL();
syncPlayback();
initialize();
function frame(now: number) {
  const elapsed = Math.min((now - previousFrame) / 1000, 0.05);
  previousFrame = now;
  if (renderer && !document.hidden) {
    if (!paused) state.time += elapsed * state.params[2] * 2;
    try {
      renderer.render(state);
      frameCounter++;
      fpsFrames++;
      canvas.dataset.frame = String(frameCounter);
      if (now - fpsStart > 700) {
        text("#fps", String(Math.round((fpsFrames * 1000) / (now - fpsStart))));
        text("#resolution", `${canvas.width} × ${canvas.height}`);
        text("#draw-calls", String(renderer.drawCalls));
        fpsFrames = 0;
        fpsStart = now;
      }
    } catch (error) {
      renderer.dispose();
      renderer = undefined;
      showError(error);
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
