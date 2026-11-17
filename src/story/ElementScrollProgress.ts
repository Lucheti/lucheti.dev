import { Progress } from "./Progress";
import type { Signal, Unsubscribe } from "./Signal";

/** The two measurements of an element the maths needs. */
export type ElementBox = Readonly<{ top: number; height: number }>;

/** Where the element is, or null while it is not mounted. */
export interface ElementSource {
  box(): ElementBox | null;
}

/** What the progress needs to know about the scrolling surface. */
export interface ScrollSurface {
  viewportHeight(): number;
  /** Fires whenever scroll position or layout size may have changed. */
  onChange(listener: () => void): Unsubscribe;
}

/** The part of `window` the browser surface uses; narrow enough to fake in a test. */
export type WindowLike = Readonly<{
  innerHeight: number;
  addEventListener(type: "scroll" | "resize", listener: () => void, options: { passive: boolean }): void;
  removeEventListener(type: "scroll" | "resize", listener: () => void): void;
}>;

/** A scroll surface backed by a window. The window is only touched once someone subscribes or reads. */
export class WindowSurface implements ScrollSurface {
  public constructor(private readonly target: () => WindowLike) {}

  public viewportHeight(): number {
    return this.target().innerHeight;
  }

  public onChange(listener: () => void): Unsubscribe {
    const target = this.target();
    target.addEventListener("scroll", listener, { passive: true });
    target.addEventListener("resize", listener, { passive: true });
    return () => {
      target.removeEventListener("scroll", listener);
      target.removeEventListener("resize", listener);
    };
  }
}

/** Reads the box of a DOM element that may not be mounted yet; hand `attach` to a React `ref` prop. */
export class MountedElement implements ElementSource {
  private element: Element | null = null;

  /** A callback ref: React calls it with the element on mount and null on unmount. */
  public readonly attach = (element: Element | null): void => {
    this.element = element;
  };

  public box(): ElementBox | null {
    const element = this.element;
    if (element === null) {
      return null;
    }
    const { top, height } = element.getBoundingClientRect();
    return { top, height };
  }
}

/**
 * How far the reader has travelled through a tall element: 0 when its top
 * meets the top of the viewport, 1 when its bottom meets the viewport bottom.
 * That is exactly the span in which a one-viewport sticky frame inside it is
 * pinned, so it needs no rescaling.
 */
export class ElementScrollProgress implements Signal<Progress> {
  private readonly listeners: Set<(value: Progress) => void> = new Set();
  private detach: Unsubscribe | null = null;
  private last: Progress = Progress.START;

  public constructor(
    private readonly element: ElementSource,
    private readonly surface: ScrollSurface,
  ) {}

  /** The pure maths: 0 when the element is not taller than the viewport. */
  public static fraction(top: number, height: number, viewportHeight: number): number {
    const travel = height - viewportHeight;
    if (!(travel > 0)) {
      return 0;
    }
    return Math.min(1, Math.max(0, -top / travel));
  }

  public current(): Progress {
    const box = this.element.box();
    if (box === null) {
      return Progress.START;
    }
    return Progress.of(ElementScrollProgress.fraction(box.top, box.height, this.surface.viewportHeight()));
  }

  public subscribe(listener: (value: Progress) => void): Unsubscribe {
    this.listeners.add(listener);
    if (this.detach === null) {
      this.last = this.current();
      this.detach = this.surface.onChange(() => this.refresh());
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.detach !== null) {
        this.detach();
        this.detach = null;
      }
    };
  }

  private refresh(): void {
    const next = this.current();
    if (next.equals(this.last)) {
      return;
    }
    this.last = next;
    this.listeners.forEach((listener) => listener(next));
  }
}
