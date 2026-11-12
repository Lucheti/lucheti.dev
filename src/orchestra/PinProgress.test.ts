import { describe, expect, it } from "vitest";
import { Emitter, type Signal } from "@/story/Signal";
import { Progress } from "@/story";
import { PinProgress } from "./PinProgress";

function chapterAt(fraction: number): Emitter<Progress> {
  return new Emitter(Progress.of(fraction), (a, b) => a.equals(b));
}

describe("PinProgress", () => {
  it("reaches 1 when the sticky frame lets go", () => {
    const chapter = chapterAt(0);
    const pin = PinProgress.ofStickyFrame(chapter, 320);
    chapter.emit(Progress.of(220 / 320));
    expect(pin.current().toNumber()).toBeCloseTo(1);
    chapter.emit(Progress.of(0.5));
    expect(pin.current().toNumber()).toBeCloseTo(0.5 / (220 / 320));
  });

  it("stays at 1 while the frame scrolls away", () => {
    const pin = PinProgress.ofStickyFrame(chapterAt(0.9), 320);
    expect(pin.current().toNumber()).toBe(1);
  });

  it("only notifies when the rescaled value changes", () => {
    const chapter = chapterAt(0.8);
    const pin = PinProgress.ofStickyFrame(chapter, 320);
    const seen: number[] = [];
    pin.subscribe((value) => seen.push(value.toNumber()));
    chapter.emit(Progress.of(0.9));
    chapter.emit(Progress.of(0.5));
    expect(seen).toHaveLength(1);
  });

  it("stops notifying after unsubscribe", () => {
    const chapter = chapterAt(0);
    const pin: Signal<Progress> = PinProgress.ofStickyFrame(chapter, 320);
    const seen: Progress[] = [];
    const stop = pin.subscribe((value) => seen.push(value));
    stop();
    chapter.emit(Progress.of(0.3));
    expect(seen).toHaveLength(0);
  });

  it("rejects a chapter no taller than the viewport", () => {
    expect(() => PinProgress.ofStickyFrame(chapterAt(0), 100)).toThrow(RangeError);
  });
});
