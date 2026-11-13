import type { BoardGeometry } from "./BoardGeometry";
import type { LifecycleScript } from "./LifecycleScript";
import type { Point, PointSlot, Polyline } from "./Polyline";

/**
 * Where the ticket packet is at any scroll progress: on the dock of the
 * department holding it, or part-way along the route of a handoff.
 * Routes are built once per layout, so placing the packet allocates nothing.
 */
export class PacketTrack {
  private readonly docks: readonly Point[];
  /** The handoff route into each step; undefined when the step stays in its department. */
  private readonly legs: readonly (Polyline | undefined)[];

  public constructor(
    private readonly script: LifecycleScript,
    geometry: BoardGeometry,
  ) {
    const indices = Array.from({ length: script.stepCount() }, (_, index) => index);
    this.docks = indices.map((index) => geometry.dock(script.step(index).department));
    this.legs = indices.map((index) =>
      script.isHandoff(index)
        ? geometry.leg(script.step(index - 1).department, script.step(index).department)
        : undefined,
    );
  }

  /** Writes the packet's centre into `out`; false while there is no packet yet. */
  public place(progress: number, out: PointSlot): boolean {
    const index = this.script.stepAt(progress);
    if (index < 0) {
      return false;
    }
    const leg = this.legs[index];
    const transit = this.script.transitAt(progress);
    if (leg !== undefined && transit < 1) {
      leg.locate(transit, out);
      return true;
    }
    const dock = this.docks[index];
    out.x = dock.x;
    out.y = dock.y;
    return true;
  }
}
