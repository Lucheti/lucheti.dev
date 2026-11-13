/** Timings of one worker row's looping activity, in seconds. */
export type Rhythm = Readonly<{
  /** One fill of the progress bar. */
  fill: number;
  /** Negative, so rows start part-way through their loop instead of in step. */
  delay: number;
  pulse: number;
  spin: number;
  /** The bar's resting fill (0 → 1) when motion is reduced. */
  still: number;
}>;

const GOLDEN = 0.6180339887;
const SILVER = 0.4142135624;
const PLASTIC = 0.7548776662;

const FILL_MIN = 1.6;
const FILL_RANGE = 1.8;
const PULSE_MIN = 1.1;
const PULSE_RANGE = 0.7;
const SPIN_MIN = 0.55;
const SPIN_RANGE = 0.35;
const STILL_MIN = 0.35;
const STILL_RANGE = 0.5;

function fractional(value: number): number {
  return value - Math.floor(value);
}

/**
 * A distinct but stable rhythm for the row at `index` on the board.
 *
 * Low-discrepancy sequences spread neighbouring rows across the range, so
 * parallel workers never tick in unison, and the same row always gets the
 * same rhythm (no randomness, nothing differs between server and client).
 */
export function rhythmFor(index: number): Rhythm {
  const a = fractional(index * GOLDEN + 0.17);
  const b = fractional(index * SILVER + 0.31);
  const c = fractional(index * PLASTIC + 0.53);
  const fill = FILL_MIN + FILL_RANGE * a;
  return {
    fill,
    delay: -fill * b,
    pulse: PULSE_MIN + PULSE_RANGE * c,
    spin: SPIN_MIN + SPIN_RANGE * b,
    still: STILL_MIN + STILL_RANGE * c,
  };
}
