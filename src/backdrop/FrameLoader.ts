import type { FrameStore } from "./FrameStore";

/** Fetches one decoded image; the browser implementation wraps `Image`. */
export interface ImageSource<T> {
  load(url: string): Promise<T>;
}

type FrameLoaderParts<T> = Readonly<{
  source: ImageSource<T>;
  store: FrameStore<T>;
  urlFor: (index: number) => string;
  order: readonly number[];
  maxInFlight: number;
  onLoaded: (index: number) => void;
}>;

/**
 * Works through a load order with a bounded number of requests in flight.
 * A frame that fails to load is skipped: the nearest loaded frame stands in.
 */
export class FrameLoader<T> {
  private next = 0;
  private inFlight = 0;
  private disposed = false;

  public constructor(private readonly parts: FrameLoaderParts<T>) {
    if (!Number.isInteger(parts.maxInFlight) || parts.maxInFlight < 1) {
      throw new RangeError(`maxInFlight must be at least 1, got ${parts.maxInFlight}`);
    }
  }

  public start(): void {
    this.pump();
  }

  public dispose(): void {
    this.disposed = true;
  }

  private pump(): void {
    const { order, maxInFlight } = this.parts;
    while (!this.disposed && this.inFlight < maxInFlight && this.next < order.length) {
      this.request(order[this.next]);
      this.next += 1;
    }
  }

  private request(index: number): void {
    this.inFlight += 1;
    this.parts.source
      .load(this.parts.urlFor(index))
      .then((image) => {
        if (!this.disposed) {
          this.parts.store.put(index, image);
          this.parts.onLoaded(index);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        this.inFlight -= 1;
        this.pump();
      });
  }
}
