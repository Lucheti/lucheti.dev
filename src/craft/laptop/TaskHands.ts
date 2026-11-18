import type { GhostHands } from "@/laptop";
import { assertNever } from "../layers/assertNever";
import type { CommandPalette } from "./CommandPalette";
import type { TaskActions } from "./TaskActions";
import type { TaskBoard } from "./TaskBoard";
import type { TaskEffect } from "./taskGhost";

/** Turns the ghost's clicks and key presses into the same actions a visitor's would take in the task tracker. */
export class TaskHands implements GhostHands<TaskEffect> {
  public constructor(
    private readonly board: TaskBoard,
    private readonly palette: CommandPalette,
    private readonly actions: TaskActions,
  ) {}

  /** Applies one click or key press. */
  public apply(effect: TaskEffect): void {
    switch (effect.kind) {
      case "complete": {
        const id = this.board.listed(effect.slot);
        if (id !== null) {
          this.actions.complete(id);
        }
        break;
      }
      case "open-palette":
        this.palette.open("ghost");
        break;
      case "type":
        this.palette.type(effect.query);
        break;
      case "close-palette":
        this.palette.close();
        break;
      case "select":
        this.board.selectView(effect.view);
        break;
      default:
        assertNever(effect);
    }
  }

  /** The ghost is about to start its loop: the app goes back to where the loop expects it. */
  public tidy(): void {
    this.palette.close();
    this.board.selectView({ kind: "all" });
  }

  /** The visitor took over: anything the ghost left half-done (an open palette) is put away. */
  public letGo(): void {
    this.palette.close();
  }
}
