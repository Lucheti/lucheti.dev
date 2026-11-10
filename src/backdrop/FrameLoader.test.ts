import { describe, expect, it } from "vitest";
import { FrameLoader, type ImageSource } from "./FrameLoader";
import { FrameStore } from "./FrameStore";
import { LoadOrder } from "./LoadOrder";

type Pending = Readonly<{
  url: string;
  resolve: () => void;
  reject: () => void;
}>;

class FakeSource implements ImageSource<string> {
  public readonly requested: string[] = [];
  public readonly pending: Pending[] = [];
  public peak = 0;

  public load(url: string): Promise<string> {
    this.requested.push(url);
    return new Promise<string>((resolve, reject) => {
      this.pending.push({
        url,
        resolve: () => resolve(url),
        reject: () => reject(new Error("404")),
      });
      this.peak = Math.max(this.peak, this.pending.length);
    });
  }

  /** Settles the oldest request and lets the loader react. */
  public async settleOldest(outcome: "resolve" | "reject" = "resolve"): Promise<void> {
    const request = this.pending.shift();
    if (request === undefined) {
      throw new Error("nothing pending");
    }
    request[outcome]();
    await new Promise((done) => setTimeout(done, 0));
  }
}

function build(frameCount: number, maxInFlight: number) {
  const source = new FakeSource();
  const store = new FrameStore<string>(frameCount);
  const loaded: number[] = [];
  const loader = new FrameLoader<string>({
    source,
    store,
    urlFor: (index) => `f${index}`,
    order: new LoadOrder(frameCount, 8).indices(),
    maxInFlight,
    onLoaded: (index) => loaded.push(index),
  });
  return { source, store, loaded, loader };
}

describe("FrameLoader", () => {
  it("never has more requests in flight than allowed", async () => {
    const { source, loader } = build(40, 6);
    loader.start();
    expect(source.pending).toHaveLength(6);
    for (let i = 0; i < 40; i += 1) {
      await source.settleOldest();
    }
    expect(source.peak).toBe(6);
    expect(source.requested).toHaveLength(40);
  });

  it("requests the first frame, then the coarse pass, then the rest", async () => {
    const { source, loader } = build(20, 1);
    loader.start();
    for (let i = 0; i < 20; i += 1) {
      await source.settleOldest();
    }
    expect(source.requested.slice(0, 4)).toEqual(["f0", "f8", "f16", "f1"]);
  });

  it("stores each frame and reports it", async () => {
    const { source, store, loaded, loader } = build(10, 2);
    loader.start();
    await source.settleOldest();
    expect(store.get(0)).toBe("f0");
    expect(loaded).toEqual([0]);
  });

  it("skips a frame that fails and carries on", async () => {
    const { source, store, loader } = build(10, 1);
    loader.start();
    await source.settleOldest("reject");
    await source.settleOldest();
    expect(store.get(0)).toBeUndefined();
    expect(store.get(8)).toBe("f8");
    expect(store.nearestIndex(0)).toBe(8);
  });

  it("stops requesting and storing once disposed", async () => {
    const { source, store, loader } = build(40, 2);
    loader.start();
    loader.dispose();
    await source.settleOldest();
    await source.settleOldest();
    expect(store.loadedCount()).toBe(0);
    expect(source.requested).toHaveLength(2);
  });

  it("rejects a zero concurrency", () => {
    expect(() => build(10, 0)).toThrow(RangeError);
  });
});
