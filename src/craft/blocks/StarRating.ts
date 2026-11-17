/** A star rating from 1 to `max`: immutable, so a component can hold it as state. */
export class StarRating {
  private readonly max: number;
  private readonly current: number;

  /** `max` is a whole number of stars, at least one; `value` is clamped to 1…max. */
  public constructor(max: number, value: number) {
    if (!Number.isInteger(max) || max < 1) {
      throw new Error(`A rating needs a whole number of stars, at least one: ${max}`);
    }
    this.max = max;
    this.current = StarRating.clamp(value, max);
  }

  public value(): number {
    return this.current;
  }

  /** The stars' values, 1 to max. */
  public stars(): readonly number[] {
    return Array.from({ length: this.max }, (_, index) => index + 1);
  }

  public count(): number {
    return this.max;
  }

  /** The rating set to `value`, clamped. */
  public rate(value: number): StarRating {
    return new StarRating(this.max, value);
  }

  /** The rating moved by `delta` stars, clamped: what the arrow keys do. */
  public step(delta: number): StarRating {
    return this.rate(this.current + delta);
  }

  /** The rating after a key press (arrows step, Home and End jump to the ends), or null for any other key. */
  public press(key: string): StarRating | null {
    switch (key) {
      case "ArrowRight":
      case "ArrowUp":
        return this.step(1);
      case "ArrowLeft":
      case "ArrowDown":
        return this.step(-1);
      case "Home":
        return this.rate(1);
      case "End":
        return this.rate(this.max);
      default:
        return null;
    }
  }

  /** Whether `star` is lit, by the value or by a preview (a star under the pointer). */
  public isLit(star: number, preview: number | null = null): boolean {
    return star <= (preview ?? this.current);
  }

  private static clamp(value: number, max: number): number {
    if (!Number.isFinite(value)) {
      return max;
    }
    return Math.min(Math.max(Math.round(value), 1), max);
  }
}
