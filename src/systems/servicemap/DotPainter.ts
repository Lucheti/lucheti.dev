import type { FrameListener } from "@/laptop";
import type { FlightView } from "./FlightPool";
import { travel, type MapLayout, type PointBuffer } from "./MapLayout";

/** Where the dots come from: every slot of the pool, flying or not, in a fixed order. */
export interface FlightSource {
  flights(): readonly FlightView[];
}

/** A callback ref for one dot. */
type DotRef = (element: SVGGElement | null) => void;

/**
 * Draws the dots in the air on the map's SVG, one pooled element per slot, by attribute only, so the flow
 * costs no React renders. Each dot rides its edge's curve; its kind (request, retry, test, drained message)
 * is a data attribute the styles read.
 */
export class DotPainter implements FrameListener {
  private readonly dots: Array<SVGGElement | null>;
  private readonly binders: readonly DotRef[];
  private readonly point: PointBuffer = { x: 0, y: 0 };

  public constructor(
    private readonly source: FlightSource,
    private readonly layout: MapLayout,
  ) {
    const size = source.flights().length;
    this.dots = Array.from({ length: size }, () => null);
    this.binders = this.dots.map((_, index) => (element: SVGGElement | null) => {
      this.dots[index] = element;
    });
  }

  /** One stable callback ref per dot. */
  public bindings(): readonly DotRef[] {
    return this.binders;
  }

  public frame(): void {
    const flights = this.source.flights();
    for (let index = 0; index < this.dots.length; index += 1) {
      const dot = this.dots[index];
      if (dot === null) {
        continue;
      }
      const flight = flights[index];
      const edge = flight.edge();
      if (!flight.flying() || edge === null) {
        this.hide(dot);
        continue;
      }
      const along = travel(flight.progress());
      this.layout.place(edge, flight.backwards() ? 1 - along : along, this.point);
      dot.setAttribute("transform", `translate(${this.point.x.toFixed(1)} ${this.point.y.toFixed(1)})`);
      const kind = flight.kind();
      if (dot.dataset.kind !== kind) {
        dot.dataset.kind = kind;
      }
      if (dot.dataset.flying !== "true") {
        dot.dataset.flying = "true";
      }
    }
  }

  /** Hides every dot. */
  public halt(): void {
    this.dots.forEach((dot) => {
      if (dot !== null) {
        this.hide(dot);
      }
    });
  }

  private hide(dot: SVGGElement): void {
    if (dot.dataset.flying !== "false") {
      dot.dataset.flying = "false";
    }
  }
}
