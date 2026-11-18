import { assertNever } from "./assertNever";

/**
 * Which corner of an app window a panel shows. The window's corner sits in that corner of the stage, and the
 * window runs off the crop on the other side and at the bottom.
 */
export type Corner = Readonly<{ kind: "top-left" }> | Readonly<{ kind: "top-right" }>;

/** Where the window sits on the stage: flush with the corner's side, a hair below the top so its edge shows. */
export function windowPlace(corner: Corner): string {
  switch (corner.kind) {
    case "top-left":
      return "left-0 top-px";
    case "top-right":
      return "right-0 top-px";
    default:
      return assertNever(corner);
  }
}
