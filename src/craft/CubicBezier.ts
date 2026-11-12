export type CurvePoint = Readonly<{ x: number; y: number }>;

const SOLVER_ITERATIONS = 32;

/** A CSS-style easing curve: the unit square from (0,0) to (1,1) shaped by two control points. */
export class CubicBezier {
  public constructor(
    private readonly x1: number,
    private readonly y1: number,
    private readonly x2: number,
    private readonly y2: number,
  ) {
    if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
      throw new Error("Control point x values must stay within 0..1 so time never runs backwards.");
    }
  }

  /** Progress (0..1) reached at `time` (0..1). */
  public at(time: number): number {
    const clamped = Math.min(1, Math.max(0, time));
    let low = 0;
    let high = 1;
    for (let step = 0; step < SOLVER_ITERATIONS; step += 1) {
      const middle = (low + high) / 2;
      if (CubicBezier.axis(middle, this.x1, this.x2) < clamped) {
        low = middle;
      } else {
        high = middle;
      }
    }
    return CubicBezier.axis((low + high) / 2, this.y1, this.y2);
  }

  /** `count` points evenly spaced in time, start and end included. */
  public sample(count: number): readonly CurvePoint[] {
    if (count < 2) {
      throw new Error("Sampling needs at least two points.");
    }
    return Array.from({ length: count }, (_, index) => {
      const x = index / (count - 1);
      return { x, y: this.at(x) };
    });
  }

  private static axis(parameter: number, first: number, second: number): number {
    const inverse = 1 - parameter;
    return 3 * inverse * inverse * parameter * first + 3 * inverse * parameter * parameter * second + parameter ** 3;
  }
}
