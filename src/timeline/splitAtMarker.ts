export type MarkerSplit<T> = Readonly<{
  before: readonly T[];
  after: readonly T[];
}>;

/** Separates the stops up to and including `afterStop` from the ones that follow. */
export function splitAtMarker<T>(stops: readonly T[], afterStop: number): MarkerSplit<T> {
  return { before: stops.slice(0, afterStop + 1), after: stops.slice(afterStop + 1) };
}
