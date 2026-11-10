import type { BackdropManifest } from "@/content";
import type { Progress, Signal, Unsubscribe } from "@/story";
import { CoverFit } from "./CoverFit";
import { FrameLoader, type ImageSource } from "./FrameLoader";
import { FramePosition } from "./FramePosition";
import { FrameSetSelector } from "./FrameSetSelector";
import { FrameStore } from "./FrameStore";
import { FrameUrls } from "./FrameUrls";
import { Inertia } from "./Inertia";
import { LoadOrder } from "./LoadOrder";

const MAX_DEVICE_PIXEL_RATIO = 2;
const MAX_REQUESTS_IN_FLIGHT = 6;
const COARSE_STRIDE = 8;
const INERTIA_RATE = 0.12;
const FOCAL_X = 0.62;
const FOCAL_Y = 0.5;
const FIRST_TICK_MS = 1000 / 60;

type Image = HTMLImageElement;

type ControllerParts = Readonly<{
  canvas: HTMLCanvasElement;
  page: Signal<Progress>;
  manifest: BackdropManifest;
  source: ImageSource<Image>;
  /** Follow the page with inertia, or snap straight to wherever the page is. */
  scrubbing: boolean;
}>;

/**
 * Drives one backdrop canvas: sizing, frame loading, easing and painting.
 *
 * It repaints only when the eased position, the loaded frames or the canvas
 * size changed, and its animation-frame loop stops as soon as it settles.
 */
export class BackdropController {
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly selector: FrameSetSelector;
  private readonly order: LoadOrder;
  private readonly fit = new CoverFit(FOCAL_X, FOCAL_Y);
  private readonly inertia: Inertia;
  private readonly cleanups: Unsubscribe[] = [];

  private store: FrameStore<Image>;
  /** The previous resolution, kept on screen until the new one has a coarse pass. */
  private outgoing: FrameStore<Image> | undefined;
  private loader: FrameLoader<Image> | undefined;
  private setIndex = -1;
  private pixelWidth = 0;
  private pixelHeight = 0;
  private dirty = true;
  private handle: number | undefined;
  private lastTick: number | undefined;
  private disposed = false;

  public constructor(private readonly parts: ControllerParts) {
    const { manifest } = parts;
    this.ctx = parts.canvas.getContext("2d", { alpha: false });
    this.selector = new FrameSetSelector(manifest.sets);
    this.order = new LoadOrder(manifest.frameCount, COARSE_STRIDE);
    this.store = new FrameStore<Image>(manifest.frameCount);
    this.inertia = new Inertia(this.targetPosition(), parts.scrubbing ? INERTIA_RATE : 1);
  }

  public start(): void {
    if (this.ctx === null) {
      return;
    }
    const observer = new ResizeObserver(() => this.resize());
    observer.observe(this.parts.canvas);
    this.cleanups.push(() => observer.disconnect());
    this.cleanups.push(this.parts.page.subscribe(() => this.schedule()));
    this.resize();
  }

  public dispose(): void {
    this.disposed = true;
    this.loader?.dispose();
    if (this.handle !== undefined) {
      cancelAnimationFrame(this.handle);
    }
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups.length = 0;
  }

  private resize(): void {
    const { canvas } = this.parts;
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);
    if (width === 0 || height === 0) {
      return;
    }
    if (width !== this.pixelWidth || height !== this.pixelHeight) {
      // Assigning either dimension clears the canvas, so repaint afterwards.
      canvas.width = width;
      canvas.height = height;
      this.pixelWidth = width;
      this.pixelHeight = height;
    }
    this.adoptSetFor(canvas.clientWidth);
    this.dirty = true;
    this.schedule();
  }

  private adoptSetFor(cssWidth: number): void {
    const index = this.selector.indexFor(cssWidth, window.devicePixelRatio || 1);
    if (index === this.setIndex) {
      return;
    }
    this.loader?.dispose();
    if (this.setIndex !== -1 && this.store.loadedCount() > 0) {
      this.outgoing = this.store;
    }
    this.setIndex = index;
    this.store = new FrameStore<Image>(this.parts.manifest.frameCount);
    const urls = new FrameUrls(this.selector.setAt(index));
    this.loader = new FrameLoader<Image>({
      source: this.parts.source,
      store: this.store,
      urlFor: (frame) => urls.forIndex(frame),
      order: this.order.indices(),
      maxInFlight: MAX_REQUESTS_IN_FLIGHT,
      onLoaded: () => this.frameArrived(),
    });
    this.loader.start();
  }

  private frameArrived(): void {
    if (this.outgoing !== undefined && this.store.loadedCount() >= this.order.coarseCount()) {
      this.outgoing = undefined;
    }
    this.dirty = true;
    this.schedule();
  }

  private schedule(): void {
    if (this.disposed || this.handle !== undefined) {
      return;
    }
    this.handle = requestAnimationFrame((now) => this.tick(now));
  }

  private tick(now: number): void {
    this.handle = undefined;
    const elapsed = this.lastTick === undefined ? FIRST_TICK_MS : now - this.lastTick;
    this.lastTick = now;

    const target = this.targetPosition();
    const moved = this.inertia.advance(target, elapsed);
    if (moved || this.dirty) {
      this.dirty = false;
      this.paint();
    }
    if (this.inertia.isSettledAt(target)) {
      this.lastTick = undefined;
    } else {
      this.schedule();
    }
  }

  private targetPosition(): number {
    const { page, manifest } = this.parts;
    return FramePosition.fromProgress(page.current(), manifest.frameCount).toNumber();
  }

  private paint(): void {
    const { ctx } = this;
    if (ctx === null || this.pixelWidth === 0) {
      return;
    }
    const position = new FramePosition(this.inertia.current(), this.parts.manifest.frameCount);
    const source = this.outgoing ?? this.store;
    const floorIndex = source.nearestIndex(position.floorIndex());
    if (floorIndex === undefined) {
      return;
    }
    ctx.globalAlpha = 1;
    this.drawFrame(ctx, source, floorIndex);

    const mix = position.mix();
    if (mix > 0) {
      const nextIndex = source.nearestIndex(position.nextIndex());
      if (nextIndex !== undefined && nextIndex !== floorIndex) {
        ctx.globalAlpha = mix;
        this.drawFrame(ctx, source, nextIndex);
        ctx.globalAlpha = 1;
      }
    }
  }

  private drawFrame(ctx: CanvasRenderingContext2D, source: FrameStore<Image>, index: number): void {
    const image = source.get(index);
    if (image === undefined) {
      return;
    }
    const rect = this.fit.rectFor(
      { width: image.naturalWidth, height: image.naturalHeight },
      { width: this.pixelWidth, height: this.pixelHeight },
    );
    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  }
}
