/** A zero-padded whole number such as "07" that can be shown part-way to its value. */
export class CountValue {
  private constructor(
    private readonly target: number,
    private readonly width: number,
  ) {}

  /** Undefined when the text is not purely digits, so it should be shown as is. */
  public static parse(text: string): CountValue | undefined {
    return /^\d+$/.test(text) ? new CountValue(Number(text), text.length) : undefined;
  }

  /** The value at `fraction` of the way up, 0 → 1, padded to the final width. */
  public at(fraction: number): string {
    const clamped = Math.min(1, Math.max(0, fraction));
    return String(Math.round(this.target * clamped)).padStart(this.width, "0");
  }
}
