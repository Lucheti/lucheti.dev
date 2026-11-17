import { describe, expect, it } from "vitest";
import {
  ElementScrollProgress,
  WindowSurface,
  type ElementBox,
  type ElementSource,
  type ScrollSurface,
  type WindowLike,
} from "./ElementScrollProgress";

class FakeElement implements ElementSource {
  public constructor(public current: ElementBox | null) {}

  public box(): ElementBox | null {
    return this.current;
  }
}

class FakeWindow implements WindowLike {
  public readonly handlers: Map<string, Set<() => void>> = new Map();
  public passive: boolean[] = [];

  public constructor(public innerHeight: number) {}

  public addEventListener(type: "scroll" | "resize", listener: () => void, options: { passive: boolean }): void {
    this.passive.push(options.passive);
    const set = this.handlers.get(type) ?? new Set();
    set.add(listener);
    this.handlers.set(type, set);
  }

  public removeEventListener(type: "scroll" | "resize", listener: () => void): void {
    this.handlers.get(type)?.delete(listener);
  }

  public fire(type: "scroll" | "resize"): void {
    this.handlers.get(type)?.forEach((listener) => listener());
  }

  public listenerCount(): number {
    return [...this.handlers.values()].reduce((sum, set) => sum + set.size, 0);
  }
}

const SCREEN = 1000;
const HEIGHT = 3200;

function build(): { window: FakeWindow; element: FakeElement; progress: ElementScrollProgress } {
  const window = new FakeWindow(SCREEN);
  const element = new FakeElement({ top: 0, height: HEIGHT });
  const progress = new ElementScrollProgress(element, new WindowSurface(() => window));
  return { window, element, progress };
}

describe("ElementScrollProgress.fraction", () => {
  it("is 0 while the top is below the top of the viewport", () => {
    expect(ElementScrollProgress.fraction(400, HEIGHT, SCREEN)).toBe(0);
    expect(ElementScrollProgress.fraction(0, HEIGHT, SCREEN)).toBe(0);
  });

  it("runs 0 to 1 over the height minus one viewport", () => {
    expect(ElementScrollProgress.fraction(-1100, HEIGHT, SCREEN)).toBe(0.5);
    expect(ElementScrollProgress.fraction(-2200, HEIGHT, SCREEN)).toBe(1);
  });

  it("is 1 once the bottom has passed the bottom of the viewport", () => {
    expect(ElementScrollProgress.fraction(-3000, HEIGHT, SCREEN)).toBe(1);
  });

  it("is 0 for an element that is not taller than the viewport", () => {
    expect(ElementScrollProgress.fraction(-50, SCREEN, SCREEN)).toBe(0);
    expect(ElementScrollProgress.fraction(-50, 400, SCREEN)).toBe(0);
  });
});

describe("ElementScrollProgress", () => {
  it("reads the element's current position", () => {
    const { element, progress } = build();
    element.current = { top: -1100, height: HEIGHT };
    expect(progress.current().toNumber()).toBe(0.5);
  });

  it("rests at the start while the element is not mounted", () => {
    const { element, progress } = build();
    element.current = null;
    expect(progress.current().toNumber()).toBe(0);
  });

  it("notifies on scroll only when the value changes", () => {
    const { window, element, progress } = build();
    const seen: number[] = [];
    progress.subscribe((value) => seen.push(value.toNumber()));
    element.current = { top: -1100, height: HEIGHT };
    window.fire("scroll");
    window.fire("scroll");
    element.current = { top: -1650, height: HEIGHT };
    window.fire("resize");
    expect(seen).toEqual([0.5, 0.75]);
  });

  it("listens passively to scroll and resize, and stops after the last unsubscribe", () => {
    const { window, progress } = build();
    const first = progress.subscribe(() => undefined);
    const second = progress.subscribe(() => undefined);
    expect(window.listenerCount()).toBe(2);
    expect(window.passive).toEqual([true, true]);
    first();
    expect(window.listenerCount()).toBe(2);
    second();
    expect(window.listenerCount()).toBe(0);
  });

  it("does not touch the surface until someone subscribes", () => {
    let touched = false;
    const surface: ScrollSurface = {
      viewportHeight: () => SCREEN,
      onChange: () => {
        touched = true;
        return () => undefined;
      },
    };
    const progress = new ElementScrollProgress(new FakeElement(null), surface);
    progress.current();
    expect(touched).toBe(false);
  });
});
