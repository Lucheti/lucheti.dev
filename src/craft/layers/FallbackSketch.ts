import { assertNever } from "./assertNever";
import type { CardBlueprint, LayerSpec, Mark } from "./CardBlueprint";
import type { IsometricView, Vec2, Vec3 } from "./IsometricView";
import type { CardPoint, Outline } from "./outline";
import { circle } from "./outline";
import { SHADOW, SURFACES, TONES, WEIGHTS } from "./palette";
import type { StackChoreography } from "./StackChoreography";
import type { StageFit } from "./StageFit";

/** One shape of the flat drawing, in painting order, in stage pixels. */
export type SketchShape =
  /** A filled area; `evenOdd` cuts the inner loops out of the outer one. */
  | Readonly<{ kind: "area"; d: string; color: string; opacity: number; evenOdd: boolean }>
  /** A one-pixel hairline. */
  | Readonly<{ kind: "line"; d: string; color: string; opacity: number }>
  /** A soft shadow, blurred by `blur` pixels. */
  | Readonly<{ kind: "shadow"; d: string; color: string; opacity: number; blur: number }>;

/** How far the shadow sits toward the viewer, and how soft it is, in model units. */
export const SHADOW_SHIFT = 0.14;
export const SHADOW_SOFTNESS = 0.16;

/**
 * The stack drawn flat, as SVG paths, in the exploded still pose: what shows before WebGL is ready, or for
 * good when it never is. It projects the same blueprint with the same camera and fit as the 3D scene, so the
 * swap from one to the other does not move a pixel.
 */
export class FallbackSketch {
  private readonly model: Vec3 = { x: 0, y: 0, z: 0 };
  private readonly flat: Vec2 = { x: 0, y: 0 };
  private readonly pixel: Vec2 = { x: 0, y: 0 };

  public constructor(
    private readonly blueprint: CardBlueprint,
    private readonly choreography: StackChoreography,
    private readonly view: IsometricView,
  ) {}

  /** The shapes of the still frame, for a stage fitted by `fit`, bottom layer first. */
  public draw(fit: StageFit): readonly SketchShape[] {
    const time = this.choreography.stillMs();
    const shapes: SketchShape[] = [];
    this.blueprint.layers().forEach((spec, index) => {
      const base = this.choreography.lift(index, time);
      if (index === 0) {
        shapes.push(this.shadow(base, fit));
      }
      shapes.push(...this.slab(spec, base, fit));
      for (const mark of spec.marks) {
        shapes.push(...this.mark(mark, base + spec.thickness, fit));
      }
    });
    return shapes;
  }

  private shadow(height: number, fit: StageFit): SketchShape {
    const outline = this.blueprint.slab().map((point) => ({ u: point.u + SHADOW_SHIFT, v: point.v + SHADOW_SHIFT }));
    return {
      kind: "shadow",
      d: this.path([outline], height, fit),
      color: SHADOW.color,
      opacity: SHADOW.opacity,
      blur: SHADOW_SOFTNESS * fit.zoom(),
    };
  }

  /** The slab's walls (its silhouette with the top face cut out), then its top face and the hairline round it. */
  private slab(spec: LayerSpec, base: number, fit: StageFit): readonly SketchShape[] {
    const paint = SURFACES[spec.surface];
    const outline = this.blueprint.slab();
    const top = base + spec.thickness;
    const silhouette = FallbackSketch.hull([...this.points(outline, base, fit), ...this.points(outline, top, fit)]);
    const face = this.points(outline, top, fit);
    return [
      { kind: "area", d: `${FallbackSketch.loop(silhouette)}${FallbackSketch.loop(face)}`, color: paint.wallShade, opacity: paint.wallOpacity, evenOdd: true },
      { kind: "area", d: FallbackSketch.loop(face), color: paint.top, opacity: paint.topOpacity, evenOdd: false },
      { kind: "line", d: FallbackSketch.loop(face), color: TONES.ink, opacity: WEIGHTS[paint.edge] },
    ];
  }

  private mark(mark: Mark, height: number, fit: StageFit): readonly SketchShape[] {
    switch (mark.kind) {
      case "fill": {
        const loops = mark.hole === undefined ? [mark.outline] : [mark.outline, mark.hole];
        return [{ kind: "area", d: this.path(loops, height, fit), color: TONES[mark.tone], opacity: 1, evenOdd: true }];
      }
      case "stroke": {
        const points = this.points(mark.path, height, fit);
        const d = mark.closed ? FallbackSketch.loop(points) : FallbackSketch.polyline(points);
        return [{ kind: "line", d, color: TONES[mark.tone], opacity: WEIGHTS[mark.weight] }];
      }
      case "ripple":
        return Array.from({ length: this.choreography.ripples() }, (_, ring) => {
          const time = this.choreography.stillMs();
          const scale = this.choreography.rippleScale(ring, time);
          const radius = mark.radius * scale;
          const half = (mark.width * scale) / 2;
          const loops = [circle(mark.centre, radius + half), circle(mark.centre, radius - half)];
          return {
            kind: "area",
            d: this.path(loops, height, fit),
            color: TONES[mark.tone],
            opacity: this.choreography.rippleOpacity(ring, time),
            evenOdd: true,
          };
        });
      default:
        return assertNever(mark);
    }
  }

  private path(loops: readonly Outline[], height: number, fit: StageFit): string {
    return loops.map((loop) => FallbackSketch.loop(this.points(loop, height, fit))).join("");
  }

  private points(outline: Outline, height: number, fit: StageFit): Vec2[] {
    return outline.map((point) => this.toStage(point, height, fit));
  }

  private toStage(point: CardPoint, height: number, fit: StageFit): Vec2 {
    this.model.x = point.u;
    this.model.y = height;
    this.model.z = point.v;
    this.view.project(this.model, 0, 0, this.flat);
    fit.toStage(this.flat, this.pixel);
    return { x: this.pixel.x, y: this.pixel.y };
  }

  private static loop(points: readonly Vec2[]): string {
    return `${FallbackSketch.polyline(points)}Z`;
  }

  private static polyline(points: readonly Vec2[]): string {
    return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join("");
  }

  /** The convex hull of `points` (Andrew's monotone chain), counter-clockwise on screen. */
  public static hull(points: readonly Vec2[]): Vec2[] {
    const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
    if (sorted.length < 3) {
      return sorted;
    }
    const cross = (o: Vec2, a: Vec2, b: Vec2): number => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower: Vec2[] = [];
    for (const point of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
        lower.pop();
      }
      lower.push(point);
    }
    const upper: Vec2[] = [];
    for (let index = sorted.length - 1; index >= 0; index -= 1) {
      const point = sorted[index];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
        upper.pop();
      }
      upper.push(point);
    }
    return [...lower.slice(0, -1), ...upper.slice(0, -1)];
  }
}
