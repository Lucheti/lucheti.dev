import type { Cadence, FrameListener } from "@/laptop";
import type { CommandPalette } from "./CommandPalette";
import type { TaskBoard } from "./TaskBoard";

/** Now and then a new task arrives in the list, on the cadence, unless the palette is open over it. */
export class TaskArrivals implements FrameListener {
  public constructor(
    private readonly cadence: Cadence,
    private readonly board: TaskBoard,
    private readonly palette: CommandPalette,
  ) {}

  public frame(_now: number, stepMs: number): void {
    if (this.cadence.advance(stepMs) > 0 && !this.palette.opened()) {
      this.board.arrive();
    }
  }

  /** Off screen the cadence simply waits; the next task is no nearer when the panel comes back. */
  public halt(): void {}
}
