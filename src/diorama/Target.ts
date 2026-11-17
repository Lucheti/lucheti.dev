/** How many stars the pegboard's rating has. */
export const STAR_COUNT = 5;

/**
 * Something on the island that does something when clicked: the pegboard's controls drive the screen,
 * the lamp switches, and the duck, the plant and the floating card just react.
 */
export type Target =
  | Readonly<{ kind: "toggle" }>
  | Readonly<{ kind: "button" }>
  | Readonly<{ kind: "slider" }>
  /** One of the rating's stars: clicking it gives the task `count` stars. */
  | Readonly<{ kind: "star"; count: number }>
  | Readonly<{ kind: "checkbox" }>
  | Readonly<{ kind: "lamp" }>
  | Readonly<{ kind: "duck" }>
  | Readonly<{ kind: "plant" }>
  | Readonly<{ kind: "card" }>;

export type TargetKind = Target["kind"];

/** Every target, in the order the keyboard reaches them: the pegboard top to bottom, then the props. */
export function allTargets(): readonly Target[] {
  return [
    { kind: "toggle" },
    { kind: "button" },
    { kind: "slider" },
    ...Array.from({ length: STAR_COUNT }, (_, index): Target => ({ kind: "star", count: index + 1 })),
    { kind: "checkbox" },
    { kind: "lamp" },
    { kind: "duck" },
    { kind: "plant" },
    { kind: "card" },
  ];
}

/** A key that tells targets apart, the stars by their count. */
export function targetKey(target: Target): string {
  return target.kind === "star" ? `star-${target.count}` : target.kind;
}

/** Whether two targets are the same thing. */
export function sameTarget(a: Target | null, b: Target | null): boolean {
  return a !== null && b !== null && targetKey(a) === targetKey(b);
}
