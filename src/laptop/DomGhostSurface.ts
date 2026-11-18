import type { GhostSurface } from "./GhostDirector";
import type { GhostFrame, Point } from "./GhostScript";

/** An element's size, in the screen's pixels. */
export type Size = Readonly<{ width: number; height: number }>;

/** How an app's places are marked in its DOM, and where on each the cursor aims. */
export interface GhostMarks<T> {
  /** Where the cursor goes when its target is missing; the screen marks it too. */
  readonly rest: T;
  /** The `data-ghost` name of the element a target points at. */
  keyOf(target: T): string;
  /** Where on the target's element the cursor rests, from the element's top left. */
  aim(target: T, size: Size): Point;
}

/**
 * The ghost cursor on the real DOM. Targets are elements marked `data-ghost` inside the screen; points are
 * measured from the screen's top left by layout offsets, so a scaled stage does not skew them. The element
 * under the cursor gets `data-ghost-over` (and `data-ghost-press` while the button is down), so it can show
 * its hover state.
 */
export class DomGhostSurface<T> implements GhostSurface<T> {
  private screen: HTMLElement | null = null;
  private cursor: HTMLElement | null = null;
  private over: Element | null = null;

  public constructor(private readonly marks: GhostMarks<T>) {}

  /** Ref callback for the screen, the cursor's frame of reference. */
  public readonly bindScreen = (element: HTMLElement | null): void => {
    this.screen = element;
  };

  /** Ref callback for the cursor. */
  public readonly bindCursor = (element: HTMLElement | null): void => {
    this.cursor = element;
  };

  public locate(target: T): Point {
    const element = this.find(target) ?? this.find(this.marks.rest);
    if (element === null) {
      return { x: 0, y: 0 };
    }
    const { x, y } = this.offsetOf(element);
    const aim = this.marks.aim(target, { width: element.offsetWidth, height: element.offsetHeight });
    return { x: x + aim.x, y: y + aim.y };
  }

  public paint(frame: GhostFrame<T>): void {
    if (this.cursor !== null) {
      this.cursor.style.transform = `translate3d(${frame.point.x}px, ${frame.point.y}px, 0)`;
      this.cursor.dataset.pressed = String(frame.pressed);
    }
    const over = frame.over === null ? null : this.find(frame.over);
    if (over !== this.over) {
      this.over?.removeAttribute("data-ghost-over");
      this.over?.removeAttribute("data-ghost-press");
      over?.setAttribute("data-ghost-over", "");
      this.over = over;
    }
    if (over !== null) {
      over.toggleAttribute("data-ghost-press", frame.pressed);
    }
  }

  public show(visible: boolean): void {
    if (this.cursor !== null) {
      this.cursor.dataset.visible = String(visible);
    }
    if (!visible) {
      this.over?.removeAttribute("data-ghost-over");
      this.over?.removeAttribute("data-ghost-press");
      this.over = null;
    }
  }

  private find(target: T): HTMLElement | null {
    return this.screen?.querySelector<HTMLElement>(`[data-ghost="${this.marks.keyOf(target)}"]`) ?? null;
  }

  /** The element's top left in the screen's pixels, summed up the offset parents. */
  private offsetOf(element: HTMLElement): Point {
    let x = 0;
    let y = 0;
    let node: HTMLElement | null = element;
    while (node !== null && node !== this.screen) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return { x, y };
  }
}
