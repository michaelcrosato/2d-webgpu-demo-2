export function createAtlas(): HTMLCanvasElement {
  const atlas = document.createElement("canvas");
  atlas.width = 128;
  atlas.height = 16;
  const c = atlas.getContext("2d")!;
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  };
  for (let frame = 0; frame < 4; frame++) {
    const x = frame * 16;
    rect(x + 5, 1, 6, 4, "#233d48");
    rect(x + 4, 3, 8, 2, "#4d7785");
    rect(x + 6, 5, 5, 4, "#f3c487");
    rect(x + 10, 6, 1, 1, "#1b2535");
    rect(x + 4, 9, 7, 4, "#cf6c48");
    rect(x + 3, 10, 2, 3, "#f3c487");
    rect(x + 9, 10, 3, 2, "#f3c487");
    rect(x + 5, 12, 5, 2, "#295568");
    rect(x + 4 + (frame % 2), 14, 3, 2, "#172f3e");
    rect(x + 8 - (frame % 2), 14, 3, 2, "#172f3e");
    rect(x + 3, 8, 3, 5, "#a6c77b");
  }
  for (let frame = 4; frame < 8; frame++) {
    const x = frame * 16;
    rect(x, 0, 16, 16, frame === 5 ? "#355943" : "#33434d");
    for (let y = 0; y < 16; y += 4)
      for (let j = 0; j < 16; j += 4) {
        const value = (j * 17 + y * 29 + frame * 7) % 37;
        rect(
          x + j,
          y,
          3,
          3,
          frame === 5
            ? `rgb(${45 + value},${87 + value},${58 + value})`
            : `rgb(${55 + value},${64 + value},${72 + value})`,
        );
      }
    if (frame === 6) {
      rect(x + 1, 1, 14, 1, "#809ba1");
      rect(x + 1, 1, 1, 14, "#809ba1");
    }
    if (frame === 7) {
      rect(x + 5, 5, 6, 6, "#d3b56f");
      rect(x + 7, 3, 2, 10, "#b18d51");
    }
  }
  return atlas;
}
