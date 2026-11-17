import { assertNever } from "../layers/assertNever";
import type { GhostSurface } from "./GhostDirector";
import type { GhostFrame, GhostTarget, Point } from "./GhostScript";
import { viewKey } from "./views";

/** The `data-ghost` name of the element a target points at. */
export function ghostKey(target: GhostTarget): string {
  switch (target.kind) {
    case "rest":
    case "search":
      return target.kind;
    case "row":
    case "status":
      return `${target.kind}-${target.slot}`;
    case "view":
      return `view-${viewKey(target.view)}`;
    default:
      return assertNever(target);
  }
}

/** Where on a row the cursor rests: over its title, not dead centre. */
const ROW_AIM_X = 150;

/**
 * The ghost cursor on the real DOM. Targets are elements marked `data-ghost` inside the screen; points are
 * measured from the screen's top left by layout offsets, so the laptop's 3D turn does not skew them. The
 * element under the cursor gets `data-ghost-over` (and `data-ghost-press` while the button is down), so it
 * can show its hover state.
 */
export class DomGhostSurface implements GhostSurface {
  private screen: HTMLElement | null = null;
  private cursor: HTMLElement | null = null;
  private over: Element | null = null;

  /** Ref callback for the screen, the cursor's frame of reference. */
  public readonly bindScreen = (element: HTMLElement | null): void => {
    this.screen = element;
  };

  /** Ref callback for the cursor. */
  public readonly bindCursor = (element: HTMLElement | null): void => {
    this.cursor = element;
  };

  public locate(target: GhostTarget): Point {
    const element = this.find(target) ?? this.find({ kind: "rest" });
    if (element === null) {
      return { x: 0, y: 0 };
    }
    const { x, y } = this.offsetOf(element);
    switch (target.kind) {
      case "row":
        return { x: x + Math.min(ROW_AIM_X, element.offsetWidth / 2), y: y + element.offsetHeight / 2 };
      case "view":
      case "search":
        return { x: x + Math.min(64, element.offsetWidth / 2), y: y + element.offsetHeight / 2 };
      case "rest":
      case "status":
        return { x: x + element.offsetWidth / 2, y: y + element.offsetHeight / 2 };
      default:
        return assertNever(target);
    }
  }

  public paint(frame: GhostFrame): void {
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

  private find(target: GhostTarget): HTMLElement | null {
    return this.screen?.querySelector<HTMLElement>(`[data-ghost="${ghostKey(target)}"]`) ?? null;
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
