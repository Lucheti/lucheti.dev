import { assertNever } from "./assertNever";
import type { Anchor, FlightView } from "./types";

/** Where a flight leaves from or lands on, as the DOM marks it. */
export type AnchorKey = "producer" | "queue-in" | "queue-out" | `service-${number}`;

type Point = Readonly<{ x: number; y: number }>;

/** A callback ref for one element. */
export type ElementRef = (element: HTMLElement | null) => void;

/** How far a flight bows off its straight line, at most, in px. */
const MAX_BOW = 14;

/** Draws messages in the air. */
export interface FramePainter {
  paint(flights: readonly FlightView[]): void;
  clear(): void;
}

/**
 * Moves a fixed pool of dot elements over the stage, one per message in the air, by transform only, so
 * the flights cost no React renders. The anchors are measured each frame, so any layout works.
 */
export class FlightPainter implements FramePainter {
  private stage: HTMLElement | null = null;
  private readonly anchors = new Map<AnchorKey, HTMLElement>();
  private readonly dots: Array<HTMLElement | null>;
  private readonly anchorBinders = new Map<AnchorKey, ElementRef>();
  private readonly dotBinders: readonly ElementRef[];

  public constructor(private readonly poolSize: number) {
    if (!Number.isInteger(poolSize) || poolSize < 1) {
      throw new Error(`The dot pool needs at least one dot: ${poolSize}`);
    }
    this.dots = Array.from({ length: poolSize }, () => null);
    this.dotBinders = this.dots.map((_, index) => (element: HTMLElement | null) => {
      this.dots[index] = element;
    });
  }

  /** One stable callback ref per dot of the pool. */
  public dotBindings(): readonly ElementRef[] {
    return this.dotBinders;
  }

  /** The callback ref for the element the dots are positioned in. */
  public readonly bindStage: ElementRef = (element) => {
    this.stage = element;
  };

  /** A stable callback ref for the element marking an anchor; its centre is the anchor's point. */
  public bindAnchor(key: AnchorKey): ElementRef {
    let binder = this.anchorBinders.get(key);
    if (binder === undefined) {
      binder = (element) => {
        if (element === null) {
          this.anchors.delete(key);
        } else {
          this.anchors.set(key, element);
        }
      };
      this.anchorBinders.set(key, binder);
    }
    return binder;
  }

  /** Puts one dot on each flight (as many as the pool holds) and hides the rest. */
  public paint(flights: readonly FlightView[]): void {
    const origin = this.stage?.getBoundingClientRect();
    if (origin === undefined) {
      return;
    }
    this.dots.forEach((dot, index) => {
      if (dot === null) {
        return;
      }
      const flight = flights[index];
      const from = flight && this.point(flight.from, "from", origin);
      const to = flight && this.point(flight.to, "to", origin);
      if (flight === undefined || from === undefined || to === undefined) {
        dot.style.opacity = "0";
        return;
      }
      const at = this.along(from, to, flight.progress);
      dot.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;
      dot.style.opacity = "1";
      const returning = flight.from.kind === "service" ? "true" : "false";
      if (dot.dataset.returning !== returning) {
        dot.dataset.returning = returning;
      }
    });
  }

  /** Hides every dot. */
  public clear(): void {
    this.dots.forEach((dot) => {
      if (dot !== null) {
        dot.style.opacity = "0";
      }
    });
  }

  private point(anchor: Anchor, end: "from" | "to", origin: DOMRect): Point | undefined {
    const element = this.anchors.get(this.keyOf(anchor, end));
    if (element === undefined) {
      return undefined;
    }
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2 - origin.left, y: rect.top + rect.height / 2 - origin.top };
  }

  private keyOf(anchor: Anchor, end: "from" | "to"): AnchorKey {
    switch (anchor.kind) {
      case "producer":
        return "producer";
      case "queue":
        return end === "from" ? "queue-out" : "queue-in";
      case "service":
        return `service-${anchor.index}`;
      default:
        return assertNever(anchor);
    }
  }

  /** A point on a gently bowed path from `from` to `to`, eased in and out. */
  private along(from: Point, to: Point, progress: number): Point {
    const t = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const bow = Math.sin(Math.PI * t) * Math.min(MAX_BOW, length * 0.12);
    return { x: from.x + dx * t + (dy / length) * bow, y: from.y + dy * t - (dx / length) * bow };
  }
}
