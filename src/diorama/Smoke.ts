/** One cartoon puff: how far it has risen and drifted from the chimney, and its radius, in island units. */
export type Puff = Readonly<{ rise: number; drift: number; size: number }>;

/** Seconds a puff takes to rise and fade. */
const LIFE = 1.4;
/** How high a puff rises in its life. */
const RISE = 1.1;

/**
 * Cartoon smoke, as a pure function of how long it has been puffing (a machine that is down, a rocket on
 * its pad): `count` puffs rise in turn from the source, swelling and shrinking away as they go, drifting a
 * little to the right. The first second is a big "poof": every puff starts out larger and fades to its
 * usual size.
 */
export function puffsAt(seconds: number, count: number): readonly Puff[] {
  if (!Number.isFinite(seconds) || seconds < 0 || count < 1) {
    return [];
  }
  const poof = 1 + 0.9 * Math.exp(-seconds * 1.6);
  return Array.from({ length: count }, (_, index) => {
    const life = (seconds / LIFE + index / count) % 1;
    return {
      rise: life * RISE,
      drift: life * 0.22 + Math.sin((life + index) * 5) * 0.04,
      size: (0.08 + 0.2 * Math.sin(Math.PI * life)) * poof,
    };
  });
}
