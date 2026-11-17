/** The size the grain is drawn at; the browser scales it up, so it stays chunky, cheap and charming. */
const GRAIN_WIDTH = 96;
const GRAIN_HEIGHT = 60;

/** Packs a pixel as little-endian RGBA. */
function pack(red: number, green: number, blue: number): number {
  return ((255 << 24) | (blue << 16) | (green << 8) | red) >>> 0;
}

/**
 * Paints a small field of warm television grain onto a canvas. It is the "noise" the picture resolves
 * out of: painted at a tiny size and faded with CSS opacity, so each frame costs almost nothing.
 */
export class NoiseLayer {
  private readonly context: CanvasRenderingContext2D;
  private readonly image: ImageData;
  private readonly pixels: Uint32Array;
  private state = 0x9e3779b9;

  public constructor(canvas: HTMLCanvasElement) {
    canvas.width = GRAIN_WIDTH;
    canvas.height = GRAIN_HEIGHT;
    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error("A 2d canvas context is required to paint the grain");
    }
    this.context = context;
    this.image = context.createImageData(GRAIN_WIDTH, GRAIN_HEIGHT);
    this.pixels = new Uint32Array(this.image.data.buffer);
  }

  /** Re-rolls the grain and draws it. */
  public paint(): void {
    const pixels = this.pixels;
    let state = this.state;
    for (let i = 0; i < pixels.length; i += 1) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      const roll = state >>> 0;
      const grey = 170 + (roll & 0x3f);
      const flavour = (roll >>> 8) & 0x0f;
      if (flavour === 0) {
        pixels[i] = pack(255, 140 + (roll & 0x1f), 96);
      } else if (flavour === 1) {
        pixels[i] = pack(176, 196, 255);
      } else if (flavour === 2) {
        pixels[i] = pack(40, 40, 44);
      } else {
        pixels[i] = pack(grey, grey, grey - 6);
      }
    }
    this.state = state;
    this.context.putImageData(this.image, 0, 0);
  }
}
