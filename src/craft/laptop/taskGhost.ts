import type { GhostMarks, Point, Size } from "@/laptop";
import { assertNever } from "../layers/assertNever";
import { viewKey, type View } from "./views";

/** Something in the task tracker the cursor can go to. Rows and their status icons are counted from the top of the list. */
export type TaskTarget =
  | Readonly<{ kind: "rest" }>
  | Readonly<{ kind: "row"; slot: number }>
  | Readonly<{ kind: "status"; slot: number }>
  | Readonly<{ kind: "search" }>
  | Readonly<{ kind: "view"; view: View }>;

/** What a click or a key press does to the task tracker. */
export type TaskEffect =
  | Readonly<{ kind: "complete"; slot: number }>
  | Readonly<{ kind: "open-palette" }>
  | Readonly<{ kind: "type"; query: string }>
  | Readonly<{ kind: "close-palette" }>
  | Readonly<{ kind: "select"; view: View }>;

/** Where on a row the cursor rests: over its title, not dead centre. */
const ROW_AIM_X = 150;

/** How the task tracker marks its places for the ghost (`data-ghost`), and where on each the cursor rests. */
export class TaskMarks implements GhostMarks<TaskTarget> {
  public readonly rest: TaskTarget = { kind: "rest" };

  public keyOf(target: TaskTarget): string {
    switch (target.kind) {
      case "rest":
      case "search":
        return target.kind;
      case "row":
      case "status":
        return `${target.kind}-${target.slot}`;
      case "view":
        return `view-${viewKey(target.view)}`;
      default:
        return assertNever(target);
    }
  }

  public aim(target: TaskTarget, size: Size): Point {
    switch (target.kind) {
      case "row":
        return { x: Math.min(ROW_AIM_X, size.width / 2), y: size.height / 2 };
      case "view":
      case "search":
        return { x: Math.min(64, size.width / 2), y: size.height / 2 };
      case "rest":
      case "status":
        return { x: size.width / 2, y: size.height / 2 };
      default:
        return assertNever(target);
    }
  }
}
